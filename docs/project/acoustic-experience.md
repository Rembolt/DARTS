# Acoustic Experience: final idea and MVP

Users find real properties with AI, then tour them inside Matterport while hearing an estimated soundscape.
That soundscape includes outside noise through windows, speakers placed in rooms, and echo shaped by the real geometry.
They change the space by talking to an agent ("close the window", "insulate this wall") and hear the difference.
Every number is an **estimate** (educated simulation), not a certified acoustic survey. Say so in the UI and pitch.

**Status (Nov 14):** the MVP scope and stack in section 1 are decided. Section 2 lists the tested facts they rest on.
Section 3 is the final product, which comes after the MVP. The design document comes next.

## 1. MVP (decided)

### What it is
A web app with one property loaded:
- **Click to spawn a speaker.** Clicking a surface in the tour places a speaker there, playing a song.
- **Outdoor sound on every window.** One simplified outdoor loop plays from the centre of each window.
- **Detailed headphone audio.** Stereo positioning, muffling through walls, distinct early echoes and a reverb tail.
- **"Wow" graphics.** The sound's bounce paths are drawn as lines, in the tour and in a black-and-white wireframe "X-ray" view.

Not in the MVP: the AI agent, property search, materials and furniture what-ifs, Vexcel outdoor noise (see section 3).

### Technique: trace what you can see and hear distinctly, estimate the rest
Everything is computed from the listener's point of view only, as games do.

| Part of the sound | Method | Cost |
|---|---|---|
| Direct sound | One ray from speaker to listener. Each wall it crosses makes the sound quieter and more muffled. | Trivial |
| Early bounces (the drawn lines) | About 1,000–2,000 rays from the listener, 3–4 bounces each. Keep the 6–12 strongest that reach the speaker. Each becomes a delayed, positioned echo and a drawn line. | A few ms in the worker |
| Reverb tail | Not traced. The same rays estimate the room's size and absorption, which sets the echo time of a generated reverb. | Almost free |
| Outdoor sound | One looping source per window (window positions from PI), through the same pipeline. | Same as a speaker |

Cone tracing was considered and dropped: harder to build than rays, and it looks no better.

### Stack
| Piece | Choice |
|---|---|
| Web app | Vite + TypeScript |
| Viewer | Matterport **Bundle SDK** (self-hosted Showcase). Click-to-spawn uses its pointer hit (`Pointer.intersection`). |
| Backend (small) | Fetches the mesh and PI data with GraphQL so the token stays server-side. Mesh links expire, so fetch at load. |
| Geometry for simulation | The **defurnished OBJ mesh** (about 116,000 triangles for a house), converted once from Model coordinates (Z-up) to SDK coordinates (Y-up) |
| Simulation | Web Worker + three.js + `three-mesh-bvh` (an index that makes ray hits fast) |
| Audio | Plain Web Audio API: `PannerNode` (HRTF) for positioning, `BiquadFilterNode` for muffling, `DelayNode` for bounces, `ConvolverNode` with a generated impulse response for reverb |
| Graphics | three.js lines as one draw call, shown inside the tour (Bundle scene) and in our own X-ray canvas |
| Dropped | Babylon (three.js covers everything) and Resonance Audio (the ray results replace its box-room model) |

### Keeping it smooth (the viewer is already slow)
- **Simulation runs off the viewer.** Rays are traced against our own copy of the mesh in a Web Worker. Showcase is never asked to do it.
- **Recompute only on events:** a speaker spawns, a window or door changes, or the listener arrives at a new scan point. Head turns are handled by Web Audio.
- **Audio runs on the audio thread,** so sound stays smooth even if graphics stutter.
- **All ray lines are one line object,** which is negligible next to what Showcase draws.
- **Fallback:** the X-ray view is our own canvas and stays fast. If Showcase is too slow at demo time, the X-ray view carries the visuals and the tour becomes a side panel.
- **Open lead:** the tested model reported Gaussian splats present. Ask the Matterport engineers whether that layer can be turned off.

### Build order (each step leaves a demoable app)
1. Bundle page with click-to-spawn speaker and positioned headphone audio, no simulation.
2. Mesh in a worker, with direct-sound muffling through walls.
3. Bounce rays, with lines drawn in the X-ray view and then in the tour.
4. Reverb from the ray statistics.
5. Window sources with an outdoor loop.

## 2. Tested facts (Nov 14)

