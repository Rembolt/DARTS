# property/count

## GET /property/count

**/count**

### Introduction


This service will query the precomputed property elements database and return a count of matching properties. The response will not contain any elements objects. This service accepts many of the same parameters as property/extract and operates in a very similar manner. This service is particularly useful to:
<ul><li>Estimate the potential cost of a comparable property/extract request.</li><li>Perform market-level analysis of a neighborhood or city sized area.</li></ul>


<img src="../resources/img/docs/elements-count.png"/>

### Technical Details

There are a number of filtering parameters, these are booleans and defining them as true indicates that there must be a matching object in the returned property count. Alternitively, defining a filtering parameter as false means that there must not be any matching objects in the returned property count. 

For performance reasons this service is limited to querying for properties from no more than 10 collections in a single request. If more than 10 collections intersect the query, an error will be returned: <code>{"status": 400, "message": "Collections list size is too big, use a smaller wkt or fewer collections"}</code>. The 10-collection limit enables relatively large queries; in most cases an entire metropolitan area.

ⓘ *This is a billable service for non-enterprise customers. Each request is reported as one billable transaction regardless of the resulting count.*

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| wkt | query | False | string | The well-known-text (WKT) representation of the requested geometry.    ⓘ Note: Information is returned only for real-world coordinates; WKTs that extend beyond ±180° longitude are accepted, but results are limited to the portion of the geometry that intersects valid Earth bounds. |
| srid | query | False | string | The spatial reference identification code for the projection representing the coordinates of the given WKT. If undefined, 4326 will be used. Only EPSG is supported. Allowed: 4326, 3857 |
| layer | query | False | string | The name of the desired layer.<br><b>Allowed values</b>: <i>urban, urban-g, wide-area and urban-r</i> |
| collection | query | False | string | The identifier of the AOI (Area of Interest) which contains the desired imagery. |
| collect-year | query | False | integer | The year of collection. |
| min-first-capture-date | query | False | string | The date of the earliest acceptable first capture date. Collections with first capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-capture-date | query | False | string | The date of the latest acceptable first capture date. Collections with first capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-capture-date | query | False | string | The date of the earliest acceptable last capture date. Collections with last capture date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-capture-date | query | False | string | The date of the latest acceptable last capture date. Collections with last capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-first-publish-date | query | False | string | The date of the earliest acceptable first publish date. Collections with first publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-publish-date | query | False | string | The date of the latest acceptable first publish date. Collections with first publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-publish-date | query | False | string | The date of the earliest acceptable last publish date. Collections with last publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-publish-date | query | False | string | The date of the latest acceptable last publish date. Collections with last publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| buffer-meter | query | False | integer | The buffer around the wkt point or polygon (in meters). One value will apply to both width and height. |
| primary-structure | query | False | boolean | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. |
| min-roof-condition | query | False | integer | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. All values <b>equal to or greater than</b> the defined value will be returned. List of values: <i></i><ul><li><b>1</b> = Bad</il><li><b>2</b> = Poor</il><li><b>3</b> = Fair</il><li><b>4</b> = Good</il><li><b>5</b> = Great</il></ul> Allowed: 1, 2, 3, 4, 5 |
| max-roof-condition | query | False | integer | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. All values <b>equal to or less than</b> the defined value will be returned. List of values: <i></i><ul><li><b>1</b> = Bad</il><li><b>2</b> = Poor</il><li><b>3</b> = Fair</il><li><b>4</b> = Good</il><li><b>5</b> = Great</il></ul> Allowed: 1, 2, 3, 4, 5 |
| roof-solar | query | False | boolean | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. |
| roof-material | query | False | string | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. Allowed: shingle, tile, metal, membrane, shake, gravel |
| deck | query | False | boolean | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. |
| sport-court | query | False | boolean | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. |
| playground | query | False | boolean | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. |
| trampoline | query | False | boolean | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. |
| enclosure | query | False | boolean | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. |
| pool | query | False | boolean | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. |
| automobile | query | False | boolean | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. |
| boat | query | False | boolean | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. |
| latest | query | False | boolean | Determines which collections will be used to return elements:<ul><li><code>true</code> (default): Elements from <b>only one</b> collection - the most-recent.</li><li id='id_li_more_margin_top'><code>false</code>: Elements from <b>all</b> available collections, <b>including</b> the most-recent.</li></ul><em> Note: <code>latest=false</code> may cause the query to exceed the 10-collection limit (as described in the Technical Details) &ndash; in this case, use the corresponding <code>/collections</code> endpoint or the <code>collection</code>, <code>collect-year</code> or <code>min\|max-date</code> filtering parameters to reduce the pool size of intersecting collections. </em>\ |

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

