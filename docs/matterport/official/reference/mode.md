<!-- source: https://developers.matterport.com/reference/mode/ -->

On this page

Types

  * CurrentViewmodeData
  * MoveToModeOptions
  * TransitionData



Enumerations

  * Event
  * Mode
  * TransitionType



Observables

  * current
  * transition



Methods

  * moveTo



## Types​

### CurrentViewmodeData​

CurrentViewmodeData: _Mode.Mode | null_
    
    
    type CurrentViewmodeData = Mode | null  
    

### MoveToModeOptions​

MoveToModeOptions: _object_

Property| Type| position?| [Vector3](/reference/#type-vector3) | undefined| rotation?| [Rotation](/reference/#type-rotation) | undefined| transition?| [Camera.TransitionType](/reference/camera/#enum-transitiontype) | undefined| zoom?| number | undefined  
---|---  
  
### TransitionData​

TransitionData: _object_

Property| Type| from| Mode.Mode | null| to| Mode.Mode | null  
---|---  
  
## Enumerations​

### Event​

Event: _enum_

Member| Value| CHANGE_END| "viewmode.changeend"| CHANGE_START| "viewmode.changestart"  
---|---  
  
### Mode​

Mode: _enum_

Member| Value| DOLLHOUSE| "mode.dollhouse"| FLOORPLAN| "mode.floorplan"| INSIDE| "mode.inside"| OUTSIDE| "mode.outside"  
deprecated | PANO360| "mode.outside"| TRANSITIONING| "mode.transitioning"  
---|---  
  
### TransitionType​

TransitionType: _enum_

Transition types for camera movements. This is the canonical transition type enum. Used for `Mode.moveTo`, [`Sweep.moveTo`](/reference/sweep/#moveto), [`Mattertag.navigateToTag`](/reference/mattertag/#navigatetotag), and other camera movement methods. Note: not all values are supported, refer to per-method documentation for details.

See [Camera.TransitionType](/reference/camera/#enum-transitiontype)

Member| Value| FADEOUT| "transition.fade"  
Fade to black transition| FLY| "transition.fly"  
Fly transition| INSTANT| "transition.instant"  
Instant transition| MOVEFADE| "transition.movefade"  
experimental Move with fade transition| ORBIT| "transition.orbit"  
experimental Orbit transition  
---|---  
  
## Observables​

### current​

current: [IObservable](/reference/iobservable/)<Mode.Mode | null>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

The current view mode.
    
    
    mpSdk.Mode.current.subscribe(function (mode) {  
    
    
      // the view mode has changed  
    
    
      console.log('Current view mode is is ', mode);  
    
    
    });  
    

### transition​

transition: [IObservable](/reference/iobservable/)<Mode.TransitionData>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

An observable transition of the current viewmode. `from` and `to` will be null if there is no active transition.
    
    
    mpSdk.Mode.transition.subscribe(function (transition) {  
    
    
      // the transition has changed  
    
    
      console.log(transition.from, transition.to, transition.progress);  
    
    
    });  
    

## Methods​

### moveTo​

moveTo(mode: Mode.Mode, options?: Mode.MoveToModeOptions): Promise<Mode.Mode>

Change the viewing mode in 3D Showcase.
    
    
    const mode = mpSdk.Mode.Mode.FLOORPLAN;  
    
    
    const position = {x: 0, y: 0, z: 0};  
    
    
    const rotation = {x: -90, y: 0};  
    
    
    const transition = mpSdk.Camera.TransitionType.FLY;  
    
    
    const zoom = 5;  
    
    
      
    
    
    mpSdk.Mode.moveTo(mode, {  
    
    
        position: position,  
    
    
        rotation: rotation,  
    
    
        transition: transition,  
    
    
        zoom,  
    
    
      })  
    
    
      .then(function(nextMode){  
    
    
        // Move successful.  
    
    
        console.log('Arrived at new view mode ' + nextMode);  
    
    
      })  
    
    
      .catch(function(error){  
    
    
        // Error with moveTo command  
    
    
      });  
    

Notes about transitions to Floorplan mode:

  * `zoom` option is only taken into account in Floorplan transitions, the lower the number, the further the camera is zoomed in
  * The position of a floorplan view is determined by the X and Z arguments of the optional position object.
  * The rotation of a floorplan view is determined by the X and Y of the optional rotation object, changing X changes the 'roll' of the view, similar to hitting the LEFT/RIGHT arrow keys in Showcase floorplan view, changing the Y value has no analog in showcase, but changes the 'tilt' of the view.

Parameter| Type| mode| Mode.Mode  
The mode.| options?| Mode.MoveToModeOptions  
Options object, containing optional position, rotation, transition type  
---|---  
  
**Returns:** `Promise`<Mode.Mode>

A promise that resolves with the new mode once the mode has transitioned.

  * Types
    * CurrentViewmodeData
    * MoveToModeOptions
    * TransitionData
  * Enumerations
    * Event
    * Mode
    * TransitionType
  * Observables
    * current
    * transition
  * Methods
    * moveTo



  * Types
    * CurrentViewmodeData
    * MoveToModeOptions
    * TransitionData
  * Enumerations
    * Event
    * Mode
    * TransitionType
  * Observables
    * current
    * transition
  * Methods
    * moveTo


