<!-- source: https://developers.matterport.com/bundle-sdk/quickstart/ -->

On this page

## A Complete Example to Get Started​

This sample HTML creates an iframe containing a Matterport model. It then connects the SDK, retrieves data about the model, and finally logs the model's id.

You must include your SDK Key in your URL with your own key (without the square brackets "[", "]").
    
    
    <html>  
    
    
      <head>  
    
    
        <title>Showcase Bundle SDK Quickstart</title>  
    
    
      </head>  
    
    
      <body>  
    
    
        <iframe  
    
    
          width="853"  
    
    
          height="480"  
    
    
          src="/bundle/showcase.html?m=JGPnGQ6hosj&applicationKey=[YOUR_SDK_KEY_HERE]"  
    
    
          frameborder="0"  
    
    
          allow="fullscreen; xr-spatial-tracking"  
    
    
          id="showcase">  
    
    
        </iframe>  
    
    
      
    
    
        <script>  
    
    
        const bundleIframe = document.getElementById('showcase');  
    
    
        const showcaseWindow = bundleIframe.contentWindow;  
    
    
        showcase.addEventListener('load', async function() {  
    
    
          try {  
    
    
            const mpSdk = await showcaseWindow.MP_SDK.connect(showcaseWindow)  
    
    
            onShowcaseConnect(mpSdk);  
    
    
          }  
    
    
          catch(e) {  
    
    
            console.error(e);  
    
    
            return;  
    
    
          }  
    
    
        });  
    
    
      
    
    
       async function onShowcaseConnect(mpSdk) {  
    
    
         // insert your sdk code here. See the ref /reference/  
    
    
          console.log('Hello Bundle SDK', mpSdk);  
    
    
      
    
    
         // try retrieving the model data and log the model's sid  
    
    
         try {  
    
    
           const modelData = await mpSdk.Model.getData();  
    
    
           console.log('Model sid:' + modelData.sid);  
    
    
         } catch (e) {  
    
    
           console.error(e);  
    
    
         }  
    
    
       }  
    
    
      </script>  
    
    
      <body>  
    
    
    </html>  
    

  * A Complete Example to Get Started


