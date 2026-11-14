# Extract

## GET /damage/property/count

**/count**

### Introduction


This service will query the precomputed damage elements database and return a count of matching damaged properties. The response will not contain any elements objects. This service accepts many of the same parameters as damage/property/extract and operates in a very similar manner. This service is particularly useful to:
<ul><li>Estimate the potential cost of a comparable damage/property/extract request.</li><li>Perform market-level analysis of a neighborhood or city sized area.</li></ul>


<img src="../resources/img/docs/damage-property-count.png"/>

### Technical Details

There are a number of filtering parameters, these are booleans and defining them as true indicates that there must be a matching object in the returned property count. Alternitively, defining a filtering parameter as false means that there must not be any matching objects in the returned property count. 

For performance reasons this service is limited to querying for properties from no more than 10 collections in a single request. If more than 10 collections intersect the query, an error will be returned: <code>{"status": 400, "message": "Collections list size is too big, use a smaller wkt or fewer collections"}</code>. The 10-collection limit enables relatively large queries; in most cases an entire metropolitan area.

ⓘ *This is a billable service for non-enterprise customers. Each request is reported as one billable transaction regardless of the resulting count.*

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| wkt | query | False | string | The well-known-text (WKT) representation of the requested geometry (point or polygon).    ⓘ Note: Information is returned only for real-world coordinates; WKTs that extend beyond ±180° longitude are accepted, but results are limited to the portion of the geometry that intersects valid Earth bounds. |
| srid | query | False | string | The spatial reference identification code for the projection representing the coordinates of the given WKT. If undefined, 4326 will be used. Only EPSG is supported. Allowed: 4326, 3857 |
| collection | query | False | string | The identifier of the AOI (Area of Interest) which contains the desired imagery. |
| graysky-event | query | False | string | The identifier of the graysky-event which contains the desired imagery. |
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
| min-cat-score | query | False | integer | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. All values equal to or greater than the defined value will be returned. Defined as an integer between 0 (no damage) and 100 (complete loss). <br> |
| max-cat-score | query | False | integer | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. All values equal to or less than the defined value will be returned. Defined as an integer between 0 (no damage) and 100 (complete loss). <br> |
| min-fema-classification | query | False | integer | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. All values equal to or greater than the defined value will be returned. <br><br>Fema-class options:<br>null/{undefined} - No fema classification filtering<br>-1 - Records without fema classification<br>&nbsp;0 - Minor (cat-score 1-15)<br>&nbsp;1 - Moderate (cat-score 15-30)<br>&nbsp;2 - Moderate (cat-score 30-45)<br>&nbsp;3 - Moderate (cat-score 45-60)<br>&nbsp;4 - Major (cat-score 60-75)<br>&nbsp;5 - Major (cat-score 75-90)<br>&nbsp;6 - Destroyed (cat-score 90-100) |
| max-fema-classification | query | False | integer | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. All values equal to or less than the defined value will be returned. <br><br>Fema-class options:<br>null/{undefined} - No fema classification filtering<br>-1 - Records without fema classification<br>&nbsp;0 - Minor (cat-score 1-15)<br>&nbsp;1 - Moderate (cat-score 15-30)<br>&nbsp;2 - Moderate (cat-score 30-45)<br>&nbsp;3 - Moderate (cat-score 45-60)<br>&nbsp;4 - Major (cat-score 60-75)<br>&nbsp;5 - Major (cat-score 75-90)<br>&nbsp;6 - Destroyed (cat-score 90-100) |
| min-histoscore | query | False | number | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. All values equal to or lesser than the defined value will be returned. Defined as a two-decimal number between 0.00 (bad clarity) and 1.00 (great clarity). <br> |
| max-histoscore | query | False | number | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. All values equal to or lesser than the defined value will be returned. Defined as a two-decimal number between 0.00 (bad clarity) and 1.00 (great clarity). <br> |
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

## POST /damage/property/count

**/count**

### Introduction


This service will query the precomputed damage elements database and return a count of matching damaged properties. The response will not contain any elements objects. This service accepts many of the same parameters as damage/property/extract and operates in a very similar manner. This service is particularly useful to:
<ul><li>Estimate the potential cost of a comparable damage/property/extract request.</li><li>Perform market-level analysis of a neighborhood or city sized area.</li></ul>


