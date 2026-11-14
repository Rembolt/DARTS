# MVP design: ray-traced audio in a Matterport tour

Date: Nov 14, 2026. Deadline: Devpost at 8:00 AM, Sunday Nov 15. Demo is 2 minutes or less.

This document covers the MVP only. The product idea, the final goal and the test results behind the choices here
are in [acoustic-experience.md](acoustic-experience.md).

## 1. What we are building

A web app that loads one real property in the Matterport tour and lets you hear it.

| # | Feature | Done when |
|---|---|---|
| F1 | Tour | A hackathon model loads in our page and you can move around it |
| F2 | Click to spawn a speaker | In "place speaker" mode, clicking a surface puts a speaker there and it plays a song |
| F3 | Headphone audio | The song comes from the speaker's direction, gets quieter with distance and muffled behind walls |
| F4 | Echo and reverb | You hear distinct early echoes and a reverb tail that differ between a small room and a large one |
| F5 | Outdoor sound | An outdoor loop plays from every window |
| F6 | Bounce graphics | The sound paths are drawn as lines inside the tour |
| F7 | X-ray view | A black-and-white wireframe of the property shows the listener, speakers, windows and paths |

### Not in the MVP
- The AI agent and its actions (see open question Q1).
- Property search and scoring across CoStar data.
- Changing materials, furniture, or opening and closing windows and doors.
- Outdoor noise from Vexcel. The MVP uses one fixed outdoor loop.
- Decibel and echo-time numbers shown to the user.
- More than one property loaded at once, mobile, hosting on a public URL.

## 2. Architecture

```
Browser page (Vite + TypeScript)
├── Viewer        Matterport Bundle in a same-origin iframe (/bundle/showcase.html)
│                 gives: camera pose, pointer hits, a scene we can add lines to
├── App core      state: listener, sources (speakers + windows), latest simulation result
├── Sim worker    Web Worker: our copy of the mesh + ray index; answers "trace" requests
├── Audio engine  Web Audio graph on the page's AudioContext
├── Tour overlay  one line object added to the Bundle scene
└── X-ray view    our own three.js canvas

Local server (Node + Express)
├── GET /api/config                  SDK key and default model id (from .env)
├── GET /api/models/:id/mesh         downloads the defurnished OBJ from Matterport and streams it
└── GET /api/models/:id/openings     PI rooms, walls and openings as JSON
```

### Flow
1. The page asks the server for the config, the mesh and the openings.
2. The mesh goes to the worker, which builds the ray index once.
3. The viewer loads. The app subscribes to the camera pose.
4. Each window becomes an outdoor source. Clicking in "place speaker" mode adds a speaker source.
5. On a trigger (section 5.4) the app sends listener and sources to the worker.
6. The worker returns, per source: how blocked the direct line is, the strongest bounce paths, and a reverb estimate.
7. The audio engine updates its nodes. The overlay and the X-ray view redraw the paths.

### Why this split
The viewer is already slow, so nothing heavy runs inside it. Rays run in the worker against our own mesh.
Audio runs on the browser's audio thread. The viewer only gets one extra line object to draw.

## 3. Stack

| Piece | Choice | Notes |
|---|---|---|
| Build | Vite + TypeScript | No UI framework needed; plain DOM for the few buttons |
| Viewer | Matterport Bundle SDK `26.10.4_webgl-1728-g1cd7e0997a` | Tested with the hackathon key on `localhost`. Fetched by a script into `app/public/bundle/`, not committed |
| Server | Node + Express | Keeps the GraphQL token off the browser and avoids cross-origin problems with the mesh download |
| Matterport data | GraphQL at `https://api.matterport.com/api/models/graph`, HTTP Basic | Read-only |
| Rays | `three` + `three-mesh-bvh` in a Web Worker | The index makes each ray hit fast on about 116,000 triangles |
| Audio | Web Audio API only | `PannerNode` (HRTF), `BiquadFilterNode`, `DelayNode`, `GainNode`, `ConvolverNode` |
| Graphics | three.js | In the tour: built with the Bundle's own three (`context.three`). In the X-ray view: our own three |
| Not used | Babylon, Resonance Audio, React | Decided earlier; three.js and Web Audio cover it |