| Fact | Result |
|---|---|
| Mesh by GraphQL | `model { assets { meshes { format resolution status url validUntil } } }` returned two OBJ meshes on 5 of 6 models: a furnished one served in pieces and a single-file defurnished one. `mp:matterpak` was `unlocked` on all 6. |
| Bundle SDK with the hackathon key | Loaded a hackathon model on `localhost:8090` and reached "playing" in 2 s. The key isn't tied to one port. Tested on one model, headless. |
| Mesh in the live scene | One `RoomMesh` per room, about 88,000 points, room numbers in the names. |
| Windows in PI | Opening types across 30 models: `doorway` 519, `window` 153, `opening` 68, `divider` 18. |
| Room heights | Missing for 139 of 372 rooms. Fall back to the mesh or 2.7 m. |
| Geocoordinates | Present on 4 of 6 models. Pick a demo property that has them. |
| Panoramas | Readable. The 4K pack is locked, so use 2K. Links expire. |
| Bundle download | `https://static.matterport.com/showcase-sdk/bundle/<version>/showcase-bundle.zip`; version `26.10.4_webgl-1728-g1cd7e0997a` worked. |
| Examples | https://github.com/matterport/showcase-sdk-examples has a WASD free-walk camera, sensor zones and the intersection inspector. |

Unknowns:
- The defurnished mesh tags triangles with type codes (`type002`, `type003`, `type007`…). Not decoded.
- The Bundle's SDK object has an undocumented `PI` namespace.

How the tour moves: the user jumps between **sweeps** (scan points, roughly 1–3 m apart) and looks around freely in 360°.
`Camera.pose` updates during the jump, so audio can glide. The Bundle examples add an optional free-walk camera.

## 3. Final product (after the MVP)

### User flow
1. **Search (agent).** "Which downtown properties would be good for a podcast?"
   The agent filters CoStar data (location, `propertyType`, `buildingClass`, `yearBuilt`),
   runs a fast acoustic score per candidate (outside noise in dB, RT60 per room, wall isolation) and returns the top 3 with reasons.
2. **Pick and load.** The web app opens the tour with the audio world built.
3. **Tour.** The outdoor scene (city, highway, park or rural) comes in through the windows and changes by room and position.
4. **Ask and change.** The agent calls actions on the audio world, and the user hears the result immediately:
   - "How would it sound with the window closed?"
   - "How do I isolate this room?" changes the walls to insulated drywall and reports dB before and after.
   - "If I had a speaker in the kitchen, how loud would it be for the neighbors?" places a source and reports dB at party walls.

### Inputs → what they change
| Input | Source | Effect in the audio world |
|---|---|---|
| Real surfaces | Defurnished OBJ mesh | Ray bounces, muffling through walls |
| Rooms, walls, doorways, windows | Matterport PI (`rooms → boundary → edges/openings`) | Named things the agent can act on; window sources |
| Wall thickness | PI `edge.thickness` | Default sound blocking |
| Floor, wall, ceiling materials | Default from CoStar (`propertyType`, `yearBuilt`, class), later read from panoramas by a vision model; editable by the agent | Absorption (echo) and isolation |
| Furniture | Preset: empty / sparse / furnished / studio-treated | Extra absorption, so shorter echo |
| Outside scene | User pick, later inferred from Vexcel (roads, parks) placed with the model's geocoordinates | Level and character of outdoor sources per outside wall |
| Speakers | Agent or user places them | Sources inside |

### Agent action bank (tool calls)
`search_properties(criteria)`, `score_property(id, use_case)`, `load_property(id)`,
`set_outdoor_scene(highway|city|park|rural, level_db)`, `set_opening(id, open|closed)`,
`set_material(room|surface, material)`, `set_furniture(room, preset)`, `place_speaker(room, wav, level_db, position?)`,
`remove_speaker(id)`, `measure(room|point) → {dB, RT60}`, `move_user_to(room)`, `compare(before, after)`.
Each call changes the audio world, so the audio updates live and the agent explains it with numbers.

### Numbers the agent reports (formulas)
- **Distance:** `L = L_src − 20·log10(r)` (−6 dB per doubling of distance).
- **Reverb time (Sabine):** `RT60 = 0.161 · V / Σ(Sᵢ·αᵢ)` (V volume m³, S surface m², α absorption).
- **Reverberant level:** `L_rev ≈ L_W + 10·log10(4/A)`, with `A = Σ S·α`.
- **Through a wall/window/door:** `L_room2 ≈ L_room1 − TL + 10·log10(S/A₂)`. Rough TL values:
  open window 0–5, closed single glazing 25, double glazing 35, door 20–30, drywall 33, insulated stud wall 45–50, concrete 50–55 dB.
- **Outdoor levels:** highway about 75 dB, city street about 65, park about 50, rural about 35 (at the outside wall).

### CoStar criteria
- **Use of data (30%).** CoStar for search and material defaults, Matterport for geometry and the tour, Vexcel for outdoor noise.
- **Agentic (30%).** Search, simulate and rank, then live what-ifs through tools. The MVP has no agent, so this is the first thing to add after it.
- **Usefulness (25%).** Tenants, brokers and buyers can ask "is it quiet?", "is it a podcast room?", "will neighbors hear?".
- **Risks.** Furniture and materials are assumed. Neighbor units aren't scanned. Keep the claims to "estimate".
