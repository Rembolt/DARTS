# oriented/extract

## GET /oriented/extract

**Returns one oriented image matching the input parameters.**

### Introduction

This service will take a point or polygon and return one discrete image, depending on the parameters of the request. This service retrieves Nadir and Oblique Images from both Blue Sky and Gray Sky collections. Due to the broad collection specifications (multi-sensor, multi-library, multi-camera-orientation, etc.) this is a diverse compilation of data with an enormous list of potential uses, including:

<ul><li>Aerial Survey</li><li>Disaster Assessment</li><li>Engineering/Construction</li><li>Navigation/network planning</li><li>Landscape Change Detection</li></ul>
Use the oriented/query or oriented/collections services to query for image coverage.

<img src="../resources/img/docs/oriented_extract.png"/>

### Technical Details

This service is accessed by specifying a point or polygon (in WKT format). Depending on parameters, this service will return the whole image or a portion of the image. In addition to the standard GET request, this service offers the ability to overlay drawing elements (vector and text data) on imagery using POST calls.

Image metadata is embedded in the headers of each image file as EXIF and custom XMP tags. The EXIF tags are readable by any common image library and the XMP tags can be accessed with ExifTool by running this command on the downloaded file: ```exiftool -xmp:all {filename.[jpg|png|tif]}.```

Not all PNG versions support EXIF metadata so for this format ONLY XMP metadata will appear.

