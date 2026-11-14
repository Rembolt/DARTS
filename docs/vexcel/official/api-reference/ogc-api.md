# ogc-api

## GET /ogc-api

### Responses

- **200**: OK (*/*)
- **400**: Bad Request (*/*)
- **401**: Unauthorized (*/*)
- **413**: Payload Too Large (*/*)
- **500**: Internal Server Error (*/*)

## GET /ogc-api/

### Responses

- **200**: OK (*/*)
- **400**: Bad Request (*/*)
- **401**: Unauthorized (*/*)
- **413**: Payload Too Large (*/*)
- **500**: Internal Server Error (*/*)

## GET /ogc-api/api

<p>The <code>/ogc-api/api</code> endpoint returns the OpenAPI definition document for this OGC API - Features service. The response describes all available endpoints, supported parameters, and response schemas in a machine-readable format.</p>
      <p>This endpoint is used by OGC-compliant clients and tooling to introspect the service programmatically. The response format follows the OpenAPI 3.x specification.</p>

### Responses

- **200**: OK (*/*)
- **400**: Bad Request (*/*)
- **401**: Unauthorized (*/*)
- **413**: Payload Too Large (*/*)
- **500**: Internal Server Error (*/*)

## GET /ogc-api/collections

<p>The <code>/ogc-api/collections</code> endpoint returns a list of all feature collections available through this service. Each collection represents a distinct Vexcel dataset — such as properties, structures, or damage assessments — and is described by its <code>id</code>, title, spatial extent, temporal coverage, and supported coordinate reference systems.</p>
      <p>Use this endpoint to discover what datasets are available before querying items. Each collection in the response includes a link to its items endpoint and its queryables, which describe the properties available for CQL2 filtering.</p>

### Responses

- **200**: OK (*/*)
- **400**: Bad Request (*/*)
- **401**: Unauthorized (*/*)
- **413**: Payload Too Large (*/*)
- **500**: Internal Server Error (*/*)

## GET /ogc-api/collections/{collectionId}

<p>The <code>/ogc-api/collections/{collectionId}</code> endpoint returns metadata for a single feature collection. The response includes the collection's title, description, spatial extent, temporal coverage, and the list of supported coordinate reference systems.</p>
      <p>The response also includes links to the collection's items endpoint and its queryables, which enumerate the properties available for use in CQL2 filter expressions. Use <code>/ogc-api/collections</code> to look up valid <code>collectionId</code> values.</p>

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| collectionId | path | True | string |  |

### Responses

- **200**: OK (*/*)
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

## GET /ogc-api/collections/{collectionId}/items

<p>The <code>/ogc-api/collections/{collectionId}/items</code> endpoint returns a GeoJSON <code>FeatureCollection</code> of items from the specified collection. Without filters, returns all items up to the collection's default <code>limit</code>. Results can be refined using any combination of the following:</p>
      <ul>
        <li><code>bbox</code> — spatial filter by bounding box, specified as <code>minLon,minLat,maxLon,maxLat</code> in WGS84. Use <code>bbox-crs</code> to supply coordinates in an alternate CRS.</li>
        <li><code>datetime</code> — temporal filter; accepts a single instant (<code>2024-01-01T00:00:00Z</code>) or a closed or open interval (<code>2024-01-01T00:00:00Z/2024-06-01T00:00:00Z</code>).</li>
        <li><code>filter</code> — attribute filter using a CQL2 expression (e.g. <code>damage_type = 'roof'</code>). Defaults to <code>cql2-text</code> syntax. Use <code>/ogc-api/collections/{collectionId}/queryables</code> to discover filterable properties.</li>
        <li><code>crs</code> — coordinate reference system for response geometries. Defaults to WGS84.</li>
      </ul>      <p>Use <code>limit</code> and <code>offset</code> together to page through large result sets. Default and maximum values for <code>limit</code> vary by collection.</p>

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| collectionId | path | True | string |  |
| limit | query | False | integer | Maximum number of features to return. Defaults and upper bounds vary per collection. |
| bbox | query | False | array | Bounding box: minLon,minLat,maxLon,maxLat (WGS84) |
| bbox-crs | query | False | string | CRS for the bounding box |
| datetime | query | False | string | Temporal filter: date-time or date-time/date-time |
| crs | query | False | string | CRS of the response |
| offset | query | False | integer | Offset for pagination |
| filter | query | False | string | CQL2 filter expression |
| filter-lang | query | False | string | Language of the filter expression (cql2-text or cql2-json) Allowed: cql2-text |
| filter-crs | query | False | string | CRS for geometry literals in the filter expression |

### Responses

- **200**: OK (*/*)
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

## GET /ogc-api/collections/{collectionId}/items/{featureId}

<p>The <code>/ogc-api/collections/{collectionId}/items/{featureId}</code> endpoint returns the GeoJSON <code>Feature</code> identified by <code>featureId</code> within the specified collection. The response includes the feature's geometry and all associated properties.</p>
      <p>Use the optional <code>crs</code> parameter to request the response geometry in a specific coordinate reference system. If omitted, geometries are returned in WGS84. Feature IDs can be obtained from the items endpoint (<code>/ogc-api/collections/{collectionId}/items</code>).</p>

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| collectionId | path | True | string |  |
| featureId | path | True | string |  |
| crs | query | False | string | CRS of the response |

### Responses

- **200**: OK (*/*)
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

## GET /ogc-api/collections/{collectionId}/queryables

<p>The <code>/ogc-api/collections/{collectionId}/queryables</code> endpoint returns the set of feature properties that can be used in CQL2 <code>filter</code> expressions when querying items in the specified collection. The response is a JSON Schema document describing each queryable property by name, type, and any constraints or enumerated values.</p>
      <p>Use this endpoint to discover what attributes are available for filtering before constructing a <code>filter</code> parameter on the items endpoint (<code>/ogc-api/collections/{collectionId}/items</code>). Not all properties on a feature are necessarily queryable; this endpoint reflects only those that are indexed for filtering.</p>

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| collectionId | path | True | string |  |

### Responses

- **200**: OK (*/*)
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

## GET /ogc-api/conformance

<p>The <code>/ogc-api/conformance</code> endpoint returns the list of OGC API conformance classes implemented by this service. Each conformance class is identified by a URI and corresponds to a specific set of capabilities defined in the OGC API - Features standard or its extensions.</p>
      <p>OGC-compliant clients use the conformance declaration to determine which optional capabilities are available before making requests — for example, whether CQL2 filter expressions, CRS negotiation, or advanced pagination are supported.</p>

### Responses

- **200**: OK (*/*)
- **400**: Bad Request (*/*)
- **401**: Unauthorized (*/*)
- **413**: Payload Too Large (*/*)
- **500**: Internal Server Error (*/*)
