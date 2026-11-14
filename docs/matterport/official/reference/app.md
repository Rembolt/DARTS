<!-- source: https://developers.matterport.com/reference/app/ -->

On this page

Types

  * AppState
  * Features
  * State



Enumerations

  * Application
  * Event
  * Feature
  * Phase



Observables

  * features
  * state



Methods

  * getLoadTimes
  * getState



## Types​

### AppState​

AppState: _object_

deprecated This type is used by deprecated functionality. Use `state` observable.

Property| Type| application| App.Application| phase| App.Phase  
---|---  
  
### Features​

Features: _Record <App.Feature, boolean | undefined>_

An observable collection of features and their state 'true' - Feature is available 'false' - Feature is not available 'undefined' - Feature availability cannot be determined.
    
    
    type Features = Record<Feature, boolean | undefined>  
    

### State​

State: _object_

Property| Type| application| App.Application| phase| App.Phase| phaseTimes| Record<App.Phase, number>  
An object whose keys are phases from Phase and values are epoch time in milliseconds. The times are filled in after the phase has passed.
    
    
    {  
      phaseTimes: {  
        [Phase.UNINITIALIZED]: 1570084156590,  
        [Phase.WAITING]: 0,  
        [Phase.LOADING]: 0,  
        [Phase.STARTING]: 0,  
        [Phase.PLAYING]: 0,  
        [Phase.ERROR]: 0,  
      }  
    }  
      
  
---|---  
  
## Enumerations​

### Application​

Application: _enum_

Application

Member| Value| SHOWCASE| "application.showcase"| UNKNOWN| "application.unknown"| WEBVR| "application.webvr"| WORKSHOP| "application.workshop"  
---|---  
  
### Event​

Event: _enum_

Member| Value| PHASE_CHANGE| "application.phasechange"  
---|---  
  
### Feature​

Feature: _enum_

Feature availability and activation data is returned as a part of the `features` observable.

Member| Value| Defurnish| "feature.defurnish"| MeshPresent| "feature.meshpresent"  
A mesh asset is present in the currently active view| RoomBounds| "feature.roombounds"| SplatPresent| "feature.splatpresent"  
A splat (Gaussian splat) asset is present in the currently active view  
---|---  
  
### Phase​

Phase: _enum_

Application phases are returned as part of the `state` observable.
    
    
    mpSdk.App.state.subscribe(function (appState) {  
    
    
     if(appState.phase === mpSdk.App.Phase.LOADING) {  
    
    
       console.log('The app has started loading!')  
    
    
     }  
    
    
     if(appState.phase === mpSdk.App.Phase.STARTING) {  
    
    
       console.log('The transition into the start location begins!')  
    
    
     }  
    
    
     if(appState.phase === mpSdk.App.Phase.PLAYING) {  
    
    
       console.log('The app is ready to take user input now!')  
    
    
     }  
    
    
    });  
    

Member| Value| ERROR| "appphase.error"| LOADING| "appphase.loading"| PLAYING| "appphase.playing"| STARTING| "appphase.starting"| UNINITIALIZED| "appphase.uninitialized"| WAITING| "appphase.waiting"  
---|---  
  
## Observables​

### features​

features: [IObservable](/reference/iobservable/)<App.Features>

Bundle Embed

_Introduced 24.9.3_

An observable list of features, their availability and their presence in Showcase.
    
    
    App.features.subscribe({  
    
    
      onChanged(features) {  
    
    
        // room bounds setting has changed  
    
    
        if (features[App.Feature.RoomBounds] !== undefined) {  
    
    
          console.log('RoomBounds are ', features[App.Feature.RoomBounds] ? 'available' : 'unavailable');  
    
    
        }  
    
    
        else {  
    
    
          console.log('RoomBounds are unavailable.');  
    
    
        }  
    
    
      }  
    
    
    });  
    

### state​

state: [IObservable](/reference/iobservable/)<App.State>

An observable application state object.
    
    
    mpSdk.App.state.subscribe(function (appState) {  
    
    
     // app state has changed  
    
    
     console.log('The current application: ', appState.application);  
    
    
     console.log('The current phase: ', appState.phase);  
    
    
     console.log('Loaded at time ', appState.phaseTimes[mpSdk.App.Phase.LOADING]);  
    
    
     console.log('Started at time ', appState.phaseTimes[mpSdk.App.Phase.STARTING]);  
    
    
    });  
    
    
      
    
    
    output  
    
    
    > The current application: application.showcase  
    
    
    > The current phase: appphase.waiting  
    
    
    > Loaded at time 1570084156590  
    
    
    > Started at time 1570084156824  
    
    
    >  
    

## Methods​

### getLoadTimes​

getLoadTimes(): Promise<{ [key in App.Phase]: null | number; }>

deprecated Use `state` observable to get load times.

**Returns:** `Promise`<{ [key in App.Phase]: null | number; }>

### getState​

getState(): Promise<App.AppState>

deprecated Use `state` observable to get the current phase or application.

**Returns:** `Promise`<App.AppState>

  * Types
    * AppState
    * Features
    * State
  * Enumerations
    * Application
    * Event
    * Feature
    * Phase
  * Observables
    * features
    * state
  * Methods
    * getLoadTimes
    * getState



  * Types
    * AppState
    * Features
    * State
  * Enumerations
    * Application
    * Event
    * Feature
    * Phase
  * Observables
    * features
    * state
  * Methods
    * getLoadTimes
    * getState


