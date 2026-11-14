# MVP design: acoustic rendering of a real property

Date: Nov 14, 2026. Deadline: Devpost at 8:00 AM, Sunday Nov 15. Demo is 2 minutes or less.

This replaces every earlier MVP design. The product idea and the final goal are in [acoustic-experience.md](acoustic-experience.md).

## 1. What the MVP is

A web app that shows one real property in the Matterport tour and plays two sounds through a simulation of that property's acoustics.

| # | Feature | Done when |
|---|---|---|
| F1 | Tour | The property loads in the Matterport viewer inside our page and you can move around |
| F2 | Indoor source | A song plays from a fixed point inside. It comes from the right direction in headphones, fades with distance and is dull behind walls |
| F3 | Outdoor source | A highway loop plays from a fixed point outside. Indoors it is quiet, bassy and comes from the side facing it |
| F4 | Room sound | Early echoes and a reverb tail that change from room to room |
| F5 | Blueprint view | A button outside the viewer switches to the simulation's world: the mesh as blueprint lines on a white background, see-through, with the sound paths drawn |

Hardcoded in the MVP: the property, the materials, both sources and their positions, and every simulation setting. All of them live in one config file so later versions can change them from settings or an agent.

### Not in the MVP
- Placing or moving sources, changing materials, opening or closing windows and doors.
- The AI agent, property search, CoStar and Vexcel data.
- Decibel and echo-time numbers on screen.
- Room modes, flutter echo and boundary gain. They were approximations outside the standard pipeline.
- Sound paths drawn inside the tour itself.
- Phones, browsers other than desktop Chrome, hosting on a public address.

## 2. Architecture

```
Browser (Vite + TypeScript)                         Local server (Node + Express)
├── Viewer        Matterport Bundle in an iframe  ←  /bundle/*        the self-hosted viewer files
├── App core      listener pose, config, results  ←  /api/config      SDK key, model id
├── Sim worker    mesh, ray index, tracing        ←  /api/mesh/:id    the OBJ mesh (cached on disk)
├── Audio engine  Web Audio graph                 ←  /audio/*         indoor.mp3, outdoor.mp3
└── Blueprint     our own three.js canvas
                                                     server → Matterport GraphQL (token stays here)
```

### Flow
1. The page gets the config and starts the viewer.
2. The page downloads the mesh and hands it to the worker. The worker builds the ray index, tags materials and returns the blueprint lines.
3. The user presses "Start audio". Both sources start looping.
4. Whenever the listener moves, the app asks the worker for a trace. The worker returns numbers per source.
5. The audio engine applies the numbers. The blueprint view redraws the paths.

Nothing heavy runs in the viewer. Rays run in the worker, and audio runs on the browser's audio thread.

## 3. Stack

| Piece | Choice |
|---|---|
| App | Vite + TypeScript, plain DOM for the two buttons |
| Viewer | Matterport Bundle SDK `26.10.4_webgl-1728-g1cd7e0997a`, served by our server from `/bundle`, embedded in an iframe. Fallback: the hosted Embed viewer, which gives the same camera pose |
| Server | Node + Express |
| Matterport data | GraphQL at `https://api.matterport.com/api/models/graph`, HTTP Basic, read-only |
| Rays | `three` + `three-mesh-bvh` in a Web Worker |
| Audio | Web Audio API only |
| Blueprint | three.js on our own canvas |

Secrets stay in the root `.env`. The server reads them. The SDK key reaches the browser through `/api/config` because the viewer address needs it. The API token never leaves the server.

### Repo layout
```
app/
  public/audio/        indoor.mp3, outdoor.mp3, CREDITS.md
  src/config.ts        every hardcoded value (section 4)
  src/main.ts          wiring, the two buttons
  src/viewer.ts        Bundle connect, camera pose
  src/sim/types.ts     worker messages (section 5.7)
  src/sim/worker.ts    load, trace, reverb job
  src/audio.ts         audio graph
  src/blueprint.ts     blueprint view
server/
  index.ts             Express routes
  cache/               downloaded meshes (git-ignored)
  bundle/              Matterport Bundle (git-ignored)
scripts/fetch-bundle.mjs
```

## 4. Hardcoded values (`app/src/config.ts`)

### 4.1 Property
`modelId: "Ki9YdfpNKum"` (9117 Richland Drive, Houston). The mesh, the viewer and the simulation were all tested on it.
The server only serves this id.

