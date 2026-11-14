# ortho/wmts

## GET /ortho/wmts

**WMTS get Capabilities / get Tile**

### Introduction

The WebMapTileService (WMTS) allows users to display Vexcel’s Ortho imagery from multiple layers in third party applications such as ArcGIS, QGIS, Global Mapper, etc. This service is based on the WMTS protocol as developed and documented by the Open Geospatial Consortium

 ℹ️ *This service is similar to the ortho/tile service. While both return tiled imagery, WebMapTileService uses the standardized parameters (defined by the Open Geospatial Consortium) while GetOrthoImageTile uses custom parameters specific to Vexcel’s imagery.*

<img src="../resources/img/docs/ortho_wmts.png"/>

### Technical Details

The WebMapTileService is comprised of two operations, defined by the *request* parameter:
<ul><li>GetCapabilities - Returns an XML document that outlines the available resources and requirements of the WMTS service. Contains:<ul><li>xml file</li><li>service description</li><li>available layers</li><li>image/metadata formats</li><li>matrix sets (EPSG codes)</li><li>etc</li></ul></li><li>GetTile - Returns individual imagery tiles that conform to the WMTS specifications.<ul><li>256x256 pixel tiles</li><li>24-bit depth</li><li>Variable resolution (layer dependent)</li><li>Image format: JPEG or PNG</li><li>Output format: Single image file</li></ul></li></ul>

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| service | query | True | string | service called (has to be WMTS) |
| request | query | True | string | request called (getCapabilities/getTile) |
| layer | query | False | string | The name of the desired layer.<br><b>Allowed values</b>: <i>urban, urban-r, wide-area, urban-g, graysky</i> |
| style | query | False | string | Channel rendering the image (getTile) |
| tileMatrixSet | query | False | string | Identifier of the image's tile matrix set (usually the srid) (getTile) |
| tileMatrix | query | False | integer | The identifier of the image's tile matrix (usually the zoom) (getTile) |
| tileRow | query | False | integer | The number of the image's row (getTile) |
| tileCol | query | False | integer | The number of the image's column (getTile) |
| format | query | False | string | The file format of the image. Allowed: jpeg, png, tiff, jpeg/png |

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
