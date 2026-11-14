<!-- source: https://developers.matterport.com/reference/mattertag/ -->

On this page

Interfaces

  * [DescriptionChunk](/reference/mattertag/descriptionchunk/)
  * [IMessenger](/reference/mattertag/imessenger/)
  * [Link](/reference/mattertag/link/)
  * [MattertagDescriptor](/reference/mattertag/mattertagdescriptor/)
  * [PositionOptions](/reference/mattertag/positionoptions/)



Types

  * EditableProperties
  * GlobalVariableMap
  * InjectionOptions
  * MattertagData
  * ObservableMattertagData
  * PreventableActions



Enumerations

  * DescriptionChunkType
  * Event
  * LinkType
  * MediaType
  * Transition



Observables

  * data



Methods

  * add
  * editBillboard
  * editColor
  * editIcon
  * editOpacity
  * editPosition
  * editStem
  * getData
  * getDiscPosition
  * injectHTML
  * navigateToTag
  * preventAction
  * registerIcon
  * remove
  * resetIcon



## Types​

### EditableProperties​

EditableProperties: _object_

Property| Type| description| string| label| string| media| { type: Mattertag.MediaType; src: string; }  
---|---  
  
### GlobalVariableMap​

GlobalVariableMap: _object_

Map the globals we provide in your sandbox to other names.

Property| Type| off?| string | undefined| on?| string | undefined| send?| string | undefined| tag?| string | undefined  
---|---  
  
### InjectionOptions​

InjectionOptions: _object_

Options that can be specified when injection custom HTML into a Mattertag.