<img src="../resources/img/docs/damage-property-count.png"/>

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
      "wkt": "POLYGON((-97.4536 37.6398, -97.0034 37.6398, -97.0034 37.7217, -97.4536 37.7217, -97.4536 37.6398))"
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
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
     "graysky-event": {
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "latest": {
      "type": "boolean",
      "description": "Determines which collections will be used to return elements:<ul><li><code>true</code> (default): Elements from <b>only one</b> collection - the most-recent.</li><li id='id_li_more_margin_top'><code>false</code>: Elements from <b>all</b> available collections, <b>including</b> the most-recent.</li></ul><em>\nNote: <code>latest=false</code> may cause the query to exceed the 10-collection limit (as described in the Technical Details) &ndash; in this case, use the corresponding <code>/collections</code> endpoint or the <code>collection</code>, <code>collect-year</code> or <code>min|max-date</code> filtering parameters to reduce the pool size of intersecting collections.\n</em>"
     },
     "max-cat-score": {
      "type": "integer",
      "format": "int32",
      "description": "This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. All values equal to or less than the defined value will be returned. Defined as an integer between 0 (no damage) and 100 (complete loss)."
     },
     "max-fema-score": {
      "type": "integer",
      "format": "int32",
      "description": "This parameter filter by the maximum allowed value for the fema score, in a range from -1 to 6. Each value represent different damages:\n    \u2022Undefined or absent: No fema classification filtering\n    \u2022 -1 : Records without fema classification\n    \u2022 0 : Minor damage, equivalent to cat-score from 1 to 15\n    \u2022 1 : Moderate damage, equivalent to cat-score from 15 to 30\n    \u2022 2 : Moderate damage, equivalent to cat-score from 30 to 45\n    \u2022 3 : Moderate damage, equivalent to cat-score from 45 to 60\n    \u2022 4 : Major damage, equivalent to cat-score from 60 to 75\n    \u2022 5 : Major damage, equivalent to cat-score from 75 to 90\n    \u2022 6 : Destroyed, equivalent to cat-score from 90 to 100\n"
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
     "max-histoscore": {
      "type": "number",
      "format": "int32"
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
     "min-cat-score": {
      "type": "integer",
      "format": "int32",
      "description": "This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. All values equal to or greater than the defined value will be returned. Defined as an integer between 0 (no damage) and 100 (complete loss)."
     },
     "min-fema-score": {
      "type": "integer",
      "format": "int32",
      "description": "This parameter filter by the minimum allowed value for the fema score, in a range from -1 to 6. Each value represent different damages:\n    \u2022Undefined or absent: No fema classification filtering\n    \u2022 -1 : Records without fema classification\n    \u2022 0 : Minor damage, equivalent to cat-score from 1 to 15\n    \u2022 1 : Moderate damage, equivalent to cat-score from 15 to 30\n    \u2022 2 : Moderate damage, equivalent to cat-score from 30 to 45\n    \u2022 3 : Moderate damage, equivalent to cat-score from 45 to 60\n    \u2022 4 : Major damage, equivalent to cat-score from 60 to 75\n    \u2022 5 : Major damage, equivalent to cat-score from 75 to 90\n    \u2022 6 : Destroyed, equivalent to cat-score from 90 to 100\n"
     },
     "min-first-capture-date": {
      "type": "string",
      "format": "date-time",
      "description": "The date of the earliest acceptable first capture date. Collections with first capture date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss)"
     },
     "min-first-publish-date": {
      "type": "string",
      "format": "date-time",
      "description": "The date of the earliest acceptable first publish date. Collections with f
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

## GET /damage/property/extract

**/extract**

Introduction: <br><br>The /damage/property/extract service will take a WKT geometry and return a metadata response (JSON or xml) for structures with associated catastrophic damage attributes as well as some pre-damage attributes. This service is run against graysky imagery and is available for all graysky collections from March 2022 and beyond.
### Technical Details

There are a number of filtering parameters, these are booleans and defining them as true indicates that there must be a matching object in the returned property count. Alternitively, defining a filtering parameter as false means that there must not be any matching objects in the returned property count. 

For performance reasons this service is limited to querying for properties from no more than 10 collections in a single request. If more than 10 collections intersect the query, an error will be returned: <code>{"status": 400, "message": "Collections list size is too big, use a smaller wkt or fewer collections"}</code>. The 10-collection limit enables relatively large queries; in most cases an entire metropolitan area.


### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| wkt | query | False | string | The well-known-text (WKT) representation of the requested geometry (point or polygon).    ⓘ Note: Information is returned only for real-world coordinates; WKTs that extend beyond ±180° longitude are accepted, but results are limited to the portion of the geometry that intersects valid Earth bounds. |
| srid | query | False | string | The spatial reference identification code for the projection representing the coordinates of the given WKT. If undefined, 4326 will be used. Only EPSG is supported. Allowed: 4326, 3857 |
| layer | query | False | string | The name of the desired layer.<br><b>Allowed values</b>: <i>graysky</i> |
| collection | query | False | string | The identifier of the AOI (Area of Interest) which contains the desired imagery. |
| graysky-event | query | False | string | The identifier of the graysky-event which contains the desired imagery. |
| collect-year | query | False | integer | The year of collection. |
| min-first-capture-date | query | False | string | The date of the earliest acceptable first capture date. Collections with first capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-capture-date | query | False | string | The date of the latest acceptable first capture date. Collections with first capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-capture-date | query | False | string | The date of the earliest acceptable last capture date. Collections with last capture date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-capture-date | query | False | string | The date of the latest acceptable last capture date. Collections with last capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-first-publish-date | query | False | string | The date of the earliest acceptable first publish date. Collections with first publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-publish-date | query | False | string | The date of the latest acceptable first publish date. Collections with first publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-publish-date | query | False | string | The date of the earliest acceptable last publish date. Collections with last publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-publish-date | query | False | string | The date of the latest acceptable last publish date. Collections with last publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| unit-system | query | False | string | Determines the unit system in which values are returned. All fields are documented here in metric. When unit-system=imperial, linear values convert from meters to feet, area values convert from square meters to square feet, and volume values convert from cubic meters to cubic feet. Percentages, scores, counts, and other non-dimensional values are unaffected. Allowed: metric, imperial |
| buffer-meter | query | False | integer | The buffer around the wkt point or polygon; one value that will apply to both width and height. The value will always be in meters, regardless of how unit-system is defined.  |
| min-cat-score | query | False | integer | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. All values equal to or greater than the defined value will be returned. Defined as an integer between 0 (no damage) and 100 (complete loss). <br> |
| max-cat-score | query | False | integer | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. All values equal to or less than the defined value will be returned. Defined as an integer between 0 (no damage) and 100 (complete loss). <br> |
| min-fema-classification | query | False | integer | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. All values equal to or greater than the defined value will be returned. <br><br>Fema-class options:<br>null/{undefined} - No fema classification filtering<br>-1 - Records without fema classification<br>&nbsp;0 - Minor (cat-score 1-15)<br>&nbsp;1 - Moderate (cat-score 15-30)<br>&nbsp;2 - Moderate (cat-score 30-45)<br>&nbsp;3 - Moderate (cat-score 45-60)<br>&nbsp;4 - Major (cat-score 60-75)<br>&nbsp;5 - Major (cat-score 75-90)<br>&nbsp;6 - Destroyed (cat-score 90-100) |
| max-fema-classification | query | False | integer | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. All values equal to or less than the defined value will be returned. <br><br>Fema-class options:<br>null/{undefined} - No fema classification filtering<br>-1 - Records without fema classification<br>&nbsp;0 - Minor (cat-score 1-15)<br>&nbsp;1 - Moderate (cat-score 15-30)<br>&nbsp;2 - Moderate (cat-score 30-45)<br>&nbsp;3 - Moderate (cat-score 45-60)<br>&nbsp;4 - Major (cat-score 60-75)<br>&nbsp;5 - Major (cat-score 75-90)<br>&nbsp;6 - Destroyed (cat-score 90-100) |
| min-histoscore | query | False | number | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. All values equal to or lesser than the defined value will be returned. Defined as a two-decimal number between 0.00 (bad clarity) and 1.00 (great clarity). <br> |
| max-histoscore | query | False | number | This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. All values equal to or lesser than the defined value will be returned. Defined as a two-decimal number between 0.00 (bad clarity) and 1.00 (great clarity). <br> |
| latest | query | False | boolean | Determines which collections will be used to return elements:<ul><li><code>true</code> (default): Elements from <b>only one</b> collection - the most-recent.</li><li id='id_li_more_margin_top'><code>false</code>: Elements from <b>all</b> available collections, <b>including</b> the most-recent.</li></ul><em> Note: <code>latest=false</code> may cause the query to exceed the 10-collection limit (as described in the Technical Details) &ndash; in this case, use the corresponding <code>/collections</code> endpoint or the <code>collection</code>, <code>collect-year</code> or <code>min\|max-date</code> filtering parameters to reduce the pool size of intersecting collections. </em>\ |
| total-records | query | False | integer | <p>Specifies the maximum number of records to return. This parameter reduce the total number of records matching the query.</p> </br><p><i><b>Note:</b> This parameter is useful to prevent unexpectedly large billable requests or to improve response times.</i></p> |
| page-size | query | False | integer | <p>Specifies the maximum number of records to return on each page of the response, up to a limit of 500. If page-size is omitted or exceeds 500, it defaults to 500. This parameter does not reduce the total number of records matching the query; it only controls how many records are returned per page. Smaller page-size values will result in more pages.</p> </br><p><i><b>Note:</b> This parameter is useful to prevent unexpectedly large billable requests or to improve response times.</i></p> |
| page | query | False | integer | <p>Requests that would return more records than allowed by the <code>page-size</code> parameter are paginated. <code>total-records</code> and <code>total-pages</code> are included in the response header for page 1 only; they are not included in subsequent pages. <code>current-page</code> is included on all page headers. The initial request returns page 1 by default; to request page 2, append <code>page=2</code> to the original request (URL or POST body) and resend.</p> </br><p><i><b>Note:</b> Only records in the requested pages are reported for billing. For example, if a query contains 2 pages but <code>page=2</code> is never requested, only the records received in page 1 are reported for billing.</i></p> |
| include | query | False | string | Fields to be included in the GeoJSON result, multiple values are to be separated by commas. All nested values are returned when requesting a higher-level value. For an efficient payload it is possible to select only those objects that are important to your workflow.<br>The following fields will always be present in the response: <b>requested-wkt, inside-parcel, request-id, parcel-wkt, parcel-source</b><br><br><i>Default Value</i>: <b>precomputed</b><br><br><b>Available values</b>: <i>(defining a value within the hierarchy includes all values nested underneath)</i><ul><li><b>```precomputed```</b>: <i>All fields, excluding the calculated fields. </i><ul><li><b>```post-cat-structures```</b>: <i>Only fields pertaining to structures as detected after the Gray Sky event.</i><ul><li><i>```post-fema-classification```, ```post-roof-condition```,```post-roof-object```, ```post-catastrophe-score```, ```post-camera-technology```, ```post-gsd```, ```post-image-id```, ```post-capture-date```, ```post-metadata-version```, ```post-layer-name```,<br>```post-orientation-source```, ```post-collection```, ```post-HistoScore```, ```post-event```, ```post-primary-structure```</i></li></ul></li><li><b>```pre-cat-structures```</b>: <i>Only fields pertaining to structures as detected prior to the Gray Sky event.</i><ul><li><i>```pre-primary-structure```, ```pre-footprint-wkt```, ```pre-footprint-area```, ```pre-defensible-space```, ```pre-roof-characteristics``` (excluding ```pre-roof-elevation```, ```pre-roof-height```), ```pre-ground-elevation```, <br>```pre-camera-technology```, ```pre-image-id```, ```pre-layer-name```, ```pre-is-ortho-image```, ```pre-collection```, ```pre-capture-date```, ```pre-gsd```,```pre-metadata-version```, ```pre-roof-condition```, ```pre-hardscapes```, ```pre-deck```, ```pre-tree-cover```</i></li></ul></li><li><b>```pre-cat-property```</b>: <i>Only fields pertaining to the parcel, excluding structures fields.</i><ul><li><i>```pre-parcel-source```, ```pre-pool```, ```pre-enclosure```, ```pre-sport-court```, ```pre-vehicles```, ```pre-playground```, ```pre-trampoline```</i></li></ul></li></ul></li><li><b>```calculated```</b>: <i>Values that are calculated at run-time. For platform performance and scalability, please request these values only if they are expressly needed</i><ul><li><i>```pre-roof-elevation```, ```pre-roof-height```</i></li></ul></li></ul> |
| order-by | query | False | string | The method by which to order the coverages: <br>default, <br>image-date-asc, <br>image-date-desc, <br>layer-asc, <br>layer-desc, <br>distance-asc, <br>distance-desc, <br>catastrophe-score-asc, <br>catastrophe-score-desc, <br>fema-classification-asc, <br>fema-classification-desc <br>histogram-score-asc, <br>histogram-score-desc  |

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

## POST /damage/property/extract

**/extract**

Introduction: <br><br>The /damage/property/extract service will take a WKT geometry and return a metadata response (JSON or xml) for structures with associated catastrophic damage attributes as well as some pre-damage attributes. This service is run against graysky imagery and is available for all graysky collections from March 2022 and beyond.
### Technical Details

There are a number of filtering parameters, these are booleans and defining them as true indicates that there must be a matching object in the returned property count. Alternitively, defining a filtering parameter as false means that there must not be any matching objects in the returned property count. 

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
      "wkt": "POLYGON((-97.4536 37.6398, -97.0034 37.6398, -97.0034 37.7217, -97.4536 37.7217, -97.4536 37.6398))",
      "layer": "graysky",
      "total-records": 1,
      "page-size": 1,
      "page": 1
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
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
     "graysky-event": {
      "type": "string",
      "description": "The event name of the Graysky collection event"
     },
     "include": {
      "type": "string",
      "default": "precomputed",
      "description": "Fields to be included in the GeoJSON result, multiple values are to be separated by commas. All nested values are returned when requesting a higher-level value. For an efficient payload it is possible to select only those objects that are important to your workflow.<br>The following fields will always be present in the response: <b>requested-wkt, inside-parcel, request-id, parcel-wkt, parcel-source</b><br><br><i>Default Value</i>: <b>precomputed</b><br><br><b>Available values</b>: <i>(defining a value within the hierarchy includes all values nested underneath)</i><ul><li><b>```precomputed```</b>: <i>All fields, excluding the calculated fields. </i><ul><li><b>```post-cat-structures```</b>: <i>Only fields pertaining to structures as detected after the Gray Sky event.</i><ul><li><i>```post-fema-classification```, ```post-roof-condition```,```post-roof-object```, ```post-catastrophe-score```, ```post-camera-technology```, ```post-gsd```, ```post-image-id```, ```post-capture-date```, ```post-metadata-version```, ```post-layer-name```,<br>```post-orientation-source```, ```post-collection```, ```post-HistoScore```, ```post-event```, ```post-primary-structure```</i></li></ul></li><li><b>```pre-cat-structures```</b>: <i>Only fields pertaining to structures as detected prior to the Gray Sky event.</i><ul><li><i>```pre-primary-structure```, ```pre-footprint-wkt```, ```pre-footprint-area```, ```pre-defensible-space```, ```pre-roof-characteristics``` (excluding ```pre-roof-elevation```, ```pre-roof-height```), ```pre-ground-elevation```, <br>```pre-camera-technology```, ```pre-image-id```, ```pre-layer-name```, ```pre-is-ortho-image```, ```pre-collection```, ```pre-capture-date```, ```pre-gsd```</i></li></ul></li><li><b>```pre-cat-property```</b>: <i>Only fields pertaining to the parcel, excluding structures fields.</i><ul><li><i>```pre-parcel-source```, ```pre-pool```, ```pre-enclosure```, ```pre-sport-court```, ```pre-hardscapes```, ```pre-vehicles```, ```pre-playground```, ```pre-deck```, ```pre-trampoline```</i></li></ul></li></ul></li><li><b>```calculated```</b>: <i>Values that are calculated at run-time. For platform performance and scalability, please request these values only if they are expressly needed</i><ul><li><i>```pre-roof-elevation```, ```pre-roof-height```</i></li></ul></li></ul>"
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
     "max-cat-score": {
      "type": "integer",
      "format": "int32",
      "description": "This is a filtering parameter; the response will only contain the nearest structure(s) or property(s) matching the definition of this parameter. All values equal to or less than the defined value will be returned. Defined as an integer between 0 (no damage) and 100 (complete loss)."
     },
     "max-fema-classification": {
      "type": "integer",
      "format": "int32",
      "description": "This parameter filter by the maximum allowed value for the fema score, in a range from -1 to 6. Each value represent different damages:\n    \u2022Undefined or absent: No fema classification filtering\n    \u2022 -1 : Records without fema classification\n    \u2022 0 : Minor damage, equivalent to cat-score from 1 to 15\n    \u2022 1 : Moderate damage, equivalent to cat-score from 15 to 30\n    \u2022 2 : Moderate damage, equivalent to cat-score from 30 to 45\n    \u2022 3 : Moderate damage, equivalent to cat-score from 45 to 60\n    \u2022 4 : Major damage, equivalent to cat-score from 60 to 75\n    \u2022 5 : Major damage, equivalent to cat-score from 75 to 90\n    \u2022 6 : Destroyed, equivalent to cat-score from 90 to 100\n"
     
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
