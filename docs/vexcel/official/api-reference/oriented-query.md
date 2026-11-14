# oriented/query

## GET /oriented/query

**Returns a list of oriented images and their associated metadata.**

### Introduction

This service will take a point or polygon (in wkt format) and identify all available oriented images available for that location. The file will contain the geometry of each image's geographic extent as well as metadata pertaining to the image. This service is available for all layers in the Vexcel library.

<img src="../resources/img/docs/oriented_query.png"/>

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| image-name | query | False | string | The image name(s) for the image(s) |
| wkt | query | False | string | The well-known-text (point or polygon)    ⓘ Note: Information is returned only for real-world coordinates; WKTs that extend beyond ±180° longitude are accepted, but results are limited to the portion of the geometry that intersects valid Earth bounds. |
| srid | query | False | integer | The SRID code for the projection reference representing the coordinates of the given coordinates or WKT |
| spatial-operation | query | False | string | The spatial-query used to specify which images to select based on their relationship to the user’s input wkt.  **Note**: This parameter will be ignored if either:<ul><li>wkt is defined as a point or line</li><li>image-name is defined</li></ul>  <i>Available values</i>: <ul><li>intersect (default): images must intersect with the input wkt to be returned.</li><li>within-wkt: images must be completely contained within the input wkt to be returned. </li><li>covers-wkt: images must cover the input wkt entirely to be returned.</li></ul> Allowed: intersect, covers-wkt, within-wkt |
| layer | query | False | string | The desired layer. If multiple layers are to be considered, separate the layer names with commas:<br><br><i>Available values</i>: urban, urban-r, urban-g, wide-area, graysky, graysky-g |
| collection | query | False | string | The identifier of the collection which contains the desired data referred to as collection in metadata |
| graysky-event | query | False | string | The event name of the graysky collection event |
| product-type | query | False | string | The camera-axis and/or cardinal orientation of the image to be returned. This is a filtering parameter, if more than one image matches the defined product-type, the service will select and return only one image.<br><br><i>Available values</i>: <ul><li><b>all</b> (default): all product-types will be considered</li><li><b>nadir</b>: only nadir images will be considered</li><li><b>oblique</b>: only oblique images (of any cardinal orientation) will be considered</li><li><b>oblique-north</b>: only oblique-north images will be considered</li><li><b>oblique-south</b>: only oblique-south images will be considered</li><li><b>oblique-west</b>: only oblique-west images will be considered</li><li><b>oblique-east</b>: only oblique-east images will be considered</li></ul> |
| collect-year | query | False | integer | The collection year of the tiles expressed with 4 digits |
| min-capture-date | query | False | string | The date of the earliest acceptable capture date. Collections with capture date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-capture-date | query | False | string | The date of the acceptable last capture date. Collections with capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-first-publish-date | query | False | string | The date of the earliest acceptable first publish date. Collections with first publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-publish-date | query | False | string | The date of the latest acceptable first publish date. Collections with first publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-publish-date | query | False | string | The date of the earliest acceptable last publish date. Collections with last publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-publish-date | query | False | string | The date of the latest acceptable last publish date. Collections with last publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| metadata-format | query | False | string | The format language of the metadata response:<br><br><i>Default Value</i>: json<br><br><i>Available values</i>: json, xml, csv Allowed: json, xml |
| bands | query | False | string | The color bands in which the returned image will be comprised of.<br><br><i>Available values</i>: <ul><li><b>all</b> (default): Metadata is received from all available bands</li><li><b>rgb</b>: Metadata is returned in red, green and blue bands. This matches the visible spectrum.</li><li><b>irg</b>: Metadata is returned in infrared, red and green bands. These bands are color-shifted: infrared is displayed as red, red is displayed as green and green is displayed as blue.</li></ul> Allowed: all, rgb, irg |
| include | query | False | string | Fields to be included on the JSON result, separated by commas. Won't return anything if empty:<br><br><i>Default Value</i>: image-name, geometry<br><br><i>Available values</i>: <ul><li><i>layer fields: </i>layer,  source-layer</li><li><i>oriented image fields: </i>image-name, original-image-name, original-shot-id, image-center, geometry, capture-date, camera-pos-x, camera-pos-y, camera-pos-z, ground-z, omega, phi, kappa, flight-line-id, tile_size_x, tile_size_y, band</li><li><i>event fields: </i>graysky-event</li><li><i>collection fields: </i>collection, pretty-name, capture-year, first-capture-date, last-capture-date</li><li><i>coverage fields: </i>min-gsd, max-gsd, avg-gsd, area, z-index, first-publish-date, last-publish-date, max-zoom, product-type</li><li><i>utm-zone fields: </i>utm-zone</li><li><i>camera fields: </i>camera-technology, focal-length, pp0-x, pp0-y, k0, k1, k2, k3, p1, p2, b1, b2, raster-size-width, raster-size-height, pixel-size</li><li><i>calculated fields: </i>relation-polygon-in-image, relation-image-in-polygon</li></ul> |
| order-by | query | False | string | The method by which to order the images matching the input parameters. This parameter can take multiple values, separated by commas, and will honor them in the order in which they are defined.<br><br><b>Allowed values:</b> ```layer-asc```, ```layer-desc```, ```image-name-asc```, ```image-name-desc```, ```image-date-asc```, ```image-date-desc```, ```image-center-distance-asc```, ```image-center-distance-desc```, ```collection-first-capture-date-asc```, ```collection-first-capture-date-desc```, ```collection-last-capture-date-asc```, ```collection-last-capture-date-desc```, ```collection-avg-gsd-asc```, ```collection-avg-gsd-desc```<br><br><i><b>*Note:</b> Because layer importance is subjective, if the <code>layer</code> parameter is undefined, <code>order-by</code> will ignore <code>layer-asc</code> and <code>layer-desc</code>, instead treating all possible layers equally.<i/><br><br><i><b>*Note:</b> If no order is provided, data will be returned in their natural order.</i> |
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

