<!-- source: https://developers.matterport.com/reference/tag/ -->

On this page

Interfaces

  * [IMessenger](/reference/tag/imessenger/)



Types

  * AllowableActions
  * Attachment
  * Descriptor
  * EditableProperties
  * EditPositionDescriptor
  * GlobalVariableMap
  * OpenOptions
  * OpenTags
  * PositionOptions
  * SandboxOptions
  * StemHeightEditOptions
  * TagData



Enumerations

  * AttachmentType



Observables

  * attachments
  * data
  * openTags



Methods

  * add
  * allowAction
  * attach
  * close
  * detach
  * dock
  * editBillboard
  * editColor
  * editIcon
  * editOpacity
  * editPosition
  * editPositions
  * editStem
  * open
  * registerAttachment
  * registerSandbox
  * remove
  * resetIcon
  * toggleDocking
  * toggleNavControls
  * toggleSharing



## Types​

### AllowableActions​

AllowableActions: _object_

The actions that can be taken when interacting with a tag

Property| Type| docking| boolean  
Whether the tag can be docked| navigating| boolean  
Whether navigation towared the tag will occur when clicked| opening| boolean  
Whether the tag can be opened via a mouse hover| sharing| boolean  
Whether the tag has a share button  
---|---  
  
### Attachment​

Attachment: _object_

Things such as media, etc that can be attached to a Tag. Attachments are the new equivalent to Media in Mattertags.

Property| Type| id| string| src| string| type| Tag.AttachmentType  
---|---  
  
### Descriptor​

Descriptor: _object_

A subset of the TagData used when adding Tags. Most properties are optional except those used for positioning: `anchorPosition`, `stemVector`.

See `Tag.TagData` for further descriptions of these properties.

