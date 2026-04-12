/**
 * Ingestion service barrel export.
 *
 * All CSV parsers and ingestion services for every supported data source.
 * Import from here rather than from individual files.
 *
 * Usage:
 *   import { parseUberEatsTrips, ingestUberEatsTrips } from '@/services/ingestion';
 *
 * After adding a new Kaggle dataset:
 *   1. Add parser + service files following the existing pattern.
 *   2. Export them below.
 *   3. Run:  supabase gen types typescript --local > src/types/supabase.generated.ts
 */

// ---------------------------------------------------------------------------
// Shared utilities (not typically needed by callers, but exported for tests)
// ---------------------------------------------------------------------------
export { tokenizeCsv, buildColMap, getCell, parseDate, parseMoney } from './csvUtils';
export type { ParseResult, ColMap, TokenizedCsv } from './csvUtils';

export { createImportBatch, finaliseImportBatch, simpleHash } from './ingestionUtils';
export type { ImportBatchInput } from './ingestionUtils';

// ---------------------------------------------------------------------------
// DoorDash (existing)
// ---------------------------------------------------------------------------
export { parseDoorDashEarnings, parseDoorDashOrders } from './doordashParser';
export { ingestDoorDashEarnings, ingestDoorDashOrders } from './doordash';
export type { DoorDashEarningsRow, DoorDashOrderRow } from './doordash';

// ---------------------------------------------------------------------------
// Uber Eats Driver dataset — trip-level data
// ---------------------------------------------------------------------------
export { parseUberEatsTrips } from './uberEatsTripsParser';
export type { UberEatsTripRow } from './uberEatsTripsParser';
export { ingestUberEatsTrips } from './uberEatsTrips';

// ---------------------------------------------------------------------------
// Uber Ride Analytics dataset — rideshare trips
// ---------------------------------------------------------------------------
export { parseUberRides } from './uberRideParser';
export type { UberRideRow } from './uberRideParser';
export { ingestUberRides } from './uberRide';

// ---------------------------------------------------------------------------
// Restaurant / merchant location datasets (Uber Eats + DoorDash)
// ---------------------------------------------------------------------------
export { parseMerchants } from './merchantParser';
export type { MerchantRow } from './merchantParser';
export { ingestMerchants } from './merchants';

// ---------------------------------------------------------------------------
// Delivery Orders simulation dataset
// ---------------------------------------------------------------------------
export { parseDeliveryOrders } from './deliveryOrdersParser';
export type { DeliveryOrderRow } from './deliveryOrdersParser';
export { ingestDeliveryOrders } from './deliveryOrders';

// ---------------------------------------------------------------------------
// Uber / Lyft + Weather dataset — external conditions
// ---------------------------------------------------------------------------
export { parseWeatherConditions } from './weatherConditionsParser';
export type { WeatherConditionRow } from './weatherConditionsParser';
export { ingestWeatherConditions } from './weatherConditions';