## POST /oriented/query

**Returns a list of oriented images and their associated metadata.**

### Introduction

This service will take a point or polygon (in wkt format) and identify all available oriented images available for that location. The file will contain the geometry of each image's geographic extent as well as metadata pertaining to the image. This service is available for all layers in the Vexcel library.

<img src="../resources/img/docs/oriented_query.png"/>

### Request body

```json
{
 "content": {
  "application/json": {
   "examples": {
    "Query by wkt": {
     "description": "Query by wkt",
     "value": {
      "layer": "urban",
      "wkt": "POLYGON((-97.4536 37.6398, -97.0034 37.6398, -97.0034 37.7217, -97.4536 37.7217, -97.4536 37.6398))",
      "srid": 4326,
      "include": "image-name,geometry,product-type,capture-date,collection,first-publish-date,last-publish-date",
      "order-by": "layer-asc, collection-last-capture-date-desc, image-center-distance-asc",
      "page-size": 1,
      "page": 1
     }
    },
    "Query by wkt (EPSG 3857)": {
     "description": "Query by wkt (EPSG 3857)",
     "value": {
      "layer": "urban",
      "wkt": "POLYGON ((-10848485.127971364 4528665.856260934, -10798369.093216235 4528665.856260934, -10798369.093216235 4540185.611807983, -10848485.127971364 4540185.611807983, -10848485.127971364 4528665.856260934))",
      "srid": 3857,
      "include": "image-name,geometry,product-type,capture-date,collection,first-publish-date,last-publish-date",
      "order-by": "layer-asc, collection-last-capture-date-desc, image-center-distance-asc",
      "page-size": 1,
      "page": 1
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
     "bands": {
      "type": "string",
      "default": "ALL",
      "description": "The color bands in which the returned image will be comprised of.<br><br><i>Available values</i>: <ul><li><b>all</b> (default): Metadata is received from all available bands</li><li><b>rgb</b>: Metadata is returned in red, green and blue bands. This matches the visible spectrum.</li><li><b>irg</b>: Metadata is returned in infrared, red and green bands. These bands are color-shifted: infrared is displayed as red, red is displayed as green and green is displayed as blue.</li></ul>",
      "enum": [
       "all",
       "rgb",
       "irg"
      ]
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
     "image-name": {
      "type": "string",
      "description": "The image name(s) for the image(s)"
     },
     "include": {
      "type": "string",
      "default": "image-name, product-type, geometry, capture-date, collection, graysky-event",
      "description": "Fields to be included on the JSON result, separated by commas. Won't return anything if empty:<br><br><i>Default Value</i>: image-name, geometry<br><br><i>Available values</i>: <ul><li><i>layer fields: </i>layer</li><li><i>oriented image fields: </i>image-name, original-image-name, original-shot-id, image-center, geometry, capture-date, camera-pos-x, camera-pos-y, camera-pos-z, ground-z, omega, phi, kappa, flight-line-id</li><li><i>event fields: </i>graysky-event</li><li><i>collection fields: </i>collection, pretty-name, capture-year, first-capture-date, last-capture-date</li><li><i>coverage fields: </i>min-gsd, max-gsd, avg-gsd, area, z-index, collection-geometry, first-publish-date, last-publish-date, max-zoom, product-type</li><li><i>utm-zone fields: </i>utm-zone</li><li><i>camera fields: </i>camera-technology, focal-length, pp0-x, pp0-y, k0, k1, k2, k3, p1, p2, b1, b2, raster-size-width, raster-size-height, pixel-size</li><li><i>calculated fields: </i>relation-polygon-in-image, relation-image-in-polygon</li></ul>",
      "enum": [
       "layer",
       "image-name",
       "original-image-name",
       "original-shot-id",
       "image-center",
       "geometry",
       "capture-date",
       "camera-pos-x",
       "camera-pos-y",
       "camera-pos-z",
       "ground-z",
       "omega",
       "phi",
       "kappa",
       "flight-line-id",
       "graysky-event",
       "collection",
       "pretty-name",
       "capture-year",
       "first-capture-date",
       "last-capture-date",
       "min-gsd",
       "max-gsd",
       "avg-gsd",
       "area",
       "z-index",
       "collection-geometry",
       "first-publish-date",
       "last-publish-date",
       "max-zoom",
       "product-type",
       "utm-zone",
       "camera-technology",
       "focal-length",
       "pp0-x",
       "pp0-y",
       "k0",
       "k1",
       "k2",
       "k3",
       "p1",
       "p2",
       "b1",
       "b2",
       "raster-size-width",
       "raster-size-height",
       "pixel-size",
       "relation-polygon-in-image",
       "relation-image-in-polygon"
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
     "max-capture-date": {
      "type": "string",
      "format": "date-time",
      "description": "The date of the acceptable last capture date. Collections with capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss)"
     },
     "max-first-publish-date": {
      "type": "string",
      "format": "date-time",
      "description": "The date of the latest acceptable first publish date. Collections with first publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss)"
     },
     "max-last-publish-date": {
      "type": "string",
      "format": "date-time",
      "description": "The date of the latest acceptable last publish date. Collections with last publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss)"
     },
     "metadata-format": {
      "type": "strin
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