### 4.2 Materials
Three bands: low (under 250 Hz), mid (250 Hz–2 kHz), high (over 2 kHz).
A triangle's material comes from which way it faces: sideways is `wall`, facing up is `floor`, facing down is `ceiling`.

| Material | Absorption low / mid / high | Scattering | Blocking in dB low / mid / high |
|---|---|---|---|
| `wall` | 0.25 / 0.06 / 0.08 | 0.10 | 25 / 35 / 45 |
| `floor` | 0.15 / 0.10 / 0.07 | 0.20 | 35 / 45 / 50 |
| `ceiling` | 0.25 / 0.06 / 0.08 | 0.10 | 25 / 35 / 45 |

- **Absorption:** the share of sound a surface soaks up at each bounce.
- **Scattering:** the chance a bounce goes in a random direction and not like a mirror.
- **Blocking:** how much quieter sound is after passing through the surface.

Two global values sit beside the table:
- `furnishing: 0.15` is added to every surface's absorption, standing in for furniture.
- `transmissionScale: 0.6` shrinks the blocking values so sound behind a wall stays audible in a demo. 1.0 is realistic.

These numbers are starting values from memory, not from a measured table. Replace them with published values when there is time (open question Q4).

### 4.3 Sources
| Source | File | Position | Level |
|---|---|---|---|
| Indoor | `indoor.mp3`: "Dream Sweet in Sea Major" | A fixed point in SDK coordinates. Default: the tour's start position, 0.4 m lower. Override with a point picked in the tour (press P to log the point under the cursor) | Full level, fades with distance |
| Outdoor | `outdoor.mp3`: a highway loop | 25 m from the tour's start position, along a compass angle set in the config, 1.5 m above the floor | 12 dB below the song, no fade with distance |

Audio files:
- The song is copyrighted. A teammate supplies the file locally and it is git-ignored. See open question Q3 before putting it in a public video.
- The highway loop must be CC0 or similarly free. Record where it came from and its licence in `CREDITS.md`.

### 4.4 Simulation settings
| Setting | Value |
|---|---|
| Rays per trace | 2,000 |
| Bounces per ray | 4 |
| Walls a connecting leg may cut through | 2 |
| Scattering floor | 0.3 (scanned surfaces are bumpy) |
| Occlusion rays for the direct sound | 9, to points within 0.3 m of the source |
| Early window | 80 ms after the direct sound |
| Echo slots per source | 12 fixed directions |
| Reverb job | 1,500 rays, up to 60 bounces |
| Speed of sound | 343 m/s |

## 5. The rendering pipeline

This is the hybrid model that research engines and game engines share: direct sound, early reflections and late reverb, each computed with its own method, then played through head-related filters for headphones.

| Stage | Method | Reference |
|---|---|---|
| The three-part split | Direct, early, late | Savioja and Svensson 2015; Wwise Spatial Audio |
| Direct sound through walls | Occlusion rays plus per-band transmission | Steam Audio |
| Early reflections | Rays from the listener ("backward"), with each bounce point connected to the source ("diffuse rain") | Schissler and Manocha 2016; Schröder 2011 |
| Late reverb | Echo time from the traced energy decay | Schroeder integration, as in room acoustics measurement |
| Headphone rendering | Head-related filters (HRTF) | Web Audio `PannerNode` |

One part has no reference: letting a connecting leg cut through walls (step 5.3). It is our extension, so the outdoor sound and a speaker in the next room also arrive as reflections.

Links:
- Savioja and Svensson, "Overview of geometrical room acoustic modeling techniques", JASA 2015: https://acris.aalto.fi/ws/portalfiles/portal/6761044/Overview_of_geometrical.pdf
- Schissler and Manocha, "Interactive Sound Propagation and Rendering for Large Multi-Source Scenes", 2016: https://gamma.cs.unc.edu/MULTISOURCE/paper.pdf
- Schröder, "Physically Based Real-Time Auralization of Interactive Virtual Environments", 2011: https://publications.rwth-aachen.de/record/50580/export/hr?ln=en
- Steam Audio material and source settings: https://valvesoftware.github.io/steam-audio/doc/unity/material.html
- Audiokinetic, "Image Source Approach to Dynamic Early Reflections": https://www.audiokinetic.com/en/blog/image-source-approach-to-dynamic-early-reflections

