<!-- source: https://developers.matterport.com/reference/view/view/ -->

On this page

_Extends:_ [IObservable](/reference/iobservable/)<[View](/reference/view/)>

Accessors

  * active
  * id
  * layers
  * name
  * type



Methods

  * addLayer
  * hasLayer
  * removeLayer
  * revert
  * setActive
  * subscribe
  * waitUntil



## Accessors​

### active​

active: _(readonly)_ boolean

Whether this is the active View or not

### id​

id: _(readonly)_ string

The unique id of the View

### layers​

layers: _(readonly)_ IterableIterator<[View.Layer](/reference/view/layer/)>

An iterator over the set of Layers associated with this View
    
    
    for (const layer of view.layers) {  
    
    
      console.log(`${view.id} has layer ${layer.id}`);  
    
    
    }  
    

### name​

name: _(readonly)_ string

The human-readable name of the View

### type​

type: _(readonly)_ [ViewType](/reference/view/#enum-viewtype)

The type of View

## Methods​

### addLayer​

addLayer(layer: [View.Layer](/reference/view/layer/)): Promise<void>

Add an existing Layer to this View
    
    
    view.addLayer(layer);  
    

Parameter| Type| layer| [View.Layer](/reference/view/layer/)  
the layer to add to this view  
---|---  
  
**Returns:** `Promise`<void>

### hasLayer​

hasLayer(layer: [View.Layer](/reference/view/layer/)): boolean

Test if this View has a Layer associate with it
    
    
    if (view.hasLayer(layer)) {  
    
    
      console.log(`${view.id} has layer ${layer.id}`);  
    
    
    }  
    

Parameter| Type| layer| [View.Layer](/reference/view/layer/)  
the layer to check for  
---|---  
  
**Returns:** boolean

### removeLayer​

removeLayer(layer: [View.Layer](/reference/view/layer/)): Promise<void>

Remove a Layer from this View
    
    
    view.removeLayer(layer);  
    

Parameter| Type| layer| [View.Layer](/reference/view/layer/)  
the layer to remove from this view  
---|---  
  
**Returns:** `Promise`<void>

### revert​

revert(): Promise<void>

Revert this view by removing all non-common, transient layers and removing any other object edits.
    
    
    await view.revert();  
    

**Returns:** `Promise`<void>

### setActive​

setActive(returnToStart?: boolean): Promise<void>

Set this View as the currently active one optionally, returning to the start location for the new View.

Only one View can be active at a time.
    
    
    const view: View; // ... acquired through previous usage of `mpSdk.View.views`  
    
    
    await view.setActive(true); // set the active view and return to the start location  
    

Parameter| Type| returnToStart?| boolean  
---|---  
  
**Returns:** `Promise`<void>

### subscribe​

subscribe(observer: [IObserver](/reference/iobserver/)<[View](/reference/view/)> | [ObserverCallback](/reference/#type-observercallback)<[View](/reference/view/)>): [ISubscription](/reference/isubscription/)

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
    

Parameter| Type| observer| [IObserver](/reference/iobserver/)<[View](/reference/view/)> | [ObserverCallback](/reference/#type-observercallback)<[View](/reference/view/)>  
an observer or callback to receive change notifications  
---|---  
  
**Returns:** [ISubscription](/reference/isubscription/)

A subscription that can be used to remove the subscribed observer.

### waitUntil​

waitUntil(condition: [ICondition](/reference/icondition/)<[View](/reference/view/)> | [ConditionCallback](/reference/#type-conditioncallback)<[View](/reference/view/)>): Promise<[View](/reference/view/)>

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
    

Parameter| Type| condition| [ICondition](/reference/icondition/)<[View](/reference/view/)> | [ConditionCallback](/reference/#type-conditioncallback)<[View](/reference/view/)>  
a condition or callback that returns true when the desired state is met  
---|---  
  
**Returns:** `Promise`<[View](/reference/view/)>

A promise that is resolved when `condition` returns true.

  * Accessors
    * active
    * id
    * layers
    * name
    * type
  * Methods
    * addLayer
    * hasLayer
    * removeLayer
    * revert
    * setActive
    * subscribe
    * waitUntil



  * Accessors
    * active
    * id
    * layers
    * name
    * type
  * Methods
    * addLayer
    * hasLayer
    * removeLayer
    * revert
    * setActive
    * subscribe
    * waitUntil


