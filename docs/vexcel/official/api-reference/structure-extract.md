# structure/extract

## GET /structure/extract

**/extract**

### Introduction

 This service will return a GeoJSON file containing  precomputed structure elements data from the Vexcel library. The output GeoJSON will contain the geometry of the structure the structure-based elements. This service is particularly useful to:

<ul><li>Retrieve information about a specific structure.</li><li>Compare information for the same structure over though time.</li><li>Identify structures with matching attributes.</li></ul>
<img src="../resources/img/docs/structure-extract.png"/>

### Technical Details

More than one structure may be returned by this service; use the max-records parameter to prevent unexpectedly large responses. If more records are available than max-records, the order-by parameter determines which are returned and which are omitted. This is particularly important if max-records is set to 1.

For performance reasons this service is limited to querying for properties from no more than 10 collections in a single request. If more than 10 collections intersect the query, an error will be returned: <code>{"status": 400, "message": "Collections list size is too big, use a smaller wkt or fewer collections"}</code>. The 10-collection limit enables relatively large queries; in most cases an entire metropolitan area.

There are a number of filtering parameters, these are booleans and defining them as true indicates that there must be a matching object in the returned property(s). Alternitively, defining a filtering parameter as false means that there must not be a matching object in the returned property(s). The use of several filtering parameters together may cause this service to exceed the 60 second time-out; it is recommended to only use 1 or 2 filtering parameters or to reduce the size of the geospatial query.

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
| include | query | False | string | Fields to be included in the GeoJSON result, multiple values are to be separated by commas. All nested values are returned when requesting a higher-level value. For an efficient payload it is possible to select only those objects that are important to your workflow.<br>The following fields will always be present in the response: <b>requested-wkt, request-id</b><br><br><i>Default Value</i>: <b>precomputed</b><br><br><b>Available values</b>: <i>(defining a value within the hierarchy includes all values nested underneath)</i><ul><li><b>```precomputed```</b>: <i>All fields, excluding the calculated fields. </i><ul><li><b>```structures```</b>: <i>Only fields pertaining to structures</i><ul><li><i>```primary-structure```, ```footprint-wkt```, ```footprint-area```, ```defensible-space```, ```roof-characteristics``` (excluding ```roof-elevation```, ```roof-height```), ```roof-objects```, ```roof-defects```, ```ground-elevation```</i></li></ul></li><li><b>```metadata```</b>: <i>Metadata about the source image</i><ul><li><i>```camera-technology```, ```gsd```, ```image-id```, ```capture-date```, ```metadata-version```, ```layer-name```, ```collection```, ```is-ortho-image```</i></li></ul></li></ul></li><li><b>```calculated```</b>: <i>Values that are calculated at run-time. For platform performance and scalability, please request these values only if they are expressly needed.</i><ul><li><i>```roof-elevation```, ```roof-height```</i></li></ul></li></ul> |
| orientation-source | query | False | string | The imagery type from which the property/geometry attributes must have been derived. Allowed: nadir, ortho |
| unit-system | query | False | string | Determines the unit system in which values are returned. All fields are documented here in metric. When unit-system=imperial, linear values convert from meters to feet, area values convert from square meters to square feet, and volume values convert from cubic meters to cubic feet. Percentages, scores, counts, and other non-dimensional values are unaffected. Allowed: metric, imperial |
| buffer-meter | query | False | integer | The buffer around the wkt point or polygon; one value that will apply to both width and height. The value will always be in meters, regardless of how unit-system is defined.  |
| primary-structure | query | False | boolean | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. |
| min-roof-condition | query | False | integer | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. All values <b>equal to or greater than</b> the defined value will be returned. List of values: <i></i><ul><li><b>1</b> = Bad</il><li><b>2</b> = Poor</il><li><b>3</b> = Fair</il><li><b>4</b> = Good</il><li><b>5</b> = Great</il></ul> Allowed: 1, 2, 3, 4, 5 |
| max-roof-condition | query | False | integer | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. All values <b>equal to or less than</b> the defined value will be returned. List of values: <i></i><ul><li><b>1</b> = Bad</il><li><b>2</b> = Poor</il><li><b>3</b> = Fair</il><li><b>4</b> = Good</il><li><b>5</b> = Great</il></ul> Allowed: 1, 2, 3, 4, 5 |
| roof-solar | query | False | boolean | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. |
| roof-material | query | False | string | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. Allowed: shingle, tile, metal, membrane, shake, gravel |
| latest | query | False | boolean | Determines which collections will be used to return elements:<ul><li><code>true</code> (default): Elements from <b>only one</b> collection - the most-recent.</li><li id='id_li_more_margin_top'><code>false</code>: Elements from <b>all</b> available collections, <b>including</b> the most-recent.</li></ul><em> Note: <code>latest=false</code> may cause the query to exceed the 10-collection limit (as described in the Technical Details) &ndash; in this case, use the corresponding <code>/collections</code> endpoint or the <code>collection</code>, <code>collect-year</code> or <code>min\|max-date</code> filtering parameters to reduce the pool size of intersecting collections. </em>\ |
| total-records | query | False | integer | <p>Specifies the maximum number of records to return. This parameter reduce the total number of records matching the query.</p> </br><p><i><b>Note:</b> This parameter is useful to prevent unexpectedly large billable requests or to improve response times.</i></p> |
| order-by | query | False | string | In the case that more than one structure matches the input parameters, <code>order-by</code> will define the method by which the potential structures are ordered. This parameter can take multiple values, separated by commas, and will honor them in the order in which they are defined.<br><br><b>Allowed values</b>: <i><code>default</code>, <code>image-date-asc</code>, <code>image-date-desc</code>, <code>distance-asc</code>, <code>distance-desc</code></i><br><br><i><b>Note</b>: <code>default</code> will return the structures in whichever order they appear in database.</i><br><br><i><b>Default value</b>: <code>default</code> |
| page-size | query | False | integer | <p>Specifies the maximum number of records to return on each page of the response, up to a limit of 500. If page-size is omitted or exceeds 500, it defaults to 500. This parameter does not reduce the total number of records matching the query; it only controls how many records are returned per page. Smaller page-size values will result in more pages.</p> </br><p><i><b>Note:</b> This parameter is useful to prevent unexpectedly large billable requests or to improve response times.</i></p> |
| page | query | False | integer | <p>Requests that would return more records than allowed by the <code>page-size</code> parameter are paginated. <code>total-records</code> and <code>total-pages</code> are included in the response header for page 1 only; they are not included in subsequent pages. <code>current-page</code> is included on all page headers. The initial request returns page 1 by default; to request page 2, append <code>page=2</code> to the original request (URL or POST body) and resend.</p> </br><p><i><b>Note:</b> Only records in the requested pages are reported for billing. For example, if a query contains 2 pages but <code>page=2</code> is never requested, only the records received in page 1 are reported for billing.</i></p> |

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

