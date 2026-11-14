# dsm/elevation

## GET /dsm/elevation

**Returns DTM elevation metadata in meters.**

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| wkt | query | True | string | The well-known-text (WKT) representation of the requested point, line or polygon.    ⓘ Note: Information is returned only for real-world coordinates; WKTs that extend beyond ±180° longitude are accepted, but results are limited to the portion of the geometry that intersects valid Earth bounds. |
| srid | query | False | string | The spatial reference identification code for the projection representing the coordinates of the given WKT. If undefined, 4326 will be used. Only EPSG is supported. Allowed: 4326, 3857 |
| layer | query | True | string | The name of the desired layer.<br><b>Allowed values</b>: <i>urban,  wide-area</i> |
| collection | query | False | string | The identifier of the collection which contains the desired data referred to as collection in metadata |
| collect-year | query | False | integer | The collection year of the tiles expressed with 4 digits |
| min-first-capture-date | query | False | string | The date of the earliest acceptable first capture date. Collections with first capture date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-capture-date | query | False | string | The date of the latest acceptable first capture date. Collections with first capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-capture-date | query | False | string | The date of the earliest acceptable last capture date. Collections with last capture date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-capture-date | query | False | string | The date of the latest acceptable last capture date. Collections with last capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-first-publish-date | query | False | string | The date of the earliest acceptable first publish date. Collections with first publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-publish-date | query | False | string | The date of the latest acceptable first publish date. Collections with first publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-publish-date | query | False | string | The date of the earliest acceptable last publish date. Collections with last publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-publish-date | query | False | string | The date of the latest acceptable last publish date. Collections with last publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| order-by | query | False | string | In the case that more than one image matches the input parameters, <code>order-by</code> will define the method by which the potential images are ordered. This parameter can take multiple values, separated by commas, and will honor them in the order in which they are defined.<br><br><b>Allowed values</b>: <i><code>layer-asc</code>, <code>layer-desc</code>, <code>collection-first-capture-date-asc</code>, <code>collection-first-capture-date-desc</code>, <code>collection-last-capture-date-asc</code>, <code>collection-last-capture-date-desc</code>, <code>collection-first-publish-date-asc</code>, <code>collection-first-publish-date-desc</code>, <code>collection-last-publish-date-asc</code>, <code>collection-last-publish-date-desc</code>, <code>collection-avg-gsd-asc</code>, <code>collection-avg-gsd-desc</code>, <code>collection-area-asc</code>, <code>collection-area-desc</code></i><br><br><i><b>Note</b>: <code>layer-asc</code> and <code>layer-desc</code> will respect the order of layers as defined in the <code>layer</code> parameter, if <code>layer</code> is undefined the default ordering won´t include these values. They can however still be explicitly asked for within <code>order-by</code>, but doing so will cause the ordering to appear to be random.</i><br><br><i>Default value: <code>layer-asc</code>, <code>collection-last-capture-date-desc</code>, <code>collection-avg-gsd-asc</code></i> |
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

## POST /dsm/elevation

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
      "layer": "urban,  wide-area"
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
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
