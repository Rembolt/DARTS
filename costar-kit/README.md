# CoStar data kit

This folder is CoStar's data kit, kept exactly as it was delivered so its internal links keep working.
**Read [index.md](index.md) first.** It covers the eight datasets, how they join, and how to read them.

| Path | Contents |
|---|---|
| [index.md](index.md) | Kit overview: datasets, join keys, scope, reading tips |
| `commercial-properties.csv`, `residential-listings.csv` | Starter lists: property/listing id → `MatterportModelId`, address |
| `data/<dataset>.jsonl` | The records (≈400 MB in total, git-ignored). Stream them; never load a whole file into context |
| [models/](models/) | One page per dataset: every field, its meaning and enum values |
| [concepts/](concepts/) | Real-estate background (start with [glossary.md](concepts/glossary.md)) |
| [schemas/](schemas/) | `openapi.yaml`, per-dataset JSON Schema, `enums.json` |
| [tools/expand_records.py](tools/expand_records.py) | Writes records out as one pretty JSON file each, into `records/` (git-ignored) |

For this project, the important join is the starter CSV's `MatterportModelId` to the Matterport Model API
(see [../docs/matterport/](../docs/matterport/)). The commercial property record adds type, size, year
built and lat/lon (for Vexcel).
