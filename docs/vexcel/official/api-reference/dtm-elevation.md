# dtm/elevation

## GET /dtm/elevation

**Returns DTM elevation metadata in meters.**

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| wkt | query | True | string | The well-known-text (WKT) representation of the requested point, line or polygon.    ⓘ Note: Information is returned only for real-world coordinates; WKTs that extend beyond ±180° longitude are accepted, but results are limited to the portion of the geometry that intersects valid Earth bounds. |
| srid | query | False | string | The spatial reference identification code for the projection representing the coordinates of the given WKT. If undefined, 4326 will be used. Only EPSG is supported. Allowed: 4326, 3857 |
| dem-priority | query | False | string | Determines which digital elevation model to use by the API service. Mutiple values may be passed in a comma-separated list, we will use these values in the order they are provided. The dem that was used will be reported in the service response with an object named dem-priority.<br><br>Available values: (listed in order of accuracy)<br><ul><li><b>```vexcel-dtm```</b><i> - generated with Vexcel’s wide-area imagery</i></li><li><b>```public-dtm```</b><i> - comprised of a variety of public dtm datasets, accuracy is highly variable</i></li></ul> |
| unit-system | query | False | string | Determines the unitary system in which values are returned. Allowed: metric, imperial |

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

## POST /dtm/elevation

**Returns DTM elevation metadata in meters.**

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
      "wkt": "POLYGON((-97.4536 37.6398, -97.0034 37.6398, -97.0034 37.7217, -97.4536 37.7217, -97.4536 37.6398))",
      "srid": 4326,
      "dem-priority": "vexcel-dtm,public-dtm"
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
     "dem-priority": {
      "type": "array",
      "default": "vexcel-dtm, public-dtm",
      "description": "List of accuracy",
      "enum": [
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
     "srid": {
      "type": "integer",
      "format": "int32",
      "default": 4326,
      "description": "The SRID code for the projection reference representing the coordinates of the given coordinates or WKT"
     },
     "unit-system": {
      "type": "string",
      "default": "metric",
      "description": "Determines the unitary system in which values are returned.",
      "enum": [
       "metric",
       "imperial"
      ]
     },
     "wkt": {
      "type": "string",
      "description": "The well-known-text (point or polygon)"
     }
    }
   }
  }
 }
}
```

### Responses

- **200**: OK (application/json, application/xml)
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
