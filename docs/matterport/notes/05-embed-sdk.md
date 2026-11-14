# Showcase Embed SDK

Sources: https://developers.matterport.com/embed-sdk/ , /embed-sdk/quickstart/ , /embed-sdk/package/

The Embed SDK controls an embedded Showcase (an iframe on Matterport's servers). It always uses the latest SDK version automatically.

## Prerequisites: SDK key

1. Log in, then Account Settings, Developer Tools, **SDK Key Management**.
2. Add a key. Add any local domains you need to its allow list (for example `localhost`, `localhost:8080`).
3. Sandbox and production access have different restrictions. Check Matterport's Developer Tools pricing/availability article.

Two integration methods: **script tag** (standard) and **NPM package** (beta).

## Script tag integration

### 1. Import map (optional but recommended)

Put your SDK key in the `applicationKey` query parameter of the bootstrap URL:

```html
<script type="importmap">
{
  "imports": {
    "MP_SDK": "https://api.matterport.com/sdk/bootstrap/3.1.0-0-g1cd7e0997a/sdk.es6.js?applicationKey=[YOUR_SDK_KEY_HERE]"
  }
}
</script>
```

You can also download `sdk.es6.js` and host it yourself, then point the import map at that path.

### 2. Iframe

```html
<iframe
  id="showcase-iframe"
  width="853" height="480"
  src="https://my.matterport.com/show?m=SxQL3iGyoDo&play=1&applicationKey=[YOUR_SDK_KEY_HERE]"
  frameborder="0"
  allow="fullscreen; xr-spatial-tracking">
</iframe>
```

The key goes in the `src` URL. The SDK key must be valid for the domain hosting the page.

### 3. Connect

Connect only after the iframe has loaded and the SDK is available. `connect()` is async, so wrap it in try/catch.

```html
<script type="module">
  import { connect } from 'MP_SDK';

  const iframe = document.getElementById('showcase-iframe');
  try {
    const mpSdk = await connect(iframe);
    const modelData = await mpSdk.Model.getData();
    console.log('Model sid:', modelData.sid);
  } catch (e) {
    console.error(e);
  }
</script>
```

Requirements: valid key for the domain, page served from that domain (use a local web server for development), a model SID, and browser support for import maps and ES modules.

### Legacy `window.MP_SDK`

Older versions exposed `window.MP_SDK`. To keep that pattern use the non-ES6 `sdk.js`, load it with `applicationKey` in the query string, then call `window.MP_SDK.connect(iframe, 'applicationkey')`. **This bootstrap does not support OAuth**, so use `sdk.es6.js` for OAuth.

## Using the SDK

### Actions

```javascript
mpSdk.<Namespace>.<action>(args).then(onSuccess).catch(onError);
```

### Events (legacy style)

```javascript
mpSdk.on(eventName, (state) => { /* handle */ });
```

Prefer observables where available (see [08-sdk-tutorials-and-examples.md](08-sdk-tutorials-and-examples.md)).

### Metadata

`mpSdk.Model.getData()` (basic model info) and `mpSdk.Model.getDetails()` (name, summary, contact, and so on). Both only work after a successful connection.

## NPM package (beta): `@matterport/sdk`

Quickstart with Webpack:

```bash
mkdir mp-sdk && cd mp-sdk
npm init -y
npm install --save-dev webpack webpack-cli webpack-dev-server html-webpack-plugin
npm install @matterport/sdk
```

`webpack.config.js`:

```js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
module.exports = {
  entry: './index.js',
  output: { path: path.resolve(__dirname, './dist'), filename: 'index_bundle.js' },
  plugins: [new HtmlWebpackPlugin()],
};
```

`package.json` scripts: `"dev": "webpack serve --mode=development"`, `"build": "webpack"`.

`index.js`:

```js
import { setupSdk } from '@matterport/sdk';

const main = async () => {
  const mpSdk = await setupSdk('yourSdkKey');
  await mpSdk.App.state.waitUntil(s => s.phase === mpSdk.App.Phase.PLAYING);
  mpSdk.Camera.rotate(35, 0);
};
main().catch(err => console.error('Error:', err));
```

Run with `npm run dev` and open `localhost:8080`. Starter examples: the `matterport/sdk-package-examples` GitHub repo. TypeScript types ship with the package.

Package changelog note: NPM Package 1.6.1 (Oct 29, 2026) fixes "unable to connect" errors when a bundler re-bundles the package.

## Private models

Private models need OAuth. See [04-private-model-embed-oauth.md](04-private-model-embed-oauth.md): pass the model-scoped token as `connect(iframe, { auth: token })`.
