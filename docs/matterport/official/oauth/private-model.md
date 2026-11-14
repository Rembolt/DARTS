<!-- source: https://developers.matterport.com/oauth/private-model/ -->

On this page

note

OAuth is currently offered by invitation only for our Commercial Partners.

## Introduction​

If you have already generated an access token, the following sections will help you start using that token in Showcase to allow a private model to load with your SDK Application.

## Input the Token in the Showcase iFrame URL​

It's possible to supply the token directly to Showcase using a URL search parameter: `https://my.matterport.com/show/?m=<modelId>&auth=Bearer+<token>;`

Using this method does not require our SDK, but if the access_token expires during the Showcase session, it will cause Showcase to terminate. By using our SDK, you can refresh the access_token while the tour is being experienced.

## Input the Token Using the Showcase SDK​

The token can also be supplied to Showcase via our SDK. The method used is identical for the Embed SDK with the exception of initial SDK setup (see [Embed SDK Quickstart](/embed-sdk/quickstart/)). For this example, we will be using the Showcase Bundle SDK.

First, download the latest Showcase Bundle and add it to your page:
    
    
    <iframe id="showcase-player" width="853" height="480" src="http://my.matterport.com/show/?m=<modelId>&applicationKey=<key>" frameborder="0" allow="fullscreen; xr-spatial-tracking" style="width: 100%;"></iframe>  
    

Next, pass the authentication token to the SDK:
    
    
    const showcaseWindow = document.getElementById('showcase').contentWindow;  
    
    
    const bundleSdk = showcaseWindow.MP_SDK;  
    
    
    bundleSdk.connect(showcaseWindow, {  
    
    
       auth: <token>,  
    
    
    });  
    

## Refreshing the Token​

Refreshing tokens can be done automatically using the SDK’s [ITokenRefresher](/reference/mpsdk-docs/namespaces/OAuth/) mechanism.

First, create a helper to refresh tokens from your server. Something as simple as this could work.
    
    
    const fetcher = {  
    
    
       async fetch(oldToken) {  
    
    
          const response = await fetch('<your server>/refresh?');  
    
    
          return response.json();  
    
    
       }  
    
    
    }  
    

Then attach that fetcher to an instance of an ITokenRefresher.
    
    
      
    
    
    const refresher = bundleSdk.OAuth.createTokenRefresher({  
    
    
       access_token: <token>,  
    
    
       expires_in: <number>  
    
    
    }, fetcher);  
    
    
      
    

The fetcher should return a response similar to the response from the API. It should contain both the access_token and the expires_in. The ITokenRefresher should be seeded with the original response so that it can set up its timer.

## Labs Example Breakdown​

