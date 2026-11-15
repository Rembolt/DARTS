# V2 design: settings, speakers, Jev and closed openings

Date: Nov 14, 2026. Status: design only, nothing built.

V2 comes after the MVP in [mvp-design.md](mvp-design.md) and changes none of it. The MVP's hardcoded values become V2's
defaults. Build V2 only once MVP step 10 (a full run-through in headphones) passes.

This file absorbs [3d_audio_renderer_jev_integration_settings_design.md](3d_audio_renderer_jev_integration_settings_design.md)
(the Jev and permissions draft). Where the two disagree, this file wins; section 6.7 lists the changes.

## 1. What V2 is

| # | Feature | Done when |
|---|---|---|
| V1 | Settings panel | A panel beside the tour edits materials, furnishing, sources, openings, mesh layers and simulation quality. A change is heard within one trace, with no reload |
| V2 | Scene file | "Save scene" downloads the settings as JSON; "Load scene" restores them exactly. The last scene comes back after a page reload |
| V3 | Add speaker | "Add speaker", then a click on a surface in the tour places a new looping source there, playing a sound picked from the built-in library (section 5.3). It can be moved, retuned and removed |
| V4 | Materials | Walls, floors and ceilings can each be set to a material from a library (drywall, wood, tile, concrete, carpet, glass…), for the whole house or one room |
| V5 | Jev | A chat box (text, and voice in Chrome) answers questions about the sound with numbers from the simulation, and changes the scene when allowed |
| V6 | Permissions | Every scene property has a GET and a PUT toggle for Jev. GET decides what Jev can see, PUT decides what Jev can change. Enforced in code |
| V7 | Closed doors and windows | A toggle loads door and window panels built from Matterport data. Each opening can be open or closed, and closing one changes what you hear |
| V8 | Default materials | On first load each room gets suggested wall, floor and ceiling materials, and the house an exterior wall material, from its room type and the listing's facts (section 4.4). Each shows its reason and can be changed |

Every number shown or spoken is an estimate. The UI and Jev say so.

### Not in V2
- Property search over CoStar data, Vexcel outdoor scenes, more than one property.
- Changing mesh resolution (the 500k furnished mesh). Section 6.7 says why.
- Furniture placed as objects. Furnishing stays one absorption value, per room at most.
- Reading materials from panoramas with a vision model.
- Text-to-speech replies from Jev. A spoken reply would play over the scene being judged.

## 2. Architecture

```
Browser                                                     Local server
├── Viewer          Matterport Bundle (unchanged)        ←  /bundle/*
├── Defaults        suggested materials per room          ←  /api/defaults/:id   PI rooms + listing facts + one Claude call (cached)
├── Scene store     SceneState: one source of truth      ←  /api/config
├── Actions         the only code that changes the scene
│     ↑      ↑
│  Settings  Jev client ── tool calls ──────────────────→  /api/jev        relays to the Claude API (key stays here)
│  panel     (chat, voice, permission filter)
├── Sim worker      + material library, openings layer,  ←  /api/mesh/:id
│                     mesh layers, measure                ←  /api/openings/:id   PI vector data (cached on disk)
├── Audio engine    N sources instead of two             ←  /audio/*, uploaded files (blob URLs)
└── Blueprint       + speakers, openings
```

### The rule: one action layer
The settings panel and Jev call the same functions in `app/src/scene/actions.ts`. Nothing else writes to `SceneState`.
An action validates its input, updates the store, and sends the worker and the audio engine what changed.
Jev differs from the panel in one way only: its calls pass through the permission check first (section 6.3).

The action names come from [acoustic-experience.md](acoustic-experience.md) section 3, so the agent's vocabulary is
the one already pitched: `set_material`, `set_furnishing`, `set_opening`, `place_speaker`, `move_speaker`,
`set_speaker`, `remove_speaker`, `move_user_to`, `set_mesh_layer`, `measure`, `compare`.

### Flow of a change
1. The panel or Jev calls an action.
2. The action updates `SceneState` and saves it to `localStorage`.
3. It sends the worker the matching message (section 8) and clears the reverb cache when geometry or materials changed.
4. The app traces the current listener position again, even though the listener has not moved.
5. The audio engine applies the new numbers. The blueprint redraws.

## 3. Scene state and the scene file (V1, V2)

`app/src/config.ts` stays, as the defaults. A new `app/src/scene/state.ts` holds the live state:

```ts
type MaterialName = string;                       // a key of `materials`
type BlendName = `blend:${string}`;               // a key of `blends`, section 4.4
type SurfaceValue = MaterialName | BlendName;
type SurfaceClass = 'wall' | 'floor' | 'ceiling' | 'exteriorWall';

type SceneState = {
  version: 1;
  modelId: string;
  materials: Record<MaterialName, Material>;      // the library, section 4
  blends: Record<BlendName, { parts: { material: MaterialName; weight: number }[] }>;   // section 4.4
  surfaces: Record<SurfaceClass, SurfaceValue>;   // whole house
  roomSurfaces: Record<string, Partial<Record<Exclude<SurfaceClass, 'exteriorWall'>, SurfaceValue>>>;   // per room id, 4.2
  defaults: MaterialDefaults | null;              // last suggestion with reasons and source, section 4.4
  furnishing: number;                             // MVP value 0.15
  roomFurnishing: Record<string, number>;
  sources: SourceSpec[];                          // section 5
  openings: { loaded: boolean; closed: Record<string, boolean> };                 // section 7
  meshLayers: Record<string, { traced: boolean; shown: boolean }>;                // section 7.3
  quality: 'fast' | 'normal' | 'high';            // section 3.2
  permissions: Permissions;                       // section 6.2
};
```

