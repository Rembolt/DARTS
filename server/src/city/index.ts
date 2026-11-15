// The satellite images for the front door: one wide Vexcel ortho per city, plus sharper tiles the agent zooms into.
// Each is fetched once and kept in the cache folder.
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CITY_IMAGE, CITY_VIEWS, DETAIL_HEIGHTS_KM, USA_VIEW, cityAt, detailTileAt, type CityView, type MapBox } from '../shared/contract.js';

const ORTHO_URL = 'https://api.vexcelgroup.com/v2/ortho/extract';
const LAYERS = 'urban,urban-r,wide-area,urban-g';

/** NASA GIBS: public satellite imagery, no key, nothing about the user is sent. */
const GIBS_URL = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi';

export type CityMaps = {
  /** The picture of the whole country (NASA Blue Marble), or null when NASA did not answer. */
  usa(): Promise<Buffer | null>;
  views(): readonly CityView[];
  /** The city JPEG, or null when there is no Vexcel key or Vexcel did not answer. */
  image(slug: string): Promise<Buffer | null>;
  /** A sharper tile (see `detailTileAt`). Null for a height that is not a level, a centre outside both cities, or no answer. */
  detail(lat: number, lon: number, heightKm: number): Promise<Buffer | null>;
};

export function boxBody(box: MapBox): unknown {
  const { west: w, east: e, south: s, north: n } = box;
  return {
    wkt: `POLYGON((${w} ${s},${e} ${s},${e} ${n},${w} ${n},${w} ${s}))`,
    srid: 4326,
    layer: LAYERS,
    crop: 'bounding_box',
    'image-format': 'jpeg',
    'destination-dimensions': `${CITY_IMAGE.width},${CITY_IMAGE.height}`,
  };
}

export function createCityMaps(options: {
  cacheDir: string;
  env: Record<string, string | undefined>;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
  log?: (line: string) => void;
}): CityMaps {
  const { cacheDir, env, fetchFn = fetch, timeoutMs = 60_000, log = console.warn } = options;
  const inflight = new Map<string, Promise<Buffer | null>>();

  async function fetchBox(name: string, box: MapBox): Promise<Buffer | null> {
    const key = env.VEXCEL_API_KEY?.trim();
    const isUsa = name === 'usa.jpg';
    if (!key && !isUsa) return null;
    try {
      const res = isUsa
        ? await fetchFn(
            `${GIBS_URL}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=BlueMarble_NextGeneration&SRS=EPSG:4326&STYLES=`
              + `&BBOX=${box.west},${box.south},${box.east},${box.north}&WIDTH=${CITY_IMAGE.width}&HEIGHT=${CITY_IMAGE.height}&FORMAT=image/jpeg`,
            { signal: AbortSignal.timeout(timeoutMs) },
          )
        : await fetchFn(ORTHO_URL, {
            method: 'POST',
            headers: { 'X-API-KEY': key!, 'Content-Type': 'application/json' },
            body: JSON.stringify(boxBody(box)),
            signal: AbortSignal.timeout(timeoutMs),
          });
      if (!res.ok) {
        log(`city map: Vexcel answered HTTP ${res.status} for ${name}`);
        return null;
      }
      const bytes = Buffer.from(await res.arrayBuffer());
      // A JPEG starts FF D8. Anything else (an error page) must not be cached as the picture.
      if (bytes.length < 1000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
      const final = join(cacheDir, name);
      const tmp = `${final}.part`;
      try {
        mkdirSync(cacheDir, { recursive: true });
        writeFileSync(tmp, bytes);
        renameSync(tmp, final);
      } catch (err) {
        rmSync(tmp, { force: true });
        log(`city map: could not cache ${name}: ${err instanceof Error ? err.message : String(err)}`);
      }
      return bytes;
    } catch (err) {
      log(`city map: ${name}: ${err instanceof Error ? err.name : 'error'}`);
      return null;
    }
  }

  /** The cached file, or one fetch shared by everyone who asks while it runs. */
  async function cached(name: string, box: MapBox): Promise<Buffer | null> {
    try {
      return readFileSync(join(cacheDir, name));
    } catch {
      /* not cached yet */
    }
    let pending = inflight.get(name);
    if (!pending) {
      pending = fetchBox(name, box).finally(() => inflight.delete(name));
      inflight.set(name, pending);
    }
    return pending;
  }

  return {
    views: () => CITY_VIEWS,
    usa: () => cached('usa.jpg', USA_VIEW),
    async image(slug) {
      const view = CITY_VIEWS.find(v => v.slug === slug);
      return view ? cached(`city-${slug}.jpg`, view) : null;
    },
    async detail(lat, lon, heightKm) {
      if (!(DETAIL_HEIGHTS_KM as readonly number[]).includes(heightKm)) return null;
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !cityAt(lat, lon)) return null;
      const tile = detailTileAt(lat, lon, heightKm); // snapped again here: the file name never comes from the caller
      return cached(`tile-${heightKm}-${tile.lat}_${tile.lon}.jpg`, tile);
    },
  };
}
