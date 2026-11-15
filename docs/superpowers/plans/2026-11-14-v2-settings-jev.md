# V2 Settings, Speakers, Jev and Closed Openings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inside the tour: a settings panel over one scene state, a saved scene file, speakers placed by click, a material library with suggested defaults, the Jev agent with GET/PUT permissions, and doors and windows that can be closed.

**Architecture:** One `SceneState` in the page, changed only through one action layer that the settings panel and Jev both call. Actions push changes to the sim worker (new messages in `app/src/sim/types.ts`) and the audio engine through an injected effects object. The server adds three routes (`/api/defaults/:id`, `/api/openings/:id`, `/api/jev`) that reuse V3's Property Intelligence source and index.

**Tech Stack:** TypeScript, Vite + Vitest (app), Express 5 + Vitest + Supertest (server), `three-mesh-bvh`, Web Audio, Web Speech API, `@anthropic-ai/sdk` (Claude Haiku 5.5 for Jev and defaults).

**Spec:** [docs/project/v2-design.md](../../project/v2-design.md). Section numbers below ("spec 6.3") point into it. This plan builds on [the V3 plan](2026-11-14-v3-front-door.md); read its Global Constraints too, they all apply here.

## Run order across both plans

V3 goes first, because V2 stands on four things V3 builds: the page split and shared contract (V3 Lane 0), the audio engine on a source list (V3 F2), the Property Intelligence source (V3 B1) and the CoStar index (V3 A1). Two V2 lanes need none of those and run beside the V3 lanes.

```
Wave 0   V3 Lane 0  Foundation (0.1 built, not reviewed; 0.2–0.6)           one agent
Wave 1   V3 Lanes A B C D E F      +      V2 Lane G  Scene store            eight agents in parallel
                                          V2 Lane H  Sim worker
Gate     V3 Z1 merge check, V3 Z2 warm script                               one agent
Wave 2   V2 Lane I  Server (defaults, openings, Jev relay)                  four agents in parallel
         V2 Lane J  Tour wiring and speakers
         V2 Lane K  Settings panel
         V2 Lane L  Jev client
Wave 3   V2 Lane Y  Integration (alignment gate, per-room, openings, final) one agent
         then V3 Z4 (docs, final pass)
```

**Changes this plan makes to the V3 plan** (already edited there):
- **V3 Task 0.6 is new:** the material library and room-type table go in `server/src/shared/materials.ts`, so V3's quick summary and V2's scene use one copy.
- **V3 Task B1's `PiRoom` carries more fields** (edge `thickness`, opening `relativeCenter` and `lowerElevation`, room `lowerElevation` and `keywords`), so V2's openings need no second query.
- **V3 Task Z3 is dropped.** Jev's `place_speaker` (Lane L) replaces the tour chat and `place_sound`.

## Lanes and the files they own

| Lane | Owns |
|---|---|
| G Scene store | `app/src/scene/**`, the stubs `app/src/panel/index.ts` and `app/src/jev/index.ts` (created here, then handed to K and L) |
| H Sim worker | `app/src/sim/**` |
| I Server | `server/src/v2/**`, `scripts/extract-listing.mjs`, and in Wave 2 `server/src/index.ts`, `server/src/app.ts` |
| J Tour wiring | `app/src/tour/**`, `app/src/blueprint/**`, `app/index.html` |
| K Panel | `app/src/panel/**` |
| L Jev | `app/src/jev/**` |
| Y Integration | everything |

Rules: as in the V3 plan. A lane edits only its paths; it codes against the interfaces below and fakes its neighbours in tests; each lane works in its own worktree on `v2/<lane>`; a lane that needs a change elsewhere stops and reports.

## Global Constraints

- Everything in the V3 plan's Global Constraints.
- **One action layer:** nothing but `app/src/scene/actions.ts` writes to `SceneState`. The panel and Jev call the same functions.
- **Permissions are enforced in code:** a tool whose PUT is off is not sent to the model, and the executor checks again before running any call. Context is built from GET rows only (spec 6.3).
- **The LLM never writes an absorption or blocking number.** It picks library materials; code computes blends (spec 4.4).
- **Nothing heavy in the viewer.** Rays stay in the worker, audio on the audio thread.
- **The main ray index is never rebuilt** after load (173 ms, and it reorders `mesh.indices`). Per-triangle data is computed after `buildRayIndex`.
- Jev: `claude-haiku-5-5`, adaptive thinking, `output_config.effort: "low"`, `max_tokens` 16000, `tool_choice` `auto`, `strict: true` on every tool, key `CLAUDE_API`, server only. Check `stop_reason === "refusal"` before reading content.
- At most 6 sources; from the fifth on, 8 echo slots (V3 F2 implements this).
- Every `localStorage` read and write is in try/catch.
- Material values are rough estimates. The panel says "suggested" and "estimate".

## Review Focus

1. **A scene file from another property, an older version, or with junk in it:** refused with a message (other `modelId`), unknown keys dropped, missing keys defaulted, never a crash. Tests in G1.
2. **A permission toggled while Jev's loop is running:** the executor refuses the call with `is_error` and names the row. Test in L1.
3. **Absorption plus furnishing above 1** (`acoustic_panel` 0.90 + 0.15): clamped to 0.99, not a perfect absorber. Tests in G2 and H1.
4. **A layer or opening change while a trace or reverb job is queued:** the change applies, the reverb cache clears, one fresh trace follows; no stale result is applied. Tests in G4 and J1.
5. **A click that is really a drag, or a click when `Pointer.intersection` has no hit:** no speaker is placed and the tour still turns. Test in J2.

---

## Lane G: Scene store (Wave 1)

### Task G1: State, validation and storage

**Files:** Create `app/src/scene/state.ts`, `app/src/scene/storage.ts`; Test `app/src/scene/state.test.ts`, `app/src/scene/storage.test.ts`

**Interfaces — Consumes:** `MATERIALS`, `MaterialName` from `server/src/shared/materials.ts` (V3 Task 0.6). **Produces:**
```ts
// state.ts — spec section 3
export type BlendName = `blend:${string}`;
export type SurfaceValue = MaterialName | BlendName;
export type SurfaceClass = 'wall' | 'floor' | 'ceiling' | 'exteriorWall';
export type RoomSurfaceClass = Exclude<SurfaceClass, 'exteriorWall'>;
export type Blend = { parts: { material: MaterialName; weight: number }[] };
export type Quality = 'fast' | 'normal' | 'high';
export const QUALITY: Record<Quality, { raysPerTrace: number; bounces: number; reverbRays: number }>;   // 1000/3/800, 2000/4/1500, 3000/5/3000
export type FurnishingLevel = 'empty' | 'sparse' | 'furnished' | 'studio';                              // 0, 0.08, 0.15, 0.30 (shared FURNISHING)
/** Same shape as V3's `SourceSpec` in app/src/audio/engine.ts (declared here so this lane needs no other lane's file). */
export type SceneSource = { id: string; label: string; kind: 'point' | 'ambient' | 'stereo'; sound: string; position: Vec3; levelDb: number; enabled: boolean };
export type RoomDefault = { roomId: string; floor: Blend; wall: Blend; ceiling: Blend; furnishing: FurnishingLevel; reason: string };
export type MaterialDefaults = { source: 'llm' | 'table'; rooms: RoomDefault[]; exteriorWall: Blend; exteriorReason: string };
export type PermissionRow = 'materials' | 'furnishing' | 'windows' | 'doors' | 'speakers' | 'locations' | 'userLocation' | 'mesh' | 'measurements';
export type Permissions = {
  get: Record<PermissionRow, boolean>;
  put: Record<'furnishing' | 'windows' | 'doors' | 'speakers' | 'userLocation', boolean>;
  putMaterial: Record<string, boolean>;        // per library entry
  putLayer: Record<string, boolean>;           // per mesh layer
};
export type SceneState = {
  version: 1; modelId: string;
  blends: Record<BlendName, Blend>;
  surfaces: Record<SurfaceClass, SurfaceValue>;
  roomSurfaces: Record<string, Partial<Record<RoomSurfaceClass, SurfaceValue>>>;
  defaults: MaterialDefaults | null;
  furnishing: number; roomFurnishing: Record<string, number>;
  sources: SceneSource[];
  openings: { loaded: boolean; closed: Record<string, boolean> };
  meshLayers: Record<string, { traced: boolean; shown: boolean }>;
  quality: Quality;
  permissions: Permissions;
};
export function defaultScene(modelId: string): SceneState;     // surfaces wall/ceiling 'drywall', floor 'wood_floor', exteriorWall 'drywall'; furnishing 0.15; quality 'normal'; permissions per spec 6.2 defaults
export function normaliseScene(raw: unknown, modelId: string): { scene: SceneState } | { error: string };
// storage.ts
export function autosaveKey(modelId: string): string;          // 'scene:<modelId>'
export function saveAutosave(scene: SceneState, storage?: Storage): void;      // never throws
export function loadAutosave(modelId: string, storage?: Storage): SceneState | null;
export function sceneFileName(modelId: string, date: Date): string;            // 'scene-<modelId>-<YYYY-MM-DD>.json'
export function parseSceneFile(text: string, modelId: string): { scene: SceneState } | { error: string };
```
The spec's `materials` field (the library) is not stored in the scene: the library is the shared constant, so a saved file can't change absorption numbers. `normaliseScene`: a `modelId` that differs → `{ error: 'This scene belongs to another property (<id>).' }`; `version` not 1 → error; unknown keys dropped; missing keys from `defaultScene`; a surface naming an unknown material or blend → the default for that class; numbers clamped (furnishing 0–0.5, `levelDb` −30…+6); at most 6 sources kept; sources without a valid position dropped. Permission defaults (spec 6.2): every GET on; PUT on for furnishing, windows, doors, speakers and every material; PUT off for `userLocation` and every layer.

