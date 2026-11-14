# Vexcel docs (API 2.0)

API base: `https://api.vexcelgroup.com/v2/`. API 1.0 is deprecated, so ignore any 1.0 examples.
Auth: send `VEXCEL_API_KEY` (from `.env`) in the `X-API-KEY` header, or as `api_key=` in the query string.
The rate limit isn't published. On HTTP 429, back off exponentially (1, 2, 4, 8, 16 s) and keep parallel requests low.

**Fastest start:** [../../scripts/vexcel_quickstart.py](../../scripts/vexcel_quickstart.py) runs the whole flow
from one lat/lon: parcel and structure attributes, ortho and oblique imagery clipped to the parcel,
custom element detection, and an embeddings search. It writes results to `scripts/output/`.

| Path | Contents |
|---|---|
| [official/api-reference/README.md](official/api-reference/README.md) | Index of every endpoint group (one `.md` per group) |
| `official/api-reference/openapi.json` | Full OpenAPI spec. `grep` it; it's large |
| `official/Vexcel_API_Hackathon_Tutorial.pdf` | Hackathon tutorial from the organizers |
| [official/Vexcel-API-Documentation.md](official/Vexcel-API-Documentation.md) | Landing page |
| `official/API-2-0-Tutorials-and-Extras/` | ArcGIS WMTS/XYZ setup guides |
| `official/API-1-0-to-2-0-Migration-Guides/` | 1.0 → 2.0 migration notes (rarely needed) |

## Most relevant endpoints for this project

| Need | Page |
|---|---|
| Parcel and building attributes at a point | `property-extract.md`, `structure-extract.md`, `property-report.md` |
| Top-down and oblique imagery | `ortho-extract.md`, `oriented-query.md`, `oriented-extract.md` |
| Detect things such as roads, trees or pools by text label | `elements-detect.md` |
| Semantic search over an area | `embedding-extract.md`, `embedding-refine.md` |
| Terrain and surface heights (neighboring buildings) | `dsm-elevation.md`, `dtm-elevation.md` |
| Check whether imagery exists for an area | `Coverage.md`, `ortho-collections.md` |
