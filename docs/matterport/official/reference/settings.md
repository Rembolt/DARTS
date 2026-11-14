<!-- source: https://developers.matterport.com/reference/settings/ -->

On this page

Methods

  * get
  * update



## Methods​

### get​

get(key: string): Promise<any | undefined>

This function returns the value of a setting if it exists, if it does not currently exist, it will return undefined.
    
    
    mpSdk.Settings.get('labels')  
    
    
      .then(function(data) {  
    
    
        // Setting retrieval complete.  
    
    
        console.log('Labels setting: ' + data);  
    
    
      })  
    
    
      .catch(function(error) {  
    
    
        // Setting  retrieval error.  
    
    
      });  
    

Parameter| Type| key| string  
---|---  
  
**Returns:** `Promise`<any | undefined>

### update​

update(key: string, value: any): Promise<void>

This function updates the value of a setting if it exists, returning the new value when it is set
    
    
    mpSdk.Settings.update('labels', false)  
    
    
      .then(function(data) {  
    
    
        // Setting update complete.  
    
    
        console.log('Labels setting: ' + data);  
    
    
      })  
    
    
      .catch(function(error) {  
    
    
        // Setting update error.  
    
    
      });  
    

Parameter| Type| key| string| value| any  
---|---  
  
**Returns:** `Promise`<void>

  * Methods
    * get
    * update



  * Methods
    * get
    * update


