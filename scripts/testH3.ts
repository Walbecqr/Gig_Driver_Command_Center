/**
 * H3 integration verification script.
 *
 * Run with:
 *   npx tsx scripts/testH3.ts
 *
 * Verifies:
 *   1. getZoneId() produces valid H3 cell strings.
 *   2. getNeighborZones() returns the expected ring sizes.
 *   3. Round-trip: cell → center → cell is idempotent.
 *   4. Example SQL query showing how to pull zone_time_series data.
 */

import { getZoneId, getNeighborZones, getZoneCenter, getZoneResolution } from '../src/utils/h3';

const TIMES_SQUARE_LATLNG: readonly [number, number] = [40.7580, -73.9855];

// ---------------------------------------------------------------------------
// 1. Basic H3 conversion
// ---------------------------------------------------------------------------

const TEST_COORDS: Array<{ label: string; lat: number; lng: number }> = [
  { label: 'Times Square, NYC',       lat: TIMES_SQUARE_LATLNG[0],  lng: TIMES_SQUARE_LATLNG[1] },
  { label: 'Wrigley Field, Chicago',  lat: 41.9484,  lng: -87.6553 },
  { label: 'Downtown LA',             lat: 34.0522,  lng: -118.2437 },
  { label: 'Miami Beach',             lat: 25.7907,  lng: -80.1300 },
];

console.log('\n=== 1. getZoneId() — coordinate → H3 cell ===\n');

for (const coord of TEST_COORDS) {
  const zoneId = getZoneId(coord.lat, coord.lng);
  const res = getZoneResolution(zoneId);
  console.log(`  ${coord.label}`);
  console.log(`    lat/lng : ${coord.lat}, ${coord.lng}`);
  console.log(`    zone_id : ${zoneId}  (res ${res})`);
  console.log();
}

// ---------------------------------------------------------------------------
// 2. Neighbor rings
// ---------------------------------------------------------------------------

console.log('=== 2. getNeighborZones() — ring sizes ===\n');

const pivot = getZoneId(...TIMES_SQUARE_LATLNG); // Times Square

for (const k of [0, 1, 2]) {
  const neighbors = getNeighborZones(pivot, k);
  // k=0 → 1 cell, k=1 → 7 cells, k=2 → 19 cells
  const expected = k === 0 ? 1 : 3 * k * (k + 1) + 1;
  const ok = neighbors.length === expected ? '✓' : '✗';
  console.log(`  k=${k}: ${neighbors.length} cells (expected ${expected}) ${ok}`);
}
console.log();

// ---------------------------------------------------------------------------
// 3. Round-trip idempotency
// ---------------------------------------------------------------------------

console.log('=== 3. Round-trip: cell → center → cell ===\n');

let allPassed = true;
for (const coord of TEST_COORDS) {
  const zoneId = getZoneId(coord.lat, coord.lng);
  const [cLat, cLng] = getZoneCenter(zoneId);
  const roundTripped = getZoneId(cLat, cLng);
  const ok = roundTripped === zoneId;
  if (!ok) allPassed = false;
  console.log(
    `  ${coord.label}: ${ok ? '✓ idempotent' : `✗ MISMATCH (${zoneId} ≠ ${roundTripped})`}`,
  );
}
console.log();

if (allPassed) {
  console.log('  All round-trips passed.\n');
} else {
  console.error('  Some round-trips failed — investigate h3 library version.\n');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 4. Example zone_time_series queries (printed, not executed)
// ---------------------------------------------------------------------------

console.log('=== 4. Example zone_time_series queries ===\n');

const exampleZone = getZoneId(...TIMES_SQUARE_LATLNG);

console.log('-- SQLite (local): hourly metrics for a zone over 24 h');
console.log(`SELECT
  zone_id,
  bucket_start_local,
  offers_seen_count,
  offers_accepted_count,
  trips_completed_count,
  gross_amount_sum,
  avg_wait_minutes
FROM zone_time_series
WHERE zone_id = '${exampleZone}'
  AND bucket_start_local >= '2025-01-01T00:00:00'
  AND bucket_start_local <  '2025-01-02T00:00:00'
ORDER BY bucket_start_local;
`);

console.log('-- Supabase (Postgres): top 10 busiest zones last 7 days');
console.log(`SELECT
  zone_id,
  SUM(offers_seen_count)     AS total_offers,
  SUM(trips_completed_count) AS total_trips,
  SUM(gross_amount_sum)      AS total_gross,
  AVG(avg_wait_minutes)      AS avg_wait
FROM analytics.zone_time_series
WHERE bucket_start_local >= now() - interval '7 days'
  AND bucket_grain = 'hour'
GROUP BY zone_id
ORDER BY total_trips DESC
LIMIT 10;
`);

console.log('All checks complete.');
