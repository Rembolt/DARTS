<!-- source: https://developers.matterport.com/reference/pointer/ -->

On this page

Types

  * FadeInProps
  * FadeOutProps
  * FadeProps
  * Intersection



Enumerations

  * Colliders



Observables

  * intersection



Methods

  * editTexture
  * registerTexture
  * resetTexture
  * setFadeProps
  * setVisible



## Types​

### FadeInProps​

FadeInProps: _object_

Property| Type| duration?| number | undefined  
Duration in milliseconds. Default is 300.  
---|---  
  
### FadeOutProps​

FadeOutProps: _object_

Property| Type| delay?| number | undefined  
Delay in milliseconds. Default is 700.| duration?| number | undefined  
Duration in milliseconds. Default is 700.  
---|---  
  
### FadeProps​

FadeProps: _object_

Pointer reticle fade properties.

Property| Type| fadeIn?| Pointer.FadeInProps | undefined| fadeOut?| Pointer.FadeOutProps | undefined  
---|---  
  
### Intersection​

Intersection: _object_

Property| Type| floorId| number | undefined| floorIndex| number | undefined  
floorIndex is only defined when the intersected object is MODEL.| normal| [Vector3](/reference/#type-vector3)| object| Pointer.Colliders| position| [Vector3](/reference/#type-vector3)  
---|---  
  
## Enumerations​

### Colliders​

Colliders: _enum_

Member| Value| MODEL| "intersectedobject.model"| NONE| "intersectedobject.none"| SWEEP| "intersectedobject.sweep"| TAG| "intersectedobject.tag"| UNKNOWN| "intersectedobject.unknown"  
---|---  
  
## Observables​

### intersection​

intersection: [IObservable](/reference/iobservable/)<Pointer.Intersection>

An observable intersection data object that can be subscribed to.
    
    
    mpSdk.Pointer.intersection.subscribe(function (intersectionData) {  
    
    
     // Changes to the intersection data have occurred.  
    
    
     console.log('Intersection position:', intersectionData.position);  
    
    
     console.log('Intersection normal:', intersectionData.normal);  
    
    
    });  
    

## Methods​

### editTexture​

editTexture(textureId: string): Promise<void>

Bundle Embed

_Introduced 3.1.55.2-34-ga9934ccd93_

Change the texture of the pointer reticle.
    
    
    await mpSdk.Asset.registerTexture('customTextureId', 'https://[link.to/image]');  
    
    
      
    
    
    // change the texture of the pointer reticle using a previously registered id.  
    
    
    await mpSdk.Pointer.editTexture('customTextureId');  
    

Parameter| Type| textureId| string  
The id of the texture to apply.  
---|---  
  
**Returns:** `Promise`<void>

### registerTexture​

registerTexture(textureId: string, textureSrc: string): Promise<void>

deprecated Use [`Asset.registerTexture`](/reference/asset/#registertexture) to register new textures instead.

_Introduced 3.1.55.2-34-ga9934ccd93_

3.1.55.2-34-ga9934ccd93

Parameter| Type| textureId| string| textureSrc| string  
---|---  
  
**Returns:** `Promise`<void>

### resetTexture​

resetTexture(): Promise<void>

Bundle Embed

_Introduced 3.1.55.2-34-ga9934ccd93_

Resets the pointer reticle texture to the original texture.
    
    
    await mpSdk.Pointer.resetTexture();  
    

**Returns:** `Promise`<void>

### setFadeProps​

setFadeProps(props: Pointer.FadeProps): Promise<void>

Bundle Embed

_Introduced 3.1.55.2-34-ga9934ccd93_

Customizes the fade in/out behavior of the pointer reticle.

Parameter| Type| props| Pointer.FadeProps  
face properties  
---|---  
  
**Returns:** `Promise`<void>

### setVisible​

setVisible(visible: boolean): Promise<void>

Bundle Embed

_Introduced 3.1.55.2-34-ga9934ccd93_

This function controls the visibility of the pointer reticle.

Parameter| Type| visible| boolean  
pointer reticle visibility  
---|---  
  
**Returns:** `Promise`<void>

  * Types
    * FadeInProps
    * FadeOutProps
    * FadeProps
    * Intersection
  * Enumerations
    * Colliders
  * Observables
    * intersection
  * Methods
    * editTexture
    * registerTexture
    * resetTexture
    * setFadeProps
    * setVisible



  * Types
    * FadeInProps
    * FadeOutProps
    * FadeProps
    * Intersection
  * Enumerations
    * Colliders
  * Observables
    * intersection
  * Methods
    * editTexture
    * registerTexture
    * resetTexture
    * setFadeProps
    * setVisible


