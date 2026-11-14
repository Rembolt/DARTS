<!-- source: https://developers.matterport.com/webcomponent/advanced/ -->

On this page

note

The Matterport Web Component is currently in public beta - interface and syntax are subject to change.

See below for more information and advanced techniques with the web component.

### Non-root static assets​

You don’t have to put the static assets in the root of your static assets directory. For example, if you want to keep your Matterport assets in a folder called foo inside your static assets directory called public:
    
    
    # yarn  
    
    
    yarn matterport-assets public/foo  
    
    
      
    
    
    # npm  
    
    
    npx matterport-assets public/foo  
    

Then, in your `matterport-viewer` component, add the `asset-base` attribute:
    
    
    <matterport-viewer asset-base="foo"></matterport-viewer>  
    

This indicates that static assets for the viewer that would normally be served at `/` are instead served at `/foo/`.

### .gitignore-ing static assets and copying at build time​

The `matterport-assets` command copies >20mb of files to your static asset directory; this can be cumbersome to check into source control, especially since those static assets are downloaded each time you install `@matterport/webcomponent`.

You can make the process easier if you’re using a build process to generate your site. For this example, let’s assume you’re serving viewer assets from a subdirectory `foo` of your static assets directory `public`, like in the "Non-root static assets" section above.

  1. When installing the viewer, run `yarn matterport-assets public/foo` (or `npx matterport-assets public/foo`) like you normally would.
  2. Add `public/foo` to your `.gitignore` file.
  3. Add the same command you used in step 1 (`yarn matterport-assets public/foo` or `npx matterport-assets public/foo`) to your `postinstall` script in package.json:


    
    
    "scripts": {  
    
    
      ...  
    
    
      "postinstall": "yarn matterport-assets public/foo",  
    
    
      ...  
    
    
    }  
    

This will automatically copy static assets to the correct location any time you `yarn/npm install` this project in the future. 4. Develop locally like you normally would. 5. When pushing to CI: this should normally take care of asset installation, since CI should install dependencies (and therefore run `postinstall` afterward) automatically. If needed, you can add the same command from step 1 to the CI’s build command (for example, `yarn matterport-assets public/foo && yarn build`).

### React/Vue/Svelte/etc interoperability​

Custom Web Components like this one are part of [browsers' built-in capability](https://developer.mozilla.org/en-US/docs/Web/Web_Components) and all usable within popular frameworks like React, Vue, Svelte, Next, Nuxt, etc. If you’re using the web component in one of those frameworks, search `use custom web component [framework name]` to find steps for your specific environment.

### Upgrading/Version pinning​

To upgrade your project’s version of the package, run:
    
    
    # yarn  
    
    
    yarn upgrade @matterport/webcomponent  
    
    
      
    
    
    # npm  
    
    
    npm upgrade @matterport/webcomponent  
    

Then run the `matterport-assets` command to copy the latest version of the viewer assets:
    
    
    # yarn  
    
    
    yarn matterport-assets YOUR_STATIC_ASSETS_DIR  
    
    
      
    
    
    # npm  
    
    
    npx matterport-assets YOUR_STATIC_ASSETS_DIR  
    

If you’re committing static assets to source control, you’ll probably see some changes to those assets marked at this point. That’s expected - the assets you’re copying are specific to the version of the `@matterport/webcomponent` package you've installed.

(Note that this also means you can pin which version of the Matterport viewer you want on your page by leaving the package’s version as-is; you can also upgrade to a specific version of the viewer by installing a desired version of the package.)

### OAuth/other connect options​

You may be familiar with passing options to the SDK in the connect function:
    
    
    MP_SDK.connect(  
    
    
      myShowcaseWindow,  
    
    
      { auth: 'abc' } // <-- these options  
    
    
    )  
    

You can provide options to `connect` by adding attributes starting with `connect-` to your component. For example:
    
    
    <matterport-viewer connect-auth="abc"></matterport-viewer>  
    

This will match the JS above, and any future connect options will follow this same pattern automatically.

### Config options​

You may be familiar with application-level configuration options in the iframe bundle (such as `{ useEffectComposer: 1 }` to use Three.js's built-in EffectComposer for postprocessing effects).

These are usually changed in `showcase.html`, but since this file is not accessible from the web component, you can prefix any attribute with `config-` to pass it to application-level config parameters.

For example, to set `useEffectComposer` to `1`, your web component would look like this:
    
    
    <matterport-viewer config-use-effect-composer="1">  
    

This works with any attribute name - for example, to set hypothetical properties `exampleOne` and `exampleTwo` to `true` and `100`, respectively, you would write:
    
    
    <matterport-viewer config-example-one="true" config-example-two="100">  
    

### Global scope usage​

The web component will load some assets and code (including fonts, scripts, images, polyfills, etc) into the global scope of your page. The Matterport team is currently working on reducing global content as much as possible; until then, note that some issues (like [loading custom fonts](https://dev.to/akdevcraft/use-font-in-web-component-51a4), using a compatibility checker to detect outdated browsers, and using the [webgl-memory](https://github.com/greggman/webgl-memory) WebGL extension) necessitate working in the global scope.

### Workspaces​

In projects with Yarn workspaces, it may be helpful to mark the SDK package as `nohoist` if you run into issues with `yarn matterport-assets` copying the assets correctly. For example:

In my project, I have two workspaces, `a` and `b`. Both use the `@mp/webcomponent` package.

**Problem:** Installing in both locations would hoist `@mp/webcomponent` to the root directory, and `yarn workspace a matterport-assets` may run into issues.

**Solution:** In my root directory's `package.json`, I add the following:
    
    
    ...  
    
    
      "workspaces": [  
    
    
        ...,  
    
    
        "nohoist": [  
    
    
          "**/@mp/webcomponent"  
    
    
          ...  
    
    
        ]  
    
    
      ]  
    
    
    ...  
    

I then delete all `node_modules` folders in my project and reinstall with `yarn install`. From there, I can run `yarn workspace a matterport-assets public` and see the assets copied to `packages/a/public`.

  * Non-root static assets
  * .gitignore-ing static assets and copying at build time
  * React/Vue/Svelte/etc interoperability
  * Upgrading/Version pinning
  * OAuth/other connect options
  * Config options
  * Global scope usage
  * Workspaces


