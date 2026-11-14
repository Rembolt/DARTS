# property/report

## GET /property/report

**/report**

### Introduction


This service will return a professionally formatted PDF report of the selected property. The report will be comprised of both imagery and elements from the Vexcel library. The report will contain slides of the parcel-based elements, each of the parcel's structures along with their corresponding element objects as well as imagery from multiple collections and orientations, if available. This service is particularly useful to:
<ul><li>Retrieve a comprhensive overview of a property.</li><li>Share property information and imagery with a client or partner.</li><li>Record on file the historical condition of a property.</li></ul>
<img src="../resources/img/docs/property-report.png"/>

### Technical Details


This service has many parameters to define which imagery to include or exclude. Additionally there is a parameter named ```template-url``` to enable custom formatted PDF reports. The ```alt-image``` parameter defines what to do if a requested image is unavailable.

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| wkt | query | True | string | The well-known-text (only point is supported) |
| srid | query | False | integer | The SRID code for the projection reference representing the coordinates of the given coordinates or WKT |
| urban-collections | query | False | string | Will list all desired collections of historical Urban imagery:<br><br><i>Available values</i>: <ul><li>NONE or absent (default): means no collection is wanted</li><li>ALL: means all available collections</li><li>list of collections: Multiple values must be separated by a comma</li></ul> |
| wide-area-collections | query | False | string | Will list all desired collections of historical Wide-Area imagery:<br><br><i>Available values</i>: <ul><li>NONE or absent (default): means no collection is wanted</li><li>ALL: means all available collections</li><li>list of collections: Multiple values must be separated by a comma</li></ul> |
| graysky-collections | query | False | string | Will list all desired collections of historical Graysky imagery:<br><br><i>Available values</i>: <ul><li>NONE or absent (default): means no collection is wanted</li><li>ALL: means all available collections</li><li>list of collections: Multiple values must be separated by a comma</li></ul> |
| urban-irg-collections | query | False | string | Will list all desired collections of historical Urban IRG imagery:<br><br><i>Available values</i>: <ul><li>NONE or absent (default): means no collection is wanted</li><li>ALL: means all available collections</li><li>list of collections: Multiple values must be separated by a comma</li></ul> |
| wide-area-irg-collections | query | False | string | Will list all desired collections of historical Wide-Area IRG imagery:<br><br><i>Available values</i>: <ul><li>NONE or absent (default): means no collection is wanted</li><li>ALL: means all available collections</li><li>list of collections: Multiple values must be separated by a comma</li></ul> |
| graysky-irg-collections | query | False | string | Will list all desired collections of historical Graysky IRG imagery:<br><br><i>Available values</i>: <ul><li>NONE or absent (default): means no collection is wanted</li><li>ALL: means all available collections</li><li>list of collections: Multiple values must be separated by a comma</li></ul> |
| collection | query | False | string | This parameter will used for getting Elements attributes |
| template-url | query | False | string | The url to your own pptx template |
| unit-system | query | False | string | Determines the unitary system in which values are returned. Allowed: metric, imperial |
| alt-image | query | False | string | Choose what to do when an image is not found:<br><br><i>Available values</i>: <ul><li>drop-slide (default): Any slide containing any image not found will be removed from the PDF</li><li>template: The image from the template will be left unchanged</li><li>placeholder: A not found image placeholder will be used</li></ul> Allowed: DROP-SLIDE, TEMPLATE, PLACEHOLDER |

### Responses

- **200**: OK (application/pdf)
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

## POST /property/report

**/report**

### Introduction


This service will return a professionally formatted PDF report of the selected property. The report will be comprised of both imagery and elements from the Vexcel library. The report will contain slides of the parcel-based elements, each of the parcel's structures along with their corresponding element objects as well as imagery from multiple collections and orientations, if available. This service is particularly useful to:
<ul><li>Retrieve a comprehensive overview of a property.</li><li>Share property information and imagery with a client or partner.</li><li>Record on file the historical condition of a property.</li></ul>
<img src="../resources/img/docs/property-report.png"/>

