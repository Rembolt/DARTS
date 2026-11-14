# ortho/tile

## GET /ortho/tile

**Returns an ortho image containing the provided tile**

### Introduction

This service will take x/y coordinates and deliver one Orthomosaic tile from Vexcel’s high-resolution multi-sensor orthorectified image library. This service is intended for third party mapping applications to display continuous imagery without the need to display large discrete images.

<lu><li>GIS Basemaps</li><li>Feature Digitization (tracing)</li><li>Natural Disaster Assessment</li><li>Accurate true distances and areas</li><li>Urban Change Detection</li></lu>
<img src="../resources/img/docs/ortho_tile.png"/>

### Technical Details

The service is accessed by specifying the zoom level and tile coordinates (x,y) according to WMTS (Web Map Tile Service) specifications. The tiles returned will be WMTS-conforming, 256x256 pixels at variable resolution (7.5cm - 20cm) in 24-bit JPEG or 32-bit PNG format. All tiles will align perfectly with other Vexcel data (DSM/DTM tiles, Near-Infrared tiles, etc.) as well as tiled data from other 3rd party WMTS-conforming services.

 ℹ️ *Each tile contains the header object cache-control: max-age, set to 21515 seconds or roughly 6 hours. max-age can be used by the end client to reduce the number of times the same tile is downloaded within a single user session.*

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| layer | query | False | string | The name of the desired layer.<br><b>Allowed values</b>: <i>urban, urban-r, urban-g, wide-area, graysky</i> |
| zoom | query | True | integer | The zoom level of the tile (between 0 and 23). |
| tile-x | query | True | integer | The x coordinate of the tile. (Datum: ITRF2008). |
| tile-y | query | True | integer | The y coordinate of the tile. (Datum: ITRF2008). |
| graysky-event | query | False | string | The event name of the Graysky event (e.g. us-fl-ian-hurricane). |
| collection | query | False | string | The identifier of the AOI (Area of Interest) which contains the desired imagery. |
| product-type | query | False | string | The product type of the image returned.The type of ortho product of the image returned. Throughout our production process, we produce several ortho products. This table outlines the current production level indicated by the product-type response value.               <table border="1">                <thead>                  <tr>                    <th><b>&nbsp;Production Progression* ↓&nbsp;&nbsp;&nbsp; \ &nbsp;&nbsp;&nbsp; Layer → </b></th>                    <th><b>&nbsp;urban</b></th>                    <th><b>&nbsp;urban-r</b></th>                    <th><b>&nbsp;wide-area</b></th>                    <th><b>&nbsp;graysky<sup>†</sup></b></th>                    <th><b>&nbsp;graysky-g<sup>†</sup></b></th>                    <th><b>&nbsp;urban-g<sup>†</sup></b></th>                  </tr>                </thead>                <tbody>                  <tr>                    <td><b>&nbsp;Imagery Ingested</b></td>                    <td>&nbsp;first-ortho</td>                    <td>&nbsp;first-ortho</td>                    <td>&nbsp;first-ortho</td>                    <td>&nbsp;first-ortho</td>                    <td>&nbsp;first-ortho</td>                    <td>&nbsp;first-ortho</td>                  </tr>                  <tr>                    <td><b>&nbsp;Aerial Triangulated and Color Balanced</b></td>                    <td>&nbsp;quick-ortho</td>                    <td>&nbsp;final-ortho</td>                    <td>&nbsp;quick-ortho</td>                    <td>&nbsp;quick-ortho</td>                    <td>&nbsp;quick-ortho</td>                    <td>&nbsp;quick-ortho</td>                  </tr>                  <tr>                    <td><b>&nbsp;Natively Orthorectified<sup>‡</sup></b></td>                    <td>&nbsp;dxm-ortho</td>                    <td></td>                    <td>&nbsp;dxm-ortho</td>                    <td></td>                    <td></td>                    <td></td>                  </tr>                  <tr>                    <td><b>&nbsp;Water Edited and Manual Quality Reviewed</b></td>                    <td>&nbsp;final-ortho</td>                    <td></td>                    <td>&nbsp;final-ortho</td>                    <td></td>                    <td></td>                    <td></td>                  </tr>                </tbody>              </table>              <br>&nbsp;&nbsp;* <i>The production steps are chronological; each step includes all processes above it.</i>              <br>&nbsp;&nbsp;<sup>†</sup> <i>graysky, graysky-g and urban-g only have first-ortho and quick-ortho statuses. They do not have dxm-ortho or final-ortho. </i>              <br>&nbsp;&nbsp;<sup>‡</sup><i>Native Orthorectification refers to imagery rectified using a DEM generated from the same aerial image collection, ensuring alignment with the terrain as captured.</i> |
| order-by | query | False | string | In the case that more than one tile matches the input parameters, <code>order-by</code> will define the method by which the potential tiles are ordered. This parameter can take multiple values, separated by commas, and will honor them in the order in which they are defined.<br><br><b>Allowed values</b>: <i><code>layer-asc</code>, <code>layer-desc</code>, <code>collection-first-capture-date-asc</code>, <code>collection-first-capture-date-desc</code>, <code>collection-last-capture-date-asc</code>, <code>collection-last-capture-date-desc</code>, <code>collection-first-publish-date-asc</code>, <code>collection-first-publish-date-desc</code>, <code>collection-last-publish-date-asc</code>, <code>collection-last-publish-date-desc</code>, <code>collection-avg-gsd-asc</code>, <code>collection-avg-gsd-desc</code>, <code>collection-area-asc</code>, <code>collection-area-desc</code></i><br><br><i><b>Note</b>: <code>layer-asc</code> and <code>layer-desc</code> will respect the order of layers as defined in the <code>layer</code> parameter, if <code>layer</code> is undefined the default ordering won´t include these values. They can however still be explicitly asked for within <code>order-by</code>, but doing so will cause the ordering to appear to be random.</i><br><br><i>Default value: <code>layer-asc</code>, <code>collection-last-capture-date-desc</code>, <code>image-center-distance-asc</code></i> |
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
| image-format | query | False | string | The file format of the image. All formats have been compressed with jpeg compression of .95.<br><br><i>Available values</i>: <ul><li><b>jpeg</b>: Most performant, no georeferencing or transparency.</li><li><b>png</b>: No georefrencing, supports transparency.</li><li><b>tiff</b>: Least performant, supports georeferencing and transparency.</li><li><b>jpeg/png</b> (default): Either jpeg or png may be returned. Selected automatically based on the presense of transparent pixels in the source image.</li></ul> |
| no-content | query | False | string | Defines the error-handling method when a tile is unable to be returned and no filtering parameters<sup><b>&#x0204e;</b></sup> were used.<br><br><i>Available values</i>: <ul><li><b>404</b> (default): "message": "No image matching the provided parameters found"</li><li><b>204</b>: "message": "The operation was successful, but no image is available"</li></ul><i><sup><b>&#x0204e;</b></sup> Filtering parameters: collection, graysky-event, collect-year, min-first-capture-date, min-first-publish-date, min-last-capture-date, min-last-publish-date, max-first-capture-date, max-first-publish-date, max-last-capture-date, or max-last-publish-date Allowed: 204, 404 |
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

