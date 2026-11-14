# SDK Concepts and Vocabulary

Sources: https://developers.matterport.com/overview/concepts/ and https://developers.matterport.com/overview/vocabulary/

## How the SDK works

A web app can **execute actions** (change the user's location or view in Showcase) and/or **listen to events** (where the user is, what they see, what they do). Most apps mainly do one or the other. Space-level metadata is also available to inform decisions.

### Asynchronous by design

Requests to Showcase return Promises. `connect` returns a promise for the SDK object, which exposes methods grouped by namespace (App, Tag, and so on).

```javascript
try {
  const mpSdk = await connect(iframe);
} catch (e) {
  console.error(e);
}
```

### Disconnecting

If you reuse the iframe or remove its DOM element to load a different space, disconnect the SDK first, then reconnect after the new page loads.

## Coordinate conventions

- X, Y, Z are measured relative to the Matterport camera at scan time.
- The origin is the **first scanned pano**, which may differ from the Start Position.
- To find it: my.matterport.com, open the space, open Workshop, open the 3D Scans & 360º Views menu, double-click Scan 1.

### Model API vs Showcase SDK

| System | Used for | Handedness | East | North | Up |
|---|---|---|---|---|---|
| Model API | All model assets | Right | +X | +Y | +Z |
| Showcase | Models rendered for web | Right | +X | -Z | +Y |

To convert: swap Y and Z, then negate the new Z.

## Glossary

| Term | Meaning |
|---|---|
| Application Key | Credential for authenticating SDK connections (account settings, Developer Tools) |
| Camera | The user's virtual viewpoint: location, orientation, zoom, field of view |
| GraphQL | Query language behind Matterport's APIs |
| Label | Text marker fixed at a point in 3D space |
| Mattertag | Older name for Tag. The namespace is deprecated. |
| Measurement | Distance and area data within a Space |
| Mode | Viewing perspective (Inside, Dollhouse, Floorplan) |
| Model | 3D data representing a Space, usually what you query or modify via the API |
| Namespace | Top-level SDK feature group (Camera, Floor, Scene, Tag) |
| OAuth | Authorization protocol partners use for private model access |
| Observable | A value you subscribe to for change notifications |
| Pano / Sweep | A capture point. Pano is the 2D imagery, sweep is the 3D scan location. |
| PME | Private Model Embed, an Enterprise feature for authenticated private embeds |
| Position | Absolute X, Y, Z of a point in a Space |
| Showcase | Matterport's 3D viewer |
| SID | Short alphanumeric ID (usually 11 or 22 chars) for panos, tags, models. Preferred ID format. |
| Space | A scanned environment turned into an interactive 3D experience |
| Tag | Interactive annotation holding text, media and links |
| Transition | Effect when moving between panos: Fly-through, Fade, Instant |
| View/Layer | Saved set of visible content (tags, labels) organized in layers |
