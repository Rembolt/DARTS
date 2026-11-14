<!-- source: https://developers.matterport.com/tutorials/local-environment/ -->

On this page

In order to go through the tutorials, you will need to setup the following development environment.

## Prerequisites​

Make sure your development environment has node.js and yarn installed.

See <https://nodejs.org/en/> and <https://classic.yarnpkg.com/en/docs/install> for installation instructions specific to your environment.

## Download and install the showcase sdk tutorial repository​

The github url is <https://github.com/matterport/showcase-sdk-tutorial>.

clone using ssh:
    
    
    > git clone git@github.com:matterport/showcase-sdk-tutorial.git  
    
    
    > cd showcase-sdk-tutorial  
    
    
    > yarn install  
    

or clone using https:
    
    
    > git clone https://github.com/matterport/showcase-sdk-tutorial.git  
    
    
    > cd showcase-sdk-tutorial  
    
    
    > yarn install  
    

## Download and extract the latest Bundle SDK​
    
    
    > curl https://static.matterport.com/showcase-sdk/bundle//showcase-bundle.zip -o bundle.zip  
    
    
    > unzip bundle.zip -d ./bundle  
    

If you don't have curl, you download the file from your browser and expand it manually in the showcase-sdk-tutorial directory.

## Set your application key​

You will need to set the application key in two places.

  * The function call to connect().Source <https://github.com/matterport/showcase-sdk-tutorial/blob/master/src/index.ts>


    
    
      sdk = await showcase.contentWindow.MP_SDK.connect(showcase, 'PUT_APPLICATION_KEY_HERE', '3.5');  
    

  * The bundle iframe.Source <https://github.com/matterport/showcase-sdk-tutorial/blob/master/index.html>


    
    
    <iframe  
    
    
      id="showcase"  
    
    
      src="/bundle/showcase.html?m=22Ub5eknCVx&play=1&qs=1&log=0&applicationKey=PUT_APPLICATION_KEY_HERE"  
    
    
      width="800px"  
    
    
      height="600px"  
    
    
      frameborder=”0”  
    
    
      allow="fullscreen; xr-spatial-tracking">  
    
    
    </iframe>  
    

## Start the development environment​

The tutorial uses webpack-dev-server to host a local environment. See <https://webpack.js.org/configuration/dev-server> for additional configuration options.
    
    
    > yarn start  
    

## Browse to the local environment​

Launch [](http://localhost:8000/)<http://localhost:8000/>

Open the debug console and you should see:`Hello Bundle SDK!`

  * Prerequisites
  * Download and install the showcase sdk tutorial repository
  * Download and extract the latest Bundle SDK
  * Set your application key
  * Start the development environment
  * Browse to the local environment


