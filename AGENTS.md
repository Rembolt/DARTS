# AGENTS.md — start here

HackPrinceton Fall '26, CoStar track ("Inside and Out: AI for the Built World").
The project is an **acoustic renderer for real properties**: it rebuilds rooms from Matterport
Property Intelligence geometry, simulates how sound carries through them, and lets a user hear any
point in the 3D tour. CoStar data supplies the property context and Vexcel the exterior/aerial context.
Full pitch, judging criteria, data-access facts and open questions: [docs/project/proposal.md](docs/project/proposal.md).

**Hard deadline:** Devpost submission at 8:00 AM, Sunday Nov 15, 2026. Demo ≤ 2 min.

## Folder map

| Path | What it is | Read when |
|---|---|---|
| [docs/project/proposal.md](docs/project/proposal.md) | Project idea, judging-criteria mapping, credentials and API facts gathered on-site, open questions | Always read first |
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
- `docs/hackathon/originals/` and `docs/matterport/official-html-snapshot/` are raw source copies. Ignore them
  unless the cleaned versions are missing something.
