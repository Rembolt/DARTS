# Coverage

## GET /damage/collections

**/collections**

Returns a list of Damage coverage

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| wkt | query | False | string | The well-known-text (point or polygon)  ⓘ Note: Information is returned only for real-world coordinates; WKTs that extend beyond ±180° longitude are accepted, but results are limited to the portion of the geometry that intersects valid Earth bounds. |
| srid | query | False | integer | The SRID code for the projection reference representing the coordinates of the given coordinates or WKT |
| spatial-operation | query | False | string | The spatial-query used to specify which collections to select based on their relationship to the user’s input wkt.  **Note**: This parameter will be ignored if:<ul><li>**wkt** is defined as a point or line</li></ul>  <i>Available values</i>: <ul><li>intersect (default): collections must intersect with the input wkt to be returned.</li><li>within-wkt: collections must be completely contained within the input wkt to be returned. </li><li>covers-wkt: collections must cover the input wkt entirely to be returned.</li></ul> Allowed: intersect, covers-wkt, within-wkt |
| collection | query | False | string | The identifier of the collection which contains the desired data referred to as collection in metadata |
| graysky-event | query | False | string | The event name of the Graysky collection event |
| min-first-capture-date | query | False | string | The date of the earliest acceptable first capture date. Collections with first capture date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-capture-date | query | False | string | The date of the latest acceptable first capture date. Collections with first capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-capture-date | query | False | string | The date of the earliest acceptable maxcapturedate. Collections with maxcapturedates prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-capture-date | query | False | string | The date of the latest acceptable maxcapturedate. Collections with maxcapturedates after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-first-publish-date | query | False | string | The date of the earliest acceptable firstpublishdate. Collections with firstpublishdate prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-publish-date | query | False | string | The date of the latest acceptable firstpublishdate. Collections with firstpublishdate after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-publish-date | query | False | string | The date of the earliest acceptable lastpublishdate. Collections with lastpublishdate prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-publish-date | query | False | string | The date of the latest acceptable lastpublishdate. Collections with lastpublishdate after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| capture-year | query | False | integer | The capture year of the tiles expressed with 4 digits |
| metadata-format | query | False | string | The format language of the metadata response Allowed: json, xml |
| order-by | query | False | string | The method by which to order the coverages: default, first-capture-date-asc, first-capture-date-desc, last-capture-date-asc, last-capture-date-desc, avg-gsd-asc, avg-gsd-desc, area-asc, area-desc, occlusion-estimate-asc, occlusion-estimate-desc, occlusion-score-asc, occlusion-score-desc |
| include | query | False | string | Fields to be included on the JSON result, separated by commas. Won't return anything if empty:  layer, source-layer, collection, graysky-event, graysky-event-pretty-name, first-capture-date, last-capture-date, min-gsd, max-gsd, avg-gsd, geometry, first-publish-date, last-publish-date, capture-year, product-type, pretty-name, max-zoom, camera-technology, area, occlusion-estimate, occlusion-score, properties-count, occluded-properties-count |
| total-records | query | False | integer | <p>Specifies the maximum number of records to return. This parameter reduce the total number of records matching the query.</p> </br><p><i><b>Note:</b> This parameter is useful to prevent unexpectedly large billable requests or to improve response times.</i></p> |
| page-size | query | False | integer | <p>Specifies the maximum number of records to return on each page of the response, up to a limit of 500. If page-size is omitted or exceeds 500, it defaults to 500. This parameter does not reduce the total number of records matching the query; it only controls how many records are returned per page. Smaller page-size values will result in more pages.</p> </br><p><i><b>Note:</b> This parameter is useful to prevent unexpectedly large billable requests or to improve response times.</i></p> |
| page | query | False | integer | <p>Requests that would return more records than allowed by the <code>page-size</code> parameter are paginated. <code>total-records</code> and <code>total-pages</code> are included in the response header for page 1 only; they are not included in subsequent pages. <code>current-page</code> is included on all page headers. The initial request returns page 1 by default; to request page 2, append <code>page=2</code> to the original request (URL or POST body) and resend.</p> </br><p><i><b>Note:</b> Only records in the requested pages are reported for billing. For example, if a query contains 2 pages but <code>page=2</code> is never requested, only the records received in page 1 are reported for billing.</i></p> |
| layer | query | False | string | Layer |

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

## POST /damage/collections

**/collections**

Returns a list of Damage collections coverage

### Request body

