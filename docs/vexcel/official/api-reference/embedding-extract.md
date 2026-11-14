# embedding/extract

## GET /embedding/extract

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| search-text | query | False | string | A string representing the search. |
| search-url | query | False | string | An URL to a publicly accessible image.<br><b>Note</b>: Vexcel imagery URLs (e.g. oriented/extract or ortho/extract) may be provided, but POST is recommended instead of GET. Vexcel URLs can contain characters (such as &, +, #, or spaces) that break when passed as a GET query parameter. POST requests contain the URL in the body, avoiding this issue. |
| search-image | query | False | string | A base64 encoded image to be used in the similarity search. |
| search-location | query | False | string | A wkt point that will be used to select an embedding from our library. That embedding will then be used in the similarity search. |
| search-vector | query | False | string | A vector embedding representing the search. |
| search-refinement | query | False | string | A refinement filter produced by <code>embedding/refine</code>. Format: <code>sf_v{version}.{blob}[,{mode}]</code>, where <code>{blob}</code> is the opaque, base64url (no padding) encoded value returned by <code>embedding/refine</code> as its <code>search-refinement</code> field - it carries both the reshape search vector and the classifier, and is not meant to be constructed or inspected by hand.<br><b>version</b>:<ul><li><b>1</b>: the full trained SVM, including its kernel - required whenever the trained kernel (e.g. RBF) has no linear equivalent.</li></ul><b>mode</b> (optional, defaults to <code>all</code>):<ul><li><b>reshape</b>: use the blob's search vector as the similarity search vector (mutually exclusive with the other search parameters).</li><li><b>classify</b>: re-rank the embeddings matched by the other search parameters using the classifier's decision score, instead of plain similarity. Nothing is filtered out - every match is still returned, just reordered.</li><li><b>all</b>: apply both reshape and classify.</li></ul> |
| layer | query | False | string | The name of the desired layer.<br><b>Allowed values</b>: <i>urban, urban-r, urban-g, wide-area, graysky, graysky-g</i> |
| graysky-event | query | False | string | The identifier of the event which contains the desired imagery. |
| collection | query | False | string | The identifier of the collection which contains the desired imagery. |
| source.product-type | query | False | string | The camera-axis and/or cardinal orientation of the image used to generate the embedding used. Allowed values:<i>Available values</i>: <ul><li><b>all</b>: default</li><li><b>oblique</b>: only oblique embeddings will be returned</li><li><b>oblique-north</b>: only oblique-north embeddings will be returned</li><li><b>oblique-south</b>: only oblique-south embeddings will be returned</li><li><b>oblique-west</b>: only oblique-west embeddings will be returned</li><li><b>oblique-east</b>: only oblique-east embeddings will be returned</li><li><b>final-ortho</b>: only final-ortho embeddings will be returned</li></ul> |
| wkt | query | True | string | <p>A point or polygon specifying the area to be searched. If Point is specified, you also need to pass a buffer-meter.</p> </br><p><i><b>Note:</b> wkt is optional if the collection parameter is defined.</i></p> |
| buffer-meter | query | False | number | If WKT point is passed in, this value defines how large the search area is. |
| collect-year | query | False | integer | The collection year of the tiles expressed with 4 digits (e.g. 2021 or 2018). If year is omitted, a combination of the most recent information across all available years with combined coverage will be returned. |
| min-first-capture-date | query | False | string | The date of the earliest acceptable first capture date. Collections with first capture date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-capture-date | query | False | string | The date of the latest acceptable first capture date. Collections with first capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-capture-date | query | False | string | The date of the earliest acceptable last capture date. Collections with last capture date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-capture-date | query | False | string | The date of the latest acceptable last capture date. Collections with last capture date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-first-publish-date | query | False | string | The date of the earliest acceptable first publish date. Collections with first publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-first-publish-date | query | False | string | The date of the latest acceptable first publish date. Collections with first publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| min-last-publish-date | query | False | string | The date of the earliest acceptable last publish date. Collections with last publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| max-last-publish-date | query | False | string | The date of the latest acceptable last publish date. Collections with last publish date after to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss) |
| total-records | query | False | integer | <p>Specifies the maximum number of records to return with a maximum of 2500. This parameter is useful to prevent unexpectedly large billable requests or to improve response times. </p>  |
| page-size | query | False | integer | <p>Specifies the maximum number of records to return on each page of the response, up to a limit of 500. If page-size is omitted or exceeds 500, it defaults to 500. This parameter does not reduce the total number of records matching the query; it only controls how many records are returned per page. Smaller page-size values will result in more pages.</p> </br><p><i><b>Note:</b> This parameter is useful to prevent unexpectedly large billable requests or to improve response times.</i></p> |
| page | query | False | integer | <p>Requests that would return more records than allowed by the <code>page-size</code> parameter are paginated. <code>total-records</code> and <code>total-pages</code> are included in the response header for page 1 only; they are not included in subsequent pages. <code>current-page</code> is included on all page headers. The initial request returns page 1 by default; to request page 2, append <code>page=2</code> to the original request (URL or POST body) and resend.</p> </br><p><i><b>Note:</b> Only records in the requested pages are reported for billing. For example, if a query contains 2 pages but <code>page=2</code> is never requested, only the records received in page 1 are reported for billing.</i></p> |
| include | query | False | string | Fields to be included in the response, multiple values are to be separated by commas. For an efficient payload it is recommended to select only those objects that are important to your workflow.<br><br><b>Allowed values</b>: <i><code>score</code>, <code>geometry</code>, <code>quadkey</code>, <code>collection</code>, <code>vector</code>, <code>search-vector</code>, <code>product-type</code>, <code>refinement-score</code></i> |

