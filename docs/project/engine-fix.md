# Acoustic engine fix plan

Status: written Nov 15, 2026 on branch `v3-lane-0`, not implemented. One fix is already in (`0fd3a83`, see 3.1).
Everything below is an estimate from a simulation with unvalidated material values, not a measurement.

## 1. Is it a simulation? What actually runs

Yes, the geometry part is a real simulation. The sim worker (`app/src/sim/`) loads the property's scanned mesh
(the Matterport 50k OBJ) and traces rays through it with `three-mesh-bvh`:

| Part | What the worker computes | Settings (`SIM` in `app/src/config.ts`) |
|---|---|---|
| Direct sound | How much each source is blocked by walls between it and you, per band | 9 occlusion rays |
| Early reflections | Rays from your position bounce off the mesh; each hit is connected to each source | 2000 rays, 4 bounces, kept if they arrive in the first 80 ms (`earlyWindow`) |
| Late reverb | 1500 rays, up to 60 bounces each, into an energy histogram per band, then the echo time (T60) | `reverbRays` 1500, `reverbBounces` 60, once per room, cached |

**But the audio throws most of that away.** What you hear (`app/src/audio/`) is:
1. the source, filtered by the direct-sound numbers,
2. 12 delayed, panned copies (the "echo slots"), only for reflections inside the first 80 ms, delays capped at
   0.2 s (`AUDIO.maxDelay`),
3. a reverb tail that is **generated noise** (`makeImpulse` in `audio/impulse.ts`), shaped only by three
   numbers: the echo time in the low, mid and high band.

So the worker knows that in a big room a strong reflection comes back 674 ms later, but the audio never plays it.
The tail is always a smooth hiss that fades, never "the sound, then the sound again". That is why a big room does
not echo the way a real one does, and why rooms with similar echo times sound identical.

## 2. The three listening tests (measured on real scans)

Run: `npx vitest run src/sim/listening.mesh.test.ts` in `app/` (needs the meshes in `server/cache/`; it prints the
numbers to stderr). Mid-band echo time, with the floor-only furniture fix in:

| Test | Where | Echo time (low/mid/high) | Last strong reflection | Late/early energy |
|---|---|---|---|---|
| Big commercial room | `zt8JiL9gipg`, most open spot: walls 11.1 m away on average, ceiling 3.8 m | 0.44 / **1.17** / 1.12 s | 674 ms | 0.14 |
| Small commercial | `UJev7JJKZ6J`, most open spot: walls 2.6 m, ceiling 2.5 m | 0.30 / 0.71 / 0.66 s | 286 ms | 0.71 |
| House | `Ki9YdfpNKum`, most open spot found (ceiling 16.9 m: probably outdoors under trees, see 3.5) | 0.35 / 0.43 / 0.42 s | 150 ms | 0.08 |
| Washroom, today's materials | demo house, 5.8 m² bathroom, drywall + furniture | 0.20 / 0.38 / 0.35 s | 290 ms | 0.17 |
| Washroom, tiled | same room, tile walls and floor, plaster ceiling, no furniture | 0.59 / 0.59 / 0.58 s | 363 ms | 0.71 |

Per-room sweep of the demo house after the furniture fix (mid band): 3.5 m² bathroom 0.39 s, kitchen 0.53 s, living
room 0.56 s, 18.7 m² bedroom 0.63 s. Before the fix every room was 0.20–0.31 s.

What a listener would expect in real rooms (typical, not measured here): big empty commercial hall 1.5–3 s with a
clear slap-back off the far wall; furnished living room 0.4–0.6 s; tiled bathroom 0.8–1.5 s and bright.

## 3. Why it sounds wrong, with evidence

### 3.1 Furniture on every surface (fixed in `0fd3a83`)
Furnishing (0.15) was added to the absorption of every wall, floor and ceiling, tripling it, so every room traced to
0.2–0.3 s. It now goes on the floor only (`FLOOR_FURNISHING_SCALE = 1` in `sim/library.ts`). Not yet changed in the
quick summary (`server/src/quick/acoustics.ts`), so the front-door card echo numbers are now shorter than the tour.

### 3.2 The audio renders three numbers, not the traced sound (the main problem)
See section 1. The traced arrival pattern (when each reflection comes back, how strong, from where) is reduced to
T60 per band, then re-synthesised as noise. Discrete late echoes, flutter between parallel walls and a big room's
slap-back cannot be heard, whatever the ray count. Also: early window 80 ms and `maxDelay` 0.2 s mean a reflection
off a wall 17 m away (100 ms round trip) is already outside the echo slots.

### 3.3 The scan leaks
With almost no absorption (2% on every surface), a 20 m² room still traces to only about 1.0 s; physics says about
4 s. Sound escapes through holes in the open mesh (AGENTS.md: about 51,000 edges have one triangle) and through
unscanned windows. This caps every room near 1 s and flattens the differences between rooms.

