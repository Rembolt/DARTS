# Matterport Developer Docs: Notes

Working notes on the Matterport developer platform, based on https://developers.matterport.com/ and its linked pages (retrieved 2026-11-14). These are summaries, so check the official docs for anything critical.

## Files

| File | Contents |
|---|---|
| [01-sdk-overview.md](01-sdk-overview.md) | SDK distributions (Embed, Bundle, Web Component) and how to choose |
| [02-sdk-concepts-and-vocabulary.md](02-sdk-concepts-and-vocabulary.md) | Async model, coordinates, API-to-SDK conversion, glossary |
| [03-graphql-api.md](03-graphql-api.md) | GraphQL endpoints, API token auth, request examples, error codes |
| [04-private-model-embed-oauth.md](04-private-model-embed-oauth.md) | Private Model Embed OAuth flow, token refresh and revoke |
| [05-embed-sdk.md](05-embed-sdk.md) | Embed SDK: SDK keys, script tag and NPM setup, connect, events |
| [06-bundle-sdk-and-webcomponent.md](06-bundle-sdk-and-webcomponent.md) | Self-hosted Bundle, Scene Framework architecture, Web Component |
| [07-sdk-reference.md](07-sdk-reference.md) | MpSdk namespace-by-namespace reference (App, Camera, Tag, Sweep, and more) |
| [08-sdk-tutorials-and-examples.md](08-sdk-tutorials-and-examples.md) | Observables, collections, examples list, SDK changelog |
| [09-model-api.md](09-model-api.md) | Model API: search, sample queries/mutations, views/layers, add-ons, geocoordinates |
| [10-property-intelligence-api.md](10-property-intelligence-api.md) | Dimensions, room names, vector data, room mutations (Enterprise) |
| [11-webhooks.md](11-webhooks.md) | Webhooks v2: events, payloads, callback management (Enterprise) |
| [12-import-and-account-apis.md](12-import-and-account-apis.md) | Import API (E57) and Account API (users, roles, SDK keys) |

## Quick orientation

- **Two credential types:**
  - **SDK key** (domain-bound, for Showcase embeds and SDK connections)
  - **API token ID + secret** (server-side only, admin-level, for GraphQL)
- **Private models** additionally need OAuth: see file 04.
- **Enterprise-only features:** Account API, Import API (beta), Property Intelligence, GeoCoordinates (beta), Webhooks, Private Model Embed.
- **Coordinate systems differ** between the Model API (Z up) and the Showcase SDK (Y up): see file 02.

## Top-level map

- SDK Docs: https://developers.matterport.com/overview/
- API Docs: https://developers.matterport.com/api/
- Auth Docs: https://developers.matterport.com/oauth/private-model-embed/
- SDK Reference: https://developers.matterport.com/reference/
- SDK Examples: https://developers.matterport.com/examples/
- SDK Changelog: https://developers.matterport.com/sdk-changelog/
- API Changelog: https://developers.matterport.com/api-changelog/
- GraphQL Console (Model API): https://api.matterport.com/model/graphiql
- GraphQL API Reference: https://api.matterport.com/model/docs/reference
- Postman workspace: https://www.postman.com/matterport-developer-support/workspace/model-api-snippets
- Support: https://support.matterport.com
- Status: https://status.matterport.com

Using the SDK means agreeing to the [Matterport SDK Agreement](https://matterport.com/legal/sdk-agreement/).

## Not covered in these notes

Pages not read: TypeScript declaration pages (Embed and Bundle), tutorials for local environment, Embed.ly, pathfinding, pointer reticle, XR, tag sandboxes and tags migration, the API changelog, the Import API code examples, the `__metadata__` reference, individual interface pages, and the seven example pages (only listed).
