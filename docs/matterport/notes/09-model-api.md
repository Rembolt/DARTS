# Model API

Sources: https://developers.matterport.com/api/model/overview/ , /queries/ , /samples/ , /views-layers/ , /ordering-addons/ , /postman/ , /geocoordinates/

Endpoint: `https://api.matterport.com/api/models/graph` (all account levels). Auth: see [03-graphql-api.md](03-graphql-api.md). Interactive console: https://api.matterport.com/model/graphiql . Schema reference: https://api.matterport.com/model/docs/reference

The Model API searches, reads and modifies model data: name and address, sharing URLs, images, videos, panoramas, positions, Tags, and purchased assets (including OBJ and point cloud files in a MatterPak). Only Sandbox mode is enabled by default.

## The `models` query

There are two queries: `models` (search) and `model(id)` (fetch one).

```graphql
models(include: [SearchInclusion!], query: String, sortBy: [ModelSort!], pageSize: Int, offset: String): ModelSearchResultList
```

| Arg | Default | Notes |
|---|---|---|
| `include` | none | `demo`, `inactive` |
| `query` | `*` | `*` or Elasticsearch query-string syntax |
| `sortBy` | `created_time` desc | `ModelSort` objects |
| `pageSize` | 10 | 1 to 1000 |
| `offset` | null | `nextOffset` from the previous page |

Returns `{ nextOffset, totalResults, results }`. `nextOffset` is only present when `totalResults > pageSize`. With no args you get 10 active models, newest first.

Query examples:

```graphql
query { models(query: "address.locality:\"Lawrence\" AND address.administrativeArea:\"KS\"") { totalResults nextOffset results { id name } } }
query { models(query: "assets.panoLocations.placement:\"UNPLACED\"") { totalResults results { id name } } }
query { models(query: "modified:[2019-10-10 TO *] AND measurements.count:[1 TO *]") { totalResults results { id name } } }
```

### Searchable fields (selection)

`id`, `internalId`, `created`, `modified`, `name`, `description`, `visibility` (public/private), `demo`, `address.*` (`streetAddressLines`, `administrativeArea`, `locality`, `dependentLocality`, `countryName`, `postalCode`, `countryCode`), `geolocation`, `floors.count`, `floors.tags`, `rooms.count`, `rooms.label`, `rooms.tags`, `mattertags.count`, `mattertags.label`, `mattertags.description`, `mattertags.mediaType`, `measurements.count`, `measurements.label`, `mls.id`, `mls.name`, and `assets.*` (`panos`, `clips`, `photos`, `meshes`, `textures`, `locations`, `panoLocations`, each with `count`, `format`, and so on).

> The docs example uses `mattertags.labels` but the field table lists `mattertags.label`. Use the singular form.

## Sample queries and mutations

(Variables omitted. All use `$modelId: ID!` unless noted.)

**Search**

```graphql
query { models(query: "*") { totalResults results { id name description } } }
query { models(query: "demo:true", include: demo) { results { name demo id } nextOffset totalResults } }
query { models(query: "state:inactive", include: inactive) { results { name state id } nextOffset totalResults } }
query { models(query: "floors.count: 20") { results { id name } nextOffset totalResults } }
```

**Model details** (`model { description }` is the internal notes field, `publication { description }` is the public one)

```graphql
query getModelDetails($modelId: ID!) {
  model(id: $modelId) {
    id name state visibility created modified description
    publication { description summary address contact { name email phoneNumber } externalUrl presentedBy published url(branding: default) }
  }
}
```

**Sweep locations and panos** (skybox resolutions 512/1024/2048, plus 4096 with the Advanced Imagery Bundle)

```graphql
fragment panoFragment on PanoramicImageLocation { id skybox(resolution: "2k") { id status format children } }
query getSweeps($modelId: ID!) {
  model(id: $modelId) {
    locations { id model { id } position { x y z } floor { id } room { id } panos { ...panoFragment } }
  }
}
```

