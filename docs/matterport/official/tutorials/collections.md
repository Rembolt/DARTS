<!-- source: https://developers.matterport.com/tutorials/collections/ -->

On this page

The SDK provides access to collections of state objects through [`ObservableMaps`](/reference/) or colloquially as "Collections". MapObservers ("Observers") can subscribe to Collections to watch and receive updates of the items within a state collection.

Collections are an extension of our standard [Observables](/tutorials/observables/); therefore, there are a lot of similarities to the way the SDK provides other state through Observables. As such, some of this document may be redundant with the documentation for Observables.

## Receiving State from a Collection​

The state of a collection is provided by subscribing to a Collection. Collections always provide an up-to-date view of its state to all of its subscribed Observers.

Observers support the following four callbacks that map to the four operations that describe how a Collection has changed.

  * `onAdded`: when an item is added
  * `onRemoved`: when an item is removed
  * `onUpdated`: when an item is updated
  * `onCollectionUpdated`: when the collection has changed in some way (an aggregate of the previous three operations)



Each of these callbacks are optional for each Observer to implement.

With our Observable Collection implementation:

  * when first subscribing an Observer to a Collection, the Observer will always be called back through its `onAdded` with all existing items in the Collection and its `onCollectionUpdated` with the full collection of items
  * all subscribed Observers will be called back when there are any changes to the items in the collection
  * subscribing multiple Observers to a single Collection does not increase the complexity of calculating the state of the Collection
  * the Collection state used in the Observers' callbacks is cached and shared between all Observers



### Observing How a Collection has Changed​

An Observer can have up to four callbacks that match the available operations supported by the Collection. All callbacks are optional. An Observer can have any of `onAdded`, `onRemoved`, `onUpdated`, `onCollectionUpdated` callbacks.

An Observer that supports all four operations and watches the tag state will look something like this:
    
    
    type TagItem = MpSdk.Tag.TagData;  
    
    
    class TagObserver implements MpSdk.IObservableMap<TagItem> {  
    
    
      onAdded(index: string, tag: TagItem, collection: MpSdk.Dictionary<TagItem>) {  
    
    
        console.log(`an item at index ${index} was added`);  
    
    
      },  
    
    
      onRemoved(index: string, tag: TagItem, collection: MpSdk.Dictionary<TagItem>) {  
    
    
        console.log(`an item at index ${index} was removed`);  
    
    
      },  
    
    
      onUpdated(index: string, tag: TagItem, collection: MpSdk.Dictionary<TagItem>) {  
    
    
        console.log(`an item at index ${index} was updated`);  
    
    
      },  
    
    
      onCollectionUpdated(collection: MpSdk.Dictionary<TagItem>) {  
    
    
        console.log(`the collection has changed in some way`);  
    
    
      },  
    
    
    }  
    
    
      
    
    
    mpSdk.Tag.data.subscribe(new TagObserver());  
    

### Observing When the Collection has Changed​

If the individual changes aren't important and all that's needed is an up-to-date view of the Collection, only the `onCollectionUpdated` needs implementing.
    
    
    type TagItem = MpSdk.Tag.TagData;  
    
    
    class TagObserver implements MpSdk.IObservableMap<TagItem> {  
    
    
      onCollectionUpdated(collection: MpSdk.Dictionary<TagItem>) {  
    
    
        console.log(`the full collection is now`, collection);  
    
    
      }  
    
    
    }  
    
    
      
    
    
    mpSdk.Tag.data.subscribe(new TagObserver());  
    

### Using Multiple Observers​

One of the most important topics to understand about Collections is how Observers are notified of changes within the Collection.

When an Observer has been created but not yet subscribed to the Collection, it's "current view" of the state is undefined. It doesn't know anything about what it's observing yet. When first subscribed, all items that are in the Collection have not been observed yet so it will trigger its `onAdded` callback for each item that it now sees. Once the Observer has seen all the "new" items, it triggers its `onCollectionUpdated` callback to signify that the collection has updated in some way. Now as things are added, removed, or updated in the Collection, the Observer will observe those changes, update its internal view to reflect what it sees happening in the Collection, and trigger the appropriate `onAdded`, `onRemoved`, and `onUpdated` callbacks, followed by an `onCollectionUpdated` call.

When a second Observer is created, it also starts with an undefined "current view" of the state. When it subscribes to the Collection, all items in the Collection are "new" to the Observer and will trigger an `onAdded` callback for each item it now sees. Afterward, it follows the same path for adding, removing, and updating items in its internal view separate from other Observers.

As an example of getting and observing when Tags are added to the Tag Collection:
    
    
    type TagItem = MpSdk.Tag.TagData;  
    
    
    class TagObserver implements MpSdk.IObservableMap<TagItem> {  
    
    
      onAdded(index: string, tag: TagItem, collection: MpSdk.Dictionary<TagItem>) {  
    
    
        console.log(`an item at index ${index} was added`);  
    
    
      }  
    
    
    }  
    
    
      
    
    
    // subscribing a new Observer will trigger its `onAdded` for each Tag in the Collection  
    
    
    mpSdk.Tag.data.subscribe(new TagObserver());  
    
    
      
    
    
    // subscribing a second Observer will ALSO trigger its `onAdded` for each Tag in the Collection  
    
    
    mpSdk.Tag.data.subscribe(new TagObserver());  
    

### Shutting down an Observer​

