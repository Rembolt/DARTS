<!-- source: https://developers.matterport.com/webcomponent/ -->

On this page

note

The Matterport Web Component is currently in public beta - interface and syntax are subject to change.

The Matterport Web Component (NPM package name: `@matterport/webcomponent`) is a [Web Component (custom HTML element)](https://developer.mozilla.org/en-US/docs/Web/Web_Components) that encapsulates the Matterport experience in a single DOM element:
    
    
    <!-- Create a full 3D viewer on your site -->  
    
    
    <matterport-viewer m="SxQL3iGyoDo"></matterport-viewer>  
    

You can use the web component as a full replacement for the [iframe-based SDK bundle](/bundle-sdk/). Read the quick installation instructions, check out advanced usage tips, or continue to the tutorial to learn more.

## Quick Installation​

Full, current install instructions live on the [npm package page](https://www.npmjs.com/package/@matterport/webcomponent) and in the package `README.md`, including the supported `three` version.

  1. Install package: 
     1. **Yarn** : `yarn add @matterport/webcomponent three`
     2. **NPM** : `npm install @matterport/webcomponent three`
  2. Install static assets (replace `YOUR_STATIC_ASSETS_DIR` with your static assets dir): 
     1. **Yarn** : `yarn matterport-assets YOUR_STATIC_ASSETS_DIR`
     2. **NPM** : `npx matterport-assets YOUR_STATIC_ASSETS_DIR`
  3. `import @matterport/webcomponent` in your JS/TS
  4. Add a `<matterport-viewer>` to your HTML. Add the `m` attribute with the SID of the model you want to use.
  5. To use the SDK: 
     1. Add the application-key attribute with the value set to your SDK key
     2. Either: 
        1. Wait for the `playingPromise`:
    
    const viewer = document.querySelector('matterport-viewer');  
    
    
    const mpSdk = await viewer.playingPromise;  
    

        2. **OR** listen for the `mpSdkPlaying` event:
    
    const viewer = document.querySelector('matterport-viewer');  
    
    
    viewer.addEventListener('mpSdkPlaying', async (evt) => {  
    
    
      const mpSdk = evt.detail.mpSdk;  
    
    
      /* do something with mpSdk... */  
    
    
    });  
    




### Full example​

(Make sure you complete steps 1 and 2 above first!)

HTML:
    
    
    <matterport-viewer  
    
    
      m="YOUR_MODEL_SID"  
    
    
      application-key="YOUR_APPLICATION_KEY"  
    
    
    ></matterport-viewer>  
    

JS/TS:
    
    
    import '@matterport/webcomponent';  
    
    
      
    
    
    const viewer = document.querySelector('matterport-viewer');  
    
    
    viewer.addEventListener('mpSdkPlaying', async (evt) => {  
    
    
      const mpSdk = evt.detail.mpSdk;  
    
    
      /* do something with mpSdk... */  
    
    
    });  
    

  * Quick Installation
    * Full example


