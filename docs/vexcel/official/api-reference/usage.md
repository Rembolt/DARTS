# usage

## GET /usage/query

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| period-start | query | True | string | "The inclusive start of the usage window. Usage occurring before this timestamp is excluded. Format: <code>yyyy-MM-dd'T'HH:mm:ss</code> <i>(ISO-8601, UTC)</i>" |
| period-end | query | True | string | The exclusive end of the usage window. Usage occurring at or after this timestamp is excluded. Format: <code>yyyy-MM-dd'T'HH:mm:ss</code> <i>(ISO-8601, UTC)</i> |
| group | query | False | string | The sub-company group from which usage traffic belongs. Only usage from this defined group will be returned - all usage outside the defined group is excluded. |
| user | query | False | string | The email address of the individual user from which usage traffic belongs. Only usage from this defined user will be returned - all usage outside the defined user is excluded. |
| aggregation | query | False | string | The level at which traffic is aggregated. Must be <code>group</code> or <code>user</code>. If undefined, usage will not be aggregated - all usage will pertain to the defined entity (company, group or user). |

### Responses

- **200**: OK (application/json, application/xml)
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

## POST /usage/query

<i>Note: See the Schema section at the bottom of the page for POST parameters.</i>

### Request body

```json
{
 "content": {
  "application/json": {
   "examples": {
    "Default request": {
     "description": "Query usage by period",
     "value": {
      "period-start": "2026-01-01",
      "period-end": "2026-12-31"
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
     "aggregation": {
      "type": "string"
     },
     "group": {
      "type": "string"
     },
     "period-end": {
      "type": "string",
      "description": "The ending date/time in which to query the usage logs"
     },
     "period-start": {
      "type": "string",
      "description": "The beginning date/time in which to query the usage logs"
     },
     "user": {
      "type": "string"
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