When updates to state are no longer required, Observers should be removed from the Observable. When subscribing to an Observable, an [`ISubscription`](/reference/) object is returned. The `ISubscription` object is the object used to remove the subscribed Observer and stop any callback it would have received.
    
    
    const tagSubscription = mpSdk.Tag.data.subscribe({  
    
    
      onAdded(index, item, collection) { },  
    
    
    });  
    
    
      
    
    
    // ... some time later  
    
    
    tagSubscription.cancel();  
    
    
    // from here on, the Observer's associated with `tagSubscription` will no longer be called back  
    

### Cloning an Observer's View of the Collection​

Because the items passed to the Observers' callbacks are shared references to the item in the collection, and the collection argument is also a shared reference to the cache, any mutations done to either object will be seen by all Observers and can potentially be blown away by updates to the Collection or its data. If a snapshot of the Collection or its items is needed, cloning one or both objects is necessary, making sure to clone the items' nested arrays and objects, and possibly slicing its strings.
    
    
    type TagItem = MpSdk.Tag.TagData;  
    
    
    const tagView: Record<string, TagItem> = {};  
    
    
    mpSdk.Tag.data.subscribe({  
    
    
      onAdded(index, tag, collection) {  
    
    
        tagView[index] = {  
    
    
          ...tag,  
    
    
          anchorPosition: { ...tag.anchorPosition },  
    
    
          attachments: [ ...tag.attachments ],  
    
    
          color: { ...tag.color },  
    
    
          description: tag.description.slice(),  
    
    
          id: tag.id.slice(),  
    
    
          label: tag.label.slice(),  
    
    
          roomId: tag.roomId.slice(),  
    
    
          stemVector: { ...tag.stemVector },  
    
    
        }  
    
    
      },  
    
    
    });  
    

## Benefits of Observable Collections​

Like standard Observables, Collections provide many of the same benefits over our previous implementations of state.

### Less Boilerplate​

Before Collections, events (`on`) could be used to watch for some collections of state. However, events can be missed. Getting the state of infrequently changing data required polling the data using something like `getData` to seed the data if the event is missed.

**DON'T** : Setting up a `Label.POSITION_UPDATED` handler and seeding the data using `getData` is very verbose.
    
    
    let labels: MpSdk.Label.Label[];  
    
    
    function updateLabels(updatedLabels) {  
    
    
      labels = updatedLabels;  
    
    
    }  
    
    
      
    
    
    // listen for label changes  
    
    
    mpSdk.on(mpSdk.Label.POSITION_UPDATED, updateLabels);  
    
    
    // poll the data once in case the `POSITION_UPDATED` event hasn't fired yet  
    
    
    labels = await mpSdk.Label.getData();  
    

**DO** : Use a Collection to reduce the above example to only one call: its `subscribe` function.
    
    
    let tags: MpSdk.Dictionary<MpSdk.Tag.TagData>;  
    
    
    mpSdk.Tag.data.subscribe({  
    
    
      // NOTE: this is only saving the reference to the shared `collection`...  
    
    
      // ...It will update as the collection changes  
    
    
      onCollectionUpdated(collection) {  
    
    
        tags = collection;  
    
    
       },  
    
    
    });  
    

### More Granular and Descriptive Updates​

Collections express the extent of their changes to Observers.

**DON'T** : Tracking differences between multiple "get" calls is complex, verbose, and error-prone
    
    
    const mattertagData = await mpSdk.Mattertag.getData();  
    
    
      
    
    
    const newMattertagData = await mpSdk.Mattertag.getData();  
    
    
      
    
    
    // check and save references in the "new" data as compared to the previous data  
    
    
    const newTags = [];  
    
    
    for (const key in newMattertagData) {  
    
    
      if (!mattertagData.hasOwnProperty(key)) {  
    
    
        newTags.push(newMattertagData[key]);  
    
    
      }  
    
    
    }  
    
    
      
    
    
    // check what has been removed  
    
    
    // ...  
    
    
    // check what has been updated  
    
    
    // ...  
    

**DO** : Let the Collection figure out what has changed and how
    
    
    mpSdk.Tag.subscribe({  
    
    
      onAdded(index, tag, collection) {  
    
    
        console.log(`a new tag at ${index} was added to the collection`);  
    
    
      }  
    
    
    });  
    

### Better Efficiency​

Another benefit to Collections is that once subscribed, Observers are only called when changes occur. When a "get" call would return the same state as the previous call, it is doing unnecessary work. The excessive "get" calls and extra work done for each call are a potential for decreasing the performance of the application.

**DON'T** : Polling the current set of Mattertags by using an update loop triggers unnecessary updates
    
    
    function updateMattertagData() {  
    
    
      const mattertagData = await mpSdk.Mattertag.getData();  
    
    
      requestAnimationFrame(updateMattertagData);  
    
    
    }  
    
    
    requestAnimationFrame(updateMattertagData);  
    

**DO** : Use the Collection to track state and automatically update only as needed
    
    
    // only called on first subscribe and when the Tag collection has changed  
    
    
    mpSdk.Tag.data.subscribe({  
    
    
      onCollectionUpdated(collection) {},  
    
    
    });  
    

  * Receiving State from a Collection
    * Observing How a Collection has Changed
    * Observing When the Collection has Changed
    * Using Multiple Observers
    * Shutting down an Observer
    * Cloning an Observer's View of the Collection
  * Benefits of Observable Collections
    * Less Boilerplate
    * More Granular and Descriptive Updates
    * Better Efficiency


