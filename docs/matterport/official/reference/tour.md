<!-- source: https://developers.matterport.com/reference/tour/ -->

On this page

Sample custom tour.
    
    
    const connect = function(sdk) {  
    
    
      const mpSdk = sdk;  
    
    
      
    
    
      mpSdk.Tour.Event.on(Tour.Event.STEPPED, function(tourIndex){  
    
    
        console.log('Tour index ' + tourIndex);  
    
    
      });  
    
    
      mpSdk.Tour.Event.on(Tour.Event.STARTED, function(){  
    
    
        console.log('Tour started');  
    
    
      });  
    
    
      mpSdk.Tour.Event.on(Tour.Event.STOPPED, function(){  
    
    
        console.log('Tour stopped');  
    
    
      });  
    
    
      
    
    
      mpSdk.Tour.getData()  
    
    
        .then(function(tour) {  
    
    
          console.log('tour has ' + tour.length + ' stops');  
    
    
          return mpSdk.Tour.start(0);  
    
    
        })  
    
    
        .then(function(){  
    
    
          // console 'Tour started'  
    
    
          // console -> 'Tour index 0'  
    
    
          return mpSdk.Tour.next();  
    
    
        })  
    
    
        .then(function(){  
    
    
          // console -> 'Tour index 1'  
    
    
          return mpSdk.Tour.step(3);  
    
    
        })  
    
    
        .then(function(){  
    
    
          // console -> 'Tour index 3'  
    
    
          return mpSdk.Tour.prev();  
    
    
        })  
    
    
        .then(function(){  
    
    
          // console -> 'Tour index 2'  
    
    
          // console -> 'Tour stopped'  
    
    
          return mpSdk.Tour.stop();  
    
    
        });  
    
    
    }  
    

Types

  * CurrentStateData
  * CurrentStepData
  * CurrentTransitionData
  * Snapshot



Enumerations

  * Event
  * PlayState



Observables

  * currentStep
  * state
  * transition



Methods

  * getData
  * next
  * prev
  * start
  * step
  * stop



## Types​

### CurrentStateData​

CurrentStateData: _object_

Property| Type| current| Tour.PlayState  
---|---  
  
### CurrentStepData​

CurrentStepData: _object_

Property| Type| index| number | null| step| string | null  
---|---  
  
### CurrentTransitionData​

CurrentTransitionData: _object_

Property| Type| from| string | null| to| string | null  
---|---  
  
### Snapshot​

Snapshot: _object_

