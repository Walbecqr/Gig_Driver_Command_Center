/**
 * DoorDash CSV parser.
 *
 * Converts raw CSV text from DoorDash's two driver-facing export types into
 * the typed row objects consumed by ingestDoorDashEarnings() and
 * ingestDoorDashOrders() in ./doordash.ts.
 *
 * No external dependencies — uses shared RFC-4180 helpers from csvUtils.ts.
 *
 * --------------------------------------------------------------------------
 * EARNINGS CSV  (Dashboard → Earnings → Export)
 *   Expected columns (any order, case-insensitive):
 *     Date, Order ID, Merchant Name, Base Pay, Customer Tips,
 *     Other Pay, Total with Tip, Distance (mi)
 *
 * ORDERS CSV  (Dashboard → Deliveries → Export)
 *   Expected columns (any order, case-insensitive):
 *     Date, Order ID, Merchant Address, Delivery Address,
 *     Time to Complete (min)
 *   Optional (present in some markets):
 *     Pickup Latitude, Pickup Longitude, Dropoff Latitude, Dropoff Longitude
 * --------------------------------------------------------------------------
 */

import type { DoorDashEarningsRow, DoorDashOrderRow } from './doordash';
import {
  buildColMap,
  getCell,
  parseDate,
  parseMoney,
  parseOptionalFloat,
  requireStr,
  tokenizeCsv,
} from './csvUtils';
import type { ParseResult } from './csvUtils';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse the text content of a DoorDash Earnings CSV export.
 *
 * @param csvText  Raw string content of the file (UTF-8).
 */
export function parseDoorDashEarnings(csvText: string): ParseResult<DoorDashEarningsRow> {
  const { headers, dataRows } = tokenizeCsv(csvText);
  const colMap = buildColMap(headers);

  const rows: DoorDashEarningsRow[] = [];
  const errors: ParseResult<DoorDashEarningsRow>['errors'] = [];

  dataRows.forEach((cells, i) => {
    try {
      const get = (key: string) => getCell(cells, colMap, key);

      const date = parseDate(get('date'));
      const deliveryId = requireStr(get('order id') ?? get('delivery id'), 'Order ID');
      const storeName = get('merchant name') ?? get('store name') ?? get('restaurant name') ?? '';
      const basePay = parseMoney(get('base pay') ?? '0');
      const tip = parseMoney(get('customer tips') ?? get('tips') ?? '0');
      const peakPay = parseMoney(get('other pay') ?? get('peak pay') ?? get('bonus') ?? '0');
      // "Total with Tip" is the authoritative total; fall back to sum of parts
      const totalPayRaw = get('total with tip') ?? get('total pay') ?? get('total earnings');
      const totalPay = totalPayRaw != null ? parseMoney(totalPayRaw) : basePay + tip + peakPay;

      const distanceRaw = get('distance (mi)') ?? get('distance (miles)') ?? get('distance') ?? '0';
      const distanceMiles = parseFloat(distanceRaw.replace(/[^\d.]/g, '')) || 0;

      rows.push({ date, deliveryId, storeName, totalPay, basePay, tip, peakPay, distanceMiles });
    } catch (err) {
      errors.push({ rowIndex: i, reason: String(err instanceof Error ? err.message : err) });
    }
  });

  return { rows, errors };
}

/**
 * Parse the text content of a DoorDash Orders / Deliveries CSV export.
 *
 * @param csvText  Raw string content of the file (UTF-8).
 */
export function parseDoorDashOrders(csvText: string): ParseResult<DoorDashOrderRow> {
  const { headers, dataRows } = tokenizeCsv(csvText);
  const colMap = buildColMap(headers);

  const rows: DoorDashOrderRow[] = [];
  const errors: ParseResult<DoorDashOrderRow>['errors'] = [];

  dataRows.forEach((cells, i) => {
    try {
      const get = (key: string) => getCell(cells, colMap, key);

      const date = parseDate(get('date') ?? get('order date'));
      const orderId = requireStr(get('order id'), 'Order ID');

      const pickupAddress =
        get('merchant address') ?? get('pickup address') ?? get('store address') ?? '';
      const dropoffAddress =
        get('delivery address') ?? get('dropoff address') ?? get('customer address') ?? '';

      const pickupLat = parseOptionalFloat(get('pickup latitude') ?? get('merchant latitude'));
      const pickupLng = parseOptionalFloat(get('pickup longitude') ?? get('merchant longitude'));
      const dropoffLat = parseOptionalFloat(get('dropoff latitude') ?? get('delivery latitude'));
      const dropoffLng = parseOptionalFloat(get('dropoff longitude') ?? get('delivery longitude'));

      const durationRaw = get('time to complete (min)') ?? get('duration (min)') ?? get('duration');
      const durationMinutes =
        durationRaw != null ? parseFloat(durationRaw.replace(/[^\d.]/g, '')) || null : null;

      rows.push({
        orderId,
        date,
        pickupAddress,
        pickupLat,
        pickupLng,
        dropoffAddress,
        dropoffLat,
        dropoffLng,
        durationMinutes,
      });
    } catch (err) {
      errors.push({ rowIndex: i, reason: String(err instanceof Error ? err.message : err) });
    }
  });

  return { rows, errors };
}
