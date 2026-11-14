# structure/tile

## GET /structure/style

**Get Structures Style**

Get style for structures tiles

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| style | query | True | string | Requested Style  ### Technical Details  The service is accessed by specifying the zoom level and tile coordinates (x,y) according to WMTS (Web Map Tile Service) specifications. The tiles returned will be WMTS-conforming, 256x256 pixel equivalent. All tiles will align perfectly with other Vexcel data (DSM/DTM tiles, Near-Infrared tiles, etc.) as well as tiled data from other 3rd party WMTS-conforming services. The tiles will be returned in Google Protocol Buffers (protobuf) format.Tiles are only available for zoom levels 1 - 16, zoom 16 tiles contain adequate detail even when overlaid on higher-zoom imagery.  |

### Responses

- **200**: OK (application/json)
- **400**: Bad Request (*/*)
- **401**: Unauthorized (*/*)
- **404**: Not Found (*/*)
- **413**: Payload Too Large (*/*)
- **500**: Internal Server Error (*/*)

## POST /structure/style

**Get Structures Style**

Get style for structures tiles

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| style | query | True | string | Requested Style  ### Technical Details  The service is accessed by specifying the zoom level and tile coordinates (x,y) according to WMTS (Web Map Tile Service) specifications. The tiles returned will be WMTS-conforming, 256x256 pixel equivalent. All tiles will align perfectly with other Vexcel data (DSM/DTM tiles, Near-Infrared tiles, etc.) as well as tiled data from other 3rd party WMTS-conforming services. The tiles will be returned in Google Protocol Buffers (protobuf) format.Tiles are only available for zoom levels 1 - 16, zoom 16 tiles contain adequate detail even when overlaid on higher-zoom imagery.  |

### Responses

- **200**: OK (application/json)
- **400**: Bad Request (*/*)
- **401**: Unauthorized (*/*)
- **404**: Not Found (*/*)
- **413**: Payload Too Large (*/*)
- **500**: Internal Server Error (*/*)

## GET /structure/tile

**/tile**

### Introduction

This service will take x/y coordinates and deliver one vector tile from Vexcel’s precomputed Elements: Structures library. This service is intended for third party mapping applications to display continuous structure geometries without the need to request each individual footprint. Structure geometries contained within these tiles will only contain those that are most-recently computed; structures from new collections will overwrite those from older collections.  This service is particularly useful for:

<ul><li>GIS basemaps</li><li>Neighborhood visualization</li></ul>
<img src="../resources/img/docs/structure-tile.png"/>

### Technical Details

The service is accessed by specifying the zoom level and tile coordinates (x,y) according to WMTS (Web Map Tile Service) specifications. The tiles returned will be WMTS-conforming, 256x256 pixel equivalent. All tiles will align perfectly with other Vexcel data (DSM/DTM tiles, Near-Infrared tiles, etc.) as well as tiled data from other 3rd party WMTS-conforming services. The tiles will be returned in Google Protocol Buffers (protobuf) format.

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| zoom | query | True | integer | Requested zoom |
| tile-x | query | True | integer | Requested tile X |
| tile-y | query | True | integer | Requested tile Y |

### Responses

- **200**: OK (application/octet-stream)
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

## POST /structure/tile

**/tile**

### Introduction

This service will take x/y coordinates and deliver one vector tile from Vexcel’s precomputed Elements: Structures library. This service is intended for third party mapping applications to display continuous structure geometries without the need to request each individual footprint. Structure geometries contained within these tiles will only contain those that are most-recently computed; structures from new collections will overwrite those from older collections.  This service is particularly useful for:

<ul><li>GIS basemaps</li><li>Neighborhood visualization</li></ul>
<img src="../resources/img/docs/structure-tile.png"/>

### Technical Details

The service is accessed by specifying the zoom level and tile coordinates (x,y) according to WMTS (Web Map Tile Service) specifications. The tiles returned will be WMTS-conforming, 256x256 pixel equivalent. All tiles will align perfectly with other Vexcel data (DSM/DTM tiles, Near-Infrared tiles, etc.) as well as tiled data from other 3rd party WMTS-conforming services. The tiles will be returned in Google Protocol Buffers (protobuf) format.Tiles are only available for zoom levels 1 - 16, zoom 16 tiles contain adequate detail even when overlaid on higher-zoom imagery.

### Request body

```json
{
 "content": {
  "application/json": {
   "examples": {
    "Default request": {
     "description": "Default request",
     "value": {
      "zoom": 4,
      "tile-x": 3,
      "tile-y": 6
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
     "source": {
      "type": "string",
      "description": "Data from properties or vexcel-properties"
     },
     "tile-x": {
      "type": "integer",
      "format": "int32",
      "description": "The x coordinate of the tile. (Datum: WGS84)"
     },
     "tile-y": {
      "type": "integer",
      "format": "int32",
      "description": "The y coordinate of the tile. (Datum: WGS84)"
     },
     "zoom": {
      "type": "integer",
      "format": "int32",
      "description": "The zoom level of the tile (between 0 and 23)."
     }
    }
   }
  }
 },
 "required": true
}
```

### Responses

- **200**: OK (application/octet-stream)
- **400**: Bad Request (*/*)
- **401**: Unauthorized (*/*)
- **413**: Payload Too Large (*/*)
- **500**: Internal Server Error (*/*)
