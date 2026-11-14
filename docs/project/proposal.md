# Proposal

Audio renderer that simulates how sound behaves inside CoStar dataset properties (Houston, LA).
Rebuild rooms from Matterport geometry, simulate acoustics, let a user hear any point in the 3D tour.

## Data access

- **Matterport GraphQL:** `https://api.matterport.com/api/models/graph`, HTTP Basic (token ID / secret). Read-only.
  Property Intelligence enabled (`rooms` → boundaries → edges/openings, `dimensionEstimates { height }`).
  Assume no MatterPak OBJ mesh.
- **Matterport SDK:** `applicationKey=<key>` URL param.
- **Vexcel:** `X-API-KEY` header; back off on HTTP 429.

## Deadline

Devpost: **8:00 AM Sun Nov 15, 2026**. Demo ≤ 2 min.