Property| Type| imageUrl| string| is360| boolean| mode| [Mode.Mode](/reference/mode/#enum-mode) | undefined| name| string| position| [Vector3](/reference/#type-vector3)| rotation| [Vector3](/reference/#type-vector3)| sid| string| thumbnailUrl| string| zoom| number  
---|---  
  
## Enumerations​

### Event​

Event: _enum_

Member| Value| ENDED| "tour.ended"| STARTED| "tour.started"| STEPPED| "tour.stepped"| STOPPED| "tour.stopped"  
---|---  
  
### PlayState​

PlayState: _enum_

Member| Value| ACTIVE| "tour.active"| INACTIVE| "tour.inactive"| STOP_SCHEDULED| "tour.stopscheduled"  
---|---  
  
## Observables​

### currentStep​

currentStep: [IObservable](/reference/iobservable/)<Tour.CurrentStepData>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

The zero-indexed current Tour step. The step will be null if no Tour is currently playing.
    
    
    mpSdk.Tour.currentStep.subscribe(function (current) {  
    
    
      // the step index has changed  
    
    
      // 0 for the first step, 1 for the second, etc.  
    
    
      console.log('Current step is ', current.step);  
    
    
    });  
    

### state​

state: [IObservable](/reference/iobservable/)<Tour.CurrentStateData>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

An observable state of the current Tour. Returns a Tour.PlayState of `INACTIVE` (no tour in progress), `ACTIVE` (tour in progress), or `STOP_SCHEDULED` (tour in progress, but a stop has been queued by the user or automatically by the tour ending).
    
    
    mpSdk.Tour.state.subscribe(function (state) {  
    
    
      // the state has changed  
    
    
      console.log('Current state is ', state.current);  
    
    
    });  
    

### transition​

transition: [IObservable](/reference/iobservable/)<Tour.CurrentTransitionData>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

An observable representing the current Tour's transition.

`{ from: string | null, to: string | null }`.

`from` can be `null` when transitioning from outside of a tour. `from` and `to` will both be `null` when there is no active transition.
    
    
    mpSdk.Tour.transition.subscribe(function (transition) {  
    
    
      // the transition has changed  
    
    
      console.log('Current transition is ', transition.from, transition.to);  
    
    
    });  
    

## Methods​

### getData​

getData(): Promise<Tour.Snapshot[]>

Bundle Embed

This function returns an array of Snapshots.
    
    
    mpSdk.Tour.getData()  
    
    
      .then(function(snapshots) {  
    
    
        // Tour getData complete.  
    
    
        if(snapshots.length > 0){  
    
    
          console.log('First snapshot sid: ' + snapshots[0].sid);  
    
    
          console.log('First snapshot name: ' + snapshots[0].name);  
    
    
          console.log('First snapshot position: ' + snapshots[0].position);  
    
    
        }  
    
    
      })  
    
    
      .catch(function(error) {  
    
    
        // Tour getData error.  
    
    
      });  
    

**Returns:** `Promise`<Tour.Snapshot[]>

### next​

next(): Promise<void>

Bundle Embed

This function moves the camera to the next snapshot in the tour.
    
    
    mpSdk.Tour.next()  
    
    
      .then(function() {  
    
    
        // Tour next complete.  
    
    
      })  
    
    
      .catch(function(error) {  
    
    
        // Tour next error.  
    
    
      });  
    

**Returns:** `Promise`<void>

### prev​

prev(): Promise<void>

Bundle Embed

This function moves the camera to the previous snapshot in the tour.
    
    
    mpSdk.Tour.prev()  
    
    
      .then(function() {  
    
    
        // Tour prev complete.  
    
    
      })  
    
    
      .catch(function(error) {  
    
    
        // Tour prev error.  
    
    
      });  
    

**Returns:** `Promise`<void>

### start​

start(index?: number): Promise<void>

Bundle Embed

This function starts the tour.
    
    
    const tourIndex = 1;  
    
    
      
    
    
    mpSdk.Tour.start(tourIndex)  
    
    
      .then(function() {  
    
    
        // Tour start complete.  
    
    
      })  
    
    
      .catch(function(error) {  
    
    
        // Tour start error.  
    
    
      });  
    

Parameter| Type| index?| number  
---|---  
  
**Returns:** `Promise`<void>

### step​

step(index: number): Promise<void>

Bundle Embed

This function moves the camera to a specific snapshot in the tour.
    
    
    const myStep = 2;  
    
    
    mpSdk.Tour.step(myStep)  
    
    
      .then(function() {  
    
    
        //Tour step complete.  
    
    
      })  
    
    
      .catch(function(error) {  
    
    
        // Tour step error.  
    
    
      });  
    

Parameter| Type| index| number  
---|---  
  
**Returns:** `Promise`<void>

### stop​

stop(): Promise<void>

Bundle Embed

This function stops the tour.
    
    
    mpSdk.Tour.stop()  
    
    
      .then(function() {  
    
    
        // Tour stop complete.  
    
    
      })  
    
    
      .catch(function(error) {  
    
    
        // Tour stop error.  
    
    
      });  
    

**Returns:** `Promise`<void>

  * Types
    * CurrentStateData
    * CurrentStepData
    * CurrentTransitionData
    * Snapshot
  * Enumerations
    * Event
    * PlayState
  * Observables
    * currentStep
    * state
    * transition
  * Methods
    * getData
    * next
    * prev
    * start
    * step
    * stop



  * Types
    * CurrentStateData
    * CurrentStepData
    * CurrentTransitionData
    * Snapshot
  * Enumerations
    * Event
    * PlayState
  * Observables
    * currentStep
    * state
    * transition
  * Methods
    * getData
    * next
    * prev
    * start
    * step
    * stop


