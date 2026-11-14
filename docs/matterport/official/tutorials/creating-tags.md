<!-- source: https://developers.matterport.com/tutorials/creating-tags/ -->

On this page

Deprecated

The Mattertag namespace has been deprecated. Please use the [Tags namespace](/reference/tag/) instead. For migration guidance, see [Migrating from Mattertags](/tutorials/tags-migration/).

## Creating Mattertags​

The [Mattertag.add](/reference/) function takes a single or an array of [MattertagDescriptor](/reference/) objects. The following properties are supported by [MattertagDescriptor](/reference/):

Property| Required| Description| anchorPosition| yes| The mattertag anchor, It is typically attached to a surface on the matterport model.| stemVector| yes| The mattertag stem. It's length determines how far it will be offset from the anchor position.| color| no| The color of the disc.| description| no| The mattertag description. Links can be included in the description.| label| no| The mattertag label.| mediaType| no| The mediaSrc type. This can be photo, video, or rich media. This property must be set to display the media source.| mediaSrc| no| A url to the media. The urls must be supported by embed.ly| floorId| no| The floor identifier associated witht the mattertag.  
---|---|---  
  
![mattertag properties](/assets/images/mattertag-properties-0f3e492072f4d9e3a9f12611d099937c.png)

_Mattertag Properties_

note

To find an anchor position, stemVector and floorId for your model, you can use the [Intersection Inspector Tool](/examples/intersection-inspector/)

Adding a mattertag with a label and no stem
    
    
    var mattertagDesc = {  
    
    
      label: 'Hello Mattertag',  
    
    
      anchorPosition: { x: 1.39, y: 2.00, z: -0.122 },  
    
    
      stemVector: { x: 0, y: 0, z: 0 }  
    
    
    };  
    
    
      
    
    
    sdk.Mattertag.add(mattertagDesc).then(function(mattertagId) {  
    
    
      console.log(mattertagId);  
    
    
      // output: TODO  
    
    
    });  
    

Adding multiple mattertags at once
    
    
    var mattertags = [{  
    
    
      label: 'Tag 1',  
    
    
      anchorPosition: { x: 0, y: 0, z: 0},  
    
    
      stemVector: { x: 0, y: 0, z: 0}  
    
    
    },{  
    
    
      label: 'Tag 2',  
    
    
      description: '<3 this tag!',  
    
    
      anchorPosition: { x: 1, y: 0, z: 0 },  
    
    
      stemVector: { x: 0, y: 0.5, z: 0}  
    
    
    }];  
    
    
      
    
    
    sdk.Mattertag.add(mattertags).then(function(mattertagIds) {  
    
    
      console.log(mattertagIds);  
    
    
      // output: TODO  
    
    
    });  
    

### Coordinate Conventions & SDK vs API Coordinates​

Users of Model API may notice that the coordinate system in Showcase does not match API data. For an in-depth overview of the SDK Coordinate system, please visit our [concepts page](/overview/concepts/#coordinate-conventions)

## Editing Mattertags​

### Adding a link to the description​

The description supports the following markdown link format:

`[link text](link url)`

The following code snippets produces the image below it.
    
    
    sdk.Mattertag.editBillboard(mattertagSid, {  
    
    
      description:"[Link to Matterport site!](https://www.matterport.com)",  
    
    
    });  
    

![description link](/assets/images/description-link-27b0888d827d166953e2ba96164e1430.png)

### Setting an image media source​

We use embedly to present image media. We recommend that you verify your image url with the embedly explore display tool before setting it as a media source.

  * Select your image url. For example:


    
    
    https://static.matterport.com/mp_cms/media/filer_public/71/ca/71cabc75-99a5-41a4-917c-f45203f9254e/pro-21f8ddbae.png  
    

  * Verify your image is displayed correctly on the embedly explore display tool



[![embedly explore display](/assets/images/embedly-explore-display-d7dfcc6c88aff66de4c487aead5e8ba1.png)](https://embed.ly/docs/explore/display/resize?url=https%3A%2F%2Fstatic.matterport.com%2Fmp_cms%2Fmedia%2Ffiler_public%2F71%2Fca%2F71cabc75-99a5-41a4-917c-f45203f9254e%2Fpro-21f8ddbae.png)

  * Call [Mattertag.editBillboard](/reference/) with the media source to update the billboard


    
    
    sdk.Mattertag.editBillboard(mattertagSid, {  
    
    
      media: {  
    
    
      type: sdk.Mattertag.MediaType.PHOTO,  
    
    
      src: 'https://static.matterport.com/mp_cms/media/filer_public/71/ca/71cabc75-99a5-41a4-917c-f45203f9254e/pro-21f8ddbae.png',  
    
    
    });  
    

![mattertag with image](/assets/images/mattertag-with-image-55508e167c3af8a8fa68259fa8ae84b9.png)

### Setting a video media source​

We use embedly to present video media. We recommend that you verify your video url with the embedly explore embed tool before setting it as a media source.

  * Select your video url. For example:


    
    
    https://www.youtube.com/watch?v=uO_x9TFNmTk  
    

  * Verify your video is displayed correctly on the embedly explore embed tool



[![embedly explore embed](/assets/images/embedly-explore-embed-23707ee3e51f91355685d53764d1299f.png)](https://embed.ly/docs/explore/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DuO_x9TFNmTk)

  * Call [Mattertag.editBillboard](/reference/) with the media source to update the billboard


    
    
    sdk.Mattertag.editBillboard(mattertagSid, {  
    
    
      media: {  
    
    
      type: sdk.Mattertag.MediaType.VIDEO,  
    
    
      src: 'https://www.youtube.com/watch?v=uO_x9TFNmTk',  
    
    
    });  
    

![mattertag with video](/assets/images/mattertag-with-video-5a60c5e96d67003fc63136b11a0b9951.png)

  * Creating Mattertags
    * Coordinate Conventions & SDK vs API Coordinates
  * Editing Mattertags
    * Adding a link to the description
    * Setting an image media source
    * Setting a video media source


