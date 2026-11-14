# AGENTS.md — start here

HackPrinceton Fall '26, CoStar track ("Inside and Out: AI for the Built World").
The project is an **acoustic renderer for real properties**: it traces sound rays through a property's
Matterport mesh, and lets a user hear any point in the 3D tour through headphones.
CoStar data supplies the property context and Vexcel the exterior/aerial context (both after the MVP).

**Hard deadline:** Devpost submission at 8:00 AM, Sunday Nov 15, 2026. Demo ≤ 2 min.

## Current state

Build steps 1 and 2 of the MVP design are done: the app and server scaffold, the hardcoded config, the worker types,
and the self-hosted tour with the live camera pose. Run `npm run fetch-bundle` once before `npm run dev`.
[docs/project/mvp-design.md](docs/project/mvp-design.md) is the build spec: follow its section 10 build steps in order,
and its section 4 for every hardcoded value. It supersedes anything in older docs that disagrees with it.

## Architecture (planned, from the MVP design)

- **`app/`** (Vite + TypeScript, to be created): a page that embeds the Matterport viewer, plus three parts of our own.
  - **Sim worker:** a Web Worker that holds a copy of the property's mesh and a `three-mesh-bvh` ray index.
    It answers trace requests with numbers per sound source (direct loss, echo slots, echo time). It never touches audio.
  - **Audio engine:** a Web Audio graph on the page that applies those numbers to looping sound files.
  - **Blueprint view:** our own three.js canvas over the viewer, showing the mesh as lines and the traced sound paths.
- **`server/`** (Node + Express, to be created): serves the self-hosted Matterport Bundle, proxies the mesh download
  and keeps the GraphQL token off the browser.
- **The contract between the parts** is `app/src/sim/types.ts` (design section 5.7). Write it first.
- **Nothing heavy may run inside the Matterport viewer.** It is already slow. Rays go in the worker, audio on the audio thread.

## Commands

- **Vexcel sample:** `pip install requests shapely pillow`, set `VEXCEL_API_KEY` in the same terminal, then `python scripts/vexcel_quickstart.py`.
  Output goes to `scripts/output/` (git-ignored).
- **Install:** `npm install` at the repo root (npm workspaces: `app/` and `server/`).
- **Viewer files:** `npm run fetch-bundle` downloads the Matterport Bundle into `server/bundle/` (git-ignored). Run once after cloning.
- **Run:** `npm run dev` starts the server on `http://localhost:8787` and the page on `http://localhost:5173`. Set `PORT` to move the server.
- **Test:** `npm test` runs both. One workspace: `npm run test -w app`. One file: `npm run test -w app -- src/config.test.ts`. One test: add `-t "name of the test"`.
- **Types:** `npm run typecheck`.

## Facts verified by test (Nov 14)

These are not in the vendor docs and cost time to find out.

- **The real mesh is downloadable.** `model(id) { assets { meshes { format resolution status url validUntil } } }` works with the read-only token.
  Use the entry with `resolution: "50k"`: one defurnished OBJ file. The `"500k"` entry is served in pieces. Links expire, so cache the file, not the link.
- **Mesh coordinates are Z-up;** the viewer is Y-up. Convert with `(x, y, z) → (x, z, −y)`.
- **The Bundle works with the hackathon SDK key on `localhost`,** on any port. Download:
  `https://static.matterport.com/showcase-sdk/bundle/26.10.4_webgl-1728-g1cd7e0997a/showcase-bundle.zip`.
- **Property Intelligence openings include `window`** (also `doorway`, `opening`, `divider`). Room height is missing on about a third of rooms.
- **GraphQL schema introspection is blocked** (`BadFaithIntrospection`). Use the docs mirror or the playground at
  `https://beta-app.matterport.com/2026-princeton-hackathon/graphiql` for field names.
- **Tested model:** `Ki9YdfpNKum` (9117 Richland Drive, Houston). Mesh, Bundle and ray tracing were all run on it.
- **Port 8080 may already be in use** by a teammate's test page. Pick another port for throwaway servers.

More results, including timings, are in [docs/project/acoustic-experience.md](docs/project/acoustic-experience.md) section 2 and the design's section 9.

## Folder map

