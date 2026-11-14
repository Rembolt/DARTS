<!-- source: https://developers.matterport.com/reference/sweep/conversion/ -->

On this page

Functions

  * createIdMap
  * getLabelFromId



## Functions​

### createIdMap​

createIdMap(invert?: boolean): Promise<[Dictionary](/reference/dictionary/)<string>>

Generate a map between v2 IDs and v1 IDs

This method will help with migration between IDs used for sweeps.
    
    
    const mapping = await mpSdk.Sweep.Conversion.createIdMap();  
    

Parameter| Type| invert?| boolean  
If passed, return map of v1->v2 instead  
---|---  
  
**Returns:** `Promise`<[Dictionary](/reference/dictionary/)<string>>

### getLabelFromId​

getLabelFromId(id: string): Promise<string>

Return the label associated with the provided sweep ID

The label is what's displayed for the sweep in the workshop
    
    
    const label = mpSdk.Sweep.Conversion.getLabelFromId('abcdefghijklmno0123456789');  
    

Parameter| Type| id| string  
the sweep ID to look up  
---|---  
  
**Returns:** `Promise`<string>

  * Functions
    * createIdMap
    * getLabelFromId



  * Functions
    * createIdMap
    * getLabelFromId


