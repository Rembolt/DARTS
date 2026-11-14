<!-- source: https://developers.matterport.com/reference/iobservablemap/ -->

On this page

A map that can have its changes observed via subscribing an [`IMapObserver`](/reference/imapobserver/) or that can be waited on for a specific condition to be met.

Methods

  * subscribe
  * waitUntil



## Methods​

### subscribe​

subscribe(observer: [IMapObserver](/reference/imapobserver/)<ItemT>): [ISubscription](/reference/isubscription/)

Subscribe to changes in this map.

When this observable detects a change, the `observer` provided will have its `onAdded`, `onRemoved`, and/or `onUpdated` called.

  * `observer.onAdded` will be called when an item is added to the collection
  * `observer.onRemoved` will be called when an item is removed from the collection
  * `observer.onUpdated` will be called when an item has some of its properties changed
  * `observer.onCollectionUpdated` will be called after some set of the above events have occured (item added/removed/updated)



When first subscribing, the observers' `onAdded` will be called for each item in the collection. The same is true for `onCollectionUpdated` which provides the latest view of the entire collection `onCollectionUpdated` and `onAdded` continue to fire as changes to the collection occur.
    
    
    const subscription = sdk.Tag.data.subscribe({  
    
    
      onAdded: (index, item, collection) => {  
    
    
        console.log(`Tag added at index ${index}:`, item);  
    
    
      },  
    
    
      onRemoved: (index, item, collection) => {  
    
    
        console.log(`Tag removed from index ${index}:`, item);  
    
    
      },  
    
    
      onUpdated: (index, item, collection) => {  
    
    
        console.log(`Tag updated at index ${index}:`, item);  
    
    
      },  
    
    
      onCollectionUpdated: (collection) => {  
    
    
        console.log('Current collection of tags:', collection);  
    
    
      }  
    
    
    });  
    

Parameter| Type| observer| [IMapObserver](/reference/imapobserver/)<ItemT>  
a map observer to receive add, remove, and update notifications  
---|---  
  
**Returns:** [ISubscription](/reference/isubscription/)

A subscription that can be used to remove the subscribed observer.

### waitUntil​

waitUntil(condition: [ICondition](/reference/icondition/)<[Dictionary](/reference/dictionary/)<ItemT>> | [ConditionCallback](/reference/#type-conditioncallback)<[Dictionary](/reference/dictionary/)<ItemT>>): Promise<[Dictionary](/reference/dictionary/)<ItemT>>

Wait for a specific condition on this map to be met. When this observable detects a change, the `condition` provided will be called. When the `condition` returns true, the returned Promise will be resolved.
    
    
    // Get the tag collection to use in your application  
    
    
    const tags: MpSdk.Dictionary<MpSdk.Tag.TagData> = await props.sdk.Tag.data.waitUntil( () => true );  
    

Parameter| Type| condition| [ICondition](/reference/icondition/)<[Dictionary](/reference/dictionary/)<ItemT>> | [ConditionCallback](/reference/#type-conditioncallback)<[Dictionary](/reference/dictionary/)<ItemT>>  
a condition or callback that returns true when the desired state is met  
---|---  
  
**Returns:** `Promise`<[Dictionary](/reference/dictionary/)<`ItemT`>>

A promise that is resolved when `condition` returns true.

  * Methods
    * subscribe
    * waitUntil



  * Methods
    * subscribe
    * waitUntil


