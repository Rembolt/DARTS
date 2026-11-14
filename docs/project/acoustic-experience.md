# Acoustic Experience: final idea and MVP

Users find real properties with AI, then tour them inside Matterport while hearing an estimated soundscape.
That soundscape includes outside noise through windows, speakers placed in rooms, and echo shaped by the real geometry.
They change the space by talking to an agent ("close the window", "insulate this wall") and hear the difference.
Every number is an **estimate** (educated simulation), not a certified acoustic survey. Say so in the UI and pitch.

**Status (Nov 14):** the MVP is decided and specified in [mvp-design.md](mvp-design.md), which is the build spec.
Section 1 here is a summary of it. Section 2 lists the tested facts it rests on. Section 3 is the final product, which comes after the MVP.

## 1. MVP (summary)

The full design, with every value and step, is in [mvp-design.md](mvp-design.md). If the two disagree, the design wins.

### What it is
A web app with one property loaded (model `Ki9YdfpNKum`, 9117 Richland Drive, Houston):
- **The tour.** The Matterport viewer embedded in our page.
- **One indoor source.** A song playing from a fixed point inside.
- **One outdoor source.** A highway loop playing from a fixed point 25 m outside.
- **Headphone audio through the property's acoustics.** Direction, fading with distance, dull sound behind walls, early echoes and a reverb tail that change from room to room.
- **A blueprint view.** A button outside the viewer switches to the simulation's world: the mesh as blueprint lines on a see-through white background, with the sound paths drawn.

Everything is hardcoded in one config file: the property, the materials, both sources and the simulation settings.
Later versions change those values from settings or an agent, without changing the simulation.

Not in the MVP: placing or moving sources, changing materials, windows and doors, the AI agent, property search, CoStar and Vexcel data, numbers on screen.

### How the sound is computed
It is the hybrid model that research engines and game engines share. Everything is traced from the listener's position.

| Part of the sound | Method |
|---|---|
| Direct sound | 9 rays from the listener to the source. Each wall crossed removes that material's blocking, per frequency band. Sound passes through walls weakened, never cut off |
| Early reflections | 2,000 rays from the listener, 4 bounces each. Every bounce point is connected to each source, and that connection may cut through up to 2 walls. Each surface absorbs part of the ray per band |
| Echo slots | Contributions in the first 80 ms are grouped into 12 fixed directions per source. Each slot becomes one delayed, positioned echo |
| Late reverb | A deeper trace (60 bounces) when the listener enters a room gives the echo time from the energy decay. A generated reverb plays it |
| Headphones | Head-related filters (HRTF) place the direct sound and every echo |

Materials have absorption, scattering and blocking in three bands (low, mid, high). The MVP assigns one of three defaults by which way a surface faces: wall, floor or ceiling.
The material numbers are unvalidated starting values.

### Stack
| Piece | Choice |
|---|---|
| Web app | Vite + TypeScript |
| Viewer | Matterport **Bundle SDK**, served by our server and embedded in an iframe |
| Server | Node + Express: serves the Bundle and the audio files, downloads and caches the mesh, keeps the GraphQL token off the browser |
| Geometry | The **defurnished OBJ mesh** (116,539 triangles for the demo house), converted once from Z-up to Y-up |
| Simulation | Web Worker + three.js + `three-mesh-bvh` (an index that makes ray hits fast) |
| Audio | Web Audio API only |
| Blueprint view | three.js on our own canvas, on top of the viewer with the same camera |
| Dropped | Babylon, Resonance Audio, drawing paths inside the tour, click-to-place speakers, one source per window |

### Keeping it smooth (the viewer is already slow)
- **Simulation runs off the viewer,** in a Web Worker against our own copy of the mesh.
- **A trace runs only when the listener has moved more than 0.25 m,** one at a time. Head turns are handled by Web Audio.
- **Audio runs on the audio thread,** so sound stays smooth even if graphics stutter.
- **The blueprint view redraws only on change** and isn't drawn while hidden.

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
| Simulation speed | Emulated on the demo mesh in Node, unoptimised. Load: 182 ms (parse 111, ray index 59, material tags 8). Trace with 3 sources and 4 bounces: 160 ms at 1,500 rays, 214 ms at 2,000, 324 ms at 3,000. Deep reverb trace: 706 ms. |
| Reverb estimate | A formula from mean free path gave 1.15 s where the traced decay gave 0.80 s. The MVP uses the traced decay. |

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
