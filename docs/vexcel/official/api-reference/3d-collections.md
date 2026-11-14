# 3d/collections

## GET /3d/collections

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| wkt | query | False | string | The well-known-text (point or polygon)  ⓘ Note: Information is returned only for real-world coordinates; WKTs that extend beyond ±180° longitude are accepted, but results are limited to the portion of the geometry that intersects valid Earth bounds. |
| srid | query | False | integer | The SRID code for the projection reference representing the coordinates of the given coordinates or WKT |
| spatial-operation | query | False | string | The spatial-query specifies the coverage requirement over the input wkt polygon in order to return an image. WKT points and lines will always use intersect and image-name will ignore this parameter |
| collection | query | False | string | The identifier of the collection which contains the desired data referred to as collection in metadata |
| capture-year | query | False | integer | The capture year of the tiles expressed with 4 digits |
| layer | query | False | string | The desired layer. If multiple layers are to be considered, separate the layer names with commas: 3d-cities, 3d-prototypes |
| min-first-capture-date | query | False | string | The date of the earliest acceptable first capture date. Collections with first capture date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-capture-date | query | False | string | The date of the latest acceptable first capture date. Collections with first capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-capture-date | query | False | string | The date of the earliest acceptable last capture date. Collections with last capture date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-capture-date | query | False | string | The date of the latest acceptable last capture date. Collections with last capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-first-publish-date | query | False | string | The date of the earliest acceptable first publish date. Collections with first publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-publish-date | query | False | string | The date of the latest acceptable first publish date. Collections with first publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-publish-date | query | False | string | The date of the earliest acceptable last publish date. Collections with last publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-publish-date | query | False | string | The date of the latest acceptable last publish date. Collections with last publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| metadata-format | query | False | string | The format language of the metadata response Allowed: json, xml |
| include | query | False | string | Fields to be included on the JSON result, separated by commas. Won't return anything if empty:  collection, first-capture-date, last-capture-date, min-gsd, max-gsd, avg-gsd, geometry, first-publish-date, last-publish-date, capture-year, product-type, pretty-name, area  |
| order-by | query | False | string | The method by which to order the coverages: default, first-capture-date-asc, first-capture-date-desc, last-capture-date-asc, last-capture-date-desc, first-publish-date-asc, first-publish-date-desc, last-publish-date-asc, last-publish-date-desc, avg-gsd-asc, avg-gsd-desc,area-asc, area-desc |
| total-records | query | False | integer | <p>Specifies the maximum number of records to return. This parameter reduce the total number of records matching the query.</p> </br><p><i><b>Note:</b> This parameter is useful to prevent unexpectedly large billable requests or to improve response times.</i></p> |
| page-size | query | False | integer | <p>Specifies the maximum number of records to return on each page of the response, up to a limit of 500. If page-size is omitted or exceeds 500, it defaults to 500. This parameter does not reduce the total number of records matching the query; it only controls how many records are returned per page. Smaller page-size values will result in more pages.</p> </br><p><i><b>Note:</b> This parameter is useful to prevent unexpectedly large billable requests or to improve response times.</i></p> |
| page | query | False | integer | <p>Requests that would return more records than allowed by the <code>page-size</code> parameter are paginated. <code>total-records</code> and <code>total-pages</code> are included in the response header for page 1 only; they are not included in subsequent pages. <code>current-page</code> is included on all page headers. The initial request returns page 1 by default; to request page 2, append <code>page=2</code> to the original request (URL or POST body) and resend.</p> </br><p><i><b>Note:</b> Only records in the requested pages are reported for billing. For example, if a query contains 2 pages but <code>page=2</code> is never requested, only the records received in page 1 are reported for billing.</i></p> |

### Responses

- **200**: OK (application/json, application/xml, text/plain)
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

## POST /3d/collections

<i>Note: See the Schema section at the bottom of the page for POST parameters.</i>

### Request body

```json
{
 "content": {
  "application/json": {
   "examples": {
    "Coverage by wkt 4326": {
     "description": "Query coverages by wkt",
     "value": {
      "wkt": "POINT (-3.685913 40.383167)",
      "max-records": 1
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
     "capture-year": {
      "type": "integer",
      "format": "int32",
      "description": "The capture year of the tiles expressed with 4 digits",
      "minLength": 4,
      "writeOnly": true
     },
     "collection": {
      "type": "string",
      "description": "The identifier of the collection which contains the desired data referred to as collection in metadata"
     },
     "coverage-level": {
      "type": "string",
      "description": "The coverage level name"
     },
     "include": {
      "type": "string",
      "default": "collection, product-type, graysky-event, geometry",
      "description": "Fields to be included on the JSON result, separated by commas. Won't return anything if empty:\nDefault values: geometry,product-type,collection,graysky-event\nAccepted values: layer, collection, graysky-event, first-capture-date, last-capture-date,min-gsd, max-gsd, avg-gsd, geometry, first-publish-date,\nlast-publish-date, capture-year, product-type, pretty-name, max-zoom, camera-technology, area, z-index",
      "enum": [
       "layer",
       "collection",
       "graysky-event",
       "first-capture-date",
       "last-capture-date",
       "min-gsd",
       "max-gsd",
       "geometry",
       "first-publish-date",
       "last-publish-date",
       "capture-year",
       "product-type",
       "pretty-name",
       "max-zoom",
       "camera-technology",
       "area",
       "z-index"
      ]
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
     "metadata-format": {
      "type": "string",
      "default": "json",
      "description": "The format language of the metadata response:<br><br><i>Default Value</i>: json<br><i>Available values</i>: json, xml",
      "enum": [
       "json",
       "xml"
      ]
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
     "ogcfeatureId": {
      "type": "string",
      "writeOnly": true
     },
     "order-by": {
      "type": "string",
      "default": "default",
      "description": "The method by which to order the coverages. ```layer``` value will order the results by the order provided in the layer parameter",
      "enum": [
       "default",
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
       "occlusion-estimate-asc",
       "occlusion-estimate-desc",
       "occlusion-score-asc",
       "occlusion-score-desc",
       "layer-asc",
       "layer-desc"
      ]
     },
     "page": {
      "type": "integer",
      "format": "int32",
      "default": 1,
      "description": "<p>Requests that would return more records than allowed by the <code>page-size</code> parameter are paginated. <code>total-records</code> and <code>total-pages</code> are included in the response header for page 1 only; they are not included in subsequent pages. <code>current-page</code> is included on all page 
```

### Responses

- **200**: OK (application/json, application/xml, text/plain)
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
