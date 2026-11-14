# swagger-controller-impl

## GET /swagger-ui/index.html

### Responses

- **200**: OK (text/html)
- **400**: Bad Request (*/*)
- **401**: Unauthorized (*/*)
- **413**: Payload Too Large (*/*)
- **500**: Internal Server Error (*/*)

## GET /swagger-ui/swagger-initializer-vexcel.js

### Responses

- **200**: OK (application/javascript)
- **400**: Bad Request (*/*)
- **401**: Unauthorized (*/*)
- **413**: Payload Too Large (*/*)
- **500**: Internal Server Error (*/*)

## GET /swagger-ui/swagger-ui.css

### Responses

- **200**: OK (text/css)
- **204**: No Content (*/*)
- **400**: Bad Request (*/*)
- **401**: Unauthorized (*/*)
- **403**: Forbidden (*/*)
- **404**: Not Found (*/*)
- **408**: Request Timeout (*/*)
- **412**: Precondition Failed (*/*)
- **413**: Payload Too Large (*/*)
- **422**: Unprocessable Entity (*/*)
- **429**: Too Many Requests (*/*)
- **500**: Internal Server Error (*/*)
- **503**: Service Unavailable (*/*)

## GET /swagger-ui/vexcel/img/{fileName}

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| fileName | path | True | string |  |

### Responses

- **200**: OK (*/*)
- **400**: Bad Request (*/*)
- **401**: Unauthorized (*/*)
- **413**: Payload Too Large (*/*)
- **500**: Internal Server Error (*/*)