## POST /property/count

**/count**

### Introduction


This service will query the precomputed property elements database and return a count of matching properties. The response will not contain any elements objects. This service accepts many of the same parameters as property/extract and operates in a very similar manner. This service is particularly useful to:
<ul><li>Estimate the potential cost of a comparable property/extract request.</li><li>Perform market-level analysis of a neighborhood or city sized area.</li></ul>


<img src="../resources/img/docs/elements-count.png"/>

### Technical Details

There are a number of filtering parameters, these are booleans and defining them as true indicates that there must be a matching object in the returned property count. Alternitively, defining a filtering parameter as false means that there must not be any matching objects in the returned property count. 

For performance reasons this service is limited to querying for properties from no more than 10 collections in a single request. If more than 10 collections intersect the query, an error will be returned: <code>{"status": 400, "message": "Collections list size is too big, use a smaller wkt or fewer collections"}</code>. The 10-collection limit enables relatively large queries; in most cases an entire metropolitan area.

ⓘ *This is a billable service for non-enterprise customers. Each request is reported as one billable transaction regardless of the resulting count.*

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
      "layer": "urban, urban-g, wide-area and urban-r"
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
     "automobile": {
      "type": "boolean"
     },
     "boat": {
      "type": "boolean"
     },
     "buffer-meter": {
      "type": "integer",
      "format": "int32",
      "description": "The buffer around the wkt point or polygon; one value that will apply to both width and height. The value will always be in meters, regardless of how unit-system is defined. "
     },
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
     "deck": {
      "type": "boolean"
     },
     "enclosure": {
      "type": "boolean"
     },
     "latest": {
      "type": "boolean",
      "description": "Determines which collections will be used to return elements:<ul><li><code>true</code> (default): Elements from <b>only one</b> collection - the most-recent.</li><li id='id_li_more_margin_top'><code>false</code>: Elements from <b>all</b> available collections, <b>including</b> the most-recent.</li></ul><em>\nNote: <code>latest=false</code> may cause the query to exceed the 10-collection limit (as described in the Technical Details) &ndash; in this case, use the corresponding <code>/collections</code> endpoint or the <code>collection</code>, <code>collect-year</code> or <code>min|max-date</code> filtering parameters to reduce the pool size of intersecting collections.\n</em>"
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
     "max-roof-condition": {
      "type": "integer",
      "format": "int32",
      "description": "Maximum property roof condition value for results. Records with a roof condition higher than this value are excluded."
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
     "min-roof-condition": {
      "type": "integer",
      "format": "int32",
      "description": "Minimum property roof condition value for results. Records with a roof condition lower than this value are excluded."
     },
     "ogcfeatureId": {
      "type": "string",
      "writeOnly": true
     },
     "playground": {
      "type": "boolean"
     },
     "pool": {
      "type": "boolean"
     },
     "primary-structure": {
      "type": "boolean",
      "description": "If true, limits results to parcels containing a primary structure. Set false to include all parcels."
     },
     "roof-material": {
      "type": "string",
      "description": "Returns only results matching the specified roof material type (e.g., \"tile\", \"shingle\", \"metal\"). This field only exists as a filter parameter and must NOT be used in the include parameter.",
      "enum": [
       "shingle",
       "tile",
       "metal",
       "membrane",
       "shake",
       "gravel"
      ]
     },
     "roof-solar": {
      "type": "boolean",
      "description": "Filter for parcels with solar pane
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