## POST /structure/extract

**/extract**

### Introduction

 This service will return a GeoJSON file containing  precomputed structure elements data from the Vexcel library. The output GeoJSON will contain the geometry of the structure the structure-based elements. This service is particularly useful to:

<ul><li>Retrieve information about a specific structure.</li><li>Compare information for the same structure over though time.</li><li>Identify structures with matching attributes.</li></ul>
<img src="../resources/img/docs/structure-extract.png"/>

### Technical Details

More than one structure may be returned by this service; use the max-records parameter to prevent unexpectedly large responses. If more records are available than max-records, the order-by parameter determines which are returned and which are omitted. This is particularly important if max-records is set to 1.

For performance reasons this service is limited to querying for properties from no more than 10 collections in a single request. If more than 10 collections intersect the query, an error will be returned: <code>{"status": 400, "message": "Collections list size is too big, use a smaller wkt or fewer collections"}</code>. The 10-collection limit enables relatively large queries; in most cases an entire metropolitan area.

There are a number of filtering parameters, these are booleans and defining them as true indicates that there must be a matching object in the returned property(s). Alternitively, defining a filtering parameter as false means that there must not be a matching object in the returned property(s). The use of several filtering parameters together may cause this service to exceed the 60 second time-out; it is recommended to only use 1 or 2 filtering parameters or to reduce the size of the geospatial query.

### Request body