Defurnished panos: use `views(types:["matterport.model.defurnished"]) { model { locations { ... } } }`.

**Tags** (called "mattertags" in the API; attachments cannot be queried)

```graphql
query getTags($modelId: ID!) {
  model(id: $modelId) {
    mattertags(includeDisabled: true) {
      id floor { id } created modified enabled color label description icon keywords media mediaType
      position { x y z } anchorPosition { x y z } discPosition { x y z }
      stemNormal { x y z } stemLength stemEnabled stemDirection { x y z }
    }
  }
}
```

**Dimensions**

```graphql
query getDimensions($modelId: ID!) {
  model(id: $modelId) {
    name dimensions { ...d }
    floors { label dimensions(units: imperial) { ...d } }
    rooms { id label tags dimensions { ...d } }
  }
}
fragment d on Dimension { areaCeiling areaFloor areaFloorIndoor areaWall volume depth height width units }
```

See also [10-property-intelligence-api.md](10-property-intelligence-api.md) for the newer `dimensionEstimates`.

**Colored room floorplan URLs**

```graphql
query { model(id: $modelId) { assets { floorplans(provider: "matterport", flags: [photogramy]) { floor { label sequence } format flags url origin { x y } width height resolution } } } }
```

**Notes and comments**: `model.notes(includeDisabled: true)` with `createdBy`, `resolution`, `anchorPosition`, `totalComments`, and a paged `comments(sortBy:{field: created}, pageSize, offset)` field.

**Mutations**

```graphql
mutation { updateModelAccessVisibility(id: $modelId, visibility: $visibility) { id accessVisibility accessVisibilityLastChanged publication { published url externalUrl embed } } }
mutation { updateModelState(id: $modelId, state: $state) { id } }          # active / inactive (archive)
mutation { updateModelAddress(id: $id, addressVisibility: none) { options { addressVisibility } } }   # full | partial | none
mutation { patchModel(id: $id, patch: { name: "...", description: "...", options: { ... }, mls: { id, name }, publication: { contact: { name, email, phoneNumber }, externalUrl, presentedBy, summary } }) { id name } }
```

`patchModel` options: overrides (`default`/`enabled`/`disabled`) for `socialSharing`, `vr`, `tourButtons`, `tourAutoplay`, `dollhouse`, `dollhouseLabels`, `floorplan`, `labels`, `highlightReel`; `unitType` (metric/imperial); `measurements` (disabled/measure/measureAndView); `backgroundColor` (black/grey/white).

**Add / patch a tag**: `addMattertag(modelId, field: id, mattertag: {...})` and `patchMattertag(modelId, field: id, mattertagId, patch: {...})`. Required fields include `floorId`, `enabled`, `anchorPosition {x y z}`, `stemEnabled`, `stemNormal`, `stemLength`. Optional: `color`, `label`, `icon`, `keywords`, `description`, `mediaType`, `mediaUrl`. Get a valid `floorId` by querying floors first.

**Chaining mutations in one request** runs them in order. This matters because a floorplan purchase can fail if the model is not yet public or unlisted:

```graphql
mutation activateAndPurchase($modelId: ID!) {
  updateModelState(id: $modelId, state: active) { id state }
  updateModelAccessVisibility(id: $modelId, visibility: public) { id accessVisibility }
  unlockModelBundle(id: $modelId, bundleId: "floorplan:schematic", options: { deliverySpeed: normal }) { id name availability assets { url } }
}
```

(The ordering page uses `bundleOptions` with key/value pairs instead of `options`. Prefer `bundleOptions`.)

## Views and Layers

