/**
 * Uber Ride Analytics Dataset parser (Kaggle).
 *
 * Converts raw CSV text into typed UberRideRow objects consumed by
 * ingestUberRides() in ./uberRide.ts.
 *
 * No external dependencies — delegates to the shared csvUtils tokenizer.
 *
 * --------------------------------------------------------------------------
 * Expected columns (any order, case-insensitive; aliases tried left→right):
 *
 *   trip_id          | booking_id | ride_id | id
 *   date             | trip_date | ride_date | booking_date | pickup_datetime | start_time
 *   booking_status   | status | trip_status | ride_status
 *   distance         | distance_km | distance_miles | trip_distance
 *   revenue          | fare | earnings | price | total | amount
 *   cancellation_fee | cancel_fee | cancellation_pay
 *   duration         | duration_minutes | trip_duration | time_minutes | duration (min)
 *   surge_multiplier | surge | surge_pricing | surge_factor
 *   cancellation_flag| is_cancelled | cancelled | cancel_flag
 * --------------------------------------------------------------------------
 */

import {
  type ParseResult,
  tokenizeCsv,
  buildColMap,
  getCell,
  parseDate,
  parseMoney,
  parseOptionalFloat,
  parseFloatOrZero,
  parseBoolFlag,
} from './csvUtils';

export interface UberRideRow {
  platformTripId: string | null;
  dateLocal: string;
  tripStatus: 'completed' | 'cancelled' | 'unknown';
  distanceMiles: number;
  grossAmount: number;
  cancellationPay: number | null;
  durationMinutes: number | null;
  surgeMultiplier: number | null;
}

export function parseUberRides(csvText: string): ParseResult<UberRideRow> {
  const { headers, dataRows } = tokenizeCsv(csvText);
  const colMap = buildColMap(headers);

  const rows: UberRideRow[] = [];
  const errors: ParseResult<UberRideRow>['errors'] = [];

  dataRows.forEach((cells, i) => {
    try {
      const get = (key: string) => getCell(cells, colMap, key);

      const platformTripId =
        get('trip_id') ?? get('booking_id') ?? get('ride_id') ?? get('id') ?? null;

      const dateRaw =
        get('date') ??
        get('trip_date') ??
        get('ride_date') ??
        get('booking_date') ??
        get('pickup_datetime') ??
        get('start_time');
      const dateLocal = parseDate(dateRaw);

      // Normalise booking status to trip_status_enum values
      const statusRaw = (
        get('booking_status') ??
        get('status') ??
        get('trip_status') ??
        get('ride_status') ??
        'unknown'
      ).toLowerCase();

      let tripStatus: 'completed' | 'cancelled' | 'unknown';
      if (statusRaw.includes('complet') || statusRaw.includes('finish')) {
        tripStatus = 'completed';
      } else if (statusRaw.includes('cancel') || statusRaw.includes('reject')) {
        tripStatus = 'cancelled';
      } else {
        tripStatus = 'unknown';
      }

      // Explicit cancellation flag column overrides the status string
      const cancelFlag = parseBoolFlag(
        get('cancellation_flag') ?? get('is_cancelled') ?? get('cancelled') ?? get('cancel_flag'),
      );
      if (cancelFlag === true) tripStatus = 'cancelled';

      const distanceRaw =
        get('distance') ?? get('distance_km') ?? get('distance_miles') ?? get('trip_distance') ?? '0';
      const distanceMiles = parseFloatOrZero(distanceRaw);

      const revenueRaw =
        get('revenue') ??
        get('fare') ??
        get('earnings') ??
        get('price') ??
        get('total') ??
        get('amount') ??
        '0';
      const grossAmount = parseMoney(revenueRaw);

      const cancellationPay = parseOptionalFloat(
        get('cancellation_fee') ?? get('cancel_fee') ?? get('cancellation_pay'),
      );

      const durationMinutes = parseOptionalFloat(
        get('duration') ??
          get('duration_minutes') ??
          get('trip_duration') ??
          get('time_minutes') ??
          get('duration (min)'),
      );

      const surgeMultiplier = parseOptionalFloat(
        get('surge_multiplier') ?? get('surge') ?? get('surge_pricing') ?? get('surge_factor'),
      );

      rows.push({ platformTripId, dateLocal, tripStatus, distanceMiles, grossAmount, cancellationPay, durationMinutes, surgeMultiplier });
    } catch (err) {
      errors.push({ rowIndex: i, reason: String(err instanceof Error ? err.message : err) });
    }
  });

  return { rows, errors };
}
