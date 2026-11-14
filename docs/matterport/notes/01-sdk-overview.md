# Matterport SDK Overview

Source: https://developers.matterport.com/overview/

The Matterport SDK is a JavaScript library for integrating Matterport 3D Showcase into web apps. It supports deep customization of Showcase and building new applications on the platform.

## SDK distributions

| Distribution | What it is | How you get it |
|---|---|---|
| **Showcase Embed SDK** | Controls an embedded Showcase (movement, view modes, custom 2D content). Stays current automatically as Matterport updates Showcase. | Script tag from Matterport's CDN, or npm package `@matterport/sdk` (includes TypeScript types) |
| **Showcase Bundle SDK** | A self-hosted Showcase. Adds the Scene Framework, giving access to the 3D engine and scene graph. | Self-hosted bundle |
| **Web Component SDK (Beta)** | An isolated Bundle distribution wrapped in a single DOM element, so no iframe is needed. | Web component |

## Choosing an SDK

| Use case | Recommended |
|---|---|
| Embed with basic controls | Embed SDK |
| Custom UI overlays and interactions | Embed SDK |
| Add 3D objects to the scene | Bundle SDK |
| Custom lighting and materials | Bundle SDK |
| Non-iframe Bundle distribution | Web Component |

## GraphQL APIs

Separate from the SDK, Matterport offers GraphQL APIs for model metadata, spatial data and property intelligence. See [03-graphql-api.md](03-graphql-api.md).

## Doc site map

- Getting Started: Overview, Concepts, Vocabulary
- Release Notes: [SDK Changelog](https://developers.matterport.com/sdk-changelog/), [Deprecation](https://developers.matterport.com/changelog/sdk-deprecation/)
- SDK References: [Reference](https://developers.matterport.com/reference/), [Tutorials (Observables)](https://developers.matterport.com/tutorials/observables/), [Examples](https://developers.matterport.com/examples/)
- Showcase SDKs: [Embed](https://developers.matterport.com/embed-sdk/), [Bundle](https://developers.matterport.com/bundle-sdk/), [Web Component](https://developers.matterport.com/webcomponent/)
