# MVP Step 4: Blueprint View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A "Blueprint" button outside the viewer toggles our own three.js canvas over the tour: the mesh as thin dark-blue lines on a see-through white background, seen through exactly the tour's camera. The build-step 4 check is alignment: the blueprint walls sit on the tour's walls.

**Architecture:** The worker already returns the blueprint lines in its `ready` message (step 3). The page keeps them in a `LineSegments` object in a three.js scene on a canvas the size of the viewer iframe, with `pointer-events: none`. Every `Camera.pose` update sets our camera from the pose: position and rotation for the view, and the pose's own `projection` matrix for the lens, so field of view, aspect and mode (inside, dollhouse, floor plan) match without guessing. The canvas renders only when the pose or the lines change, and not at all while hidden. Nothing runs inside the viewer.

**Tech Stack:** As step 3 (`three@0.187.0` is already in `app/`). No new dependency.

**Spec:** [docs/project/mvp-design.md](../../project/mvp-design.md), sections 7, 8, 10 (build step 4) and 11 (risks: alignment, too many lines). Step 3's plan and ledger: [2026-11-14-mvp-step3-mesh.md](2026-11-14-mvp-step3-mesh.md).

## Facts this plan builds on

- `Camera.Pose` is `{ mode, position, projection: Float32Array, rotation: Vector2, sweep }` (`docs/matterport/official/reference/camera.md`). Rotation is in degrees: `x` is pitch, `y` is yaw.
- `Conversion.worldToScreen(worldPos, cameraPose, windowSize)` returns the pixel of a world point for a pose (`docs/matterport/official/reference/conversion.md`). It is the ground truth for alignment.
- The blueprint lines are in viewer coordinates already (`(x, y, z) → (x, z, −y)` in the parser). If they do not line up, either the camera math or that conversion is wrong; Task 4 tells which.
- 135,730 lines at the design's 25°, from an open, bumpy scan (step 3 ledger). 271k line vertices is light work for a GPU; how it looks is the question.
- Assumed until Task 4 proves it: the projection array is column-major (three.js `Matrix4.fromArray` order), and the rotation is yaw about +Y then pitch about +X (three.js Euler order `'YXZ'`), with yaw 0 / pitch 0 looking along −Z.

## Global Constraints

- The canvas sits exactly on the iframe (same box), `pointer-events: none`, so the tour stays fully usable underneath.
- Look (design 7): white at 85% opacity, lines dark blue (`#1f3a93`), 1 px, no faces.
- Render on demand only: on a pose change, a lines change, a resize or when shown. Never in a loop. Never while hidden.
- One renderer, created on first show. The button is disabled until the worker has reported `ready`.
- All blueprint numbers (opacity, colour) go in `app/src/config.ts` under `BLUEPRINT`, beside the existing `SIM.blueprintEdgeAngle`.
- Dev-only debug hooks go behind `import.meta.env.DEV`, never in a production build.
- Work on branch `mvp-step4-blueprint`, cut from `main` (step 3 and its review fixes are merged).

## Review Focus

- **The projection is copied as is** and not rebuilt from a guessed field of view: dollhouse and floor plan (possibly orthographic) line up too. (Task 1 test, Task 4 check)
- **The window or the header changes size:** the canvas follows the iframe's box and the device pixel ratio; lines do not stretch. (Task 2)
- **Pose updates arrive faster than frames:** one render per animation frame at most. (Task 2 test of the scheduler)
- **Hidden blueprint costs nothing:** no renders, no renderer before the first show. (Task 2 test)
- **The sim failed to load:** the button stays disabled with a tooltip; nothing throws. (Task 3)
- **Alignment is measured, not eyeballed:** worst pixel error between our projection and `Conversion.worldToScreen` is recorded for several viewpoints and all three modes. (Task 4)

## File Structure

| File | Responsibility |
|---|---|
| `app/src/blueprint/camera.ts` | Pose → three.js camera (view from position and rotation, lens from `projection`) |
| `app/src/blueprint/schedule.ts` | At most one render per animation frame, none while hidden |
| `app/src/blueprint/view.ts` | Renderer, scene, `LineSegments`, show/hide, resize |
| `app/src/viewer.ts` | `Pose` gains `projection`; `MpSdk` gains `Conversion.worldToScreen` |
| `app/src/config.ts` | `BLUEPRINT` values |
| `app/src/main.ts`, `app/index.html` | The button, the canvas over the iframe, wiring |
| `app/src/debug.ts` | Dev-only: `window.__blueprintCheck()` alignment measurement |

---

### Task 1: Pose → camera

