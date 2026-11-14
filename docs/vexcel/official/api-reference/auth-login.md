# auth/login

## POST /auth/login

Note: See the Schema section at the bottom of the page for POST parameters

### Request body

```json
{
 "content": {
  "application/json": {
   "examples": {
    "Default request": {
     "description": "Default request",
     "value": {
      "username": "username",
      "password": "password"
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
     "password": {
      "type": "string"
     },
     "username": {
      "type": "string"
     }
    }
   }
  }
 }
}
```

### Responses

- **200**: Successful (application/json)
- **400**: Bad Request (application/json)
- **401**: Authentication Failure (application/json)
- **404**: Not found (application/json)
- **413**: Payload Too Large (*/*)
- **500**: Internal Server Error (application/json)
