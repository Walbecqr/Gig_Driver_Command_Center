/**
 * Census ACS (American Community Survey) JSON parser.
 *
 * The Census API returns data in an "array-of-arrays" format:
 *   [ ["variable1","variable2",...], ["value1","value2",...], ... ]
 *
 * The first row is the header; subsequent rows are data rows.
 *
 * This parser handles the common table formats used for our zone scoring:
 *   - B01001  (total population, age/sex distribution)
 *   - B19013  (median household income)
 *   - B08301  (means of transportation to work)
 *   - B25001  (housing units)
 *   - B15003  (educational attainment)
 *   - S0801   (subject table — commuting characteristics)
 *
 * Additionally supports a simpler pre-joined JSON format where each object
 * in the array has a 'geoid' field and named metric fields.
 *
 * Output is always CensusAcsRow[], which feeds censusAcsIngestion.ts.
 * Each CensusAcsRow becomes one zone_demographics record per metric_key.
 */

// ----------------------------------------------------------------
// Parsed output types
// ----------------------------------------------------------------

export interface CensusAcsMetric {
  metricKey: string;
  metricValueNumeric: number | null;
  metricValueText: string | null;
  units: string | null;
}

export interface CensusAcsRow {
  /** FIPS GEOID (state + county + tract, or ZCTA, or place). */
  geoid: string | null;
  /** Human-readable name for the geographic unit (e.g. "Travis County, Texas"). */
  name: string | null;
  /** Source survey vintage, e.g. "ACS 2022 5-year". */
  vintage: string | null;
  /** Centroid coordinates — optionally present in enriched files. */
  centroidLat: number | null;
  centroidLng: number | null;
  /** Metrics derived from this row. */
  metrics: CensusAcsMetric[];
  /** The original row as-is for raw_properties_json. */
  rawRecord: Record<string, unknown>;
}

// ----------------------------------------------------------------
// Variable → metric key / unit mappings
// ----------------------------------------------------------------

/** Maps Census variable codes to (metricKey, units) pairs. */
const VARIABLE_MAP: Record<string, { key: string; units: string | null }> = {
  // Population
  B01001_001E:  { key: 'total_population',          units: 'persons' },
  B01002_001E:  { key: 'median_age',                units: 'years'   },

  // Household income
  B19013_001E:  { key: 'median_household_income',   units: 'usd'     },
  B19301_001E:  { key: 'per_capita_income',         units: 'usd'     },

  // Poverty
  B17001_002E:  { key: 'population_below_poverty',  units: 'persons' },
  B17001_001E:  { key: 'population_poverty_universe', units: 'persons' },

  // Housing
  B25001_001E:  { key: 'total_housing_units',       units: 'units'   },
  B25002_002E:  { key: 'occupied_housing_units',    units: 'units'   },
  B25064_001E:  { key: 'median_gross_rent',         units: 'usd'     },
  B25077_001E:  { key: 'median_home_value',         units: 'usd'     },

  // Transportation (commute mode)
  B08301_001E:  { key: 'workers_16_plus',           units: 'persons' },
  B08301_002E:  { key: 'commute_drove_alone',       units: 'persons' },
  B08301_010E:  { key: 'commute_transit',           units: 'persons' },
  B08301_018E:  { key: 'commute_bicycle',           units: 'persons' },
  B08301_019E:  { key: 'commute_walk',              units: 'persons' },
  B08301_021E:  { key: 'commute_worked_home',       units: 'persons' },

  // Education
  B15003_001E:  { key: 'population_25_plus',        units: 'persons' },
  B15003_022E:  { key: 'bachelors_degree',          units: 'persons' },
  B15003_023E:  { key: 'masters_degree',            units: 'persons' },

  // Race / ethnicity (for equity analysis, not scoring)
  B02001_002E:  { key: 'race_white_alone',          units: 'persons' },
  B03002_012E:  { key: 'hispanic_or_latino',        units: 'persons' },

  // Vehicles available (delivery relevance)
  B08201_001E:  { key: 'households_total',          units: 'households' },
  B08201_002E:  { key: 'households_no_vehicle',     units: 'households' },
};

// ----------------------------------------------------------------
// Array-of-arrays parser (native Census API format)
// ----------------------------------------------------------------

/**
 * Parses a Census API "array-of-arrays" response into normalized CensusAcsRow entries.
 *
 * @param data - Array where the first element is a header row and subsequent elements are data rows as returned by the Census API.
 * @param vintage - Optional source vintage label (for example, "ACS 2022 5-year").
 * @returns A list of parsed Census rows (one per data row). Returns an empty array when `data` is not an array or has fewer than two rows.
 */