- [ ] **Step 1: Write the failing tests**
```ts
it('round-trips a scene exactly', () => { const s = { ...defaultScene('Ki9YdfpNKum'), furnishing: 0.3 }; expect(parseSceneFile(JSON.stringify(s), 'Ki9YdfpNKum')).toEqual({ scene: s }); });
it('refuses a scene from another property', () => expect(parseSceneFile(JSON.stringify(defaultScene('aaaaaaaaaaa')), 'Ki9YdfpNKum')).toEqual({ error: 'This scene belongs to another property (aaaaaaaaaaa).' }));
it('fills missing keys and drops unknown ones', ...)        // { version: 1, modelId, junk: 1 } → equals defaultScene
it('rejects text that is not JSON, and JSON that is not an object', ...)   // error strings, no throw
it('replaces an unknown material with the class default', ...)   // surfaces.floor 'lava' → 'wood_floor'
it('keeps a blend reference only when the blend exists', ...)
it('clamps numbers and caps sources at six', ...)
it('names the file', () => expect(sceneFileName('Ki9YdfpNKum', new Date('2026-11-14T10:00:00Z'))).toBe('scene-Ki9YdfpNKum-2026-11-14.json'));
it('survives a storage that throws', ...)                   // saveAutosave no throw; loadAutosave null
it('ignores a corrupt autosave', ...)                       // getItem → '{' → null
it('sets the default permissions', () => { const p = defaultScene('x'.repeat(11)).permissions; expect(p.put).toEqual({ furnishing: true, windows: true, doors: true, speakers: true, userLocation: false }); expect(Object.values(p.get).every(Boolean)).toBe(true); expect(p.putMaterial.tile).toBe(true); });
```
- [ ] **Step 2:** Run `npm run test -w app -- src/scene`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm run test -w app && npm run typecheck -w app`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: scene state, validation and storage`.

### Task G2: Blends, the worker message and applying defaults

**Files:** Create `app/src/scene/materials.ts`; Test `app/src/scene/materials.test.ts`

**Interfaces — Consumes:** G1; `Material`, `ToWorker` from `app/src/sim/types.ts` (Lane H changes that file in the same wave: this lane declares the `setMaterials` message shape it builds as a local type `SetMaterials`, identical to spec section 8, and Lane Y replaces it with the import). **Produces:**
```ts
export function resolveBlend(blend: Blend): Material;                 // spec 4.4: parts < 0.1 dropped, weights normalised; absorption and scattering weighted mean; blocking as energy
export function cleanBlend(blend: Blend): Blend;                      // at most 3 parts, unknown materials and parts < 0.1 dropped, normalised; empty → null-safe: returns { parts: [] }
export function materialList(scene: SceneState): { names: SurfaceValue[]; materials: Material[] };   // library in MATERIALS key order, then the scene's blends in name order
export function setMaterialsMessage(scene: SceneState, roomsTagged: boolean): SetMaterials;   // surfaces as indices [wall, floor, ceiling, exteriorWall]; roomSurfaces and roomFurnishing only when roomsTagged
export function applyDefaults(scene: SceneState, defaults: MaterialDefaults, rooms: { id: string; area: number }[], perRoom: boolean): SceneState;
export function isSuggested(scene: SceneState, cls: SurfaceClass, roomId?: string): { suggested: boolean; reason: string | null };
```
`applyDefaults` (spec 4.4 "Before the 7.2 alignment passes"): `perRoom false` → each house surface becomes one blend of the rooms' choices weighted by room area (a room with no area counts as the median area), named `blend:house-floor`, `blend:house-wall`, `blend:house-ceiling`; `exteriorWall` stays as it is. `perRoom true` → `roomSurfaces[roomId]` gets `blend:<roomId>-floor` etc., `roomFurnishing` from the level, and `surfaces.exteriorWall` = `blend:exterior`. A blend with one part of weight 1 is stored as the plain material name, not a blend. `scene.defaults` is set either way.

- [ ] **Step 1: Write the failing test**
```ts
it('averages absorption by weight', () => expect(resolveBlend({ parts: [{ material: 'wood_floor', weight: 0.7 }, { material: 'carpet', weight: 0.3 }] }).absorption[1]).toBeCloseTo(0.175, 5));
it('averages blocking as energy, so the weak part dominates', () => expect(resolveBlend({ parts: [{ material: 'glass', weight: 0.4 }, { material: 'concrete', weight: 0.6 }] }).blockingDb[1]).toBeCloseTo(28.97, 1));   // glass 25, concrete 55
it('drops parts under 0.1 and renormalises', ...)          // [0.95 tile, 0.05 carpet] → equals tile
it('lists the library first, then blends by name', ...)    // names[0] is the first MATERIALS key; blends sorted after
it('builds surface indices into that list', ...)           // surfaces.floor 'tile' → index of 'tile'
it('leaves room data out until rooms are tagged', ...)     // roomsTagged false → roomSurfaces undefined
it('blends the house floor from the rooms by area', ...)   // kitchen 10 m² tile, bedroom 30 m² carpet → blend:house-floor parts tile 0.25, carpet 0.75
it('counts a room without an area as the median', ...)
it('stores a single-material default as that material', ...)
it('says a surface is suggested until it is changed', ...) // after applyDefaults: suggested true with the reason; after changing floor: false
```
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS).
- [ ] **Step 5:** Commit: `feat: material blends and default application`.

### Task G3: Permissions

**Files:** Create `app/src/scene/permissions.ts`; Test `app/src/scene/permissions.test.ts`

**Interfaces — Produces:**
```ts
export type ActionName = 'set_material' | 'set_furnishing' | 'set_opening' | 'place_speaker' | 'move_speaker' | 'set_speaker'
  | 'remove_speaker' | 'move_user_to' | 'set_mesh_layer' | 'measure' | 'compare';
export type OpeningKind = 'window' | 'door';
/** null = allowed. Otherwise the row to enable, as the user reads it: 'Windows', 'Material: tile', 'Mesh layer: type002'. */
export function refusal(p: Permissions, action: ActionName, args: { material?: string; layer?: string; openingKind?: OpeningKind | 'all' }): string | null;
export function allowedActions(p: Permissions): ActionName[];          // an action with no way to pass is absent
export function allowedMaterials(p: Permissions): string[];            // library names whose PUT is on
export function offRows(p: Permissions): { get: string[]; put: string[] };   // display names of rows that are off
```
Mapping (spec 6.2): `set_material` needs `putMaterial[material]` (absent from `allowedActions` when no material is on); `set_furnishing` → `put.furnishing`; `set_opening` → `put.windows` for windows, `put.doors` for doors, both for `'all'` (listed when either is on); the four speaker actions → `put.speakers`; `move_user_to` → `put.userLocation`; `set_mesh_layer` → `putLayer[layer]`; `measure` and `compare` → `get.measurements`.

