/**
 * NWS (National Weather Service) GeoJSON parser.
 *
 * Handles two endpoint flavours from api.weather.gov:
 *
 *   /observations/latest  — FeatureCollection of station observations
 *   /alerts/active        — FeatureCollection of active alerts
 *
 * Unit conventions from the NWS API (all values carry a 'unitCode' alongside
 * 'value'):
 *   temperature       wmoUnit:degC  → converted to °F
 *   windSpeed         wmoUnit:km_h-1 → converted to mph
 *   windDirection     wmoUnit:degree_(angle)  → stored as-is (degrees)
 *   relativeHumidity  wmoUnit:percent → stored as-is
 *   visibility        wmoUnit:m → converted to miles
 *   dewpoint          wmoUnit:degC → converted to °F
 *   barometricPressure wmoUnit:Pa → stored as hPa (÷100)
 *
 * The parser is intentionally tolerant: if a property is missing or null it
 * is stored as null rather than throwing.
 */

// ----------------------------------------------------------------
// Shared GeoJSON types
// ----------------------------------------------------------------

/** A single GeoJSON Feature as returned by the NWS API. */
export interface NwsFeature {
  id?: string;
  type: 'Feature';
  geometry?: {
    type: string;
    coordinates?: unknown;
  } | null;
  properties: Record<string, unknown>;
}

/** A GeoJSON FeatureCollection. */
export interface NwsFeatureCollection {
  type: 'FeatureCollection';
  features: NwsFeature[];
}

// ----------------------------------------------------------------
// Parsed output types
// ----------------------------------------------------------------

/**
 * A single observation row derived from one NWS station observation feature.
 * Each entry in `conditions` maps to one external_conditions row (EAV-style).
 */
export interface NwsObservationRow {
  /** NWS feature @id URL — used as the feature_external_id. */
  featureId: string | null;
  stationId: string | null;
  stationName: string | null;
  observedTs: string | null;
  centroidLat: number | null;
  centroidLng: number | null;
  /** Raw properties JSON for reference_features.raw_properties_json. */
  rawProperties: Record<string, unknown>;
  /** EAV conditions to write to external_conditions. */
  conditions: NwsConditionEntry[];
}

export interface NwsConditionEntry {
  conditionType: string;
  conditionValueNumeric: number | null;
  conditionValueText: string | null;
  units: string | null;
}

/**
 * A single alert row derived from one NWS alert feature.
 * Maps to one external_condition_alerts row.
 */
export interface NwsAlertRow {
  featureId: string | null;
  alertExternalId: string | null;
  eventType: string;
  severity: string | null;
  certainty: string | null;
  urgency: string | null;
  onsetTs: string | null;
  expiresTs: string | null;
  headline: string | null;
  description: string | null;
  centroidLat: number | null;
  centroidLng: number | null;
  rawProperties: Record<string, unknown>;
}

// ----------------------------------------------------------------
// Unit conversion helpers
/**
 * Convert temperature from degrees Celsius to degrees Fahrenheit.
 *
 * @param c - Temperature in degrees Celsius
 * @returns Temperature in degrees Fahrenheit
 */

function cToF(c: number): number {
  return (c * 9) / 5 + 32;
}

/**
 * Convert a speed from kilometers per hour to miles per hour.
 *
 * @param kmh - Speed in kilometers per hour
 * @returns Speed in miles per hour
 */
function kmhToMph(kmh: number): number {
  return kmh * 0.621371;
}

/**
 * Convert a distance in meters to miles.
 *
 * @param m - Distance in meters
 * @returns The equivalent distance in miles
 */
function mToMiles(m: number): number {
  return m / 1609.344;
}

/**
 * Convert pressure from pascals to hectopascals.
 *
 * @param pa - Pressure value in pascals
 * @returns The equivalent pressure in hectopascals
 */
function paToHpa(pa: number): number {
  return pa / 100;
}

// ----------------------------------------------------------------
// NWS quantity extraction
// ----------------------------------------------------------------

/**
 * Extracts the numeric `value` from an NWS quantity object.
 *
 * @param obj - An object that may contain a `value` property (for example `{ value, unitCode }`)
 * @returns `number` if `obj.value` can be coerced to a finite number, `null` otherwise
 */
function nwsValue(obj: unknown): number | null {
  if (obj == null || typeof obj !== 'object') return null;
  const v = (obj as Record<string, unknown>).value;
  if (v == null || v === '') return null;
  const n = Number(v);
  return isFinite(n) ? n : null;
}

/**
 * Extracts a unit code from an object and removes known prefixes.
 *
 * Reads the `unitCode` property (if present and a string) and strips a leading
 * `wmoUnit:` or `unit:` prefix before returning the remainder.
 *
 * @param obj - Object that may contain a `unitCode` property
 * @returns The unit code with any leading `wmoUnit:` or `unit:` prefix removed, or `null` if not present or not a string
 */
function nwsUnit(obj: unknown): string | null {
  if (obj == null || typeof obj !== 'object') return null;
  const u = (obj as Record<string, unknown>).unitCode;
  if (typeof u !== 'string') return null;
  return u.replace(/^wmoUnit:/, '').replace(/^unit:/, '');
}

// ----------------------------------------------------------------
// Geometry helpers
/**
 * Extracts latitude and longitude from a GeoJSON Point geometry.
 *
 * @param geometry - A GeoJSON geometry object (may be `null` or non-Point) from an NWS feature
 * @returns An object with `lat` and `lng` set to numbers when the geometry is a valid Point with finite coordinates, otherwise `null` for each missing/invalid coordinate
 */

