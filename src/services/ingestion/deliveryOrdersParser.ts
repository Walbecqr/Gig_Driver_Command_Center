/**
 * Delivery Orders simulation dataset parser (Kaggle).
 *
 * Rows are treated as synthetic delivery data:
 *   platform     = 'synthetic'
 *   source_type  = 'simulation'
 *
 * No external dependencies — delegates to the shared csvUtils tokenizer.
 *
 * --------------------------------------------------------------------------
 * Expected columns (any order, case-insensitive; aliases tried left→right):
 *
 *   order_id       | delivery_id | id | order id
 *   date           | order_date | created_at | placed_at | order date
 *   order_value    | order_total | revenue | gross_amount | total | price | amount
 *   delivery_time  | duration_minutes | time_minutes | time to complete (min) | duration | duration (min)
 *   distance       | distance_miles | distance (mi) | distance (miles)
 *   pickup_lat     | origin_lat | restaurant_lat | pickup latitude
 *   pickup_lng     | pickup_long | origin_lng | restaurant_lng | pickup longitude
 *   dropoff_lat    | destination_lat | delivery_lat | dropoff latitude
 *   dropoff_lng    | dropoff_long | destination_lng | delivery_lng | dropoff longitude
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
} from './csvUtils';

export interface DeliveryOrderRow {
  orderId: string | null;
  dateLocal: string;
  grossAmount: number;
  durationMinutes: number | null;
  distanceMiles: number;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
}

export function parseDeliveryOrders(csvText: string): ParseResult<DeliveryOrderRow> {
  const { headers, dataRows } = tokenizeCsv(csvText);
  const colMap = buildColMap(headers);

  const rows: DeliveryOrderRow[] = [];
  const errors: ParseResult<DeliveryOrderRow>['errors'] = [];

  dataRows.forEach((cells, i) => {
    try {
      const get = (key: string) => getCell(cells, colMap, key);

      const orderId =
        get('order_id') ?? get('delivery_id') ?? get('id') ?? get('order id') ?? null;

      const dateRaw =
        get('date') ??
        get('order_date') ??
        get('created_at') ??
        get('placed_at') ??
        get('order date');
      const dateLocal = parseDate(dateRaw);

      const valueRaw =
        get('order_value') ??
        get('order_total') ??
        get('revenue') ??
        get('gross_amount') ??
        get('total') ??
        get('price') ??
        get('amount') ??
        '0';
      const grossAmount = parseMoney(valueRaw);

      const durationMinutes = parseOptionalFloat(
        get('delivery_time') ??
          get('duration_minutes') ??
          get('time_minutes') ??
          get('time to complete (min)') ??
          get('duration') ??
          get('duration (min)'),
      );

      const distanceMiles = parseFloatOrZero(
        get('distance') ??
          get('distance_miles') ??
          get('distance (mi)') ??
          get('distance (miles)'),
      );

      const pickupLat = parseOptionalFloat(
        get('pickup_lat') ?? get('origin_lat') ?? get('restaurant_lat') ?? get('pickup latitude'),
      );
      const pickupLng = parseOptionalFloat(
        get('pickup_lng') ??
          get('pickup_long') ??
          get('origin_lng') ??
          get('restaurant_lng') ??
          get('pickup longitude'),
      );
      const dropoffLat = parseOptionalFloat(
        get('dropoff_lat') ??
          get('destination_lat') ??
          get('delivery_lat') ??
          get('dropoff latitude'),
      );
      const dropoffLng = parseOptionalFloat(
        get('dropoff_lng') ??
          get('dropoff_long') ??
          get('destination_lng') ??
          get('delivery_lng') ??
          get('dropoff longitude'),
      );

      rows.push({ orderId, dateLocal, grossAmount, durationMinutes, distanceMiles, pickupLat, pickupLng, dropoffLat, dropoffLng });
    } catch (err) {
      errors.push({ rowIndex: i, reason: String(err instanceof Error ? err.message : err) });
    }
  });

  return { rows, errors };
}