- A digital twin can have up to **10 Views**. A View ID can be used anywhere a Model ID is used to query View-specific data, and in a Showcase URL (`https://my.matterport.com/show/?m=<viewId>`).
- Query: `model(id) { views { id name type modified } }`. Types include `matterport.model.layered` (main view) and `matterport.user.view`.
- Add: `addView(id: $modelId, name: $name, enabled: true, generateIds: false) { id name type model { id name } modified }`
- Delete: `deleteView(id: $modelId, viewId: $viewId)` returns a boolean.
- **Layers** group Tags, Labels, Notes and Measurements; they sit under Views. The API gives **read-only** access: `views { layers { visible position layer { id created modified type name label } } }`. Items expose `layer { id }` (`mattertags`, `labels`, `notes`, `measurementPaths`, `rooms`, `floors`, `highlightReels`). `objectAnnotations` is beta only.

## Ordering Add-Ons (bundles)

Purchase, check status and fetch signed download links for add-ons.

| Add-on | ID | Notes |
|---|---|---|
| Matterpak | `mp:matterpak` | OBJ/MTL, colorized point cloud, reflected ceiling plan, photogrammetry floorplan |
| Schematic Floorplan | `floorplan:schematic` | JPG, PNG, SVG |
| E57 File | `mp:e57` | Point cloud |
| BIM File | `bim:cad` | Query only |
| CAD File | `standard:cad` | 2D DWG, query only |
| Trueplan | `trueplan:schematic` | Xactimate, query only |
| Advanced Imagery Pack | `mp:imagery` | Business/Enterprise, $99 USD per model |

Use `model { bundles { id availability availableOptions { description key values } } }` to list options. Order with:

```graphql
mutation buy($modelId: ID!) {
  unlockModelBundle(id: $modelId, bundleId: "floorplan:schematic",
    bundleOptions: [{ key: "delivery_time", value: "normal" }, { key: "furniture", value: "true" }]) {
    id name description availability assets { url }
  }
}
```

Schematic floorplan options: `color`, `delivery_time` (normal = 2 business days, fast = 1 day, urgent = 6 hours; extra cost), `furniture`, `hide_dimensions`, `hide_internal_area`, `language` (en/de/fr/es/it), `unit_type` (imperial/metric/both), `use_custom_showcase_labels`, `use_showcase_orientation`, `use_six_inch_wall_thickness`, `logo_attachment_id`. CAD options: `style` (architecture, mep, furnished, mep_furnished, industrial), `unit_type`.

Assets are not instant, so poll `bundles { assets { status filename format url validUntil } processing { status failureCode failureReason } }`. Retrieve a purchased one with `bundle(id: "floorplan:schematic") { assets { url } }`. Advanced Imagery: 4K cube faces for Business/Enterprise, 2K for Starter/Professional.

## GeoCoordinates (Enterprise, beta)

Maps a model to latitude, longitude and altitude. The **GeoAnchor Point** is a point inside the model (usually the centroid), not the origin. `translation` is the offset from the origin to the anchor.

```graphql
fragment GeoCoordinateFragment on GeoCoordinate { source altitude latitude longitude translation { x y z } rotation { x y z w } }

query getGeoCoordinates($modelId: ID!) { model(id: $modelId) { id geocoordinates { ...GeoCoordinateFragment } } }
query getGeoCoordinatesOf($modelId: ID!, $point: IPoint3D!) { model(id: $modelId) { geocoordinates { geoLocationOf(modelLocation: $point) { lat long } } } }
query getModelLocationOf($modelId: ID!, $lat: Float!, $lon: Float!) { model(id: $modelId) { geocoordinates { modelLocationOf(latitude: $lat, longitude: $lon) { x y z } } } }

mutation patch(...) { patchModelGeoCoordinates(id, altitude, latitude, longitude, translation, rotation) { ...GeoCoordinateFragment } }
mutation reset($modelId: ID!) { resetModelGeoCoordinates(id: $modelId) { ...GeoCoordinateFragment } }
```

Patching does not delete the original data; `resetModelGeoCoordinates` restores it.

## Postman

A public workspace with ready-made queries (connected to a demo model) is at https://www.postman.com/matterport-developer-support/workspace/model-api-snippets . Postman loads the schema automatically for autocomplete. The page gives no auth instructions, so use the Basic auth setup from [03-graphql-api.md](03-graphql-api.md).