Property| Type| globalVariableMap?| Mattertag.GlobalVariableMap | undefined  
A map for the global functions and variables we provide in your iframe sandbox. Only needs to be used if scripts you are importing also have a global send, on, off, or tag.| size?| [Size](/reference/#type-size) | undefined  
The size of the frame to create| windowPath?| string | undefined  
---|---  
  
### MattertagData​

MattertagData: _object_

Property| Type| anchorNormal| [Vector3](/reference/#type-vector3)| anchorPosition| [Vector3](/reference/#type-vector3)  
The world space position of the mattertag anchor within the model| color| [Color](/reference/#type-color)| description| string| enabled| boolean| floorId| number| floorIndex| number| floorInfo| { id: string; sequence: number; }| label| string| media| { type: Mattertag.MediaType; src: string; }| mediaSrc| string| mediaType| Mattertag.MediaType| parsedDescription| [Mattertag.DescriptionChunk](/reference/mattertag/descriptionchunk/)[]| sid| string| stemHeight| number| stemVector| [Vector3](/reference/#type-vector3)  
The world space (non-normal) direction of the mattertag's stem| stemVisible| boolean  
---|---  
  
### ObservableMattertagData​

ObservableMattertagData: _object_

Property| Type| anchorPosition| [Vector3](/reference/#type-vector3)  
The world space position of the mattertag anchor within the model| color| [Color](/reference/#type-color)| description| string| enabled| boolean| floorIndex| number| floorInfo| { id: string; sequence: number; }| label| string| media| { type: Mattertag.MediaType; src: string; }| sid| string| stemVector| [Vector3](/reference/#type-vector3)  
The world space (non-normal) direction of the mattertag's stem| stemVisible| boolean  
---|---  
  
### PreventableActions​

PreventableActions: _object_

Property| Type| navigating| boolean| opening| boolean  
---|---  
  
## Enumerations​

### DescriptionChunkType​

DescriptionChunkType: _enum_

Member| Value| LINK| "tag.chunk.link"| NONE| "tag.chunk.none"| TEXT| "tag.chunk.text"  
---|---  
  
### Event​

Event: _enum_

Member| Value| CLICK| "tag.click"| HOVER| "tag.hover"| LINK_OPEN| "tag.linkopen"  
---|---  
  
### LinkType​

LinkType: _enum_

Member| Value| EXT_LINK| "tag.link.ext"  
An external link| MODEL| "tag.link.model"  
A link to a different Matterport model| NAVIGATION| "tag.link.nav"  
A link to another position in the current model  
---|---  
  
### MediaType​

MediaType: _enum_

Member| Value| NONE| "mattertag.media.none"| PHOTO| "mattertag.media.photo"| RICH| "mattertag.media.rich"| VIDEO| "mattertag.media.video"  
---|---  
  
### Transition​

Transition: _enum_

Transition types for camera movements. This is the canonical transition type enum. Used for [`Mode.moveTo`](/reference/mode/#moveto), [`Sweep.moveTo`](/reference/sweep/#moveto), `Mattertag.navigateToTag`, and other camera movement methods. Note: not all values are supported, refer to per-method documentation for details.

See [Camera.TransitionType](/reference/camera/#enum-transitiontype)

Member| Value| FADEOUT| "transition.fade"  
Fade to black transition| FLY| "transition.fly"  
Fly transition| INSTANT| "transition.instant"  
Instant transition| MOVEFADE| "transition.movefade"  
experimental Move with fade transition| ORBIT| "transition.orbit"  
experimental Orbit transition  
---|---  
  
## Observables​

### data​

data: [IObservableMap](/reference/iobservablemap/)<Mattertag.ObservableMattertagData>

deprecated Use [`Tag.data`](/reference/tag/#data) instead

An observable collection of Mattertag data that can be subscribed to.

## Methods​

### add​

add(newTagData: [Mattertag.MattertagDescriptor](/reference/mattertag/mattertagdescriptor/) | [Mattertag.MattertagDescriptor](/reference/mattertag/mattertagdescriptor/)[]): Promise<string[]>

deprecated Use [`Tag.add`](/reference/tag/#add) instead

Add one or more Mattertags to Showcase. Each input Mattertag supports setting the label, description, color, anchorPosition, and stemVector.

Two properties are required:

  * `anchorPosition`, the point where the tag connects to the model
  * `stemVector`, the direction, aka normal, and height that the Mattertag stem points



See [`Pointer.intersection`](/reference/pointer/#intersection) for a way to retrive a new `anchorPosition` and `stemVector`.

**Note** : these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session.

Parameter| Type| newTagData| [Mattertag.MattertagDescriptor](/reference/mattertag/mattertagdescriptor/) | [Mattertag.MattertagDescriptor](/reference/mattertag/mattertagdescriptor/)[]  
A single or array of Mattertag templates to add.  
---|---  
  
**Returns:** `Promise`<string[]>

A promise that resolves with the sids for the newly added Mattertags.

### editBillboard​

editBillboard(tagSid: string, properties: Partial<Mattertag.EditableProperties>): Promise<void>

deprecated Use [`Tag.editBillboard`](/reference/tag/#editbillboard) or [`Tag.registerAttachment`](/reference/tag/#registerattachment) and/or [`Tag.attach`](/reference/tag/#attach) to manage media

Edit the data in a Mattertag billboard.

**Note** : these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session.

Parameter| Type| tagSid| string  
the sid of the Mattertag to edit| properties| Partial<Mattertag.EditableProperties>  
A dictionary of properties to set  
---|---  
  
**Returns:** `Promise`<void>

### editColor​

editColor(tagSid: string, color: [Color](/reference/#type-color)): Promise<void>

deprecated Use [`Tag.editColor`](/reference/tag/#editcolor) instead

Edit the color of a Mattertag

Parameter| Type| tagSid| string  
The sid of the Mattertag to edit| color| [Color](/reference/#type-color)  
The new color to be applied to the Mattertag disc  
---|---  
  
**Returns:** `Promise`<void>

### editIcon​

editIcon(tagSid: string, iconId: string): Promise<void>

deprecated Use [`Tag.editIcon`](/reference/tag/#editicon) instead

Change the icon of the Mattertag disc

**Note** : these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session.

Parameter| Type| tagSid| string  
The sid of the Mattertag to edit| iconId| string  
The id of the icon to apply  
---|---  
  
**Returns:** `Promise`<void>

**Errors** Warns if the provided `iconSrc` is an .svg file which doesn't have a `'width'` or `'height'` attribute. Defaults to a resolution of 128x128 if neither exist.

### editOpacity​

editOpacity(tagSid: string, opacity: number): Promise<void>

deprecated Use [`Tag.editOpacity`](/reference/tag/#editopacity) instead

Edit the opacity of a Mattertag

Parameter| Type| tagSid| string  
The sid of the Mattertag to edit| opacity| number  
The target opacity for the Mattertag in the range of [0, 1]  
---|---  
  
**Returns:** `Promise`<void>

### editPosition​

editPosition(tagSid: string, moveOptions: Partial<[Mattertag.PositionOptions](/reference/mattertag/positionoptions/)>): Promise<void>

deprecated Use [`Tag.editPosition`](/reference/tag/#editposition) instead

Move and reorient a Mattertag.

See [`Pointer.intersection`](/reference/pointer/#intersection) for a way to retrieve a new `anchorPosition` and `stemVector`.

**Note** : these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session.

Parameter| Type| tagSid| string  
The sid of the Mattertag to reposition| moveOptions| Partial<[Mattertag.PositionOptions](/reference/mattertag/positionoptions/)>  
The new anchorPosition, stemVector and/or floorId.  
---|---  
  
**Returns:** `Promise`<void>

### editStem​

editStem(tagSid: string, options: { stemHeight?: number; stemVisible?: boolean; }): Promise<void>

deprecated Use [`Tag.editStem`](/reference/tag/#editstem) instead

_Introduced 3.1.70.10-0-ge9cb83b28c_

Edit the stem of a Mattertag

Parameter| Type| tagSid| string  
The sid of the Mattertag to edit| options| { stemHeight?: number; stemVisible?: boolean; }  
What to change about the Mattertag's stem - can include stemHeight and stemVisible  
---|---  
  
**Returns:** `Promise`<void>

### getData​

getData(): Promise<Mattertag.MattertagData[]>

deprecated Use [`Tag.data`](/reference/tag/#data) instead

This function returns metadata on the collection of Mattertags.

**Returns:** `Promise`<Mattertag.MattertagData[]>

### getDiscPosition​

getDiscPosition(tag: Mattertag.MattertagData | Mattertag.ObservableMattertagData, result?: [Vector3](/reference/#type-vector3)): [Vector3](/reference/#type-vector3)

deprecated Disc position is automatially included in [`Tag.data`](/reference/tag/#data)

Get the disc's (3d) position of a Mattertag.

Parameter| Type| tag| Mattertag.MattertagData | Mattertag.ObservableMattertagData| result?| [Vector3](/reference/#type-vector3)  
---|---  
  
**Returns:** [Vector3](/reference/#type-vector3)

### injectHTML​

injectHTML(tagSid: string, html: string, options: Mattertag.InjectionOptions): Promise<[Mattertag.IMessenger](/reference/mattertag/imessenger/)>

deprecated Use [`Tag.registerSandbox`](/reference/tag/#registersandbox) and [`Tag.attach`](/reference/tag/#attach) instead

Add a custom frame that can host custom HTML and JavaScript, and communicate bi-directionally with your page.

The frame that contains your custom code will have certain limitations due to being sandboxed by the `sandbox='allow-scripts` attribute. Attempting to access properties of other windows will also be blocked by the browser. ([see the MDN pages about iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe))

Currently, the HTML CAN ONLY BE SET ONCE by a call to `injectHTML`. This includes removing or clearing the HTML.

Parameter| Type| tagSid| string| html| string| options| Mattertag.InjectionOptions  
---|---  
  
**Returns:** `Promise`<[Mattertag.IMessenger](/reference/mattertag/imessenger/)>

### navigateToTag​

navigateToTag(tagSid: string, transition: Mattertag.Transition, force?: boolean): Promise<string>

This function navigates to the Mattertag disc with the provided sid, opening the billboard on arrival.
    
    
    mpSdk.Mattertag.navigateToTag(sid, mpSdk.Camera.Transition.FLY);  
    

Parameter| Type| tagSid| string  
The sid of the Mattertag to navigate to| transition| Mattertag.Transition  
The type of transition to navigate to a sweep where the Mattertag disc is visible| force?| boolean  
If navigating to the tag is disabled, passing force === true will force the transition to occur  
---|---  
  
**Returns:** `Promise`<string>

### preventAction​

preventAction(tagSid: string, actions: Partial<Mattertag.PreventableActions>): Promise<void>

deprecated Use [`Tag.allowAction`](/reference/tag/#allowaction) instead

Prevents the "default" Showcase action on a Mattertag from occurring: hover to open billboard, click to navigate to view.

Parameter| Type| tagSid| string  
The sid of the Mattertag to remove actions from| actions| Partial<Mattertag.PreventableActions>  
The set of actions to prevent  
---|---  
  
**Returns:** `Promise`<void>

### registerIcon​

registerIcon(iconId: string, iconSrc: string): Promise<void>

deprecated Use [`Asset.registerTexture`](/reference/asset/#registertexture) instead

Register an icon to use with subsequent `Mattertag.editIcon` calls.

**Note** : It is recommended to host your own images to mitigate cross origin limitations.

Parameter| Type| iconId| string  
A user specified string to use as a lookup of this icon| iconSrc| string  
The src of the icon, like the src of an <img>  
---|---  
  
**Returns:** `Promise`<void>

### remove​

remove(tagSids: string | string[]): Promise<string[]>

deprecated Use [`Tag.remove`](/reference/tag/#remove) instead

Removes one or more Mattertags from Showcase.

**Note** : these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session.

Parameter| Type| tagSids| string | string[]  
A single Mattertag sid or array of Mattertag sids to remove.  
---|---  
  
**Returns:** `Promise`<string[]>

A promise with an array of Mattertag sids that were actually removed.

### resetIcon​

resetIcon(tagSid: string): Promise<void>

deprecated Use [`Tag.resetIcon`](/reference/tag/#reseticon) instead

Resets the icon of the Mattertag disc back to its original icon.

Parameter| Type| tagSid| string  
The sid of the Mattertag to reset  
---|---  
  
**Returns:** `Promise`<void>

  * Interfaces
    * [DescriptionChunk](/reference/mattertag/descriptionchunk/)
    * [IMessenger](/reference/mattertag/imessenger/)
    * [Link](/reference/mattertag/link/)
    * [MattertagDescriptor](/reference/mattertag/mattertagdescriptor/)
    * [PositionOptions](/reference/mattertag/positionoptions/)
  * Types
    * EditableProperties
    * GlobalVariableMap
    * InjectionOptions
    * MattertagData
    * ObservableMattertagData
    * PreventableActions
  * Enumerations
    * DescriptionChunkType
    * Event
    * LinkType
    * MediaType
    * Transition
  * Observables
    * data
  * Methods
    * add
    * editBillboard
    * editColor
    * editIcon
    * editOpacity
    * editPosition
    * editStem
    * getData
    * getDiscPosition
    * injectHTML
    * navigateToTag
    * preventAction
    * registerIcon
    * remove
    * resetIcon



  * Types
    * EditableProperties
    * GlobalVariableMap
    * InjectionOptions
    * MattertagData
    * ObservableMattertagData
    * PreventableActions
  * Enumerations
    * DescriptionChunkType
    * Event
    * LinkType
    * MediaType
    * Transition
  * Observables
    * data
  * Methods
    * add
    * editBillboard
    * editColor
    * editIcon
    * editOpacity
    * editPosition
    * editStem
    * getData
    * getDiscPosition
    * injectHTML
    * navigateToTag
    * preventAction
    * registerIcon
    * remove
    * resetIcon


