<!-- source: https://developers.matterport.com/reference/iobservable/ -->

On this page

A data object that can have its changes observed via subscribing an [`IObserver`](/reference/iobserver/) or [`ObserverCallback`](/reference/#type-observercallback) or waited on for a specific condition to be met.

Methods

  * subscribe
  * waitUntil



## Methods​

### subscribe​

subscribe(observer: [IObserver](/reference/iobserver/)<DataT> | [ObserverCallback](/reference/#type-observercallback)<DataT>): [ISubscription](/reference/isubscription/)

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
    

Parameter| Type| observer| [IObserver](/reference/iobserver/)<DataT> | [ObserverCallback](/reference/#type-observercallback)<DataT>  
an observer or callback to receive change notifications  
---|---  
  
**Returns:** [ISubscription](/reference/isubscription/)

A subscription that can be used to remove the subscribed observer.

### waitUntil​

waitUntil(condition: [ICondition](/reference/icondition/)<DataT> | [ConditionCallback](/reference/#type-conditioncallback)<DataT>): Promise<DataT>

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
    

Parameter| Type| condition| [ICondition](/reference/icondition/)<DataT> | [ConditionCallback](/reference/#type-conditioncallback)<DataT>  
a condition or callback that returns true when the desired state is met  
---|---  
  
**Returns:** `Promise`<`DataT`>

A promise that is resolved when `condition` returns true.

  * Methods
    * subscribe
    * waitUntil



  * Methods
    * subscribe
    * waitUntil