Secrets stay in the root `.env` (`MATTERPORT_API_KEY`, `MATTERPORT_API_TOKEN`, `MATTERPORT_SDK_KEY`). The server reads them.
The SDK key reaches the browser through `/api/config` because the viewer URL needs it; the API token never does.

### Repo layout
```
app/                 Vite project
  public/bundle/     Matterport Bundle (git-ignored, fetched by script)
  public/audio/      song.mp3, outdoor loops
  src/main.ts        wiring and UI
  src/viewer.ts      Bundle connect, pose, pointer, place-speaker mode
  src/sim/worker.ts  mesh parse, ray index, trace
  src/sim/types.ts   shared request and result types (section 5.5)
  src/audio.ts       audio graph
  src/overlay.ts     lines inside the tour
  src/xray.ts        wireframe view
server/index.ts      Express: config, mesh, openings
scripts/fetch-bundle.mjs
```

## 4. Data

### 4.1 Mesh
Query `model(id) { assets { meshes { format resolution status url validUntil } } }`.
Use the entry with `resolution: "50k"`: it is a single OBJ file (85,456 points and 116,539 triangles on the test house).
The `"500k"` entry is served in pieces, so skip it. Links expire, so the server downloads on each request and never stores the link.

The worker parses only `v` and `f` lines, splits faces with more than three corners into triangles and merges everything into one geometry.

### 4.2 Windows
Query `model(id) { rooms { id label boundary { edges { type thickness vertices { position { x y } } openings { type width height lowerElevation relativeCenter } } } } }`.
For each opening with `type: "window"`:
- Position along the wall: `v0 + relativeCenter × (v1 − v0)`.
- Height: `lowerElevation + height / 2`.
- Move it 0.15 m into the room so it isn't inside the wall.

The room each window belongs to is kept, for labels and for the cap in section 5.3.

### 4.3 Coordinates
Mesh and PI data use Model API coordinates (Z up). The viewer uses SDK coordinates (Y up).
Convert once, on load: `(x, y, z) → (x, z, −y)`. After that everything in the app is in SDK coordinates, in metres.

This conversion and the PI frame are the first things to verify (milestone M2, open question Q3).

### 4.4 Demo property
Start with model `Ki9YdfpNKum` (9117 Richland Drive, Houston): the mesh and the Bundle were both tested on it, and it has 9 rooms and 36 scan points.
Confirm it has windows in PI. If it doesn't, pick another residential model that has the `"50k"` mesh and windows.

## 5. Simulation

All of it is from the listener's point of view, as games do. The result is tuned to sound right, not to be physically exact.

### 5.1 Direct sound
Cast one ray from the source to the listener and count every surface it crosses.
A wall is two surfaces, so `walls = round(crossings / 2)`.

| Walls crossed | Volume | Low-pass cutoff |
|---|---|---|
| 0 | 100% | 20 kHz |
| 1 | 30% | 2.5 kHz |
| 2 | 10% | 1 kHz |
| 3 or more | 4% | 500 Hz |

Distance also lowers the volume (inverse distance, the `PannerNode` default). These values are starting points to tune by ear.

### 5.2 Early bounces
1. Shoot 1,500 rays from the listener in evenly spread directions.
2. Follow each for up to 4 bounces, reflecting like a mirror.
3. At every bounce point, check whether the source is visible from there. If it is, that is a path:
   listener → bounce points → source.
4. Score each path: `1 / total length × 0.7^bounces × mirror factor`. The mirror factor is higher when the last leg is close to the mirror direction.
5. Merge paths that arrive from nearly the same direction. Keep the 8 strongest per source.

Each kept path gives a delay (`length / 343 m/s`), a volume and an arrival direction. It is also one drawn line.

Sound going through an open doorway comes out of this for free: those paths bounce off the door frame and the next room's walls.

### 5.3 Reverb tail
Not traced. From the same 1,500 rays:
- `mean free path` = average length of all ray segments.
- `echo time ≈ 0.04 × mean free path / absorption`, with absorption fixed at 0.25 (a furnished home). Clamp to 0.2–2.5 s.

