# Tile

## GET /damage/structure/style

**Get Damage Style**

Get Style for damage tile layer

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| style | query | True | string | Requested Style  ### Technical Details  The service is accessed by specifying the zoom level and tile coordinates (x,y) according to WMTS (Web Map Tile Service) specifications. The tiles returned will be WMTS-conforming, 256x256 pixel equivalent. All tiles will align perfectly with other Vexcel data (DSM/DTM tiles, Near-Infrared tiles, etc.) as well as tiled data from other 3rd party WMTS-conforming services. The tiles will be returned in Google Protocol Buffers (protobuf) format. |

### Responses

- **200**: OK (application/json)
- **400**: Bad Request (*/*)
- **401**: Unauthorized (*/*)
- **404**: Not Found (*/*)
- **413**: Payload Too Large (*/*)
- **500**: Internal Server Error (*/*)

## POST /damage/structure/style

**Get Damage Style**

Get Style for damage tile layer

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| style | query | True | string | Requested Style  ### Technical Details  The service is accessed by specifying the zoom level and tile coordinates (x,y) according to WMTS (Web Map Tile Service) specifications. The tiles returned will be WMTS-conforming, 256x256 pixel equivalent. All tiles will align perfectly with other Vexcel data (DSM/DTM tiles, Near-Infrared tiles, etc.) as well as tiled data from other 3rd party WMTS-conforming services. The tiles will be returned in Google Protocol Buffers (protobuf) format. |

### Responses

- **200**: OK (application/json)
- **400**: Bad Request (*/*)
- **401**: Unauthorized (*/*)
- **404**: Not Found (*/*)
- **413**: Payload Too Large (*/*)
- **500**: Internal Server Error (*/*)

## GET /damage/structure/tile

**/structure/tile**

### Introduction

This service will take x/y coordinates and deliver one vector tile from Vexcel’s precomputed Elements: Damage library. This service is intended for third party mapping applications to display continuous structure-damage geometries without the need to request each individual footprint. Structure geometries contained within these tiles will only contain those that are most-recently computed; structures from new collections will overwrite those from older collections. This service is particularly useful for:

<ul><li>Quickly assess individual properties after a catastrophe</li><li>Triage neighborhoods for those that are most affected by the catastrophy</li></ul>
<img src="../resources/img/docs/damage-structure-tile.png"/>

### Technical Details

The service is accessed by specifying the zoom level and tile coordinates (x,y) according to WMTS (Web Map Tile Service) specifications. The tiles returned will be WMTS-conforming, 256x256 pixel equivalent. All tiles will align perfectly with other Vexcel data (DSM/DTM tiles, Near-Infrared tiles, etc.) as well as tiled data from other 3rd party WMTS-conforming services. The tiles will be returned in Google Protocol Buffers (protobuf) format. Tiles are only available for zoom levels 1 - 16, zoom 16 tiles contain adequate detail even when overlaid on higher-zoom imagery. 

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| zoom | query | True | integer | Requested zoom |
| tile-x | query | True | integer | Requested tile X |
| tile-y | query | True | integer | Requested tile Y |
| layer | query | False | string | Layer Allowed: graysky, graysky-g |
| collection | query | False | string | The identifier of the collection |
| graysky-event | query | False | string | The event name of the Graysky collection event |

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

## POST /damage/structure/tile

**/structure/tile**

### Introduction

This service will take x/y coordinates and deliver one vector tile from Vexcel’s precomputed Elements: Damage library. This service is intended for third party mapping applications to display continuous structure-damage geometries without the need to request each individual footprint. Structure geometries contained within these tiles will only contain those that are most-recently computed; structures from new collections will overwrite those from older collections. This service is particularly useful for:

<ul><li>Quickly assess individual properties after a catastrophe</li><li>Triage neighborhoods for those that are most affected by the catastrophy</li></ul>
<img src="../resources/img/docs/damage-structure-tile.png"/>

### Technical Details

The service is accessed by specifying the zoom level and tile coordinates (x,y) according to WMTS (Web Map Tile Service) specifications. The tiles returned will be WMTS-conforming, 256x256 pixel equivalent. All tiles will align perfectly with other Vexcel data (DSM/DTM tiles, Near-Infrared tiles, etc.) as well as tiled data from other 3rd party WMTS-conforming services. The tiles will be returned in Google Protocol Buffers (protobuf) format. Tiles are only available for zoom levels 1 - 16, zoom 16 tiles contain adequate detail even when overlaid on higher-zoom imagery. 

### Request body

```json
{
 "content": {
  "application/json": {
   "examples": {
    "Default request": {
     "description": "Default request",
     "value": {
      "zoom": 14,
      "tile-x": 3771,
      "tile-y": 6338
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
     "collection": {
      "type": "string",
      "description": "The identifier of the collection which contains the desired data referred to as collection in metadata"
     },
     "graysky-event": {
      "type": "string",
      "description": "The event name of the Graysky collection event"
     },
     "layer": {
      "type": "string",
      "description": "The desired layer"
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
