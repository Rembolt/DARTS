# Matterport docs

| Folder | What it is | Use it for |
|---|---|---|
| [notes/](notes/README.md) | 12 condensed topic notes written from developers.matterport.com | **Start here.** Fast orientation, auth, coordinate systems |
| [official/](official/index.md) | Full Markdown mirror of developers.matterport.com (API, SDK reference, tutorials, changelogs) | Exact field names, method signatures, code samples. `grep` it before opening files |
| `official-html-snapshot/` | Raw saved HTML of the site's intro page | Ignore; it's a source copy |

## Hackathon-specific facts (these override the general docs)

- GraphQL endpoint: `https://api.matterport.com/api/models/graph`. Auth is HTTP Basic with
  `MATTERPORT_API_KEY` (token ID) as username and `MATTERPORT_API_TOKEN` (secret) as password, from `.env`.
- **Read-only:** queries work; mutations (purchases, add-on orders, MatterPak/OBJ) don't.
- **Property Intelligence is enabled:** `rooms → boundaries → edges` (wall/invisible, vertices, thickness,
  openings with height/width/lowerElevation/relativeCenter/type) and `rooms { dimensionEstimates { height } }`.
- Hackathon docs: https://beta-app.matterport.com/2026-princeton-hackathon/docs ·
  Playground: https://beta-app.matterport.com/2026-princeton-hackathon/graphiql
- SDK (Showcase/Embed) uses `applicationKey=<MATTERPORT_SDK_KEY>` in the URL.
- Model ids come from `costar-kit/*.csv` → `MatterportModelId`.

## Most relevant pages for the acoustic renderer

| Need | Notes | Official detail |
|---|---|---|
| Room outlines, walls, openings, heights | [notes/10-property-intelligence-api.md](notes/10-property-intelligence-api.md) | `official/api/property-intelligence/` (`dimensions.md`, `vector-data.md`, `room-names.md`) |
| GraphQL requests and errors | [notes/03-graphql-api.md](notes/03-graphql-api.md), [notes/09-model-api.md](notes/09-model-api.md) | `official/api/model/queries.md`, `samples.md` |
| Embed the tour, camera, pointer, sweeps | [notes/05-embed-sdk.md](notes/05-embed-sdk.md), [notes/07-sdk-reference.md](notes/07-sdk-reference.md) | `official/reference/{camera,pointer,sweep,room,floor}.md` |
| Draw overlays in 3D (rays, heatmaps) | [notes/06-bundle-sdk-and-webcomponent.md](notes/06-bundle-sdk-and-webcomponent.md) | `official/reference/scene.md`, `official/tutorials/scene-objects.md` |
| Model API Z-up vs SDK Y-up | [notes/02-sdk-concepts-and-vocabulary.md](notes/02-sdk-concepts-and-vocabulary.md) | `official/reference/conversion.md` |
