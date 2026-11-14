<!-- source: https://developers.matterport.com/embed-sdk/ -->

On this page

## Getting Started​

First, create an SDK key. To manage keys, log in to your account, navigate to [Account Settings > Developer Tools](https://my.matterport.com/settings/account/devtools), and scroll down to "SDK Key Management". Click "Add an SDK Key" and add any desired local domains to the allow list (for example, `localhost` and `localhost:8080`).

To learn more about our developer tools, please visit [Matterport Developer Tools and Pricing](https://support.matterport.com/hc/en-us/articles/360057506813-Matterport-Developer-Tools-Pricing-and-Availability).

Once you have an SDK key, there are two methods for adding the Embed SDK to your site:

  1. **Script tag** (standard method)
  2. **NPM package** (beta)



The Embed SDK always uses the latest version automatically. See the [change log](/sdk-changelog/) for recent updates.

## `<script>` support​

note

These instructions are for including the SDK via a `<script>` tag. There is also an NPM package available.

### Include the Library and Add a Matterport Space​

First, download the [SDK bootstrap](https://static.matterport.com/showcase-sdk/bootstrap/3.1.0-0-g1cd7e0997a/sdk.es6.js) and add it to the project.

Optionally, set up an importmap. This line goes in the `<head>` tag with your other includes.
    
    
    <script type="importmap">  
    
    
    {  
    
    
      "imports": {  
    
    
        "MP_SDK": "./[path]/[to]/sdk.es6.js?applicationKey=[YOUR_SDK_KEY_HERE]"  
    
    
      }  
    
    
    }  
    
    
    </script>  
    

Be sure to include the applicationKey when importing the library.

Next, embed a Matterport Space on your web page with an `<iframe>` tag. [Learn more about embedding](https://support.matterport.com/hc/en-us/articles/115004549347-Embed-a-Space-with-an-iframe-).

Add the **applicationKey=[YOUR SDK_KEY]** URL parameter to provide your sdk key as part of the url.

Give the `<iframe>` an ID you will use later.
    
    
    <iframe  
    
    
      width="853"  
    
    
      height="480"  
    
    
      src="https://my.matterport.com/show?m=SxQL3iGyoDo&play=1&applicationKey=[YOUR_SDK_KEY_HERE]"  
    
    
      frameborder="0"  
    
    
      allow="fullscreen; xr-spatial-tracking"  
    
    
      id="showcase-iframe">  
    
    
    </iframe>  
    

### Connect to the Matterport Space​

Now in the Javascript code for your web application, connect to the Matterport Space.

You’ll want to wait until the `<iframe>` containing the Matterport Space loads. Connecting happens after you’ve included the SDK library.

Replace the **[YOUR_SDK_KEY_HERE]** string with your sdk key.
    
    
    // if using the importmap  
    
    
    import { connect } from 'MP_SDK';  
    
    
      
    
    
    // if importing directly  
    
    
    import { connect } from './[path]/[to]/sdk.es6.js'  
    
    
      
    
    
    const iframe = document.getElementById('showcase-iframe');  
    
    
      
    
    
    // connect the sdk; log an error and stop if there were any connection issues  
    
    
    try {  
    
    
      const mpSdk = await connect(iframe);  
    
    
      onShowcaseConnect(mpSdk);  
    
    
    } catch (e) {  
    
    
      console.error(e);  
    
    
    }  
    
    
      
    
    
    function onShowcaseConnect(mpSdk) {  
    
    
      // start making calls on mpSdk as described in the reference docs  
    
    
    }  
    

Parameter| Description| `showcase-iframe`| The value you put for the the `id` parameter in the `<iframe>` tag earlier.| `applicationKey`| Your SDK key is unique to your website domain. Go to Matterport Account Settings -> Developer Tools to create an SDK key for your application.  
---|---  
  
note

Visit [Sandbox vs. Production Access](https://support.matterport.com/hc/en-us/articles/360057506813-Developer-Tools-Pricing-and-Availability#sandbox-vs-production-access-0-0) to learn more about developer tools access restrictions.

note

For local development, you’ll need to run your app off a local web server. See [Setting up a Local Environment](/tutorials/local-environment/) for guidance.

### Legacy window.MP_SDK Support​

Previous versions of the SDK set up a `window.MP_SDK` object with a `connect` function. To continue using this same connect method, use the non-ES6 version.
    
    
    <script src="https://static.matterport.com/showcase-sdk/bootstrap/3.1.0-0-g1cd7e0997a/sdk.js?applicationKey=[YOUR_SDK_KEY]"></script>  
    
    
    <script>  
    
    
      window.MP_SDK.connect(iframe, 'applicationkey')  
    
    
    </script>  
    

However, connecting to a space with OAuth through the SDK is not supported by this version of the bootstrap. If support for OAuth is necessary, you will need to use the aforementioned `sdk.es6.js` instead.

### Control 3D Showcase with Actions​

Now you’ll want to make an action for 3D Showcase to execute. In the code for your web application, add this to a Javascript function where desired. Refer to the [reference docs](/reference/) for a list of all the actions you can do.
    
    
    mpSdk.<action>(<arguments>).then(successCallback)  
    
    
    .catch(errorCallback);  
    
    
      
    
    
    // ...  
    
    
      
    
    
    // What to do if action was successful  
    
    
    function successCallback(message) { console.log(message); }  
    
    
      
    
    
    // What to do if the action failed  
    
    
    function errorCallback(err) { console.error(err); }  
    

Parameter| Description| `<action>`| The action you want 3D Showcase to do.| `<arguments>`| The arguments for that action.  
---|---  
  
### Listen to Events from 3D Showcase​

Listening for events from 3D Showcase is done in a similar way.
    
    
    mpSdk.on(<event_name>, function (<state_arguments>) {  
    
    
      // what to do when this event happens  
    
    
    });  
    

Parameter| Description| `<event_name>`| Event you're listening for| `<state_arguments>`| Return values related to this event. These tell you about the new state of 3D Showcase after this event has happened.  
---|---  
  
### Use the Metadata​

Finally, you can grab metadata about the entire Matterport Space by calling `getData()` and `getDetails()` in your web app. For example:
    
    
    mpSdk.Model.getData()  
    
    
      .then(function(model) {  
    
    
        // Model data successfully retrieved  
    
    
        console.log('Model sid:' + model.sid);  
    
    
      })  
    
    
      .catch(function(error) {  
    
    
        // Problem retrieving model data  
    
    
      });  
    

Metadata is only available **after** you have successfully connected to the Matterport Space.

## NPM SDK Embed Package​

The NPM SDK Embed package allows you to use the Embed SDK directly from your NPM or Yarn projects. See [the docs on NPM](https://www.npmjs.com/package/@matterport/sdk) for the latest instructions.

See [here](/embed-sdk/package/) for a tutorial on getting started with the package.

  * Getting Started
  * `<script>` support
    * Include the Library and Add a Matterport Space
    * Connect to the Matterport Space
    * Legacy window.MP_SDK Support
    * Control 3D Showcase with Actions
    * Listen to Events from 3D Showcase
    * Use the Metadata
  * NPM SDK Embed Package