All energies below are measured against one reference: the direct sound with nothing in the way, which is `1 / D²` for a source at distance `D`.
A gain is the square root of an energy. Everything that depends on a material is computed once per band.

### 5.1 Load (once)
1. **Fetch the mesh.** The server queries `model(id) { assets { meshes { format resolution status url } } }`, takes the entry with `resolution: "50k"` (one OBJ file), downloads it and caches the file on disk.
2. **Parse.** Read the `v` and `f` lines. Split faces with more than three corners into triangles.
3. **Convert coordinates.** The mesh is Z-up and the viewer is Y-up: `(x, y, z) → (x, z, −y)`. Everything after this is in viewer coordinates, in metres.
4. **Build the ray index** with `three-mesh-bvh`. Rays must hit both sides of every triangle.
5. **Tag materials.** Compute each triangle's facing direction. If it is within 45° of level it is `wall`, otherwise `floor` or `ceiling`. Store one material id per triangle.
6. **Extract blueprint lines.** Keep every edge where the two triangles that share it meet at more than 25°, plus every edge with only one triangle.
7. **Reply** with the lines and the mesh bounds.

### 5.2 Direct sound (per source, every trace)
1. Cast 9 rays from the listener: one to the source and 8 to points within 0.3 m of it.
2. On each ray, collect every surface crossed. Crossings closer than 0.5 m to each other are one wall.
3. Each wall multiplies the ray's strength per band by `10 ^ (−blocking × transmissionScale / 10)`.
4. Average the 9 rays. That is `direct`, the strength left per band, between 0 and 1.
5. Record the distance `D` and the direction to the source.

Averaging several rays is what Steam Audio calls volumetric occlusion. It stops the sound from switching abruptly as you pass a door frame.

### 5.3 Early reflections (all sources, every trace)
1. Shoot 2,000 rays from the listener, spread evenly over the sphere. Each starts with strength 1 in every band.
2. Find the first surface the ray hits. If it hits nothing, the ray has left the building; stop it.
3. Multiply the ray's strength per band by `1 − (absorption + furnishing)` for that surface's material.
4. **Connect to each source.** Draw a straight leg from the hit point to the source.
   - Count the walls the leg crosses, as in 5.2. More than 2: skip this source.
   - The leg's `loss` per band is the product of those walls' transmission.
   - Energy of this contribution, per band:
     `(4 / rays) × strength × loss × cos(angle between the leg and the surface's facing direction) / leg length²`, then multiplied by `D²` to measure it against the reference.
   - Arrival time: `(distance travelled so far + leg length) / 343`.
   - Arrival direction: the ray's first direction as it left the listener.
5. **Bounce.** With probability `max(scattering, 0.3)` pick a random direction away from the surface, weighted towards its facing direction. Otherwise reflect like a mirror.
6. Repeat from step 2, up to 4 bounces.

### 5.4 Echo slots (per source, every trace)
Twelve fixed directions in the world (the corners of an icosahedron) are the echo slots. They never change, so an echo keeps its slot as the listener moves.
1. Take every contribution that arrives within 80 ms after the direct sound.
2. Put it in the slot whose direction is closest to its arrival direction.
3. Per slot: energy per band is the sum; delay is the energy-weighted average of `arrival time − D / 343`, at least 1 ms.
4. Sum everything that arrived later than 80 ms into `lateEnergy`.
5. Keep the 40 strongest contributions' full paths for drawing.

### 5.5 Late reverb (when the listener enters a different room)
1. Place a virtual source 1 m from the listener.
2. Run the same tracing as 5.3 with 1,500 rays and up to 60 bounces, with no cutting through walls.
3. Add each contribution's energy to a histogram of 5 ms steps, per band.
4. Sum the histogram backwards from the end to get the decay curve. Find the time it takes to fall from −5 dB to −25 dB and multiply by 3. That is the echo time for that band. Clamp to 0.2–2.5 s.
5. Cache the result under the room's id (`Room.current` from the viewer).

Until the job returns, use the estimate `0.04 × mean free path / −ln(1 − average absorption)` from the last trace, where the mean free path is the average length of the ray segments.
In the emulation this estimate gave 1.15 s where the traced decay gave 0.80 s, so it is only a placeholder.

### 5.6 When to trace
- When the listener's position has moved more than 0.25 m since the last trace.
- Only one trace runs at a time. If the listener moves during a trace, the newest position is traced when it finishes.
- Turning your head never triggers a trace.
- In the viewer's dollhouse and floor-plan modes the camera is outside the building. Keep the listener at its last indoor position.