### Technical Details


This service has many parameters to define which imagery to include or exclude. Additionally there is a parameter named ```template-url``` to enable custom formatted PDF reports. The ```alt-image``` parameter defines what to do if a requested image is unavailable.

### Request body

```json
{
 "content": {
  "application/json": {
   "examples": {
    "Request Elements report": {
     "description": "Request Elements report",
     "value": {
      "wkt": "POINT(-97.292867 37.676207)"
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
     "alt-image": {
      "type": "string",
      "default": "drop-slide",
      "description": "Choose what to do when an image is not found:<br><br><i>Available values</i>: <ul><li>drop-slide (default): Any slide containing any image not found will be removed from the PDF</li><li>template: The image from the template will be left unchanged</li><li>placeholder: A not found image placeholder will be used</li></ul>",
      "enum": [
       "DROP-SLIDE",
       "TEMPLATE",
       "PLACEHOLDER"
      ]
     },
     "collection": {
      "type": "string",
      "description": "The identifier of the collection which contains the desired data referred to as collection in metadata"
     },
     "custom-keywords": {
      "type": "object",
      "additionalProperties": {
       "type": "string"
      },
      "description": "Allows you to replace keywords or add new keywords and values<br><br>\"custom-keywords\" : {<br>        \"street_number\" : \"99999\", <br>        \"street_name\" : \"Test Street Name\"<br>}"
     },
     "graysky-collections": {
      "type": "string",
      "default": "none",
      "description": "Will list all desired collections of historical Graysky imagery:<br><br><i>Available values</i>: <ul><li>NONE or absent (default): means no collection is wanted</li><li>ALL: means all available collections</li><li>list of collections: Multiple values must be separated by a comma</li></ul>"
     },
     "graysky-irg-collections": {
      "type": "string",
      "default": "none",
      "description": "Will list all desired collections of historical Graysky IRG imagery:<br><br><i>Available values</i>: <ul><li>NONE or absent (default): means no collection is wanted</li><li>ALL: means all available collections</li><li>list of collections: Multiple values must be separated by a comma</li></ul>"
     },
     "srid": {
      "type": "integer",
      "format": "int32",
      "default": 4326,
      "description": "The SRID code for the projection reference representing the coordinates of the given coordinates or WKT"
     },
     "template-url": {
      "type": "string",
      "description": "The url to your own pptx template"
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
     "urban-collections": {
      "type": "string",
      "default": "none",
      "description": "Will list all desired collections of historical Urban imagery:<br><br><i>Available values</i>: <ul><li>NONE or absent (default): means no collection is wanted</li><li>ALL: means all available collections</li><li>list of collections: Multiple values must be separated by a comma</li></ul>"
     },
     "urban-irg-collections": {
      "type": "string",
      "default": "none",
      "description": "Will list all desired collections of historical Urban IRG imagery:<br><br><i>Available values</i>: <ul><li>NONE or absent (default): means no collection is wanted</li><li>ALL: means all available collections</li><li>list of collections: Multiple values must be separated by a comma</li></ul>"
     },
     "wide-area-collections": {
      "type": "string",
      "default": "none",
      "description": "Will list all desired collections of historical Wide-Area imagery:<br><br><i>Available values</i>: <ul><li>NONE or absent (default): means no collection is wanted</li><li>ALL: means all available collections</li><li>list of collections: Multiple values must be separated by a comma</li></ul>"
     },
     "wide-area-irg-collections": {
      "type": "string",
      "default": "none",
      "description": "Will list all desired collections of historical Wide-Area IRG imagery:<br><br><i>Available values</i>: <ul><li>NONE or absent (default): means no collection is wanted</li><li>ALL: means all available collections</li><li>list of collections: Multiple values must be separated by a comma</li></ul>"
     },
     "wkt": {
      "type": "string",
      "description": "The well-known-text (point or polygon)"
     }
    }
   }
  }
 },
 "required": true
}
```

### Responses

- **200**: OK (application/pdf)
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