| Path | What it is | Read when |
|---|---|---|
| [docs/project/mvp-design.md](docs/project/mvp-design.md) | The MVP build spec: scope, stack, hardcoded values, the rendering pipeline step by step, build steps | Before writing any code |
| [docs/project/acoustic-experience.md](docs/project/acoustic-experience.md) | The product idea, a summary of the MVP, tested facts, and the final goal after the MVP | Product context, what comes after the MVP |
| [docs/project/proposal.md](docs/project/proposal.md) | The original short proposal and data-access facts | Endpoint and auth facts |
| [costar-kit/](costar-kit/) | The CoStar data kit: CSV starter lists, `data/*.jsonl` (≈400 MB), field docs, real-estate concepts, schemas | Working with property, listing, tenant or sale data |
| [docs/matterport/](docs/matterport/) | Matterport docs: condensed notes plus the full official-site mirror | Room geometry, GraphQL Model API, Showcase/Embed SDK |
| [docs/vexcel/](docs/vexcel/) | Vexcel API 2.0 docs: endpoint reference, OpenAPI spec, hackathon tutorial PDF | Aerial imagery, parcels, structures, elevation |
| [docs/hackathon/](docs/hackathon/) | HackPrinceton packets (schedule, judging, rules, prizes) and the CoStar Discord announcement | Logistics, rules, submission requirements |
| [scripts/](scripts/) | Runnable code: `vexcel_quickstart.py` (Vexcel end-to-end sample) | Starting with Vexcel |
| `.env` | Secrets: `MATTERPORT_API_KEY`, `MATTERPORT_API_TOKEN`, `MATTERPORT_SDK_KEY`, `VEXCEL_API_KEY`, `COSTAR_ZIP_PASSWORD` | Never print, log or commit the values |

## Common tasks → where to look

| Task | Go to |
|---|---|
| Find a property's Matterport model id | `costar-kit/commercial-properties.csv` or `costar-kit/residential-listings.csv` (column `MatterportModelId`); join rules in [costar-kit/index.md](costar-kit/index.md) |
| Query rooms, walls, openings, ceiling heights | [docs/matterport/notes/10-property-intelligence-api.md](docs/matterport/notes/10-property-intelligence-api.md), then `docs/matterport/official/api/property-intelligence/` |
| Matterport GraphQL auth and request format | [docs/matterport/notes/03-graphql-api.md](docs/matterport/notes/03-graphql-api.md) and the hackathon facts in the proposal (endpoint, Basic auth, read-only) |
| Embed the 3D tour and place sources/listeners | [docs/matterport/notes/05-embed-sdk.md](docs/matterport/notes/05-embed-sdk.md), [07-sdk-reference.md](docs/matterport/notes/07-sdk-reference.md) |
| Coordinate systems (Model API Z-up vs SDK Y-up) | [docs/matterport/notes/02-sdk-concepts-and-vocabulary.md](docs/matterport/notes/02-sdk-concepts-and-vocabulary.md) |
| Aerial imagery / parcel / structures for a lat-lon | [scripts/vexcel_quickstart.py](scripts/vexcel_quickstart.py), [docs/vexcel/README.md](docs/vexcel/README.md) |
| Decode an integer enum in the CoStar data | `costar-kit/schemas/enums.json` or the tables in `costar-kit/models/<dataset>.md` |
| Understand a real-estate term | [costar-kit/concepts/glossary.md](costar-kit/concepts/glossary.md) |
| Judging criteria, schedule, submission rules | [docs/hackathon/README.md](docs/hackathon/README.md) |

## Rules for agents

- **Secrets:** read keys from `.env` and environment variables only. Don't paste them into code, docs, logs or commits.
  The Matterport GraphQL token is HTTP Basic (token ID = username, secret = password).
- **Big files:** `costar-kit/data/*.jsonl` files can be hundreds of MB. Stream them, or use `head`/`jq`/DuckDB.
  Never read a whole file into context. Large doc files are mirrors; `grep` them before opening.
- **Prefer the condensed notes** (`docs/matterport/notes/`) over the official mirror. Go to the mirror for exact
  field names, types and examples.
- **Matterport is read-only** for the hackathon: GraphQL mutations (purchases, MatterPak ordering) fail.
- **CoStar data is licensed for the hackathon only.** `costar-kit/data/` is git-ignored, so keep it out of the public repo.
  The two CSV starter lists are tracked; check with CoStar before the repo goes public.
- **Don't commit the Matterport Bundle or downloaded meshes.** Git-ignore `server/bundle/` and `server/cache/`.
- **Simulation numbers are estimates.** Material values in the design are unvalidated defaults. Don't present results as measured.
- `docs/hackathon/originals/` and `docs/matterport/official-html-snapshot/` are raw source copies. Ignore them
  unless the cleaned versions are missing something.
