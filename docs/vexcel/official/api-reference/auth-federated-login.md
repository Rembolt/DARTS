# auth/federated-login

## POST /auth/federated-login

Note: See the Schema section at the bottom of the page for POST parameters

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| arg0 | query | True | object |  |

### Responses

- **200**: OK (application/json)
- **400**: Bad Request (*/*)
- **401**: Unauthorized (*/*)
- **413**: Payload Too Large (*/*)
- **500**: Internal Server Error (*/*)