export function parseCensusAcsArrayFormat(
  data: string[][],
  vintage?: string,
): CensusAcsRow[] {
  if (!Array.isArray(data) || data.length < 2) return [];

  const headers = data[0]!.map((h) => h.trim().toUpperCase());

  // Locate key columns
  const geoidIdx   = headers.indexOf('GEO_ID');
  const nameIdx    = headers.indexOf('NAME');
  const latIdx     = headers.indexOf('INTPTLAT');
  const lngIdx     = headers.indexOf('INTPTLON');

  const rows: CensusAcsRow[] = [];

  for (let r = 1; r < data.length; r++) {
    const row = data[r]!;
    const rawRecord: Record<string, unknown> = {};
    headers.forEach((h, i) => { rawRecord[h] = row[i]; });

    // Extract GEOID — strip leading 'US' prefix if present
    const rawGeoid = geoidIdx >= 0 ? (row[geoidIdx] ?? null) : null;
    const geoid = rawGeoid ? rawGeoid.replace(/^US/i, '') : null;

    const name =
      nameIdx >= 0 ? (row[nameIdx] ?? null) : null;

    const centroidLat =
      latIdx >= 0 && row[latIdx] ? parseFloat(row[latIdx]!) : null;
    const centroidLng =
      lngIdx >= 0 && row[lngIdx] ? parseFloat(row[lngIdx]!) : null;

    // Build metrics
    const metrics: CensusAcsMetric[] = [];
    headers.forEach((varCode, colIdx) => {
      const mapping = VARIABLE_MAP[varCode];
      if (!mapping) return;
      const raw = row[colIdx];
      if (raw == null || raw === '' || raw === '-' || raw === 'null') return;
      const num = parseFloat(raw);
      metrics.push({
        metricKey:          mapping.key,
        metricValueNumeric: isFinite(num) ? num : null,
        metricValueText:    !isFinite(num) ? raw : null,
        units:              mapping.units,
      });
    });

    rows.push({
      geoid,
      name,
      vintage:     vintage ?? null,
      centroidLat: isFinite(centroidLat ?? NaN) ? centroidLat : null,
      centroidLng: isFinite(centroidLng ?? NaN) ? centroidLng : null,
      metrics,
      rawRecord,
    });
  }

  return rows;
}

// ----------------------------------------------------------------
// Object-array parser (pre-joined / enriched format)
// ----------------------------------------------------------------

/**
 * Convert an array of pivoted Census ACS records into normalized CensusAcsRow entries.
 *
 * Returns an empty array when given a non-array input.
 *
 * @param data - Array of plain objects whose keys may include Census variable codes (case-insensitive); unknown keys are preserved in each row's `rawRecord`.
 * @param vintage - Optional source vintage label to attach to each output row; `null` if omitted.
 * @returns An array of CensusAcsRow objects containing parsed `geoid`, `name`, optional centroid coordinates, mapped `metrics`, and the original `rawRecord`.
 */
export function parseCensusAcsObjectFormat(
  data: Record<string, unknown>[],
  vintage?: string,
): CensusAcsRow[] {
  if (!Array.isArray(data)) return [];

  return data.map((obj) => {
    const geoid =
      typeof obj['geoid'] === 'string' ? obj['geoid'].replace(/^US/i, '') :
      typeof obj['GEO_ID'] === 'string' ? obj['GEO_ID'].replace(/^US/i, '') :
      null;

    const name =
      typeof obj['name'] === 'string' ? obj['name'] :
      typeof obj['NAME'] === 'string' ? obj['NAME'] :
      null;

    const centroidLat =
      typeof obj['centroid_lat'] === 'number' ? obj['centroid_lat'] :
      typeof obj['INTPTLAT'] === 'string' ? parseFloat(obj['INTPTLAT'] as string) :
      null;

    const centroidLng =
      typeof obj['centroid_lng'] === 'number' ? obj['centroid_lng'] :
      typeof obj['INTPTLON'] === 'string' ? parseFloat(obj['INTPTLON'] as string) :
      null;

    const metrics: CensusAcsMetric[] = [];
    for (const [key, val] of Object.entries(obj)) {
      const mapping = VARIABLE_MAP[key.toUpperCase()];
      if (!mapping) continue;
      if (val == null || val === '') continue;
      const num = typeof val === 'number' ? val : parseFloat(String(val));
      metrics.push({
        metricKey:          mapping.key,
        metricValueNumeric: isFinite(num) ? num : null,
        metricValueText:    !isFinite(num) ? String(val) : null,
        units:              mapping.units,
      });
    }

    return {
      geoid,
      name,
      vintage:     vintage ?? null,
      centroidLat: typeof centroidLat === 'number' && isFinite(centroidLat) ? centroidLat : null,
      centroidLng: typeof centroidLng === 'number' && isFinite(centroidLng) ? centroidLng : null,
      metrics,
      rawRecord: obj,
    };
  });
}
