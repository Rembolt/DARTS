<!-- source: https://developers.matterport.com/reference/imapobserver/ -->

On this page

An observer that can subscribe to changes of an [`IObservableMap`](/reference/iobservablemap/)

Methods

  * onAdded
  * onCollectionUpdated
  * onRemoved
  * onUpdated



## Methods​

### onAdded​

onAdded(index: string, item: ItemT, collection: [Dictionary](/reference/dictionary/)<ItemT>): void

Called when an item is added with the `index`, the new `item`, and current state of the `collection`.

Parameter| Type| index| string| item| ItemT| collection| [Dictionary](/reference/dictionary/)<ItemT>  
---|---  
  
### onCollectionUpdated​

onCollectionUpdated(collection: [Dictionary](/reference/dictionary/)<ItemT>): void

Called when a set of changes happens within the `collection`. For example, this can be used to get the initial state of the collection instead of receiving individual `onAdded` calls for each item.

Parameter| Type| collection| [Dictionary](/reference/dictionary/)<ItemT>  
---|---  
  
### onRemoved​

onRemoved(index: string, item: ItemT, collection: [Dictionary](/reference/dictionary/)<ItemT>): void

Called when an item is removed, with the `index`, the removed `item`, and current state of the `collection`.

Parameter| Type| index| string| item| ItemT| collection| [Dictionary](/reference/dictionary/)<ItemT>  
---|---  
  
### onUpdated​

onUpdated(index: string, item: ItemT, collection: [Dictionary](/reference/dictionary/)<ItemT>): void

Called when an existing item is altered, with the `index`, the new `item`, and current state of the `collection`.

Parameter| Type| index| string| item| ItemT| collection| [Dictionary](/reference/dictionary/)<ItemT>  
---|---  
  
  * Methods
    * onAdded
    * onCollectionUpdated
    * onRemoved
    * onUpdated



  * Methods
    * onAdded
    * onCollectionUpdated
    * onRemoved
    * onUpdated


