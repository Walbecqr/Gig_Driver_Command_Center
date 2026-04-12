/**
 * DoorDash CSV parser.
 *
 * Converts raw CSV text from DoorDash's two driver-facing export types into
 * the typed row objects consumed by ingestDoorDashEarnings() and
 * ingestDoorDashOrders() in ./doordash.ts.
 *
 * No external dependencies — uses a minimal RFC-4180 tokenizer.
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ParseResult<T> {
  rows: T[];
  /** Rows that could not be parsed (zero-indexed source row number → reason). */
  errors: { rowIndex: number; reason: string }[];
}

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

// ---------------------------------------------------------------------------
// Minimal RFC-4180 CSV tokenizer
// ---------------------------------------------------------------------------

interface TokenizedCsv {
  /** Normalised header strings (trimmed, lower-cased). */
  headers: string[];
  /** One string[] per data row; length may be < headers if trailing cols empty. */
  dataRows: string[][];
}

function tokenizeCsv(text: string): TokenizedCsv {
  // Normalise line endings
  const lines = splitCsvLines(text.replace(/\r\n/g, '\n').replace(/\r/g, '\n'));

  if (lines.length === 0) return { headers: [], dataRows: [] };

  // Skip any BOM or blank leading lines
  let startIdx = 0;
  while (startIdx < lines.length && lines[startIdx]!.trim() === '') startIdx++;

  const headers = parseRow(lines[startIdx] ?? '').map((h) => h.trim().toLowerCase());

  const dataRows: string[][] = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (line === '') continue;
    dataRows.push(parseRow(line));
  }

  return { headers, dataRows };
}

/**
 * Split CSV text into logical lines, respecting quoted newlines inside fields.
 */
function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  let cur = '';
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (ch === '"') {
      // Escaped quote ""
      if (inQuote && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
        cur += ch;
      }
    } else if (ch === '\n' && !inQuote) {
      lines.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur !== '') lines.push(cur);
  return lines;
}

/**
 * Parse one CSV row into fields, handling RFC-4180 quoting.
 */
function parseRow(line: string): string[] {
  const fields: string[] = [];
  let field = '';
  let inQuote = false;

  for (let i = 0; i <= line.length; i++) {
    const ch = i < line.length ? line[i]! : null;

    if (ch === '"' && !inQuote && field === '') {
      inQuote = true;
    } else if (ch === '"' && inQuote) {
      if (line[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuote = false;
      }
    } else if ((ch === ',' || ch === null) && !inQuote) {
      fields.push(field.trim());
      field = '';
    } else {
      field += ch ?? '';
    }
  }

  return fields;
}

// ---------------------------------------------------------------------------
// Column-map helpers
// ---------------------------------------------------------------------------

/** Map of normalised header → column index. */
type ColMap = Map<string, number>;

function buildColMap(headers: string[]): ColMap {
  const map: ColMap = new Map();
  headers.forEach((h, i) => map.set(h, i));
  return map;
}

/** Return the cell value for a header key, or undefined if column absent. */
function getCell(cells: string[], colMap: ColMap, key: string): string | undefined {
  const idx = colMap.get(key);
  if (idx === undefined) return undefined;
  const val = cells[idx];
  return val !== undefined && val.trim() !== '' ? val.trim() : undefined;
}

// ---------------------------------------------------------------------------
// Field coercion helpers
// ---------------------------------------------------------------------------

/**
 * Parse a DoorDash date string to ISO "YYYY-MM-DD".
 * Accepts "M/D/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", or "Month D, YYYY".
 */
function parseDate(raw: string | undefined): string {
  if (!raw) throw new Error('Missing date');

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // M/D/YYYY or MM/DD/YYYY
  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    return `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
  }

  // "Jan 5, 2024" / "January 5, 2024"
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }

  throw new Error(`Unrecognised date format: "${raw}"`);
}

/** Strip currency symbols and parse as float. Throws on NaN. */
function parseMoney(raw: string): number {
  const cleaned = raw.replace(/[$,\s]/g, '');
  const val = parseFloat(cleaned);
  if (isNaN(val)) throw new Error(`Invalid money value: "${raw}"`);
  return val;
}

/** Parse float or return null if absent/blank. */
function parseOptionalFloat(raw: string | undefined): number | null {
  if (raw == null) return null;
  const val = parseFloat(raw);
  return isNaN(val) ? null : val;
}

/** Assert a string is non-null and non-empty; throw with field name if not. */
function requireStr(raw: string | undefined, fieldName: string): string {
  if (!raw) throw new Error(`Missing required field: ${fieldName}`);
  return raw;
}
