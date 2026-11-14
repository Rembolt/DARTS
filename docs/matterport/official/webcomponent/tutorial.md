<!-- source: https://developers.matterport.com/webcomponent/tutorial/ -->

On this page

note

The Matterport Web Component is currently in public beta - interface and syntax are subject to change.

### Prerequisites​

  * You should be familiar with the [command line](https://www.davidbaumgold.com/tutorials/command-line/).
  * You should have [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) or [Yarn](https://yarnpkg.com/getting-started/install) installed.
  * Finally, you should [obtain an SDK key](https://matterport.github.io/showcase-sdk/sdk_home.html#installation).



### Starting Your Project​

The Web Component package will work with any framework (React, Vue, Svelte, etc) or vanilla JavaScript or TypeScript.

Let’s start a project using vanilla JS and Webpack. Tools like [Vite](https://vitejs.dev/) can be useful if you’d like to skip some of the setup work, but for now we’ll stick with creating the project manually. (If you know how to create a project where you can `npm install` or `yarn add` dependencies, you can do so and skip ahead.)

Open the command line and navigate to the folder where you want your project. Then create a project folder and navigate into it. We’ll call our project and its folder mp-webcomponent:
    
    
    mkdir mp-webcomponent  
    
    
    cd mp-webcomponent  
    

Initialize a new NPM or Yarn project. (Choose one or the other, whichever you prefer - we will provide instructions for both in this tutorial.) You can accept the default values in all of the prompts.
    
    
    # yarn  
    
    
    yarn init  
    
    
      
    
    
    # npm  
    
    
    npm init  
    

Next, install Webpack and a few plugins:
    
    
    # yarn  
    
    
    yarn add --dev webpack webpack-cli webpack-dev-server html-webpack-plugin  
    
    
      
    
    
    # npm  
    
    
    npm install --save-dev webpack webpack-cli webpack-dev-server html-webpack-plugin  
    

And install the supported version of [Three](https://threejs.org/) (replace `<version>` — see the note below). Do not install `latest`; only the supported version works:
    
    
    # yarn  
    
    
    yarn add three@<version>  
    
    
      
    
    
    # npm  
    
    
    npm install three@<version>  
    

note

The supported `three` version is the one in the package's `peerDependencies`. Find the current version (and full install steps) on the [npm package page](https://www.npmjs.com/package/@matterport/webcomponent) or in the package `README.md`.

note

If you’re going to use TypeScript, install the Three types: yarn add --dev @types/three or npm install --save-dev @types/three

Create a file called `webpack.config.js` at your project root and set it up by pasting the following content:
    
    
    const HtmlWebpackPlugin = require('html-webpack-plugin');  
    
    
    const path = require('path');  
    
    
      
    
    
    module.exports = {  
    
    
      entry: "./src/index.js",  
    
    
      output: {  
    
    
        path: path.resolve(__dirname, "./dist"),  
    
    
        filename: "index_bundle.js",  
    
    
      },  
    
    
      plugins: [  
    
    
        new HtmlWebpackPlugin({  
    
    
          template: path.resolve(__dirname, "./src/index.html"),  
    
    
        }),  
    
    
      ],  
    
    
      devServer: {  
    
    
        static: [path.resolve(__dirname, "static")],  
    
    
      },  
    
    
    };  
    

Add the following `scripts` property (or replace the existing one) at the top level of your package.json file:
    
    
    "scripts": {  
    
    
      "dev": "webpack serve --mode=development",  
    
    
      "build": "webpack"  
    
    
    }  
    

Finally, add a folder called `src` to the project root, and add a file called `index.js` and one called `index.html` inside `src`:
    
    
    mkdir src  
    
    
    touch src/index.html  
    
    
    touch src/index.js  
    
    
    Your project folder should now look like this:  
    
    
    
    | node_modules  
    
    
    | package.json  
    
    
    | src/  
    
    
    |-- index.html  
    
    
    |-- index.js  
    
    
    | webpack.config.json  
    

Your terminal should be in the `mp-webcomponent` directory

(Don’t worry if you see extra `package-lock.json` or `yarn.lock` files - those are generated for internal use by NPM and Yarn, respectively.)

### Adding the Web Component​

Next, we’ll add the Web Component:
    
    
    # yarn  
    
    
    yarn add @matterport/webcomponent  
    
    
      
    
    
    # npm  
    
    
    npm install @matterport/webcomponent  
    

And we’ll add the static assets:
    
    
    # yarn  
    
    
    yarn matterport-assets static  
    
    
      
    
    
    # npm  
    
    
    npx matterport-assets static  
    

note

The Web Component requires several static assets, like font files, textures, WASM files, compiled JS files, and more; this script is meant to be a single-step solution for copying those assets to your site.You may, but do not need to, check these files into source control - instead, you can include the yarn/npx matterport-assets your/static/folder command in your build script if you’re using a static site generator like Netlify. More on this workflow later.

Open `index.js` and import the Web Component by adding this line:
    
    
    import '@matterport/webcomponent';  
    

Then open index.html and add this line:
    
    
    <matterport-viewer m="SxQL3iGyoDo"></matterport-viewer>  
    

The Web Component wraps a custom web component that contains the 3D Matterport viewer; the m attribute sets the ID of the model you’d like to load. The value of m here is a sample space you can use for testing and dev.

Start your server:
    
    
    # yarn  
    
    
    yarn dev  
    
    
      
    
    
    # npm  
    
    
    npm run dev  
    

and navigate to `localhost:8080`. You should see a Matterport viewer and a sample space on your page.

### Interacting with the Space​

You can interact with the space by providing your SDK key to the `application-key` attribute (see [here](https://matterport.github.io/showcase-sdk/sdk_home.html#installation) if you don’t have an SDK key yet):
    
    
    <matterport-viewer m="SxQL3iGyoDo" application-key="YOUR_SDK_KEY"></matterport-viewer>  
    

Once you’ve done that, the viewer will emit two events you can listen for:

  1. `mpSdkConnected` - the SDK is connected and ready to use.
  2. `mpSdkPlaying` - the SDK is connected and ready to use, and the camera is ready to start accepting commands (ie, any intro fly-in has completed and the camera has stopped moving).



Both events have the same call signature, so you can swap out `mpSdkPlaying` for `mpSdkConnected` if needed. In `index.js`:
    
    
    const viewer = document.querySelector('matterport-viewer');  
    
    
    viewer.addEventListener('mpSdkPlaying', evt => {  
    
    
      const mpSdk = evt.detail.mpSdk;  
    
    
      mpSdk.Camera.rotate(90, 0);  
    
    
    })  
    

An even easier route is using the `sdkPromise`/`playingPromise` properties provided by the component, which correspond with the mpSdkConnected event and the mpSdkPlaying event, respectively.

To use those properties, add the following to your index.js file:
    
    
    const main = async () => {  
    
    
      const mpSdk = await document.querySelector('matterport-viewer').playingPromise;  
    
    
      mpSdk.Camera.rotate(90, 0);  
    
    
    }  
    
    
    main();  
    

Note that if you're using TypeScript you can set up querySelector to preserve strong typing:
    
    
    const mpSdk = await document.querySelector<MatterportViewer>('matterport-viewer')!.playingPromise;  
    

If you’ve added a working SDK key, you should see the model load, fly in, and turn to the right.

### Next Steps​

At this point, you can work with anything from any of the mpSdk namespaces, including Tags, Measurements, Scene objects, and more. Enjoy, and please reach out to with any questions or issues!

  * Prerequisites
  * Starting Your Project
  * Adding the Web Component
  * Interacting with the Space
  * Next Steps