### 3.1 The scene file
The settings live in one JSON file that can be saved, loaded and shared. (The "on file" in the feature list means
the sound files of section 5.3, not this.)
- **Save scene** downloads `scene-<modelId>-<date>.json`, the `SceneState` as is.
- **Load scene** reads one. A file whose `modelId` differs from the loaded property is refused with a message.
  Unknown keys are dropped; missing keys take the defaults.
- **Autosave:** every action writes the state to `localStorage` under `scene:<modelId>`. On start the app loads it if present.
  Wrap every read and write in try/catch: private windows can block it.
- **Reset** returns to the `config.ts` defaults, with the suggested materials of section 4.4 applied (fetched again if
  `defaults` is empty).
- Uploaded audio files are not in the JSON (section 5.3). A loaded scene whose speaker used an upload falls back to
  the stand-in loop and says so.

### 3.2 Simulation quality
One control in place of the raw numbers in MVP section 4.4.

| Preset | Rays per trace | Bounces | Reverb rays |
|---|---|---|---|
| `fast` | 1,000 | 3 | 800 |
| `normal` (MVP) | 2,000 | 4 | 1,500 |
| `high` | 3,000 | 5 | 3,000 |

Trace time grows with rays and sources (MVP section 9: 214 ms at 2,000 rays, 324 ms at 3,000). `high` with four
sources may pass half a second per trace; that is fine because traces only run on movement or change.

## 4. Materials (V4)

### 4.1 The library
Today `SimConfig.materials` has exactly three keys and `tagMaterials` assigns them by facing.
V2 keeps the facing rule for picking a triangle's *surface class* (wall, floor, ceiling) and adds a library of
materials that a class can be set to.

| Material | Absorption low / mid / high | Scattering | Blocking dB low / mid / high |
|---|---|---|---|
| `drywall` (MVP `wall`, `ceiling`) | 0.25 / 0.06 / 0.08 | 0.10 | 25 / 35 / 45 |
| `insulated_drywall` | 0.30 / 0.08 / 0.08 | 0.10 | 35 / 47 / 55 |
| `wood_floor` (MVP `floor`) | 0.15 / 0.10 / 0.07 | 0.20 | 35 / 45 / 50 |
| `tile` | 0.01 / 0.01 / 0.02 | 0.05 | 40 / 50 / 55 |
| `concrete` | 0.01 / 0.02 / 0.03 | 0.05 | 45 / 55 / 60 |
| `carpet` | 0.08 / 0.35 / 0.60 | 0.30 | 35 / 45 / 50 |
| `wood_panel` | 0.30 / 0.10 / 0.08 | 0.15 | 25 / 30 / 35 |
| `acoustic_panel` | 0.40 / 0.85 / 0.90 | 0.40 | 25 / 35 / 45 |
| `glass` (closed windows, section 7) | 0.30 / 0.04 / 0.02 | 0.05 | 18 / 25 / 28 |
| `door` (closed doors, section 7) | 0.15 / 0.08 / 0.08 | 0.10 | 18 / 25 / 30 |
| `vinyl` (new, for 4.4) | 0.02 / 0.03 / 0.03 | 0.05 | 35 / 45 / 50 |
| `wall_tile` (new, for 4.4) | 0.01 / 0.01 / 0.02 | 0.05 | 28 / 38 / 48 |
| `plaster` (new, for 4.4) | 0.02 / 0.03 / 0.04 | 0.05 | 35 / 45 / 50 |
| `brick_veneer` (new, exterior walls only, 4.4) | 0.25 / 0.06 / 0.08 | 0.10 | 40 / 55 / 60 |
| `siding_wall` (new, exterior walls only, 4.4) | 0.25 / 0.06 / 0.08 | 0.10 | 30 / 42 / 50 |