function extractPoint(
  geometry: NwsFeature['geometry'],
): { lat: number | null; lng: number | null } {
  if (!geometry || geometry.type !== 'Point') return { lat: null, lng: null };
  const coords = geometry.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return { lat: null, lng: null };
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  return {
    lat: isFinite(lat) ? lat : null,
    lng: isFinite(lng) ? lng : null,
  };
}

// ----------------------------------------------------------------
// Observation parser
// ----------------------------------------------------------------

/**
 * Convert an NWS observations FeatureCollection into an array of observation rows.
 *
 * Each output row corresponds to one feature and includes raw feature properties,
 * centroid coordinates, station metadata, and an EAV-style `conditions` array
 * with converted numeric values or text descriptions where available.
 *
 * @param featureCollection - GeoJSON FeatureCollection from an NWS observations endpoint
 * @returns An array of `NwsObservationRow`, one entry per feature in `featureCollection`
 */
export function parseNwsObservations(
  featureCollection: NwsFeatureCollection,
): NwsObservationRow[] {
  return featureCollection.features.map((feature) => {
    const props = feature.properties;
    const geo = extractPoint(feature.geometry);

    // Resolve station info
    const stationId =
      typeof props.station === 'string'
        ? props.station.split('/').pop() ?? null
        : null;
    const stationName =
      typeof props.name === 'string' ? props.name : null;

    const observedTs =
      typeof props.timestamp === 'string' ? props.timestamp : null;

    // Build EAV condition entries
    const conditions: NwsConditionEntry[] = [];

    const tempC = nwsValue(props.temperature);
    conditions.push({
      conditionType: 'temperature_f',
      conditionValueNumeric: tempC != null ? cToF(tempC) : null,
      conditionValueText: null,
      units: 'degF',
    });

    const dewpointC = nwsValue(props.dewpoint);
    conditions.push({
      conditionType: 'dewpoint_f',
      conditionValueNumeric: dewpointC != null ? cToF(dewpointC) : null,
      conditionValueText: null,
      units: 'degF',
    });

    const humidityPct = nwsValue(props.relativeHumidity);
    conditions.push({
      conditionType: 'humidity_pct',
      conditionValueNumeric: humidityPct,
      conditionValueText: null,
      units: 'percent',
    });

    const windKmh = nwsValue(props.windSpeed);
    conditions.push({
      conditionType: 'wind_speed_mph',
      conditionValueNumeric: windKmh != null ? kmhToMph(windKmh) : null,
      conditionValueText: null,
      units: 'mph',
    });

    const windDir = nwsValue(props.windDirection);
    conditions.push({
      conditionType: 'wind_direction_deg',
      conditionValueNumeric: windDir,
      conditionValueText: null,
      units: nwsUnit(props.windDirection) ?? 'degree',
    });

    const visM = nwsValue(props.visibility);
    conditions.push({
      conditionType: 'visibility_miles',
      conditionValueNumeric: visM != null ? mToMiles(visM) : null,
      conditionValueText: null,
      units: 'miles',
    });

    const pressurePa = nwsValue(props.barometricPressure);
    conditions.push({
      conditionType: 'pressure_hpa',
      conditionValueNumeric: pressurePa != null ? paToHpa(pressurePa) : null,
      conditionValueText: null,
      units: 'hPa',
    });

    // Text condition — weather description
    const description =
      Array.isArray(props.presentWeather)
        ? props.presentWeather
            .filter((w: unknown) => w != null)
            .map((w: unknown) =>
              typeof w === 'object' && w !== null
                ? ((w as Record<string, unknown>).weather as string) ?? ''
                : String(w),
            )
            .filter(Boolean)
            .join(', ')
        : typeof props.textDescription === 'string'
          ? props.textDescription
          : null;

    if (description) {
      conditions.push({
        conditionType: 'weather_description',
        conditionValueNumeric: null,
        conditionValueText: description,
        units: null,
      });
    }

    return {
      featureId:   typeof feature.id === 'string' ? feature.id : null,
      stationId,
      stationName,
      observedTs,
      centroidLat: geo.lat,
      centroidLng: geo.lng,
      rawProperties: props,
      conditions:  conditions.filter(
        (c) => c.conditionValueNumeric != null || c.conditionValueText != null,
      ),
    };
  });
}

// ----------------------------------------------------------------
// Alert parser
// ----------------------------------------------------------------

/**
 * Parses an NWS alerts FeatureCollection into an array of alert rows.
 *
 * Produces one row per feature: extracts centroid coordinates, preserves the original `properties` as `rawProperties`, maps common alert metadata (severity, certainty, urgency, onset/expires/headline/description) to strings or `null` when absent, and uses `"unknown"` when the event type is missing or empty.
 *
 * @returns An array of alert rows, one entry per feature in the input collection.
 */
export function parseNwsAlerts(
  featureCollection: NwsFeatureCollection,
): NwsAlertRow[] {
  return featureCollection.features.map((feature) => {
    const props = feature.properties;
    const geo   = extractPoint(feature.geometry);

    const eventType =
      typeof props.event === 'string' && props.event.trim().length > 0
        ? props.event
        : 'unknown';

    return {
      featureId:       typeof feature.id === 'string' ? feature.id : null,
      alertExternalId: typeof props.id === 'string' ? props.id : null,
      eventType,
      severity:    typeof props.severity    === 'string' ? props.severity    : null,
      certainty:   typeof props.certainty   === 'string' ? props.certainty   : null,
      urgency:     typeof props.urgency     === 'string' ? props.urgency     : null,
      onsetTs:     typeof props.onset       === 'string' ? props.onset       : null,
      expiresTs:   typeof props.expires     === 'string' ? props.expires     : null,
      headline:    typeof props.headline    === 'string' ? props.headline    : null,
      description: typeof props.description === 'string' ? props.description : null,
      centroidLat: geo.lat,
      centroidLng: geo.lng,
      rawProperties: props,
    };
  });
}
