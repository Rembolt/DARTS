// The V3 contract shared by the server and the browser app (design sections 5.6 and 8).
// No imports and no Node APIs: the app imports this file too.

export const DEMO_MODEL_ID = 'Ki9YdfpNKum';
export const MODEL_ID_PATTERN = /^[A-Za-z0-9]{11}$/;

export type NotPossibleCode =
  | 'bundle_missing' | 'server_not_configured' | 'unknown_model' | 'model_not_found' | 'no_mesh'
  | 'mesh_failed' | 'mesh_unusable' | 'viewer_failed' | 'browser_unsupported' | 'matterport_unreachable'
  | 'index_missing' | 'outside_coverage' | 'no_results' | 'no_room_data' | 'none_usable' | 'out_of_scope'
  | 'not_in_data' | 'refused' | 'ai_unavailable' | 'agent_failed' | 'bad_request' | 'busy';
export type NotPossible = { code: NotPossibleCode; message: string; retry: boolean };

/** status: the HTTP status a route answers with. message: the spec 8.1/8.2 sentence, verbatim. */
export const NOT_POSSIBLE: Record<NotPossibleCode, { status: number; message: string; retry: boolean }> = {
  // 8.1 Loading a property
  bundle_missing: { status: 503, retry: false,
    message: 'Not possible to load the tour: the Matterport viewer files are missing. Run `npm run fetch-bundle`.' },
  server_not_configured: { status: 500, retry: false,
    message: 'Not possible to load: the server is missing its Matterport key.' },
  unknown_model: { status: 404, retry: false,
    message: 'Not possible to load: this property is not in the catalogue.' },
  model_not_found: { status: 404, retry: false,
    message: 'Not possible to load: this 3D tour is no longer available.' },
  no_mesh: { status: 409, retry: false,
    message: 'Not possible to load the audio tour: this property has no 3D mesh to trace sound through.' },
  mesh_failed: { status: 502, retry: true,
    message: 'Not possible to load: the 3D mesh could not be downloaded.' },
  mesh_unusable: { status: 422, retry: false,
    message: "Not possible to load: this property's 3D mesh can't be used for sound." },
  viewer_failed: { status: 502, retry: true,
    message: 'Not possible to load: the 3D tour did not open.' },
  browser_unsupported: { status: 400, retry: false,
    message: "Not possible to play: this browser can't run 3D audio." },
  matterport_unreachable: { status: 502, retry: true,
    message: 'Not possible to check this property right now: Matterport did not answer.' },
  // 8.2 Searching and analysing
  index_missing: { status: 503, retry: false,
    message: 'Search is not possible: the property index has not been built. Run `npm run build-index`.' },
  outside_coverage: { status: 422, retry: false,
    message: "That's not possible: I only have properties in Houston and Los Angeles." },
  no_results: { status: 404, retry: false,
    message: 'Nothing matches that.' },
  no_room_data: { status: 422, retry: false,
    message: 'Not possible to analyse: this tour has no room data.' },
  none_usable: { status: 422, retry: false,
    message: "I found N properties but none has the room data I need. That's common for commercial tours; homes almost always work." },
  out_of_scope: { status: 422, retry: false,
    message: "That's not something I can do. I can find properties in Houston and Los Angeles by how they sound." },
  not_in_data: { status: 422, retry: false,
    message: "I don't have that." },
  refused: { status: 422, retry: false,
    message: "I can't help with that request." },
  ai_unavailable: { status: 503, retry: false,
    message: 'AI assistant not available: showing a keyword search' },
  agent_failed: { status: 500, retry: true,
    message: "I couldn't finish that. Here is what I found so far." },
  bad_request: { status: 400, retry: false,
    message: 'Not possible: the request is empty, too long or malformed.' },
  busy: { status: 429, retry: true,
    message: 'Try again in a moment.' },
};

/** `detail` replaces the table's message when given (e.g. no_results names the filter). */
export function notPossible(code: NotPossibleCode, detail?: string): NotPossible {
  const row = NOT_POSSIBLE[code];
  return { code, message: detail ?? row.message, retry: row.retry };
}

