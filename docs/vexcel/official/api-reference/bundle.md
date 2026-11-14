# bundle

## POST /bundle/generate

<i>Note: See the Schema section at the bottom of the page for POST parameters.</i>

### Request body

```json
{
 "content": {
  "application/json": {
   "examples": {
    "Generate Bundle Service": {
     "description": "GenerateBundle Service",
     "value": {
      "wkt": "POINT (-97.335777 37.691699)",
      "srid": 4326,
      "buffer-meter": "max"
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
     "buffer-meter": {
      "type": "string",
      "description": "Available values: \n\n{number} - Numeric values (decimals allowed) representing the buffer distance in meters. One value will apply to both width and height. \n\nmax - default - The system will determine the largest buffer within the user\u2019s allowed maximum geofence size. "
     },
     "reject-incomplete": {
      "type": "boolean",
      "format": "boolean",
      "default": false,
      "description": "Indicates whether to reject incomplete bundles"
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

- **200**: OK (application/json)
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
