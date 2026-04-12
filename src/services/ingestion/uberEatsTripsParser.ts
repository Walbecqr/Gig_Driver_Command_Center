/**
 * Uber Eats Driver Dataset parser (Kaggle).
 *
 * Converts raw CSV text from the Uber Eats driver trip Kaggle dataset into
 * typed row objects consumed by ingestUberEatsTrips() in ./uberEatsTrips.ts.
 *
 * No external dependencies — delegates to the shared csvUtils tokenizer.
 *
 * --------------------------------------------------------------------------
 * Expected columns (any order, case-insensitive; aliases tried left→right):
 *
 *   trip_id        | order_id | delivery_id | id
 *   date           | order_date | trip_date | delivery_date
 *   start_time     | pickup_time | trip_start | started_at
 *   end_time       | dropoff_time | delivery_time | trip_end | ended_at
 *   earnings       | total_earnings | revenue | total_pay | total with tip | total
 *   tip            | tips | tip_amount | customer tips
 *   distance       | distance (mi) | distance_miles | distance (miles)
 *   duration       | duration (min) | duration_minutes | time to complete (min) | time_minutes
 * --------------------------------------------------------------------------
 */

import {
  type ParseResult,
  tokenizeCsv,
  buildColMap,
  getCell,
  parseDate,
  parseOptionalDateTime,
  parseMoney,
  parseFloatOrZero,
  parseOptionalFloat,
} from './csvUtils';

export interface UberEatsTripRow {
  platformTripId: string | null;
  dateLocal: string;
  startTs: string | null;
  endTs: string | null;
  grossAmount: number;
  tipAmount: number;
  distanceMiles: number;
  durationMinutes: number | null;
}

export function parseUberEatsTrips(csvText: string): ParseResult<UberEatsTripRow> {
  const { headers, dataRows } = tokenizeCsv(csvText);
  const colMap = buildColMap(headers);

  const rows: UberEatsTripRow[] = [];
  const errors: ParseResult<UberEatsTripRow>['errors'] = [];

  dataRows.forEach((cells, i) => {
    try {
      const get = (key: string) => getCell(cells, colMap, key);

      const platformTripId =
        get('trip_id') ?? get('order_id') ?? get('delivery_id') ?? get('id') ?? null;

      const dateRaw =
        get('date') ?? get('order_date') ?? get('trip_date') ?? get('delivery_date');
      const dateLocal = parseDate(dateRaw);

      const startTs = parseOptionalDateTime(
        get('start_time') ?? get('pickup_time') ?? get('trip_start') ?? get('started_at'),
      );
      const endTs = parseOptionalDateTime(
        get('end_time') ??
          get('dropoff_time') ??
          get('delivery_time') ??
          get('trip_end') ??
          get('ended_at'),
      );

      const earningsRaw =
        get('earnings') ??
        get('total_earnings') ??
        get('revenue') ??
        get('total_pay') ??
        get('total with tip') ??
        get('total') ??
        '0';
      const grossAmount = parseMoney(earningsRaw);

      const tipRaw =
        get('tip') ?? get('tips') ?? get('tip_amount') ?? get('customer tips') ?? '0';
      const tipAmount = parseMoney(tipRaw);

      const distanceRaw =
        get('distance') ??
        get('distance (mi)') ??
        get('distance_miles') ??
        get('distance (miles)') ??
        '0';
      const distanceMiles = parseFloatOrZero(distanceRaw);

      const durationRaw =
        get('duration') ??
        get('duration (min)') ??
        get('duration_minutes') ??
        get('time to complete (min)') ??
        get('time_minutes');
      const durationMinutes = parseOptionalFloat(durationRaw);

      rows.push({ platformTripId, dateLocal, startTs, endTs, grossAmount, tipAmount, distanceMiles, durationMinutes });
    } catch (err) {
      errors.push({ rowIndex: i, reason: String(err instanceof Error ? err.message : err) });
    }
  });

  return { rows, errors };
}
