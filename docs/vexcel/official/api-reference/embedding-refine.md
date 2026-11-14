# embedding/refine

## POST /embedding/refine

**Refine Embedding**

### Request body

```json
{
 "content": {
  "application/json": {
   "examples": {
    "Default request": {
     "description": "Default request",
     "value": {
      "feedback": [
       {
        "quadkey": "023110321110313010",
        "collection": "n37w97-us-ks-wichita-2024",
        "orientation-source": "spherical-ortho",
        "positive-vote": true
       },
       {
        "quadkey": "023110321110313011",
        "collection": "n37w97-us-ks-wichita-2024",
        "orientation-source": "spherical-ortho",
        "positive-vote": false
       }
      ],
      "search-text": "car"
     }
    }
   },
   "schema": {
    "type": "object",
    "description": "Request body for POST /embedding/refine.",
    "properties": {
     "feedback": {
      "type": "array",
      "items": {
       "type": "object",
       "description": "A single vote on a tile. The tile is identified by quadkey, collection and source.product-type (orientation-source is accepted as an alias on input).",
       "properties": {
        "collection": {
         "type": "string",
         "description": "The collection the tile belongs to. Required together with quadkey and orientation-source."
        },
        "orientation-source": {
         "type": "string",
         "writeOnly": true
        },
        "positive-vote": {
         "type": "boolean",
         "description": "Whether the user voted positively for this tile. If false, the user voted negatively."
        },
        "quadkey": {
         "type": "string",
         "description": "The quadkey of the tile being voted on. Together with collection and product-type, uniquely identifies a tile."
        },
        "source.product-type": {
         "type": "string",
         "description": "The orientation source of the tile (for example, ortho, oblique-north, oblique-south, oblique-east, oblique-west). Required together with quadkey and collection to uniquely identify a tile."
        }
       }
      }
     },
     "search-image": {
      "type": "string",
      "description": "A base64 encoded image to be used in the similarity search. Use the same search parameter as the <code>embedding/extract</code> request whose results were voted on; it is the starting point for the reshaped search vector."
     },
     "search-location": {
      "type": "string",
      "description": "A wkt point that will be used to select an embedding from our library. That embedding will then be used in the similarity search. Use the same search parameter as the <code>embedding/extract</code> request whose results were voted on; it is the starting point for the reshaped search vector."
     },
     "search-refinement": {
      "type": "string",
      "description": "A refinement previously returned by embedding/refine. Pass it to reload that refinement and modify or update it. Any new examples you supply are applied on top of it. The response contains a new refinement. Omit this parameter to start a new refinement from scratch. \nFormat: sf_v{version}.{blob}, where version is 1 (full trained model)."
     },
     "search-text": {
      "type": "string",
      "description": "A string representing the search. Use the same search parameter as the <code>embedding/extract</code> request whose results were voted on; it is the starting point for the reshaped search vector."
     },
     "search-url": {
      "type": "string",
      "description": "An URL to a publicly accessible image. <b>Note</b>: Vexcel imagery URLs (e.g. oriented/extract or ortho/extract) may be provided, but POST is recommended instead of GET. Vexcel URLs can contain characters (such as &, +, #, or spaces) that break when passed as a GET query parameter. POST requests contain the URL in the body, avoiding this issue. Use the same search parameter as the <code>embedding/extract</code> request whose results were voted on; it is the starting point for the reshaped search vector."
     },
     "search-vector": {
      "type": "string",
      "description": "A vector embedding representing the search. Use the same search parameter as the <code>embedding/extract</code> request whose results were voted on; it is the starting point for the reshaped search vector."
     }
    }
   }
  }
 },
 "required": true
}
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
