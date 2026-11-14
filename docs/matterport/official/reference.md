<!-- source: https://developers.matterport.com/reference/ -->

On this page

The entire MP Sdk returned from a successful call to `MP_SDK.connect`. The `Scene` namespace is only available when connecting using the Bundle SDK
    
    
    // for the Embed SDK  
    
    
    const sdk: MpSdk = await showcaseEmbeddingWindow.MP_SDK.connect(...);  
    
    
    // for the Bundle SDK  
    
    
    const sdk: MpSdk = await bundleWindow.MP_SDK.connect(...);  
    

Namespaces

  * [__metadata__](/reference/__metadata__/)
  * [App](/reference/app/)
  * [Asset](/reference/asset/)
  * [Camera](/reference/camera/)
  * [Conversion](/reference/conversion/)
  * [Floor](/reference/floor/)
  * [Graph](/reference/graph/)
  * [Label](/reference/label/)
  * [Link](/reference/link/)
  * [Mattertag](/reference/mattertag/)
  * [Measurements](/reference/measurements/)
  * [Mode](/reference/mode/)
  * [Model](/reference/model/)
  * [OAuth](/reference/oauth/)
  * [Pointer](/reference/pointer/)
  * [Renderer](/reference/renderer/)
  * [Room](/reference/room/)
  * [Scene](/reference/scene/)
  * [Sensor](/reference/sensor/)
  * [Settings](/reference/settings/)
  * [Sweep](/reference/sweep/)
  * [Tag](/reference/tag/)
  * [Tour](/reference/tour/)
  * [View](/reference/view/)



Interfaces

  * [Dictionary](/reference/dictionary/)
  * [Emitter](/reference/emitter/)
  * [ICondition](/reference/icondition/)
  * [IDisposable](/reference/idisposable/)
  * [IMapObserver](/reference/imapobserver/)
  * [IObservable](/reference/iobservable/)
  * [IObservableMap](/reference/iobservablemap/)
  * [IObserver](/reference/iobserver/)
  * [ISubscription](/reference/isubscription/)
  * [MP_SDK](/reference/mp_sdk/)



Types

  * Color
  * ConditionCallback
  * ConnectOptions
  * EulerAngle
  * ObserverCallback
  * Orientation
  * Quaternion
  * Rotation
  * ShowcaseBundleWindow
  * ShowcaseEmbedWindow
  * Size
  * Vector2
  * Vector3



Functions

  * disconnect
  * off
  * on



## Types​

### Color​

Color: _object_

An RGB represenation of a color. Each property is normalized to the range [0, 1]

Property| Type| b| number| g| number| r| number  
---|---  
  
### ConditionCallback​

ConditionCallback<DataT>: _function_

