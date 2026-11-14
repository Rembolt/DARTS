<!-- source: https://developers.matterport.com/reference/sensor/isensorobserver/ -->

On this page

A specialized [`IMapObserver`](/reference/imapobserver/) which maps an `ISource` to its current `SensorReading`.

Methods

  * onAdded
  * onCollectionUpdated
  * onRemoved
  * onUpdated



## Methods​

### onAdded​

onAdded(source: [Sensor.ISource](/reference/sensor/isource/), reading: [SensorReading](/reference/sensor/#type-sensorreading), collection: Map<[Sensor.ISource](/reference/sensor/isource/), [SensorReading](/reference/sensor/#type-sensorreading)>): void

Called when a the first `reading` is added from `source`.

Parameter| Type| source| [Sensor.ISource](/reference/sensor/isource/)| reading| [SensorReading](/reference/sensor/#type-sensorreading)| collection| Map<[Sensor.ISource](/reference/sensor/isource/), [SensorReading](/reference/sensor/#type-sensorreading)>  
---|---  
  
### onCollectionUpdated​

onCollectionUpdated(collection: Map<[Sensor.ISource](/reference/sensor/isource/), [SensorReading](/reference/sensor/#type-sensorreading)>): void

Called when a set of changes happens within the `collection`.

Parameter| Type| collection| Map<[Sensor.ISource](/reference/sensor/isource/), [SensorReading](/reference/sensor/#type-sensorreading)>  
---|---  
  
### onRemoved​

onRemoved(source: [Sensor.ISource](/reference/sensor/isource/), reading: [SensorReading](/reference/sensor/#type-sensorreading), collection: Map<[Sensor.ISource](/reference/sensor/isource/), [SensorReading](/reference/sensor/#type-sensorreading)>): void

Called when `source` and its `reading` is removed.

Parameter| Type| source| [Sensor.ISource](/reference/sensor/isource/)| reading| [SensorReading](/reference/sensor/#type-sensorreading)| collection| Map<[Sensor.ISource](/reference/sensor/isource/), [SensorReading](/reference/sensor/#type-sensorreading)>  
---|---  
  
### onUpdated​

onUpdated(source: [Sensor.ISource](/reference/sensor/isource/), reading: [SensorReading](/reference/sensor/#type-sensorreading), collection: Map<[Sensor.ISource](/reference/sensor/isource/), [SensorReading](/reference/sensor/#type-sensorreading)>): void

Called when an existing `reading` is altered from `source`.

Parameter| Type| source| [Sensor.ISource](/reference/sensor/isource/)| reading| [SensorReading](/reference/sensor/#type-sensorreading)| collection| Map<[Sensor.ISource](/reference/sensor/isource/), [SensorReading](/reference/sensor/#type-sensorreading)>  
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


