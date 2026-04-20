/**
 * Supabase Zod validation schemas.
 *
 * Parsed at the boundary where data arrives from Supabase (PostgREST).
 * Rules:
 *   - Date/time values are z.string() (ISO 8601 from PostgREST).
 *   - Nullable DB columns use .nullable().
 *   - Enum values must match the DB CHECK constraints exactly.
 *   - Do not import from or reference supabase.generated.ts here.
 */

import { z } from 'zod';

// ── Shared primitives ─────────────────────────────────────────────────────────

const uuid = z.string().uuid();
const isoTimestamp = z.string();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const currencyCode = z.string().length(3);

// ── Shared enums (mirror public schema DB enums) ──────────────────────────────

const PlatformEnum = z.enum([
  'uber_driver',
  'uber_eats',
  'doordash',
  'grubhub',
  'unknown',
  'synthetic',
]);

const SourceTypeEnum = z.enum([
  'weekly_statement_csv',
  'personal_data_export',
  'manual_csv',
  'manual_entry',
  'app_gps',
  'derived',
  'other',
  'kaggle_csv',
  'simulation',
]);

// ── public.users ──────────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: uuid,
  name: z.string(),
  email: z.string().email(),
  preferred_currency: z.string().optional(),
  created_at: isoTimestamp,
});

export type User = z.infer<typeof UserSchema>;

// ── public.shifts ─────────────────────────────────────────────────────────────

export const ShiftSchema = z.object({
  id: uuid,
  user_id: uuid,
  platform_account_id: uuid.nullable(),
  start_time: isoTimestamp,
  end_time: isoTimestamp.nullable(),
  starting_mileage: z.number(),
  ending_mileage: z.number().nullable(),
  status: z.enum(['active', 'paused', 'completed']),
  notes: z.string().nullable().optional(),
  updated_at: isoTimestamp.optional(),
});

export type Shift = z.infer<typeof ShiftSchema>;

// ── public.platform_accounts ──────────────────────────────────────────────────

export const PlatformAccountSchema = z.object({
  platform_account_id: uuid,
  user_id: uuid,
  platform: PlatformEnum,
  account_external_id: z.string().nullable(),
  account_label: z.string().nullable(),
  connection_mode: z.enum(['import_only', 'linked', 'manual']),
  connection_status: z.enum(['active', 'disconnected', 'errored', 'unknown']),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});

export type PlatformAccount = z.infer<typeof PlatformAccountSchema>;

// ── public.import_batches ─────────────────────────────────────────────────────

export const ImportBatchSchema = z.object({
  import_batch_id: uuid,
  user_id: uuid,
  platform_account_id: uuid,
  source_platform: PlatformEnum,
  source_type: SourceTypeEnum,
  source_file_name: z.string().min(1),
  source_file_hash: z.string().min(1),
  source_statement_start_date: isoDate.nullable(),
  source_statement_end_date: isoDate.nullable(),
  parser_version: z.string().min(1),
  row_count_raw: z.number().int().nonnegative(),
  row_count_parsed: z.number().int().nonnegative(),
  import_status: z.enum(['processing', 'review_pending', 'completed', 'partial', 'failed']),
  import_notes: z.string().nullable(),
  imported_at: isoTimestamp,
});

export type ImportBatch = z.infer<typeof ImportBatchSchema>;

// ── public.raw_import_records ─────────────────────────────────────────────────

export const RawImportRecordSchema = z.object({
  raw_record_id: uuid,
  import_batch_id: uuid,
  source_row_index: z.number().int().nonnegative(),
  source_record_type: z.string().min(1),
  row_hash: z.string().min(1),
  source_payload_json: z.unknown(),
  parse_status: z.enum(['parsed', 'warning', 'failed', 'skipped']),
  parse_error: z.string().nullable(),
  parse_warning: z.string().nullable(),
  created_at: isoTimestamp,
});

export type RawImportRecord = z.infer<typeof RawImportRecordSchema>;

// ── public.trips ──────────────────────────────────────────────────────────────

export const TripSchema = z.object({
  trip_id: uuid,
  user_id: uuid,
  platform_account_id: uuid,
  shift_id: uuid.nullable(),
  trip_date_local: isoDate,
  trip_start_ts_local: z.string().nullable(),
  trip_end_ts_local: z.string().nullable(),
  trip_timezone: z.string().min(1),
  platform: PlatformEnum,
  service_type: z.enum(['delivery', 'rideshare', 'unknown']),
  platform_trip_id: z.string().nullable(),
  platform_order_id: z.string().nullable(),
  trip_status: z.enum(['completed', 'cancelled', 'partial', 'unknown']),
  completion_confidence: z.number().min(0).max(1),
  source_priority: z.number().int().positive(),
  raw_trip_ref: uuid.nullable(),
  pickup_zone_id: z.string().nullable(),
  dropoff_zone_id: z.string().nullable(),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});

export type Trip = z.infer<typeof TripSchema>;

// ── public.trip_financials ────────────────────────────────────────────────────

export const TripFinancialsSchema = z.object({
  trip_fin_id: uuid,
  trip_id: uuid,
  fin_source_type: z.enum(['statement_csv', 'personal_data_export', 'derived']),
  currency_code: currencyCode,
  gross_amount: z.number().nullable(),
  base_fare: z.number().nullable(),
  tip_amount: z.number().nullable(),
  surge_amount: z.number().nullable(),
  bonus_amount: z.number().nullable(),
  wait_time_pay: z.number().nullable(),
  cancellation_pay: z.number().nullable(),
  adjustment_amt: z.number().nullable(),
  fee_amount: z.number().nullable(),
  net_payout: z.number().nullable(),
  payout_conf: z.number().min(0).max(1),
});