A callback that describes a condition of an [`IObservable`](/reference/iobservable/) to wait for. Returning true will resolve the promise returned by [`IObservable.waitUntil`](/reference/iobservable/#waituntil)

The functional style version of the [`ICondition`](/reference/icondition/)
    
    
    type ConditionCallback<DataT> = (data: DataT) => boolean  
    

### ConnectOptions​

ConnectOptions: _object_

Options to provide when connecting the sdk

Property| Type| auth| string  
A token to provide access to a model  
---|---  
  
### EulerAngle​

EulerAngle: _object_

An orientation described with Euler-like angles in degrees in YXZ order.

Property| Type| x| number| y| number| z| number  
---|---  
  
### ObserverCallback​

ObserverCallback<DataT>: _function_

A callback that can be subscribed to changes of an [`IObservable`](/reference/iobservable/)

The functional style version of the [`IObserver`](/reference/iobserver/)
    
    
    type ObserverCallback<DataT> = (data: DataT) => void  
    

### Orientation​

Orientation: _object_

An orientation described with Euler-like angles in degrees.

Property| Type| pitch| number| roll| number| yaw| number  
---|---  
  
### Quaternion​

Quaternion: _object_

Property| Type| w| number| x| number| y| number| z| number  
---|---  
  
### Rotation​

Rotation: _object_

Property| Type| x| number| y| number| z?| number | undefined  
---|---  
  
### ShowcaseBundleWindow​

ShowcaseBundleWindow: _Window & typeof globalThis & { [MP_SDK](/reference/mp_sdk/): [MP_SDK](/reference/mp_sdk/); }_

A Window type that can be used to cast the bundle's iframe's contentWindow to hint at the existance of the [`MP_SDK`](/reference/mp_sdk/) object.
    
    
    const bundleIframe = document.getElementById<HTMLIFrameElement>('showcase');  
    
    
    const showcaseWindow = bundleIframe.contentWindow as ShowcaseBundleWindow;  
    
    
    showcaseWindow.MP_SDK.connect(showcaseWindow);  
    
    
    
    type ShowcaseBundleWindow = Window & typeof globalThis & { MP_SDK: MP_SDK; }  
    

### ShowcaseEmbedWindow​

ShowcaseEmbedWindow: _Window & typeof globalThis & { [MP_SDK](/reference/mp_sdk/): [MP_SDK](/reference/mp_sdk/); }_

When including the sdk script (``) on your page, an [`MP_SDK`](/reference/mp_sdk/) will be attached to the window object.

This type can be used to cast the window object to access the types available on the MP_SDK object.
    
    
    const showcaseEmbeddingWindow = window as ShowcaseEmbedWindow;  
    
    
    showcaseEmbeddingWindow.MP_SDK.connect( ... )  
    
    
    
    type ShowcaseEmbedWindow = Window & typeof globalThis & { MP_SDK: MP_SDK; }  
    

### Size​

Size: _object_

Property| Type| h| number| w| number  
---|---  
  
### Vector2​

Vector2: _object_

Property| Type| x| number| y| number  
---|---  
  
### Vector3​

Vector3: _object_

Property| Type| x| number| y| number| z| number  
---|---  
  
## Functions​

### disconnect​

disconnect(): void

Stop sending and receiving messages and cleanup any resources associated with the sdk
    
    
    mpSdk.disconnect();  
    
    
    // mpSdk can no longer make function calls, receive any callbacks to event, observable, or collection  
    
    
      
    
    
    // all sdk functionality should throw errors  
    
    
    try {  
    
    
      await mpSdk.Mode.moveTo( ... );  
    
    
    } catch (e) {  
    
    
      console.error(e);  
    
    
    }  
    

### off​

off(event: any, callback: (...any: any[]) => void): [Emitter](/reference/emitter/)

Unsubscribes from an event.
    
    
    const callback = (model) => {  
    
    
      console.log('My model loaded!');  
    
    
    };  
    
    
      
    
    
    // Start listening to the event.  
    
    
    mpSdk.on(mpSdk.Event.MODEL_LOADED, callback);  
    
    
      
    
    
    // Stop listening to the event.  
    
    
    mpSdk.off(mpSdk.Event.MODEL_LOADED, callback);  
    

Parameter| Type| event| any  
The event to stop.| callback| (...any: any[]) => void  
The original callback.  
---|---  
  
**Returns:** [Emitter](/reference/emitter/)

### on​

on: _function_ — _17 overloads_

on(event: [App.Event.PHASE_CHANGE](/reference/app/#enum-event), callback: (app: [App.Phase](/reference/app/#enum-phase)) => void): [Emitter](/reference/emitter/)

deprecated Use the [`App.state`](/reference/app/#state) observable to get phase change notifications.

Parameter| Type| event| [App.Event.PHASE_CHANGE](/reference/app/#enum-event)| callback| (app: [App.Phase](/reference/app/#enum-phase)) => void  
---|---  
  
**Returns:** [Emitter](/reference/emitter/)

on(event: [Camera.Event.MOVE](/reference/camera/#enum-event), callback: (pose: [Camera.Pose](/reference/camera/#type-pose)) => void): [Emitter](/reference/emitter/)

deprecated Use the [`Camera.pose`](/reference/camera/#pose) observable to get camera pose change notifications.

Parameter| Type| event| [Camera.Event.MOVE](/reference/camera/#enum-event)| callback| (pose: [Camera.Pose](/reference/camera/#type-pose)) => void  
---|---  
  
**Returns:** [Emitter](/reference/emitter/)

on(event: [Floor.Event.CHANGE_START](/reference/floor/#enum-event), callback: (to: number, from: number) => void): [Emitter](/reference/emitter/)

This event fires when a floor change is starting.

the callback returns the floor index that we are moving to, and the floor index we are moving from.
    
    
    mpSdk.on(mpSdk.Floor.Event.CHANGE_START,  
    
    
      function(to, from) {  
    
    
        console.log('Starting to move to floor ' + to + ' from floor ' + from);  
    
    
      }  
    
    
    );  
    

Parameter| Type| event| [Floor.Event.CHANGE_START](/reference/floor/#enum-event)| callback| (to: number, from: number) => void  
---|---  
  
**Returns:** [Emitter](/reference/emitter/)

on(event: [Floor.Event.CHANGE_END](/reference/floor/#enum-event), callback: (floorIndex: number, floorName: string) => void): [Emitter](/reference/emitter/)

This event fires when a floor change is ending.

the callback returns the floor index (0 based, counting from the bottom) and the floorName, as set in workshop, or defaulting to the same as floorIndex
    
    
    mpSdk.on(mpSdk.Floor.Event.CHANGE_END,  
    
    
      function(floorIndex, floorName) {  
    
    
        console.log('Arrived at floor ' + floorName);  
    
    
        console.log('it is the ' + floorIndex+1 + 'th floor from the bottom');  
    
    
      }  
    
    
    );  
    

Parameter| Type| event| [Floor.Event.CHANGE_END](/reference/floor/#enum-event)| callback| (floorIndex: number, floorName: string) => void  
---|---  
  
**Returns:** [Emitter](/reference/emitter/)

on(event: [Label.Event.POSITION_UPDATED](/reference/label/#enum-event), callback: (labelData: [Label.Label](/reference/label/#type-label)[]) => void): [Emitter](/reference/emitter/)

deprecated Use the Label observable instead

This event fires when the labels' on screen position has changed.
    
    
    mpSdk.on(Label.Event.POSITION_UPDATED,  
    
    
      function(labels) {  
    
    
        // Label data updated.  
    
    
        console.log('On-screen position of first label: ' + JSON.stringify(labels[0].position));  
    
    
      }  
    
    
    );  
    

Parameter| Type| event| [Label.Event.POSITION_UPDATED](/reference/label/#enum-event)| callback| (labelData: [Label.Label](/reference/label/#type-label)[]) => void  
---|---  
  
**Returns:** [Emitter](/reference/emitter/)

on(event: [Mattertag.Event.HOVER](/reference/mattertag/#enum-event), callback: (tagSid: string, hovering: boolean) => void): [Emitter](/reference/emitter/)

This event fires when the input pointer hovers onto or out of a mattertag disc.
    
    
    mpSdk.on(mpSdk.Mattertag.Event.HOVER,  
    
    
      function (tagSid, hovering) {  
    
    
        if (hovering) {  
    
    
          console.log('Begin Hovering on', tagSid);  
    
    
        } else {  
    
    
          console.log('End Hovering on', tagSid);  
    
    
        }  
    
    
      }  
    
    
    );  
    

Parameter| Type| event| [Mattertag.Event.HOVER](/reference/mattertag/#enum-event)| callback| (tagSid: string, hovering: boolean) => void  
---|---  
  
**Returns:** [Emitter](/reference/emitter/)

on(event: [Mattertag.Event.CLICK](/reference/mattertag/#enum-event), callback: (tagSid: string) => void): [Emitter](/reference/emitter/)

This event fires when the input pointer clicks a Mattertag disc.
    
    
    mpSdk.on(mpSdk.Mattertag.Event.CLICK,  
    
    
      function (tagSid) {  
    
    
        console.log(tagSid + ' was selected');  
    
    
      }  
    
    
    );  
    

Parameter| Type| event| [Mattertag.Event.CLICK](/reference/mattertag/#enum-event)| callback| (tagSid: string) => void  
---|---  
  
**Returns:** [Emitter](/reference/emitter/)

on(event: [Mattertag.Event.LINK_OPEN](/reference/mattertag/#enum-event), callback: (tagSid: string, url: string) => void): [Emitter](/reference/emitter/)

This event fires when a mattertag link is opened.
    
    
    mpSdk.on(mpSdk.Mattertag.Event.LINK_OPEN,  
    
    
      function (tagSid, url) {  
    
    
        console.log('The link ' + url + ' opened for sid ' + tagSid);  
    
    
      }  
    
    
    );  
    

Parameter| Type| event| [Mattertag.Event.LINK_OPEN](/reference/mattertag/#enum-event)| callback| (tagSid: string, url: string) => void  
---|---  
  
**Returns:** [Emitter](/reference/emitter/)

on(event: [Mode.Event.CHANGE_START](/reference/mode/#enum-event), callback: (oldMode: string, newMode: string) => void): [Emitter](/reference/emitter/)

This event fires when the camera is starting to transition to a mode.
    
    
    mpSdk.on(mpSdk.Mode.Event.CHANGE_START,  
    
    
      function(oldMode, newMode){  
    
    
        console.log('Mode changing from ' + oldMode);  
    
    
        console.log('Mode changing to  ' + newMode);  
    
    
      }  
    
    
    );  
    

Parameter| Type| event| [Mode.Event.CHANGE_START](/reference/mode/#enum-event)| callback| (oldMode: string, newMode: string) => void  
---|---  
  
**Returns:** [Emitter](/reference/emitter/)

on(event: [Mode.Event.CHANGE_END](/reference/mode/#enum-event), callback: (oldMode: string, newMode: string) => void): [Emitter](/reference/emitter/)

This event fires when the camera has completed a transition to a mode.
    
    
    mpSdk.on(mpSdk.Mode.Event.CHANGE_END,  
    
    
      function(oldMode, newMode){  
    
    
        console.log('Mode changed from ' + oldMode);  
    
    
        console.log('Mode changed to  ' + newMode);  
    
    
      }  
    
    
    );  
    

Parameter| Type| event| [Mode.Event.CHANGE_END](/reference/mode/#enum-event)| callback| (oldMode: string, newMode: string) => void  
---|---  
  
**Returns:** [Emitter](/reference/emitter/)

on(event: [Model.Event.MODEL_LOADED](/reference/model/#enum-event), callback: (model: [Model.ModelData](/reference/model/#type-modeldata)) => void): [Emitter](/reference/emitter/)

This event fires when the model has been loaded.
    
    
    mpSdk.on(mpSdk.Model.Event.MODEL_LOADED,  
    
    
      function(model){  
    
    
        console.log('Model sid:' + model.sid);  
    
    
      }  
    
    
    );  
    

Parameter| Type| event| [Model.Event.MODEL_LOADED](/reference/model/#enum-event)| callback| (model: [Model.ModelData](/reference/model/#type-modeldata)) => void  
---|---  
  
**Returns:** [Emitter](/reference/emitter/)

on(event: [Sweep.Event.ENTER](/reference/sweep/#enum-event), callback: (oldSweep: string, newSweep: string) => void): [Emitter](/reference/emitter/)

This event fires when first entering a sweep.
    
    
    mpSdk.on(mpSdk.Sweep.Event.ENTER,  
    
    
      function(oldSweep, newSweep){  
    
    
        console.log('Leaving sweep ' + oldSweep);  
    
    
        console.log('Entering sweep ' + newSweep);  
    
    
      }  
    
    
    );  
    

Parameter| Type| event| [Sweep.Event.ENTER](/reference/sweep/#enum-event)| callback| (oldSweep: string, newSweep: string) => void  
---|---  
  
**Returns:** [Emitter](/reference/emitter/)

on(event: [Sweep.Event.EXIT](/reference/sweep/#enum-event), callback: (fromSweep: string, toSweep: string | undefined) => void): [Emitter](/reference/emitter/)

This event fires when exiting a sweep.
    
    
    mpSdk.on(mpSdk.Sweep.Event.EXIT,  
    
    
      function(fromSweep, toSweep){  
    
    
        console.log('Leaving sweep ' + fromSweep);  
    
    
        console.log('Transitioning to sweep ' + toSweep);  
    
    
      }  
    
    
    );  
    

The callback receives `fromSweep` (the exit sweep) and `toSweep` (the destination sweep). The `toSweep` value is only valid for inside mode. It is undefined for floorplan and dollhouse mode.

Parameter| Type| event| [Sweep.Event.EXIT](/reference/sweep/#enum-event)| callback| (fromSweep: string, toSweep: string | undefined) => void  
---|---  
  
**Returns:** [Emitter](/reference/emitter/)

on(event: [Tour.Event.STARTED](/reference/tour/#enum-event), callback: () => void): [Emitter](/reference/emitter/)

This event fires when the tour has started.
    
    
    mpSdk.on(mpSdk.Tour.Event.STARTED,  
    
    
      function() {  
    
    
        console.log('Tour started!');  
    
    
      }  
    
    
    );  
    

Parameter| Type| event| [Tour.Event.STARTED](/reference/tour/#enum-event)| callback| () => void  
---|---  
  
**Returns:** [Emitter](/reference/emitter/)

on(event: [Tour.Event.STOPPED](/reference/tour/#enum-event), callback: () => void): [Emitter](/reference/emitter/)

This event fires when the tour has stopped.
    
    
    mpSdk.on(mpSdk.Tour.Event.STOPPED,  
    
    
      function() {  
    
    
        console.log('Tour stopped!');  
    
    
      }  
    
    
    );  
    

Parameter| Type| event| [Tour.Event.STOPPED](/reference/tour/#enum-event)| callback| () => void  
---|---  
  
**Returns:** [Emitter](/reference/emitter/)

on(event: [Tour.Event.ENDED](/reference/tour/#enum-event), callback: () => void): [Emitter](/reference/emitter/)

This event fires when the tour has ended.
    
    
    mpSdk.on(mpSdk.Tour.Event.ENDED,  
    
    
      function() {  
    
    
        console.log('Tour ended!');  
    
    
      }  
    
    
    );  
    

Parameter| Type| event| [Tour.Event.ENDED](/reference/tour/#enum-event)| callback| () => void  
---|---  
  
**Returns:** [Emitter](/reference/emitter/)

on(event: [Tour.Event.STEPPED](/reference/tour/#enum-event), callback: (activeIndex: number) => void): [Emitter](/reference/emitter/)

This event fires when the tour has stepped.
    
    
    mpSdk.on(mpSdk.Tour.Event.STEPPED,  
    
    
      function(activeIndex) {  
    
    
        console.log('Tour has reached step ' + activeIndex);  
    
    
      }  
    
    
    );  
    

Parameter| Type| event| [Tour.Event.STEPPED](/reference/tour/#enum-event)| callback| (activeIndex: number) => void  
---|---  
  
**Returns:** [Emitter](/reference/emitter/)

  * Namespaces
    * [__metadata__](/reference/__metadata__/)
    * [App](/reference/app/)
    * [Asset](/reference/asset/)
    * [Camera](/reference/camera/)
    * [Conversion](/reference/conversion/)
    * [Floor](/reference/floor/)
    * [Graph](/reference/graph/)
    * [Label](/reference/label/)
    * [Link](/reference/link/)
    * [Mattertag](/reference/mattertag/)
    * [Measurements](/reference/measurements/)
    * [Mode](/reference/mode/)
    * [Model](/reference/model/)
    * [OAuth](/reference/oauth/)
    * [Pointer](/reference/pointer/)
    * [Renderer](/reference/renderer/)
    * [Room](/reference/room/)
    * [Scene](/reference/scene/)
    * [Sensor](/reference/sensor/)
    * [Settings](/reference/settings/)
    * [Sweep](/reference/sweep/)
    * [Tag](/reference/tag/)
    * [Tour](/reference/tour/)
    * [View](/reference/view/)
  * Interfaces
    * [Dictionary](/reference/dictionary/)
    * [Emitter](/reference/emitter/)
    * [ICondition](/reference/icondition/)
    * [IDisposable](/reference/idisposable/)
    * [IMapObserver](/reference/imapobserver/)
    * [IObservable](/reference/iobservable/)
    * [IObservableMap](/reference/iobservablemap/)
    * [IObserver](/reference/iobserver/)
    * [ISubscription](/reference/isubscription/)
    * [MP_SDK](/reference/mp_sdk/)
  * Types
    * Color
    * ConditionCallback
    * ConnectOptions
    * EulerAngle
    * ObserverCallback
    * Orientation
    * Quaternion
    * Rotation
    * ShowcaseBundleWindow
    * ShowcaseEmbedWindow
    * Size
    * Vector2
    * Vector3
  * Functions
    * disconnect
    * off
    * on



  * Types
    * Color
    * ConditionCallback
    * ConnectOptions
    * EulerAngle
    * ObserverCallback
    * Orientation
    * Quaternion
    * Rotation
    * ShowcaseBundleWindow
    * ShowcaseEmbedWindow
    * Size
    * Vector2
    * Vector3
  * Functions
    * disconnect
    * off
    * on


