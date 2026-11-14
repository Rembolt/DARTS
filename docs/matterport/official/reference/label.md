<!-- source: https://developers.matterport.com/reference/label/ -->

On this page

Types

  * Label
  * LabelDeprecated



Enumerations

  * Event



Observables

  * data



Methods

  * getData



## Types​

### Label​

Label: _object_

Property| Type| floor| number| floorInfo| { id: string; sequence: number; }| position| [Vector3](/reference/#type-vector3)| sid| string| text| string| visible| boolean  
---|---  
  
### LabelDeprecated​

LabelDeprecated: _object_

Property| Type| floor| number| floorInfo| { id: string; sequence: number; }| position| [Vector3](/reference/#type-vector3)| screenPosition| [Vector2](/reference/#type-vector2)| sid| string| text| string| visible| boolean  
---|---  
  
## Enumerations​

### Event​

Event: _enum_

Member| Value| POSITION_UPDATED| "label.positionupdated"  
---|---  
  
## Observables​

### data​

data: [IObservableMap](/reference/iobservablemap/)<Label.Label>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

An observable map of the current labels. Returns an object with a map of labels.
    
    
    mpSdk.Label.data.subscribe({  
    
    
     onAdded: function (index, item, collection) {  
    
    
       console.log('Label added to the collection', index, item, collection);  
    
    
     },  
    
    
     onRemoved: function (index, item, collection) {  
    
    
       console.log('Label removed from the collection', index, item, collection);  
    
    
     },  
    
    
     onUpdated: function (index, item, collection) {  
    
    
       console.log('Label updated in place in the collection', index, item, collection);  
    
    
     },  
    
    
    });  
    

## Methods​

### getData​

getData(): Promise<Label.LabelDeprecated[]>

deprecated Use `data` observable instead.

This function returns the data of all labels.

**Returns:** `Promise`<Label.LabelDeprecated[]>

  * Types
    * Label
    * LabelDeprecated
  * Enumerations
    * Event
  * Observables
    * data
  * Methods
    * getData



  * Types
    * Label
    * LabelDeprecated
  * Enumerations
    * Event
  * Observables
    * data
  * Methods
    * getData