The audio engine generates an impulse response (stereo noise that fades out over the echo time) and loads it into one shared `ConvolverNode`.
Regenerate only when the echo time changes by more than 15%.

Cap on work: every source gets direct sound. Only the speakers and the 4 nearest windows get bounces.

### 5.4 When to recompute
- A speaker is added or removed.
- The listener's position moves more than 0.25 m (checked at most 10 times a second, so it also updates during a jump between scan points).

Turning your head does not recompute anything. The app only updates the audio listener's orientation.
Each request carries a number, and results older than the latest request are dropped.

### 5.5 Worker interface
```ts
type Vec3 = [number, number, number];

type TraceRequest = {
  id: number;
  listener: Vec3;
  sources: { id: string; position: Vec3; bounces: boolean }[];
};

type TraceResult = {
  id: number;
  ms: number;                      // time spent, for the perf readout
  echoTime: number;                // seconds
  sources: {
    id: string;
    walls: number;                 // direct line: walls crossed
    paths: {
      points: Vec3[];              // listener, bounce points, source
      length: number;              // metres
      gain: number;                // 0..1
      arrival: Vec3;               // unit vector, direction the echo comes from
    }[];
  }[];
};
```
Fix this file first. It lets the worker, the audio engine and the two views be built in parallel against fake data.

## 6. Audio engine

One `AudioContext`, created when the user presses "Start audio" (browsers require a click before sound).

Per source:
```
buffer (looping) → source gain ─┬→ low-pass → gain → HRTF panner at the source position ──────────→ master
                                ├→ per path: delay → gain → panner 2 m away along the arrival direction → master
                                └→ reverb send gain ───────────────────────────────→ shared convolver → master
```

- **Listener:** position and forward/up vectors come from `Camera.pose` on every pose update.
- **Smoothing:** every volume, delay and filter change uses `setTargetAtTime` with about 80 ms, so moving doesn't click.
- **Reverb send:** lower when the source is behind walls (`0.5 ^ walls`).
- **Windows:** all windows share the same loop buffer but start at different offsets, so they don't sound like one phasing source.
- **Budget:** HRTF panners are the expensive node. Speakers use HRTF for direct sound and paths. Windows use HRTF for direct sound and the cheaper `equalpower` panning for paths. Target under 30 HRTF panners in total.
- **Levels:** song at full level, outdoor loop about 12 dB lower, one master limiter (`DynamicsCompressorNode`).

Audio files: one royalty-free song and one outdoor city loop in `app/public/audio/`.

## 7. Graphics

### 7.1 Lines inside the tour
One scene component registered with the Bundle. It owns a single `LineSegments` object made with `context.three`.
The app passes it a plain `Float32Array` of segment end points and colours whenever a result arrives.
Never pass three.js objects between our three and the Bundle's three; pass arrays only.

- Speaker paths: bright colour, brighter for stronger paths.
- Window paths: a second, dimmer colour.
- Speakers and windows: small marker spheres from the same component.

### 7.2 X-ray view
Our own canvas, toggled by a button, shown beside or instead of the tour.
- The mesh drawn as white edges on black (`EdgesGeometry` with an angle threshold, so flat walls stay clean).
- Listener marker with a direction cone, speaker markers, window markers, the same path lines.
- Orbit camera, starting from above.

This view is the fallback if the tour is too slow at demo time: it stays smooth because it is ours.

### 7.3 Stretch visual
Pulses that travel along each path at a slowed-down speed of sound. Only after M6.

## 8. Viewer details

- Iframe: `/bundle/showcase.html?m=<id>&applicationKey=<key>&play=1&qs=1`. Connect with `iframe.contentWindow.MP_SDK.connect(iframe.contentWindow)`.
- Wait for `App.state` to reach `PLAYING` before anything else.
- **Listener:** `Camera.pose` gives position and rotation in degrees. Convert the rotation to forward and up vectors.
- **Place speaker:** a "Place speaker" button turns the mode on. `Pointer.intersection` tracks the surface under the cursor.
  The next click places a speaker at that point, moved 0.2 m along the surface normal, then the mode turns off.
  The click also reaches the viewer and may move the user; see open question Q4.

## 9. Performance budget

