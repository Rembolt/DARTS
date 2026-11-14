# Acoustic Experience: final idea and MVP

Users find real properties with AI, then tour them inside Matterport while hearing an estimated soundscape.
That soundscape includes outside noise through windows, speakers placed in rooms, and echo shaped by materials and furniture.
They change the space by talking to an agent ("close the window", "insulate this wall") and hear the difference.
Every number is an **estimate** (educated simulation), not a certified acoustic survey. Say so in the UI and pitch.

## 1. Final product

### User flow
1. **Search (agent).** "Which downtown properties would be good for a podcast?"
   The agent filters CoStar data (location, `propertyType`, `buildingClass`, `yearBuilt`).
   It pulls Matterport Property Intelligence (PI) for each candidate and runs a **fast acoustic score**
   (estimated outside noise in dB, RT60 per room, wall isolation). It returns the top 3 with reasons.
2. **Pick and load.** A web app opens the Matterport tour (Embed SDK iframe). The hidden audio world is built from PI geometry.
3. **Tour.** The outdoor scene plays (city, highway, park or rural), coming in through windows. The user hears it change by room and position.
4. **Ask and change.** The agent calls actions on the audio world, and the user hears the result immediately:
   - "How would it sound with the window closed?"
   - "How do I isolate this room?" changes the walls to insulated drywall and reports dB before and after.
   - "If I had a speaker in the kitchen, how loud would it be for the neighbors?" places a source and reports dB at party walls.

### Where it runs
A **web app** (not an extension): Matterport iframe, chat panel, and a toggleable dev panel showing the hidden audio world.
The Embed SDK needs a domain on the key's allow list (check `localhost` works with the CoStar key).

### The tour is free navigation, not continuous walking
- Inside mode: the user moves between **sweeps** (scan points, roughly 1–3 m apart) and looks around freely in 360°.
  Positions are discrete, head rotation is continuous. `Camera.pose` updates during the fly transition, so audio glides between sweeps.
- Dollhouse and Floorplan modes give an overview. Guided tours (`Tour` namespace) are optional, not forced.

### Inputs → what they change
| Input | Source | Effect in the audio world |
|---|---|---|
| Room shape, height, walls, doorways | Matterport PI (`rooms → boundary → edges/openings`, `dimensionEstimates.height`) | Room volume, reverb, paths between rooms |
| Wall thickness | PI `edge.thickness` | Default transmission loss |
| Exterior vs interior walls | Derived: an edge not shared with another room is exterior | Where outside noise enters |
| Windows | **Not in PI** (openings are only `doorway` or `opening`). Assume them on exterior walls, or let the user/agent place them | Main leak for outside noise |
| Floor, wall, ceiling materials | Default from CoStar (`propertyType`, `yearBuilt`, class), editable by the agent | Absorption (echo) and isolation |
| Furniture | Not in data. Preset: empty / sparse / furnished / studio-treated | Extra absorption, so shorter RT60 |
| Outside scene | User pick, later inferred from Vexcel (roads, parks near the parcel) and CoStar location | Level and spectrum of outdoor sources |
| Speakers | Agent/user places them (room, position, WAV, level) | Sources inside |

### Agent action bank (tool calls)
`search_properties(criteria)`, `score_property(id, use_case)`, `load_property(id)`,
`set_outdoor_scene(highway|city|park|rural, level_db)`, `set_opening(id, open|closed)`, `add_window(edge_id, …)`,
`set_material(room|surface, material)`, `set_furniture(room, preset)`, `place_speaker(room, wav, level_db, position?)`,
`remove_speaker(id)`, `measure(room|point) → {dB, RT60}`, `move_user_to(room)`, `compare(before, after)`.
Each call changes the hidden world, so the audio updates live and the agent explains it with numbers.
This tool loop of reasoning, planning and acting is what scores CoStar's "agentic depth" (30%).

### Is it good? (CoStar criteria)
- **Use of data (30%).** It uses all three layers for real work: CoStar for search and material defaults, Matterport PI for geometry and the tour, Vexcel for outdoor noise context.
- **Agentic (30%).** Search, simulate and rank, then live what-ifs that change the world through tools.
- **Usefulness (25%).** Tenants, brokers and buyers can ask "is it quiet?", "is it a podcast room?", "will neighbors hear?".
- **Risks.**
  - Windows and furniture are assumed.
  - Neighbor units aren't scanned, so assume a party wall plus a rating for it.
  - Irregular rooms can return null dimensions.
  - Keep the claims to "estimate".