### 5.7 Worker messages (`app/src/sim/types.ts`)
```ts
type Vec3 = [number, number, number];
type Bands = [number, number, number];            // low, mid, high

type ToWorker =
  | { type: 'load'; obj: ArrayBuffer; config: SimConfig }
  | { type: 'trace'; id: number; listener: Vec3; sources: { id: string; position: Vec3 }[] }
  | { type: 'reverb'; roomId: string; listener: Vec3 };

type FromWorker =
  | { type: 'ready'; lines: Float32Array; boundsMin: Vec3; boundsMax: Vec3; loadMs: number }
  | { type: 'trace'; id: number; listener: Vec3; ms: number; echoTimeEstimate: Bands; sources: SourceResult[]; paths: Float32Array; pathSource: Uint8Array }
  | { type: 'reverb'; roomId: string; echoTime: Bands; ms: number }
  | { type: 'error'; message: string };

type SourceResult = {
  id: string;
  distance: number;        // metres
  direct: Bands;           // strength left after walls, 0..1
  walls: number;           // walls crossed by the centre ray
  slots: { energy: Bands; delay: number }[];   // 12 entries, delay in seconds after the direct sound
  lateEnergy: Bands;
};
```
`paths` holds line segments as pairs of points. `pathSource` says which source each segment belongs to.
Write this file first, so the worker, the audio engine and the blueprint view can be built separately against made-up results.

## 6. Audio engine

One `AudioContext`, created when the user presses "Start audio".

Per source:
```
looping buffer ─┬→ band filters → gain → HRTF panner at the source's position ───────────→ master
                ├→ 12 × ( delay → band filters → gain → HRTF panner 2 m along the slot's direction ) → master
                └→ send gain ───────────────────────────────→ shared reverb (convolver) → master
master → limiter → output
```

| Part | Setting |
|---|---|
| Panners | `panningModel: 'HRTF'`, `rolloffFactor: 0`. We set every level ourselves, so the panner must not fade with distance on top |
| Direct gain | Indoor: `sqrt(direct mid) / max(D, 1)`. Outdoor: `sqrt(direct mid) × outdoor level` |
| Echo gain | `sqrt(slot energy mid)` × the direct gain with nothing in the way. Zero when the slot is empty |
| Band filters | A low-shelf at 250 Hz and a high-shelf at 2 kHz, set from the low and high values compared with mid |
| Echo delay | Created with a 0.2 s maximum. When a slot's delay changes by more than 2 ms, dip that slot's gain to zero over 20 ms, set the delay, and bring the gain back. Changing a delay while it plays bends the pitch |
| Reverb send | `sqrt(lateEnergy mid) × reverbGain`, with `reverbGain` 1.5 as a starting value to tune by ear |
| Reverb | An impulse response made in code: noise in the three bands, each fading by 60 dB over its echo time, scaled to a total energy of 1. Use two convolvers and crossfade over 200 ms when the echo time changes by more than 15% |
| Smoothing | Every gain and filter change uses `setTargetAtTime` with 80 ms |
| Listener | Position and forward/up vectors from the viewer's camera pose, on every pose update |
| Limiter | A `DynamicsCompressorNode` on the master, and a master volume cap |

Count: 13 HRTF panners per source, 26 in total.

What comes out without extra work: comb filtering (the direct sound mixing with its echoes) and stereo smearing (echoes arriving from different sides).

## 7. Blueprint view

A "Blueprint" button outside the viewer toggles a canvas that sits exactly on top of the viewer.

- **Look:** white background at about 85% opacity, so the tour shows faintly through. Mesh edges as thin dark-blue lines. No filled faces.
- **Camera:** the same position, direction and field of view as the tour, updated from the camera pose. It is the same world seen through the walls.
- **Input:** the canvas ignores the mouse (`pointer-events: none`), so you keep moving through the tour underneath.
- **Drawn on top:** the indoor source and the outdoor source as markers, the direct line to each, and the 40 strongest paths from the last trace. One colour per source, brighter for stronger paths.
- **Cost:** it only redraws when the pose or the paths change, and it is not drawn at all while hidden.

Start each drawn path 0.3 m away from the listener. Lines that begin at the camera itself are clipped away.

## 8. Viewer

