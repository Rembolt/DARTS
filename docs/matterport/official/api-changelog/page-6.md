<!-- source: https://developers.matterport.com/api-changelog/page-6/ -->

On this page

## 2020.11.05​

_November 5, 2020_

### Data Model Changes​

  * Some objects had legacy identifiers which were integer values, switched all objects to use a consistent unique id format.

  * The identifiers for the following objects were updated:

    * AnchorLocation
    * Label
    * Mattertag
    * Measurement
    * PanoramicImageLocation
  * All coordinates that are exposed were updated to use the same coordinate system that is used for the mesh (seen on location objects). This resulted in changing the coordinate system for Measurements and Mattertags. Measurements were in the wrong coordinate system and there was a bug in translating Mattertag coordinates.

  * Convert SDK coordinates to Mesh (API)



    
    
    let api.x = sdk.x  
    
    
    let api.y = invert(sdk.z)  
    
    
    let api.z = sdk.y  
    

  * Convert Mesh (API) coordinates to SDK


    
    
    let sdk.x = api.x  
    
    
    let sdk.y = api.z  
    
    
    let sdk.z = invert(api.y)  
    

  * Mutation patchFloor updated to return ModelFloor instead of Model
  * The Measurement object has been deprecated in favor of MeasurementPath, while old Measurement queries will still be syntactically valid they will return no data.
  * Skybox tile related information has been removed
  * Texture type was changed to quality and type is now a string representing the file format



### API Changes​

  * Added MeasurementPath queries and mutations
  * Added HighlightReel queries and mutations
  * Additional information about placement of photos within a model
  * Exposed information about demo models
  * Added filtering options to several queries
  * Addition of the mp:imagery bundle for purchasing high resolution panoramic images



### Bug Fixes and Other Enhancements​

  * Addition of the mp:imagery bundle for high resolution panoramic images
  * Performance improvements
  * Addition of a sandbox mode for demonstrating the API
  * Dedicated developer settings section



* * *

## 2020.05.28​

_May 28, 2020_

### Breaking Changes​

  * ModelFloor zIndex has been removed
  * Removed attributes from ModelMutator addMattertag and MattertagMutator patch mutations 
    * position - Use anchorPosition instead
    * stemDirection - Use stemNormal and stemLength instead



### API Changes​

  * Added attributes to ModelFloor (Query) 
    * meshId: int (read-only) - The vision generated ID for the floor.
    * classification: string (read-only) - The capture generated label for the floor. This is initially used to populate the label field, but the label field may be modified by public clients, whereas this will maintain the initial value.
  * Added attributes to Mattertag (query & mutation) 
    * roomId: ID - The room that the Mattertag is in. This is not spatially validated by the API, just checks that the requested room exists.
  * Removed attributes from ModelMutator Mattertag mutations



* * *

  * 2020.11.05
    * Data Model Changes
    * API Changes
    * Bug Fixes and Other Enhancements
  * 2020.05.28
    * Breaking Changes
    * API Changes


