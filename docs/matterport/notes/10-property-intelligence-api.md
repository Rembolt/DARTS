# Property Intelligence API

Sources: https://developers.matterport.com/api/property-intelligence/ and `/dimensions/`, `/room-names/`, `/vector-data/`, `/mutations/`

**Enterprise-only.** It is part of the Model API, so use `https://api.matterport.com/api/models/graph`.

It provides room names, wall measurements and dimensional data for rebuilding room boundaries and layout. Model owners can refine detected rooms, boundaries and names in an editor, and those edits appear in API data. New data lives in `dimensionEstimates`, `floors` and `rooms`.

Use cases: square footage for billing, floor and room dimensions for listings, detected room names, vector data to redraw a floorplan.

## Dimension estimates

| Field | Meaning | model | floor | room |
|---|---|---|---|---|
| `area` | Estimated area from measured room BoundedRegion data | x | x | x |
| `areaIndoor` | Area excluding outdoor space and wall-covered portions | x | x | x |
| `depth` / `depthData` | Estimated depth and its measured points | | | x |
| `width` / `widthData` | Estimated width and its measured points | | | x |
| `height` | Estimated room height | | | x |
| `units` | metric or imperial | x | x | x |
| `lowerElevation` | Distance from ground plane (z = 0) | | | x |

Length is the longest measurement of a room, Depth the shortest. Floor and model areas are sums of room areas. Units default to the model or account setting; override with the `units` argument.

```graphql
query getArea($modelId: ID!, $units: Units) {
  model(id: $modelId) { dimensionEstimates(units: $units) { area areaIndoor units } }
}

query getRoomFloorDimensions($modelId: ID!, $units: Units) {
  model(id: $modelId) {
    rooms { id label floor { id }
      dimensionEstimates(units: $units) { area areaIndoor depth depthData { points { x y } } height width widthData { points { x y } } units lowerElevation } }
    floors { id label sequence dimensionEstimates(units: $units) { area areaIndoor units } }
  }
}
```

Notes:
- Floors have a `label`, an `id`, and a `sequence` (0 is the spatially lowest). An exterior floor does not return a full set of dimensions.
- Floor IDs often match across models, but gaps between detected floors can break that, so validate per model.
- Irregular rooms or non-flat ceilings may return null or zero dimensions. Refining the room in the editor can fix that.

## Room names

Fields: auto-detected name (in `classifications`), `label` (manual name from the editor or owner), `confidence`, and the room's floor.

Detected types: Balcony, Basement, Bathroom, Bedroom, Closet, Dining Room, Entrance, Exercise Room, Family Room, Game Room, Garage, Hallway, Kitchen, Living Room, Loft, Office, Pantry, Patio, Staircase, Utility Room, Other.

A room can have several types (for example Kitchen + Living Room + Dining Room, or Bathroom + Laundry Room). Editors can override with a custom `label`, but the detected type always stays in `classifications`.

```graphql
query getRoomNames($modelId: ID!) {
  model(id: $modelId) {
    rooms { id label floor { id } classifications { id label defaultKeywords confidence } keywords }
  }
}
```

## Vector data

Hierarchy: room, then one or more **boundaries**, each with **edges** (two vertices each) plus doorway **openings** and **holes**. Vertices are 2D, relative to the model center (0,0).

- Edge: `id`, `type` (`wall` or `invisible`), `vertices`, `centerLineBias` (0.5 = centered in the wall thickness), `thickness`, `openings`
- Opening: `id`, `height`, `width`, `lowerElevation`, `relativeCenter` (0 to 1 along the edge), `type` (`doorway` or `opening`)

```graphql
fragment BoundedRegionData on BoundedRegion {
  edges { id type centerLineBias thickness
    openings { id height width lowerElevation relativeCenter type }
    vertices { id position { x y } } }
}
query getVectorData($modelId: ID!) {
  model(id: $modelId) {
    floors { id sequence label }
    rooms { id label classifications { id label } boundary { ...BoundedRegionData } holes { ...BoundedRegionData } }
  }
}
```

## Mutations

The docs list these only by name (inputs are in the schema reference at https://api.matterport.com/docs/reference):

`addBoundaryVertex`, `addBoundaryEdge`, `addRoom`, `bulkPatchRoomData`, `patchBoundaryVertex`, `patchBoundaryEdge`, `addEdgeOpenings`, `removeEdgeOpenings`, `patchEdgeOpening`, `patchRoom`, `deleteRoomsAndBoundaryData`.

Warning: `deleteRoomsAndBoundaryData` can leave room boundaries unclosed, and affected dimensions and annotations stay outdated until `patchRoom` closes the boundaries. An optional `layerId` is reserved for upcoming layer support. If omitted, updates apply to the base layer.