Property| Type| anchorPosition| [Vector3](/reference/#type-vector3)| attachments?| string[] | undefined| color?| [Color](/reference/#type-color) | undefined| description?| string | undefined| enabled?| boolean | undefined| iconId?| string | undefined| id?| string | undefined| keywords?| string[] | undefined| label?| string | undefined| opacity?| number | undefined| stemVector| [Vector3](/reference/#type-vector3)| stemVisible?| boolean | undefined  
---|---  
  
### EditableProperties​

EditableProperties: _object_

Property| Type| description| string| label| string  
---|---  
  
### EditPositionDescriptor​

EditPositionDescriptor: _object_

Property| Type| id| string| options| Partial<Tag.PositionOptions>  
---|---  
  
### GlobalVariableMap​

GlobalVariableMap: _object_

Map the globals we provide in your sandbox to other names.

Property| Type| docked?| string | undefined| off?| string | undefined| on?| string | undefined| send?| string | undefined| tag?| string | undefined  
---|---  
  
### OpenOptions​

OpenOptions: _object_

Property| Type| force| boolean  
Force the tag open regardless of whether its allowed from previous calls to Tag.allowAction  
---|---  
  
### OpenTags​

OpenTags: _object_

Property| Type| docked| string | null  
The id of the tag that is currently docked.| hovered| string | null  
The id of the tag that is currently being previewed or hovered over.| selected| Set<string>  
The set of ids of tags that are currently "stuck" open like from a click action. Currently, this is limited to just one tag.  
---|---  
  
### PositionOptions​

PositionOptions: _object_

Property| Type| anchorPosition| [Vector3](/reference/#type-vector3)| roomId| string| stemVector| [Vector3](/reference/#type-vector3)  
---|---  
  
### SandboxOptions​

SandboxOptions: _object_

Property| Type| globalVariableMap| Tag.GlobalVariableMap  
A map for the three global functions we provide in your sandbox. Only needs to be used if scripts you are importing also have a global send, on, off, tag, or docked.| name| string  
A human readable name that will be used as the src in the attachments collection.| size| [Size](/reference/#type-size)  
The size of the sandbox to display Providing 0 as one of the dimensions will instead use the default: 150px for height, 100% for width.  
---|---  
  
### StemHeightEditOptions​

StemHeightEditOptions: _object_

Property| Type| stemHeight| number| stemVisible| boolean  
---|---  
  
### TagData​

TagData: _object_

Property| Type| anchorPosition| [Vector3](/reference/#type-vector3)| attachments| string[]  
The ids of the attachments currently attached to this tag| color| [Color](/reference/#type-color)| description| string| discPosition| [Vector3](/reference/#type-vector3)| enabled| boolean  
Whether this tag is visible and accepts input. Modifying this value will toggle the tag's visibility and input handlers, and notify any existing observables.| fontId| string  
Read-only Font Awesome id for icons set in workshop, e.g. "face-grin-tongue-squint"| iconId| string  
The icon id for the tag, for use with Tag.editIcon| id| string| keywords| string[]  
The keywords associated with this Tag. Modifying the contents of this array will automatically sync updates to the tag and notify any existing observables.| label| string| roomId| string| stemHeight| number| stemVector| [Vector3](/reference/#type-vector3)| stemVisible| boolean  
---|---  
  
## Enumerations​

### AttachmentType​

AttachmentType: _enum_

Member| Value| IMAGE| "tag.attachment.image"  
Image files (e.g., JPEG, PNG, GIF).| PDF| "tag.attachment.pdf"  
PDF documents.| RICH| "tag.attachment.rich"  
Rich embedded content (e.g., YouTube, Vimeo). Rendered via oEmbed.| SANDBOX| "tag.attachment.sandbox"  
Custom HTML/script sandbox created via [`Tag.registerSandbox`](#registersandbox). | UNKNOWN| "tag.attachment.unknown"  
Unresolved attachment type. Used for attachments until oEmbed resolves the actual type.| VIDEO| "tag.attachment.video"  
Video embeds (e.g., YouTube, Vimeo).| ZIP| "tag.attachment.zip"  
Archive files (e.g., ZIP). Supported for file uploads only.  
---|---  
  
## Observables​

### attachments​

attachments: [IObservableMap](/reference/iobservablemap/)<Tag.Attachment>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

An observable collection of the `Attachment`.
    
    
    mpSdk.Tag.attachments.subscribe({  
    
    
      onAdded: function (index, item, collection) {  
    
    
        console.log('An attachment was added to the collection', index, item, collection);  
    
    
      },  
    
    
      onCollectionUpdated(collection) {  
    
    
        console.log('The entire collection of attachments', collection);  
    
    
      },  
    
    
    });  
    

### data​

data: [IObservableMap](/reference/iobservablemap/)<Tag.TagData>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

An observable collection of Tag data that can be subscribed to.

When first subscribing, the current set of Tags will call the observer's `onAdded` for each Tag as the data becomes available.
    
    
    mpSdk.Tag.data.subscribe({  
    
    
      onAdded(index, item, collection) {  
    
    
        console.log('Tag added to the collection', index, item, collection);  
    
    
      },  
    
    
      onRemoved(index, item, collection) {  
    
    
        console.log('Tag removed from the collection', index, item, collection);  
    
    
      },  
    
    
      onUpdated(index, item, collection) {  
    
    
        console.log('Tag updated in place in the collection', index, item, collection);  
    
    
      },  
    
    
      onCollectionUpdated(collection) {  
    
    
        console.log('The full collection of Tags looks like', collection);  
    
    
      }  
    
    
    });  
    

### openTags​

openTags: [IObservable](/reference/iobservable/)<Tag.OpenTags>

Bundle Embed

_Introduced 23.2.1_

An observable state of that tags that are hovered, selected, or docked. A Tag can be in all three states at once. A docked tag is also always considered selected.
    
    
    mpSdk.Tag.openTags.subscribe({  
    
    
      prevState: {  
    
    
        hovered: null,  
    
    
        docked: null,  
    
    
        selected: null,  
    
    
      },  
    
    
      onChanged(newState) {  
    
    
        if (newState.hovered !== this.prevState.hovered) {  
    
    
          if (newState.hovered) {  
    
    
            console.log(newState.hovered, 'was hovered');  
    
    
          } else {  
    
    
            console.log(this.prevState.hovered, 'is no longer hovered');  
    
    
          }  
    
    
        }  
    
    
        if (newState.docked !== this.prevState.docked) {  
    
    
          if (newState.docked) {  
    
    
            console.log(newState.docked, 'was docked');  
    
    
          } else {  
    
    
            console.log(this.prevState.docked, 'was undocked');  
    
    
          }  
    
    
        }  
    
    
      
    
    
        // only compare the first 'selected' since only one tag is currently supported  
    
    
        const [selected = null] = newState.selected; // destructure and coerce the first Set element to null  
    
    
        if (selected !== this.prevState.selected) {  
    
    
            if (selected) {  
    
    
                console.log(selected, 'was selected');  
    
    
            } else {  
    
    
                console.log(this.prevState.selected, 'was deselected');  
    
    
            }  
    
    
        }  
    
    
      
    
    
        // clone and store the new state  
    
    
        this.prevState = {  
    
    
          ...newState,  
    
    
          selected,  
    
    
        };  
    
    
      },  
    
    
    });  
    

## Methods​

### add​

add(tags: Tag.Descriptor[]): Promise<string[]>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

Add one or more Tags to Showcase. Each input Tag supports setting the label, description, color or icon, anchorPosition, stemVector, and attachments.

Two properties are required:

  * `anchorPosition`, the point where the tag connects to the model
  * `stemVector`, the direction, aka normal, and height that the Tag stem points



See [`Pointer.intersection`](/reference/pointer/#intersection) for a way to retrieve a new `anchorPosition` and `stemVector`.

**Note** : these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session. They also do not have "share" buttons as they associated with them.
    
    
    mpSdk.Tag.add({  
    
    
     label: 'New tag',  
    
    
     description: 'This tag was added through the Matterport SDK',  
    
    
     anchorPosition: {  
    
    
       x: 0,  
    
    
       y: 0,  
    
    
       z: 0,  
    
    
     },  
    
    
     stemVector: { // make the Tag stick straight up and make it 0.30 meters (~1 foot) tall  
    
    
       x: 0,  
    
    
       y: 0.30,  
    
    
       z: 0,  
    
    
     },  
    
    
     color: { // blue disc  
    
    
       r: 0.0,  
    
    
       g: 0.0,  
    
    
       b: 1.0,  
    
    
     },  
    
    
    }, {  
    
    
     label: 'New tag 2',  
    
    
     anchorPosition: {  
    
    
       x: 1,  
    
    
       y: 2,  
    
    
       z: 3,  
    
    
     },  
    
    
     stemVector: {  
    
    
       x: ,  
    
    
       y: ,  
    
    
       z: ,  
    
    
     }  
    
    
    });  
    

Parameter| Type| tags| Tag.Descriptor[]  
The descriptors for all Tags to be added.  
---|---  
  
**Returns:** `Promise`<string[]>

A promise that resolves with the array of ids for the newly added Tags.

### allowAction​

allowAction(id: string, actions: Partial<Tag.AllowableActions>): Promise<void>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

Sets the allowed "default" Showcase actions on a Tag from occurring: hover to open billboard, click to navigate to view. If an action is ommited from the actions argument, it will be considered false by default.
    
    
    const tagIds: string[]; // ... acquired through previous calls to `mpSdk.Tag.add` or through `mpSdk.Tag.data`  
    
    
      
    
    
    // prevent navigating to the tag on click  
    
    
    const noNavigationTag = tagIds[0];  
    
    
    mpSdk.Tag.allowAction(noNavigationTag, {  
    
    
      opening: true,  
    
    
      // implies navigating: false, etc  
    
    
    });  
    
    
      
    
    
    // prevent the billboard from showing  
    
    
    const noBillboardTag = tagIds[1];  
    
    
    mpSdk.Tag.allowAction(noBillboardTag, {  
    
    
      navigating: true,  
    
    
      // implies opening: false, etc  
    
    
    });  
    
    
      
    
    
    const noActionsTag = tagIds[2];  
    
    
    mpSdk.Tag.allowAction(noActionsTag, {  
    
    
      // implies opening: false and navigating: false, etc  
    
    
    });  
    

Parameter| Type| id| string  
The id of the Tag to change the allowed actions| actions| Partial<Tag.AllowableActions>  
The set of actions allowed on the Tag  
---|---  
  
**Returns:** `Promise`<void>

### attach​

attach(tagId: string, attachmentIds: string[]): Promise<void>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

Attach `Attachment` to a Tag.
    
    
    const tagId: string; // ... acquired through a previous call to `mpSdk.Tag.add` or through `mpSdk.Tag.data`  
    
    
    const attachmentIds: string[]; // ... acquired through a previous call to `mpSdk.Tag.registerAttachment` or through `mpSdk.Tag.attachments`  
    
    
      
    
    
    mpSdk.Tag.attach(tagId, ...attachmentIds);  
    
    
    // or  
    
    
    mpSdk.Tag.attach(tagId, attachmentId[0], attachmentId[1]);  
    

Parameter| Type| tagId| string  
The id of the Tag to attach to| attachmentIds| string[]  
The ids of the Attachments to attach  
---|---  
  
**Returns:** `Promise`<void>

A promise that resolves when the Attachment is added to the Tag

### close​

close(id: string): Promise<void>

Bundle Embed

_Introduced 23.2.1_

Close a tag and its billboard or dock.
    
    
    const tagId: string; // ... acquired through previous calls to `mpSdk.Tag.add` or through `mpSdk.Tag.data`  
    
    
    mpSdk.Tag.open(tagId);  
    
    
    mpSdk.Tag.close(tagId);  
    

Parameter| Type| id| string  
the id of the Tag to close  
---|---  
  
**Returns:** `Promise`<void>

### detach​

detach(tagId: string, attachmentIds: string[]): Promise<void>

Bundle Embed

_Introduced 3.1.70.10-0-ge9cb83b28c_

Detach `Attachment` from a Tag.
    
    
    const tagId: string; // ... acquired through a previous call to `mpSdk.Tag.add` or through `mpSdk.Tag.data`  
    
    
    const attachmentIds: string[]; // ... acquired through a previous call to `mpSdk.Tag.registerAttachment` or through `mpSdk.Tag.attachments`  
    
    
      
    
    
    mpSdk.Tag.detach(tagId, ...attachmentIds);  
    
    
    // or  
    
    
    mpSdk.Tag.detach(tagId, attachmentId[0], attachmentId[1]);  
    

Parameter| Type| tagId| string  
the id of the Tag to detach from| attachmentIds| string[]  
the ids of the Attachments to detach  
---|---  
  
**Returns:** `Promise`<void>

### dock​

dock(id: string, options?: Partial<Tag.OpenOptions>): Promise<void>

Bundle Embed

_Introduced 23.2.1_

Open a tag in the docked view.
    
    
    const tagId: string; // ... acquired through previous calls to `mpSdk.Tag.add` or through `mpSdk.Tag.data`  
    
    
    mpSdk.Tag.dock(tagId);  
    

Parameter| Type| id| string  
the id of the Tag to dock| options?| Partial<Tag.OpenOptions>  
optional settings such as forcing the tag open  
---|---  
  
**Returns:** `Promise`<void>

### editBillboard​

editBillboard(id: string, properties: Partial<Tag.EditableProperties>): Promise<void>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

Edit the text content in a Tag's billboard.

**Note** : these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session.
    
    
    mpSdk.Tag.editBillboard(id, {  
    
    
      label: 'This is a new title',  
    
    
      description: 'This image was set dynamically by the Showcase sdk',  
    
    
    });  
    

Parameter| Type| id| string  
the id of the Tag to edit| properties| Partial<Tag.EditableProperties>  
A dictionary of properties to set  
---|---  
  
**Returns:** `Promise`<void>

### editColor​

editColor(id: string, color: [Color](/reference/#type-color)): Promise<void>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

Edit the color of a Tag's disc.
    
    
    const tagIds: string[]; // ... acquired through previous calls to `mpSdk.Tag.add` or through `mpSdk.Tag.data`  
    
    
      
    
    
    // change the first Tag to yellow  
    
    
    mpSdk.Tag.editColor(tagIds[0], {  
    
    
      r: 0.9,  
    
    
      g: 0,  
    
    
      b: 0.9,  
    
    
    });  
    

Parameter| Type| id| string  
The id of the Tag to edit| color| [Color](/reference/#type-color)  
The new color to be applied to the Tag disc  
---|---  
  
**Returns:** `Promise`<void>

### editIcon​

editIcon(tagId: string, iconId: string): Promise<void>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

Change the icon of the Tag disc. Icons can be registered asset textures or font ids provided by the player. Supported font ids can be found at <https://matterport.github.io/showcase-sdk/tags_icons_reference.html>.

**Note** : these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session.
    
    
    // change the icon of the Tag using the id used in a previous `Asset.registerTexture` call  
    
    
    mpSdk.Tag.editIcon(id, 'customIconId');  
    
    
    
    // change the icon of the Tag to a font id.  
    
    
    mpSdk.Tag.editIcon(id, 'public_buildings_apartment');  
    

Parameter| Type| tagId| string  
The id of the Tag to edit| iconId| string  
The id of the icon to apply  
---|---  
  
**Returns:** `Promise`<void>

### editOpacity​

editOpacity(id: string, opacity: number): Promise<void>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

Edit the opacity of a Tag.

A completely transparent/invisible Tag is still interactable and will respond to mouse hovers and clicks.
    
    
    const tagIds: string[]; // ... acquired through previous calls to `mpSdk.Tag.add` or through `mpSdk.Tag.data`  
    
    
    // make the first Tag invisible  
    
    
    mpSdk.Tag.editOpacity(tagIds[0], 0);  
    
    
      
    
    
    // make another Tag transparent  
    
    
    mpSdk.Tag.editOpacity(tagIds[1], 0.5);  
    
    
      
    
    
    // and another completely opaque  
    
    
    mpSdk.Tag.editOpacity(tagIds[2], 1);  
    

Parameter| Type| id| string  
The id of the Tag to edit| opacity| number  
The target opacity for the Tag in the range of [0, 1]  
---|---  
  
**Returns:** `Promise`<void>

### editPosition​

editPosition(id: string, options: Partial<Tag.PositionOptions>): Promise<void>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

Move and reorient a Tag.

See [`Pointer.intersection`](/reference/pointer/#intersection) for a way to retrieve a new `anchorPosition` and `stemVector`.

**Note** : these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session.
    
    
    const tagId: string; // ... acquired through a previous call to `mpSdk.Tag.add` or through `mpSdk.Tag.data`  
    
    
      
    
    
    mpSdk.Tag.editPosition(tagId, {  
    
    
     anchorPosition: {  
    
    
       x: 0,  
    
    
       y: 0,  
    
    
       z: 0,  
    
    
     },  
    
    
     stemVector: { // make the Tag stick straight up and make it 0.30 meters (~1 foot) tall  
    
    
       x: 0,  
    
    
       y: 0.30,  
    
    
       z: 0,  
    
    
     },  
    
    
    });  
    

Parameter| Type| id| string  
The id of the Tag to reposition| options| Partial<Tag.PositionOptions>  
The new anchorPosition, stemVector and/or roomId to associate the tag with.  
---|---  
  
**Returns:** `Promise`<void>

### editPositions​

editPositions(tags: Tag.EditPositionDescriptor[]): Promise<void>

Move and reorient a list of Tags. Prefer to call this method once over calling `Tag.editPosition` multiple times.
    
    
    const newRoomId; // precomputed room id  
    
    
    const tagId1, tagId2, tagId3; // predetermined tag ids.  
    
    
    const tagIds: MpSdk.Tag.EditPositionDescriptor[] = []; // an array of tag edit position descriptors  
    
    
      
    
    
    // updates anchorPosition for tag1  
    
    
    tagIds.push({  
    
    
      id: tag1,  
    
    
      options: {  
    
    
        anchorPosition: {  
    
    
          x: 0,  
    
    
          y: 0,  
    
    
          z: 0,  
    
    
        },  
    
    
      },  
    
    
    });  
    
    
      
    
    
    // updates roomId for tag2  
    
    
    tagIds.push({  
    
    
      id: tag2,  
    
    
      options: {  
    
    
        roomId: newRoomId,  
    
    
      },  
    
    
    });  
    
    
      
    
    
    // updates stemVector for tag3  
    
    
    tagIds.push({  
    
    
      id: tag3,  
    
    
      options: {  
    
    
        stemVector: { // make the Tag stick straight up and make it 0.30 meters (~1 foot) tall  
    
    
          x: 0,  
    
    
          y: 0.30,  
    
    
          z: 0,  
    
    
        },  
    
    
      },  
    
    
    });  
    
    
      
    
    
    // apply bulk updates  
    
    
    await mpSdk.Tag.editPositions(...tagIds);  
    
    
      
    

Parameter| Type| tags| Tag.EditPositionDescriptor[]  
The edit position descriptors for all Tags to be modified.  
---|---  
  
**Returns:** `Promise`<void>

### editStem​

editStem(tagSid: string, options: Partial<Tag.StemHeightEditOptions>): Promise<void>

Bundle Embed

_Introduced 3.1.70.10-0-ge9cb83b28c_

Edit the stem of a Tag
    
    
    const tagId: string = tagData[0].id; // ... acquired through a previous call to `mpSdk.Tag.add` or through `mpSdk.Tag.data`  
    
    
      
    
    
    // make the first Tag have an invsible stem  
    
    
    mpSdk.Tag.editStem(tagId, {stemVisible: false});  
    
    
      
    
    
    // make another Tag have a long stem  
    
    
    mpSdk.Tag.editStem(tagId, {stemHeight: 1});  
    

Parameter| Type| tagSid| string  
The sid of the Tag to edit| options| Partial<Tag.StemHeightEditOptions>  
What to change about the Tag's stem - can include stemHeight and stemVisible  
---|---  
  
**Returns:** `Promise`<void>

### open​

open(id: string, options?: Partial<Tag.OpenOptions>): Promise<void>

Bundle Embed

_Introduced 23.2.1_

Open a tag and display its billboard. Opening a second tag will close the first.
    
    
    mpSdk.Tag.open(tagId);  
    
    
      
    
    
    // if the tag has had its `dock` option removed through a call to `Tag.allowAction`, it can be `force`d open  
    
    
    mpSdk.Tag.allowAction(tagId, {  
    
    
      opening: false,  
    
    
    });  
    
    
    mpSdk.Tag.open(tagId,  
    
    
      force: true,  
    
    
    });  
    

Parameter| Type| id| string  
the id of the Tag to open| options?| Partial<Tag.OpenOptions>  
optional settings such as forcing the tag open  
---|---  
  
**Returns:** `Promise`<void>

### registerAttachment​

registerAttachment(srcs: string[]): Promise<string[]>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

Register a new `Attachment` that can later be attached as media to a Tag.

Custom HTML can be added as an attachment through the use of `registerSandbox` instead.
    
    
    // register a couple of attachments to use later  
    
    
    const [attachmentId1, attachmentId2] = mpSdk.Tag.registerAttachment(  
    
    
      'https://[link.to/media]',  
    
    
      'https://[link.to/other_media]',  
    
    
    );  
    

Parameter| Type| srcs| string[]  
The src URLs of the media  
---|---  
  
**Returns:** `Promise`<string[]>

A promise that resolves to an array of ids associated with the newly added Attachments

### registerSandbox​

registerSandbox(html: string, options?: Partial<Tag.SandboxOptions>): Promise<[string, [Tag.IMessenger](/reference/tag/imessenger/)]>

Bundle Embed

_Introduced 3.1.70.10-0-ge9cb83b28c_

Register an HTML sandbox that diplays custom HTML and runs custom scripts as an attachment. Data can be sent and received from the sandbox by using the returned [`IMessenger`](/reference/mattertag/imessenger/).
    
    
    const htmlToInject = `  
    
    
      <style>  
    
    
        button {  
    
    
          width: 100px;  
    
    
          height: 50px;  
    
    
        }  
    
    
      </style>  
    
    
      <button id='btn1'>CLICK ME</button>  
    
    
      <script>  
    
    
        var btn1 = document.getElementById('btn1');  
    
    
        btn1.addEventListener('click', () => {  
    
    
          // send data out of the sandbox  
    
    
          window.send('buttonClick', 12345);  
    
    
        });  
    
    
        // receive data from outside of the sandbox  
    
    
        window.on('updateButton', (newLabel, color) => {  
    
    
          btn1.innerText = newLabel;  
    
    
          btn1.style.backgroundColor = color;  
    
    
        });  
    
    
      </script>  
    
    
    `;  
    
    
      
    
    
    // create and register the sandbox  
    
    
    const [sandboxId, messenger] = await mpSdk.Tag.registerSandbox(htmlToInject);  
    
    
    // attach the sandbox to a tag  
    
    
    mpSdk.Tag.attach(tagId, sandboxId);  
    
    
    // receive data from the sandbox  
    
    
    messenger.on('buttonClick', (buttonId) => {  
    
    
      console.log('clicked button with id:', buttonId);  
    
    
    });  
    
    
    // send data to the sandbox  
    
    
    messenger.send('I send messages', 'red');  
    

Parameter| Type| html| string  
the HTML content to inject into the sandbox| options?| Partial<Tag.SandboxOptions>  
optional sandbox configuration such as name, size, and global variable mapping  
---|---  
  
**Returns:** `Promise`<[string, [Tag.IMessenger](/reference/tag/imessenger/)]>

An [`IMessenger`](/reference/mattertag/imessenger/) that can be used to communicate with the sandbox by sending and receiving data

### remove​

remove(ids: string[]): Promise<string[]>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

Removes one or more Tags from Showcase.

**Note** : these changes are not persisted between refreshes of Showcase. They are only valid for the current browser session.
    
    
    const tagIds: string[]; // ... acquired through a previous call to `mpSdk.Tag.add` or through `mpSdk.Tag.data`  
    
    
    // remove one tag  
    
    
    mpSdk.Tag.remove(tagIds[0]);  
    
    
      
    
    
    // or remove multiple at the same time  
    
    
    mpSdk.Tag.remove(...tagIds);  
    

Parameter| Type| ids| string[]  
The Tags' ids to be removed.  
---|---  
  
**Returns:** `Promise`<string[]>

A promise with an array of Tag ids that were actually removed.

### resetIcon​

resetIcon(id: string): Promise<void>

Bundle Embed

_Introduced 3.1.68.12-7-g858688944a_

Resets the icon of the Tag disc back to its original icon.
    
    
    const tagIds: string[]; // ... acquired through a previous call to `mpSdk.Tag.add` or through `mpSdk.Tag.data`  
    
    
      
    
    
    // reset the icon of the first Tag to its original  
    
    
    mpSdk.Tag.resetIcon(tagIds[0].id);  
    

Parameter| Type| id| string  
The id of the Tag to reset  
---|---  
  
**Returns:** `Promise`<void>

### toggleDocking​

toggleDocking(enable?: boolean): Promise<void>

Bundle Embed

_Introduced 23.4.2_

Toggle the dock setting to hide dock buttons in all tags.

Disabling the dock setting will remove the dock buttons from all tags. Enabling the dock setting does not automatically show the dock button in all tags. The dock button will only be displayed in a tag if both the dock setting is true and docking is allowed by the tag (see `Tag.allowAction`).
    
    
    // hide the dock buttons  
    
    
    mpSdk.Tag.toggleDocking(false);  
    
    
      
    
    
    // show the dock buttons  
    
    
    mpSdk.Tag.toggleDocking(true);  
    
    
      
    
    
    // toggle the current visibility of the dock buttons  
    
    
    mpSdk.Tag.toggleDocking();  
    

Parameter| Type| enable?| boolean  
whether to show or hide dock buttons; omit to toggle  
---|---  
  
**Returns:** `Promise`<void>

### toggleNavControls​

toggleNavControls(enable?: boolean): Promise<void>

Bundle Embed

_Introduced 23.3.1_

Toggle the overhead navigation UI
    
    
    // hide the controls  
    
    
    mpSdk.Tag.toggleNavControls(false);  
    
    
      
    
    
    // show the controls  
    
    
    mpSdk.Tag.toggleNavControls(true);  
    
    
      
    
    
    // toggle the current visibility of the controls  
    
    
    mpSdk.Tag.toggleNavControls();  
    

Parameter| Type| enable?| boolean  
whether to show or hide nav controls; omit to toggle  
---|---  
  
**Returns:** `Promise`<void>

### toggleSharing​

toggleSharing(enable?: boolean): Promise<void>

Bundle Embed

_Introduced 23.4.2_

Toggle the share setting to hide share buttons in all tags.

Disabling the share setting will remove the share buttons from all tags. Enabling the share setting does not automatically show the share button in all tags. The share button will only be displayed in a tag if both the share setting is true and sharing is allowed by the tag (see `Tag.allowAction`).
    
    
    // hide the share buttons  
    
    
    mpSdk.Tag.toggleSharing(false);  
    
    
      
    
    
    // show the share buttons  
    
    
    mpSdk.Tag.toggleSharing(true);  
    
    
      
    
    
    // toggle the current visibility of the share buttons  
    
    
    mpSdk.Tag.toggleSharing();  
    

Parameter| Type| enable?| boolean  
whether to show or hide share buttons; omit to toggle  
---|---  
  
**Returns:** `Promise`<void>

  * Interfaces
    * [IMessenger](/reference/tag/imessenger/)
  * Types
    * AllowableActions
    * Attachment
    * Descriptor
    * EditableProperties
    * EditPositionDescriptor
    * GlobalVariableMap
    * OpenOptions
    * OpenTags
    * PositionOptions
    * SandboxOptions
    * StemHeightEditOptions
    * TagData
  * Enumerations
    * AttachmentType
  * Observables
    * attachments
    * data
    * openTags
  * Methods
    * add
    * allowAction
    * attach
    * close
    * detach
    * dock
    * editBillboard
    * editColor
    * editIcon
    * editOpacity
    * editPosition
    * editPositions
    * editStem
    * open
    * registerAttachment
    * registerSandbox
    * remove
    * resetIcon
    * toggleDocking
    * toggleNavControls
    * toggleSharing



  * Types
    * AllowableActions
    * Attachment
    * Descriptor
    * EditableProperties
    * EditPositionDescriptor
    * GlobalVariableMap
    * OpenOptions
    * OpenTags
    * PositionOptions
    * SandboxOptions
    * StemHeightEditOptions
    * TagData
  * Enumerations
    * AttachmentType
  * Observables
    * attachments
    * data
    * openTags
  * Methods
    * add
    * allowAction
    * attach
    * close
    * detach
    * dock
    * editBillboard
    * editColor
    * editIcon
    * editOpacity
    * editPosition
    * editPositions
    * editStem
    * open
    * registerAttachment
    * registerSandbox
    * remove
    * resetIcon
    * toggleDocking
    * toggleNavControls
    * toggleSharing


