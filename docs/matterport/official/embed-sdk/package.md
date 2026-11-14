<!-- source: https://developers.matterport.com/embed-sdk/package/ -->

On this page

Package: [@matterport/sdk](https://www.npmjs.com/package/@matterport/sdk) on NPM

You can use the Matterport Showcase Embed SDK package to quickly scaffold a 3D showcase and attach the SDK.

**Prerequisites**

  * You should be familiar with the [command line](https://www.davidbaumgold.com/tutorials/command-line/).
  * You should have [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) or [Yarn](https://yarnpkg.com/getting-started/install) installed.
  * Finally, you should [obtain an SDK key](/embed-sdk/#how-do-i-obtain-an-sdk-key).



## Starting Your Project​

The Showcase Embed SDK package will work with any framework (React, Vue, Svelte, etc) or vanilla JavaScript or TypeScript.

Let's start a project using vanilla JS and Webpack. Tools like [Vite](https://vitejs.dev/) can be useful if you'd like to skip some of the setup work, but for now we'll stick with creating the project manually. (If you know how to create a project where you can `npm install` or `yarn add` dependencies, you can do so and skip ahead.)

Open the command line and navigate to the folder where you want your project. Then create a project folder and navigate into it. We'll call our project and its folder mp-sdk:
    
    
    mkdir mp-sdk  
    
    
    cd mp-sdk  
    

Initialize a new NPM or Yarn project. (Choose one or the other, whichever you prefer - we will provide instructions for both in this tutorial.) You can accept the default values in all of the prompts.
    
    
    # npm  
    
    
    npm init  
    
    
      
    
    
    # yarn  
    
    
    yarn init  
    

Next, install Webpack and a few plugins:
    
    
    # npm  
    
    
    npm install --save-dev webpack webpack-cli webpack-dev-server html-webpack-plugin  
    
    
      
    
    
    # yarn  
    
    
    yarn add --dev webpack webpack-cli webpack-dev-server html-webpack-plugin  
    

Create a file called `webpack.config.js` at your project root and set it up to build the redistributable files to `dist` by pasting the following content:
    
    
    const HtmlWebpackPlugin = require('html-webpack-plugin');  
    
    
    const path = require('path');  
    
    
      
    
    
    module.exports = {  
    
    
      entry: './index.js',  
    
    
      output: {  
    
    
        path: path.resolve(__dirname, './dist'),  
    
    
        filename: 'index_bundle.js',  
    
    
      },  
    
    
      plugins: [new HtmlWebpackPlugin()],  
    
    
    };  
    

Add the following `scripts` property (or replace the existing one) at the top level of your `package.json` file:
    
    
    "scripts": {  
    
    
      "dev": "webpack serve --mode=development",  
    
    
      "build": "webpack"  
    
    
    }  
    

Finally, add a file called `index.js` at your project root. Your project folder should now look like this:
    
    
    | node_modules  
    
    
    | index.js  
    
    
    | package.json  
    
    
    | webpack.config.json  
    

(Don't worry if you see extra `package-lock.json` or `yarn.lock` files - those are generated for internal use by NPM and Yarn, respectively.)

## Adding the SDK Package​

Next, we'll add the Showcase Embed SDK package:
    
    
    # npm  
    
    
    npm install @matterport/sdk  
    
    
      
    
    
    # yarn  
    
    
    yarn add @matterport/sdk  
    

Open `index.js` and import the function `setupSdk` from the package:
    
    
    import { setupSdk } from '@matterport/sdk'  
    

Then, below that, add an async function and call it right afterwards, including a `catch` to handle any errors:
    
    
    const main = async () => {  
    
    
      // Initialize SDK here  
    
    
      // ...  
    
    
    }  
    
    
    main().catch(err => console.error('Error:', err))  
    

Then, replace the commented ellipsis above with your `setupSdk` call. Pass your SDK key as the argument to the function:
    
    
      // Initialize SDK here  
    
    
      const mpSdk = await setupSdk('yourSdkKey')  
    

The full contents of `index.js` should look like this:
    
    
    import { setupSdk } from '@matterport/sdk'  
    
    
      
    
    
    const main = async () => {  
    
    
      // Initialize SDK here  
    
    
      const mpSdk = await setupSdk('yourSdkKey')  
    
    
    }  
    
    
    main().catch(err => console.error('Error:', err))  
    

where `yourSdkKey` is replaced by your SDK key.

## Running the server​

Run:
    
    
    # npm  
    
    
    npm run dev  
    
    
      
    
    
    # yarn   
    
    
    yarn dev  
    

and navigate to [localhost:8080](http://localhost:8080). You should see a sample Showcase space in an iframe (the actual space and presentation may be different depending on any future changes):

![sdk package success](/assets/images/sdk-package-success-3a223663ed2d9d76348a9ca36633fb10.png)

Your showcase is up and running! But we can do more than this - let's interact with the model when it's loaded.

## Using the SDK​

In `index.js`, below your `setupSdk` call, add the following lines:
    
    
    await mpSdk.App.state.waitUntil(state => state.phase === mpSdk.App.Phase.PLAYING)  
    

What's happening here? Let's take a look at a commented version:
    
    
    // use the SDK to wait until the app's state meets a condition...  
    
    
    await mpSdk.App.state.waitUntil(state =>   
    
    
      // ...specifically, when the state's `phase` property matches the `mpSdk.App.Phase.PLAYING` value  
    
    
      // (ie, when the app is ready to accept input)  
    
    
      state.phase === mpSdk.App.Phase.PLAYING  
    
    
    )  
    

Then, add these lines to animate a camera rotation on load:
    
    
    mpSdk.Camera.rotate(35, 0)  
    

Your entire index.js file should now look like this:
    
    
    import { setupSdk } from '@matterport/sdk'  
    
    
      
    
    
    const main = async () => {  
    
    
      // Initialize SDK here  
    
    
      const mpSdk = await setupSdk('yourSdkKey')  
    
    
      await mpSdk.App.state.waitUntil(state => state.phase === mpSdk.App.Phase.PLAYING)  
    
    
      mpSdk.Camera.rotate(35, 0)  
    
    
    }  
    
    
    main().catch(err => console.error('Error:', err))  
    

and the showcase demo should look like this:

## Next Steps​

This barely scratches the surface of what's possible with the SDK, but it's hopefully enough to point you in the right direction. Take a look at the [starter examples repo](https://github.com/matterport/sdk-package-examples) to see starter examples for different frameworks, and reach out to [](mailto:) with any questions or issues.

  * Starting Your Project
  * Adding the SDK Package
  * Running the server
  * Using the SDK
  * Next Steps