These are rough values, like the MVP's: transmission loss from the table in acoustic-experience.md section 3,
absorption from memory of standard tables. They are not measured. Replace them with a published table when there is time.
The rows marked new are rougher still. `brick_veneer` and `siding_wall` are whole exterior wall builds: the inside face
is drywall (hence drywall's absorption), the outside layer sets the blocking.

**Clamp:** absorption plus furnishing can now pass 1 (`acoustic_panel` high band 0.90 + furnishing 0.15).
The tracer today clamps the strength at 0, which makes such a surface a perfect absorber. The worker clamps
`absorption + furnishing` to at most 0.99 per band instead.

The worker gets the library as an array in a fixed order, and per-triangle material ids stay a `Uint8Array`
(up to 255 materials). The blueprint's solid-mode colours follow the surface class, not the material.

### 4.2 Per room
Whole-house assignment (`surfaces`) works on the mesh as it is. Per-room assignment (`roomSurfaces`) needs each
triangle's room. Two ways, in order of preference:
1. **PI room polygons.** Each room's boundary from the vector data (section 7.1), raised to its floor height, tags the
   triangles whose centre falls inside. It shares the alignment check of section 7.2, so per-room materials wait for it.
2. **Fallback:** the room under the listener (`Room.current`) plus everything within the walls the occlusion rays find.
   Not proposed for building; listed in case the PI frame cannot be aligned.

Furnishing per room uses the same triangle-to-room map.

### 4.3 In the worker
The worker keeps the surface class per triangle from load (after `buildRayIndex`, which reorders `mesh.indices`).
`setMaterials` maps class (and room) to a material id per triangle. Measured cost of tagging: 17 ms, so it can run on
every change. Materials never rebuild the ray index.

### 4.4 Default materials per room (V8)
When a property loads with no saved scene, every room gets a suggested wall, floor and ceiling material, and the house
gets an exterior wall material. The suggestion comes from what the room is (its PI room type) and what the listing says
about the building. Each suggestion carries a one-line reason. The user and Jev change them afterwards as in 4.1–4.3.

#### Rule: the LLM picks materials, code computes the numbers
The LLM never writes an absorption or blocking value. It picks up to 3 materials from the library (4.1) per surface,
with a weight each: "kitchen floor: `tile` 1.0", "living room floor: `wood_floor` 0.7, `carpet` 0.3 (a rug)".
Code turns the mix into numbers. Every value then traces back to one row of the library table, and the output can be checked.

A mix is called a **blend**. Code computes its values per band, with weights normalised to sum to 1:
- **Absorption and scattering:** the weighted mean, `Σ w·α`. This is the area-weighted average Sabine uses.
- **Blocking:** averaged as energy, not as dB: `TL = −10·log10 Σ w·10^(−TL_i/10)`. A wall that is 40% thin glass
  and 60% brick lets through mostly what the glass lets through; a dB average would hide that.
- Parts under 0.1 are dropped, then the weights are normalised again.

#### Inputs
All are joined and cached on the server. For the demo property they are:

| Input | Where from | Demo property (`Ki9YdfpNKum`) |
|---|---|---|
| Rooms: id, `label`, `classifications` (label, confidence), `keywords`, floor, area, height | PI GraphQL: the `getRoomNames` and dimensions queries in [10-property-intelligence-api.md](../matterport/notes/10-property-intelligence-api.md) | The tour's rooms; height missing on about a third |
| Building facts: the lines under **Home Design**, **Flooring** and **Interior Spaces** | `costar-kit/data/residential-listing-features.jsonl`, record whose `id` is the `ListingId` of the model's row in `residential-listings.csv` | "Built in 1952", "Brick Exterior Construction", "Slab Foundation", "Tile Flooring", "Combination Kitchen and Dining Room" |
| `hasHardwoodFloors`, `yearBuilt`, `architecturalStyle` | `costar-kit/data/residential-listings.jsonl`, same id | |
| Photo captions and detected features: `media[].description` with `media[].computerVisionKeywords` | Same record. A caption that names a room ("Kitchen") is matched to the PI room with that label | e.g. "Tile Floor" on a kitchen photo, if present |
| Commercial properties: `buildingConstructionMaterial` (masonry, steel, wood frame…) | `costar-kit/data/commercial-property.jsonl` | Not used by the demo |

Building facts are mostly for the whole house: "Tile Flooring" does not say which rooms. Deciding where it applies
is the LLM's job, with the room-type table as the starting point.

The jsonl files are hundreds of MB. They are never read at request time: a one-off script,
`npm run extract-listing -- <modelId>`, streams them and writes `server/cache/listing-<modelId>.json` with the lines above.
`server/cache/` is git-ignored, which keeps the licensed CoStar data out of the repo.

#### The room-type table (hardcoded)
`app/src/scene/roomDefaults.ts` holds one row per PI room type. It is both the LLM's starting point and the
fallback when there is no LLM. Values are blends of library materials; furnishing levels are those of `set_furnishing`.

| Room type | Floor | Walls | Ceiling | Furnishing |
|---|---|---|---|---|
| Kitchen | `tile` | `drywall` | `drywall` | sparse |
| Dining room | `wood_floor` | `drywall` | `drywall` | sparse |
| Living room, family room | `wood_floor` 0.7, `carpet` 0.3 | `drywall` | `drywall` | furnished |
| Bedroom | `carpet` | `drywall` | `drywall` | furnished |
| Bathroom | `tile` | `drywall` 0.6, `wall_tile` 0.4 | `drywall` | empty |
| Laundry, utility room | `vinyl` | `drywall` | `drywall` | empty |
| Hallway, entry, stairs | `wood_floor` | `drywall` | `drywall` | empty |
| Office | `carpet` | `drywall` | `drywall` | furnished |
| Closet | `carpet` | `drywall` | `drywall` | studio (clothes absorb) |
| Garage | `concrete` | `drywall` | `drywall` | empty |
| Other or unknown | `wood_floor` | `drywall` | `drywall` | furnished (the MVP values) |
| **House exterior walls** | — | `siding_wall` | — | — |

- **Rooms with several types** (PI allows Kitchen + Dining Room): blend the matching rows, weighted by each
  classification's `confidence`.
- A room's `label` (set by the owner) wins over `classifications` when it names a type in the table.
- These are typical finishes for US homes, not facts about this house. The panel says "suggested".

#### The LLM step
One call per property, on the server, cached.
1. `GET /api/defaults/:id` returns `server/cache/defaults-<id>.json` if it exists. `?refresh=1` recomputes it.
2. Otherwise the server builds the request: the library (names, one-line descriptions and the values of 4.1),
   the room-type table, the building facts, and the room list with each room's table row already filled in.
3. It calls Claude with the same client and key as `/api/jev` (6.1), with one tool, `propose_defaults`, `strict: true`.
   Its schema: per room id, `floor`, `wall` and `ceiling` as lists of `{ material, weight }` (at most 3), where `material` is
   an enum of the library keys; `furnishing` as an enum of the four levels; `reason` (one sentence that cites its evidence).
   Once for the house: `exteriorWall` and its `reason`.
4. The instruction: start from each room's table row and change it only where a building fact or a photo supports it.
   Name the fact in `reason`. Example: "Tile floor: the listing says Tile Flooring and nothing says carpet."
   For the demo house, "Brick Exterior Construction" should turn the exterior wall into `brick_veneer`.
5. Code checks the answer: unknown room ids are dropped, weights are normalised, parts under 0.1 are dropped, and a room
   with no valid answer keeps its table row. The result is written to the cache and returned with `source: 'llm'`.
6. **No key, network failure, refusal or no tool call:** the table alone is returned with `source: 'table'` and not cached,
   so the next load tries again. The page works the same either way.

The page asks for defaults only when it starts with no autosaved scene, or on "Reset". A saved scene never triggers the call.

#### Which triangles get which value
Two questions per triangle, both answered in the worker.
- **Surface class (wall, floor, ceiling)** comes from facing, as in the MVP (4.3).
- **Room** comes from the PI room polygons (4.2). The test point is the triangle's centre **moved 0.2 m along its facing
  direction**. Faces point into the rooms (verified: floor triangles face up, ceiling ones down), so a floor's point lies just
  above the floor, a ceiling's just below the ceiling, and each side of a wall lands in the room it faces. A wall between
  the kitchen and the hall gets the kitchen's wall material on the kitchen side and the hall's on the hall side.
- The point belongs to a room when it is inside the room's polygon (viewer x/z) and its height is between the room's
  floor − 0.3 m and floor + room height + 0.3 m. Missing room height: the distance to the next floor up, else 2.7 m.
  When polygons from two floors both match, the room whose floor is the highest one below the point wins.
- **Exterior walls:** a wall triangle whose test point is in a room, but whose point 0.6 m behind it (against its facing,
  past the wall's thickness) is in no room, faces outside. It gets the exterior wall material.
- **Triangles in no room** (trees, terrain, gaps in PI coverage) keep the house-wide `surfaces`.
- Tagging runs once, on `setRooms`, and is kept per triangle like the class. Its cost is not measured; 116,539
  point-in-polygon tests over about 20 rooms should take tens of milliseconds. Measure it in step 10.

**Before the 7.2 alignment passes** there is no room per triangle. The defaults then apply house-wide: each surface of
`surfaces` is the blend of the rooms' choices, weighted by each room's PI floor area (a room with no area counts as the
median). Exterior walls stay `wall` until then. So the feature is useful from step 4b, and gets per-room detail in step 10.

#### Where they live
- `SceneState.defaults` holds the last result: per room, the blends, furnishing and reason, plus `source`.
- Applying defaults writes blends into `SceneState.blends` and assigns them in `surfaces` and `roomSurfaces`.
  A surface whose value still equals its default shows as "suggested" in the panel, with the reason on hover.
- **Blends are not library entries.** They never get a permission row (6.2), never appear in the `set_material` enum
  or the panel dropdowns. `set_material` replaces a blend with a plain material; the default stays in `defaults`
  for "Reset to suggested".
- The page resolves blends to `Material` values (`app/src/scene/materials.ts`) and sends them to the worker after the
  library, in name order, in the same `setMaterials` array. Material ids stay under 255: 15 library entries plus up to
  4 blends per room.
- A saved scene contains `defaults` and `blends`, so it loads back exactly with no LLM call.

## 5. Sources and speakers (V3)

### 5.1 Sources become a list
The audio engine is hardwired to two voices today: `makeVoice('indoor' | 'outdoor')`, and the gain is picked by
`id === 'indoor'`. V2 generalises it to a list:

```ts
type SourceSpec = {
  id: string;                 // 'indoor', 'outdoor', 'speaker-1'…
  label: string;
  kind: 'point' | 'ambient' | 'stereo';
  // point: mono, HRTF, fades with distance (MVP indoor).
  // ambient: mono, HRTF, fixed level, no fade (MVP outdoor).
  // stereo: a stereo clip played as recorded, no HRTF; its level and band filters still come from the trace to its position
  sound: string;              // a library id (section 5.3) or an uploaded file id
  position: Vec3;             // viewer coordinates
  levelDb: number;            // relative to the MVP song
  enabled: boolean;
};
```

The MVP's two sources become the first two entries. `indoorDirectGain` and `outdoorDirectGain` become one function on `kind`.
The worker needs no change: trace requests already carry a list of sources.

### 5.2 Limits
- **At most 6 sources.** Each costs 13 HRTF panners and adds to every trace (MVP section 9: 160 ms for 3 sources).
- **From the fifth source on, 8 echo slots instead of 12** (the MVP's own fallback for audio crackle). The worker
  always returns 12; the engine merges them into the nearest 8.
- Disabled sources are left out of traces and their voices are stopped.

### 5.3 Sound library and speaker settings
The app ships with these sounds in `app/public/audio/`. Picking one for a new speaker also picks its default kind and level.

| Id | Sound | Kind | Placed | Default level |
|---|---|---|---|---|
| `music` | "Dream Sweet in Sea Major" | point | inside | 0 dB |
| `conversation` | Two or three people talking in gibberish (no real words) | point | inside | −6 dB |
| `highway` | Highway loop (the MVP's outdoor file) | ambient | outside | −12 dB |
| `city_ambience` | Street traffic, horns, voices | ambient | outside | −14 dB |
| `nature_ambience` | Wind, birds, leaves | ambient | outside | −20 dB |
| `industrial_ambience` | Machinery hum, trucks, beeps | ambient | outside | −14 dB |
| `commercial_ambience` | Shopping street or mall crowd | ambient | outside | −16 dB |
| `train` | A train passing (stereo clip) | stereo | outside | −10 dB |
| `plane` | A plane flying over (stereo clip) | stereo | outside | −10 dB |

- **Licence:** every file must be CC0 or public domain, recorded in `CREDITS.md`, like the highway loop.
  "Dream Sweet in Sea Major" is a commercial recording (MVP Q3): ship a free stand-in under the id `music` (the
  current public-domain Beethoven file) and use the song locally only, git-ignored.
- **Format:** `.ogg`, 30–60 s seamless loops, mono for point and ambient sounds, stereo for `train` and `plane`.
  A mono `PannerNode` would fold a stereo clip to one point and lose the pass-by it records, hence the `stereo` kind.
- **Placement default:** "outside" sounds dropped with "Add speaker" go where clicked; added from the list without a
  click, they go 25 m out from the tour start along the compass angle, like the MVP's outdoor source.

Per speaker in the panel: label, sound (from the library, or an uploaded `.mp3`/`.ogg`/`.wav`), level
from −30 to +6 dB, on/off, Move, Remove. Uploads are decoded in the page and kept as blob URLs for the session only.

### 5.4 Click to add
1. "Add speaker" (or the S key) enters placement mode. The cursor changes and a hint says "Click a surface. Esc cancels".
2. The page already follows `Pointer.intersection`, which gives the position and the surface's facing direction under the cursor.
3. A listener on `iframe.contentWindow` (as the P key handler does today) catches `pointerdown` and `pointerup`,
   in the capture phase. A press and release less than 6 px and 300 ms apart is a click; anything longer is a drag
   and passes to the tour so the user can still look around.
4. On a click, the speaker goes at the hit point plus 0.3 m along the surface's facing direction, so it never sits
   inside the wall (the occlusion rays would then count the wall itself).
5. Placement mode ends. The new speaker plays at once, and the app traces.

**Risk:** the same click can also make the tour jump to a sweep. Try `preventDefault` and `stopPropagation` on the
captured events first. If the tour still moves, keep the keyboard path only: S drops a speaker at the point under the
cursor, which uses the code the P key already proves works.

Speakers show as spheres in the blueprint (they exist since commit `1c9741c`) and, optionally, as SDK `Tag`s in the tour.
Tags are drawn by the viewer itself and cost little; nothing heavier goes in the viewer.

## 6. Jev, the agent (V5, V6)

### 6.1 Flow
```
user text or voice → Jev client ──(messages, tools allowed by PUT, scene context allowed by GET)──→ /api/jev → Claude API
                         ↑                                                                             │
                         └──── tool_use blocks ←───────────────────────────────────────────────────────┘
                         runs each call through the permission check, then the action layer,
                         returns the before/after numbers as tool_result, and loops until Claude stops
```

- **Model:** Claude Haiku 5.5 (`claude-haiku-5-5`) through `@anthropic-ai/sdk` on the server. It does the
  prompt-injection layer (combining the transcript with the acoustic knowledge base, 6.6) and the context layer
  (the scene summary, 6.4) in the draft's diagram. The key is `CLAUDE_API` in the root `.env`, passed explicitly as
  `new Anthropic({ apiKey: process.env.CLAUDE_API })` and read by the server only, like the GraphQL token.
  The browser never sees it. What `JEV_API` is for is open question V-Q7.
- **Settings:** adaptive thinking, `output_config.effort: "low"` for chat latency (Haiku 5.5 defaults to `medium`;
  raise it if answers are weak), `max_tokens` 16,000, `tool_choice` `auto`, `strict: true` on every tool.
- **Refusals:** Haiku 5.5 has no server-side fallback. Check `stop_reason` for `"refusal"` before reading the content
  and show a plain message when it happens.
- **Where the loop runs:** in the browser. Scene state and actions live there. `/api/jev` is a relay: it adds the
  fixed system prompt, puts a cache breakpoint after it, calls the API and returns the response as is. It keeps no state.
- **Voice:** the Web Speech API in Chrome, push to talk (hold V or the mic button). The transcript fills the text box
  and is sent on release, so the user sees what was heard. Text input always works.

### 6.2 Permissions
Each row has a GET toggle (Jev sees this data) and a PUT toggle (Jev may change it). This is the draft's table,
mapped to real state and actions.

| Row | GET puts in Jev's context | PUT allows | Default GET / PUT |
|---|---|---|---|
| Materials (global) | The library, surface assignments, per-room overrides, and each suggested default with its reason (4.4) | — | on / — |
| Material: each library entry (drywall, wood, tile, concrete…) | — | `set_material` with that material | — / on |
| Furnishing | Furnishing, global and per room | `set_furnishing` | on / on |
| Windows | Each window: id, room, size, open or closed | `set_opening` on windows | on / on |
| Doors | Each door: id, room, size, open or closed | `set_opening` on doors | on / on |
| Speakers | Each source: id, label, kind, position, room, level, on/off | `place_speaker`, `move_speaker`, `set_speaker`, `remove_speaker` | on / on |
| Locations | Room ids, names, floors, centres (read only) | — | on / — |
| User location | Listener position, room, facing | `move_user_to` | on / off |
| Mesh (global) | Triangle count, layers, which are traced and shown | — | on / — |
| Mesh layer: each layer (house, vegetation, terrain, doors, windows) | That layer's counts | `set_mesh_layer` for it | on / off |
| Measurements | The last trace and reverb results (section 6.4) | `measure`, `compare` (read only, they run traces) | on / — |

Material PUT defaults on so the demo works out of the box; turn rows off to show the insight-only path.
Permissions are part of `SceneState`, so they save with the scene.

### 6.3 Enforcement in code, not in the prompt
1. **Tools:** only actions whose PUT is on are sent in `tools`. A tool that is off does not exist for that request.
   For `set_material`, the `material` enum lists only the materials whose PUT is on.
2. **Executor:** before running any `tool_use`, the client checks the permission again against the current state.
   A refused call returns a `tool_result` with `is_error: true` and the row to enable. This covers a toggle changed mid-loop.
3. **Context:** the scene summary sent each turn is built from GET rows only. A row with GET off is absent, not blanked.
4. **Wording:** the per-turn scene summary (6.4) also lists which rows are off, so Jev can say "turn on PUT for
   Windows and I can close it" (the draft's scenario 1). The system prompt stays fixed. This is for the wording only;
   steps 1 to 3 are the boundary.

Changing permissions changes the tool list and so breaks the prompt cache for one request. That is acceptable: it
happens when the user clicks a toggle, not on every message.

### 6.4 What Jev sees
Each user turn carries a short JSON scene summary after the cache breakpoint, built from GET rows:
- The listener's room and position, and the room list.
- Per source: distance, walls crossed by the centre ray, `direct` per band as dB (`10·log10`), and the summed echo energy.
- The echo time per band for the current room (traced if the reverb job has finished, else the estimate, marked as such).
- Materials, furnishing, openings and layers as allowed. A surface still on its default carries the default's reason, so
  Jev can say "the kitchen floor is tile because the listing says Tile Flooring (suggested, not measured)".
- The names of the rows whose GET or PUT is off (section 6.3, step 4).

Jev answers from these numbers, never from general claims alone.

### 6.5 Tools
All run through `actions.ts`. Every PUT tool returns the changed state plus the numbers at the listener before and
after, so Jev can report "echo time in the living room 0.9 s → 0.6 s (estimate)".
- **Before** comes from the latest trace and the room's cached reverb result. No new work.
- **After** runs one fresh trace and one reverb job (about 0.7 s, MVP section 9).
- `measure` requests wait in the same one-job-at-a-time queue as listener traces (MVP 5.6), so a Jev action delays
  the next listener trace by up to a second. Acceptable while the user is reading the reply.

| Tool | Input | Notes |
|---|---|---|
| `measure` | `point?` (default the listener) or `room?` | Runs a trace and a reverb job there. Returns echo time per band and level per source in dB. Does not move the user |
| `compare` | `before`, `after` (two `measure` results) | Differences only; no simulation |
| `set_material` | `target`: `wall` / `floor` / `ceiling` / `exterior_wall`; `room?`; `material` | `room` only once per-room tagging exists (section 4.2). `exterior_wall` has no `room` |
| `set_furnishing` | `level`: `empty` 0.0 / `sparse` 0.08 / `furnished` 0.15 / `studio` 0.30; `room?` | |
| `set_opening` | `id`, or `room` + `type` (`window` / `door` / `all`); `state`: `open` / `closed` | Loads the openings layer first if it is off |
| `place_speaker` | `room` or `point`; `sound`; `levelDb?` | A room places it at the room's centre, 1 m above the floor |
| `move_speaker` | `id`; `room` or `point` | |
| `set_speaker` | `id`; `levelDb?`; `enabled?`; `sound?` | |
| `remove_speaker` | `id` | The MVP's two sources can be turned off but not removed |
| `move_user_to` | `room` | `Sweep.moveTo` to the sweep nearest the room's centre |
| `set_mesh_layer` | `layer`; `traced` | Warns that hiding a layer on a guess may remove walls (section 7.3) |

### 6.6 System prompt: the acoustic knowledge base
A fixed text, cached. It holds:
- What Jev is: a guide to the estimated acoustics of this property, using the tools above. Short answers, numbers
  first, always "estimated".
- The rules it reasons with, all from standard room acoustics:
  - Echo time falls as total absorption rises: `RT60 = 0.161·V / Σ(S·α)` (Sabine). Soft materials and furnishing shorten it.
  - Hard surfaces (tile, concrete, glass) lengthen it and brighten the room; carpet and panels remove high frequencies first.
  - Sound through a wall, door or window loses its transmission loss; an open window loses 0–5 dB, a closed single pane about 25.
  - Level falls 6 dB per doubling of distance for a point source.
  - Low frequencies pass walls more easily than high ones, so neighbours hear the bass.
- The permission rules of section 6.3, step 4.

### 6.7 Changes from the Jev draft
| Draft | V2 | Why |
|---|---|---|
| Rule "more meshes = less echo"; scenario 2 switches to a denser mesh to cut echo | Removed. Echo is cut with materials, furnishing or closed openings | Mesh density sets accuracy, not absorption. Using it to lower echo would present a modelling artefact as acoustics, which AGENTS.md forbids |
| "Mesh 1…N" change geometry or resolution | Mesh layers from the OBJ group codes and our added panels, which can be traced or not | The groups are real (`type002`, `type003`, `type007`…). Resolution change is out of V2 |
| Speaker GET/PUT, Location, User location | Kept, mapped to actions | |
| Materials: wood, tiles, concrete, drywall | A larger library with per-material PUT | |
| Tools offered whatever the toggles, with the prompt asked to respect them | Tools and context filtered in code | The draft calls Settings a security boundary; only code makes it one |

Example, insight only (Windows PUT off): "Close the window, it's loud." → Jev reads the window and the highway's level,
answers "The highway reaches the bedroom at about −28 dB through the open window. Closing it should take off roughly
20 dB more (estimate). Turn on PUT for Windows and I'll do it."
With PUT on, it calls `set_opening`, then reports the before/after `measure`.

## 7. Closed doors and windows (V7)

### 7.1 Where the data comes from
**Property Intelligence vector data**, queried by the server with the read-only token (section "Vector data" of
[docs/matterport/notes/10-property-intelligence-api.md](../matterport/notes/10-property-intelligence-api.md)):
rooms → boundary → edges (two 2D vertices, `thickness`, `centerLineBias`) → openings (`type`, `width`, `height`,
`lowerElevation`, `relativeCenter` along the edge). Types seen across 30 models: `doorway` 519, `window` 153,
`opening` 68, `divider` 18.

- `GET /api/openings/:id` runs the query once and caches the answer in `server/cache/` like the mesh.
  The page asks for it only when the openings toggle is first turned on.
- Each `window` becomes a glass panel; each `doorway` a door panel. `opening` and `divider` are listed but get no panel:
  they are gaps without a door.
- The floor height comes from the room's `dimensionEstimates.lowerElevation` or the floor's. When a window has no
  `lowerElevation` use 0.9 m; when a door has no `height`, 2.0 m.
- **The Bundle's `PI` namespace** is undocumented. Check in dev whether `__sdk.PI` exposes the same openings without a
  GraphQL call. If it does, prefer it; the plan does not depend on it.
- **Fallback if PI has no openings for a room:** none in V2. Hand-placed openings (clicking two corners) are a later idea.

### 7.2 The alignment check (first, before any audio)
PI vertices are 2D and "relative to the model center". That frame has not been compared with the mesh. Assume it is the
mesh's Z-up frame, so a vertex `(x, y)` at height `z` converts like the mesh: `(x, z, −y)`.

Check: draw every opening as a rectangle in the blueprint. They must sit in the wall gaps of the mesh, as the blueprint
lines sat on the tour's walls in MVP step 4. If they are shifted or rotated, find the offset from two or three doorways
and record it in AGENTS.md's verified facts. If no fit is found, V7 and per-room materials stop here.

### 7.3 Mesh layers
The OBJ parser ignores `g` lines today. V2 keeps a layer id per triangle: ungrouped (house), `type002`, `type003`,
`type007` and the rest, plus our `doors` and `windows` panels. The settings panel lists them with triangle counts.
- **Traced** decides whether rays hit the layer. **Shown** decides whether the blueprint draws it.
- Default: everything traced and shown, as in the MVP.
- The decoding is partial (`type002` and `type007` look like vegetation, `type003` like terrain, by height only).
  The panel says so. Hiding a code on a guess could remove walls.
- Not tracing vegetation makes the outdoor source clearer and cuts blueprint clutter (most of the 135,730 lines are trees).
  It is the real version of the draft's "Mesh N" toggle.

### 7.4 In the worker
- The panels go in a **second, small ray index**: each opening is a box the wall's `thickness` deep (at least 4 cm),
  12 triangles. 153 windows plus a few hundred doors stay under 10,000 triangles. The main index is never rebuilt:
  building it costs 173 ms and reorders `mesh.indices`.
- Every ray cast tests both indexes and keeps the nearer hit. Hits on open panels are skipped by a per-opening flag,
  so opening or closing is a flag change, with no rebuild.
- Panels use the `glass` and `door` materials (section 4.1).
- A panel counts as one wall for the "walls a leg may cut through" limit, like any other wall.
- **Is the gap already closed in the mesh?** Scanned glass sometimes appears as a surface. On `loadOpenings`, the
  worker casts a ray through each opening's centre against the main mesh. If it hits within the wall's thickness, the
  opening is reported as `meshClosed: true` and its panel stays off: closing it again would double the loss.
- Any change to openings clears the reverb cache.

## 8. Worker contract changes (`app/src/sim/types.ts`)

Change this file first, as for the MVP.

```ts
type ToWorker =
  | …MVP messages
  | { type: 'setMaterials'; library: Material[];                  // library, then resolved blends (4.4)
      surfaces: [number, number, number, number];                 // material index per class: wall, floor, ceiling, exterior wall
      roomSurfaces?: { roomId: string; surfaces: [number, number, number] }[];
      furnishing: number; roomFurnishing?: { roomId: string; value: number }[] }
  | { type: 'setRooms'; rooms: { id: string; floorY: number; height: number; polygon: [number, number][] }[] }   // viewer x/z; height filled per 4.4
  | { type: 'loadOpenings'; openings: OpeningGeom[] }
  | { type: 'setOpenings'; closed: string[] }                     // every other loaded opening is open
  | { type: 'setLayers'; traced: Record<string, boolean> }
  | { type: 'setQuality'; raysPerTrace: number; bounces: number; reverbRays: number }
  | { type: 'measure'; id: number; point: Vec3; roomId: string; sources: { id: string; position: Vec3 }[] };

type OpeningGeom = { id: string; kind: 'window' | 'door'; roomId: string;
                     corners: [Vec3, Vec3, Vec3, Vec3]; thickness: number };   // viewer coordinates

type FromWorker =
  | …MVP messages ('ready' gains layers: { id: string; triangles: number }[])
  | { type: 'roomsReady'; rooms: { id: string; triangles: number }[]; untagged: number; exteriorWalls: number; ms: number }
  | { type: 'openingsReady'; openings: { id: string; meshClosed: boolean }[]; lines: Float32Array; ms: number }
  | { type: 'measure'; id: number; echoTime: Bands; sources: { id: string; levelDb: Bands; walls: number }[]; ms: number };
```

Every setting message is followed by a fresh trace from the page (section 2, flow step 4).

## 9. Settings panel

A collapsible panel on the right, outside the viewer (plain DOM, like the MVP buttons). Sections:
1. **Scene:** Save, Load, Reset, quality.
2. **Materials:** wall / floor / ceiling / exterior wall dropdowns for the house; a room picker for overrides (once 4.2 works);
   furnishing. Values still on their default show "suggested" and the reason on hover; "Reset to suggested" per room and for the house.
3. **Sources:** the list from 5.3, and "Add speaker".
4. **Openings:** "Load doors and windows" toggle, then a list by room with open/closed switches, "close all windows", "close all doors".
5. **Mesh layers:** traced / shown per layer, with counts.
6. **Jev permissions:** the table of 6.2 as GET and PUT switches.

The Jev chat sits below the panel, with the mic button. When Jev changes something, the panel updates from the store,
and the changed row flashes, so the user sees what the agent did.

## 10. Build steps

Each step leaves something that runs. Agentic use is 30% of the judging, so Jev comes as early as there is something for it to act on.

| # | Step | Check |
|---|---|---|
| 1 | `scene/state.ts`, `scene/actions.ts`, autosave, Save / Load / Reset. Contract changes from section 8 in `types.ts` | Reloading the page keeps a changed value; a saved file loads back identically (unit test round trip) |
| 2 | Audio engine on a source list (5.1, 5.2); the MVP sources as the first two | Both MVP sources sound as before. A third source added in code plays and traces. With 6 sources (about 70 HRTF panners), no crackle and the audio CPU stays reasonable; if not, lower the cap |
| 3 | Add speaker: S key first, then click placement (5.4); speaker list in the panel | A speaker placed on a kitchen wall is heard from that wall, quieter from the next room |
| 4 | Material library and `setMaterials` for whole-house surfaces; furnishing control | Tile everywhere rings longer than carpet everywhere, by ear and in the traced echo time |
| 4b | Default materials (4.4): `extract-listing` script, room-type table, `/api/defaults/:id` with the Claude call and cache, blends, house-wide application | The demo house's kitchen floor is suggested as `tile` with a reason citing "Tile Flooring". With the key removed, the table defaults load and the page works. Unit tests: blend maths (energy average for blocking), answer validation, table blending for a two-type room |
| 5 | `/api/jev` relay, chat box, scene summary from GET rows, `measure` and `compare` | "Why is it echoey here?" gets an answer that cites this room's echo time |
| 6 | PUT tools and the permission filter (6.3); the permissions table in the panel | With Materials PUT off, Jev only suggests; turned on, it changes the walls and reports before/after. A unit test shows a disabled tool is never sent and is refused if called |
| 7 | Voice input | Hold V, say "close all the windows", see the transcript, hear the change (after step 9) |
| 8 | `/api/openings/:id`, openings drawn in the blueprint: the alignment check (7.2) | Panels sit in the mesh's door and window gaps |
| 9 | Openings panels in the worker (7.4), open/close in the panel and as Jev's `set_opening` | Closing the window nearest the highway makes it quieter and duller indoors |
| 10 | OBJ groups as layers (7.3); per-room materials and furnishing (4.2) using the aligned PI polygons; per-room defaults and exterior walls (4.4) | Turning vegetation off removes most blueprint lines and the house is intact. `roomsReady` counts look right (most house triangles tagged, trees untagged), the kitchen floor triangles carry the kitchen blend, and the brick exterior walls make the highway quieter indoors than `siding_wall` |

If time runs short, cut from the end: per-room materials, then layers, then voice. Steps 1 to 6 are the core of V2.

## 11. Risks

| Risk | What we do |
|---|---|
| PI frame does not match the mesh | Step 8 finds out before anything depends on it. Without a fit, drop V7 and per-room materials; the rest of V2 stands |
| A click in the tour also moves the camera | Capture-phase handlers; fallback to the S key |
| Too many sources: slow traces, crackle | Cap at 6, 8 slots from the fifth source on, `fast` quality |
| Jev claims numbers it did not measure | Every PUT tool returns a before/after `measure`; the prompt requires numbers from tools; all marked "estimate" |
| Jev changes something the user did not allow | Tools and context filtered in code, executor re-checks; unit tested |
| Chat latency feels slow on stage | Low effort, short answers, prompt caching on the fixed system prompt and tools |
| Network or API key fails on demo day | The settings panel does everything Jev does; demo the panel |
| Doubled loss where the mesh already has glass | The `meshClosed` ray check per opening |
| The suggested materials are wrong for a room | The LLM can only pick library materials, each pick shows its reason and "suggested", one click changes it, and the result is cached so every run starts the same. Without the LLM the room-type table still gives sensible values |
| Wall faces near doorways tagged to the wrong room | Small areas; an estimate either way. The `roomsReady` counts and the blueprint show it |

## 12. Open questions

| # | Question | Default |
|---|---|---|
| V-Q1 | ~~What does "settings on file" mean?~~ Answered: the built-in sound library (5.3) | — |
| V-Q2 | Does the Bundle's `PI` namespace expose openings? | Use GraphQL; probe `__sdk.PI` in step 8 |
| V-Q3 | Which PUT rows should be on by default for the demo? | Materials, furnishing, openings and speakers on; user location and mesh layers off |
| V-Q4 | Does the defurnished mesh have holes at windows, or glass? | Measured per opening by the `meshClosed` check |
| V-Q5 | Replace the material values with a published table? | Keep the estimates for the demo |
| V-Q6 | Should the scene summary send the full source list every turn, or only on change? | Every turn; it is small |
| V-Q7 | What is `JEV_API` in `.env`: a separate Jev service, or a second Claude key? | Unused until answered; Jev runs on `CLAUDE_API` |
| V-Q8 | Which published absorption and transmission table replaces the library values (4.1)? Ties to V-Q5 | Pick one table (a room-acoustics textbook appendix or a measured database), copy its values with a citation per row; until then the rough values stand |
| V-Q9 | Which model suggests the defaults (4.4)? | Haiku 5.5 like Jev: one call per property, cached. Try a larger model if its picks ignore the listing facts |
| V-Q10 | If the PI frame cannot be aligned (7.2), is the exterior wall class still worth having? | No: exterior walls stay `wall` and the brick fact has no effect; say so in the panel |