| Item | Target |
|---|---|
| Building the ray index (once) | Under 1 s |
| One trace request (1 speaker + windows) | Under 30 ms in the worker |
| Main-thread work per frame from our code | Listener orientation update only |
| Line segments drawn | Under 5,000, one draw call |
| HRTF panners | Under 30 |

Show the trace time in a small corner readout during development.
If the trace is too slow: lower the ray count, then the bounce count, then the number of windows that get bounces.

## 10. Implementation plan

Each milestone leaves a working app.

| # | Milestone | Features | How to check |
|---|---|---|---|
| M0 | Scaffold: Vite app, Express server, bundle fetch script, `/api/config`, `sim/types.ts` | | Page opens, server returns config |
| M1 | Viewer loads, "Start audio", place-speaker mode, song with HRTF positioning and distance | F1, F2, part of F3 | Walk around; the song moves in the headphones |
| M2 | Server mesh and openings routes; worker parses the mesh and builds the index; X-ray view shows the mesh, listener and windows; alignment check | F7 | A speaker placed in the tour appears on the right wall in the X-ray view |
| M3 | Direct-sound muffling through walls | F3 | Stand behind a wall: quieter and duller |
| M4 | Bounce paths: worker, delays in audio, lines in X-ray then in the tour | part of F4, F6 | Lines appear and change when you move; echoes are audible in a bare room |
| M5 | Reverb from ray statistics | F4 | A large room rings longer than a closet |
| M6 | Window sources with the outdoor loop | F5 | Outdoor sound is louder near windows |
| M7 | Tuning, demo script, 2-minute video, Devpost | | Full run-through with headphones |

### Splitting the work (up to 4 people)
After M0, these can run in parallel against the types in section 5.5:
- **Viewer and app shell:** M1, then the tour overlay in M4.
- **Worker:** mesh parsing and index in M2, then M3, M4 and M5 tracing.
- **Audio engine:** M1 audio, then the graph for M3 to M6, tested with fake results first.
- **Server and X-ray view:** M2 routes and view, then M6 window data.

### If time runs short
Cut in this order: stretch pulses, lines inside the tour (keep the X-ray view), bounces for windows, reverb regeneration (use one fixed reverb).
M1 to M3 plus the X-ray view is the smallest demo worth showing.

## 11. Risks

| Risk | What we do |
|---|---|
| The tour is too slow | The X-ray view carries the visuals; audio is unaffected. Ask about turning splats off (Q2) |
| Mesh and PI don't line up with the tour | Verified in M2 before any audio depends on it |
| Holes in the scanned mesh let rays escape | Rays that hit nothing are dropped; the defurnished mesh has holes filled |
| Too many audio nodes cause crackling | The panner budget in section 6; fewer paths per window |
| The demo model has no windows in PI | Pick another model in M2 |
| Demo needs `localhost` | The SDK key is allowed on `localhost`, so demo from our laptop and record a video as backup |

## 12. Open questions

| # | Question | Who answers | Default if unanswered |
|---|---|---|---|
| Q1 | Is a minimal AI agent part of the MVP? It is 30% of CoStar's score. | Team | No agent in the MVP; add it first afterwards |
| Q2 | Can the Gaussian splat layer be turned off to speed the viewer up? | Matterport engineers | Leave it on |
| Q3 | Are PI edge vertices in the same frame as the mesh, and is `lowerElevation` measured from the room's floor or from the model's zero? | Us, in M2 | Compare against the mesh and adjust |
| Q4 | Can we stop the viewer from moving the user on the click that places a speaker? | Us, in M1 | Accept the move, or place with a key press while hovering |
| Q5 | Do all models' meshes with `resolution: "50k"` come as one file? | Us, when changing property | Use the tested model |
| Q6 | Which song and outdoor loop, and are they free to use in a public demo? | Team | Royalty-free tracks only |

Known unknowns that don't block the MVP: the meaning of the mesh's `type###` tags, and the Bundle's undocumented `PI` namespace.

## 13. After the MVP

In order: the agent with its action bank, opening and closing windows and doors, materials and furniture, decibel and echo-time numbers,
Vexcel outdoor noise placed with geocoordinates, and property search. Details are in [acoustic-experience.md](acoustic-experience.md), section 3.