## 2. How to simulate (simple to complex)

**No single library does all of it on the web.** Babylon is a 3D renderer. Its audio is plain Web Audio panning with no room acoustics, so it is "too simple" for acoustics.
Recommended stack: **Web Audio API + Resonance Audio + a small room graph of our own.**

| Layer | What it does | Tool |
|---|---|---|
| Spatial panning (left/right, distance) | HRTF binaural | Web Audio `PannerNode` / Resonance |
| Echo in the listener's room | Early reflections plus late reverb from box dimensions and per-surface materials (Resonance has presets: brick, concrete, glass, wood, curtains, acoustic tile…) | **Resonance Audio** (one JS lib, room-based) |
| Sound between rooms and from outside | Each wall, door or window is a filter: gain (dB loss) plus low-pass (walls block highs) | Our room graph: `BiquadFilterNode` + `GainNode` chains |
| Numbers for the agent | dB at a point, RT60 per room | Formulas (below), no audio needed, so they also work for the fast search score |

### Formulas (enough for the MVP and the search score)
- **Distance:** `L = L_src − 20·log10(r)` (−6 dB per doubling of distance).
- **Reverb time (Sabine):** `RT60 = 0.161 · V / Σ(Sᵢ·αᵢ)` (V volume m³, S surface m², α absorption from material/furniture).
- **Reverberant level:** `L_rev ≈ L_W + 10·log10(4/A)`, with `A = Σ S·α`.
- **Through a wall/window/door:** `L_room2 ≈ L_room1 − TL + 10·log10(S/A₂)`. Rough TL values:
  open window 0–5, closed single glazing 25, double glazing 35, door 20–30, drywall 33, insulated stud wall 45–50, concrete 50–55 dB.
- **Outdoor levels:** highway about 75 dB, city street about 65, park about 50, rural about 35 (at the facade).

### Can it get as complex as ray or cone tracing? Yes, as a later step
- PI walls are vertical extrusions of a 2D plan (2.5D). That makes **2D ray, beam or cone tracing** (or the image-source method for early reflections) cheap.
  Floor and ceiling get added analytically. Run it in a Web Worker, produce an **impulse response** per listener position (per sweep, so it can be precomputed), then play it through a `ConvolverNode`.
- That gives true wall bounces, flutter echo and shadowing behind corners, and the rays can be drawn in the dev view (great demo visual).
- Full 3D engines like Steam Audio do ray-traced reflections, occlusion and transmission. They target C++/Unity/Unreal with no official web build, so they're too heavy for this weekend.
- Order: Resonance plus room graph (MVP), then image-source/2D ray tracing → impulse responses (v2), then frequency-dependent materials and diffraction (v3).

## 3. MVP (tonight)

**Goal:** one property, the tour and the hidden audio world in sync, one speaker you can walk around, and an LLM that toggles a few things.

1. **Tour.** Embed SDK iframe with one model id. Subscribe to `Camera.pose` and `Room.current`.
2. **Hidden world.** Fetch PI vector data with GraphQL, server-side so the token stays secret.
   Build rooms, walls and doorways in Model coordinates and convert to SDK coordinates (Y-up: swap Y/Z, negate the new Z, or use `Conversion.basisChange`).
3. **Dev view (toggle).** Draw the hidden world: the 2D plan or a Babylon 3D grey box (reuse the prototype renderer here), with the listener, speakers, windows and dB labels.
4. **Audio.**
   - Resonance room for the room the listener is in, sized from PI.
   - One speaker (looping WAV) at a fixed spot. Its sound reaches other rooms through the room-graph filters.
   - One outdoor bed (city WAV) entering through one assumed window.
5. **LLM with a hard-coded action set:** `set_opening(window|door, open/closed)`, `set_material(room, carpet|wood|concrete|insulated)`,
   `set_furniture(room, empty|furnished)`, `place_speaker(room, wav)`, `measure(room)`.
   It replies with an insight plus the dB/RT60 before and after, and the audio changes live.
6. **Assets.** About 5 WAVs (city, highway, park, speech/talk, music) and a material table (α and TL), both in JSON.

**Check first (15 min):**
- CoStar SDK key works on `localhost`.
- The model embeds without OAuth.
- The chosen model has non-null PI rooms, edges and openings, and `App.Feature.RoomBounds`.
- One PI room polygon lines up with `Room.data` bounds.

**Out of MVP:** property search and ranking, Vexcel-inferred noise, ray tracing, neighbor estimate, Bundle SDK 3D objects in the tour.
