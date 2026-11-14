# ortho/extract

## GET /ortho/extract

**Returns an ortho image containing the provided region**

### Introduction

This service returns a piece of imagery as a JPG or PNG, cut from the seamless orthomosaic. The same imagery you can access via ortho/tile is used to create the returned image. Ortho/extract saves you the work of making multiple API calls to ortho/tile for individual tiles, stitching them together into a large bitmap, and cropping it to your spec. With a single API call you can get back a static map image matching your specification.

<img src="../resources/img/icon/icon-info.png" width="12px" height="12px"/> Notes on image size limits: <i>(If your requested image exceeds any of these limits, an error will be returned.)</i><br><ul><li><i>An extracted image may not be comprised of more than 1,024 individual tiles (67,108,864 total pixels).</i><ul><li><i>To maximize the imagery returned within one /extract call, your input geometry must precisely align with the Mercator tile grid at the zoom level from which you are requesting. If even a sliver of your input geometry intersects with a tile, that tile will be included in the 1,024 limit.</i></li></ul></li><li><i>Any one image dimension (either width or height) cannot exceed 65,000 pixels.</i></li></ul>
<img src="../resources/img/docs/ortho_extract.png"/>

### Technical Details

You can use the ortho/collections service to determine where ortho coverage exists. This allows you to know if a call to ortho/extract will succeed or fail based on image availability.

Image metadata is embedded in the headers of each image file as custom XMP tags. They can be accessed with ExifTool by running this command on the downloaded file: ```exiftool -xmp:all {filename.[jpg|png|tif]}.```

### Use Cases

All use cases will ensure that imagery will not exceed either 67,108,864 pixels (e.g., 4096 x 16384) or 1,024 tiles.

