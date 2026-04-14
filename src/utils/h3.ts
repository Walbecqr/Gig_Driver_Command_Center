/**
 * H3 geospatial utility.
 *
 * h3-js v4 is already installed (see package.json). This module is the
 * single integration point — all other files import from here, not h3-js
 * directly, so resolution changes only need updating in one place.
 *
 * Resolution guide (approximate cell edge lengths):
 *   res 7  ≈ 5.16 km   — metro-area zones
 *   res 8  ≈ 1.95 km   — neighbourhood zones
 *   res 9  ≈ 0.73 km   — block-level zones  ← default
 *   res 10 ≈ 0.28 km   — street-segment zones
 */

import { latLngToCell, gridDisk, cellToLatLng, getResolution, polygonToCells } from 'h3-js';

/** Default H3 resolution used for offer/trip zone tagging. */
export const DEFAULT_RESOLUTION = 9;

/**
 * Convert a WGS-84 coordinate pair to an H3 cell index string.
 *
 * @param lat        Latitude in decimal degrees (-90 … 90)
 * @param lng        Longitude in decimal degrees (-180 … 180)
 * @param resolution H3 resolution (0–15). Defaults to DEFAULT_RESOLUTION (9).
 * @returns          H3 index string, e.g. "892a1072447ffff"
 */
export function getZoneId(lat: number, lng: number, resolution = DEFAULT_RESOLUTION): string {
  return latLngToCell(lat, lng, resolution);
}

/**
 * Return the H3 cell at the center of a given zone plus all cells within
 * k rings of it (inclusive). k=0 → just the cell itself.
 *
 * @param zoneId H3 index string
 * @param k      Ring distance. Defaults to 1 (cell + 6 immediate neighbours).
 * @returns      Array of H3 index strings (order not guaranteed)
 */
export function getNeighborZones(zoneId: string, k = 1): string[] {
  return gridDisk(zoneId, k);
}

/**
 * Return the centroid lat/lng of an H3 cell (useful for map pins).
 *
 * @param zoneId H3 index string
 * @returns      [lat, lng] tuple
 */
export function getZoneCenter(zoneId: string): [number, number] {
  return cellToLatLng(zoneId);
}

/**
 * Return the H3 resolution encoded in a cell index string.
 */
export function getZoneResolution(zoneId: string): number {
  return getResolution(zoneId);
}

/**
 * Convert a GeoJSON-style polygon to the set of H3 cells that cover it
 * at the given resolution (polygon-to-cell tessellation / polyfill).
 *
 * Coordinate order follows the h3-js v4 convention: [lat, lng] pairs.
 * The closing vertex of each ring is optional — h3-js closes it automatically.
 *
 * Usage example (GeoJSON feature with a known geometry):
 *   const ring = feature.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
 *   const cells = polygonToZoneIds(ring);
 *
 * @param outerRing  Outer boundary as [lat, lng] pairs.
 * @param holes      Optional interior hole rings, each as [lat, lng] pairs.
 * @param resolution H3 resolution (0–15). Defaults to DEFAULT_RESOLUTION (9).
 * @returns          Array of H3 index strings covering the polygon interior.
 */
export function polygonToZoneIds(
  outerRing: [number, number][],
  holes: [number, number][][] = [],
  resolution = DEFAULT_RESOLUTION,
): string[] {
  return polygonToCells([outerRing, ...holes], resolution, false);
}

type LngLatPosition = [number, number];
type GeoJsonPolygonCoordinates = LngLatPosition[][];
type GeoJsonMultiPolygonCoordinates = LngLatPosition[][][];

function isLngLatPosition(value: unknown): value is LngLatPosition {
  if (!Array.isArray(value) || value.length < 2) return false;
  const lng = Number(value[0]);
  const lat = Number(value[1]);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function toLatLngRing(ring: unknown): [number, number][] {
  if (!Array.isArray(ring)) return [];
  const points: [number, number][] = [];
  for (const candidate of ring) {
    if (!isLngLatPosition(candidate)) continue;
    const [lng, lat] = candidate;
    points.push([lat, lng]);
  }

  if (points.length < 3) return [];

  const [firstLat, firstLng] = points[0];
  const [lastLat, lastLng] = points[points.length - 1];
  if (firstLat === lastLat && firstLng === lastLng) {
    return points.slice(0, -1);
  }

  return points;
}

function uniqueZoneIds(zoneIds: string[]): string[] {
  return [...new Set(zoneIds)];
}

export function geoJsonPolygonToZoneIds(
  coordinates: GeoJsonPolygonCoordinates | unknown,
  resolution = DEFAULT_RESOLUTION,
): string[] {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return [];

  const outerRing = toLatLngRing(coordinates[0]);
  if (outerRing.length < 3) return [];

  const holes: [number, number][][] = [];
  for (const holeRing of coordinates.slice(1)) {
    const hole = toLatLngRing(holeRing);
    if (hole.length >= 3) holes.push(hole);
  }

  return polygonToZoneIds(outerRing, holes, resolution);
}

export function geoJsonMultiPolygonToZoneIds(
  coordinates: GeoJsonMultiPolygonCoordinates | unknown,
  resolution = DEFAULT_RESOLUTION,
): string[] {
  if (!Array.isArray(coordinates)) return [];
  const zoneIds: string[] = [];

  for (const polygon of coordinates) {
    const polygonZoneIds = geoJsonPolygonToZoneIds(polygon, resolution);
    zoneIds.push(...polygonZoneIds);
  }

  return uniqueZoneIds(zoneIds);
}
