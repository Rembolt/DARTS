# SDK Reference (MpSdk)

Source: https://developers.matterport.com/reference/ and per-namespace pages at `/reference/<name>/`.

`MpSdk` is returned by `connect()`. **`Scene` is Bundle-only.** Many older event/getter APIs are deprecated in favor of observables.

- **Namespaces (24):** `__metadata__`, App, Asset, Camera, Conversion, Floor, Graph, Label, Link, Mattertag, Measurements, Mode, Model, OAuth, Pointer, Renderer, Room, Scene, Sensor, Settings, Sweep, Tag, Tour, View
- **Interfaces:** Dictionary, Emitter, ICondition, IDisposable, IMapObserver, IObservable, IObservableMap, IObserver, ISubscription, MP_SDK
- **Top-level functions:** `disconnect()` (stop messaging and clean up), `on(event, cb)`, `off(event, cb)`

## Common types

| Type | Shape |
|---|---|
| Vector2 / Vector3 | `{x,y}` / `{x,y,z}` |
| Quaternion | `{w,x,y,z}` |
| Rotation | `{x, y, z?}` |
| EulerAngle | degrees, YXZ order |
| Orientation | degrees: pitch, roll, yaw |
| Color | RGB each in [0,1] |
| Size | `{h, w}` |
| ConnectOptions | includes `auth` (token for model access) |

## Legacy `on` events

| Namespace | Event | Notes |
|---|---|---|
| App | PHASE_CHANGE | Deprecated, use `App.state` |
| Camera | MOVE (`camera.move`) | Deprecated, use `Camera.pose` |
| Floor | CHANGE_START / CHANGE_END | |
| Label | POSITION_UPDATED | Deprecated |
| Mattertag | HOVER / CLICK / LINK_OPEN | Namespace deprecated |
| Mode | CHANGE_START / CHANGE_END | |
| Model | MODEL_LOADED (`model.loaded`) | |
| Sweep | ENTER / EXIT | |
| Tour | STARTED / STOPPED / ENDED / STEPPED | |

## App

- **Observables:** `state` (`{application, phase, phaseTimes}`), `features` (availability map; added in 24.9.3)
- **Enums:** `Application` (SHOWCASE, WORKSHOP, WEBVR, UNKNOWN), `Phase` (UNINITIALIZED, WAITING, LOADING, STARTING, PLAYING, ERROR), `Feature` (Defurnish, MeshPresent, RoomBounds, SplatPresent)
- **Deprecated methods:** `getState()`, `getLoadTimes()`
- Typical use: `await mpSdk.App.state.waitUntil(s => s.phase === mpSdk.App.Phase.PLAYING)`

## Asset

- `registerTexture(id, iconSrc)`: registers an image for later use (for example `Tag.editIcon`). Host your own images to avoid cross-origin issues.

## Camera

- **Observables:** `pose` (`{mode, position, projection, rotation, sweep}`), `zoom` (varies only in Panorama mode)
- **Methods:** `lookAt(position, options?)` (experimental), `lookAtScreenCoords(x, y)` (Inside), `moveInDirection(direction)` (Inside), `pan({x, z})` (Dollhouse/Floorplan), `rotate(h, v, options?)`, `setRotation(rotation, options?)` (Panorama, Dollhouse, Floorplan), `zoomBy`, `zoomTo`, `zoomReset` (Inside), `getPose()` (deprecated)
- **Enums:** `Direction` (BACK, DOWN, FORWARD, LEFT, RIGHT, UP), `TransitionType` (FADEOUT, FLY, INSTANT, MOVEFADE*, ORBIT*; *experimental)

## Conversion

- `basisChange(operand, operation)`: convert position or rotation between API and SDK orientations (`TransformType.Coordinates`, `SweepRotation`, `CameraRotation`)
- `worldToScreen(worldPos, cameraPose, windowSize, result?)`: 3D position to pixel coordinate

## Floor

- **Observables:** `current`, `data`
- **Methods:** `moveTo(index)` (in Inside mode also moves the camera), `showAll()`, `getData()` (deprecated)
- **Events:** CHANGE_START (`floors.changestart`), CHANGE_END (`floors.changeend`)

