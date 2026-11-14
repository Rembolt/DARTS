# SDK Tutorials, Examples and Changelog

## Observables

Source: https://developers.matterport.com/tutorials/observables/

Observables expose SDK state. An observer subscribes and is called **immediately with the current state**, then again on every change (like a get plus an event handler in one call).

- Observers can be a function or an object (`IObserver`, or any object with `onChanged`).
- Observers of one Observable share a cached state, so extra observers are cheap.
- `subscribe()` returns an `ISubscription`; call `cancel()` to stop.
- State objects are **shared references**: clone them if you need a snapshot.
- `waitUntil(condition)` pauses until state meets a condition (function or `ICondition`).

```typescript
const sub = mpSdk.Camera.pose.subscribe((pose) => {
  console.log(pose.position, pose.rotation);
});
// later
sub.cancel();

await mpSdk.Mode.current.waitUntil(m => m === mpSdk.Mode.Mode.FLOORPLAN);
```

Compared with the legacy pattern (`mpSdk.on(mpSdk.Camera.MOVE, ...)` plus `getPose()`), this avoids boilerplate, polling and missed events.

## Collections

Source: https://developers.matterport.com/tutorials/collections/

Collections are `ObservableMap`s of state objects (for example `mpSdk.Tag.data`). On first subscribe you get `onAdded` for each existing item, then one `onCollectionUpdated`.

Callbacks (all optional): `onAdded(index, item, collection)`, `onRemoved(...)`, `onUpdated(...)`, `onCollectionUpdated(collection)`.

```typescript
let tags: MpSdk.Dictionary<MpSdk.Tag.TagData>;
const sub = mpSdk.Tag.data.subscribe({
  onCollectionUpdated(collection) { tags = collection; }, // shared reference
});
```

Clone the collection or item (including nested objects) to keep a snapshot.

## Creating tags (legacy Mattertag namespace)

Source: https://developers.matterport.com/tutorials/creating-tags/

The Mattertag namespace is deprecated; use `Tag` and see the migration guide (https://developers.matterport.com/tutorials/tags-migration/). The legacy flow: build a descriptor with required `anchorPosition` and `stemVector`, find coordinates with the Intersection Inspector example, then call `add`.

```javascript
sdk.Mattertag.add({
  label: 'Hello Mattertag',
  anchorPosition: { x: 1.39, y: 2.0, z: -0.122 },
  stemVector: { x: 0, y: 0, z: 0 },
}).then(ids => console.log(ids));
```

Tags added through the SDK are **session-only**. They are not persisted.

## Other tutorial pages (not summarized)

- Local environment: https://developers.matterport.com/tutorials/local-environment/
- Embed.ly setup: https://developers.matterport.com/tutorials/embedly/
- Tag code sandboxes: https://developers.matterport.com/tutorials/tags-sandbox/
- Pathfinding: https://developers.matterport.com/tutorials/pathfinding/
- Pointer reticle: https://developers.matterport.com/tutorials/pointer-reticle/
- Using XR: https://developers.matterport.com/tutorials/xr/

## Examples

Source: https://developers.matterport.com/examples/

| Example | What it shows | Link |
|---|---|---|
| Navigation Controls | Custom sweep navigation (Embed SDK) | /examples/navigation-controls/ |
| Intersection Inspector | Inspect model surfaces with raycasting | /examples/intersection-inspector/ |
| Tags Quiz | Interactive quiz using Tags (original and overlay variants) | /examples/tags-quiz/ |
| Remote Control | Multi-user experience where a host drives navigation | /examples/remote-control/ |
| Sensor Examples | Source areas, box zones, proximity interactions | /examples/sensor-examples/ |
| VS App Example | Scene Framework examples (Bundle SDK) | /examples/bundle-examples/ |
| Custom Experience | Easter egg hunt (Bundle SDK) | /examples/custom-experience/ |

All links are under `https://developers.matterport.com`.

## SDK changelog (recent)

Source: https://developers.matterport.com/sdk-changelog/

| Version | Date | Changes |
|---|---|---|
| 26.10.4 | Oct 29, 2026 | `Camera.setRotation()` in Dollhouse and Floorplan; fixes for `Conversion.worldToScreen()` in Floorplan; `Renderer.takeEquirectangular()` applies Color Grade; Pointer methods no longer fail right after connecting; Bundle `node.addComponent<T>()` can return a typed component |
| Bootstrap v3.1.0 | Oct 29, 2026 | Security hardening. Update recommended (Showcase warns in the console for older bootstraps). |
| NPM Package 1.6.1 | Oct 29, 2026 | Fixes "unable to connect" when a bundler re-bundles the package |
| 26.9.4 | Sep 25, 2026 | Changes to experimental `Camera.lookAt()` |
| 26.8.2 | Aug 14, 2026 | `Link.createDeepLink()` no longer includes `applicationKey`; direct Showcase URLs no longer hang on the loader |
| 26.7.5 | Jul 30, 2026 | Adds `SplatPresent` and `MeshPresent` to `App.features` |
| 26.7.3 | Jul 16, 2026 | Adds `__metaData__` namespace with version info |

**Deprecation:** `Mode.OUTSIDE` (26.5.3, May 21, 2026). Use `Mode.PANO360`. Both resolve to `mode.outside`.
