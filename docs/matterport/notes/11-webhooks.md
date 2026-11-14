# Webhooks API (v2)

Source: https://developers.matterport.com/webhooks/

Event-driven callbacks: Matterport POSTs to your endpoint when something happens to a model, so you do not have to poll. **Enterprise only.** Requires the account feature unlock, a Developer License with API tokens, and an Enterprise plan. Callbacks are registered through the Model API GraphQL endpoint (`https://api.matterport.com/api/models/graph`).

v2 was introduced in November 2024. **v1 is deprecated.** Only POST callbacks and GraphQL-based registration are supported.

## Register a callback

```graphql
mutation addWebhook {
  addModelEventWebhookCallback(input: {
    eventTypes: [created, deleted]
    callback: {
      scheme: "https"
      host: "myapi.example.com"
      port: 443
      path: "webhooks/matterport"
      credType: basic
      credKey: "username"
      credSecret: "password"
      additionalHeaders: [{ key: "x-source", value: "matterport" }]
      queryParams: [{ key: "env", value: "prod" }]
    }
    version: 2
  }) { id eventTypes callback { scheme host port path } version }
}
```

Providing credentials is recommended. Save the returned `id` since you need it to update or remove the callback.

## Event types

| Event | Fires when |
|---|---|
| `activation_state_changed` | Activation state changes (active, archived or pending) |
| `bundle_updated` | An add-on bundle changes status |
| `created` | A model is created after upload |
| `deleted` | A model is deleted |
| `details_changed` | The model's details object changes |
| `processed` | A model finishes processing |
| `restored` | A model is restored |
| `transferred_in` / `transferred_out` | A model moves into or out of your account |
| `visibility_changed` | The privacy setting changes |

## Payload

Root attributes on every event: `modelId`, `version`, `webhookId`, `webhookCustomKey` (optional), `timestamp`, `type`, `body`.

| Event | `body` |
|---|---|
| `activation_state_changed` | `{ previous: {state}, current: {state} }` (`pending`, `active`, `inactive`) |
| `bundle_updated` | `{ status, bundleId }` (`requested`, `delivered`, `canceled`, `failed`) |
| `created` | `{ type }` (`copy`, `demo`, `transfer`, `processing`, `unknown`) |
| `deleted` | `{}` |
| `details_changed` | `{ previous: {...}, current: {...} }` |
| `processed` | `{ status, error }` (`succeeded`, `failed`) |
| `restored` | `{ type }` (same values as `created`) |
| `transferred_in` | `{ source: OrgID }` |
| `transferred_out` | `{ destination: OrgID }` |
| `visibility_changed` | `{ previous: {accessVisibility}, current: {accessVisibility} }` (`private`, `public`, `unlisted`, `active`) |

`details_changed` is not sent until processing completes. Watched fields: `address` sub-fields, `description`, `image.id`, `internalId`, `mls` (`id`, `name`), `name`, `publication` (`description`, `externalUrl`, `presentedby`, `summary`).

## Race condition: processed vs active

A processed model may not be active yet (Matterport checks account space), and mutations run too early can fail. Subscribe to **both** `processed` and `activation_state_changed`, and wait for both before running mutations.

## Manage callbacks

```graphql
query { modelEventWebhookCallbacks { nextOffset totalResults results { id eventTypes callback { scheme port path } } } }

mutation update($callbackId: ID!) {
  patchModelEventWebhookCallback(id: $callbackId, input: { callback: { scheme: "https", host: "myapi.example.com", path: "v2/path" }, version: 2 }) { id eventTypes callback { scheme host path } }
}

mutation remove($callbackId: ID!) { removeModelEventWebhookCallback(id: $callbackId) }

mutation test($callbackId: ID!) { pingModelEventWebhookCallback(id: $callbackId) }   # sends a test event
```

Results are paginated via `nextOffset`. A wrong ID on patch gives "Error fetching data." For local testing the docs suggest ngrok.

## Gaps in the docs

The page does not document: signature or authentication verification on your receiver, retry and delivery guarantees, example receiver code, or `credType` values other than `basic`. The list-callbacks sample shows `inserted` and `updated` event names that are not in the v2 table, so verify current names in the schema.