## Graph (pathfinding utilities)

`createDirectedGraph`, `createAStarRunner(graph, start, end, options?)`, `cloneGraph`, `findCycle`, `findCycles`. `AStarStatus`: SUCCESS, NO_PATH, NO_START_VERTEX, NO_END_VERTEX, TIMEOUT. Pair with `Sweep.createGraph()`.

## Label

- **Observable:** `data` (map of labels: `sid`, `text`, `position`, `floor`, `visible`)
- `getData()` deprecated

## Link

`createLink()`, `createDeepLink()`, `setShareLinkPolicy(CreationPolicy, options?)`, `setExternalLinkPolicy(openInNewWindow)`, `setModelLinkPolicy(...)`, `setNavigationLinkPolicy(...)`, `setSameOriginLinkPolicy(...)`. Enums: `CreationPolicy` (MATTERPORT, REFERRER, WINDOW), `DestinationPolicy` (DEFAULT, MATTERPORT), `OpenPolicy` (CURRENT_WINDOW, DEFAULT, NEW_WINDOW, SAME_FRAME). Note: since 26.8.2, `createDeepLink()` no longer includes `applicationKey`.

## Mattertag (deprecated namespace)

Everything except `navigateToTag` is deprecated and points to `Tag`. Mapping: `add` to `Tag.add`; `editBillboard` to `Tag.editBillboard` / `registerAttachment` / `attach`; `editColor/Icon/Opacity/Position/Stem` to the same `Tag` methods; `getData` and `data` to `Tag.data`; `injectHTML` to `Tag.registerSandbox`; `preventAction` to `Tag.allowAction`; `registerIcon` to `Asset.registerTexture`; `remove` to `Tag.remove`. Migration guide: https://developers.matterport.com/tutorials/tags-migration/

## Measurements

- **Observables:** `data`, `mode`
- **Methods:** `toggleMode(activate, {hideAddButton})` (only after app is playing), `add(descriptors)` and `remove(items)` (experimental), `getData()` (deprecated)
- `MeasurementType`: Floorplan (floorplan view only), ThreeD (any 3D view)

## Mode

- **Observables:** `current`, `transition` (`{from, to}`)
- **Method:** `moveTo(mode, {position?, rotation?, transition?, zoom?})`. In Floorplan, `zoom` applies and a lower value zooms in; `position` X/Z set the view position; rotation X is roll, Y is tilt.
- **Enum `Mode`:** DOLLHOUSE, FLOORPLAN, INSIDE, PANO360, TRANSITIONING. `OUTSIDE` is deprecated (since 26.5.3) and shares its value with `PANO360`.
- **Events:** CHANGE_START (`viewmode.changestart`), CHANGE_END (`viewmode.changeend`)

## Model

- `getData()` returns `{sid, modelSupportsVr, sweeps}` (not canonical for sweeps anymore, use `Sweep.data`)
- `getDetails()` returns `{sid, defaultViewId, name?, summary?, description?, address?, formattedAddress?, contactName?, contactEmail?, phone?, presentedBy?, shareUrl?}`
- Event: MODEL_LOADED (`model.loaded`)

## OAuth

`createTokenRefresher(token: TokenInfo, tokenFetcher: ITokenFetcher): ITokenRefresher`. Interfaces: `IRefreshObserver`, `ITokenFetcher`, `ITokenRefresher`, `TokenInfo`. See [04-private-model-embed-oauth.md](04-private-model-embed-oauth.md).

## Pointer

- **Observable:** `intersection` (`{floorId?, floorIndex?, normal, object, position}`; `object` is a `Colliders` value: MODEL, NONE, SWEEP, TAG, UNKNOWN)
- **Methods:** `setVisible(bool)`, `setFadeProps({fadeIn?, fadeOut?})`, `editTexture(id)`, `resetTexture()`, `registerTexture(...)` (deprecated, use `Asset.registerTexture`)

## Renderer