### 3.4 One set of materials for the whole house
The tour uses the MVP's three materials (wall, floor, ceiling) everywhere. Per-room materials exist in the worker
(V2 Lane H: `setMaterials` with rooms) and in the scene store (V2 Lane G: `applyDefaults`), but nothing sends them
yet (V2 Lanes I, J, Y not built). The tiled washroom test shows what it changes: 0.38 s → 0.59 s from materials alone.

### 3.5 Trees in the mesh
Most of the mesh is vegetation (`type002`, `type007` groups, AGENTS.md). Rays bounce off trees outside, and an "open
spot" search lands under them. The worker can stop tracing a layer (`setLayers`, V2 Lane H) but nothing calls it.

### 3.6 Bass and clamps
The MVP wall absorbs 0.25 in the low band, and echo time is clamped to 0.2–2.5 s (`AUDIO.echoTimeMin/Max`), so the
low band sits at the 0.2 s floor in most rooms.

### 3.7 Not enough rays for detail (minor today, matters after 3.2)
1500 reverb rays is enough for a T60 number but too noisy to render an arrival pattern directly. More bounces alone
do not help now: with today's absorption the energy is gone long before 60 bounces.

## 4. Fix plan, in order

Each step: files, change, test first, and what "done" sounds like. Do them in this order; 4.1 is what makes a big
room echo.

### 4.1 Render the traced impulse response (fixes 3.2)
- **Worker** (`sim/reverb-job.ts`, `sim/types.ts`): the reverb reply carries the energy histogram it already builds
  (3 bands × 5 ms bins up to 3 s, about 1,800 numbers) plus the 8–16 strongest individual arrivals after 50 ms
  (time, energy per band, direction) instead of only `echoTime`. Keep `echoTime` for the UI and the cache key.
- **Audio** (`audio/impulse.ts`): new `impulseFromHistogram(histogram, taps, sampleRate)`: for each bin and band,
  noise scaled by √energy and band-filtered (the standard way to turn a ray-traced energy histogram into an impulse
  response), plus each strong tap as a sharp click at its exact time, panned by its direction. Keep `makeImpulse` as
  the fallback before the job answers.
- **Engine** (`audio/reverb.ts`, `audio/engine.ts`): swap to the new impulse per room (the once-per-room rule stays).
- **Test first:** a long box (two parallel walls 17 m apart, hard surfaces) must give an impulse with peaks near
  100 ms and 200 ms; a small box must not. Then the listening test: the big commercial room's impulse shows a peak
  near its far-wall round trip.
- **Done when:** in `zt8JiL9gipg`'s big room a clap-like sound audibly comes back.

### 4.2 Longer early window (fixes the rest of 3.2)
- `SIM.earlyWindow` from 0.08 s to the room's mean free path × 3 / 343, between 0.08 and 0.25 s; `AUDIO.maxDelay`
  from 0.2 to 1.0 s (the delay nodes must be created with the new maximum).
- Test: a reflection at 150 ms lands in a slot instead of being dropped.

### 4.3 Close the scan's holes (fixes 3.3)
- Add invisible wall panels along each Property Intelligence room edge, minus its doors and windows, like the
  closable door/window panels V2 Lane H built (`sim/openings.ts`). Windows get glass, not a hole.
- Test: the 2%-absorption leak test in a 20 m² room rises from about 1.0 s to above 2.5 s.

### 4.4 Per-room materials and no trees (fixes 3.4 and 3.5)
- Send `setMaterials` with each room's suggested materials (bathroom: wall tile, tile; bedroom: carpet; and so on,
  from `ROOM_TABLE` in `server/src/shared/materials.ts`) when the tour loads; send `setLayers` so `type002`,
  `type003` and `type007` are not traced. This is V2 Lanes I (suggestions) and J (tour wiring), or a small direct
  wiring if V2 is not built.
- Test: the washroom sweep gives the tiled number (about 0.6 s now, more after 4.3); the house's open-spot search
  no longer lands outdoors.

### 4.5 More rays where it matters (fixes 3.7)
- `reverbRays` 1500 → 6000 (reverb runs once per room and is cached; time it, the budget is about 1 s per room on
  the demo machine); early `bounces` 4 → 6. Expose both in the V2 settings panel (`setQuality` exists).
- Test: the histogram's bin-to-bin noise after 300 ms falls by about half.

### 4.6 Bass, clamps, and the card numbers (fixes 3.6 and the 3.1 leftover)
- Wall low-band absorption 0.25 → 0.12 (drywall around 250 Hz); `echoTimeMin` 0.2 → 0.1 s.
- Quick summary: furniture on the floor only, matching the worker.
- Test: the per-room sweep's low band is no longer pinned at 0.20 s; the card's echo for the demo living room is
  within 15% of the tour's.

## 5. After each step

Re-run `src/sim/listening.mesh.test.ts` and the per-room sweep, update the tables in section 2, and listen in
`?m=zt8JiL9gipg` (big room), `?m=Ki9YdfpNKum` (bathroom to living room).