<img src="../resources/img/icon/icon-info.png" width="12px" height="12px"/> Notes on image size limits: <i>(If your requested image exceeds any of these limits, an error will be returned.)</i><br><ul><li><i>An extracted image may not be comprised of more than 1,024 individual tiles (67,108,864 total pixels).</i><ul><li><i>To maximize the imagery returned within one /extract call, your input geometry must precisely align with the Mercator tile grid at the zoom level from which you are requesting. If even a sliver of your input geometry intersects with a tile, that tile will be included in the 1,024 limit.</i></li></ul></li><li><i>Any one image dimension (either width or height) cannot exceed 65,000 pixels.</i></li></ul>

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| layer | query | False | string | The name of the desired layer.<br><b>Allowed values</b>: <i>urban, urban-r, urban-g, wide-area, graysky, graysky-g</i> |
| wkt | query | False | string | The well-known-text (WKT) representation of the requested point, polyline or polygon. If a point is provided then either buffer or bbox-dimensions must also be used.    ⓘ Note: Information is returned only for real-world coordinates; WKTs that extend beyond ±180° longitude are accepted, but results are limited to the portion of the geometry that intersects valid Earth bounds. |
| srid | query | False | string | The spatial reference identification code for the projection representing the coordinates of input WKT. If undefined, 4326 will be used. Only EPSG is supported. Allowed: 4326, 3857 |
| image-name | query | False | string | The image name(s) for the image(s). Multiple values must be separated by a comma. |
| graysky-event | query | False | string | The identifier of the event which contains the desired imagery. |
| collection | query | False | string | The identifier of the collection which contains the desired imagery. |
| product-type | query | False | string | The camera-axis and/or cardinal orientation of the image to be returned. This is a filtering parameter, if more than one image matches the defined product-type, the service will select and return only one image.<br><br><i>Available values</i>: <ul><li><b>nadir</b>: default - only nadir images will be returned</li><li><b>oblique-north</b>: only oblique-north images will be returned</li><li><b>oblique-south</b>: only oblique-south images will be returned</li><li><b>oblique-west</b>: only oblique-west images will be returned</li><li><b>oblique-east</b>: only oblique-east images will be returned</li></ul> |
| order-by | query | False | string | In the case that more than one image matches the input parameters, <code>order-by</code> will define the method by which the potential images are ordered. Because <code>oriented/extract</code> can only return a single image, it will be the image at the top of that ordered list. This parameter can take multiple values, separated by commas, and will honor them in the order in which they are defined.<br><br><b>Allowed values</b>: <i><code>layer-asc</code>, <code>layer-desc</code>, <code>image-name-asc</code>, <code>image-name-desc</code>, <code>image-center-distance-asc</code>, <code>image-center-distance-desc</code>, <code>image-border-distance-asc</code>, <code>image-border-distance-desc</code>, <code>collection-first-capture-date-asc</code>, <code>collection-first-capture-date-desc</code>, <code>collection-last-capture-date-asc</code>, <code>collection-last-capture-date-desc</code>, <code>image-date-asc</code>, <code>image-date-desc</code>, <code>collection-avg-gsd-asc</code>, <code>collection-avg-gsd-desc</code></i><br><br><i><b>Note</b>: <code>layer-asc</code> and <code>layer-desc</code> will respect the order of layers as defined in the <code>layer</code> parameter, if <code>layer</code> is undefined the default ordering won´t include these values. They can however still be explicitly asked for within <code>order-by</code>, but doing so will cause the ordering to appear to be random.</i><br><br><i>Default value: <code>layer-asc</code>, <code>collection-last-capture-date-desc</code>, <code>image-center-distance-asc</code></i> |
| collect-year | query | False | integer | The collection year of the tiles expressed with 4 digits (e.g. 2021 or 2018). If year is omitted, a combination of the most recent information across all available years with combined coverage will be returned. |
| min-capture-date | query | False | string | The date of the earliest acceptable capture date. Collections with capture date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-capture-date | query | False | string | The date of the acceptable last capture date. Collections with capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-first-publish-date | query | False | string | The date of the earliest acceptable first publish date. Collections with first publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-publish-date | query | False | string | The date of the latest acceptable first publish date. Collections with first publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-publish-date | query | False | string | The date of the earliest acceptable last publish date. Collections with last publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-publish-date | query | False | string | The date of the latest acceptable last publish date. Collections with last publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| bands | query | False | string | The color bands in which the returned image will be comprised of.<br><br><i>Available values</i>: <ul><li><b>rgb</b> (default): Imagery is returned in red, green and blue bands. This matches the visible spectrum.</li><li><b>irg</b>: Imagery is returned in infrared, red and green bands. These bands are color-shifted: infrared is displayed as red, red is displayed as green and green is displayed as blue.</li></ul> Allowed: rgb, irg |
| downsample | query | False | integer | Zoom level of the image, being 0 the lowest (same as extracted from the aircraft), and every other level would result from shrinking the original image into half its width and half its height. |
| bbox-dimensions | query | False | string | Defines the dimensions (in meters) of the bounding box of the region surrounding your input point wkt. The point will be the center of the bounding box. Defined as bbox-dimensions=width,height. |
| destination-dimensions | query | False | string | Defines the pixel dimensions of the output image frame, and how the requested wkt region is mapped into it. The WKT region is always centered within the frame and image resampling will be applied; it’s recommended to omit the zoom parameter when using destination-dimensions.  Defined as destination-dimensions=width,height,fit\|fill.<ul><li>fit - the requested wkt region (red) is scaled to fit entirely within the destination-dimensions output frame (yellow). Use the crop parameter to control whether the area outside the WKT but inside the frame is filled with black pixels or additional image pixels.<br><img src="../resources/img/docs/extract_fit.png"/></li><li>fill - the requested wkt region (red) is scaled to entirely fill the output frame (yellow). No pixels outside the WKT will be included, and some pixels within the WKT may be excluded.<br><img src="../resources/img/docs/extract_fill.png"/></li></ul> *Note: Example images are from the ortho/extract service and may not reflect exact pixels for this service.* |
| buffer-meter | query | False | number | The buffer around the wkt point or polygon (in meters). |
| buffer-pixel | query | False | number | The buffer around the wkt point or polygon (in pixels). |
| rotation | query | False | string | Determines the rotation of the image.<br><br><i>Available values</i>: <ul><li><b>north</b>: North at the top of the image.<br><i>(default for nadir images)</i></li><li><b>south</b>: South at the top of the image.</li><li><b>east</b>: East at the top of the image.</li><li><b>west</b>: West at the top of the image.</li><li><b>natural</b>: The forward-moving-direction of the collection aircraft facing upward.<br><i>(default for oblique imagery)</i></li></ul><img src="../resources/img/icon/icon-info.png" width="12px" height="12px"/> <b>Note</b>: rotation is applied differently based on ```image-format```:<br><ul><li>```jpeg```: Rotation is stored in the EXIF Orientation tag and must be applied by the client.</li><li>```png```: Rotation is pre-applied to the image pixels; no additional interpretation needed.</li><li>```tiff```: Rotation is encoded in the affine transformation matrix and interpreted by geospatial software/libraries.</li></ul> |
| dem-priority | query | False | string | Determines which digital elevation model to use by the API service. Mutiple values may be passed in a comma-separated list, we will use these values in the order they are provided. The dem that was used will be reported in the service response with an object named dem-priority.<br><br>Available values: (listed in order of accuracy)<br><ul><li><b>```vexcel-dsm```</b><i> - highest accuracy, generated with Vexcel’s urban imagery</i></li><li><b>```vexcel-dtm```</b><i> - generated with Vexcel’s wide-area imagery</i></li><li><b>```public-dtm```</b><i> - comprised of a variety of public dtm datasets, accuracy is highly variable</i></li><li><b>```flat-dtm```</b><i> - lowest accuracy, completely flat and containing no terrain variation</i></li></ul> |
| crop | query | False | string | The method with which to crop the returned images based on the input wkt parameter. Will not work if only an image-name is provided.<i>Available values</i>: <ul><li><b>bbox</b> (default for wkt): Returns the smallest rectangular image that fully contains the input wkt geometry. All pixels within the image contain data, the only black/transparent pixels are those beyond the limit of the source oriented image.</li><li><b>bbox-trimmed</b>: Equivalent to bbox but the resulting image is trimmed down to the boundaries of the source oriented image.</li><li><b>clip</b>: Returns the smallest rectangular image that fully contains the input wkt geometry. Only the pixels that are both inside the wkt geometry and within the limits of the source oriented image will be returned; the rest will be black/transparent pixels.</li><li><b>clip-trimmed</b>: Equivalent to clip but the resulting image is trimmed down to the boundaries of the source oriented image.</li><li><b>full</b> (default for image-name): Returns the full unmodified source oriented image.</li><li><b>full-bbox</b>: Returns an image matching the dimensions of the source oriented image but only the bounding-box of the wkt selection will contain imagery, the rest will be black/transparent pixels.</li><li><b>full-clip</b>: Returns an image matching the dimensions of the source oriented image but only the actual wkt selection will contain imagery, the rest will be black/transparent pixels.</li></ul><img src="../resources/img/docs/oriented_extract_crop.png"/> |
| crosshair | query | False | string | The point coordinates at which to draw a crosshair reticle. |
| crosshair-color | query | False | string | The color for the crosshair line. |
| crosshair-line-width | query | False | integer | The width of the crosshair line. |
| attribution | query | False | boolean | Turns off the text overlay displaying copyright and attribution to Vexcel Imaging. |
| spatial-operation | query | False | string | The spatial-query used to specify which images to select based on their relationship to the user’s input wkt.  **Note**: This parameter will be ignored if either:<ul><li>**wkt** is defined as a point or line</li><li>**image-name** is defined</li></ul>  <i>Available values</i>: <ul><li>intersect (default): images must intersect with the input wkt to be returned.</li><li>within-wkt: images must be completely contained within the input wkt to be returned. </li><li>covers-wkt: images must cover the input wkt entirely to be returned.</li></ul> Allowed: intersect, covers-wkt, within-wkt |
| image-format | query | False | string | The file format of the image. All formats have been compressed with jpeg compression of .95.<br><br><i>Available values</i>: <ul><li><b>jpeg</b>: Most performant, no georeferencing or transparency.</li><li><b>png</b>: No georefrencing, supports transparency.</li><li><b>tiff</b>: Least performant, supports georeferencing and transparency.</li><li><b>jpeg/png</b> (default): Either jpeg or png may be returned. Selected automatically based on the presense of transparent pixels in the source image.</li></ul><img src="../resources/img/icon/icon-info.png" width="12px" height="12px"/> <b>Note</b>: For images with an ```image-format=tiff```, rotation will not be applied; geotiff images are georeferenced and will be rotated by common GIS softwares or libraries. |