export type City = 'Houston' | 'Los Angeles';
export type PropertyKind = 'home' | 'apartment' | 'commercial';
export type IndexRow = {
  modelId: string; kind: PropertyKind; propertyKey: string; toursOnProperty: number;
  address: string; city: City; zip: string; lat: number; lon: number;
  propertyType: string; buildingName: string | null;
  sqft: number | null; beds: number | null; baths: number | null; price: number | null;
  yearBuilt: number | null; stories: number | null; facts: string[];
};
export type SearchQuery = {
  city: City; zip: string | null; near: { lat: number; lon: number; radiusKm: number } | null;
  kind: PropertyKind | 'any'; propertyTypes: string[] | null;
  minSqft: number | null; maxPrice: number | null; minBeds: number | null; limit: number;
};
export type SearchResult = { total: number; rows: IndexRow[]; notes: string[] };

export type ProfileId = 'recording' | 'rehearsal' | 'podcast' | 'home_office' | 'sleep' | 'home_theater'
  | 'cafe_restaurant' | 'retail' | 'open_office' | 'general';
export type Weights = { echo: number; outside: number; escape: number; size: number; bass: number };
export type Requirements = {
  profile: ProfileId; echoMid: [number, number]; maxOutsideDb: number; maxEscapeDb: number | null;
  minRoomArea: number; avoidBoomyBass: boolean; weights: Weights;
};
export type RequirementOverrides = {
  echoMin: number | null; echoMax: number | null; maxOutsideDb: number | null;
  maxEscapeDb: number | null; minRoomArea: number | null;
};

export type AreaClass = 'industrial' | 'commercial' | 'city' | 'residential' | 'nature';
export type LocatedSource = { kind: 'highway' | 'railway' | 'road' | 'airport'; distanceM: number; bearingDeg: number; levelDb: number };
export type AreaSummary = {
  areaClass: AreaClass; source: 'vexcel' | 'property_type'; counts: Record<string, number>;
  located: LocatedSource[]; roadBearingDeg: number | null; facadeDb: number; imageryDate: string | null;
};

export type RoomSummary = {
  id: string; name: string; floor: string; area: number; volume: number; heightAssumed: boolean;
  echo: [number, number, number]; echoWord: 'dead' | 'controlled' | 'lively' | 'echoey'; roomGainDb: number;
  flags: string[]; outsideDb: number | null; escapeDb: number | null; score: number;
};
export type Listing = Pick<IndexRow, 'sqft' | 'beds' | 'baths' | 'price' | 'propertyType' | 'toursOnProperty' | 'buildingName'>;
export type QuickSummary =
  | { ok: false; modelId: string; address: string | null; reason: NotPossible }
  | { ok: true; modelId: string; name: string | null; address: string; kind: PropertyKind; listing: Listing;
      canEnter: boolean; enterReason: NotPossible | null;
      score: number; bestRoomId: string; requirements: Requirements; area: AreaSummary | null;
      rooms: RoomSummary[]; skippedRooms: number; assumptions: string[] };

export type PropertyStatus = {
  modelId: string; name: string | null; floor: 'hard' | 'soft'; canEnter: boolean; canSummarise: boolean; reason: NotPossible | null;
};
export type Health = { bundle: boolean; sdkKey: boolean; matterport: boolean; vexcel: boolean; claude: boolean; index: boolean };

export type AgentRequest = { conversationId?: string; text: string; tour?: { modelId: string } };
export type AgentEvent =
  | { type: 'conversation'; conversationId: string; fresh: boolean }
  | { type: 'status'; text: string }
  | { type: 'cards'; summaries: QuickSummary[] }
  | { type: 'text'; text: string }
  | { type: 'open'; modelId: string; reason: string }
  | { type: 'placeSound'; room: string; sound: string }
  | { type: 'mapFocus'; lat: number; lon: number; radiusKm: number; reason: string }
  | { type: 'notPossible'; reason: NotPossible }
  | { type: 'done' };

