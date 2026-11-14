# dtm/extract

## GET /dtm/extract

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| wkt | query | True | string | The well-known-text (WKT) representation of the requested point, line or polygon. If a point is provided then either buffer or bbox-dimensions must also be used.    ⓘ Note: Information is returned only for real-world coordinates; WKTs that extend beyond ±180° longitude are accepted, but results are limited to the portion of the geometry that intersects valid Earth bounds. |
| srid | query | False | string | The spatial reference identification code for the projection representing the coordinates of the given WKT. If undefined, 4326 will be used. Only EPSG is supported. Allowed: 4326, 3857 |
| zoom | query | False | integer | The zoom level of the tiles to be used to construct the DTM 'image'. DTM tiles are available at levels 16 and greater.  If zoom is undefined, the service will use the highest-value zoom that results in an image equal to or smaller than 1024 tiles. |
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

## POST /dtm/extract

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
      "srid": 4326
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
     "srid": {
      "type": "integer",
      "format": "int32",
      "default": 4326,
      "description": "The SRID code for the projection reference representing the coordinates of the given coordinates or WKT"
     },
     "wkt": {
      "type": "string",
      "description": "The well-known-text (point or polygon)"
     },
     "zoom": {
      "type": "integer",
      "format": "int32",
      "description": "The zoom level of the tiles to be used to construct the DTM 'image'. DTM tiles are available at levels 16 and greater. \nIf zoom is undefined, the service will use the highest-value zoom that results in an image equal to or smaller than 1024 tiles."
     }
    }
   }
  }
 },
 "required": true
}
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
