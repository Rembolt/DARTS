<!-- source: https://developers.matterport.com/reference/camera/ -->

On this page

Types

  * LookAtOptions
  * Pose
  * RotateOptions
  * ZoomData



Enumerations

  * Direction
  * Event
  * TransitionType



Observables

  * pose
  * zoom



Methods

  * getPose
  * lookAt
  * lookAtScreenCoords
  * moveInDirection
  * pan
  * rotate
  * setRotation
  * zoomBy
  * zoomReset
  * zoomTo



## Types​

### LookAtOptions​

LookAtOptions: _object_

Options for Camera.lookAt method

Property| Type| mode?| [Mode.Mode](/reference/mode/#enum-mode) | undefined  
Target view mode. If not specified, stays in current mode. Valid values include Dollhouse, Floorplan, and Inside.| moveToClosestSweep?| boolean | undefined  
Defaults to false. If true, moves to the nearest sweep before looking.| offset?| [Vector3](/reference/#type-vector3) | undefined  
Camera offset from the target: the camera is placed at position + offset, looking at position. With moveToClosestSweep, the nearest sweep is the one closest to that offset.| transition?| Camera.TransitionType | undefined  
Type of transition animation. Not valid for Floorplan mode.| transitionTime?| number | undefined  
Transition duration in milliseconds.  
---|---  
  
### Pose​

Pose: _object_

Property| Type| mode| [Mode.Mode](/reference/mode/#enum-mode)| position| [Vector3](/reference/#type-vector3)| projection| Float32Array| rotation| [Vector2](/reference/#type-vector2)| sweep| string  
---|---  
  
### RotateOptions​

RotateOptions: _object_

Property| Type| speed?| number | undefined  
Rotation speed in degrees per second.  
---|---  
  
### ZoomData​

ZoomData: _object_

Property| Type| level| number  
The current zoom level  
---|---  
  
## Enumerations​

### Direction​

Direction: _enum_

Member| Value| BACK| "BACK"| DOWN| "DOWN"| FORWARD| "FORWARD"| LEFT| "LEFT"| RIGHT| "RIGHT"| UP| "UP"  
---|---  
  
### Event​

Event: _enum_

Member| Value| MOVE| "camera.move"  
---|---  
  
### TransitionType​

TransitionType: _enum_

Transition types for camera movements. This is the canonical transition type enum. Used for [`Mode.moveTo`](/reference/mode/#moveto), [`Sweep.moveTo`](/reference/sweep/#moveto), [`Mattertag.navigateToTag`](/reference/mattertag/#navigatetotag), and other camera movement methods. Note: not all values are supported, refer to per-method documentation for details.

Member| Value| FADEOUT| "transition.fade"  
Fade to black transition| FLY| "transition.fly"  
Fly transition| INSTANT| "transition.instant"  
Instant transition| MOVEFADE| "transition.movefade"  
experimental Move with fade transition| ORBIT| "transition.orbit"  
experimental Orbit transition  
---|---  
  
## Observables​

### pose​

pose: [IObservable](/reference/iobservable/)<Camera.Pose>

An observable pose data object that can be subscribed to.
    
    
    mpSdk.Camera.pose.subscribe(function (pose) {  
    
    
      // Changes to the Camera pose have occurred.  
    
    
      console.log('Current position is ', pose.position);  
    
    
      console.log('Rotation angle is ', pose.rotation);  
    
    
      console.log('Sweep UUID is ', pose.sweep);  
    
    
      console.log('View mode is ', pose.mode);  
    
    
    });  
    

### zoom​

zoom: [IObservable](/reference/iobservable/)<Camera.ZoomData>

An observable zoom level of the camera in Panorama mode. The zoom level will be 1.0 for all other viewmodes.
    
    
    mpSdk.Camera.zoom.subscribe(function (zoom) {  
    
    
      // the zoom level has changed  
    
    
      console.log('Current zoom is ', zoom.level);  
    
    
    });  
    

## Methods​

### getPose​

getPose(): Promise<Camera.Pose>

deprecated You can use the `pose` observable property instead.

Returns the current state of camera.
    
    
    mpSdk.Camera.getPose()  
    
    
      .then(function(pose){  
    
    
        console.log('Current position is ', pose.position);  
    
    
        console.log('Rotation angle is ', pose.rotation);  
    
    
        console.log('Sweep UUID is ', pose.sweep);  
    
    
        console.log('View mode is ', pose.mode);  
    
    
      });  
    

**Returns:** `Promise`<Camera.Pose>

A promise that resolves with the current state of the camera.

### lookAt​

lookAt(position: [Vector3](/reference/#type-vector3), options?: Camera.LookAtOptions): Promise<void>

experimental

Looks at a specific 3D world position. Works in dollhouse, floorplan, and inside (panorama) view modes. In Dollhouse or Floorplan View it reframes the camera on the point, with an optional offset.
    
    
    // Turn to face a position  
    
    
    mpSdk.Camera.lookAt({ x: 0, y: 1, z: 0 })  
    
    
      .then(function() {  
    
    
        // Camera rotation complete.  
    
    
      })  
    
    
      .catch(function(error) {  
    
    
        // Camera rotation error.  
    
    
      });  
    
    
      
    
    
    // Move to the nearest sweep, facing the position  
    
    
    mpSdk.Camera.lookAt({ x: 0, y: 1, z: 0 }, { moveToClosestSweep: true });  
    
    
      
    
    
    // Look at a position with a transition of 2 seconds  
    
    
    mpSdk.Camera.lookAt(  
    
    
      { x: 0, y: 1, z: 0 },  
    
    
      {  
    
    
        moveToClosestSweep: true,  
    
    
        mode: mpSdk.Mode.Mode.DOLLHOUSE,  
    
    
        transition: mpSdk.Camera.TransitionType.FLY,  
    
    
        offset: { x: 2, y: 0, z: 0 },  
    
    
        transitionTime: 2000,  
    
    
      }  
    
    
    ).then(function() {  
    
    
      // Camera positioned 2 units to the right of the target, looking at it  
    
    
    });  
    

Parameter| Type| position| [Vector3](/reference/#type-vector3)  
The 3D world position to look at.| options?| Camera.LookAtOptions  
Optional parameters for the camera movement.  
---|---  
  
**Returns:** `Promise`<void>

A Promise that resolves when the camera movement is complete.

**Errors**

  * Fails if position coordinates are invalid (NaN or not numbers).
  * Fails if offset coordinates are invalid when provided.
  * Fails if transitionTime is provided and is not a positive finite number.



### lookAtScreenCoords​

lookAtScreenCoords(x: number, y: number): Promise<void>

Rotates the camera to a specific screen coordinate. Coordinates are measure in pixels, relative to the WebGL Canvas' top left corner. See <https://www.w3schools.com/graphics/canvas_coordinates.asp> for more information on coordinates.
    
    
    mpSdk.Camera.lookAtScreenCoords(500, 320)  
    
    
      .then(function() {  
    
    
        // Camera rotation complete.  
    
    
      })  
    
    
      .catch(function(error) {  
    
    
        // Camera rotation error.  
    
    
      });  
    

Parameter| Type| x| number  
Horizontal position, in pixels. Starting from the canvas' top left corner.| y| number  
Vertical position, in pixels. Starting from the canvas' top left corner.  
---|---  
  
**Returns:** `Promise`<void>

A Promise that resolves when the rotation is complete.

**Errors**

  * Fails if used outside of Inside mode.
  * Warns to console if you rotated, but then you hit the vertical limit.
  * Fails if no movement because you are already at a rotation limit.



### moveInDirection​

moveInDirection(direction: Camera.Direction): Promise<void>

Moves user to a different sweep relative to their current location
    
    
    const nextDirection = mpSdk.Camera.Direction.FORWARD;  
    
    
      
    
    
    mpSdk.Camera.moveInDirection(nextDirection)  
    
    
      .then(function(){  
    
    
        console.log('The camera has moved forward.');  
    
    
      })  
    
    
      .catch(function(){  
    
    
        console.warning('An error occured while moving in that direction.');  
    
    
      });  
    

Parameter| Type| direction| Camera.Direction  
The direction.  
---|---  
  
**Returns:** `Promise`<void>

A promise that resolves when a sweep has been reached.

**Errors**

  * Fails if direction is not one of the above options.
  * Warns if you can’t move in that direction (hit a wall).



**Notes** This is the same behavior as if the user presses the arrow keys while in 3D Showcase.

  * Camera.Direction.UP is like moving forwards
  * Camera.Direction.DOWN is like moving backwards



This action is for moving between sweeps while in Inside View.

### pan​

pan(params: { x: number; z: number; }): Promise<void>

Pans the camera.
    
    
    mpSdk.Camera.pan({ x: 1, z: 1 })  
    
    
      .then(function() {  
    
    
        // Pan complete.  
    
    
      })  
    
    
      .catch(function(error) {  
    
    
        // Pan error.  
    
    
      });  
    

Parameter| Type| params| { x: number; z: number; }  
Object containing x and z coordinates. params.x: Absolute position of the sweep on the x axis. params.z: Absolute position of the sweep on the z axis.  
---|---  
  
**Returns:** `Promise`<void>

A promise that resolves when the pan is complete.

**Errors**

  * Warns if pan was successful but you hit the model bounds.
  * Fails if you are already at the model bounds and you cannot move any further.



**Notes** The orientation of the axes depends on the sweep you were in before entering Floorplan and the aspect ratio of window.

Only available in Dollhouse or Floorplan View. This is the same behavior as if the user uses the keyboard shortcuts W, A, S, and D or the arrow keys.

Use `mpSdk.Camera.pan({ x: 0, z: 0 });` to return to directly above the very first sweep scanned.

### rotate​

rotate(horizontal: number, vertical: number, options?: Camera.RotateOptions): Promise<void>

Rotates the camera (user’s viewpoint).
    
    
    mpSdk.Camera.rotate(10, -20, { speed: 2 })  
    
    
      .then(function() {  
    
    
        // Camera rotation complete.  
    
    
      })  
    
    
      .catch(function(error) {  
    
    
        // Camera rotation error.  
    
    
      });  
    

Parameter| Type| horizontal| number  
How many degrees to rotate left or right.| vertical| number  
How many degrees to rotate up or down.| options?| Camera.RotateOptions  
additional rotation options such as speed  
---|---  
  
**Returns:** `Promise`<void>

A promise that resolves when the rotation is complete.

**Errors**

  * Warns to console if you rotated, but then you hit the vertical limit.
  * Warns if trying to rotate up or down in Floorplan View.
  * Fails if no movement because you are already at a rotation limit.



**Notes** If user is in Dollhouse or Floorplan View, the entire Matterport Space is rotated.

  * Positive values for horizontal means the Space rotates clockwise.
  * Negative values for horizontal counterclockwise rotations.
  * In Dollhouse view, vertical ranges from 0° (horizontal) to 80° above the Space.
  * In Floorplan view, the vertical value is ignored.



If the user is in Inside View or 360º View, their viewpoint is rotated.

  * Positive values for horizontal means the user rotates clockwise.
  * Negative values for horizontal are counterclockwise rotations.
  * Vertical ranges from -70° (down) to 70° (up).
  * Tilting the view (similar to tilting one’s head) not supported.



Rotation is relative to the user’s current viewpoint. This is the same behavior as if the user uses the keyboard shortcuts I, J, K, and L. Speeds less than or equal to zero are not allowed.

### setRotation​

setRotation(rotation: [Rotation](/reference/#type-rotation), options?: Camera.RotateOptions): Promise<void>

Sets the orientation of the camera (user’s viewpoint) while in Panorama, Dollhouse or Floorplan View.
    
    
    mpSdk.Camera.setRotation({ x: 10, y: -20 }, { speed: 2 })  
    
    
      .then(function() {  
    
    
        // Camera rotation complete.  
    
    
      })  
    
    
      .catch(function(error) {  
    
    
        // Camera rotation error.  
    
    
      });  
    

Parameter| Type| rotation| [Rotation](/reference/#type-rotation)  
The target rotation| options?| Camera.RotateOptions  
additional rotation options such as speed  
---|---  
  
**Returns:** `Promise`<void>

A promise that resolves when the rotation is complete.

**Errors**

  * Fails if the current view mode is not Panorama, Dollhouse or Floorplan View.



**Notes**

  * A target rotation can be retrieved from `Camera.pose`
  * Rotation is absolute so multiple calls will not further change orientation (floating point error notwithstanding).
  * Speeds less than or equal to zero are not allowed.
  * In Dollhouse and Floorplan View the camera orbits around its focus point, and the vertical angle is limited to the range a user can reach by dragging.
  * In Floorplan View the camera always tilts out of the top-down view, since the steepest vertical angle it reaches is 89° down.



### zoomBy​

zoomBy(zoomDelta: number): Promise<number>

Zooms the camera by a percentage. The zoom delta is defined relative to the base field of view, not the current zoom. This means that the delta is strictly added, and not multiplied by the current zoom first.

Ex: If at zoom 2.0, zooming by another 0.1x will bring the camera to 2.1x (2.0 + 0.1) not 2.2x (2.0 + 2.0 * 0.1)
    
    
    mpSdk.Camera.zoomBy(0.1)  
    
    
      .then(function (newZoom) {  
    
    
        console.log('Camera zoomed to', newZoom);  
    
    
      });  
    

Parameter| Type| zoomDelta| number  
the amount to change the zoom relative to the base field of view  
---|---  
  
**Returns:** `Promise`<number>

**Errors**

  * Fails if the current mode is not Inside mode.
  * Warns to console if the zoom level would be outside of the zoom range supported.



### zoomReset​

zoomReset(): Promise<void>

Reset the zoom of the camera back to 1.0x.
    
    
    mpSdk.Camera.zoomReset()  
    
    
      .then(function () {  
    
    
        console.log('Camera zoom has been reset');  
    
    
      })  
    

**Returns:** `Promise`<void>

**Errors**

  * Fails if the current mode is not Inside mode.



### zoomTo​

zoomTo(zoomLevel: number): Promise<number>

Zooms the camera to a percentage of the base field of view.

Ex: Doubling the zoom, halves the field of view.
    
    
    mpSdk.Camera.zoomTo(2.0)  
    
    
     .then(function (newZoom) {  
    
    
       console.log('Camera zoomed to', newZoom);  
    
    
     });  
    

Parameter| Type| zoomLevel| number  
the target zoom level as a multiple of the base field of view  
---|---  
  
**Returns:** `Promise`<number>

**Errors**

  * Fails if the current mode is not Inside mode.
  * Warns to console if the zoom level is outside of the zoom range supported.



  * Types
    * LookAtOptions
    * Pose
    * RotateOptions
    * ZoomData
  * Enumerations
    * Direction
    * Event
    * TransitionType
  * Observables
    * pose
    * zoom
  * Methods
    * getPose
    * lookAt
    * lookAtScreenCoords
    * moveInDirection
    * pan
    * rotate
    * setRotation
    * zoomBy
    * zoomReset
    * zoomTo



  * Types
    * LookAtOptions
    * Pose
    * RotateOptions
    * ZoomData
  * Enumerations
    * Direction
    * Event
    * TransitionType
  * Observables
    * pose
    * zoom
  * Methods
    * getPose
    * lookAt
    * lookAtScreenCoords
    * moveInDirection
    * pan
    * rotate
    * setRotation
    * zoomBy
    * zoomReset
    * zoomTo