<ol><li>point wkt + zoom: This is the most common use of the service. Here you pass in a point WKT where the image will be centered and a standard zoom level. You also pass in the desired dimensions of the image you want returned.</li><li>polygon wkt: Here you pass a polygon in the WKT parameter that you want covered by the returned image. The service will calculate the deepest zoom level that covers the polygon with less than the maximum number of tiles (1,024).  The resulting bitmap will be fit to the minimum bounding rectangle (or MBR) for the polygon that was passed in the WKT parameter. Note that the Pixel dimensions of the resulting image are also determined by the service and cannot be specified.</li><li>polygon wkt + zoom: This is very similar to the previous case, but instead of the system selecting the optimal Zoom level, you specify it with the Zoom parameter. This allows you to scale the image.</li></ol>

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| layer | query | True | string | The name of the desired layer.<br><b>Allowed values</b>: <i>urban, urban-r, urban-g, wide-area, graysky</i> |
| wkt | query | True | string | The well-known-text (WKT) representation of the requested point, line or polygon. If a point is provided then either buffer or bbox-dimensions must also be used.    ⓘ Note: Information is returned only for real-world coordinates; WKTs that extend beyond ±180° longitude are accepted, but results are limited to the portion of the geometry that intersects valid Earth bounds. |
| srid | query | False | string | The spatial reference identification code for the projection representing the coordinates of the given WKT. If undefined, 4326 will be used. Only EPSG is supported. Allowed: 4326, 3857 |
| graysky-event | query | False | string | The event name of the Graysky event (e.g. us-fl-ian-hurricane). |
| collection | query | False | string | The identifier of the AOI (Area of Interest) which contains the desired imagery. |
| product-type | query | False | string | The product type of the image returned.The type of ortho product of the image returned. Throughout our production process, we produce several ortho products. This table outlines the current production level indicated by the product-type response value.               <table border="1">                <thead>                  <tr>                    <th><b>&nbsp;Production Progression* ↓&nbsp;&nbsp;&nbsp; \ &nbsp;&nbsp;&nbsp; Layer → </b></th>                    <th><b>&nbsp;urban</b></th>                    <th><b>&nbsp;urban-r</b></th>                    <th><b>&nbsp;wide-area</b></th>                    <th><b>&nbsp;graysky<sup>†</sup></b></th>                    <th><b>&nbsp;graysky-g<sup>†</sup></b></th>                    <th><b>&nbsp;urban-g<sup>†</sup></b></th>                  </tr>                </thead>                <tbody>                  <tr>                    <td><b>&nbsp;Imagery Ingested</b></td>                    <td>&nbsp;first-ortho</td>                    <td>&nbsp;first-ortho</td>                    <td>&nbsp;first-ortho</td>                    <td>&nbsp;first-ortho</td>                    <td>&nbsp;first-ortho</td>                    <td>&nbsp;first-ortho</td>                  </tr>                  <tr>                    <td><b>&nbsp;Aerial Triangulated and Color Balanced</b></td>                    <td>&nbsp;quick-ortho</td>                    <td>&nbsp;final-ortho</td>                    <td>&nbsp;quick-ortho</td>                    <td>&nbsp;quick-ortho</td>                    <td>&nbsp;quick-ortho</td>                    <td>&nbsp;quick-ortho</td>                  </tr>                  <tr>                    <td><b>&nbsp;Natively Orthorectified<sup>‡</sup></b></td>                    <td>&nbsp;dxm-ortho</td>                    <td></td>                    <td>&nbsp;dxm-ortho</td>                    <td></td>                    <td></td>                    <td></td>                  </tr>                  <tr>                    <td><b>&nbsp;Water Edited and Manual Quality Reviewed</b></td>                    <td>&nbsp;final-ortho</td>                    <td></td>                    <td>&nbsp;final-ortho</td>                    <td></td>                    <td></td>                    <td></td>                  </tr>                </tbody>              </table>              <br>&nbsp;&nbsp;* <i>The production steps are chronological; each step includes all processes above it.</i>              <br>&nbsp;&nbsp;<sup>†</sup> <i>graysky, graysky-g and urban-g only have first-ortho and quick-ortho statuses. They do not have dxm-ortho or final-ortho. </i>              <br>&nbsp;&nbsp;<sup>‡</sup><i>Native Orthorectification refers to imagery rectified using a DEM generated from the same aerial image collection, ensuring alignment with the terrain as captured.</i> |
| order-by | query | False | string | In the case that more than one image matches the input parameters, <code>order-by</code> will define the method by which the potential images are ordered. This parameter can take multiple values, separated by commas, and will honor them in the order in which they are defined.<br><br><b>Allowed values</b>: <i><code>layer-asc</code>, <code>layer-desc</code>, <code>collection-first-capture-date-asc</code>, <code>collection-first-capture-date-desc</code>, <code>collection-last-capture-date-asc</code>, <code>collection-last-capture-date-desc</code>, <code>collection-first-publish-date-asc</code>, <code>collection-first-publish-date-desc</code>, <code>collection-last-publish-date-asc</code>, <code>collection-last-publish-date-desc</code>, <code>collection-avg-gsd-asc</code>, <code>collection-avg-gsd-desc</code>, <code>collection-area-asc</code>, <code>collection-area-desc</code></i><br><br><i><b>Note</b>: <code>layer-asc</code> and <code>layer-desc</code> will respect the order of layers as defined in the <code>layer</code> parameter, if <code>layer</code> is undefined the default ordering won´t include these values. They can however still be explicitly asked for within <code>order-by</code>, but doing so will cause the ordering to appear to be random.</i><br><br><i>Default value: <code>layer-asc</code>, <code>collection-last-capture-date-desc</code>, <code>collection-avg-gsd-asc</code></i> |
| collect-year | query | False | integer | The year of collection. |
| min-first-capture-date | query | False | string | The date of the earliest acceptable first capture date. Collections with first capture date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-capture-date | query | False | string | The date of the latest acceptable first capture date. Collections with first capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-capture-date | query | False | string | The date of the earliest acceptable last capture date. Collections with last capture date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-capture-date | query | False | string | The date of the latest acceptable last capture date. Collections with last capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-first-publish-date | query | False | string | The date of the earliest acceptable first publish date. Collections with first publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-publish-date | query | False | string | The date of the latest acceptable first publish date. Collections with first publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-publish-date | query | False | string | The date of the earliest acceptable last publish date. Collections with last publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-publish-date | query | False | string | The date of the latest acceptable last publish date. Collections with last publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| bands | query | False | string | The color bands in which the returned image will be comprised of.<br><br><i>Available values</i>: <ul><li><b>rgb</b> (default): Imagery is returned in red, green and blue bands. This matches the visible spectrum.</li><li><b>irg</b>: Imagery is returned in infrared, red and green bands. These bands are color-shifted: infrared is displayed as red, red is displayed as green and green is displayed as blue.</li></ul> Allowed: rgb, irg |
| zoom | query | False | integer | The tile-level of the requested 'image' |
| bbox-dimensions | query | False | string | Defines the dimensions (in meters) of the bounding box of the region surrounding your input point wkt. The point will be the center of the bounding box. Defined as bbox-dimensions=width,height. |
| destination-dimensions | query | False | string | Defines the pixel dimensions of the output image frame, and how the requested wkt region is mapped into it. The WKT region is always centered within the frame and image resampling will be applied; it’s recommended to omit the zoom parameter when using destination-dimensions.  Defined as destination-dimensions=width,height,fit\|fill.<ul><li>fit - the requested wkt region (red) is scaled to fit entirely within the destination-dimensions output frame (yellow). Use the crop parameter to control whether the area outside the WKT but inside the frame is filled with black pixels or additional image pixels.<br><img src="../resources/img/docs/extract_fit.png"/></li><li>fill - the requested wkt region (red) is scaled to entirely fill the output frame (yellow). No pixels outside the WKT will be included, and some pixels within the WKT may be excluded.<br><img src="../resources/img/docs/extract_fill.png"/></li></ul> *Note: Example images are from the ortho/extract service and may not reflect exact pixels for this service.* |
| buffer-meter | query | False | number | The buffer around the wkt point or polygon (in meters). |
| buffer-pixel | query | False | integer | The buffer around the wkt point or polygon (in pixels). |
| crop | query | False | string | The method with which to crop the returned images based on the input wkt parameter. Will not work with image-name. Allowed: bounding_box, clip |
| crosshair | query | False | string | The point coordinates at which to draw a crosshair reticle. |
| crosshair-color | query | False | string | The color for the crosshair line. |
| crosshair-line-width | query | False | integer | The width of the crosshair line. |
| attribution | query | False | boolean | Turns off the text overlay displaying copyright and attribution to Vexcel Imaging. |
| image-format | query | False | string | The file format of the image. All formats have been compressed with jpeg compression of .95.<br><br><i>Available values</i>: <ul><li><b>jpeg</b>: Most performant, no georeferencing or transparency.</li><li><b>png</b>: No georefrencing, supports transparency.</li><li><b>tiff</b>: Least performant, supports georeferencing and transparency.</li><li><b>jpeg/png</b> (default): Either jpeg or png may be returned. Selected automatically based on the presense of transparent pixels in the source image.</li></ul> |
| include | query | False | string | Additional metadata fields to be included on the exif header. Available fields: ```estimate-date```. |
| interpolation | query | False | boolean | Controls whether requests above the collection’s maximum zoom level may return subdivided tiles.  If true, tiles at the maximum zoom level (e.g., max-zoom=21) can be split and served as higher zoom levels (e.g., 22+). Each interpolated tile contains 256 × 256 pixels, but only the portion derived from the original data (e.g., ¼ of the tile) is counted toward billing and reporting.  If false, requests above the maximum zoom level will not return tiles. |

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

