# oriented/transform-points

## GET /oriented/transform-points

**Transforms real-world coordinates to discrete pixel locations or vice versa.**

### Introduction

This service will perform a coordinate transformation between world points (lng/lat) and pixel points within a oriented image. This transformation can occur in either direction:

<ul><li>world point to pixel point</li><li>pixel point to world point</li></ul>
This service is useful when identifying the exact location on Earth as represented in a oriented image’s pixel geometry or vice versa.

<img src="../resources/img/docs/oriented_transform_points.jpg"/>

### Technical Details

This service is accessed by specifying the transformation direction (operation), the oriented image (image-name), and coordinates (points). Because this service can transform points in either direction it is important to correctly pair the operation and point formats (e.g. if operation=world-2-pixel then points must be world points (lng, lat)). Pixel points are defined within an oriented image as the origin point (0,0) being the top-left corner of the image. Batch transformations can occur by providing more than one pair of points in a single service call.

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| operation | query | True | string | The transformation mode: World to pixel or Pixel to world Allowed: pixel-2-world, world-2-pixel |
| image-name | query | True | string | The name of the image |
| wkt | query | True | string | Input points in WKT format. X and Y values are required for World to Pixel and Pixel to World modes. Z values are only useful in World to Pixel mode and is optional. When no Z value is used the sevice calculates the height automatically.<br><br><i>World to Pixel examples:</i> <ul><li>POINT(-118.8327998 34.13360667)</li><li>POINTZ(-118.8327997 34.13360667 333.7173767089844)</li><li>LINESTRING(-118.8327998 34.13360667, -118.8327997 34.13360667 333.7173767089844)</li><li>LINESTRINGZ(-118.8327998 34.13360667 333.7173767089844, -118.8327997 34.13360667 333.7173767089844)</li></ul><i>Pixel to World examples:</i> <ul><li>POINT(10271 7008)</li><li>LINESTRING(10271 7008, 10272 7008)</li></ul> |
| srid | query | False | string | The SRID code for the projection reference representing the coordinates of the given coordinates or WKT Allowed: 4326, 3857 |
| metadata-format | query | False | string | The format language of the metadata response Allowed: xml, json, csv |
| dem-priority | query | False | string | Determines which digital elevation model to use by the API service. Mutiple values may be passed in a comma-separated list, we will use these values in the order they are provided. The dem that was used will be reported in the service response with an object named dem-priority.<br><br>Available values: (listed in order of accuracy)<br><ul><li><b>```vexcel-dsm```</b><i> - highest accuracy, generated with Vexcel’s urban imagery</i></li><li><b>```vexcel-dtm```</b><i> - generated with Vexcel’s wide-area imagery</i></li><li><b>```public-dtm```</b><i> - comprised of a variety of public dtm datasets, accuracy is highly variable</i></li><li><b>```flat-dtm```</b><i> - lowest accuracy, completely flat and containing no terrain variation</i></li></ul> |

### Responses

- **200**: OK (application/json, application/xml)
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

## POST /oriented/transform-points

**Transforms real-world coordinates to discrete pixel locations or vice versa.**

### Introduction

This service will perform a coordinate transformation between world points (lng/lat) and pixel points within a oriented image. This transformation can occur in either direction:

<ul><li>world point to pixel point</li><li>pixel point to world point</li></ul>
This service is useful when identifying the exact location on Earth as represented in a oriented image’s pixel geometry or vice versa.

<img src="../resources/img/docs/oriented_transform_points.jpg"/>

### Technical Details

This service is accessed by specifying the transformation direction (operation), the oriented image (image-name), and coordinates (points). Because this service can transform points in either direction it is important to correctly pair the operation and point formats (e.g. if operation=world-2-pixel then points must be world points (lng, lat)). Pixel points are defined within an oriented image as the origin point (0,0) being the top-left corner of the image. Batch transformations can occur by providing more than one pair of points in a single service call.

### Request body

```json
{
 "content": {
  "application/json": {
   "examples": {
    "Query by wkt": {
     "description": "Query by wkt",
     "value": {
      "operation": "world-2-pixel",
      "image-name": "2025~us-ks-wichita-2025~images~W_20250710_214540_60_2D4E51D083DDD0D_rgb",
      "wkt": "POINT(-97.231714 37.6812967)",
      "srid": 4326,
      "metadata-format": "JSON",
      "dem-priority": "vexcel-dsm"
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
     "dem-priority": {
      "type": "array",
      "default": "vexcel-dsm",
      "description": "The transformation precision: vexcel-dsm, vexcel-dtm, public-dtm or flat-dtm",
      "enum": [
       "vexcel-dsm",
       "vexcel-dtm",
       "public-dtm",
       "flat-dtm"
      ],
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
     "image-name": {
      "type": "string",
      "description": "The image name(s) for the image(s)"
     },
     "metadata-format": {
      "type": "string",
      "default": "JSON",
      "description": "The format language of the metadata response:<br><br><i>Default Value</i>: json<br><i>Available values</i>: json, xml",
      "enum": [
       "json",
       "xml"
      ]
     },
     "operation": {
      "type": "string",
      "description": "The transformation mode: World to pixel or Pixel to world",
      "enum": [
       "pixel-2-world",
       "world-2-pixel"
      ]
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
     }
    }
   }
  }
 },
 "required": true
}
```

### Responses

- **200**: OK (application/json, application/xml)
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
