<!-- source: https://developers.matterport.com/reference/floor/ -->

On this page

Namespaces

  * [Conversion](/reference/floor/conversion/)



Types

  * FloorData
  * Floors
  * ObservableFloorData



Enumerations

  * Event



Observables

  * current
  * data



Methods

  * getData
  * moveTo
  * showAll



## Types​

### FloorData​

FloorData: _object_

Property| Type| id| string| name| string| sequence| number  
---|---  
  
### Floors​

Floors: _object_

Property| Type| currentFloor| number| floorNames| string[]| totalFloors| number  
---|---  
  
### ObservableFloorData​

ObservableFloorData: _object_

Property| Type| id| string | undefined| name| string| sequence| number | undefined  
---|---  
  
## Enumerations​

### Event​

Event: _enum_

Member| Value| CHANGE_END| "floors.changeend"| CHANGE_START| "floors.changestart"  
---|---  
  
## Observables​

### current​

current: [IObservable](/reference/iobservable/)<Floor.ObservableFloorData>

An observable for the player's currently active floor.

The current floor can tell you when "all floors" are visible and encodes when the camera is transitioning between floors.

The following table shows all 4 states of the current floor observable (INSIDE: inside mode, DH: dollhouse mode, FP: floorplan mode).

| at sweep (INSIDE) or floor (DH, FP)| all floors (DH, FP)| transitioning| in unplaced 360º view| id| `${current.id}`| ''| ''| undefined| sequence| `${current.sequence}`| -1| undefined| undefined| name| `${current.name}`| 'all'| ''| ''  
---|---|---|---|---  
      
    
    mpSdk.Floor.current.subscribe(function (currentFloor) {  
    
    
      // Change to the current floor has occurred.  
    
    
      if (currentFloor.sequence === -1) {  
    
    
        console.log('Currently viewing all floors');  
    
    
      } else if (currentFloor.sequence === undefined) {  
    
    
        if (currentFloor.id === undefined) {  
    
    
          console.log('Current viewing an unplaced unaligned sweep');  
    
    
        } else {  
    
    
          console.log('Currently transitioning between floors');  
    
    
        }  
    
    
      } else {  
    
    
        console.log('Currently on floor', currentFloor.id);  
    
    
        console.log('Current floor\'s sequence index', currentFloor.sequence);  
    
    
        console.log('Current floor\'s name', currentFloor.name)  
    
    
      }  
    
    
    });  
    

### data​

data: [IObservableMap](/reference/iobservablemap/)<Floor.FloorData>

An observable collection of Floor data that can be subscribed to.

See [`IObservableMap`](/reference/iobservablemap/) to learn how to receive data from the collection.
    
    
    mpSdk.Floor.data.subscribe({  
    
    
      onCollectionUpdated: function (collection) {  
    
    
        console.log('Collection received. There are ', Object.keys(collection).length, 'floors in the collection');  
    
    
      }  
    
    
    });  
    

## Methods​

### getData​

getData(): Promise<Floor.Floors>

deprecated Use the observable `data` collection instead

This function returns the state of all floors.
    
    
    mpSdk.Floor.getData()  
    
    
      .then(function(floors) {  
    
    
        // Floor data retreival complete.  
    
    
        console.log('Current floor: ' + floors.currentFloor);  
    
    
        console.log('Total floors: ' + floors.totalFloors);  
    
    
        console.log('Name of first floor: ' + floors.floorNames[0]);  
    
    
      })  
    
    
      .catch(function(error) {  
    
    
        // Floors data retrieval error.  
    
    
      });  
    

**Returns:** `Promise`<Floor.Floors>

### moveTo​

moveTo(index: number): Promise<number>

When in inside mode, this function changes the active floor, and moves the camera to the nearest position on that floor. When in floorplan/dollhouse mode, this function changes the active floor, but does not modify the camera
    
    
    mpSdk.Floor.moveTo(2)  
    
    
      .then(function(floorIndex) {  
    
    
        // Move to floor complete.  
    
    
        console.log('Current floor: ' + floorIndex);  
    
    
      })  
    
    
      .catch(function(error) {  
    
    
        // Error moving to floor.  
    
    
      });  
    

Parameter| Type| index| number  
The destination floor index  
---|---  
  
**Returns:** `Promise`<number>

The destination floor index.

### showAll​

showAll(): Promise<void>

This function displays all floors.
    
    
    mpSdk.Floor.showAll()  
    
    
      .then(function(){  
    
    
        // Show floors complete.  
    
    
      })  
    
    
      .catch(function(error) {  
    
    
        // Error displaying all floors.  
    
    
      });  
    

**Returns:** `Promise`<void>

  * Namespaces
    * [Conversion](/reference/floor/conversion/)
  * Types
    * FloorData
    * Floors
    * ObservableFloorData
  * Enumerations
    * Event
  * Observables
    * current
    * data
  * Methods
    * getData
    * moveTo
    * showAll



  * Types
    * FloorData
    * Floors
    * ObservableFloorData
  * Enumerations
    * Event
  * Observables
    * current
    * data
  * Methods
    * getData
    * moveTo
    * showAll