**Files:**
- Create: `app/src/blueprint/camera.ts`, `app/src/blueprint/camera.test.ts`
- Modify: `app/src/viewer.ts` (types only), `app/src/viewer.test.ts` (pose fixtures gain `projection`)

**Interfaces:**
- `Pose` gains `projection: Float32Array | number[]` (16 values).
- `applyPose(camera: PerspectiveCamera, pose: Pose): void`: sets `position`, `rotation` (order `'YXZ'`, `y = yaw°`, `x = pitch°` in radians), `projectionMatrix.fromArray(pose.projection)` and its inverse, then `updateMatrixWorld()`. The camera's own `fov`/`aspect` are never used; nothing may call `updateProjectionMatrix()` on it.
- `forwardOf(pose: Pose): Vec3`: the unit direction the camera looks along (for tests and the audio listener in step 5).

- [ ] **Step 1: Write the failing tests** (`camera.test.ts`):
  1. The projection matrix's elements equal the pose's 16 values, in order, and its inverse times it is the identity (within 1e-9).
  2. Yaw 0, pitch 0 looks along −Z: `forwardOf` is `[0, 0, -1]`.
  3. Yaw 90 looks along −X; pitch +30 looks up (`forward.y = 0.5`).
  4. A world point straight ahead of a posed camera projects to normalised device coordinates (0, 0) with a real perspective matrix (build one with `new PerspectiveCamera(70, 1.5, 0.1, 100).projectionMatrix.toArray()` as the pose's projection).
  5. `applyPose` twice with different poses leaves only the second (no accumulation).

- [ ] **Step 2: Run them to verify they fail.** `npm run test -w app` → FAIL, missing module.

- [ ] **Step 3: Implement** `camera.ts` as specified. Keep the convention in two named constants (`EULER_ORDER = 'YXZ'`, `YAW_SIGN = 1`) so Task 4 can flip them in one place.

- [ ] **Step 4: Run tests and types.** `npm run test -w app && npm run typecheck -w app` → all pass.

- [ ] **Step 5: Commit.** `feat: camera from the tour's pose`

---

### Task 2: The blueprint view

**Files:**
- Create: `app/src/blueprint/schedule.ts`, `app/src/blueprint/schedule.test.ts`, `app/src/blueprint/view.ts`
- Modify: `app/src/config.ts`

**Interfaces:**
- `config.ts`: `export const BLUEPRINT = { background: '#ffffff', opacity: 0.85, lineColor: '#1f3a93' };`
- `createScheduler(render: () => void, raf = requestAnimationFrame): { request(): void; setVisible(v: boolean): void }`: `request()` while visible queues one frame (repeat calls before it fires do nothing); while hidden it only remembers the request; `setVisible(true)` renders once on the next frame.
- `createBlueprint(canvas: HTMLCanvasElement): { setLines(lines: Float32Array): void; setPose(pose: Pose): void; setVisible(v: boolean): void; resize(width: number, height: number, pixelRatio: number): void; dispose(): void }`.

- [ ] **Step 1: Write the failing tests** (`schedule.test.ts`, with a fake `raf` that collects callbacks):
  1. Ten `request()` calls while visible → one queued frame → one render.
  2. `request()` while hidden → no frame queued; `setVisible(true)` → one render.
  3. `setVisible(false)` with a frame queued → the frame fires but does not render.
  4. A request made inside a render queues a fresh frame (no lost update).

- [ ] **Step 2: Run them to verify they fail.**

- [ ] **Step 3: Implement.**
  - `schedule.ts` as specified.
  - `view.ts`: the `WebGLRenderer` (`{ canvas, alpha: true, antialias: true }`) is created on the first `setVisible(true)`. Clear colour `BLUEPRINT.background` at `BLUEPRINT.opacity`. One `LineSegments(BufferGeometry, LineBasicMaterial({ color: BLUEPRINT.lineColor }))`; `setLines` replaces the geometry's position attribute and disposes the old one; set `frustumCulled = false` (the bounds are the whole house, and culling saves nothing). `setPose` calls `applyPose` and requests a render. `resize` calls `renderer.setPixelRatio` and `setSize(width, height, false)` and requests a render. Not unit-tested (needs WebGL); Task 4 checks it live.

- [ ] **Step 4: Run tests and types.** All pass.

- [ ] **Step 5: Commit.** `feat: blueprint view that renders on demand`

---

### Task 3: Button, canvas and wiring

**Files:**
- Modify: `app/index.html`, `app/src/main.ts`

- [ ] **Step 1: Layout.** Wrap the iframe in `<div id="stage">` (`position: relative; flex: 1; min-height: 0`). Inside it, after the iframe, `<canvas id="blueprint" hidden>` with `position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none`. In the header, `<button id="blueprint-toggle" disabled title="Loading the mesh…">Blueprint</button>`, styled to fit the 28 px bar.

- [ ] **Step 2: Wiring in `main.ts`.**
  - On sim `ready`: `blueprint.setLines(ready.lines)`, enable the button, clear its tooltip. On sim failure: keep it disabled, tooltip `Blueprint needs the mesh: <message>`.
  - The existing `Camera.pose` subscription also calls `blueprint.setPose(pose)`. Remember the latest pose so the first show draws straight away.
  - Button click toggles `canvas.hidden`, `blueprint.setVisible(...)`, `aria-pressed`, and the label (`Blueprint` / `Tour`). Key `B` does the same when focus is not in an input.
  - A `ResizeObserver` on `#stage` calls `blueprint.resize(w, h, devicePixelRatio)`.

- [ ] **Step 3: Run tests and types.** `npm test && npm run typecheck` → all pass.

- [ ] **Step 4: Commit.** `feat: blueprint button over the tour`

---

### Task 4: The alignment check (build-step 4 check)

**Files:**
- Create: `app/src/debug.ts`
- Modify: `app/src/main.ts` (import it under `import.meta.env.DEV`), `app/src/viewer.ts` (`MpSdk` gains `Conversion: { worldToScreen(p: {x: number; y: number; z: number}, pose: Pose, size: {w: number; h: number}): {x: number; y: number; z: number} }`)

**Interfaces:**
- `window.__blueprintCheck(samples = 200): { mode: string; samples: number; visible: number; maxPx: number; medianPx: number }`: picks `samples` line end points spread over the house, keeps those in front of the camera and on screen, projects each with our camera (to pixels in the canvas box) and with `sdk.Conversion.worldToScreen(point, pose, { w, h })`, and reports the worst and median distance in CSS pixels.

- [ ] **Step 1: Implement `debug.ts`** as specified. Pure math helper `pixelError(a, b)` and the sampler can be unit-tested; the SDK call cannot.

- [ ] **Step 2: Measure.** `npm run dev`, then drive headless Chrome through `--remote-debugging-port` (see step 3's ledger: `--dump-dom` prints nothing on this machine), with a fresh profile in the scratchpad. After the tour plays and the sim is ready, call `__blueprintCheck()`:
  1. At the start position.
  2. After `sdk.Camera.rotate(90, 0)` and `sdk.Camera.rotate(0, -30)`.
  3. After moving to two other sweeps (`sdk.Sweep.moveTo(id)` with ids from `sdk.Sweep.data`).
  4. In dollhouse (`sdk.Mode.moveTo(sdk.Mode.Mode.DOLLHOUSE)`) and floor plan.
  Expected: `maxPx ≤ 2` everywhere.
  If it is off: a constant offset or mirror points at the rotation convention (flip `YAW_SIGN`, or try order `'XYZ'`) in `camera.ts`; points that are right on one axis and wrong on another (for example everything upside down, or north and south swapped) point at the mesh coordinate conversion in `obj.ts`. Fix, add a unit test for the corrected convention, and measure again.

- [ ] **Step 3: Look at it.** Capture screenshots through CDP (`Page.captureScreenshot`) with the blueprint shown, at the start position and in dollhouse, into the scratchpad. Then open `http://localhost:5173` in a normal browser, press Blueprint, and walk around.
  Expected: blueprint walls sit on the tour's walls; the tour still responds to the mouse through the canvas; turning feels as smooth as without the blueprint.

- [ ] **Step 4: Decide the line density** (design risk "too many lines"). Compare screenshots at `blueprintEdgeAngle` 25, 40 and 60 (change `SIM` in `config.ts`, reload). Keep 25 unless the walls are hard to read; record the choice and the line count.

- [ ] **Step 5: Update `AGENTS.md`** (Current state: steps 1–4; Facts: the confirmed pose convention, the projection layout, the alignment numbers, the chosen angle) and fill the ledger below.

- [ ] **Step 6: Commit.** `feat: measure blueprint alignment against the tour`

---

## Ledger

| Item | Value |
|---|---|
| Pose convention (Euler order, yaw sign, forward at 0/0) | |
| Projection layout (column-major?) | |
| Alignment, max / median px: start, rotated, other sweeps | |
| Alignment, dollhouse / floor plan | |
| Chosen `blueprintEdgeAngle` and line count | |
| Render time per frame with the blueprint shown | |
