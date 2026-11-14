<!-- source: https://developers.matterport.com/reference/asset/ -->

On this page

Methods

  * registerTexture



## Methods​

### registerTexture​

registerTexture(id: string, iconSrc: string): Promise<void>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

Register a texture to use with subsequent calls like [`Tag.editIcon`](/reference/tag/#editicon).

**Note** : It is recommended to host your own images to mitigate cross origin limitations.
    
    
    mpSdk.Asset.registerTexture('customTextureId', 'https://[link.to/image]');  
    

Parameter| Type| id| string  
A user specified string to use as a lookup of this texture| iconSrc| string  
The src of the icon, like the src of an <img>  
---|---  
  
**Returns:** `Promise`<void>

  * Methods
    * registerTexture



  * Methods
    * registerTexture