## POST /ortho/extract

**Returns an ortho image containing the provided region**

### Introduction

This service returns a piece of imagery as a JPG or PNG, cut from the seamless orthomosaic. The same imagery you can access via ortho/tile is used to create the returned image. Ortho/extract saves you the work of making multiple API calls to ortho/tile for individual tiles, stitching them together into a large bitmap, and cropping it to your spec. With a single API call you can get back a static map image matching your specification.

<img src="../resources/img/icon/icon-info.png" width="12px" height="12px"/> Notes on image size limits: <i>(If your requested image exceeds any of these limits, an error will be returned.)</i><br><ul><li><i>An extracted image may not be comprised of more than 1,024 individual tiles (67,108,864 total pixels).</i><ul><li><i>To maximize the imagery returned within one /extract call, your input geometry must precisely align with the Mercator tile grid at the zoom level from which you are requesting. If even a sliver of your input geometry intersects with a tile, that tile will be included in the 1,024 limit.</i></li></ul></li><li><i>Any one image dimension (either width or height) cannot exceed 65,000 pixels.</i></li></ul>
<img src="../resources/img/docs/ortho_extract.png"/>

### Technical Details

You can use the ortho/collections service to determine where ortho coverage exists. This allows you to know if a call to ortho/extract will succeed or fail based on image availability.