- `takeScreenShot(resolution?, visibility?)`: JPEG base64, max 4096 x 4096
- `takeEquirectangular()`: JPEG base64 of the active sweep (Panorama mode); not stored by Matterport
- `getWorldPositionData(screenPosition, height?, includeHiddenFloors?)`: screen to world (null position and floor -1 on no hit)
- `getScreenPosition(worldPosition)`: deprecated, use `Conversion.worldToScreen`

## Room

- **Observables:** `current` (rooms containing the camera; can be empty), `data` (map of `{id, label, bounds, center, size, floorInfo}`)

## Scene (Bundle only)

- **Props/methods:** `THREE`, `configure(cb)`, `createObjects(count)`, `register(name, factory)`, `registerComponents(list)`, `unregisterComponents(list)`, `serialize(obj)`, `deserialize(text)`; `createNode(s)` deprecated
- **Enums:** `Component` (`mp.ambientLight`, `mp.camera`, `mp.daeLoader`, `mp.directionalLight`, `mp.fbxLoader`, `mp.gltfLoader`, `mp.input`, `mp.lights`, `mp.objLoader`, `mp.pointLight`, `mp.scrollingTube`, `mp.transformControls`, `mp.xr`), `InteractionType` (CLICK, DRAG, HOVER, and more), `PathType`
- `configure` effect composer requires `useEffectComposer: 1` in app config and disables renderer antialiasing

## Sensor

Proximity/visibility sensing. `createSensor(SensorType.CAMERA)`, `createSource(SourceType.SPHERE | BOX | CYLINDER, options)`, `sensor.addSource(...)`, `sensor.readings.subscribe({onAdded, onUpdated})`. `SensorReading`: `direction`, `distance`, `distanceSquared`, `inRange`, `inView`.

## Settings

`get(key)` and `update(key, value)`.

## Sweep

- **Observables:** `current`, `data`
- **Methods:** `moveTo(sweep, {rotation?, transition?, transitionTime?})`, `enable(ids)`, `disable(ids)`, `addNeighbors`, `removeNeighbors`, `createGraph()`
- **Enums:** `Alignment` (ALIGNED, UNALIGNED), `Placement` (AUTO, MANUAL, UNPLACED), `Event` (ENTER, EXIT)

## Tag

- **Observables:** `data` (map of `TagData`), `attachments`, `openTags` (`{docked, hovered, selected}`, since 23.2.1)
- **Create/remove:** `add(descriptors)` (not persisted across refresh), `remove(ids)`
- **Edit:** `editBillboard`, `editColor`, `editIcon`, `resetIcon`, `editOpacity`, `editPosition`, `editPositions` (batch, preferred), `editStem`
- **Open/dock:** `open`, `close`, `dock`, `allowAction(id, {docking, navigating, opening, sharing})`
- **Attachments:** `registerAttachment(srcs)`, `attach(tagId, ids)`, `detach(tagId, ids)`, `registerSandbox(html, options?)` returns an id and a messenger
- **Global toggles:** `toggleDocking`, `toggleNavControls`, `toggleSharing`
- **`AttachmentType`:** IMAGE, PDF, RICH, SANDBOX, UNKNOWN, VIDEO, ZIP
- **`Descriptor`:** requires `anchorPosition` and `stemVector`; optional `attachments`, `color`, `description`, `enabled`, `iconId`, `id`, `keywords`, `label`, `opacity`, `stemVisible`

## Tour

- **Observables:** `currentStep`, `state`, `transition`
- **Methods:** `getData()`, `start(index?)`, `stop()`, `next()`, `prev()`, `step(index)`
- **Enums:** `Event` (STARTED, STOPPED, ENDED, STEPPED), `PlayState` (ACTIVE, INACTIVE, STOP_SCHEDULED)

## View

- **Observables:** `current` and `views` (Early Access), `layers`
- **Methods:** `createLayer(name, {common?})`, `deleteLayer(layer)` (since 25.3.4)
- **Enums:** `LayerType` (BASE, IN_MEMORY, OTHER, USER, VIEW_DATA), `ViewType` (BASE, DEFURNISH, LAYERED_BASE, OTHER, USER)

## Not read in detail

`__metadata__` namespace (added 26.7.3 with app and SDK version info), and the interface pages (IObservable, IObservableMap, and so on). See https://developers.matterport.com/reference/