This section will break down the example available at [](https://labs.matterport.com)<https://labs.matterport.com>.

### All Together​

First, here is all of the code associated with the example:
    
    
    const showcaseElement = document.getElementById('showcase');  
    
    
    const oauthOverlay = document.getElementById('oauth-overlay');  
    
    
    const oauthButton = document.getElementById('oauth-diag-submit');  
    
    
      
    
    
    // Origins we possibly expect to receive messages over `postMessage` from  
    
    
    const safeOrigins = [  
    
    
       'https://static.matterport.com',  
    
    
       'https://static.matterportvr.cn',  
    
    
      window.location.origin,  
    
    
    ];  
    
    
      
    
    
    // when the user auths through the button provided, start everything and get it running  
    
    
    oauthButton.addEventListener('click', async function () {  
    
    
      async function onAuthMessage(msg) {  
    
    
         if (!authWindow) return;  
    
    
         // validate that we received a message from a known source  
    
    
         if (  
    
    
              msg.source === authWindow &&  
    
    
              safeOrigins.includes(msg.origin) &&  
    
    
              msg.data.type === 'auth_model'  
    
    
         ) {  
    
    
           // cleanup a bit: remove the message listener, and close the auth window  
    
    
           window.removeEventListener('message', onAuthMessage);  
    
    
           authWindow.close();  
    
    
      
    
    
           // set up some url params for Showcase  
    
    
           const { token, modelId } = msg.data;  
    
    
           const showcaseParams = new URLSearchParams(window.location.search);  
    
    
           showcaseParams.set('m', modelId);  
    
    
           showcaseParams.set('applicationKey', config.applicationKey);  
    
    
           showcaseParams.set('apiHost', 'https://my.matterport.com');  
    
    
           // start the Showcase player, hide the OAuth overlay, and connect the SDK  
    
    
           await loadShowcase(showcaseParams);  
    
    
           oauthOverlay.classList.add('collapsed');  
    
    
           await connectSdk({  
    
    
             auth: token,  
    
    
           });  
    
    
        }  
    
    
      }  
    
    
      window.addEventListener('message', onAuthMessage);  
    
    
      
    
    
      // open a window to start the user down the OAuth flow  
    
    
      const authWindow = window.open(  
    
    
        'https://authn.matterport.com/oauth/authorize?client_id=<client_id>&response_type=code&scope=ViewDetails',  
    
    
        'sdk auth',  
    
    
        'width=800,height=800'  
    
    
      );  
    
    
    });  
    
    
      
    
    
    // load the bundle in the IFrame and return a promise to await its load  
    
    
    export function loadShowcase(params) {  
    
    
       return new Promise((res) => {  
    
    
          showcaseElement.onload = res;  
    
    
          const src = './bundle/showcase.html';  
    
    
          // append the other url params -- make sure `apiHost` is defined so that the bundle properly connects  
    
    
          showcaseElement.src = src + '?' + params.toString();  
    
    
       });  
    
    
    }  
    
    
      
    
    
    // connect to the Bundle SDK  
    
    
    async function connectSdk(options) {  
    
    
       const showcaseWindow = showcaseElement.contentWindow;  
    
    
       const bundleConnector = showcaseWindow.MP_SDK;  
    
    
       return bundleConnector.connect(showcaseWindow, options);  
    
    
    }  
    

The redirect makes use of the Model Selector and an access_token available in the URL (available at <https://authn.matterport.com/model-select>).
    
    
    <iframe id='model-select' style='width: 100vw; height: 100vh;'></iframe>  
    
    
    <script>  
    
    
        (async function () {  
    
    
           const modelSelector = document.getElementById('model-select');  
    
    
           if (window.opener) {  
    
    
             // get the authorization_code out of the current URL  
    
    
             const urlParams = new URLSearchParams(window.location.search);  
    
    
             const auth_code = urlParams.get('code');  
    
    
      
    
    
             // Use the authorization_code with your server side script  
    
    
             // to fetch an access_token using your OAuth Client Credentials  
    
    
             const response = await fetch('https://path/to/server/token/?code=' + auth_code);  
    
    
             const responseJson = await response.json();  
    
    
             const oauthToken = responseJson.access_token;  
    
    
      
    
    
             // set the src of the IFrame (with the oauthToken) to start the model selector  
    
    
             modelSelector.src = 'https://authn.matterport.com/model-select?oauthToken=' + oauthToken;  
    
    
             // wait for the iframe to message us back  
    
    
             window.addEventListener('message', function (msg) {  
    
    
               if (msg.source === modelSelector.contentWindow) {  
    
    
                 if (msg.data.models) {  
    
    
                   // just take the first selected model  
    
    
                   const [modelId] = msg.data.models.split(',');  
    
    
                   if (modelId) {  
    
    
                     // post back to the app that opened this window  
    
    
                     window.opener.postMessage({  
    
    
                       type: 'auth_model',  
    
    
                       modelId,  
    
    
                       token: oauthToken,  
    
    
                     }, '*');  
    
    
                   }  
    
    
                 }  
    
    
               }  
    
    
             });  
    
    
          }  
    
    
        })();  
    
    
     </script>  
    

### Differneces with the Embed SDK​

While using OAuth in Embed SDK applications is identical to the Showcase Bundle SDK, initial setup of the SDK has very slight differences.

[SDK bootstrap v3.1.0](https://static.matterport.com/showcase-sdk/bootstrap/3.1.0-0-g1cd7e0997a/sdk.es6.js) must be downloaded and included.
    
    
    <script type="importmap">  
    
    
    {  
    
    
       "imports": {  
    
    
          "MP_SDK": "./sdk.es6.js"  
    
    
       }  
    
    
    }  
    
    
    </script>  
    

The connect function takes an Iframe element, not a window.
    
    
    <script type="module">  
    
    
       import { connect } from "MP_SDK";  
    
    
      
    
    
       const showcaseElement = document.getElementById('showcase');  
    
    
       // connect the SDK  
    
    
       async function connectSdk(options) {  
    
    
          return connect(showcaseWindow, options);  
    
    
       }  
    
    
    </script>  
    

Otherwise, the Embed SDK takes the same `options` argument as the Showcase Bundle and supports the same OAuth APIs.

## Breakdown​

This section will dive a bit deeper into specific code needed for OAuth and the flow in which events propagate.

### Starting the OAuth Flow​

We kick off the auth flow by opening a new window pointed at `https://authn.matterport.com/oauth/authorize`.

Opening a new window requires a user event so we use a button in an overlay over the Showcase player.
    
    
    oauthButton.addEventListener('click', async function () {  
    
    
       // ...  
    
    
       const authWindow = window.open(  
    
    
          'https://authn.matterport.com/oauth/authorize?client_id=<client_id>&response_type=code&scope=ViewDetails',  
    
    
          'sdk auth',  
    
    
          'width=800,height=800'  
    
    
       );  
    
    
    });  
    

Here, we’re opening a window with the initial OAuth page and saving the window reference for validation later. The **`client_id`** will need to be provided.

### Receiving the a Redirect Page With a Model Selector​

After the user has successfully logged in using the window we opened in the last step, they will be redirected to your redirect page. You will need to use the code provided in the redirect's URL to retrieve an access token.
    
    
    // redirect.html  
    
    
    <iframe id='model-select' style='width: 100vw; height: 100vh;'></iframe>  
    
    
    <script src='./redirect.js'></script>  
    
    
    
    // redirect.js  
    
    
    const urlParams = new URLSearchParams(window.location.search);  
    
    
    const auth_code = urlParams.get('code');  
    

Here, we created a simple page that contains an iFrame that we will eventually populate with the Model Selector, but first we read the code from the URL in order to generate an access_token.

### Fetching the Access Token Using the Authorization Code​

With the access_token we can display the model selector tool in our redirect page. We pass the access_token in via URL hash.
    
    
    const response = await fetch('https://path/to/server/token/?code=' + auth_code);  
    
    
    const responseJson = await response.json();  
    
    
    const oauthToken = responseJson.access_token;  
    

Here, we request our server to provide us with an **`access_token`** by hitting its /token endpoint and providing the token provided. On the server, we make the request back to **`https://api.matterport.com/api/oauth/token`** providing the all the fields necessary, including the client_secret.

### A Quick Server Side Example​

On the server side, using something like ExpressJS:
    
    
    app.use('/path/to/server/token', function (req, res) {  
    
    
       const requestBody = new URLSearchParams({  
    
    
          grant_type: 'authorization_code',  
    
    
          code: req.query.code,  
    
    
          scope: 'ViewDetails',  
    
    
          client_id: <client_id>,  
    
    
          client_secret: <client_secret>,  
    
    
       });  
    
    
       const tokenUrl = 'https://api.matterport.com/api/oauth/token';  
    
    
       console.log(`requesting token from ${tokenUrl}`);  
    
    
       const response = await fetch(tokenUrl, {  
    
    
          method: 'POST',  
    
    
          headers: {  
    
    
             'Content-Type': 'application/x-www-form-urlencoded'  
    
    
          },  
    
    
          body: requestBody,  
    
    
       });  
    
    
       const responseJson = await response.json();  
    
    
       res.send(responseJson);  
    
    
    });  
    

Here, when we receive a request at our /token endpoint, we make a request to **`https://api.matterport.com/api/oauth/token`** with all the necessary fields, and send the JSON response to the requester.

### Picking a Model​

Now that we have our oauth_token, we can set up the model selector and start receiving data from it. The model selector will postMessage back to a comma separated list of model IDs back to its .parent. To get the model selected, we will need to listen for the ‘message’ event from the Selector.
    
    
      
    
    
    window.addEventListener('message', function (msg) {  
    
    
       // validate the message is from our modelSelector IFrame  
    
    
       if (msg.source === modelSelector.contentWindow) {  
    
    
          const [modelId] = msg.data.models.split(','); // take just the first model id  
    
    
          window.opener.postMessage({  
    
    
             type: 'auth_model', // help distinguish this event from others  
    
    
             modelId,  
    
    
             token: oauthToken,  
    
    
          }, '*'); // TODO: specify the receiver's domain to reduce the exposure of the event  
    
    
       }  
    
    
    });  
    
    
      
    

Here, we are receiving messages from the iFrame and forwarding the first model ID of the IDs returned along with the token back to our .opener (since we opened the OAuth flow in a new window).

note

It's important to validate that the message we received is coming from within the iFrame and not an external source by checking the msg.source.Note that we are doing a postMessage to any domain ('*'). You will likely want to set this to the domain of your page so that you are not sending the event to any random site.

### Retrieving the Token for our Application​

So far we’ve been operating in a popup window, not in our application. We set up the redirect to postMessage back to its opener. In order to receive the token and model ID from the OAuth popup, we will need to listen for the 'message' event from the popup.
    
    
      
    
    
    async function onAuthMessage(msg) {  
    
    
       // validate that we received a message from a known source  
    
    
       if (msg.source === authWindow &&  
    
    
          safeOrigins.includes(msg.origin) &&  
    
    
          msg.data.type === 'auth_model') {  
    
    
         // cleanup a bit: remove the message listener, and close the auth window  
    
    
          window.removeEventListener('message', onAuthMessage);  
    
    
          authWindow.close();  
    
    
      
    
    
          const { token, modelId } = msg.data;  
    
    
          // ...  
    
    
       }  
    
    
    }  
    
    
    window.addEventListener('message', onAuthMessage);  
    
    
      
    

Here, we’re now listening for messages from our OAuth popup and when we receive the right message, we remove our message handler and close the popup since they are no longer needed.

note

Again, it's important to validate that the message we received is coming from within where we expect and not an external source by checking the msg.source and msg.origin

### Starting Showcase with the Token​

The last step is to use the token and Model ID in Showcase. Once you have the model ID, Showcase can be started. The token can be passed into Showcase as an option when connecting the SDK.
    
    
    const showcaseWindow = showcaseElement.contentWindow;  
    
    
    const bundleConnector = showcaseWindow.MP_SDK;  
    
    
    bundleConnector.connect(showcaseWindow, {  
    
    
       auth: token  
    
    
    });  
    

Here, we’re simply following the standard SDK connection routine, but including the token.

  * Introduction
  * Input the Token in the Showcase iFrame URL
  * Input the Token Using the Showcase SDK
  * Refreshing the Token
  * Labs Example Breakdown
    * All Together
    * Differneces with the Embed SDK
  * Breakdown
    * Starting the OAuth Flow
    * Receiving the a Redirect Page With a Model Selector
    * Fetching the Access Token Using the Authorization Code
    * A Quick Server Side Example
    * Picking a Model
    * Retrieving the Token for our Application
    * Starting Showcase with the Token