- Iframe: `/bundle/showcase.html?m=<modelId>&applicationKey=<key>&play=1&qs=1`.
- Connect: `iframe.contentWindow.MP_SDK.connect(iframe.contentWindow)`, then wait for `App.state` to reach `PLAYING`.
- Listener: subscribe to `Camera.pose`. Position is in metres. Rotation is in degrees; convert it to forward and up vectors.
- Room: subscribe to `Room.current` for the reverb cache key.
- Dev helper: pressing P logs `Pointer.intersection` so a source position can be picked and pasted into the config.

## 9. Measured numbers

From an emulation of sections 5.1 to 5.3 on the demo mesh (116,539 triangles), in Node on a team laptop, unoptimised:

| Step | Time |
|---|---|
| Parse the mesh | 111 ms |
| Build the ray index | 59 ms |
| Tag materials | 8 ms |
| Load total, without the download | 182 ms |
| Trace, 3 sources, 4 bounces, 1,500 rays | 160 ms |
| Trace, 2,000 rays | 214 ms |
| Trace, 3,000 rays | 324 ms |
| Reverb job, 1,500 rays, 60 bounces | 706 ms |

Not measured: extracting the blueprint lines, anything in a browser, the audio graph.

## 10. Build steps

Each step leaves something that runs. Check each before moving on.

| # | Step | Check |
|---|---|---|
| 1 | Scaffold the app and the server. Write `config.ts` and `sim/types.ts`. Add `server/cache/`, `server/bundle/` and `app/public/audio/*.mp3` to `.gitignore` | The page opens and `/api/config` answers |
| 2 | `fetch-bundle.mjs` downloads and unpacks the Bundle. The server serves it. The page embeds it and logs the camera pose | You can walk the tour in our page and see the pose change |
| 3 | `/api/mesh/:id` with the disk cache. The worker does 5.1 | The worker reports `ready` with a load time and a line count |
| 4 | The blueprint view, with the camera locked to the tour | Toggle the button: the blueprint walls sit on the tour's walls. This is the alignment check |
| 5 | Audio with no simulation: both sources looping through HRTF panners, the listener following the pose | The song moves around your head as you turn and gets quieter as you walk away |
| 6 | Direct sound (5.2) | Behind a wall the song is quieter and duller. Outdoors is quiet and bassy |
| 7 | Early reflections and echo slots (5.3, 5.4), and their audio | A bare room sounds different from a small furnished one. No clicks or pitch bends when moving |
| 8 | Paths in the blueprint view | Lines run from you to the walls to each source, and change when you move |
| 9 | Late reverb (5.5) and the generated impulse response | A large room rings longer than a small one |
| 10 | Tune levels by ear, record the demo video, submit | A full run-through in headphones |

Steps 3 and 4 can run beside step 5. Steps 6 to 9 need both.

If something has to go, drop step 9 first and use one fixed reverb.

## 11. Risks

| Risk | What we do |
|---|---|
| The blueprint doesn't line up with the tour | Step 4 finds out before any audio depends on it. The emulation found floors and ceilings where expected, so the up-axis is right |
| Blueprint lines are too many or too slow to extract | Raise the 25° angle, or extract them in the worker in pieces |
| Echoes jump as you move | Fixed slots and the gain dip in section 6 |
| The viewer is slow | Nothing we add runs inside it. The blueprint view redraws only on change |
| Crackling from too many audio nodes | Drop to 8 slots per source |
| Bad network on demo day | The mesh is cached on disk after the first load |
| The reverb sounds wrong | Tune `reverbGain`, or fall back to one fixed reverb |

## 12. Open questions

| # | Question | Default |
|---|---|---|
| Q1 | Which compass angle is the highway on for this house? | Pick one by ear in step 6 |
| Q2 | Where should the indoor source sit? | The tour's start position, until someone picks a point with P |
| Q3 | Can the song be used in a public demo video? It is a commercial recording | Use it locally. Swap to a free track for anything published |
| Q4 | Replace the material numbers with published measured values? | Keep the defaults for the demo |
| Q5 | Does the hackathon SDK key work from the server's port? | It worked on `localhost:8090` in testing |

## 13. After the MVP

Settings for materials and sources, glass on windows from the room data, an AI agent that changes those settings, numbers on screen,
outdoor noise placed from Vexcel data, and property search over CoStar data. See [acoustic-experience.md](acoustic-experience.md).
