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

import { latLngToCell, gridDisk, cellToLatLng, getResolution } from 'h3-js';

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
