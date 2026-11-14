<!-- source: https://developers.matterport.com/reference/view/layer/ -->

On this page

_Extends:_ [IObservable](/reference/iobservable/)<[View.Layer](/reference/view/layer/)>

Properties

  * Measurements
  * Tag



Accessors

  * common
  * id
  * name
  * toggled
  * type



Methods

  * subscribe
  * toggle
  * waitUntil



## Properties​

### Measurements​

Measurements: Omit<View.Measurements, '[MeasurementType](/reference/measurements/#enum-measurementtype)' | 'getData' | 'data' | 'toggleMode' | 'mode'>

### Tag​

Tag: Omit<View.Tag, '[AttachmentType](/reference/tag/#enum-attachmenttype)' | 'attachments' | 'data' | 'openTags' | 'close' | 'dock' | 'open' | 'registerAttachment' | 'registerSandbox' | 'toggleDocking' | 'toggleNavControls' | 'toggleSharing'>

A subset of the Tag namespace's functionality to manipulate Tags on this layer.

Provides access to Tag mutations including Tag.add to add directly to a layer.

Does not include observables or enums.

## Accessors​

### common​

common: _(readonly)_ boolean

Whether this layer is common (shared across all views)

### id​

id: _(readonly)_ string

The unique id of the Layer

### name​

name: _(readonly)_ string

The human-readable name of the Layer

### toggled​

toggled: _(readonly)_ boolean

Whether this Layer toggled on or off. If toggled off, this Layer's objects are hidden.

### type​

type: _(readonly)_ [LayerType](/reference/view/#enum-layertype)

The type of layer

## Methods​

### subscribe​

subscribe(observer: [IObserver](/reference/iobserver/)<[View.Layer](/reference/view/layer/)> | [ObserverCallback](/reference/#type-observercallback)<[View.Layer](/reference/view/layer/)>): [ISubscription](/reference/isubscription/)

Subscribe to changes on this object. When this observable detects a change, the `observer` provided will be called with the data associated with this observable.
    
    
    // Example: subscribe to changes in the app state  
    
    
    sdk.App.state.subscribe((appState) => {  
    
    
      console.log(`App state changed to: ${appState.phase}`);  
    
    
    });  
    

or:
    
    
    sdk.App.state.subscribe({  
    
    
      onChanged(appState) {  
    
    
        console.log(`App state changed to: ${appState.phase}`);  
    
    
      }  
    
    
    });  
    

Parameter| Type| observer| [IObserver](/reference/iobserver/)<[View.Layer](/reference/view/layer/)> | [ObserverCallback](/reference/#type-observercallback)<[View.Layer](/reference/view/layer/)>  
an observer or callback to receive change notifications  
---|---  
  
**Returns:** [ISubscription](/reference/isubscription/)

A subscription that can be used to remove the subscribed observer.

### toggle​

toggle(active?: boolean): Promise<void>

Toggle this Layer's state to `active`.

Parameter| Type| active?| boolean  
Whether this Layer should be toggled on or off. If active is undefined, the state is flipped.  
---|---  
  
**Returns:** `Promise`<void>

### waitUntil​

waitUntil(condition: [ICondition](/reference/icondition/)<[View.Layer](/reference/view/layer/)> | [ConditionCallback](/reference/#type-conditioncallback)<[View.Layer](/reference/view/layer/)>): Promise<[View.Layer](/reference/view/layer/)>

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
    

Parameter| Type| condition| [ICondition](/reference/icondition/)<[View.Layer](/reference/view/layer/)> | [ConditionCallback](/reference/#type-conditioncallback)<[View.Layer](/reference/view/layer/)>  
a condition or callback that returns true when the desired state is met  
---|---  
  
**Returns:** `Promise`<[View.Layer](/reference/view/layer/)>

A promise that is resolved when `condition` returns true.

  * Properties
    * Measurements
    * Tag
  * Accessors
    * common
    * id
    * name
    * toggled
    * type
  * Methods
    * subscribe
    * toggle
    * waitUntil



  * Properties
    * Measurements
    * Tag
  * Accessors
    * common
    * id
    * name
    * toggled
    * type
  * Methods
    * subscribe
    * toggle
    * waitUntil


