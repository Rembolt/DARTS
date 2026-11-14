<!-- source: https://developers.matterport.com/reference/room/conversion/ -->

On this page

Functions

  * createIdMap



## Functions​

### createIdMap​

createIdMap(invert?: boolean): Promise<[Dictionary](/reference/dictionary/)<string>>

Generate a map between v2 IDs and v1 IDs

This method will help with migration between IDs used for rooms.
    
    
    const mapping = await mpSdk.Room.Conversion.createIdMap();  
    

Parameter| Type| invert?| boolean  
If passed, return map of v1->v2 instead  
---|---  
  
**Returns:** `Promise`<[Dictionary](/reference/dictionary/)<string>>

  * Functions
    * createIdMap



  * Functions
    * createIdMap


