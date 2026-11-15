import { MapPin, icon } from './icons';
import { CITY_VIEWS, USA_VIEW, detailTile, type City, type CityView, type MapBox } from '../../../server/src/shared/contract';

/** One property on the map. `label` is what the pin says when it is open ("84% · 1234 Oak St"). */
export type Pin = { modelId: string; lat: number; lon: number; label: string; highlighted: boolean };

export type CityMapDeps = {
  onCity(city: City): void;
  onPin(modelId: string): void;
  onHover(modelId: string | null): void;
};

/** What the agent asked to see: a point and how far around it. */
export type Focus = { lat: number; lon: number; radiusKm: number; reason?: string };

export type CityMap = {
  el: HTMLElement;
  /** The city picked (null: the whole country), the pins, and where the agent looks. The camera moves there. */
  set(next: { city: City | null; pins: Pin[]; focus: Focus | null }): void;
  /** Light up one pin (a card is hovered), or none. */
  setHover(modelId: string | null): void;
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Where a point sits on a picture, as fractions 0..1 (the picture covers its box exactly). */
export function project(box: MapBox, lat: number, lon: number): { x: number; y: number } {
  return { x: (lon - box.west) / (box.east - box.west), y: (box.north - lat) / (box.north - box.south) };
}

const KM_PER_DEG = 111.32;
const USA_HEIGHT_KM = (USA_VIEW.north - USA_VIEW.south) * KM_PER_DEG;
/** The deepest the camera goes: a 0.6 km tall view. */
const MAX_ZOOM = USA_HEIGHT_KM / 0.6;

/** `cover`: an image the view must stay inside, so no lower-resolution picture shows past its edge. */
/** Where the camera starts: the corridor from Los Angeles to Houston, not the whole country. */
export const START = { lat: 32.6, lon: -107, zoom: 1.6 };

export type Region = { lat: number; lon: number; heightKm: number; cover?: MapBox };

const inUsa = (p: { lat: number; lon: number }) =>
  p.lat <= USA_VIEW.north && p.lat >= USA_VIEW.south && p.lon <= USA_VIEW.east && p.lon >= USA_VIEW.west;

/**
 * What the camera shows: the agent's focus when it gave one, else a box round the pins (so the results fill about 60% of the
 * map), else the picked city, else null for the starting view.
 */
export function regionOf(pins: { lat: number; lon: number }[], focus: Focus | null, city: CityView | null): Region | null {
  if (focus) return { lat: focus.lat, lon: focus.lon, heightKm: Math.max(0.6, focus.radiusKm * 2) };
  const inside = pins.filter(inUsa);
  if (inside.length > 0) {
    const lats = inside.map(p => p.lat);
    const lons = inside.map(p => p.lon);
    const lat = (Math.max(...lats) + Math.min(...lats)) / 2;
    const lon = (Math.max(...lons) + Math.min(...lons)) / 2;
    const spanLatKm = (Math.max(...lats) - Math.min(...lats)) * KM_PER_DEG;
    const spanLonKm = (Math.max(...lons) - Math.min(...lons)) * KM_PER_DEG * Math.cos((lat * Math.PI) / 180);
    // 4:3 map: the width counts three quarters. 0.6 leaves a margin round the pins.
    return { lat, lon, heightKm: Math.max(4, Math.max(spanLatKm, spanLonKm * 0.75) / 0.6) };
  }
  if (city) return { lat: (city.north + city.south) / 2, lon: (city.east + city.west) / 2, heightKm: (city.north - city.south) * KM_PER_DEG, cover: city };
  return null;
}

/**
 * The centre (as fractions of the country picture) and the zoom that show a region; the starting view for none.
 * `ratio` is the window's width over its height: the stage covers the window, so a wide window shows less height and a tall one less width.
 */
export function framing(region: Region | null, ratio = 4 / 3): { cx: number; cy: number; scale: number } {
  if (!region) {
    const at = project(USA_VIEW, START.lat, START.lon);
    return { cx: at.x, cy: at.y, scale: START.zoom };
  }
  const { x, y } = project(USA_VIEW, region.lat, region.lon);
  let scale = USA_HEIGHT_KM / region.heightKm;
  if (region.cover) {
    // Zoom in until the window sees nothing but this picture (the km per degree differs from the country box's, so both axes count).
    const fh = (region.cover.north - region.cover.south) / (USA_VIEW.north - USA_VIEW.south);
    const fw = (region.cover.east - region.cover.west) / (USA_VIEW.east - USA_VIEW.west);
    const seesH = Math.min(1, 4 / 3 / ratio);
    const seesW = Math.min(1, ratio / (4 / 3));
    // 4% over, so a rounding error at this zoom can never show the country picture at an edge.
    scale = Math.max(seesH / fh, seesW / fw) * 1.04;
  }
  return { cx: Math.min(1, Math.max(0, x)), cy: Math.min(1, Math.max(0, y)), scale: Math.min(MAX_ZOOM, Math.max(1, scale)) };
}

/** Place an image over the country picture by its own box (percent of the stage). */
function place(img: HTMLElement, box: MapBox): void {
  const at = project(USA_VIEW, box.north, box.west);
  img.style.left = `${at.x * 100}%`;
  img.style.top = `${at.y * 100}%`;
  img.style.width = `${((box.east - box.west) / (USA_VIEW.east - USA_VIEW.west)) * 100}%`;
  img.style.height = `${((box.north - box.south) / (USA_VIEW.north - USA_VIEW.south)) * 100}%`;
}

/** A map pin: its tip is the place. */
function pinIcon(size: number): HTMLSpanElement {
  const dot = icon(MapPin, size);
  dot.classList.add('fd-pin-dot');
  return dot;
}

export function createCityMap(deps: CityMapDeps): CityMap {
  const root = el('div', 'fd-map');

  // One stage that is the whole country. The camera is a transform on it, so the zoom is smooth from space to a building:
  // the country picture, then the city's (Vexcel), then a sharp tile (Vexcel) as layers that fade in when loaded.
  const stage = el('div', 'fd-stage');
  const usa = el('img', 'fd-image');
  usa.alt = 'Satellite view of the United States';
  usa.src = USA_VIEW.imageUrl;
  usa.addEventListener('error', () => {
    stage.classList.add('no-image');
    note.hidden = false;
  });
  usa.addEventListener('load', () => {
    stage.classList.remove('no-image');
    note.hidden = true;
  });

  function layer(className: string): HTMLImageElement {
    const img = el('img', className);
    img.alt = '';
    img.hidden = true;
    img.addEventListener('load', () => img.classList.add('ready'));
    img.addEventListener('error', () => img.classList.remove('ready'));
    return img;
  }
  const cityImage = layer('fd-layer fd-cityimage');
  const detail = layer('fd-layer fd-detail');

  // Before a city is picked: the two cities, as markers on the country.
  const marks = el('div', 'fd-pins fd-marks');
  for (const view of CITY_VIEWS) {
    const at = project(USA_VIEW, (view.north + view.south) / 2, (view.east + view.west) / 2);
    const mark = el('button', 'fd-citymark');
    mark.type = 'button';
    mark.dataset.city = view.name;
    mark.style.left = `${at.x * 100}%`;
    mark.style.top = `${at.y * 100}%`;
    const label = el('span', 'fd-pin-label');
    label.append(el('strong', undefined, view.name), el('small', undefined, 'Explore'));
    mark.append(pinIcon(36), label);
    mark.setAttribute('aria-label', `Show ${view.name} on the map`);
    mark.addEventListener('click', () => deps.onCity(view.name));
    marks.append(mark);
  }

  // Pins are not in the stage: a pin inside a 3000x zoom would have to shrink 3000x to keep its size. They sit in their own
  // layer, placed from the camera's numbers, and appear once the camera has arrived.
  const pinLayer = el('div', 'fd-pins fd-pinlayer');
  stage.append(usa, cityImage, detail, marks);

  const note = el('p', 'fd-map-note', 'Satellite image not available. Pins are still placed by their coordinates.');
  note.hidden = true;
  const credit = el('p', 'fd-credit', 'Imagery: NASA Blue Marble, Vexcel');
  // What the agent is showing, in its words.
  const caption = el('p', 'fd-caption');
  caption.hidden = true;
  caption.setAttribute('role', 'status');
  root.append(stage, pinLayer, note, caption, credit);

  let current: City | null = null;
  let pins: Pin[] = [];
  let focus: Focus | null = null;
  let hovered: string | null = null;
  let camera = '';
  let arriving: ReturnType<typeof setTimeout> | undefined;

  function paintHover(): void {
    for (const p of pinLayer.querySelectorAll<HTMLElement>('.fd-pin')) {
      p.classList.toggle('hover', p.dataset.id === hovered);
    }
  }

  /** Show an image layer at a box, loading it the first time it is wanted. */
  function show(img: HTMLImageElement, url: string | null, box: MapBox | null): void {
    if (!url || !box) {
      img.hidden = true;
      return;
    }
    const src = new URL(url, location.href).href;
    if (img.src !== src) {
      img.classList.remove('ready');
      img.src = url;
    }
    place(img, box);
    img.hidden = false;
  }

  function draw(): void {
    const city = CITY_VIEWS.find(v => v.name === current) ?? null;
    root.classList.toggle('choosing', city === null);
    marks.hidden = city !== null;

    const region = regionOf(pins, focus, city);
    const ratio = root.clientWidth > 0 && root.clientHeight > 0 ? root.clientWidth / root.clientHeight : 4 / 3;
    const f = framing(region, ratio);
    stage.style.setProperty('--s', String(f.scale));
    stage.style.setProperty('--dx', `${(0.5 - f.cx) * 100}%`);
    stage.style.setProperty('--dy', `${(0.5 - f.cy) * 100}%`);
    stage.style.setProperty('--ratio', `${USA_VIEW.width} / ${USA_VIEW.height}`);
    // The docked chat covers the left, so the camera slides right, but only for a pin or focus view (those sit on a picture
    // with margin). The city view itself must keep filling the window, so it never shifts.
    const shift = !!region && !region.cover && f.scale > 2;
    stage.dataset.zoom = f.scale.toFixed(1);
    // The docked chat covers the left; the camera slides right to keep the view in the free part. Only when zoomed in:
    // zoomed out, the picture would not reach the edge and the strip would show.
    stage.style.setProperty('--shift', shift ? '1' : '0');
    for (const [k, v] of [['--s', String(f.scale)], ['--cx', String(f.cx)], ['--cy', String(f.cy)], ['--shift', shift ? '1' : '0']] as const) {
      pinLayer.style.setProperty(k, v);
    }
    // Pins hide while the camera moves and come back when it has arrived (the move takes 1.6 s).
    const now = `${f.scale}|${f.cx}|${f.cy}`;
    if (now !== camera) {
      camera = now;
      pinLayer.classList.add('moving');
      clearTimeout(arriving);
      arriving = setTimeout(() => pinLayer.classList.remove('moving'), 1700);
    }
    caption.textContent = focus?.reason ?? '';
    caption.hidden = !focus?.reason;

    show(cityImage, city?.imageUrl ?? null, city);
    // A sharp tile once the view is small enough for one (25 km tall at most).
    const tile = region && city ? detailTile(region.lat, region.lon, region.heightKm / 2) : null;
    show(detail, tile?.url ?? null, tile);

    const points = pins.map(p => project(USA_VIEW, p.lat, p.lon));
    pinLayer.replaceChildren(
      ...pins.map((p, i) => {
        const at = points[i];
        const pin = el('button', 'fd-pin');
        pin.type = 'button';
        pin.dataset.id = p.modelId;
        pin.style.setProperty('--px', String(at.x));
        pin.style.setProperty('--py', String(at.y));
        pin.hidden = at.x < 0 || at.x > 1 || at.y < 0 || at.y > 1;
        pin.classList.toggle('picked', p.highlighted);
        pin.setAttribute('aria-label', p.label);
        pin.append(pinIcon(30), el('span', 'fd-pin-label', p.label));
        pin.addEventListener('click', () => deps.onPin(p.modelId));
        pin.addEventListener('pointerenter', () => deps.onHover(p.modelId));
        pin.addEventListener('pointerleave', () => deps.onHover(null));
        pin.addEventListener('focus', () => deps.onHover(p.modelId));
        pin.addEventListener('blur', () => deps.onHover(null));
        return pin;
      }),
    );
    paintHover();
  }

  draw();
  // A resized window changes how much of the stage it sees.
  window.addEventListener('resize', () => draw());
  return {
    el: root,
    set(next) {
      current = next.city;
      pins = next.pins;
      focus = next.focus;
      draw();
    },
    setHover(id) {
      hovered = id;
      paintHover();
    },
  };
}