```json
{
 "content": {
  "application/json": {
   "examples": {
    "Default request": {
     "description": "Default request",
     "value": {
      "wkt": "POLYGON ((-97.353029 37.683617, -97.346935 37.683617, -97.346935 37.687624, -97.353029 37.687624, -97.353029 37.683617))",
      "layer": "urban, urban-g, wide-area and urban-r",
      "page-size": 1
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
      "descri
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

## GET /structure/geometry/extract

**geometry/extract**

### Introduction

This service will return a GeoJSON file containing  precomputed structure geometry data from the Vexcel library. The output GeoJSON will contain only the geometry geometry. This service is particularly useful to:

<ul><li>Retrieve the geometry (footprint) for a specific structure.</li><li>Compare changes for the same structure geometry over though time.</li><li>Use the structure geometry as an input in other Vexcel imagery services.</li></ul>
<img src="../resources/img/docs/structure-geometry-extract.png"/>

### Technical Details

More than one structure geometry may be returned by this service; use the max-records parameter to prevent unexpectedly large responses. If more records are available than max-records, the order-by parameter determines which are returned and which are omitted. This is particularly important if max-records is set to 1.

For performance reasons this service is limited to querying for properties from no more than 10 collections in a single request. If more than 10 collections intersect the query, an error will be returned: <code>{"status": 400, "message": "Collections list size is too big, use a smaller wkt or fewer collections"}</code>. The 10-collection limit enables relatively large queries; in most cases an entire metropolitan area.

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| wkt | query | True | string | The well-known-text (WKT) representation of the requested geometry. |
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
| include | query | False | string | Optional attributes that must be calculated on-the-fly and will result in decreased performance. Only include if necessary. Allowed: roof-height, roof-elevation |
| orientation-source | query | False | string | The imagery type from which the property/geometry attributes must have been derived. Allowed: nadir, ortho |
| unit-system | query | False | string | Determines the unitary system in which values are returned. Allowed: metric, imperial |
| buffer-meter | query | False | integer | The buffer around the wkt point or polygon (in meters). One value will apply to both width and height. |
| primary-structure | query | False | boolean | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. |
| latest | query | False | boolean | Determines which collections will be used to return elements:<ul><li><code>true</code> (default): Elements from <b>only one</b> collection - the most-recent.</li><li id='id_li_more_margin_top'><code>false</code>: Elements from <b>all</b> available collections, <b>including</b> the most-recent.</li></ul><em> Note: <code>latest=false</code> may cause the query to exceed the 10-collection limit (as described in the Technical Details) &ndash; in this case, use the corresponding <code>/collections</code> endpoint or the <code>collection</code>, <code>collect-year</code> or <code>min\|max-date</code> filtering parameters to reduce the pool size of intersecting collections. </em>\ |
| total-records | query | False | integer | <p>Specifies the maximum number of records to return. This parameter reduce the total number of records matching the query.</p> </br><p><i><b>Note:</b> This parameter is useful to prevent unexpectedly large billable requests or to improve response times.</i></p> |
| order-by | query | False | string | In the case that more than one structure geometry matches the input parameters, <code>order-by</code> will define the method by which the potential structure geometries are ordered. This parameter can take multiple values, separated by commas, and will honor them in the order in which they are defined.<br><br><b>Allowed values</b>: <i><code>default</code>, <code>image-date-asc</code>, <code>image-date-desc</code>, <code>distance-asc</code>, <code>distance-desc</code></i><br><br><i><b>Note</b>: <code>default</code> will return the structure geometries in whichever order they appear in database.</i><br><br><i><b>Default value</b>: <code>default</code> |
| page-size | query | False | integer | <p>Specifies the maximum number of records to return on each page of the response, up to a limit of 500. If page-size is omitted or exceeds 500, it defaults to 500. This parameter does not reduce the total number of records matching the query; it only controls how many records are returned per page. Smaller page-size values will result in more pages.</p> </br><p><i><b>Note:</b> This parameter is useful to prevent unexpectedly large billable requests or to improve response times.</i></p> |
| page | query | False | integer | <p>Requests that would return more records than allowed by the <code>page-size</code> parameter are paginated. <code>total-records</code> and <code>total-pages</code> are included in the response header for page 1 only; they are not included in subsequent pages. <code>current-page</code> is included on all page headers. The initial request returns page 1 by default; to request page 2, append <code>page=2</code> to the original request (URL or POST body) and resend.</p> </br><p><i><b>Note:</b> Only records in the requested pages are reported for billing. For example, if a query contains 2 pages but <code>page=2</code> is never requested, only the records received in page 1 are reported for billing.</i></p> |

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

## POST /structure/geometry/extract

**geometry/extract**

### Introduction

This service will return a GeoJSON file containing  precomputed structure geometry data from the Vexcel library. The output GeoJSON will contain only the geometry geometry. This service is particularly useful to:

<ul><li>Retrieve the geometry (footprint) for a specific structure.</li><li>Compare changes for the same structure geometry over though time.</li><li>Use the structure geometry as an input in other Vexcel imagery services.</li></ul>
<img src="../resources/img/docs/structure-geometry-extract.png"/>

### Technical Details

More than one structure geometry may be returned by this service; use the max-records parameter to prevent unexpectedly large responses. If more records are available than max-records, the order-by parameter determines which are returned and which are omitted. This is particularly important if max-records is set to 1.

For performance reasons this service is limited to querying for properties from no more than 10 collections in a single request. If more than 10 collections intersect the query, an error will be returned: <code>{"status": 400, "message": "Collections list size is too big, use a smaller wkt or fewer collections"}</code>. The 10-collection limit enables relatively large queries; in most cases an entire metropolitan area.

### Request body

```json
{
 "content": {
  "application/json": {
   "examples": {
    "Default request": {
     "description": "Default request",
     "value": {
      "wkt": "POLYGON ((-97.353029 37.683617, -97.346935 37.683617, -97.346935 37.687624, -97.353029 37.687624, -97.353029 37.683617))",
      "layer": "urban, urban-g, wide-area and urban-r",
      "page-size": 1
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
      "descri
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