```json
{
 "content": {
  "application/json": {
   "examples": {
    "Default request": {
     "description": "Query coverages by wkt",
     "value": {
      "wkt": "POLYGON((-97.4536 37.6398, -97.0034 37.6398, -97.0034 37.7217, -97.4536 37.7217, -97.4536 37.6398))",
      "include": [
       "geometry",
       "collection"
      ],
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
     "graysky-event": {
      "type": "string",
      "description": "The event name of the Graysky collection event"
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
      "description": "<p>Requests that would return more records than allow
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

## GET /damage/events

**Returns a file containing the metadata and geometry of intersecting graysky collection events.**

Returns a file containing the metadata and geometry of intersecting graysky collection events.

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| wkt | query | False | string | The well-known-text (point or polygon)    ⓘ Note: Information is returned only for real-world coordinates; WKTs that extend beyond ±180° longitude are accepted, but results are limited to the portion of the geometry that intersects valid Earth bounds. |
| srid | query | False | integer | The SRID code for the projection reference representing the coordinates of the given coordinates or WKT |
| spatial-operation | query | False | string | The spatial-query used to specify which images to select based on their relationship to the user’s input wkt.  **Note**: This parameter will be ignored if either:<ul><li>**wkt** is defined as a point or line</li><li>**image-name** is defined</li></ul>  <i>Available values</i>: <ul><li>intersect (default): images must intersect with the input wkt to be returned.</li><li>within-wkt: images must be completely contained within the input wkt to be returned. </li><li>covers-wkt: images must cover the input wkt entirely to be returned.</li></ul> Allowed: intersect, covers-wkt, within-wkt |
| collection | query | False | string | The identifier of the collection which contains the desired data referred to as collection in metadata |
| graysky-event | query | False | string | The event name of the Graysky collectio event |
| collect-year | query | False | integer | The collection year of the tiles expressed with 4 digits |
| min-first-capture-date | query | False | string | The date of the earliest acceptable first capture date. Collections with first capture date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-capture-date | query | False | string | The date of the latest acceptable first capture date. Collections with first capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-capture-date | query | False | string | The date of the earliest acceptable maxcapturedate. Collections with maxcapturedates prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-capture-date | query | False | string | The date of the latest acceptable maxcapturedate. Collections with maxcapturedates after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-first-publish-date | query | False | string | The date of the earliest acceptable firstpublishdate. Collections with firstpublishdate prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-publish-date | query | False | string | The date of the latest acceptable firstpublishdate. Collections with firstpublishdate after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-publish-date | query | False | string | The date of the earliest acceptable lastpublishdate. Collections with lastpublishdate prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-publish-date | query | False | string | The date of the latest acceptable lastpublishdate. Collections with lastpublishdate after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| metadata-format | query | False | string | The format language of the metadata response Allowed: json, xml |
| order-by | query | False | string | The method by which to order the coverages: default, first-capture-date-asc, first-capture-date-desc, last-capture-date-asc, last-capture-date-desc, first-publish-date-asc, first-publish-date-desc, last-publish-date-asc, last-publish-date-desc, avg-gsd-asc, avg-gsd-desc, area-asc, area-desc,occlusion-estimate-asc, occlusion-estimate-desc, occlusion-score-asc, occlusion-score-desc |
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

## POST /damage/events

**Returns a file containing the metadata and geometry of intersecting oriented graysky collection events.**

### Introduction

This service will return a GeoJSON file containing graysky event coverage of oriented imagery from the Vexcel library. The output GeoJSON will contain the geometry of the geographic coverage for the query. This service is particularly useful to:
<ul><li>Identify the available layers available over a given location</li><li>Compare coverage between sensor types (layers)</li><li>See the full extent of a graysky event’s coverage</li></ul>
<img src="../resources/img/docs/oriented_events.png"/>

### Technical Details

This service operates by process of elimination to identify graysky event oriented imagery coverage; by using no refining parameters it is possible to receive complete coverage across the entire Vexcel graysky library. The layer, aoi, and wkt parameters can be used to narrow a search for specific types or locations of imagery. While this service primarily exists to provide coverage geometry, a handful of metadata attributes are also available to help identify grayksy events. 

### Request body

```json
{
 "content": {
  "application/json": {
   "examples": {
    "Coverage by wkt 3857": {
     "description": "Query coverages by wkt",
     "value": {
      "wkt": "POLYGON ((-10848485.127971364 4528665.856260934, -10798369.093216235 4528665.856260934, -10798369.093216235 4540185.611807983, -10848485.127971364 4540185.611807983, -10848485.127971364 4528665.856260934))",
      "srid": 3857,
      "max-records": 1
     }
    },
    "Coverage by wkt 4326": {
     "description": "Query coverages by wkt",
     "value": {
      "wkt": "POLYGON((-97.4536 37.6398, -97.0034 37.6398, -97.0034 37.7217, -97.4536 37.7217, -97.4536 37.6398))",
      "max-records": 1
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
     "coverage-level": {
      "type": "string",
      "description": "The coverage level name"
     },
     "graysky-event": {
      "type": "string",
      "description": "The event name of the Graysky collection event"
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
      "description": "<p>Requests that would return more records than allowed by the <code>page-size</code> parameter are paginated. <code>total-records</code> and <code>total-pages</code> are included in the response header for page 1 only; they are not included in subsequent pages. <code>current-page</code> is included on all page headers. The initial request returns page 1 by default; to request page 2, append <code>page=2</code> to the original request (URL or POST body) and resend.</p>\n</br><p><i><b>Note:</b> Only records in the requested pages are reported for billing. For example, if a query contains 2 pages but <code>page=2</code> is never requested, only the records received in page 1 are reported for billing.</i></p>",
      "minimum": 1
     },
     "page-size": {
      "type": "integer",
      "format": "int32",
      "default": 500,
      "description": "<p>Specifies the maximum number of records to return on each page of the response, up to a limit of 500. If page-size is omitted or exceeds 500, it defaults to 500. This parameter does not reduce the total number of records matching the query; it only 
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
