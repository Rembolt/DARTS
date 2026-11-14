<!-- source: https://developers.matterport.com/tutorials/oauth-sample/ -->

On this page

note

OAuth is currently offered by invitation only for our Commercial Partners.

## Download the project​

We have provided a client and server example for getting started with OAuth.

You can download the starter project here:

[OAuth Starter](https://static.matterport.com/showcase-sdk/examples/oauth-0.3.1-0-g6cde06b/oauth/oauth-starter.zip)

## Prerequisites​

Your development environment will need node.js and yarn installed.

See <https://nodejs.org/en/> and <https://classic.yarnpkg.com/en/docs/install> for installation instructions specific to your environment.

To run this example, on your [Matterport account](https://my.matterport.com/settings/account/devtools), you will need to:

  * Generate a sandboxed sdk key
  * Create an application with "ViewDetails" permissions and <http://localhost:8080/redirect.html> as its redirect url



> See [Matterport Developer Tools Pricing and Availability](https://support.matterport.com/hc/en-us/articles/360057506813-Matterport-Developer-Tools-Pricing-and-Availability).

After setting up your OAuth application, you should see the following in your dev tools configuration

> To enable the option to create OAuth applications on your Matterport account, send us an email at [](mailto:)

![dev tools configuration](/assets/images/dev-tools-0cb5c8eed94202c818a4171d82eb99fc.png)

## Setting up the monorepo root​

Run these two commands when you first download the repo.
    
    
    > yarn install  
    
    
    > yarn install-bundle  
    

## Configuring the client and server​

Both the `@oauth/app` and `@oauth/server` will need to be configured with a few values from the [dev tools for your account](https://my.matterport.com/settings/account/devtools).

packages/oauth/server/config.ts needs:

  * client_id
  * client_secret



packages/oauth-app/src/config.ts needs:

  * applicationKey
  * clientId
  * redirectOrigin



The config files were kept separate to avoid potentially leaking the client_secret in front-end code.

## Running the example​

With the values configured above, the example should be ready to run.

In one terminal tab, run
    
    
    > yarn start-app [--port <number>]  
    
    
    yarn run v1.22.10  
    
    
    $ yarn workspace @oauth/server serve  
    
    
    $ node ./index.js serve  
    

In another terminal, run
    
    
    > yarn start-server [--port <number>]  
    
    
    yarn run v1.22.10  
    
    
    $ yarn workspace @oauth/app develop  
    
    
    $ webpack-dev-server  
    
    
    <i> [webpack-dev-server] Project is running at:  
    
    
    <i> [webpack-dev-server] Loopback: http://localhost:8080/  
    

Navigate to <http://localhost:8080>

**Notes**

  1. changing the server's port will also require a change in packages/oauth-app/src/redirect.html
  2. changing the app's port will require changing the `requestOrigin` in the packages/oauth-app/src/config.ts and the redirect url for your application in your Matterport developer tool settings



  * Download the project
  * Prerequisites
  * Setting up the monorepo root
  * Configuring the client and server
  * Running the example


