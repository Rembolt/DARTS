# Showcase Bundle SDK and Web Component

Sources: https://developers.matterport.com/bundle-sdk/ , /bundle-sdk/quickstart/ , /bundle-sdk/architecture/ , /webcomponent/

## Bundle SDK

A **self-hosted** Showcase. It includes everything in the Embed SDK plus the **Scene Framework** (access to the 3D engine, renderer and scene graph). Latest release listed: `26.10.4_webgl-1728-g1cd7e0997a`, downloaded as `showcase-bundle.zip`.

### Requirements

- **SDK key** (Account Settings, Developer Tools, SDK Key Management). Add local domains to the allow list.
- **Embed.ly API keys**: since the bundle runs on your domain, you need your own Embed.ly key for rich media in tags. See https://developers.matterport.com/tutorials/embedly/
- **OAuth** (optional): contact Matterport Developer Support to enable it for your application.
- Local environment guide: https://developers.matterport.com/tutorials/local-environment/

### Install

Extract the bundle into a directory your web server serves (for example `/bundle`). Contents: `css`, `cursors`, `fonts`, `images`, `js`, `locale`, `terms`, `showcase.html`, `version.txt`. The docs refer to both `.zip` and `.tar.gz` for the archive.

### Embed and connect

```html
<iframe id="showcase" width="853" height="480"
  src="/bundle/showcase.html?m=[MODEL_SID]&applicationKey=[YOUR_SDK_KEY_HERE]"
  frameborder="0" allow="fullscreen; xr-spatial-tracking"></iframe>

<script>
  const showcase = document.getElementById('showcase');
  const showcaseWindow = showcase.contentWindow;
  showcase.addEventListener('load', async () => {
    try {
      const mpSdk = await showcaseWindow.MP_SDK.connect(showcaseWindow);
      console.log('Hello Bundle SDK', mpSdk);
      const data = await mpSdk.Model.getData();
      console.log('Model sid:', data.sid);
    } catch (e) {
      console.error(e);
    }
  });
</script>
```

> The official quickstart snippet attaches the load listener to an undefined `showcase` variable (the iframe variable there is `bundleIframe`). The version above uses one consistent name.

OAuth: `MP_SDK.connect(showcaseWindow, { auth: '[access_token]' })`.

### Scene Framework architecture

- **Scene objects** group nodes and manage how components connect. Create with `sdk.Scene.createObjects(count)`. `start()` starts all nodes; `stop()` stops them and the object cannot be restarted.
- **Scene nodes** hold child components, have a 3D transform applied to children, and move through states: *Initializing* (outside the scene graph; add components and bindings), *Operating* (active), *Destroyed*. `addNode(id?)` creates a node.
- **Components** belong to one node and are meant to be reusable. Lifecycle callbacks: `onInit` (in add order), `onEvent` (once per event from the previous frame), `onInputsChanged` (after `onEvent`, before `onTick`), `onTick` (every frame), `onDestroyed` (reverse order). Some examples use `onDestroy`, so verify against the reference.
- Components have `inputs`, `outputs`, `events`, `emits`, and a `context` with `root` (the node), `three` (Showcase's THREE.js) and `renderer`. **Create materials and geometries through `context.three`**, not an independent THREE import, so internal IDs stay consistent.
- Mouse/touch interaction (hover, click, drag) requires the component to set a `collider` output.
- **Paths** (`addInputPath`, `addOutputPath`, `addEventPath`, `addEmitPath`) reference component members. **Property bindings** link an output to an input (the input is read-only). **Event bindings** link an emit to an event; names need not match.
- **Spies** (`spyOnEvent` returns a subscription with `cancel()`) receive callbacks outside the component system, useful to bridge to other frameworks. You can spy on emits and on `'inputsUpdated'` / `'outputsUpdated'`.

Built-in components: ambient/directional/point lights, camera, input, DAE/FBX/GLTF/OBJ loaders, scrolling tube, transform controls, XR. Details in [07-sdk-reference.md](07-sdk-reference.md) under `Scene`.

TypeScript declarations: https://developers.matterport.com/bundle-sdk/types/

## Web Component (beta)

Package `@matterport/webcomponent` provides `<matterport-viewer>`, a non-iframe alternative to the Bundle. Interface and syntax may change.

```bash
npm install @matterport/webcomponent three
npx matterport-assets YOUR_STATIC_ASSETS_DIR
```

```html
<matterport-viewer m="YOUR_MODEL_SID" application-key="YOUR_APPLICATION_KEY"></matterport-viewer>
```

```ts
import '@matterport/webcomponent';

const viewer = document.querySelector('matterport-viewer');

// Option A: promise
const mpSdk = await viewer.playingPromise;

// Option B: event
viewer.addEventListener('mpSdkPlaying', (evt) => {
  const mpSdk = evt.detail.mpSdk;
});
```

Attributes documented: `m` (model SID) and `application-key`. Check the npm README for the supported `three` version.
