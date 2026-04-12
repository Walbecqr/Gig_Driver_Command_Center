/**
 * Uber / Lyft + Weather dataset parser (Kaggle).
 *
 * Converts raw CSV text into typed WeatherConditionRow objects consumed by
 * ingestWeatherConditions() in ./weatherConditions.ts.
 *
 * No external dependencies — delegates to the shared csvUtils tokenizer.
 *
 * --------------------------------------------------------------------------
 * Expected columns (any order, case-insensitive; aliases tried left→right):
 *
 *   timestamp      | datetime | date_time | date | time | hour
 *   lat            | latitude
 *   lng            | longitude | long | lon
 *   temp           | temperature | temp_f | temp_fahrenheit | temperature_f
 *   weather        | conditions | weather_condition | weather_main | description | summary
 *   humidity       | humidity_pct | humidity_%
 *   wind_speed     | windspeed | wind speed (mph) | wind_speed_mph
 *   visibility     | visibility_miles | visibility (miles) | vis_miles
 *   surge          | surge_multiplier | surge_pricing | surge_factor | multiplier
 * --------------------------------------------------------------------------
 */

import {
  type ParseResult,
  tokenizeCsv,
  buildColMap,
  getCell,
  parseDate,
  parseOptionalDateTime,
  parseOptionalFloat,
} from './csvUtils';

export interface WeatherConditionRow {
  /** ISO local timestamp, e.g. "2024-11-05T14:00:00". */
  recordedAt: string;
  latitude: number | null;
  longitude: number | null;
  weatherCondition: string | null;
  temperatureF: number | null;
  humidityPct: number | null;
  windSpeedMph: number | null;
  visibilityMiles: number | null;
  surgeMultiplier: number | null;
}

export function parseWeatherConditions(csvText: string): ParseResult<WeatherConditionRow> {
  const { headers, dataRows } = tokenizeCsv(csvText);
  const colMap = buildColMap(headers);

  const rows: WeatherConditionRow[] = [];
  const errors: ParseResult<WeatherConditionRow>['errors'] = [];

  dataRows.forEach((cells, i) => {
    try {
      const get = (key: string) => getCell(cells, colMap, key);

      const dtRaw =
        get('timestamp') ??
        get('datetime') ??
        get('date_time') ??
        get('date') ??
        get('time') ??
        get('hour');

      if (!dtRaw) throw new Error('Missing timestamp / date');

      // Full datetime → keep as-is; date-only → append midnight
      const tsString = parseOptionalDateTime(dtRaw);
      const recordedAt = tsString ?? `${parseDate(dtRaw)}T00:00:00`;

      const latitude = parseOptionalFloat(get('lat') ?? get('latitude'));
      const longitude = parseOptionalFloat(
        get('lng') ?? get('longitude') ?? get('long') ?? get('lon'),
      );

      const weatherCondition =
        get('weather') ??
        get('conditions') ??
        get('weather_condition') ??
        get('weather_main') ??
        get('description') ??
        get('summary') ??
        null;

      const temperatureF = parseOptionalFloat(
        get('temp') ??
          get('temperature') ??
          get('temp_f') ??
          get('temp_fahrenheit') ??
          get('temperature_f'),
      );

      const humidityPct = parseOptionalFloat(
        get('humidity') ?? get('humidity_pct') ?? get('humidity_%'),
      );

      const windSpeedMph = parseOptionalFloat(
        get('wind_speed') ??
          get('windspeed') ??
          get('wind speed (mph)') ??
          get('wind_speed_mph'),
      );

      const visibilityMiles = parseOptionalFloat(
        get('visibility') ??
          get('visibility_miles') ??
          get('visibility (miles)') ??
          get('vis_miles'),
      );

      const surgeMultiplier = parseOptionalFloat(
        get('surge') ??
          get('surge_multiplier') ??
          get('surge_pricing') ??
          get('surge_factor') ??
          get('multiplier'),
      );

      rows.push({
        recordedAt,
        latitude,
        longitude,
        weatherCondition,
        temperatureF,
        humidityPct,
        windSpeedMph,
        visibilityMiles,
        surgeMultiplier,
      });
    } catch (err) {
      errors.push({ rowIndex: i, reason: String(err instanceof Error ? err.message : err) });
    }
  });

  return { rows, errors };
}
