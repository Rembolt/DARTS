# Private Model Embed (PME) and OAuth

Source: https://developers.matterport.com/oauth/private-model-embed/

PME lets you embed **private** spaces on your own site without making them public or requiring Matterport logins. Your server mints short-lived access links on demand.

**Requires:** Enterprise account with PME enabled (contact your Account Manager), a server-side script, and a page embedding Showcase via the SDK.

## Flow summary

1. Register app: get client ID and secret.
2. Server gets an account-level OAuth token.
3. Server calls a GraphQL mutation to create a model-scoped link or token.
4. Browser connects the SDK with that token and refreshes it as needed.
5. Optionally revoke the token.

## Step 0: Register the application

my.matterport.com, Settings, Developer Tools, **Reset secret**. Record the client ID and the new secret (shown once).

## Step 1: Get an OAuth access token (server-side)

`POST https://api.matterport.com/api/oauth/token`, `Content-Type: application/x-www-form-urlencoded`

| Field | Value |
|---|---|
| `grant_type` | `client_credentials` |
| `client_id` | OAuth app ID |
| `client_secret` | OAuth app secret |

```bash
curl -X POST 'https://api.matterport.com/api/oauth/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode "client_id=$CLIENT_ID" \
  --data-urlencode "client_secret=$CLIENT_SECRET"
```

Response shape:

```json
{ "access_token": "...", "token_type": "Bearer", "expires_in": 3599, "scope": "ViewPublic ViewDetails" }
```

This account-level token is used as a Bearer token for Model API GraphQL calls. **Keep it server-side only.** It is different from the model-scoped `accessToken` in step 2, which is safe for the client.

## Step 2: Create a private link

POST to `https://api.matterport.com/api/models/graph` with the Bearer token:

```graphql
mutation createLink {
  createPrivateModelEmbedLink(
    modelId: "MODEL_SID"
    clientId: "CLIENT_ID"
    clientSecret: "CLIENT_SECRET"
    validFor: "10m"
  ) {
    accessToken
    application
    link
    validUntil
  }
}
```

The returned `link` is a full URL you can drop into an `<iframe>`.

`validFor` rules: ISO 8601 duration or shorthand (`24h`, `5m`, `30s`); max 24 hours; use at least 30 seconds.

## Step 3 (Beta): Multi-model token

```graphql
mutation createToken {
  createPrivateModelEmbedToken(
    application: showcase
    clientId: "CLIENT_ID"
    clientSecret: "CLIENT_SECRET"
    modelIds: ["MODEL_SID_1", "MODEL_SID_2"]
    validFor: "10m"
  ) {
    accessToken
    validUntil
  }
}
```

`application` defaults to `showcase`.

## Step 4: Connect the SDK

```typescript
const mpSdk = await connect(iframe, { auth: accessToken });
```

### Token refresh

Give `createTokenRefresher` a fetcher whose `fetch()` returns an object with `access_token` (string) and `expires_in` (seconds):

```typescript
const fetcher = {
  async fetch() {
    const res = await fetch(`/token?modelId=${modelId}`);
    if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
    return res.json();
  },
};
const initialToken = await fetcher.fetch();
mpSdk.OAuth.createTokenRefresher(initialToken, fetcher);
```

## Step 5: Revoke a token

Revokes the token and ends any active Showcase session using it.

```graphql
mutation deleteToken {
  deletePrivateModelEmbedToken(
    clientId: "CLIENT_ID"
    clientSecret: "CLIENT_SECRET"
    accessToken: "MODEL_SCOPED_TOKEN"
  )
}
```

Returns `{ "data": { "deletePrivateModelEmbedToken": true } }` on success.