- [ ] **Step 1: Write the failing test**
```ts
it('allows the defaults', () => expect(allowedActions(P)).toEqual(expect.arrayContaining(['set_material', 'set_furnishing', 'set_opening', 'place_speaker', 'measure', 'compare'])));
it('hides what is off by default', () => { expect(allowedActions(P)).not.toContain('move_user_to'); expect(allowedActions(P)).not.toContain('set_mesh_layer'); });
it('names the row to enable', () => { expect(refusal({ ...P, put: { ...P.put, windows: false } }, 'set_opening', { openingKind: 'window' })).toBe('Windows'); expect(refusal(P, 'set_mesh_layer', { layer: 'type002' })).toBe('Mesh layer: type002'); });
it('checks each material on its own', () => { const p = { ...P, putMaterial: { ...P.putMaterial, tile: false } }; expect(refusal(p, 'set_material', { material: 'tile' })).toBe('Material: tile'); expect(refusal(p, 'set_material', { material: 'carpet' })).toBeNull(); expect(allowedMaterials(p)).not.toContain('tile'); });
it('needs both rows to change all openings', ...)
it('drops set_material when every material is off', ...)
it('lists the rows that are off', ...)
```
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS).
- [ ] **Step 5:** Commit: `feat: Jev permission rules`.

### Task G4: The store and the action layer

**Files:** Create `app/src/scene/store.ts`, `app/src/scene/actions.ts`, `app/src/panel/index.ts` (stub), `app/src/jev/index.ts` (stub); Test `app/src/scene/actions.test.ts`