// ---- City map (front door): a wide satellite per city, and sharper tiles the agent zooms into ----

export type MapBox = { north: number; south: number; east: number; west: number };
/** The bounds of a city's satellite image, in degrees. The image is `width` × `height` px and covers exactly this box. */
export type CityView = MapBox & { slug: string; name: City; width: number; height: number; imageUrl: string };
export type Place = { modelId: string; address: string; city: City; lat: number; lon: number };

export const CITY_IMAGE = { width: 1600, height: 1200 } as const;
const M_PER_DEG = 111_320;

/** A 4:3 box (in metres) `heightKm` tall, centred on a point. */
export function boxAround(lat: number, lon: number, heightKm: number): MapBox {
  const halfLat = (heightKm * 1000) / 2 / M_PER_DEG;
  const halfLon = (halfLat * (CITY_IMAGE.width / CITY_IMAGE.height)) / Math.cos((lat * Math.PI) / 180);
  return { north: lat + halfLat, south: lat - halfLat, east: lon + halfLon, west: lon - halfLon };
}

/** Where each city's image is centred and how tall it is: wide, so the whole metro is one picture. */
const CITY_FRAMES: { slug: string; name: City; lat: number; lon: number; heightKm: number }[] = [
  { slug: 'houston', name: 'Houston', lat: 29.8, lon: -95.41, heightKm: 80 },
  { slug: 'los-angeles', name: 'Los Angeles', lat: 34.036, lon: -118.343, heightKm: 40 },
];

export const CITY_VIEWS: readonly CityView[] = CITY_FRAMES.map(f => ({
  ...boxAround(f.lat, f.lon, f.heightKm), slug: f.slug, name: f.name,
  width: CITY_IMAGE.width, height: CITY_IMAGE.height, imageUrl: `/api/city/${f.slug}/image.jpg`,
}));

/** The city whose picture holds this point, or null (outside Houston and Los Angeles). */
export function cityAt(lat: number, lon: number): CityView | null {
  return CITY_VIEWS.find(v => lat <= v.north && lat >= v.south && lon <= v.east && lon >= v.west) ?? null;
}

/** The heights (km) of the sharper tiles. Few levels and a snapped centre, so tiles repeat and the cache works. */
export const DETAIL_HEIGHTS_KM = [2, 5, 12, 25] as const;

export type DetailTile = MapBox & { lat: number; lon: number; heightKm: number; url: string };

/** The tile that shows a circle of `radiusKm` around a point, or null when it is wider than the biggest tile. */
export function detailTile(lat: number, lon: number, radiusKm: number): DetailTile | null {
  const heightKm = DETAIL_HEIGHTS_KM.find(h => h >= radiusKm * 2);
  if (heightKm === undefined) return null;
  return detailTileAt(lat, lon, heightKm);
}

/** The tile of exactly this height; the centre is snapped to a quarter of the height. */
export function detailTileAt(lat: number, lon: number, heightKm: number): DetailTile {
  const stepLat = heightKm / 4 / (M_PER_DEG / 1000);
  const snappedLat = Math.round(lat / stepLat) * stepLat;
  const stepLon = stepLat / Math.cos((snappedLat * Math.PI) / 180);
  const snappedLon = Math.round(lon / stepLon) * stepLon;
  const la = Number(snappedLat.toFixed(5));
  const lo = Number(snappedLon.toFixed(5));
  return { ...boxAround(la, lo, heightKm), lat: la, lon: lo, heightKm, url: `/api/map.jpg?lat=${la}&lon=${lo}&h=${heightKm}` };
}

/** The whole-country picture the front door opens on. Vexcel's coverage is patchy at this scale, so it is NASA Blue Marble. */
export const USA_VIEW: MapBox & { width: number; height: number; imageUrl: string } = {
  ...boxAround(38.5, -97, 3600), width: CITY_IMAGE.width, height: CITY_IMAGE.height, imageUrl: '/api/usa/image.jpg',
};
