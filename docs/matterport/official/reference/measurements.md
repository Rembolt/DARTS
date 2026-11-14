<!-- source: https://developers.matterport.com/reference/measurements/ -->

On this page

Interfaces

  * [MeasurementModeData](/reference/measurements/measurementmodedata/)



Types

  * MeasurementData
  * MeasurementDescriptor
  * State



Enumerations

  * MeasurementType



Observables

  * data
  * mode



Methods

  * add
  * getData
  * remove
  * toggleMode



## Types​

### MeasurementData​

MeasurementData: _object_

Property| Type| end| [Vector3](/reference/#type-vector3)| floor| number| label| string| sid| string| start| [Vector3](/reference/#type-vector3)  
---|---  
  
### MeasurementDescriptor​

MeasurementDescriptor: _object_

Property| Type| label?| string | undefined  
The text label to attach to the measurement| points| [Vector3](/reference/#type-vector3)[]  
The list of points of the measurement| type?| Measurements.MeasurementType | undefined  
The type of measurement to create. Defaults to MeasurementType.ThreeD if not specified  
---|---  
  
### State​

State: _object_

Property| Type| active| boolean  
---|---  
  
## Enumerations​

### MeasurementType​

MeasurementType: _enum_

Member| Value| Floorplan| "measurement.type.floorplan"  
A measurement only visible in the floorplan views.| ThreeD| "measurement.type.3d"  
A measurement visible in any 3d view (inside/dollhouse/etc)  
---|---  
  
## Observables​

### data​

data: [IObservableMap](/reference/iobservablemap/)<[Measurements.MeasurementModeData](/reference/measurements/measurementmodedata/)>

An observable collection of measurement mode data that can be subscribed to.
    
    
    mpSdk.Measurements.data.subscribe({  
    
    
      onAdded: function (index, item, collection) {  
    
    
        console.log('item added to the collection', index, item, collection);  
    
    
      },  
    
    
      onRemoved: function (index, item, collection) {  
    
    
        console.log('item removed from the collection', index, item, collection);  
    
    
      },  
    
    
      onUpdated: function (index, item, collection) {  
    
    
        console.log('item updated in place in the collection', index, item, collection);  
    
    
      },  
    
    
      onCollectionUpdated: function (collection) {  
    
    
        console.log('the entire up-to-date collection', collection);  
    
    
      }  
    
    
    });  
    

### mode​

mode: [IObservable](/reference/iobservable/)<Measurements.State>

An observable measurement mode state object.
    
    
    mpSdk.Measurements.mode.subscribe(function (measurementModeState) {  
    
    
     // measurement mode state has changed  
    
    
     console.log('Is measurement mode currently active? ', measurementModeState.active);  
    
    
    });  
    
    
      
    
    
    // output  
    
    
    // > Is measurement mode currently active? true  
    

## Methods​

### add​

add(measurements: Measurements.MeasurementDescriptor[]): Promise<[Measurements.MeasurementModeData](/reference/measurements/measurementmodedata/)[]>

experimental

Add one or more measurements.
    
    
    mpSdk.Measurements.add({  
    
    
      label: 'first',  
    
    
      points: [  
    
    
        {x: 0, y: 0, z: 0},  
    
    
        {x: 1, y: 0, z: 1},  
    
    
        {x: 2, y: 0, z: 2},  
    
    
      ],  
    
    
    }, {  
    
    
      points: [  
    
    
        {x: -2, y: 0, z: -2},  
    
    
        {x: -1, y: 0, z: -1},  
    
    
      ],  
    
    
    });  
    

Parameter| Type| measurements| Measurements.MeasurementDescriptor[]  
the measurement descriptors to add  
---|---  
  
**Returns:** `Promise`<[Measurements.MeasurementModeData](/reference/measurements/measurementmodedata/)[]>

### getData​

getData(): Promise<Measurements.MeasurementData[]>

deprecated Use `data`

**Returns:** `Promise`<Measurements.MeasurementData[]>

### remove​

remove(measurements: [Measurements.MeasurementModeData](/reference/measurements/measurementmodedata/)[]): Promise<void>

experimental

Remove one or more measurements.
    
    
    const measurements: Dictionary<Measurements.MeasurementModeData>; // ... acquired through `mpSdk.Measurements.data`  
    
    
    // remove one measurement  
    
    
    mpSdk.Measurements.remove(measurements);  
    
    
      
    
    
    // or remove multiple at the same time  
    
    
    mpSdk.Measurements.remove(...Object.values(measurements));  
    

Parameter| Type| measurements| [Measurements.MeasurementModeData](/reference/measurements/measurementmodedata/)[]  
---|---  
  
**Returns:** `Promise`<void>

### toggleMode​

toggleMode(activate: boolean, options?: { hideAddButton: boolean; }): Promise<void>

Activate or deactivate measurement mode. This function can only be used after the application has started playing. Use [`App.state`](/reference/app/#state) to determine the phase of the application.
    
    
    mpSdk.Measurements.toggleMode(true)  
    
    
      .then(() => {  
    
    
        console.log('measurement mode is now active');  
    
    
      });  
    

Parameter| Type| activate| boolean| options?| { hideAddButton: boolean; }  
---|---  
  
**Returns:** `Promise`<void>

  * Interfaces
    * [MeasurementModeData](/reference/measurements/measurementmodedata/)
  * Types
    * MeasurementData
    * MeasurementDescriptor
    * State
  * Enumerations
    * MeasurementType
  * Observables
    * data
    * mode
  * Methods
    * add
    * getData
    * remove
    * toggleMode



  * Types
    * MeasurementData
    * MeasurementDescriptor
    * State
  * Enumerations
    * MeasurementType
  * Observables
    * data
    * mode
  * Methods
    * add
    * getData
    * remove
    * toggleMode


