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
  modelId: string; name: string | null; canEnter: boolean; canSummarise: boolean; reason: NotPossible | null;
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
  | { type: 'notPossible'; reason: NotPossible }
  | { type: 'done' };
