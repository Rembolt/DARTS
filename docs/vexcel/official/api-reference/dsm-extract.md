# dsm/extract

## GET /dsm/extract

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| layer | query | True | string | The name of the desired layer.<br><b>Allowed values</b>: <i>urban, wide-area</i> |
| wkt | query | True | string | The well-known-text (WKT) representation of the requested point, line or polygon. If a point is provided then either buffer or bbox-dimensions must also be used.    ⓘ Note: Information is returned only for real-world coordinates; WKTs that extend beyond ±180° longitude are accepted, but results are limited to the portion of the geometry that intersects valid Earth bounds. |
| srid | query | False | string | The spatial reference identification code for the projection representing the coordinates of the given WKT. If undefined, 4326 will be used. Only EPSG is supported. Allowed: 4326, 3857 |
| collection | query | False | string | The identifier of the AOI (Area of Interest) which contains the desired imagery. |
| order-by | query | False | string | In the case that more than one image matches the input parameters, <code>order-by</code> will define the method by which the potential images are ordered. This parameter can take multiple values, separated by commas, and will honor them in the order in which they are defined.<br><br><b>Allowed values</b>: <i><code>layer-asc</code>, <code>layer-desc</code>, <code>collection-first-capture-date-asc</code>, <code>collection-first-capture-date-desc</code>, <code>collection-last-capture-date-asc</code>, <code>collection-last-capture-date-desc</code>, <code>collection-first-publish-date-asc</code>, <code>collection-first-publish-date-desc</code>, <code>collection-last-publish-date-asc</code>, <code>collection-last-publish-date-desc</code>, <code>collection-avg-gsd-asc</code>, <code>collection-avg-gsd-desc</code>, <code>collection-area-asc</code>, <code>collection-area-desc</code></i><br><br><i><b>Note</b>: <code>layer-asc</code> and <code>layer-desc</code> will respect the order of layers as defined in the <code>layer</code> parameter, if <code>layer</code> is undefined the default ordering won´t include these values. They can however still be explicitly asked for within <code>order-by</code>, but doing so will cause the ordering to appear to be random.</i><br><br><i>Default value: <code>layer-asc</code>, <code>collection-last-capture-date-desc</code>, <code>image-center-distance-asc</code></i> |
| collect-year | query | False | integer | The year of collection. |
| min-first-capture-date | query | False | string | The date of the earliest acceptable first capture date. Collections with first capture date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-capture-date | query | False | string | The date of the latest acceptable first capture date. Collections with first capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-capture-date | query | False | string | The date of the earliest acceptable last capture date. Collections with last capture date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-capture-date | query | False | string | The date of the latest acceptable last capture date. Collections with last capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-first-publish-date | query | False | string | The date of the earliest acceptable first publish date. Collections with first publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-publish-date | query | False | string | The date of the latest acceptable first publish date. Collections with first publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-publish-date | query | False | string | The date of the earliest acceptable last publish date. Collections with last publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-publish-date | query | False | string | The date of the latest acceptable last publish date. Collections with last publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| zoom | query | False | integer | The zoom level of the tiles to be used to construct the DSM 'image'. DSM tiles are available at levels 16 and greater.  If zoom is undefined, the service will use the highest-value zoom that results in an image equal to or smaller than 1024 tiles. |
| bbox-dimensions | query | False | string | Defines the dimensions (in meters) of the bounding box of the region surrounding your input point wkt. The point will be the center of the bounding box. Defined as bbox-dimensions=width,height. |
| destination-dimensions | query | False | string | Defines the pixel dimensions of the output image frame, and how the requested wkt region is mapped into it. The WKT region is always centered within the frame and image resampling will be applied; it’s recommended to omit the zoom parameter when using destination-dimensions.  Defined as destination-dimensions=width,height,fit\|fill.<ul><li>fit - the requested wkt region (red) is scaled to fit entirely within the destination-dimensions output frame (yellow). Use the crop parameter to control whether the area outside the WKT but inside the frame is filled with black pixels or additional image pixels.<br><img src="../resources/img/docs/extract_fit.png"/></li><li>fill - the requested wkt region (red) is scaled to entirely fill the output frame (yellow). No pixels outside the WKT will be included, and some pixels within the WKT may be excluded.<br><img src="../resources/img/docs/extract_fill.png"/></li></ul> *Note: Example images are from the ortho/extract service and may not reflect exact pixels for this service.* |
| buffer-meter | query | False | number | The buffer around the wkt point or polygon (in meters). |
| buffer-pixel | query | False | integer | The buffer around the wkt point or polygon (in pixels). |
| crop | query | False | string | The method with which to crop the returned images based on the input wkt parameter. Will not work with image-name. Allowed: bounding_box, clip |

### Responses

- **200**: OK (image/tiff)
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

## POST /dsm/extract

<i>Note: See the Schema section at the bottom of the page for POST parameters.</i>

### Request body

```json
{
 "content": {
  "application/json": {
   "examples": {
    "Default request": {
     "description": "Default request",
     "value": {
      "wkt": "POLYGON ((-97.353029 37.683617, -97.346935 37.683617, -97.346935 37.687624, -97.353029 37.687624, -97.353029 37.683617))",
      "srid": 4326,
      "layer": "urban,  wide-area"
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
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
     "destination-dimensions": {
      "type": "string",
      "description": "Defines the dimensions (in pixels) of the output image frame. The requested region (as defined by wkt) will be centered within the image frame with two options fit or fill. Defined as destination-dimensions=width,height,fit|fill. See GET parameters for more details."
     },
     "layer": {
      "type": "string",
      "description": "The desired layer. If multiple layers are to be considered, separate the layer names with commas:<br><br><i>Available values</i>: urban, urban-r, urban-g, wide-area",
      "enum": [
       "urban",
       "urban-r",
       "urban-g",
       "wide-area"
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
     "order-by": {
      "type": "string",
      "default": "default",
      "description": "The method by which to order the coverages. ```layer``` value will order the results by the order provided in the layer parameter",
      "enum": [
       "first-capture-date-asc",
       "first-capture-date-desc",
       "last-capture-date-asc",
       "last-capture-date-desc",
       "first-publish-date-asc",
       "first-publish-date-desc",
       "last-publish-date-asc",
       "last-publish-date-desc",
       "avg-gsd-asc",
       "avg-gsd-desc",
       "area-asc",
       "area-desc",
       "layer-asc",
       "layer-desc"
      ]
     },
     "orthoStatus": {
      "type": "array",
      "items": {
       "type": "string",
       "enum": [
        "oblique-north",
        "oblique-south",
        "oblique-east",
        "oblique-west",
        "nadir",
        "I",
        "draft-ortho",
        "quick-ortho",
        "spherical-ortho",
        "raw-ortho",
        "first-ortho",
        "ortho-correction",
        "dtm",
        "dsm",
        "public-dtm-1m",
        "public-dtm-10m",
        "public-dtm-30m",
        "3d",
        "vector",
        "properties",
        "vexcel-properties",
        "damages",
        "masks",
        "embedding"
       ]
      }
     },
     "srid": {
      "type": "integer",
      "format": "int32",
      "default": 4326,
      "description": "The SRID code for the pr
```

### Responses

- **200**: OK (image/tiff)
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