export type TripFinancials = z.infer<typeof TripFinancialsSchema>;

// ── public.trip_metrics ───────────────────────────────────────────────────────

export const TripMetricsSchema = z.object({
  trip_metric_id: uuid,
  trip_id: uuid,
  distance_miles: z.number().nullable(),
  distance_source: z.enum(['statement', 'personal_export', 'derived', 'app_gps']),
  duration_minutes: z.number().nullable(),
  duration_source: z.enum(['statement', 'personal_export', 'derived', 'app_gps']),
  active_minutes: z.number().nullable(),
  pickup_to_drop_minutes: z.number().nullable(),
  metric_confidence: z.number().min(0).max(1),
});

export type TripMetrics = z.infer<typeof TripMetricsSchema>;

// ── public.stops ──────────────────────────────────────────────────────────────

export const StopSchema = z.object({
  stop_id: uuid,
  trip_id: uuid,
  stop_sequence: z.number().int().positive(),
  stop_type: z.enum(['pickup', 'dropoff', 'waypoint', 'unknown']),
  stop_status: z.enum(['completed', 'skipped', 'unknown']),
  location_name: z.string().nullable(),
  address_line_1: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postal_code: z.string().nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  zone_id: z.string().nullable(),
  arrival_ts_local: z.string().nullable(),
  departure_ts_local: z.string().nullable(),
  created_at: isoTimestamp,
});

export type Stop = z.infer<typeof StopSchema>;

// ── public.delivery_platform_accounts ────────────────────────────────────────

export const DeliveryPlatformAccountSchema = z.object({
  id: uuid,
  user_id: uuid.nullable(),
  platform: z.string().min(1),
  account_name: z.string().nullable(),
  manual_mode: z.boolean(),
  created_at: isoTimestamp,
});

export type DeliveryPlatformAccount = z.infer<typeof DeliveryPlatformAccountSchema>;

// ── public.external_conditions ────────────────────────────────────────────────

export const ExternalConditionSchema = z.object({
  external_condition_id: uuid,
  zone_id: z.string().min(1),
  recorded_at: isoTimestamp,
  weather_condition: z.string().nullable(),
  temperature_f: z.number().nullable(),
  wind_speed_mph: z.number().nullable(),
  humidity_pct: z.number().min(0).max(100).nullable(),
  visibility_miles: z.number().nullable(),
  surge_multiplier: z.number().nullable(),
  is_surge_active: z.boolean().nullable(),
  notes: z.string().nullable(),
  created_at: isoTimestamp,
});

export type ExternalCondition = z.infer<typeof ExternalConditionSchema>;

// ── public.merchant_locations ─────────────────────────────────────────────────

export const MerchantLocationSchema = z.object({
  merchant_location_id: uuid,
  platform: PlatformEnum.nullable(),
  name: z.string().min(1),
  zone_id: z.string().nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  rating: z.number().min(0).max(5).nullable(),
  cuisine_type: z.string().nullable(),
  created_at: isoTimestamp,
});

export type MerchantLocation = z.infer<typeof MerchantLocationSchema>;

// ── analytics.zone_time_series ────────────────────────────────────────────────

export const ZoneTimeSeriesSchema = z.object({
  zone_id: z.string().min(1),
  bucket_start_local: isoTimestamp,
  bucket_grain: z.enum(['hour', 'day', 'week']),
  offers_seen_count: z.number().int().nonnegative(),
  offers_accepted_count: z.number().int().nonnegative(),
  trips_completed_count: z.number().int().nonnegative(),
  gross_amount_sum: z.number().nonnegative(),
  avg_wait_minutes: z.number().nullable(),
  computed_at: isoTimestamp,
});

export type ZoneTimeSeries = z.infer<typeof ZoneTimeSeriesSchema>;

// ── App-layer types (no direct DB table; validated at sync boundary) ──────────

export const OfferSchema = z.object({
  id: uuid,
  shiftId: uuid.optional(),
  platformAccountId: uuid.optional(),
  createdAt: isoTimestamp,
  status: z.enum(['pending', 'accepted', 'declined', 'ignored']),
  pickupZip: z.string(),
  dropoffZip: z.string(),
  estimatedPayout: z.number().nonnegative(),
  estimatedDistanceMiles: z.number().nonnegative(),
  estimatedTimeMinutes: z.number().nonnegative(),
  pickupZoneId: z.string().optional(),
  dropoffZoneId: z.string().optional(),
});

export type Offer = z.infer<typeof OfferSchema>;

export const ExpenseSchema = z.object({
  id: uuid,
  userId: uuid,
  linkedShiftId: uuid.optional(),
  category: z.enum(['fuel', 'taxi', 'parking', 'food', 'vehicle', 'other']),
  amount: z.number().nonnegative(),
  occurredAt: isoTimestamp,
  notes: z.string().optional(),
});

export type Expense = z.infer<typeof ExpenseSchema>;

export const CashLedgerEntrySchema = z.object({
  id: uuid,
  userId: uuid,
  amount: z.number(),
  type: z.enum(['deposit', 'withdrawal', 'adjustment']),
  createdAt: isoTimestamp,
  note: z.string().optional(),
});

export type CashLedgerEntry = z.infer<typeof CashLedgerEntrySchema>;

export const IncidentSchema = z.object({
  id: uuid,
  userId: uuid,
  createdAt: isoTimestamp,
  type: z.enum(['accident', 'customer_issue', 'platform_issue', 'other']),
  description: z.string().min(1),
});

export type Incident = z.infer<typeof IncidentSchema>;
