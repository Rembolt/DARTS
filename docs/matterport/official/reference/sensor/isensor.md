<!-- source: https://developers.matterport.com/reference/sensor/isensor/ -->

On this page

A Sensor that detects Sources and provides information about the reading of each.

_Extends:_ [IObservable](/reference/iobservable/)<[Sensor.ISensor](/reference/sensor/isensor/)>

Properties

  * forward
  * origin
  * readings



Methods

  * addSource
  * dispose
  * showDebug
  * subscribe
  * waitUntil



## Properties​

### forward​

forward: [Vector3](/reference/#type-vector3)

The world-space "forward" direction describing which direction the sensor is facing.

### origin​

origin: [Vector3](/reference/#type-vector3)

The world-space position of the sensor.

### readings​

readings: _object_

An observable used to get information about assocated `ISources` added with `ISensor.addSource`
    
    
    { /** * Start receiving updates about the current set of sources added to this sensor. * @param observer - the observer to receive sensor reading updates */ subscribe(observer: ISensorObserver): ISubscription; }  
    

## Methods​

### addSource​

addSource(sources: [Sensor.ISource](/reference/sensor/isource/)[]): void

Add a source, to add its readings to the set of readings provided by `.subscribe`.

Parameter| Type| sources| [Sensor.ISource](/reference/sensor/isource/)[]  
the sources to add to this sensor  
---|---  
  
### dispose​

dispose(): void

Teardown and cleanup the sensor, and stop receiving updates.

### showDebug​

showDebug(show: boolean): void

Show debug visuals for this sensor. Existing visuals are disposed.

Parameter| Type| show| boolean  
whether to show or hide debug visuals  
---|---  
  
### subscribe​

subscribe(observer: [IObserver](/reference/iobserver/)<DataT> | [ObserverCallback](/reference/#type-observercallback)<DataT>): [ISubscription](/reference/isubscription/)

Start receiving updates when properties of this sensor change, e.g. `origin` or `forward`, not its `readings`.

Subscribe to `readings` to receive updates about associated `ISources`

Parameter| Type| observer| [IObserver](/reference/iobserver/)<DataT> | [ObserverCallback](/reference/#type-observercallback)<DataT>  
---|---  
  
**Returns:** [ISubscription](/reference/isubscription/)

### waitUntil​

waitUntil(condition: [ICondition](/reference/icondition/)<[Sensor.ISensor](/reference/sensor/isensor/)> | [ConditionCallback](/reference/#type-conditioncallback)<[Sensor.ISensor](/reference/sensor/isensor/)>): Promise<[Sensor.ISensor](/reference/sensor/isensor/)>

Wait for a specific condition on this object to be met. When this observable detects a change, the `condition` provided will be called. When the `condition` returns true, the returned Promise will be resolved.
    
    
     // Example: pause execution of code until the app state is in the "playing" phase  
    
    
     await sdk.App.state.waitUntil(  
    
    
      appState => appState.phase == sdk.App.Phase.PLAYING  
    
    
     );  
    

or:
    
    
    await sdk.App.state.waitUntil({  
    
    
      waitUntil(appState) {  
    
    
        return appState.phase == sdk.App.Phase.PLAYING;  
    
    
      }  
    
    
    });  
    

Parameter| Type| condition| [ICondition](/reference/icondition/)<[Sensor.ISensor](/reference/sensor/isensor/)> | [ConditionCallback](/reference/#type-conditioncallback)<[Sensor.ISensor](/reference/sensor/isensor/)>  
a condition or callback that returns true when the desired state is met  
---|---  
  
**Returns:** `Promise`<[Sensor.ISensor](/reference/sensor/isensor/)>

A promise that is resolved when `condition` returns true.

  * Properties
    * forward
    * origin
    * readings
  * Methods
    * addSource
    * dispose
    * showDebug
    * subscribe
    * waitUntil



  * Properties
    * forward
    * origin
    * readings
  * Methods
    * addSource
    * dispose
    * showDebug
    * subscribe
    * waitUntil


