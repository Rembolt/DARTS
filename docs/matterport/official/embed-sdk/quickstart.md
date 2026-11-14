<!-- source: https://developers.matterport.com/embed-sdk/quickstart/ -->

On this page

## A Complete Example to Get Started​

The following sample embeds our Showcase Player in an HTML document and uses the SDK Client Bootstrap to connect to the Showcase, ultimately returning the Showcase API. Simply replace [YOUR_SDK_KEY_HERE] with a valid SDK Key for the domain name that the page will be loaded from.
    
    
    <html>  
    
    
      <head>  
    
    
         <script type="importmap">  
    
    
          {  
    
    
            "imports": {  
    
    
              "MP_SDK": "https://api.matterport.com/sdk/bootstrap/3.1.0-0-g1cd7e0997a/sdk.es6.js?applicationKey=[YOUR_SDK_KEY_HERE]"  
    
    
            }  
    
    
          }  
    
    
        </script>  
    
    
      </head>  
    
    
      <body>  
    
    
        <iframe  
    
    
          width="853"  
    
    
          height="480"  
    
    
          src="https://my.matterport.com/show?m=SxQL3iGyoDo&play=1&applicationKey=[YOUR_SDK_KEY_HERE]"  
    
    
          frameborder="0"  
    
    
          allow="fullscreen; xr-spatial-tracking"  
    
    
          id="showcase-iframe">  
    
    
        </iframe>  
    
    
        <script type="module">  
    
    
          import { connect } from 'MP_SDK';  
    
    
          (async function connectSdk() {  
    
    
            const iframe = document.getElementById('showcase-iframe');  
    
    
      
    
    
            // connect the sdk; log an error and stop if there were any connection issues  
    
    
            try {  
    
    
              const mpSdk = await connect(iframe);  
    
    
              onShowcaseConnect(mpSdk);  
    
    
            } catch (e) {  
    
    
              console.error(e);  
    
    
            }  
    
    
          })();  
    
    
      
    
    
          async function onShowcaseConnect(mpSdk) {  
    
    
            // insert your sdk code here. See the ref /reference/  
    
    
      
    
    
            // try retrieving the model data and log the model's sid  
    
    
            try {  
    
    
              console.log('Hello SDK', mpSdk);  
    
    
              const modelData = await mpSdk.Model.getData();  
    
    
              console.log('Model sid:' + modelData.sid);  
    
    
            } catch (e) {  
    
    
              console.error(e);  
    
    
            }  
    
    
          }  
    
    
        </script>  
    
    
      </body>  
    
    
    </html>  
    

  * A Complete Example to Get Started


