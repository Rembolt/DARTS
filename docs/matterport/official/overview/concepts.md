<!-- source: https://developers.matterport.com/overview/concepts/ -->

On this page  
  
## Introduction​

With the Matterport 3D Showcase SDK, your web application (web app) can **execute actions** that change where the end user is and what they see in 3D Showcase.

You can also let end users explore spaces with 3D Showcase naturally. Your web app can **listen to events** about where the user is and what they are seeing or doing, and then react appropriately.

Your web app can **both** execute actions and listen to events. Depending on the purpose of your web app, you will typically only do one or the other.

Finally, you can also use metadata about the entire Matterport Space so your web app can make informed decisions about the entire space.

![Simple Message Flow with the 3D Showcase SDK](/assets/images/message-flow-30a2ebe5eee13e69dc0b5b5018680423.png)

_Simple Message Flow with the 3D Showcase SDK_

## The SDK is Asynchronous​

It is important to understand that the SDK operates by making requests to Showcase and returning responses as [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

For instance -- the initial connect call doesn't return the SDK object, but a promise _to_ that SDK object. Once `await`ed or `then`ed, this object will have all of the methods that we provide, divided into namespaces (App, Tag, etc) and visible via a console.log.
    
    
    try {  
    
    
      const mpSdk = await connect(iframe);  
    
    
      console.log('Hello SDK', mpSdk);  
    
    
    }  
    
    
    catch (e) {  
    
    
      console.error('Error', e);  
    
    
    }  
    

## Disconnecting the SDK​

If your application has a feature that loads a new space, either reusing the same iframe or removing the DOM Element that contains the Showcase, you will want to [disconnect](/reference/) the SDK before destroying or reusing that iframe. Then, you can connect again after the new page loads.

## Coordinate Conventions​

In our Showcase Application, X, Y, and Z coordinates are from the **viewpoint of the Matterport camera** when it scanned the environment.

To make it easier to visualize, pretend the Matterport camera is a “human” and the Matterport camera lenses are his or her “eyes.” The buttons on the back of the Matterport Camera back are like the back of a person’s head.

Then, coordinate conventions are easier to describe relative to how the imaginary 'camera-person' moves:

![XYZ Coordinate System](/assets/images/xyz-coordinate-system-58b844ecd9739a7d61226e9a4ae07736.png)

note

This diagram is shown relative to the current camera's position and orientation.

Another way to visualize the coordinate system is from the Floorplan View. This is the same as a “birds-eye” top-down view.

![Top-down Coordinate System](/assets/images/top-down-coordinate-system-ca0f9cb51d8d4fa191638bf01462f534.png)

The floorplan is an absolute position of the Matterport Camera within the Space when it scanned.

The orientation of the Floorplan View depends on the original orientation of the pano that you transitioned from and the aspect ratio of the window.

The coordinate system is centered around the **first pano that was scanned**. This may be different from your Start Position.

To find the first scan, find the space in [my.matterport.com](https://my.matterport.com) and then launch Workshop.

![First Scan in Matterport Workshop](/assets/images/first-scan-in-matterport-workshop-c993c0f47073aecdb701961d163585d2.jpg)

Open the **3D Scans & 360º Views** menu. **Double click on Scan 1** and you will be transported to that scan position.

## API to SDK Conversions​

Spatial data at Matterport is often expressed in various 3D coordinate systems, usually dependent on where the data loaded from or how it originated.

Developers may be surprised that the coordinate system in our Model API and Showcase SDK are different. This is due to the 3D data that is created, and orientation of this data when it is presented in our Showcase player.

Coordinate system| Description| Handedness| East*| North*| Up| Model API| All model assets are in this coordinate system| Right| +X| +Y| +Z| Showcase| When models are rendered for view via the web| Right| +X| -Z| +Y  
---|---|---|---|---|---  
  
In a nutshell, the Y and Z values are swapped and the 'Z' value is reversed.

  * Introduction
  * The SDK is Asynchronous
  * Disconnecting the SDK
  * Coordinate Conventions
  * API to SDK Conversions