### Responses

- **200**: OK (image/jpeg, image/png, image/tiff)
- **204**: No Content (*/*)
- **400**: Bad Request (*/*)
- **401**: Unauthorized (*/*)
- **403**: Forbidden (*/*)
- **404**: Not Found (*/*)
- **412**: Precondition Failed (*/*)
- **413**: Payload Too Large (*/*)
- **422**: Unprocessable Entity (*/*)
- **429**: Too Many Requests (*/*)
- **500**: Internal Server Error (*/*)
- **503**: Service Unavailable (*/*)

## POST /oriented/extract

**Returns one oriented image matching the input parameters.**

### Introduction

This service will take a point or polygon and return one discrete image, depending on the parameters of the request. This service retrieves Nadir and Oblique Images from both Blue Sky and Gray Sky collections. Due to the broad collection specifications (multi-sensor, multi-library, multi-camera-orientation, etc.) this is a diverse compilation of data with an enormous list of potential uses, including:

<ul><li>Aerial Survey</li><li>Disaster Assessment</li><li>Engineering/Construction</li><li>Navigation/network planning</li><li>Landscape Change Detection</li></ul>
Use the oriented/query or oriented/collections services to query for image coverage.

<img src="../resources/img/docs/oriented_extract.png"/>

### Technical Details

This service is accessed by specifying a point or polygon (in WKT format). Depending on parameters, this service will return the whole image or a portion of the image. In addition to the standard GET request, this service offers the ability to overlay drawing elements (vector and text data) on imagery using POST calls.

Image metadata is embedded in the headers of each image file as EXIF and custom XMP tags. The EXIF tags are readable by any common image library and the XMP tags can be accessed with ExifTool by running this command on the downloaded file: ```exiftool -xmp:all {filename.[jpg|png|tif]}.```

Not all PNG versions support EXIF metadata so for this format ONLY XMP metadata will appear.

<img src="../resources/img/icon/icon-info.png" width="12px" height="12px"/> Notes on image size limits: <i>(If your requested image exceeds any of these limits, an error will be returned.)</i><br><ul><li><i>An extracted image may not be comprised of more than 1,024 individual tiles (67,108,864 total pixels).</i><ul><li><i>To maximize the imagery returned within one /extract call, your input geometry must precisely align with the Mercator tile grid at the zoom level from which you are requesting. If even a sliver of your input geometry intersects with a tile, that tile will be included in the 1,024 limit.</i></li></ul></li><li><i>Any one image dimension (either width or height) cannot exceed 65,000 pixels.</i></li></ul>

### Request body

```json
{
 "content": {
  "application/json": {
   "examples": {
    "Default request": {
     "description": "Default request",
     "value": {
      "layer": "urban, urban-r, urban-g, wide-area, graysky, graysky-g",
      "wkt": "POLYGON ((-97.353029 37.683617, -97.346935 37.683617, -97.346935 37.687624, -97.353029 37.687624, -97.353029 37.683617))",
      "srid": 4326
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
     "attribution": {
      "type": "boolean"
     },
     "bands": {
      "type": "string",
      "default": "rgb",
      "description": "The color bands in which the returned image will be comprised of.<br><br><i>Available values</i>: <ul><li><b>rgb</b> (default): Imagery is returned in red, green and blue bands. This matches the visible spectrum.</li><li><b>irg</b>: Imagery is returned in infrared, red and green bands. These bands are color-shifted: infrared is displayed as red, red is displayed as green and green is displayed as blue.</li></ul>",
      "enum": [
       "all",
       "rgb",
       "irg"
      ]
     },
     "bbox-dimensions": {
      "type": "string",
      "description": "Defines the dimensions (in meters) of the bounding box of the region surrounding your input point wkt. The point will be the center of the bounding box. Defined as bbox-dimensions=width,height."
     },
     "buffer-meter": {
      "type": "number",
      "format": "double",
      "description": "The buffer around the wkt point or polygon (in meters)."
     },
     "buffer-pixel": {
      "type": "number",
      "format": "double"
     },
     "collect-year": {
      "type": "integer",
      "format": "int32",
      "description": "The collection year of the tiles expressed with 4 digits",
      "minLength": 4
     },
     "collection": {
      "type": "string",
      "description": "The identifier of the collection which contains the desired data referred to as collection in metadata"
     },
     "crop": {
      "type": "string",
      "description": "The method with which to crop the returned images based on the input wkt parameter. Will not work if only an image-name is provided.<i>Available values</i>: <ul><li><b>bbox</b> (default for wkt): Returns the smallest rectangular image that fully contains the input wkt geometry. All pixels within the image contain data, the only black/transparent pixels are those beyond the limit of the source oriented image.</li><li><b>bbox-trimmed</b>: Equivalent to bbox but the resulting image is trimmed down to the boundaries of the source oriented image.</li><li><b>clip</b>: Returns the smallest rectangular image that fully contains the input wkt geometry. Only the pixels that are both inside the wkt geometry and within the limits of the source oriented image will be returned; the rest will be black/transparent pixels.</li><li><b>clip-trimmed</b>: Equivalent to clip but the resulting image is trimmed down to the boundaries of the source oriented image.</li><li><b>full</b> (default for image-name): Returns the full unmodified source oriented image.</li><li><b>full-bbox</b>: Returns an image matching the dimensions of the source oriented image but only the bounding-box of the wkt selection will contain imagery, the rest will be black/transparent pixels.</li><li><b>full-clip</b>: Returns an image matching the dimensions of the source oriented image but only the actual wkt selection will contain imagery, the rest will be black/transparent pixels.</li></ul>"
     },
     "crosshair": {
      "type": "string"
     },
     "crosshair-color": {
      "type": "string"
     },
     "crosshair-line-width": {
      "type": "integer",
      "format": "int32"
     },
     "dem-priority": {
      "type": "array",
      "items": {
       "type": "string",
       "enum": [
        "VEXCEL_DSM",
        "VEXCEL_DTM",
        "PUBLIC_DTM",
        "FLAT_DTM"
       ]
      }
     },
     "destination-dimensions": {
      "type": "string",
      "description": "Defines the dimensions (in pixels) of the output image frame. The requested region (as defined by wkt) will be centered within the image frame with two options fit or fill. Defined as destination-dimensions=width,height,fit|fill. See GET parameters for more details."
     },
     "downsample": {
      "type": "integer",
      "format": "int32"
     },
     "drawing": {
      "type": "object",
      "description": "list of geometries in {} brackets, separated by comma. With rendering attributes for each wkt.",
      "properties": {
       "fill-color": {
        "type": "string",
        "description": "Colour of the fill, formatted as an RGB string (e.g., \"rgb(255,128,0)\")."
       },
       "label": {
        "type": "string",
        "description": "Label text of the drawing"
       },
       "label-color": {
        "type": "string",
        "description": "Colour of the label text, formatted as an RGB string (e.g., \"rgb(255,128,0)\")."
       },
       "label-font": {
        "type": "string",
        "description": "Font use in the label"
       },
       "label-size": {
        "type": "number",
        "format": "double",
        "description": "Size of the font text for the label, by default 20"
       },
       "outline-color": {
        "type": "string",
        "description": "Colour of the outline, formatted as an RGB string (e.g., \"rgb(255,128,0)\")."
       },
       "outline-width": {
        "type": "integer",
        "format": "int32",
        "description": "Width of the outline"
       },
       "transparency": {
        "type": "integer",
        "format": "int32",
        "description": "Transparency value, 255 by default"
       },
       "wkt": {
        "type": "string",
        "description": "Well-Known Text geometry (point or polygon)"
       }
      }
     },
     "graysky-event": {
      "type": "string",
      "description": "The event name of the Graysky collection event"
     },
     "image-format": {
      "type": "string",
      "default": "jpeg/png",
  
```

### Responses

- **200**: OK (image/jpeg, image/png, image/tiff)
- **204**: No Content (*/*)
- **400**: Bad Request (*/*)
- **401**: Unauthorized (*/*)
- **403**: Forbidden (*/*)
- **404**: Not Found (*/*)
- **412**: Precondition Failed (*/*)
- **413**: Payload Too Large (*/*)
- **422**: Unprocessable Entity (*/*)
- **429**: Too Many Requests (*/*)
- **500**: Internal Server Error (*/*)
- **503**: Service Unavailable (*/*)
