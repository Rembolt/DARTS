<!-- source: https://developers.matterport.com/reference/model/ -->

On this page

Types

  * ModelData
  * ModelDetails



Enumerations

  * Event



Methods

  * getData
  * getDetails



## Types​

### ModelData​

ModelData: _object_

Property| Type| modelSupportsVr| boolean| sid| string| sweeps| [Sweep.SweepData](/reference/sweep/#type-sweepdata)[]  
---|---  
  
### ModelDetails​

ModelDetails: _object_

Property| Type| address?| string | undefined| contactEmail?| string | undefined| contactName?| string | undefined| defaultViewId| string| description?| string | undefined| formattedAddress?| string | undefined| formattedContactPhone?| string | undefined| name?| string | undefined| phone?| string | undefined| presentedBy?| string | undefined| shareUrl?| string | undefined| sid| string| summary?| string | undefined  
---|---  
  
## Enumerations​

### Event​

Event: _enum_

Member| Value| MODEL_LOADED| "model.loaded"  
---|---  
  
## Methods​

### getData​

getData(): Promise<Model.ModelData>

This function returns basic model information.

This is no longer the canonical way to receive sweep information. See [`Sweep.data`](/reference/sweep/#data).
    
    
    mpSdk.Model.getData()  
    
    
      .then(function(model) {  
    
    
        // Model data retreival complete.  
    
    
        console.log('Model sid:' + model.sid);  
    
    
      })  
    
    
      .catch(function(error) {  
    
    
        // Model data retrieval error.  
    
    
      });  
    

**Returns:** `Promise`<Model.ModelData>

### getDetails​

getDetails(): Promise<Model.ModelDetails>

This function returns model details.
    
    
    mpSdk.Model.getDetails()  
    
    
      .then(function(modelDetails) {  
    
    
        // Model details retreival complete.  
    
    
        console.log('Model sid:' + modelDetails.sid);  
    
    
        console.log('Model name:' + modelDetails.name);  
    
    
        console.log('Model summary:' + modelDetails.summary);  
    
    
        console.log('Model description:' + modelDetails.description);  
    
    
      })  
    
    
      .catch(function(error) {  
    
    
        // Model details retrieval error.  
    
    
      });  
    

**Returns:** `Promise`<Model.ModelDetails>

  * Types
    * ModelData
    * ModelDetails
  * Enumerations
    * Event
  * Methods
    * getData
    * getDetails



  * Types
    * ModelData
    * ModelDetails
  * Enumerations
    * Event
  * Methods
    * getData
    * getDetails


