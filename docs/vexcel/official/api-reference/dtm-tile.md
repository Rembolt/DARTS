# dtm/tile

## GET /dtm/tile

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| zoom | query | True | integer | The zoom level of the tile (between 16 and 23) |
| tile-x | query | True | integer | The x coordinate of the tile. (Datum: ITRF2008) |
| tile-y | query | True | integer | The y coordinate of the tile. (Datum: ITRF2008) |

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

## POST /dtm/tile

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
      "zoom": 18,
      "tile-x": 60346,
      "tile-y": 101416
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
     "order-by": {
      "type": "string"
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
