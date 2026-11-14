# Matterport GraphQL API

Source: https://developers.matterport.com/api/

## Endpoints

| API | Endpoint | Availability |
|---|---|---|
| Model API | `https://api.matterport.com/api/models/graph` | All accounts |
| Account API | `https://api.matterport.com/api/accounts/graph` | Enterprise only |
| Import API | `https://api.matterport.com/api/import/graph` | Enterprise only (Beta) |

- Requests must come from **server-side** scripts only.
- GET (query string, escaped) and POST (JSON body) are both supported.

## Authentication (API token)

1. Go to my.matterport.com, Settings, Developer Tools, API Token Management.
2. Create a key (max **5** per account). You get a Token ID and a Token Secret.
3. The Token Secret is shown **once**. Store it securely.
4. Send HTTP Basic auth: Token ID as username, Token Secret as password. Enable preemptive auth in your HTTP library.

Warnings:
- Keys are admin-level and can do things like archive models and make purchases. Never share them or ship them in client code.
- Only Sandbox mode is enabled by default.

## Examples

### curl

```bash
curl --user "$TOKEN_ID:$TOKEN_SECRET" \
  'https://api.matterport.com/api/models/graph?query=\{models\{totalResults%20results\{id%20created%20modified%20visibility\}\}\}'
```

(curl does not encode whitespace, hence `%20`.)

### Python

```python
import requests

endpoint = 'https://api.matterport.com/api/models/graph'
query = {'query': '''
  query { models(query: "*") { totalResults results { id } } }
'''}
r = requests.post(endpoint, json=query, auth=(TOKEN_ID, TOKEN_SECRET))
print(r.json() if r.ok else r.status_code)
```

### Node.js

```javascript
const auth = Buffer.from(`${TOKEN_ID}:${TOKEN_SECRET}`).toString('base64');
const res = await fetch('https://api.matterport.com/api/models/graph', {
  method: 'POST',
  headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `query { models(query: "*") { totalResults results { id } } }`,
  }),
});
console.log(await res.json());
```

## Error codes

| Code | Meaning |
|---|---|
| `request.unauthenticated` | Missing or expired token |
| `request.unauthorized` | Operation or field not permitted |
| `request.invalid` | Query could not be processed |
| `error.internal` | Server error |
| `not.found` | Object does not exist |
| `not.unique` | Multiple records matched a secondary-index lookup |
| `quota.exceeded` | Resource-limited mutation over its limit (for example activating more models than the subscription allows) |

The docs page does not state API rate limits.

## Related pages

- Model API: https://developers.matterport.com/api/model/overview/
- Property Intelligence API: https://developers.matterport.com/api/property-intelligence/
- GeoCoordinate API: https://developers.matterport.com/api/model/geocoordinates/
- Import API (Beta): https://developers.matterport.com/api/import/overview/
- Account API: https://developers.matterport.com/api/account/overview/
- Webhooks API: https://developers.matterport.com/webhooks/
- GraphQL reference: https://api.matterport.com/model/docs/reference
- GraphiQL consoles: [Model](https://api.matterport.com/model/graphiql), [Account](https://api.matterport.com/account/graphiql), [Import](https://api.matterport.com/import/graphiql)
- API Changelog: https://developers.matterport.com/api-changelog/