**Interfaces — Consumes:** G1–G3. **Produces:**
```ts
// store.ts
export type SceneStore = { get(): SceneState; set(next: SceneState, changed: string[]): void; subscribe(fn: (state: SceneState, changed: string[]) => void): () => void };
export function createStore(initial: SceneState, onChange?: (s: SceneState) => void): SceneStore;   // onChange: autosave
// actions.ts
export type OpeningInfo = { id: string; kind: OpeningKind | 'opening' | 'divider'; roomId: string; roomName: string; width: number; height: number; meshClosed: boolean };
export type RoomInfo = { id: string; name: string; floor: string; area: number; centre: Vec3 | null };
export type Measurement = { roomId: string | null; echoTime: Bands; sources: { id: string; levelDb: Bands; walls: number }[]; estimated: boolean };
/** What the tour gives the actions. Lane J implements it; tests use a recording fake. */
export type SceneEffects = {
  materialsChanged(scene: SceneState): void;        // setMaterials to the worker
  qualityChanged(scene: SceneState): void;
  openingsChanged(scene: SceneState): Promise<void>;   // loads the layer first when scene.openings.loaded turned on
  layersChanged(scene: SceneState): void;
  sourcesChanged(scene: SceneState): Promise<void>;  // engine.setSources + source positions for traces
  clearReverb(): void;
  retrace(): void;
  moveUserTo(roomId: string): Promise<void>;
  measure(at: { point?: Vec3; roomId?: string }): Promise<Measurement>;
  current(): Measurement | null;                    // the latest trace and cached reverb; no new work
  rooms(): RoomInfo[]; openings(): OpeningInfo[]; layers(): { id: string; triangles: number }[];
  roomsTagged(): boolean;
  listener(): { position: Vec3; roomId: string | null } | null;
};
export type ActionResult<T = unknown> = { ok: true; value: T; before: Measurement | null; after: Measurement | null } | { ok: false; error: string };
export type Actions = {
  setMaterial(a: { target: SurfaceClass; room?: string; material: string }): Promise<ActionResult>;
  setFurnishing(a: { level: FurnishingLevel; room?: string }): Promise<ActionResult>;
  setOpening(a: { id?: string; room?: string; type?: OpeningKind | 'all'; state: 'open' | 'closed' }): Promise<ActionResult<{ changed: string[] }>>;
  placeSpeaker(a: { room?: string; point?: Vec3; sound: string; levelDb?: number }): Promise<ActionResult<{ id: string }>>;
  moveSpeaker(a: { id: string; room?: string; point?: Vec3 }): Promise<ActionResult>;
  setSpeaker(a: { id: string; levelDb?: number; enabled?: boolean; sound?: string }): Promise<ActionResult>;
  removeSpeaker(a: { id: string }): Promise<ActionResult>;
  moveUserTo(a: { room: string }): Promise<ActionResult>;
  setMeshLayer(a: { layer: string; traced?: boolean; shown?: boolean }): Promise<ActionResult>;
  measure(a: { point?: Vec3; room?: string }): Promise<ActionResult<Measurement>>;
  compare(a: { before: Measurement; after: Measurement }): ActionResult<{ echoTimeDelta: Bands; sources: { id: string; levelDeltaDb: Bands }[] }>;
  setQuality(q: Quality): void; setPermissions(p: Permissions): void;
  applyDefaults(d: MaterialDefaults): void; resetToSuggested(room?: string): void;
  loadScene(scene: SceneState): Promise<void>; reset(): Promise<void>;
};
export function createActions(store: SceneStore, effects: SceneEffects, sounds: Record<string, { kind: SceneSource['kind']; levelDb: number }>): Actions;
// panel/index.ts and jev/index.ts — stubs here; Lanes K and L fill them in
export function startPanel(root: HTMLElement, deps: { store: SceneStore; actions: Actions; effects: SceneEffects; fetchDefaults(refresh: boolean): Promise<MaterialDefaults> }): void;
export function startJev(root: HTMLElement, deps: { store: SceneStore; actions: Actions; effects: SceneEffects; fetch?: typeof fetch }): void;
```
Every action: validate → `store.set` → effect → for geometry or material changes `clearReverb()` → `retrace()` (spec section 2, "Flow of a change"). PUT actions return `before: effects.current()` and `after: await effects.measure({})` (spec 6.5). Rules: `setMaterial` with a `room` while `!effects.roomsTagged()` → error `Per-room materials are not available yet for this property.`; `exteriorWall` with a `room` → error; an unknown material, room, speaker id, layer or opening → an error naming it; `placeSpeaker` with a `room` puts it at the room's centre 1 m above the floor (centre null → error `I can't place a speaker in that room yet.`), a seventh source → error `At most 6 sources.`; new speaker ids are `speaker-<n>`; `levelDb` clamped −30…+6; `setOpening` turns `openings.loaded` on first when it is off, and skips openings that are `meshClosed`, `opening` or `divider` kinds; `setMeshLayer` returns `value: { warning: 'Layer names are guesses from height; hiding one may remove walls.' }`. `compare` does no simulation: differences only.

- [ ] **Step 1: Write the failing test** (a recording fake `SceneEffects`)
```ts
it('changes a house surface, clears the reverb and retraces once', ...)   // calls: ['materialsChanged', 'clearReverb', 'retrace', 'measure']; scene.surfaces.floor 'tile'
it('returns before and after measurements', ...)             // before from current(), after from measure()
it('refuses a room material until rooms are tagged', ...)
it('refuses an unknown material and changes nothing', ...)   // store unchanged; no effects called
it('places a speaker at a room centre, 1 m up', ...)         // centre [1,0,2] → position [1,1,2]; id 'speaker-1'; kind and level from `sounds`
it('refuses a seventh source', ...)
it('closes all windows in a room and loads the layer first', ...)   // openingsChanged called with loaded true; closed has the room's windows only; meshClosed ones skipped
it('warns when hiding a layer', ...)
it('compares without simulating', ...)                       // echoTimeDelta, levelDeltaDb; no effects called
it('loads a scene: every effect once, then one retrace', ...)
it('resets a room to its suggested values', ...)
it('notifies subscribers with what changed', ...)            // subscribe fn gets ['surfaces']
it('survives a measure that rejects', ...)                   // ok true, after null
```
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS).
- [ ] **Step 5:** Commit: `feat: scene store and action layer`.

---

## Lane H: Sim worker (Wave 1)

Owns `app/src/sim/**`. Does not touch `app/src/config.ts`: `SimConfig` keeps its three MVP materials for `load`; the library arrives later with `setMaterials`. Each task: logic in a new pure module tested on `sim/testMeshes.ts` meshes, a `case` in `worker.ts`, and the type in `types.ts`.

### Task H1: Contract, material library and quality

**Files:** Modify `app/src/sim/types.ts`, `worker.ts`, `load.ts`, `materials.ts`, and where the tracer reads `config.materials`; Create `app/src/sim/library.ts`; Test `app/src/sim/library.test.ts`, `types.test.ts`

**Interfaces — Produces:** in `types.ts`, the `ToWorker` and `FromWorker` additions of spec section 8, verbatim, plus `mesh.layers: Uint8Array` and `lineLayers: Uint8Array` on `ready` (H2 fills them; here all zeros). And:
```ts
// library.ts
export type SurfaceTable = { library: Material[]; surfaces: [number, number, number, number]; furnishing: number;
  roomSurfaces: Map<number, [number, number, number]>; roomFurnishing: Map<number, number> };   // keyed by room index
export function surfaceClass(materialTag: number, exterior: boolean): 0 | 1 | 2 | 3;      // wall, floor, ceiling, exterior wall
export function materialOf(table: SurfaceTable, cls: 0 | 1 | 2 | 3, room: number): { material: Material; furnishing: number };
export function effectiveAbsorption(m: Material, furnishing: number): Bands;              // min(α + f, 0.99) per band
export function applySetMaterials(state: SimState, msg: Extract<ToWorker, { type: 'setMaterials' }>): void;
export function applySetQuality(state: SimState, msg: Extract<ToWorker, { type: 'setQuality' }>): void;
```
`SimState` gains `surfaceClass: Uint8Array` (per triangle, from `tagMaterials`, kept from load), `room: Int16Array` (−1 everywhere until H4), `exterior: Uint8Array` (0 until H4), `table: SurfaceTable` (built at load from `config.materials` so an untouched scene traces exactly as the MVP). Every place the tracer and the reverb job look up a triangle's material goes through `materialOf` and `effectiveAbsorption`. A `setMaterials` whose index is outside `library` → an `error` message, state unchanged.

- [ ] **Step 1: Write the failing test**
```ts
it('traces the same as before with no setMaterials', ...)        // trace.mesh.test baseline numbers unchanged
it('caps absorption plus furnishing at 0.99', () => expect(effectiveAbsorption({ absorption: [0.4, 0.85, 0.9], scattering: 0.4, blockingDb: [25, 35, 45] }, 0.15)).toEqual([0.55, 0.99, 0.99]));
it('a tiled box rings longer than a carpeted one', ...)          // testMeshes box: reverbJob echoTime[1] with floor→tile > with floor→carpet
it('rejects an index outside the library and keeps the old table', ...)
it('setQuality changes the rays used', ...)                      // raysPerTrace 1000 → state.config.raysPerTrace 1000, bounces 3, reverbRays 800
it('room values override house values for that room only', ...)  // materialOf with roomSurfaces set
```
- [ ] **Step 2–4:** Run `npm run test -w app -- src/sim` (FAIL), implement, run with typecheck (PASS).
- [ ] **Step 5:** Commit: `feat: worker material library and quality presets`.

### Task H2: Mesh layers

**Files:** Modify `app/src/sim/obj.ts`, `load.ts`, `geometry.ts`, `edges.ts`, `worker.ts`; Create `app/src/sim/layers.ts`; Test `app/src/sim/layers.test.ts`, `obj.test.ts`

**Interfaces — Produces:** `parseObj` returns `Mesh & { groups: string[]; triangleGroup: Uint8Array }` (group 0 is `'house'`: faces before any `g` line; then each distinct `g` name in order of appearance). After `buildRayIndex` reorders the triangles, `load.ts` builds `state.layer: Uint8Array` per triangle in the new order (the BVH reorders indices, so map each new triangle back by its three vertex indices or reorder alongside: test it). `ready.layers: { id: string; triangles: number }[]`, `ready.mesh.layers`, `ready.lineLayers` (the layer of the triangle each blueprint line came from).
```ts
export function applySetLayers(state: SimState, msg: Extract<ToWorker, { type: 'setLayers' }>): void;   // state.layerTraced: boolean[]
export function firstTracedHit(state: SimState, origin: Vec3, dir: Vec3, maxDist?: number): Hit | null;   // skips triangles of untraced layers
```
When every layer is traced, `firstTracedHit` is the existing `firstHit` call with no extra work. Otherwise it continues the ray past skipped triangles (restart just beyond the hit) up to 64 skips. All ray casts in `trace`, `direct`, `early`, `reverb`, `crossings` use it.

- [ ] **Step 1: Write the failing test**
```ts
it('reads groups and keeps ungrouped faces as house', ...)       // 'v…\nf 1 2 3\ng type002\nf 1 2 4\n' → groups ['house','type002'], triangleGroup [0,1]
it('keeps layer numbers right after the index reorders triangles', ...)   // two far-apart boxes in different groups: every triangle's layer matches its position's box
it('counts triangles per layer in ready', ...)
it('a ray passes through an untraced layer', ...)                // wall in layer 1 between origin and far wall: traced → hits near wall; untraced → hits far wall
it('leaves the hit unchanged when all layers are traced', ...)
it('tags each blueprint line with a layer', ...)
```
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS). Then load the real mesh once in a test marked like `reverb.mesh.test.ts` and log load time: it must stay within 10% of the 782 ms recorded in AGENTS.md.
- [ ] **Step 5:** Commit: `feat: mesh layers from OBJ groups`.

### Task H3: Measure

**Files:** Create `app/src/sim/measure.ts`; Modify `worker.ts`; Test `app/src/sim/measure.test.ts`

**Interfaces — Produces:** `export function measure(state: SimState, msg: Extract<ToWorker, { type: 'measure' }>): Extract<FromWorker, { type: 'measure' }>;` — one `trace` at `point` for `sources`, one `reverbJob` for `roomId` at `point`; `levelDb` per source and band = `10·log10(direct + Σ slot energy + lateEnergy)` with a floor of −120; `walls` from the trace. It does not change `lastEstimate`.

- [ ] **Step 1: Write the failing test**
```ts
it('returns an echo time and a level per source', ...)           // box mesh, one source 2 m away: echoTime[1] within (0.2, 2.5); levelDb[1] finite and < 0
it('a source behind a wall is quieter and counts the wall', ...) // two-room mesh: walls 1, levelDb lower than the open case
it('floors silence at −120 dB', ...)
it('answers with the request id', ...)
```
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS).
- [ ] **Step 5:** Commit: `feat: worker measure`.

### Task H4: Rooms per triangle

**Files:** Create `app/src/sim/rooms.ts`; Modify `worker.ts`, `library.ts`; Test `app/src/sim/rooms.test.ts`

**Interfaces — Produces:**
```ts
export function pointInPolygon(x: number, z: number, polygon: [number, number][]): boolean;
export function roomAt(rooms: RoomGeom[], p: Vec3): number;        // index or −1; spec 4.4: inside the polygon and floorY − 0.3 ≤ y ≤ floorY + height + 0.3; several match → the highest floorY at or below y
export function tagRooms(state: SimState, msg: Extract<ToWorker, { type: 'setRooms' }>): Extract<FromWorker, { type: 'roomsReady' }>;
```
Per triangle (spec 4.4, "Which triangles get which value"): the test point is the centre moved 0.2 m along the face normal; `state.room[t] = roomAt(point)`; a wall triangle whose point is in a room and whose point 0.6 m behind the face is in no room gets `state.exterior[t] = 1`. `roomsReady` reports triangles per room, `untagged`, `exteriorWalls`, `ms`. `setMaterials` messages carry `roomId` strings: `applySetMaterials` maps them to indices through the rooms last set (unknown ids ignored).

- [ ] **Step 1: Write the failing test**
```ts
it('point in polygon', ...)                                      // square: inside, outside, concave L-shape
it('picks the room on the right floor', ...)                     // two stacked squares, floorY 0 and 3: y 1 → lower, y 4 → upper, y 2.9 → lower
it('tags both sides of a shared wall to the room each faces', ...)   // two-room mesh: the dividing wall's faces go to different rooms
it('marks outside-facing walls as exterior', ...)                // box: all four walls exterior; the two-room divider not
it('leaves triangles outside every room untagged', ...)          // a far-away triangle → untagged 1
it('gives each room its own floor material', ...)                // setMaterials roomSurfaces → materialOf differs per room
```
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS).
- [ ] **Step 5:** Commit: `feat: tag triangles with rooms and exterior walls`.

### Task H5: Door and window panels

**Files:** Create `app/src/sim/openings.ts`; Modify `worker.ts`, `layers.ts` (the hit function consults the panel index); Test `app/src/sim/openings.test.ts`

**Interfaces — Produces:**
```ts
export function panelMesh(openings: OpeningGeom[]): { mesh: Mesh; panelOfTriangle: Uint16Array };   // each opening a box max(thickness, 0.04) deep: 12 triangles
export function loadOpenings(state: SimState, msg: Extract<ToWorker, { type: 'loadOpenings' }>): Extract<FromWorker, { type: 'openingsReady' }>;
export function applySetOpenings(state: SimState, msg: Extract<ToWorker, { type: 'setOpenings' }>): void;
```
Spec 7.4: a second small ray index; every cast tests both and keeps the nearer hit; hits on a panel that is open (or `meshClosed`) are skipped; panels use material `glass` (windows) or `door` (doors), found by name through two indices the `setMaterials` message's library order makes known: add `glassIndex` and `doorIndex`, optional numbers, to `setMaterials` in `types.ts` (the page fills them; default: the MVP wall). A panel counts as one wall for `maxLegWalls`. `meshClosed`: a ray through the opening's centre along its normal, started `thickness/2 + 0.05` before it, hits the main mesh within `thickness + 0.1`. `openingsReady.lines`: the four edges of each panel's outline, as point pairs, for the blueprint.

- [ ] **Step 1: Write the failing test**
```ts
it('builds 12 triangles per opening and at least 4 cm deep', ...)
it('an open doorway lets the direct sound through; closed blocks it', ...)   // two-room mesh with a gap: direct[1] closed < open, walls 1 vs 0
it('never rebuilds the main index', ...)                         // state.index is the same object after loadOpenings and setOpenings
it('reports an opening the mesh already closes', ...)            // a panel placed on a solid wall → meshClosed true, and closing it changes nothing
it('returns outline lines', ...)                                 // 2 openings → lines.length 2 × 4 × 6
it('uses glass for windows and door for doors', ...)
```
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS).
- [ ] **Step 5:** Commit: `feat: closable door and window panels in the worker`.

---

## Lane I: Server (Wave 2)

Owns `server/src/v2/**`. Consumes V3's `PiSource` (`server/src/quick/pi.ts`), `Search['lookup']`, `errors.ts`, `ids.ts`, and `server/src/shared/materials.ts`.

### Task I1: Openings and room geometry

**Files:** Create `server/src/v2/geometry.ts`, `server/src/v2/routes.ts`; Modify `server/src/index.ts` (mount `v2Router`); Test `server/test/v2-geometry.test.ts`

**Interfaces — Produces:**
```ts
export type PiOpening = { id: string; kind: 'window' | 'door' | 'opening' | 'divider'; roomId: string; roomName: string;
  a: [number, number]; b: [number, number];      // the opening's two ends on its wall, PI frame (2D, metres)
  bottom: number; height: number; thickness: number };            // bottom: metres above the PI zero
export type PiRoomGeom = { id: string; name: string; floor: string; area: number; floorZ: number; height: number; polygon: [number, number][] };
export type GeometryAnswer = { rooms: PiRoomGeom[]; openings: PiOpening[] };
export function geometryOf(model: PiModel): GeometryAnswer;       // pure
export function v2Router(deps: { pi: PiSource; lookup: Search['lookup']; allowedIds: Set<string>; env: Record<string, string | undefined>; cacheDir: string; client?: unknown }): express.Router;
```
`GET /api/openings/:id` → `GeometryAnswer` (id checked as every V3 route; a `PiSource` rejection → `sendNotPossible`). Rules (spec 7.1): `doorway` → `door`; the opening's ends from the edge's vertices, `relativeCenter` and `width`; a window with no `lowerElevation` sits 0.9 m above its room's floor; a door with no `height` is 2.0 m; `height` 0 rooms get 2.7; rooms with no polygon are left out. Coordinates stay in the PI frame: the page converts them (Lane Y, after the alignment check).

- [ ] **Step 1: Write the failing test**
```ts
it('places an opening along its edge', ...)                 // edge (0,0)→(4,0), relativeCenter 0.5, width 1 → a (1.5,0), b (2.5,0)
it('maps doorway to door and keeps opening and divider', ...)
it('defaults a window sill to 0.9 m and a door height to 2.0 m', ...)
it('builds a closed polygon per room in edge order', ...)
it('leaves out rooms without a boundary', ...)
it('serves the answer and refuses an unknown id', ...)      // supertest: 200 with rooms; 404 unknown_model
it('passes a Matterport outage through as not possible', ...)   // 502, code matterport_unreachable
```
- [ ] **Step 2–4:** Run `npm run test -w server -- test/v2-geometry.test.ts` (FAIL), implement, run (PASS).
- [ ] **Step 5:** Commit: `feat: openings and room geometry route`.

### Task I2: Suggested materials

**Files:** Create `server/src/v2/defaults.ts`, `scripts/extract-listing.mjs`; Modify `server/src/v2/routes.ts`; Test `server/test/v2-defaults.test.ts`

**Interfaces — Produces:**
```ts
export function tableDefaults(rooms: PiRoomGeom[], classesOf: (roomId: string) => { label: string; confidence: number }[], facts: string[]): MaterialDefaults;   // spec 4.4 room-type table; several classes → blended by confidence; exterior 'siding_wall', or 'brick_veneer' when a fact names brick
export const PROPOSE_DEFAULTS_TOOL: Anthropic.Tool;        // spec 4.4 "The LLM step" item 3; strict; material is an enum of library keys
export function checkProposal(input: unknown, table: MaterialDefaults): MaterialDefaults;   // item 5: unknown rooms dropped, weights normalised, parts < 0.1 dropped, at most 3 parts, a room with no valid answer keeps its table row; source 'llm'
export async function suggestDefaults(deps, modelId: string, refresh: boolean): Promise<MaterialDefaults>;
```
`MaterialDefaults` is the type from `app/src/scene/state.ts`, re-declared in `server/src/shared/materials.ts`'s neighbour file `server/src/shared/defaults.ts` by this task and imported by both (Lane Y points the app's copy at it). `GET /api/defaults/:id[?refresh=1]`: cached `server/cache/defaults-<id>.json` → return; else table → Claude (`claude-haiku-5-5`, effort low, the one tool, the instruction of item 4) → `checkProposal` → cache → return. No key, an API error, a refusal, or no tool call → the table with `source: 'table'`, not cached. Building facts: `npm run extract-listing -- <modelId>` streams `residential-listing-features.jsonl` and writes `server/cache/listing-<id>.json` with the lines under **Home Design**, **Flooring** and **Interior Spaces** only, each cut to 60 characters and to letters, digits, spaces and hyphens; without that file the index row's `facts` are used. Photo captions (spec 4.4 inputs, row 4) are **not** used: they are free text, which the V3 constraints keep away from the LLM. Add the root script `"extract-listing": "node scripts/extract-listing.mjs"`.

- [ ] **Step 1: Write the failing test**
```ts
it('gives a kitchen tile and a bedroom carpet from the table', ...)
it('blends a kitchen-dining room by confidence', ...)        // classes kitchen 0.6, dining 0.4 → floor parts tile 0.6, wood_floor 0.4
it('turns a brick fact into brick_veneer', ...)
it('accepts a valid proposal and marks it llm', ...)
it('drops unknown rooms, tiny parts and extra parts, and normalises', ...)
it('keeps the table row for a room the model got wrong', ...)   // material 'lava' → that room equals the table's
it('falls back to the table without a key and does not cache', ...)
it('falls back on a refusal', ...)                           // fake client stop_reason 'refusal'
it('caches an llm answer and reuses it', ...)                // second call: client not called
it('recomputes on refresh', ...)
it('sends no free text to the model', ...)                   // the request JSON does not contain the fixture's remarks string
```
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS). With real keys: `curl localhost:8787/api/defaults/Ki9YdfpNKum` suggests `tile` for the kitchen floor with a reason naming "Tile Flooring" (after `npm run extract-listing -- Ki9YdfpNKum`).
- [ ] **Step 5:** Commit: `feat: suggested materials per room`.

### Task I3: The Jev relay

**Files:** Create `server/src/v2/jev.ts`, `server/src/v2/jev-prompt.ts`; Modify `server/src/v2/routes.ts`, `server/src/app.ts` (a second `AppOptions.wideRouters`, mounted before the 4 kB JSON limit with its own `express.json({ limit: '256kb' })`); Test `server/test/v2-jev.test.ts`

**Interfaces — Produces:** `POST /api/jev` body `{ messages: MessageParam[]; tools: Tool[] }` → the Claude response JSON as is (spec 6.1: the loop runs in the browser; the relay keeps no state). The server adds `model`, `max_tokens: 16000`, `output_config: { effort: 'low' }`, `thinking: { type: 'adaptive' }`, and `system: [{ type: 'text', text: JEV_PROMPT, cache_control: { type: 'ephemeral' } }]`; it ignores any `model` or `system` in the body. Checks before calling: `messages` an array of 1–60 entries; `tools` an array of at most 12 whose names are all in the fixed set of spec 6.5 (`measure`, `compare`, `set_material`, `set_furnishing`, `set_opening`, `place_speaker`, `move_speaker`, `set_speaker`, `remove_speaker`, `move_user_to`, `set_mesh_layer`) → else 400 `bad_request`. No key → 503 `ai_unavailable`. API errors → 502 with `agent_failed`, never the key. `JEV_PROMPT`: spec 6.6 (what Jev is, the five acoustic rules, the permission wording of 6.3 step 4), fixed text.

- [ ] **Step 1: Write the failing test**
```ts
it('adds the model, the settings and the cached system prompt', ...)   // fake client params: model 'claude-haiku-5-5', effort 'low', system[0].cache_control
it('ignores a model or system sent by the browser', ...)
it('returns the response unchanged', ...)
it('refuses a tool outside the fixed set', ...)             // name 'run_shell' → 400 bad_request; client not called
it('refuses too many messages', ...)
it('answers ai_unavailable without a key', ...)
it('hides the key in an API error', ...)
it('accepts a 100 kB body', ...)                            // not rejected by the 4 kB limit
```
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS).
- [ ] **Step 5:** Commit: `feat: Jev relay`.

---

## Lane J: Tour wiring and speakers (Wave 2)

Owns `app/src/tour/**`, `app/src/blueprint/**`, `app/index.html`. Starts from V3's merged `tour/start.ts` and audio engine.

### Task J1: The scene in the tour

**Files:** Create `app/src/tour/scene-wiring.ts`; Modify `app/src/tour/start.ts`, `app/index.html` (an `<aside id="panel">` and `<div id="jev">` beside `#stage`, inside `#tour`); Test `app/src/tour/scene-wiring.test.ts`

**Interfaces — Consumes:** Lane G's `createStore`, `createActions`, `SceneEffects`, `setMaterialsMessage`, `loadAutosave`, `saveAutosave`, `startPanel`, `startJev`; Lane H's messages; V3's `AudioEngine.setSources`, `SOUNDS`, `surroundingSources`. **Produces:**
```ts
export function mergeSources(outside: SourceSpec[], scene: SceneSource[]): SourceSpec[];   // outside first, then enabled scene sources, at most 6: scene sources are dropped last-first when over
export function createEffects(tour: TourHandles): SceneEffects;
export type TourHandles = { post(msg: ToWorker): void; engine(): AudioEngine | null; retrace(): void; clearReverb(): void;
  measure(req: Omit<Extract<ToWorker, { type: 'measure' }>, 'type' | 'id'>): Promise<Extract<FromWorker, { type: 'measure' }>>;
  latest(): { trace: Extract<FromWorker, { type: 'trace' }> | null; echoTime: Bands | null; estimated: boolean };
  listener(): { position: Vec3; roomId: string | null } | null; sweepNear(point: Vec3): string | null; moveToSweep(id: string): Promise<void>;
  layers(): { id: string; triangles: number }[]; setShownLayers(shown: Record<string, boolean>): void };
```
`start.ts`: after the worker is `ready` — store from `loadAutosave(modelId) ?? defaultScene(modelId)`, autosave on every change; send `setQuality`, `setLayers`, `setMaterials` for the loaded scene; `startPanel` and `startJev`; when there was no autosave, `GET /api/defaults/<id>` → `actions.applyDefaults` (a failure leaves the defaults and shows nothing). The V3 outside sources stay outside the scene (they are derived, not saved): the engine and the traces get `mergeSources(outside, scene.sources)`. `measure` requests share the worker's one-job queue with listener traces (spec 6.5). A material, opening or layer change clears the reverb cache and retraces even though the listener has not moved. The blueprint hides lines and triangles of layers whose `shown` is false (`ready.lineLayers`, `ready.mesh.layers`).

- [ ] **Step 1: Write the failing test**
```ts
it('keeps outside sounds and fills up to six with speakers', ...)   // 3 outside + 5 scene → 6, the last 2 scene sources dropped
it('leaves disabled speakers out', ...)
it('sends setMaterials with glass and door indices', ...)           // post called with type 'setMaterials', glassIndex = index of 'glass'
it('turns a worker measure into a Measurement', ...)
it('reports the latest trace as the current measurement, marked estimated until the reverb job answers', ...)
it('moves the user to the sweep nearest a room centre', ...)
it('rejects a measure when the worker is not ready', ...)
```
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS). In the browser: change `scene.surfaces.floor` from the console through the actions (`__scene.actions.setMaterial(...)`, exposed in dev) → the echo changes within one trace; reload → the value is still there.
- [ ] **Step 5:** Commit: `feat: scene store wired into the tour`.

### Task J2: Add speaker by click

**Files:** Create `app/src/tour/placement.ts`; Modify `app/src/tour/start.ts`, `app/src/blueprint/view.ts` (speaker spheres come from the merged source list); Test `app/src/tour/placement.test.ts`

**Interfaces — Produces:**
```ts
export function isClick(down: { x: number; y: number; t: number }, up: { x: number; y: number; t: number }): boolean;   // < 6 px and < 300 ms
export function speakerPosition(hit: { position: Vec3; normal: Vec3 }): Vec3;      // hit + 0.3 m along the normal
export function createPlacement(deps: { target: Window; pointer(): { position: Vec3; normal: Vec3 } | null; place(point: Vec3): void; hint(text: string | null): void }): { begin(): void; cancel(): void; dropAtPointer(): boolean };
```
Spec 5.4: `begin()` shows `Click a surface. Esc cancels`, listens on `target` for `pointerdown`/`pointerup` in the capture phase; a click with a pointer hit → `preventDefault`, `stopPropagation`, `place(speakerPosition(hit))`, end; a drag passes through untouched; Esc cancels. The S key calls `dropAtPointer()` (same key guard as the P helper). `place` calls `actions.placeSpeaker({ point, sound })` with the sound chosen in the panel (default `music`). If a click still moves the tour in the real viewer, keep S only and say so in the hint.

- [ ] **Step 1: Write the failing test**
```ts
it('tells a click from a drag', () => { expect(isClick({ x: 0, y: 0, t: 0 }, { x: 3, y: 3, t: 200 })).toBe(true); expect(isClick({ x: 0, y: 0, t: 0 }, { x: 10, y: 0, t: 100 })).toBe(false); expect(isClick({ x: 0, y: 0, t: 0 }, { x: 0, y: 0, t: 400 })).toBe(false); });
it('stands the speaker 0.3 m off the wall', () => expect(speakerPosition({ position: [1, 1, 1], normal: [0, 0, 1] })).toEqual([1, 1, 1.3]));
it('places on a click and leaves placement mode', ...)
it('lets a drag through and stays in placement mode', ...)        // no preventDefault, place not called
it('places nothing when there is no surface under the cursor', ...)
it('cancels on Escape', ...)
it('S drops a speaker at the pointer', ...)
```
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS). In the browser: a speaker placed on a kitchen wall is heard from that wall and quieter from the next room.
- [ ] **Step 5:** Commit: `feat: add a speaker by clicking a surface`.

---

## Lane K: Settings panel (Wave 2)

Owns `app/src/panel/**`. Plain DOM; every control calls an action, every value is drawn from the store on `subscribe`. Tests run in jsdom with Lane G's real store and actions over a fake `SceneEffects`.

### Task K1: Scene and materials

**Files:** Modify `app/src/panel/index.ts`; Create `app/src/panel/scene-section.ts`, `materials-section.ts`, `panel.css`; Test `app/src/panel/materials.test.ts`

Spec section 9, items 1 and 2. **Scene:** Save (downloads `sceneFileName`), Load (a file input → `parseSceneFile`; an error shows in the panel), Reset, a quality select. **Materials:** a select per house surface (wall, floor, ceiling, exterior wall) listing the library; a room picker shown only when `effects.roomsTagged()`; a furnishing select (the four levels); a value still on its default shows the word `suggested` with the reason as its `title`; `Reset to suggested` for the room and for the house; the line `Material values are rough estimates.` Blends never appear in a select: a surface on a blend shows `suggested mix` as a disabled first option. The panel collapses with a button.

- [ ] **Step 1: Write the failing test**
```ts
it('changing the floor select calls setMaterial', ...)
it('shows "suggested" with the reason until the value is changed', ...)
it('hides the room picker until rooms are tagged', ...)
it('shows a load error and keeps the scene', ...)             // a file for another property → the error text; store unchanged
it('redraws when the store changes from elsewhere', ...)      // actions.setMaterial called directly → the select shows the new value
it('lists only library materials', ...)                       // no option starts with 'blend:'
```
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS).
- [ ] **Step 5:** Commit: `feat: settings panel, scene and materials`.

### Task K2: Sources, openings, layers, permissions

**Files:** Create `app/src/panel/sources-section.ts`, `openings-section.ts`, `layers-section.ts`, `permissions-section.ts`; Modify `index.ts`; Test `app/src/panel/sections.test.ts`

Spec section 9, items 3–6. **Sources:** one row per scene speaker (label, sound select from the library, level −30…+6 dB, on/off, Move, Remove), an `Add speaker` button with a sound select (it dispatches a `panel:add-speaker` `CustomEvent` on the root with the sound; Lane J listens), and an upload input (`.mp3`, `.ogg`, `.wav`) kept as a blob URL for the session. **Openings:** a `Load doors and windows` toggle, then the list by room with open/closed switches, `Close all windows`, `Close all doors`; `meshClosed` ones are shown disabled as `already closed in the scan`. **Layers:** traced and shown per layer with triangle counts and the line `Layer names are guesses from height. Hiding one may remove walls.` **Permissions:** the table of spec 6.2 as GET and PUT switches, one row per material and per layer where the spec says so. A row whose state Jev changed flashes (a CSS class for 1 s) when the store's `changed` names it.

- [ ] **Step 1: Write the failing test**
```ts
it('lists speakers and changes a level', ...)
it('asks the tour to place a speaker', ...)                   // click Add → 'panel:add-speaker' event with detail.sound
it('closes all windows through the action', ...)
it('disables openings the scan already closes', ...)
it('toggles a layer and shows its triangle count', ...)
it('turning a PUT switch off updates the permissions', ...)   // store.get().permissions.put.windows false
it('flashes the row a change touched', ...)
```
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS). In the browser: every section works by keyboard; the panel does not cover the tour at 1280 px wide.
- [ ] **Step 5:** Commit: `feat: settings panel, sources, openings, layers and permissions`.

---

## Lane L: Jev client (Wave 2)

Owns `app/src/jev/**`. Read the `claude-api` skill's `typescript/claude-api/tool-use.md` for the message shapes.

### Task L1: Tools and the executor

**Files:** Create `app/src/jev/tools.ts`, `app/src/jev/executor.ts`; Test `app/src/jev/tools.test.ts`

**Interfaces — Consumes:** `allowedActions`, `allowedMaterials`, `refusal`, `Actions`. **Produces:**
```ts
export function toolsFor(p: Permissions, ctx: { sounds: string[]; rooms: string[]; layers: string[] }): Tool[];   // spec 6.5; strict; only allowed actions; set_material.material enum = allowedMaterials(p)
export async function execute(call: { id: string; name: string; input: unknown }, deps: { store: SceneStore; actions: Actions; effects: SceneEffects }): Promise<{ type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }>;
```
`execute` reads the permissions from the store at call time (not from when the tools were built), validates the input shape, calls the action, and returns its result as JSON (before/after numbers rounded to 2 decimals, dB to 1). A refused call: `is_error: true`, content `Not allowed: turn on PUT for <row> in Settings.`

- [ ] **Step 1: Write the failing test**
```ts
it('sends only allowed tools', ...)                           // defaults: no move_user_to, no set_mesh_layer
it('lists only materials whose PUT is on', ...)
it('declares strict schemas with every key required', ...)
it('runs a call through the action layer', ...)               // set_furnishing → actions.setFurnishing called; content has before and after
it('refuses a call whose permission was turned off after the tools were sent', ...)   // is_error true, 'Not allowed: turn on PUT for Windows in Settings.'; action not called
it('refuses an unknown tool and malformed input', ...)
it('returns an action error as is_error', ...)
```
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS).
- [ ] **Step 5:** Commit: `feat: Jev tools and permission-checked executor`.

### Task L2: The scene summary

**Files:** Create `app/src/jev/summary.ts`; Test `app/src/jev/summary.test.ts`

**Interfaces — Produces:** `export function sceneSummary(scene: SceneState, effects: SceneEffects): object;` — spec 6.4, built from GET rows only: a row whose GET is off is absent (the key is not there), never blanked. Holds: the listener's room and position and the room list (`locations`, `userLocation`); per source its distance, walls, direct level per band in dB and summed echo energy (`speakers`, `measurements`); the echo time per band with `estimated: true|false` (`measurements`); surfaces, furnishing and, for a surface still on its default, the reason (`materials`, `furnishing`); openings by kind (`windows`, `doors`); layers (`mesh`); and `off: offRows(permissions)`. Numbers rounded as in L1.

- [ ] **Step 1: Write the failing test**
```ts
it('includes everything with the default permissions', ...)
it('leaves a row out when its GET is off', ...)               // get.windows false → no window entries; 'Windows' in off.get
it('carries the default reason for an untouched surface', ...)
it('marks the echo time as estimated until the reverb job answers', ...)
it('has no listener when user location GET is off', ...)
it('stays under 4 kB for a 20-room house with 6 sources', ...)
```
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS).
- [ ] **Step 5:** Commit: `feat: Jev scene summary`.

### Task L3: The loop, the chat and voice

**Files:** Modify `app/src/jev/index.ts`; Create `app/src/jev/loop.ts`, `app/src/jev/voice.ts`, `app/src/jev/jev.css`; Test `app/src/jev/loop.test.ts`, `voice.test.ts`

**Interfaces — Produces:**
```ts
export async function ask(text: string, convo: MessageParam[], deps: { store: SceneStore; actions: Actions; effects: SceneEffects; fetch?: typeof fetch; onStep?(text: string): void }): Promise<{ reply: string; convo: MessageParam[] }>;
export function pushToTalk(deps: { recognition: () => SpeechRecognitionLike | null; onText(text: string, final: boolean): void }): { start(): void; stop(): void; available: boolean };
```
`ask` (spec 6.1): append a user message whose content is the text followed by the JSON scene summary; POST `/api/jev` with `{ messages, tools: toolsFor(...) }`; `stop_reason === 'refusal'` → reply `I can't help with that request.`; append `response.content` unchanged; on `tool_use`, `execute` every call and send all results in one user message; loop until `end_turn`, at most 8 requests, then `I couldn't finish that.`; a failed request → `Jev is not available right now. The settings panel can do the same things.` Tools and the summary are rebuilt on every request, so a toggle changed mid-loop takes effect. The chat: a transcript list (`aria-live`), a text box, Send, a mic button; replies end with `(estimate)` wherever a number appears only if the model didn't say so — do not post-process: the prompt requires it. Voice (spec 6.1): hold V or the mic button; interim text fills the box; release sends; no `SpeechRecognition` → the mic button is disabled with the title `Voice needs Chrome`. No text-to-speech.

- [ ] **Step 1: Write the failing test**
```ts
it('answers a question without tools', ...)                   // fake fetch: end_turn → reply
it('runs tool calls and sends all results in one message', ...)
it('sends the scene summary with each user turn', ...)        // last user message content includes '"off"'
it('rebuilds the tool list each request', ...)                // a tool call turns windows PUT off → the next request has no set_opening
it('reports a refusal', ...)
it('stops after eight requests', ...)
it('says Jev is unavailable when the relay fails', ...)       // 503
it('fills the box while speaking and sends on release', ...)  // fake recognition: interim, then final on stop
it('is unavailable without SpeechRecognition', ...)
```
- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS). In the browser: "Why is it echoey here?" gets an answer citing this room's echo time; with Materials PUT off Jev only suggests, turned on it changes the walls and reports before/after (spec section 10, steps 5 and 6).
- [ ] **Step 5:** Commit: `feat: Jev chat with tools and voice`.

---

## Lane Y: Integration (Wave 3)

One agent, in order. Owns everything.

### Task Y1: Merge, and replace the duplicated types

- [ ] **Step 1:** All lanes merged: `npm install && npm test && npm run typecheck`. Expected: PASS.
- [ ] **Step 2:** Replace the declared-twice types with one import each: `SceneSource` → V3's `SourceSpec`; Lane G's local `SetMaterials` → `Extract<ToWorker, { type: 'setMaterials' }>`; the app's `MaterialDefaults` → `server/src/shared/defaults.ts`. Typecheck proves they were identical; where they were not, fix the consumer, with a test.
- [ ] **Step 3:** Uploaded sounds: widen the engine's `SourceSpec.sound` to `SoundId | `blob:${string}``; a `blob:` value is loaded from that URL as a `point` source at 0 dB. Test in `engine.test.ts`: a blob source gets a voice; a scene loaded from a file whose speaker used an upload falls back to `music` and the panel says so (spec 3.1).
- [ ] **Step 4:** Commit: `refactor: single source for shared V2 types, uploaded sounds`.

### Task Y2: The alignment gate (spec 7.2)

**Files:** Create `app/src/tour/pi-frame.ts`; Modify `app/src/blueprint/view.ts`, `app/src/tour/start.ts`; Test `app/src/tour/pi-frame.test.ts`

**Interfaces:**
```ts
export type PiTransform = { rotationDeg: number; offset: [number, number]; zeroY: number };       // default { 0, [0, 0], 0 }
export function piToViewer(p: [number, number], z: number, t: PiTransform): Vec3;                  // rotate, offset, then (x, y, z) → (x, z, −y)
export function openingGeom(o: PiOpening, t: PiTransform): OpeningGeom;                            // four corners in viewer coordinates
export function roomGeom(r: PiRoomGeom, t: PiTransform): { id: string; floorY: number; height: number; polygon: [number, number][] };
```
- [ ] **Step 1:** Tests: `piToViewer([1, 2], 3, identity)` equals `[1, 3, -2]`; a 90° rotation; `openingGeom` gives four corners spanning width × height at the right height; a room polygon keeps its vertex order.
- [ ] **Step 2:** Implement; draw every opening outline and room polygon in the blueprint behind a dev toggle (`__blueprint.showPi(true)`).
- [ ] **Step 3:** On the demo house, compare with the mesh's doorways and walls. If they are shifted or rotated, find the transform from two or three doorways and store it in `config.ts` as `PI_TRANSFORM`. Check one more property (a home from the V3 gate list): the same transform must fit, or the transform is per model and must be found another way.
- [ ] **Step 4:** Record the result in AGENTS.md "Facts verified by test". Commit.
- [ ] **Step 5:** **If no fit is found, stop and tell the user:** per-room materials (Y3) and closed openings (Y4) are not possible (spec section 11, first risk). The rest of V2 stands; skip to Y5.

### Task Y3: Per-room materials and defaults

- [ ] **Step 1:** `start.ts`: after `GET /api/openings/<id>`, send `setRooms` with `roomGeom` for every room; on `roomsReady`, set `roomsTagged` true, re-apply the defaults with `perRoom: true` when the scene is still on its defaults, and send `setMaterials` with room data. `effects.rooms()` gets each room's centre (the polygon's centroid at `floorY`).
- [ ] **Step 2:** Test (`scene-wiring.test.ts`): `roomsReady` flips `roomsTagged`, and the next `setMaterials` carries `roomSurfaces`.
- [ ] **Step 3:** On the demo house, check the `roomsReady` counts in the console: most house triangles tagged, vegetation untagged, and the tagging time. The kitchen floor triangles carry the kitchen blend; the brick exterior makes the outside loop quieter indoors than `siding_wall` does. Record counts and the time in AGENTS.md.
- [ ] **Step 4:** Commit: `feat: per-room materials and defaults`.

### Task Y4: Closing doors and windows end to end

- [ ] **Step 1:** `effects.openingsChanged`: on first load, `loadOpenings` with `openingGeom` for every window and door; store `meshClosed` from `openingsReady`; draw the outlines in the blueprint; then `setOpenings` with the closed ids; clear the reverb cache; retrace.
- [ ] **Step 2:** Test: turning the toggle on posts `loadOpenings` once, later changes post only `setOpenings`.
- [ ] **Step 3:** In the browser: closing the window nearest the outside loop's side makes it quieter and duller indoors; "close all the windows" by voice shows the transcript and does it (spec section 10, steps 7 and 9). Probe `__sdk.PI` once and note in AGENTS.md whether it exposes openings (spec V-Q2).
- [ ] **Step 4:** Commit: `feat: closable doors and windows`.

### Task Y5: Layers, final pass and docs

- [ ] **Step 1:** In the browser: turning the vegetation layers' `shown` off removes most blueprint lines and the house is intact; turning `traced` off makes the outside loop clearer (spec section 10, step 10). If a layer turns out to hold walls, note it in AGENTS.md.
- [ ] **Step 2:** Walk spec section 10's checks 1–10 and section 11's risks. With `CLAUDE_API` unset: the table defaults load, Jev says it is unavailable, the panel does everything. With six sources: no crackle; if there is, lower `MAX_SOURCES` and note it.
- [ ] **Step 3:** Update AGENTS.md: current state, architecture (scene store, action layer, panel, Jev), commands (`extract-listing`), and mark `v2-design.md` as built with what was cut.
- [ ] **Step 4:** `npm test && npm run typecheck`. Commit: `docs: V2 state`. Then run V3 Task Z4 and use superpowers:finishing-a-development-branch.
