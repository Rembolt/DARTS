<!-- source: https://developers.matterport.com/bundle-sdk/ -->

On this page

## Latest Version​

Bundle SDK Release| [26.10.4_webgl-1728-g1cd7e0997a](https://static.matterport.com/showcase-sdk/bundle/26.10.4_webgl-1728-g1cd7e0997a/showcase-bundle.zip)| Change Log| [View changelog](/sdk-changelog/)  
---|---  
  
## What is the Showcase Bundle SDK?​

The Bundle SDK is a self-hosted version of the Matterport Showcase. In addition to what's available in the Embed SDK, the Bundle SDK provides the Scene Framework, which allows access to the 3D engine, renderer, and scene graph.

## Installation​

Before installing, you will need to create an SDK key.

To manage keys, log in to your account, navigate to [Account Settings -> Developer Tools](https://my.matterport.com/settings/account/devtools), and scroll down to "SDK Key Management". Click "Add an SDK Key" and add any desired local domains to the allow list (for example, `localhost` and `localhost:8080`).

To learn more about our developer tools, please visit the [Matterport Developer Tools and Pricing](https://support.matterport.com/hc/en-us/articles/360057506813-Matterport-Developer-Tools-Pricing-and-Availability)

## Iframe Method​

Extract the contents of showcase-bundle.tar.gz to a directory where your files will be served.
    
    
    > cd [path to server root]  
    
    
    > mkdir bundle  
    
    
    > unzip showcase-bundle.zip -d bundle  
    
    
    > ls bundle  
    
    
    css        fonts        js        showcase.html    version.txt  
    
    
    cursors    images       locale    terms  
    
    
    >  
    

Add an iframe to your existing page that targets the `showcase.html` file of the bundle directory.
    
    
    <iframe id="showcase" width="740" height="480" src="/bundle/showcase.html?m=[MODEL_SID]&applicationKey=[YOUR_SDK_KEY_HERE]" frameborder="0" allow="fullscreen; xr-spatial-tracking"></iframe>  
    

Replace `[MODEL_SID]` with your own. Add the **applicationKey=[YOUR SDK_KEY]** URL parameter to provide your sdk key as part of the url.

### Connect to the SDK​

Add a script to the page to await the loading of showcase. Connect to it once loaded.
    
    
    const showcase = document.getElementById('showcase');  
    
    
    const showcaseWindow = showcase.contentWindow;  
    
    
    showcase.addEventListener('load', async function() {  
    
    
      let mpSdk;  
    
    
      try {  
    
    
        mpSdk = await showcaseWindow.MP_SDK.connect(showcaseWindow);  
    
    
      }  
    
    
      catch(e) {  
    
    
        console.error(e);  
    
    
        return;  
    
    
      }  
    
    
      
    
    
      console.log('Hello Bundle SDK', mpSdk);  
    
    
    });  
    

### Rich Media Content in Tags​

The Showcase Bundle SDK runs on your domain, therefore, it is necessary for users for the SDK Bundle to purchase their own API Keys with [Embed.ly](https://embed.ly).

### Connect using an OAuth Token​

Contact [Developer Support](mailto:m) to enable OAuth for your application.

To connect to a model using an OAuth token, pass an `access_token` as `auth` in the options argument to [connect](/reference/).
    
    
    const showcase = document.getElementById('showcase');  
    
    
    const showcaseWindow = showcase.contentWindow;  
    
    
    const mpSdk = await showcaseWindow.MP_SDK.connect(showcaseWindow, {  
    
    
      auth: '[access_token]',  
    
    
    });  
    

## SDK Web Component​

The Web Component is an alternate way to embed the Showcase Bundle SDK directly on your site without an iframe. See the [Web Component documentation](/webcomponent/) for details.

  * Latest Version
  * What is the Showcase Bundle SDK?
  * Installation
  * Iframe Method
    * Connect to the SDK
    * Rich Media Content in Tags
    * Connect using an OAuth Token
  * SDK Web Component


