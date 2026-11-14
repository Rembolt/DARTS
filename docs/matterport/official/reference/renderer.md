<!-- source: https://developers.matterport.com/reference/renderer/ -->

On this page

Types

  * Resolution
  * Visibility
  * WorldPositionData



Methods

  * getScreenPosition
  * getWorldPositionData
  * takeEquirectangular
  * takeScreenShot



## Types​

### Resolution​

Resolution: _object_

Property| Type| height| number| width| number  
---|---  
  
### Visibility​

Visibility: _object_

Property| Type| mattertags| boolean| measurements| boolean| sweeps| boolean| views| boolean  
---|---  
  
### WorldPositionData​

WorldPositionData: _object_

Property| Type| floor| number| floorInfo| { id: string; sequence: number; }| position| [Vector3](/reference/#type-vector3) | null  
---|---  
  
## Methods​

### getScreenPosition​

getScreenPosition(worldPosition: [Vector3](/reference/#type-vector3)): Promise<[Vector2](/reference/#type-vector2)>

deprecated Use [`Conversion.worldToScreen`](/reference/conversion/#worldtoscreen) to convert a 3d position to a point on screen.

Parameter| Type| worldPosition| [Vector3](/reference/#type-vector3)  
---|---  
  
**Returns:** `Promise`<[Vector2](/reference/#type-vector2)>

### getWorldPositionData​

getWorldPositionData(screenPosition: [Vector2](/reference/#type-vector2), height?: number, includeHiddenFloors?: boolean): Promise<Renderer.WorldPositionData>

Converts a screen position into a world position

If the height is not passed in, the function returns the first raycast hit in the direction of that screen position. However, if there is no intersection with the model in that direction, the position will be null and the floor will be -1.
    
    
    const screenPosition {x: 0, y: 0}; // Top left corner of the screen  
    
    
      
    
    
    mpSdk.Renderer.getWorldPositionData(screenPosition)  
    
    
    .then(function(data){  
    
    
       const worldPosition = data.position; // e.g. {x: 2.2323231, y: 4.7523232, z; 7.92893};  
    
    
       const floor = data.floor; // e.g. 2  
    
    
    });  
    

If the height is passed in, the function returns the intersection with the plane at that height. However, if there is no intersection with the plane in that direction, the position will be null and the floor will be -1.
    
    
    const screenPosition {x: 0, y: 0}; // Top left corner of the screen  
    
    
    const height = 20;  
    
    
      
    
    
    mpSdk.Renderer.getWorldPositionData(screenPosition, height)  
    
    
    .then(function(data){  
    
    
       const worldPosition = data.position; // e.g. {x: 2.2323231, y: 20, z; 7.92893};  
    
    
       const floor = data.floor // e.g. 2  
    
    
    });  
    

Parameter| Type| screenPosition| [Vector2](/reference/#type-vector2)  
The screen position in pixels from the top-left corner of the screen. For example, {x: 300, y: 200} would be the position 300 pixels right and 200 pixels down from the top-left corner.| height?| number  
Optional parameter for the height of the horizontal plane to intersect. If not provided, the closest intersection with the model in that direction will be returned.| includeHiddenFloors?| boolean  
Optional parameter that will include floors that are hidden and ghosted when determining the closest intersection with the model.  
---|---  
  
**Returns:** `Promise`<Renderer.WorldPositionData>

**Notes** Returns null position if the direction of the screen position does not intersect with the model, or if a height was given, if the the direction does not intersect with the plane at the given height.

### takeEquirectangular​

takeEquirectangular(): Promise<string>

Takes an equirectangular screenshot (JPEG) of the currently active sweep.
    
    
    mpSdk.Renderer.takeEquirectangular()  
    
    
      .then(function (screenShotUri) {  
    
    
        // set src of an img element  
    
    
        img.src = screenShotUri  
    
    
    });  
    

**Returns:** `Promise`<string>

A promise that resolves with the screenshot URI -- a base64 encoded string which is usable as a src of an `` element.

**Errors** Warns if the camera is not in Panorama mode and is instead in Dollhouse or Floorplan mode.

**Notes** It is not on Matterport servers and does not persist between user sessions.

### takeScreenShot​

takeScreenShot(resolution?: Renderer.Resolution, visibility?: Partial<Renderer.Visibility>): Promise<string>

Takes a screenshot (JPEG) of the user’s current view.
    
    
    const resolution = {  
    
    
      width: 600,  
    
    
      height: 800  
    
    
    };  
    
    
      
    
    
    const visibility = {  
    
    
      mattertags: false,  
    
    
      sweeps: true  
    
    
    };  
    
    
      
    
    
    mpSdk.Renderer.takeScreenShot(resolution, visibility)  
    
    
      .then(function (screenShotUri) {  
    
    
        // set src of an img element  
    
    
        img.src = screenShotUri  
    
    
    });  
    

Parameter| Type| resolution?| Renderer.Resolution  
The desired resolution for the screenshot. For example: {width: 1920, height: 1080} If no resolution is specified, then the resolution of the size of Showcase (the current window or the iframe embed) is used. Maximum 4096 x 4096.| visibility?| Partial<Renderer.Visibility>  
Toggles certain scene objects such as Mattertag Posts and sweep markers. If no visibility object is specified, then all scene objects are hidden.  
---|---  
  
**Returns:** `Promise`<string>

A promise that resolves with the screenshot URI -- a base64 encoded string which is usable as a src of an `` element.

**Errors** Warns if the resolution is 0 or negative.

  * Types
    * Resolution
    * Visibility
    * WorldPositionData
  * Methods
    * getScreenPosition
    * getWorldPositionData
    * takeEquirectangular
    * takeScreenShot



  * Types
    * Resolution
    * Visibility
    * WorldPositionData
  * Methods
    * getScreenPosition
    * getWorldPositionData
    * takeEquirectangular
    * takeScreenShot


