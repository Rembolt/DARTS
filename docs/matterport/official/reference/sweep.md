<!-- source: https://developers.matterport.com/reference/sweep/ -->

On this page

Namespaces

  * [Conversion](/reference/sweep/conversion/)



Types

  * EmptySweepFloorInfo
  * MoveToOptions
  * ObservableSweepData
  * SweepData
  * SweepFloorInfo



Enumerations

  * Alignment
  * Event
  * Placement
  * Transition



Observables

  * current
  * data



Methods

  * addNeighbors
  * createGraph
  * disable
  * enable
  * moveTo
  * removeNeighbors



## Types​

### EmptySweepFloorInfo​

EmptySweepFloorInfo: _object_

Property| Type| id| undefined| sequence| undefined  
---|---  
  
### MoveToOptions​

MoveToOptions: _object_

`rotation.x`: is the amount the camera will rotate up/down, in the range between [-90…90] with -90 being straight down and 90 being straight up, 45 would be looking up at a 45 degree angle., -45 down etc.. `rotation.y`: is the amount the camera rotate around horizontally, between [-360…0…360], negative values to rotate to the left, positive to rotate to the right.

Note: The rotation that Sweep.moveTo uses for input is the same rotation that will get returned from the [`Camera.pose`](/reference/camera/#pose) property.
    
    
    const cachedPose = null;  
    
    
    mpSdk.Camera.pose.subscribe(function (pose) {  
    
    
      cachedPose = pose;  
    
    
    })  
    
    
      
    
    
    // If the pose is returned immediately.  
    
    
    console.log(cachedPose.rotation);  
    

Property| Type| rotation?| [Rotation](/reference/#type-rotation) | undefined| transition?| Sweep.Transition | undefined| transitionTime?| number | undefined  
Total transition time in milliseconds.  
---|---  
  
### ObservableSweepData​

ObservableSweepData: _object_

Property| Type| alignmentType| Sweep.Alignment  
How the sweep relates to the model's 3D geometry. See Sweep.Alignment.| enabled| boolean  
If sweep can be navigated to and visualized. Can be toggled with Sweep.enable and Sweep.disable.| floorInfo| Sweep.SweepFloorInfo | Sweep.EmptySweepFloorInfo| id| string| neighbors| string[]| placementType| Sweep.Placement  
How the sweep's position was determined. See Sweep.Placement.| position| [Vector3](/reference/#type-vector3)| puckPosition| [Vector3](/reference/#type-vector3)  
The position of the sweep puck below the panorama.| rotation| [EulerAngle](/reference/#type-eulerangle)  
The rotation of the panoramic imagery relative to the model as a Euler Angle| sid| string| uuid| string  
---|---  
  
### SweepData​

SweepData: _object_

Property| Type| alignmentType| Sweep.Alignment  
How the sweep relates to the model's 3D geometry. See Sweep.Alignment.| floor| number| neighbors| string[]| placementType| Sweep.Placement  
How the sweep's position was determined. See Sweep.Placement.| position| [Vector3](/reference/#type-vector3)| rotation| [EulerAngle](/reference/#type-eulerangle)  
The rotation of the panoramic imagery relative to the model as a Euler Angle| sid| string| uuid| string  
---|---  
  
### SweepFloorInfo​

SweepFloorInfo: _object_

Property| Type| id| string| sequence| number  
---|---  
  
## Enumerations​

### Alignment​

Alignment: _enum_

How a sweep's imagery relates to the model's 3D geometry.

Member| Value| ALIGNED| "aligned"  
The sweep has its own 3D data and is aligned to the model's geometry.| UNALIGNED| "unaligned"  
The sweep is a 360 view and is not aligned to the model's 3D geometry.  
---|---  
  
### Event​

Event: _enum_

Member| Value| ENTER| "sweep.enter"| EXIT| "sweep.exit"  
---|---  
  
### Placement​

Placement: _enum_

How a sweep's position within the model was determined.

Member| Value| AUTO| "auto"  
The sweep was positioned automatically.| MANUAL| "manual"  
The sweep was positioned manually by a user.| UNPLACED| "unplaced"  
The sweep has no placement in the model.  
---|---  
  
### Transition​

Transition: _enum_

Transition types for camera movements. This is the canonical transition type enum. Used for [`Mode.moveTo`](/reference/mode/#moveto), `Sweep.moveTo`, [`Mattertag.navigateToTag`](/reference/mattertag/#navigatetotag), and other camera movement methods. Note: not all values are supported, refer to per-method documentation for details.

See [Camera.TransitionType](/reference/camera/#enum-transitiontype)

Member| Value| FADEOUT| "transition.fade"  
Fade to black transition| FLY| "transition.fly"  
Fly transition| INSTANT| "transition.instant"  
Instant transition| MOVEFADE| "transition.movefade"  
experimental Move with fade transition| ORBIT| "transition.orbit"  
experimental Orbit transition  
---|---  
  
## Observables​

### current​

current: [IObservable](/reference/iobservable/)<Sweep.ObservableSweepData>

An observable for the player's current sweep.

If the camera is transitioning to or is currently in Dollhouse or Floorplan mode, or if the camera is transitioning between sweeps, the `currentSweep` argument in the registered callback will be a "default" sweep that has an empty `sid` property.

If the sweep is an unaligned, unplaced 360º view, `currentSweep.floorInfo.id` and `currentSweep.floorInfo.sequence` will both be `undefined`.

Use this table with the results of `sid`, `floorInfo.sequence`, and `floorInfo.id` to determine the current of the three possible states.

| at sweep| transitioning| in unplaced 360º view| sid| `${current.sid}`| ''| `${current.sid}`| floorInfo.sequence| `${floorInfo.sequence}`| undefined| undefined| floorInfo.id| `${floorInfo.id}`| undefined| undefined  
---|---|---|---  
      
    
    mpSdk.Sweep.current.subscribe(function (currentSweep) {  
    
    
      // Change to the current sweep has occurred.  
    
    
      if (currentSweep.sid === '') {  
    
    
        console.log('Not currently stationed at a sweep position');  
    
    
      } else {  
    
    
        console.log('Currently at sweep', currentSweep.sid);  
    
    
        console.log('Current position', currentSweep.position);  
    
    
        console.log('On floor', currentSweep.floorInfo.sequence);  
    
    
      }  
    
    
    });  
    

You can also use this observable to wait until the user is in a sweep before executing additional code:
    
    
    await mpSdk.Sweep.current.waitUntil((currentSweep) => currentSweep.id !== '');  
    

### data​

data: [IObservableMap](/reference/iobservablemap/)<Sweep.ObservableSweepData>

An observable collection of sweep data that can be subscribed to.

When first subscribing, the current set of Sweeps will call the observer's `onAdded` for each Sweep as the data becomes available.

Sweeps that are disabled via Edit Mode or Model API will not be included in the collection in Showcase.
    
    
    mpSdk.Sweep.data.subscribe({  
    
    
      onAdded: function (index, item, collection) {  
    
    
        console.log('sweep added to the collection', index, item, collection);  
    
    
      },  
    
    
      onRemoved: function (index, item, collection) {  
    
    
        console.log('sweep removed from the collection', index, item, collection);  
    
    
      },  
    
    
      onUpdated: function (index, item, collection) {  
    
    
        console.log('sweep updated in place in the collection', index, item, collection);  
    
    
      },  
    
    
      onCollectionUpdated: function (collection) {  
    
    
        console.log('the entire up-to-date collection', collection);  
    
    
      }  
    
    
    });  
    

## Methods​

### addNeighbors​

addNeighbors(sweepId: string, toAdd: string[]): Promise<string[]>

Add specified sweep IDs to the neighbors array

This method allows changing the sweep connectivitiy to enable navigation from `sweepId` to all sweeps in the `toAdd` array. Note that we use V2 IDs for all arguments. Refer to Conversion.createIdMap() if you need to convert from the legacy V1 IDs.
    
    
    Sweep.addNeighbors("hn7etcuyffbmqkyp5e43axa0b", ["zr7ns1smp51zibx4s239di7wb"]);  
    

Parameter| Type| sweepId| string  
Sweep ID| toAdd| string[]  
List of Sweep IDs to connect  
---|---  
  
**Returns:** `Promise`<string[]>

A promise to a list of all current neighbor IDs (v2)

### createGraph​

createGraph(): Promise<[Graph.IDirectedGraph](/reference/graph/idirectedgraph/)<Sweep.ObservableSweepData>>

A graph of enabled sweeps that can be used for pathfinding. This graph will automatically update as sweeps change and trigger any observers. The weight of each edge is the Euclidean distance from a sweep to its neighbor.

Enabling a sweep will automatically add it and its edges to the graph.

Disabling a sweep will automatically remove it and its edges from the graph.
    
    
    const sweepGraph = await mpSdk.Sweep.createGraph();  
    
    
    const startSweep = sweepGraph.vertex('[start vertex]');  
    
    
    const endSweep = sweepGraph.vertex('[end vertex]');  
    
    
      
    
    
    const path = mpSdk.Graph.createAStarRunner(sweepGraph, startSweep, endSweep).exec();  
    

**Returns:** `Promise`<[Graph.IDirectedGraph](/reference/graph/idirectedgraph/)<Sweep.ObservableSweepData>>

### disable​

disable(sweepIds: string[]): Promise<void>

Disable a set of sweeps by ids.

Disabling a sweep will hide the sweep's puck and prevent the player's ability to navigate to that location.
    
    
    mpSdk.Sweep.disable('sweep1', 'sweep2', 'sweep3');  
    

Parameter| Type| sweepIds| string[]  
the ids of the sweeps to disable  
---|---  
  
**Returns:** `Promise`<void>

### enable​

enable(sweepIds: string[]): Promise<void>

Enable a set of sweeps by ids.

Enabling a sweep will show the sweep's puck and allow the player to navigate to that location.
    
    
    mpSdk.Sweep.enable('sweep1', 'sweep2', 'sweep3');  
    

Parameter| Type| sweepIds| string[]  
the ids of the sweeps to enable  
---|---  
  
**Returns:** `Promise`<void>

### moveTo​

moveTo(sweep: string, options: Sweep.MoveToOptions): Promise<string>

Move to a sweep.
    
    
      
    
    
    const sweepId: string; // Acquired through a previous call to Sweep.data, Sweep.current, etc.  
    
    
    const rotation = { x: 30, y: -45 };  
    
    
    const transition = mpSdk.Camera.Transition.INSTANT;  
    
    
    const transitionTime = 2000; // in milliseconds  
    
    
      
    
    
    mpSdk.Sweep.moveTo(sweepId, {  
    
    
        rotation: rotation,  
    
    
        transition: transition,  
    
    
        transitionTime: transitionTime,  
    
    
      })  
    
    
      .then(function(sweepId){  
    
    
        // Move successful.  
    
    
        console.log('Arrived at sweep ' + sweepId);  
    
    
      })  
    
    
      .catch(function(error){  
    
    
        // Error with moveTo command  
    
    
      });  
    

Parameter| Type| sweep| string  
The destination sweep.| options| Sweep.MoveToOptions  
Options for the movement.  
---|---  
  
**Returns:** `Promise`<string>

A promise that will return the destination sweep.

### removeNeighbors​

removeNeighbors(sweepId: string, toRemove: string[]): Promise<string[]>

Remove specified sweep IDs from the neighbors array

This method allows changing the sweep connectivitiy to prevent navigation from `sweepId` to all sweeps in the `toRemove` array. Note that we use V2 IDs for all arguments. Refer to Conversion.createIdMap() if you need to convert from the legacy V1 IDs.
    
    
    Sweep.removeNeighbors("hn7etcuyffbmqkyp5e43axa0b", ["zr7ns1smp51zibx4s239di7wb"]);  
    

Parameter| Type| sweepId| string  
Sweep ID| toRemove| string[]  
List of Sweep IDs to disconnect  
---|---  
  
**Returns:** `Promise`<string[]>

A promise to a list of all current neighbor IDs (v2)

  * Namespaces
    * [Conversion](/reference/sweep/conversion/)
  * Types
    * EmptySweepFloorInfo
    * MoveToOptions
    * ObservableSweepData
    * SweepData
    * SweepFloorInfo
  * Enumerations
    * Alignment
    * Event
    * Placement
    * Transition
  * Observables
    * current
    * data
  * Methods
    * addNeighbors
    * createGraph
    * disable
    * enable
    * moveTo
    * removeNeighbors



  * Types
    * EmptySweepFloorInfo
    * MoveToOptions
    * ObservableSweepData
    * SweepData
    * SweepFloorInfo
  * Enumerations
    * Alignment
    * Event
    * Placement
    * Transition
  * Observables
    * current
    * data
  * Methods
    * addNeighbors
    * createGraph
    * disable
    * enable
    * moveTo
    * removeNeighbors


