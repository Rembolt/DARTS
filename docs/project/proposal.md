# Project Proposal — HackPrinceton Fall '26, CoStar Track

**Track:** Inside and Out: AI for the Built World (CoStar Group special track)
**Also required:** one HackPrinceton main track (e.g. Science + Discovery or Entertainment)

## Initial proposition

An **audio renderer that simulates how sound behaves inside the real estate
examples** in the CoStar hackathon dataset (Houston, TX and Los Angeles, CA).

Given a property, we rebuild its rooms from Matterport data: room outlines,
walls, door openings and ceiling heights. We estimate surface materials from the
room type and the panorama imagery, and run an acoustic simulation (reverb time,
early reflections, how sound carries between rooms through openings). A user can
then *hear* the space: drop a sound source (voice, music, TV, a crying baby) and
a listener at any point in the 3D tour, and hear a live preview of how it would
sound there.

## How it maps to the CoStar judging criteria

| Criterion | Weight | Our angle |
|---|---|---|
| Use of the data (≥2 of 3 layers) | 30% | **Matterport:** room geometry, openings, heights and panoramas drive the simulation. **CoStar:** property type, use, size and year built set the defaults and context. **Vexcel:** aerial view of what is outside (roads, density) for exterior noise. |
| Agentic depth | 30% | An agent that takes a goal ("is this office good for calls?", "where should the home theater go?"), plans which rooms and source/listener points to test, runs simulations and compares results. It should do more than describe the data. |
| Usefulness | 25% | Brokers, renters, office planners, and accessibility (people with hearing loss, sensory sensitivity). |
| Demo and polish | 15% | Interactive 3D tour with sound you can hear, plus visual overlays such as sound rays and heatmaps. |

## Data access (from /ask-costar, Nov 14)

**CoStar data kit:** files, not an API: CSVs plus `data/*.jsonl`. The Matterport
connection details are in a **separate zip** in the kit. The kit's guide explains
how CoStar properties join to Matterport scans and Vexcel areas.

**Matterport Model API (GraphQL):**
- Auth: Token ID + Token Secret, sent as HTTP Basic (ID = username, secret = password).
- Endpoint: `https://api.matterport.com/api/models/graph`
- **Read-only** for the hackathon: queries work, mutations (including purchases) don't.
- Hackathon docs: https://beta-app.matterport.com/2026-princeton-hackathon/docs
- Playground: https://beta-app.matterport.com/2026-princeton-hackathon/graphiql
- **Property Intelligence is enabled** on the hackathon models: `rooms` →
  boundaries → edges (type wall/invisible, vertices, thickness, openings), and
  openings have height, width, lowerElevation, relativeCenter, type.
  Room height: `rooms { dimensionEstimates { height } }`.
- **The MatterPak OBJ mesh can't be ordered** (ordering is a mutation). It's
  unknown whether it's already unlocked. Plan on not having it and build rooms
  from the room outlines plus heights.

**Matterport SDK (Showcase / Bundle):** uses an `applicationKey=<key>` URL
parameter. Unknown whether `/costar-keys` issues one.

**Vexcel:** one long-life API key per team, sent in the `X-API-KEY` header (or as
`api_key=` in the query string). The rate limit isn't published; on HTTP 429,
retry with exponential backoff (1, 2, 4, 8, 16 s) and avoid many parallel requests.
Organizers can say which area the key covers.

**Still open (ask the CoStar crew at the track table):**
1. Can a second team member run `/costar-keys`, or would it replace our existing keys?
2. Do we get a Matterport SDK `applicationKey`, and does it allow localhost?
3. Are the MatterPaks (OBJ mesh) unlocked for the hackathon models?
4. Which area does our Vexcel key cover? Do the keys expire before Sunday 8 AM?

## Key constraints (from the onsite packet)

- Public GitHub repo created between Nov 13–15, 2026.
- Devpost submission deadline: **8:00 AM, Sunday Nov 15, 2026** (hard deadline).
- In-person demo of at most 2 minutes is required during judging (9:30 AM–2:30 PM Sunday); a 2-minute video is optional but recommended.
- Maximum 4 team members; add Discord usernames to the submission.
- The CoStar data is only available for the length of the hackathon.