Image metadata is embedded in the headers of each image file as custom XMP tags. They can be accessed with ExifTool by running this command on the downloaded file: ```exiftool -xmp:all {filename.[jpg|png|tif]}.```

### Use Cases

All use cases will ensure that imagery will not exceed either 67,108,864 pixels (e.g., 4096 x 16384) or 1,024 tiles.

<ol><li>point wkt + zoom: This is the most common use of the service. Here you pass in a point WKT where the image will be centered and a standard zoom level. You also pass in the desired dimensions of the image you want returned.</li><li>polygon wkt: Here you pass a polygon in the WKT parameter that you want covered by the returned image. The service will calculate the deepest zoom level that covers the polygon with less than the maximum number of tiles (1,024).  The resulting bitmap will be fit to the minimum bounding rectangle (or MBR) for the polygon that was passed in the WKT parameter. Note that the Pixel dimensions of the resulting image are also determined by the service and cannot be specified.</li><li>polygon wkt + zoom: This is very similar to the previous case, but instead of the system selecting the optimal Zoom level, you specify it with the Zoom parameter. This allows you to scale the image.</li></ol>

### Request body

```json
{
 "content": {
  "application/json": {
   "examples": {
    "Default request": {
     "description": "Default request",
     "value": {
      "layer": "urban, urban-r, urban-g, wide-area, graysky",
      "wkt": "POLYGON ((-97.353029 37.683617, -97.346935 37.683617, -97.346935 37.687624, -97.353029 37.687624, -97.353029 37.683617))",
      "srid": 4326,
      "image-format": "png"
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
     "attribution": {
      "type": "boolean",
      "description": "Turns off the text overlay displaying copyright and attribution to Vexcel Imaging."
     },
     "bands": {
      "type": "string",
      "default": "rgb",
      "description": "The color bands in which the returned image will be comprised of.<br><br><i>Available values</i>: <ul><li><b>rgb</b> (default): Imagery is returned in red, green and blue bands. This matches the visible spectrum.</li><li><b>irg</b>: Imagery is returned in infrared, red and green bands. These bands are color-shifted: infrared is displayed as red, red is displayed as green and green is displayed as blue.</li></ul>",
      "enum": [
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
      "type": "integer",
      "format": "int32",
      "description": "The buffer around the wkt point or polygon (in pixels)."
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
      "description": "The method with which to crop the returned images based on the input wkt parameter.",
      "enum": [
       "bounding_box",
       "clip"
      ]
     },
     "crosshair": {
      "type": "string",
      "description": "The point coordinates in wkt format at which to draw a crosshair reticle."
     },
     "crosshair-color": {
      "type": "string",
      "description": "The color for the crosshair line. With format rgb(value of red, value of green, value of blue). Ex: rgb(255,128,0)"
     },
     "crosshair-line-width": {
      "type": "integer",
      "format": "int32",
      "description": "The width of the crosshair line."
     },
     "destination-dimensions": {
      "type": "string",
      "description": "Defines the dimensions (in pixels) of the output image frame. The requested region (as defined by wkt) will be centered within the image frame with two options fit or fill. Defined as destination-dimensions=width,height,fit|fill. See GET parameters for more details."
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
      "description": "The file format of the image. All formats have been compressed with jpeg compression of .95.<br><br><i>Available values</i>: <ul><li><b>jpeg</b>: Most performant, no georeferencing or transparency.</li><li><b>png</b>: No georefrencing, supports transparency.</li><li><b>tiff</b>: Least performant, supports georeferencing and transparency.</li><li><b>jpeg/png</b> (default): Either jpeg or png may be returned. Selected automatically based on the presense of transparent pixels in the source image.</li></ul>",
      "enum": [
       "jpeg",
       "png",
       "tiff",
       "jpeg/png"
      ]
     },
     "include": {
      "type": "string",
      "description": "Selects which extra metadata fields appear in the xmp metadata of the imagery.",
      "enum": [
       "estimate-date"
      ]
     },
     "interpolation": {
      "type": "boolean",
      "default": false,
      "description": "Controls whether requests above the collection\u2019s maximum zoom level may return subdivided tiles.\n\nIf true, tiles at the maximum zoom level (e.g., max-zoom=21) can be split and served as higher zoom l
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