### Responses

- **200**: OK (application/json)
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

## POST /embedding/extract

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
      "wkt": "POLYGON ((-97.353029 37.683617, -97.346935 37.683617, -97.346935 37.687624, -97.353029 37.687624, -97.353029 37.683617))",
      "include": "score, geometry, quadkey, collection, vector, search-vector, product-type",
      "layer": "urban, urban-r, urban-g, wide-area, graysky, graysky-g",
      "search-text": "Red Car",
      "max-records": 100
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
     "buffer-meter": {
      "type": "number",
      "format": "double",
      "description": "If WKT point is passed in, this value defines how large the search area is."
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
      "description": "Fields to be included in the response, multiple values are to be separated by commas. For an efficient payload it is recommended to select only those objects that are important to your workflow.<br><br><b>Allowed values</b>: <i><code>score</code>, <code>geometry</code>, <code>quadkey</code>, <code>collection</code>, <code>vector</code>, <code>search-vector</code>, <code>source.product-type</code>, <code>refinement-score</code></i>"
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
     "local": {
      "type": "string",
      "writeOnly": true
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
     "page": {
      "type": "integer",
      "format": "integer",
      "default": 1,
      "description": "<p>Requests that would return more records than allowed by the <code>page-size</code> parameter are paginated. <code>total-records</code> and <code>total-pages</code> are included in the response header for page 1 only; they are not included in subsequent pages. <code>current-page</code> is included on all page headers. The initial request returns page 1 by default; to request page 2, append <code>page=2</code> to the original request (URL or POST body) and resend.</p>\n</br><p><i><b>Note:</b> Only records in the requested pages are reported for billing. For example, if a query contains 2 pages but <code>page=2</code> is never requested, only the records received in page 1 are reported for billing.</i></p>"
     },
     "page-size": {
      "type": "integer",
      "format": "integer",
      "default": 500,
      "description": "<p>Specifies the maximum number of records to return on each page of the response, up to a limit of 500. If page-size is omitted or exceeds 500, it defaults to 500. This parameter does not reduce the total number of records matching the query; it only controls how many records are returned per page. Smaller page-size values will result in more pages.</p>\n</br><p><i><b>Note:</b> This parameter is useful to prevent unexpectedly large billable requests or to improve response times.</i></p>"
     },
     "search-image": {
     
```

### Responses

- **200**: OK (application/json)
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
