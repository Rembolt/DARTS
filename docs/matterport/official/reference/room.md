<!-- source: https://developers.matterport.com/reference/room/ -->

On this page

Namespaces

  * [Conversion](/reference/room/conversion/)



Types

  * CurrentRooms
  * RoomData



Observables

  * current
  * data



## Types​

### CurrentRooms​

CurrentRooms: _object_

Property| Type| rooms| Room.RoomData[]  
---|---  
  
### RoomData​

RoomData: _object_

Property| Type| bounds| { min: [Vector3](/reference/#type-vector3); max: [Vector3](/reference/#type-vector3); }| center| [Vector3](/reference/#type-vector3)| floorInfo| { id: string; sequence: number; }| id| string| label| string| size| [Vector3](/reference/#type-vector3)  
---|---  
  
## Observables​

### current​

current: [IObservable](/reference/iobservable/)<Room.CurrentRooms>

An observable to determine which rooms the player's camera is currently in.

If the camera is in a location between rooms, or somehwere where our room bounds overlap, the `rooms` array will contain both (or more) rooms. If the camera is in a mode other than `INSIDE`, the `rooms` array may be empty. If the camera is in an unaligned sweep, the `rooms` array will be empty.
    
    
    mpSdk.Room.current.subscribe(function (currentRooms) {  
    
    
      if (currentRooms.rooms.length > 0) {  
    
    
        console.log('currently in', currentRooms.rooms.length, 'rooms');  
    
    
      } else {  
    
    
        console.log('Not currently inside any rooms');  
    
    
      }  
    
    
    });  
    

### data​

data: [IObservableMap](/reference/iobservablemap/)<Room.RoomData>

An observable collection of Room data that can be subscribed to.

See [`IObservableMap`](/reference/iobservablemap/) to learn how to receive data from the collection.
    
    
    mpSdk.Room.data.subscribe({  
    
    
      onCollectionUpdated: function (collection) {  
    
    
        console.log('Collection received. There are ', Object.keys(collection).length, 'rooms in the collection');  
    
    
      }  
    
    
    });  
    

  * Namespaces
    * [Conversion](/reference/room/conversion/)
  * Types
    * CurrentRooms
    * RoomData
  * Observables
    * current
    * data



  * Types
    * CurrentRooms
    * RoomData
  * Observables
    * current
    * data


