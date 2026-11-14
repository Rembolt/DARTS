# elements/detect

## POST /elements/detect

Note: See the Schema section at the bottom of the page for POST parameters.

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
      "images": [
       {
        "endpoint": "oriented/extract",
        "request": {
         "layer": "urban, urban-r, urban-g, wide-area, graysky, graysky-g",
         "wkt": "POLYGON ((-97.353029 37.683617, -97.346935 37.683617, -97.346935 37.687624, -97.353029 37.687624, -97.353029 37.683617))"
        }
       }
      ],
      "model-input": {
       "elements": [
        {
         "label": "red car",
         "detection-threshold": 0.5
        }
       ],
       "include": [
        "pixel-mask",
        "pixel-bbox",
        "geometry",
        "confidence"
       ]
      }
     }
    }
   },
   "schema": {
    "type": "object",
    "description": "Request body for POST /elements/detect. Defines the area of interest, the imagery to use, and the objects to detect.",
    "properties": {
     "bbox-dimensions": {
      "type": "array",
      "description": "Defines the dimensions (in meters) of the bounding box of the region surrounding your input point wkt. The point will be the center of the bounding box. Defined as bbox-dimensions=width,height.",
      "items": {
       "type": "number",
       "format": "double",
       "description": "Defines the dimensions (in meters) of the bounding box of the region surrounding your input point wkt. The point will be the center of the bounding box. Defined as bbox-dimensions=width,height."
      }
     },
     "buffer-meter": {
      "type": "number",
      "format": "double",
      "description": "The buffer around the wkt point or polygon (in meters)."
     },
     "images": {
      "type": "array",
      "description": "List of images to be used to detect elements.",
      "items": {
       "type": "object",
       "description": "List of images to be used to detect elements.",
       "properties": {
        "endpoint": {
         "type": "string",
         "description": "Endpoint to be used to extract the imagery"
        },
        "request": {
         "type": "object",
         "description": "Request parameters",
         "properties": {
          "bbox-dimensions": {
           "type": "string",
           "description": "Defines the dimensions (in meters) of the bounding box of the region surrounding your input point wkt. The point will be the center of the bounding box. Defined as bbox-dimensions=width,height."
          },
          "buffer-meter": {
           "type": "number",
           "format": "double",
           "description": "The buffer around the wkt point or polygon (in meters)."
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
          "destination-dimensions": {
           "type": "string",
           "description": "Defines the dimensions (in pixels) of the output image frame. The requested region (as defined by wkt) will be centered within the image frame with two options fit or fill. Defined as destination-dimensions=width,height,fit|fill. See GET parameters for more details."
          },
          "graysky-event": {
           "type": "string",
           "description": "The event name of the Graysky collection event"
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
          "min-first-publish-date": {
           "type": "string",
           "format": "date-time",
           "description": "The date of the earliest acceptable first publish date. Collections with first publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss)"
          },
          "min-last-publish-date": {
           "type": "string",
           "format": "date-time",
           "description": "The date of the earliest acceptable last publish date. Collections with last publish date prior to this date will be excluded. (pattern: yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss)"
          },
          "srid": {
           "type": "integer",
           "format": "int32",
           "default": 4326,
           "description": "The SRID code for the projection reference representing the coordinates of the given coordinates or WKT"
          },
          "wkt": {
           "type": "string",
           "description": "The well-known-text (point or polygon)"
          }
         }
        }
       }
      }
     },
     "model-input": {
      "type": "object",
      "description": "Defines what to detect and which fields to include in each detection result. Passed 
```

### Responses

- **200**: OK (application/json, text/plain)
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
