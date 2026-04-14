/**
 * Shared CSV tokenizer and field-coercion utilities.
 *
 * All ingestion parsers should import from here instead of duplicating
 * RFC-4180 tokenization and coercion helpers.
 *
 * No external dependencies.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ParseResult<T> {
  rows: T[];
  /** Zero-indexed source row → reason for every row that failed to parse. */
  errors: { rowIndex: number; reason: string }[];
}

/** Normalised (trimmed, lower-cased) header name → column index. */
export type ColMap = Map<string, number>;

export interface TokenizedCsv {
  /** Normalised header strings. */
  headers: string[];
  /** One string[] per data row; length may be < headers if trailing cols empty. */
  dataRows: string[][];
}

// ---------------------------------------------------------------------------
// RFC-4180 tokenizer
// ---------------------------------------------------------------------------

export function tokenizeCsv(text: string): TokenizedCsv {
  const lines = splitCsvLines(text.replace(/\r\n/g, '\n').replace(/\r/g, '\n'));
  if (lines.length === 0) return { headers: [], dataRows: [] };

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

function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  let cur = '';
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (ch === '"') {
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

export function buildColMap(headers: string[]): ColMap {
  const map: ColMap = new Map();
  headers.forEach((h, i) => map.set(h, i));
  return map;
}

/** Return the trimmed cell value, or undefined if the column is absent or blank. */
export function getCell(cells: string[], colMap: ColMap, key: string): string | undefined {
  const idx = colMap.get(key);
  if (idx === undefined) return undefined;
  const val = cells[idx];
  return val !== undefined && val.trim() !== '' ? val.trim() : undefined;
}

// ---------------------------------------------------------------------------
// Field coercion helpers
// ---------------------------------------------------------------------------

/**
 * Parse a date string to ISO "YYYY-MM-DD".
 * Accepts: "M/D/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "YYYY/MM/DD",
 *          "Month D, YYYY", and anything parseable by Date().
 */
export function parseDate(raw: string | undefined): string {
  if (!raw) throw new Error('Missing date');

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // YYYY/MM/DD
  const isoSlash = raw.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (isoSlash) return `${isoSlash[1]}-${isoSlash[2]}-${isoSlash[3]}`;

  // M/D/YYYY or MM/DD/YYYY
  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    return `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
  }

  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);

  throw new Error(`Unrecognised date format: "${raw}"`);
}

/**
 * Parse a datetime string to a local ISO timestamp ("YYYY-MM-DDTHH:MM:SS").
 * Returns null if the value is absent, blank, or unparseable.
 */
export function parseOptionalDateTime(raw: string | undefined): string | null {
  if (!raw) return null;

  // Already looks like ISO datetime
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(raw)) {
    return raw.replace(' ', 'T').replace(/Z$/, '').split('.')[0]!;
  }

  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toISOString().replace('Z', '').split('.')[0]!;
  }

  return null;
}

/** Strip currency symbols/commas and parse as float. Throws on NaN. */
export function parseMoney(raw: string): number {
  const cleaned = raw.replace(/[$,\s]/g, '');
  const val = parseFloat(cleaned);
  if (isNaN(val)) throw new Error(`Invalid money value: "${raw}"`);
  return val;
}

/** Parse float (stripping $, %, commas) or return null if absent/blank/NaN. */
export function parseOptionalFloat(raw: string | undefined): number | null {
  if (raw == null) return null;
  const cleaned = raw.replace(/[$,%\s]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

/** parseOptionalFloat with a 0 fallback. */
export function parseFloatOrZero(raw: string | undefined): number {
  return parseOptionalFloat(raw) ?? 0;
}

/** Assert non-null/non-empty; throw with field name if not. */
export function requireStr(raw: string | undefined, fieldName: string): string {
  if (!raw) throw new Error(`Missing required field: ${fieldName}`);
  return raw;
}

/**
 * Coerce a boolean-like string.
 * Returns true for "1", "true", "yes", "y", "cancelled", "canceled".
 * Returns false for "0", "false", "no", "n", "completed".
 * Returns null if unrecognised or absent.
 */
export function parseBoolFlag(raw: string | undefined): boolean | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (['1', 'true', 'yes', 'y', 'cancelled', 'canceled'].includes(lower)) return true;
  if (['0', 'false', 'no', 'n', 'completed'].includes(lower)) return false;
  return null;
}