## POST /ortho/tile

**Returns an ortho image containing the provided tile**

### Introduction

This service will take x/y coordinates and deliver one Orthomosaic tile from Vexcel’s high-resolution multi-sensor orthorectified image library. This service is intended for third party mapping applications to display continuous imagery without the need to display large discrete images.

<lu><li>GIS Basemaps</li><li>Feature Digitization (tracing)</li><li>Natural Disaster Assessment</li><li>Accurate true distances and areas</li><li>Urban Change Detection</li></lu>
<img src="../resources/img/docs/ortho_tile.png"/>

### Technical Details

The service is accessed by specifying the zoom level and tile coordinates (x,y) according to WMTS (Web Map Tile Service) specifications. The tiles returned will be WMTS-conforming, 256x256 pixels at variable resolution (7.5cm - 20cm) in 24-bit JPEG or 32-bit PNG format. All tiles will align perfectly with other Vexcel data (DSM/DTM tiles, Near-Infrared tiles, etc.) as well as tiled data from other 3rd party WMTS-conforming services.

 ℹ️ *Each tile contains the header object cache-control: max-age, set to 21515 seconds or roughly 6 hours. max-age can be used by the end client to reduce the number of times the same tile is downloaded within a single user session.*

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
      "zoom": 18,
      "tile-x": 60346,
      "tile-y": 101416
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
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
       "jpeg/png",
       "b3dm/glb"
      ]
     },
     "interpolation": {
      "type": "boolean",
      "default": false,
      "description": "Controls whether requests above the collection\u2019s maximum zoom level may return subdivided tiles.\n\nIf true, tiles at the maximum zoom level (e.g., max-zoom=21) can be split and served as higher zoom levels (e.g., 22+). Each interpolated tile contains 256 \u00d7 256 pixels, but only the portion derived from the original data (e.g., \u00bc of the tile) is counted toward billing and reporting.\n\nIf false, requests above the maximum zoom level will not return tiles."
     },
     "layer": {
      "type": "string",
      "description": "The desired layer. If multiple layers are to be considered, separate the layer names with commas:<br><br><i>Available values</i>: urban, urban-r, urban-g, wide-area, graysky, graysky-g",
      "enum": [
       "urban",
       "urban-r",
       "urban-g",
       "wide-area",
       "graysky",
       "graysky-g"
      ]
     },
     "max-first-capture-date": {
      "type": "string",
      "format": "date-time",
      "description": "The date of the latest acceptable first capture date. Collections with first capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss)"
     },
     "max-first-publish-date": {
      "type": "string",
      "format": "date-time",
      "description": "The date of the latest acceptable first publish date. Collections with first publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss)"
     },
     "max-last-capture-date": {
      "type": "string",
      "format": "date-time",
      "description": "The date of the latest acceptable last capture date. Collections with last capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss)"
     },
     "max-last-publish-date": {
      "type": "string",
      "format": "date-time",
      "description": "The date of the latest acceptable last publish date. Collections with last publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss)"
     },
     "min-first-capture-date": {
      "type": "string",
      "format": "date-time",
      "description": "The date of the earliest acceptable first capture date. Collections with first capture date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss)"
     },
     "min-first-publish-date": {
      "type": "string",
      "format": "date-time",
      "description": "The date of the earliest acceptable first publish date. Collections with first publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss)"
     },
     "min-last-capture-date": {
      "type": "string",
      "format": "date-time",
      "description": "The date of the earliest acceptable last capture date. Collections with last capture date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss)"
     },
     "min-last-publish-date": {
      "type": "string",
      "format": "date-time",
      "description": "The date of the earliest acceptable last publish date. Collections with last publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss)"
     },
     "no-content": {
      "type": "string",
      "default": "404",
      "description": "Defines the error-handling method when a tile is unable to be returned.<br><br><i>Available values</i>: <ul><li><b>404</b> (default): \"message\": \"No image matching the provided parameters found\"</li><li><b>204</b>: \"message\": \"The operation was successful, but no image is available\"</li></ul>",
      "enum": [
       "204",
       "404"
      ]
     },
     "order-by": {
      "type": "string"
     },
     "product-type": {
      "type": "array",
      "items": {
       "type": "string"
      }
```

### Responses

- **200**: OK (image/jpeg, image/png, image/tiff)
- **204**: No Content (*/*)
- **400**: Bad Request (application/json)
- **401**: Authentication Failure (application/json)
- **403**: Forbidden (*/*)
- **404**: Not found (application/json)
- **412**: Precondition Failed (*/*)
- **413**: Payload Too Large (*/*)
- **422**: Unprocessable Entity (*/*)
- **429**: Too Many Requests (*/*)
- **500**: Internal Server Error (application/json)
- **503**: Service Unavailable (*/*)
