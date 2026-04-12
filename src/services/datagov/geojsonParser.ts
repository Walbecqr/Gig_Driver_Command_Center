/**
 * Generic GeoJSON parser for data.gov reference datasets.
 *
 * Handles FeatureCollection payloads from:
 *   - FEMA National Flood Hazard Layer   → zone_risk_layers (risk_type='flood_zone')
 *   - NHTSA crash data (aggregated)      → zone_risk_layers (risk_type='crash_rate')
 *   - FHWA travel-time / roads           → zone_transport_layers
 *   - TIGER boundaries / zip codes       → zone_reference_layers
 *   - Venue / event demand drivers       → zone_demand_drivers
 *   - POI reference (transit, hospitals) → poi_reference
 *   - Land use / zoning                  → zone_land_use_layers
 *   - EV charging / fuel / rest stops    → infrastructure_reference
 *
 * Rather than dataset-specific parsers, a profile-based approach is used:
 *   1. Caller supplies a GeojsonIngestProfile that describes which property
 *      keys to extract and what target table / column to map them to.
 *   2. The parser walks the FeatureCollection, applies the profile, and
 *      returns ParsedGeoJsonFeature[].
 *   3. geojsonIngestion.ts routes each row to the correct table based on
 *      the profile's targetTable field.
 *
 * Centroid computation:
 *   - Point:   geometry.coordinates directly.
 *   - Polygon: simple bounding-box midpoint (fast approximation).
 *   - Other:   null (let ingestion skip H3 or use a supplied centroid property).
 */

// ----------------------------------------------------------------
// GeoJSON types (minimal — we only need what we read)
// ----------------------------------------------------------------

export type GeoJsonGeometryType =
  | 'Point'
  | 'Polygon'
  | 'MultiPolygon'
  | 'LineString'
  | 'MultiLineString'
  | 'GeometryCollection';

export interface GeoJsonGeometry {
  type: GeoJsonGeometryType;
  coordinates?: unknown;
}

export interface GeoJsonFeature {
  type: 'Feature';
  id?: string | number;
  geometry?: GeoJsonGeometry | null;
  properties?: Record<string, unknown> | null;
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

// ----------------------------------------------------------------
// Ingest profile types
// ----------------------------------------------------------------

/** Which domain table should receive the parsed features. */
export type GeoJsonTargetTable =
  | 'zone_risk_layers'
  | 'zone_transport_layers'
  | 'zone_reference_layers'
  | 'zone_demand_drivers'
  | 'poi_reference'
  | 'zone_land_use_layers'
  | 'infrastructure_reference';

/**
 * Describes how to map a GeoJSON FeatureCollection to a domain table.
 * The parser uses this to extract the right properties and assign the
 * correct metric_key / risk_type / etc.
 */
export interface GeojsonIngestProfile {
  /** Which domain table to write to. */
  targetTable: GeoJsonTargetTable;

  /**
   * For risk/transport/demographics tables: the key name for the primary
   * metric column (e.g. 'flood_zone', 'crash_rate', 'travel_time_index').
   * Required for zone_risk_layers, zone_transport_layers, zone_demand_drivers,
   * zone_land_use_layers. Ignored for poi_reference and infrastructure_reference.
   */
  primaryMetricKey?: string;

  /**
   * Property name in the feature that holds the numeric metric value.
   * If not provided, the parser attempts a list of common names.
   */
  valuePropertyName?: string;

  /**
   * Property name for a text classification (e.g. flood zone 'AE', 'X').
   */
  textPropertyName?: string;

  /** Units label, e.g. 'zone_code', 'crashes_per_mile', 'index'. */
  units?: string;

  /** Property name for the feature's external identifier. */
  externalIdPropertyName?: string;

  /** Property name for the feature's human-readable name. */
  namePropertyName?: string;

  /**
   * For poi_reference / infrastructure_reference:
   * property name that holds the category / type string.
   */
  categoryPropertyName?: string;

  /** Source confidence (0–1). Defaults to 0.9. */
  sourceConfidence?: number;

  /**
   * Properties to extract into the normalized_properties_json column on
   * reference_features.  Keys are property names; values are target key names.
   */
  normalizedProps?: Record<string, string>;
}

// ----------------------------------------------------------------
// Parsed output type
// ----------------------------------------------------------------

/**
 * One parsed feature, ready for ingestion.
 * The `profile` field is carried along so the ingestion layer knows which
 * table to write to and what column mapping to apply.
 */
export interface ParsedGeoJsonFeature {
  /** GeoJSON feature.id or properties[externalIdProperty]. */
  featureExternalId: string | null;
  featureName: string | null;
  featureSubtype: string | null;
  geometryType: string;
  geometryJson: GeoJsonGeometry | null;
  centroidLat: number | null;
  centroidLng: number | null;
  /** Primary numeric metric value (e.g. crash count, travel time index). */
  metricValueNumeric: number | null;
  /** Primary text classification (e.g. flood zone code). */
  metricValueText: string | null;
  /** The profile applied to this feature. */
  profile: GeojsonIngestProfile;
  /** All original properties, for raw_properties_json. */
  rawProperties: Record<string, unknown>;
  /** Subset of properties mapped via profile.normalizedProps. */
  normalizedProperties: Record<string, unknown> | null;
}

// ----------------------------------------------------------------
// Centroid helpers
// ----------------------------------------------------------------

function centroidFromPoint(coords: unknown): { lat: number | null; lng: number | null } {
  if (!Array.isArray(coords) || coords.length < 2) return { lat: null, lng: null };
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  return {
    lat: isFinite(lat) ? lat : null,
    lng: isFinite(lng) ? lng : null,
  };
}

function centroidFromPolygon(coords: unknown): { lat: number | null; lng: number | null } {
  // Take first ring; compute bounding-box midpoint
  if (!Array.isArray(coords) || !Array.isArray(coords[0])) return { lat: null, lng: null };
  const ring = coords[0] as unknown[][];
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const pt of ring) {
    if (!Array.isArray(pt) || pt.length < 2) continue;
    const lng = Number(pt[0]);
    const lat = Number(pt[1]);
    if (isFinite(lat)) { minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat); }
    if (isFinite(lng)) { minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng); }
  }
  if (!isFinite(minLat)) return { lat: null, lng: null };
  return {
    lat: (minLat + maxLat) / 2,
    lng: (minLng + maxLng) / 2,
  };
}

function centroidFromMultiPolygon(coords: unknown): { lat: number | null; lng: number | null } {
  // Use first polygon's first ring
  if (!Array.isArray(coords) || !Array.isArray(coords[0])) return { lat: null, lng: null };
  return centroidFromPolygon(coords[0]);
}

function centroidFromLineString(coords: unknown): { lat: number | null; lng: number | null } {
  // Use midpoint of the coordinate array
  if (!Array.isArray(coords) || coords.length === 0) return { lat: null, lng: null };
  const mid = coords[Math.floor(coords.length / 2)];
  return centroidFromPoint(mid);
}

function computeCentroid(
  geometry: GeoJsonGeometry | null | undefined,
  properties: Record<string, unknown>,
): { lat: number | null; lng: number | null } {
  // Allow overriding centroid from properties (e.g. INTPTLAT / INTPTLON)
  if (
    typeof properties['centroid_lat'] === 'number' &&
    typeof properties['centroid_lng'] === 'number'
  ) {
    return { lat: properties['centroid_lat'], lng: properties['centroid_lng'] };
  }

  if (!geometry) return { lat: null, lng: null };

  switch (geometry.type) {
    case 'Point':         return centroidFromPoint(geometry.coordinates);
    case 'Polygon':       return centroidFromPolygon(geometry.coordinates);
    case 'MultiPolygon':  return centroidFromMultiPolygon(geometry.coordinates);
    case 'LineString':    return centroidFromLineString(geometry.coordinates);
    case 'MultiLineString': {
      if (!Array.isArray(geometry.coordinates)) return { lat: null, lng: null };
      return centroidFromLineString(geometry.coordinates[0]);
    }
    default:              return { lat: null, lng: null };
  }
}

// ----------------------------------------------------------------
// Geometry type normalizer
// ----------------------------------------------------------------

function normalizeGeometryType(rawType: string | undefined): string {
  switch (rawType?.toLowerCase()) {
    case 'point':             return 'point';
    case 'polygon':           return 'polygon';
    case 'multipolygon':      return 'multipolygon';
    case 'linestring':        return 'linestring';
    case 'multilinestring':   return 'multilinestring';
    default:                  return 'unknown';
  }
}

// ----------------------------------------------------------------
// Main parser
// ----------------------------------------------------------------

/**
 * Parse a GeoJSON FeatureCollection using a caller-supplied ingest profile.
 *
 * @param featureCollection  The raw GeoJSON payload.
 * @param profile            Describes which fields to extract and where to route data.
 * @returns                  One ParsedGeoJsonFeature per GeoJSON feature.
 */
export function parseGeoJsonFeatureCollection(
  featureCollection: GeoJsonFeatureCollection,
  profile: GeojsonIngestProfile,
): ParsedGeoJsonFeature[] {
  return featureCollection.features.map((feature) => {
    const props = feature.properties ?? {};
    const centroid = computeCentroid(feature.geometry ?? null, props);

    // External ID
    const featureExternalId =
      profile.externalIdPropertyName
        ? (props[profile.externalIdPropertyName] != null
            ? String(props[profile.externalIdPropertyName])
            : null)
        : feature.id != null
          ? String(feature.id)
          : null;

    // Name
    const featureName =
      profile.namePropertyName && props[profile.namePropertyName] != null
        ? String(props[profile.namePropertyName])
        : typeof props['name'] === 'string' ? props['name']
        : typeof props['NAME'] === 'string' ? props['NAME']
        : null;

    // Category / subtype
    const featureSubtype =
      profile.categoryPropertyName && props[profile.categoryPropertyName] != null
        ? String(props[profile.categoryPropertyName])
        : null;

    // Numeric metric value
    let metricValueNumeric: number | null = null;
    if (profile.valuePropertyName) {
      const raw = props[profile.valuePropertyName];
      if (raw != null) {
        const n = typeof raw === 'number' ? raw : parseFloat(String(raw));
        metricValueNumeric = isFinite(n) ? n : null;
      }
    }

    // Text classification
    const metricValueText =
      profile.textPropertyName && props[profile.textPropertyName] != null
        ? String(props[profile.textPropertyName])
        : null;

    // Normalized properties (subset mapping)
    let normalizedProperties: Record<string, unknown> | null = null;
    if (profile.normalizedProps) {
      normalizedProperties = {};
      for (const [srcKey, destKey] of Object.entries(profile.normalizedProps)) {
        if (props[srcKey] != null) {
          normalizedProperties[destKey] = props[srcKey];
        }
      }
    }

    return {
      featureExternalId,
      featureName,
      featureSubtype,
      geometryType:  normalizeGeometryType(feature.geometry?.type),
      geometryJson:  feature.geometry ?? null,
      centroidLat:   centroid.lat,
      centroidLng:   centroid.lng,
      metricValueNumeric,
      metricValueText,
      profile,
      rawProperties: props,
      normalizedProperties,
    };
  });
}

// ----------------------------------------------------------------
// Convenience profile factories
// ----------------------------------------------------------------

/** Pre-built profile for FEMA National Flood Hazard Layer. */
export const FEMA_FLOOD_PROFILE: GeojsonIngestProfile = {
  targetTable:        'zone_risk_layers',
  primaryMetricKey:   'flood_zone',
  textPropertyName:   'FLD_ZONE',
  valuePropertyName:  'STATIC_BFE',
  units:              'zone_code',
  externalIdPropertyName: 'OBJECTID',
  normalizedProps: {
    FLD_ZONE:    'flood_zone_code',
    SFHA_TF:     'sfha_flag',
    ZONE_SUBTY:  'zone_subtype',
    STATIC_BFE:  'base_flood_elevation_ft',
  },
  sourceConfidence: 0.95,
};

/** Pre-built profile for NHTSA crash data aggregated by road segment. */
export const NHTSA_CRASH_PROFILE: GeojsonIngestProfile = {
  targetTable:       'zone_risk_layers',
  primaryMetricKey:  'crash_count',
  valuePropertyName: 'FATALS',
  units:             'fatalities',
  externalIdPropertyName: 'ST_CASE',
  namePropertyName:  'CITY_NAME',
  normalizedProps: {
    FATALS:    'fatalities',
    DRUNK_DR:  'drunk_driver_fatalities',
    VE_TOTAL:  'vehicles_involved',
    PERSONS:   'persons_involved',
    YEAR:      'crash_year',
    MONTH:     'crash_month',
  },
  sourceConfidence: 0.9,
};

/** Pre-built profile for FHWA travel-time reliability data. */
export const FHWA_TRAVEL_TIME_PROFILE: GeojsonIngestProfile = {
  targetTable:       'zone_transport_layers',
  primaryMetricKey:  'travel_time_index',
  valuePropertyName: 'TTI',
  units:             'index',
  externalIdPropertyName: 'TMC',
  namePropertyName:  'ROAD_NAME',
  normalizedProps: {
    TTI:       'travel_time_index',
    LOTTR:     'level_of_travel_time_reliability',
    PHED:      'peak_hour_excessive_delay',
    AADT:      'annual_average_daily_traffic',
  },
  sourceConfidence: 0.85,
};

/** Pre-built profile for TIGER ZIP code boundaries. */
export const TIGER_ZIP_PROFILE: GeojsonIngestProfile = {
  targetTable:           'zone_reference_layers',
  externalIdPropertyName: 'GEOID10',
  namePropertyName:      'ZCTA5CE10',
  normalizedProps: {
    GEOID10:   'zip_geoid',
    ZCTA5CE10: 'zip_code',
    ALAND10:   'land_area_sqm',
    AWATER10:  'water_area_sqm',
  },
  sourceConfidence: 0.99,
};

/** Pre-built profile for EV charging station locations (AFDC). */
export const EV_CHARGING_PROFILE: GeojsonIngestProfile = {
  targetTable:           'infrastructure_reference',
  categoryPropertyName:  'ev_connector_types',
  externalIdPropertyName: 'id',
  namePropertyName:      'station_name',
  normalizedProps: {
    station_name:         'name',
    street_address:       'address',
    city:                 'city',
    state:                'state',
    zip:                  'zip',
    ev_level2_evse_num:   'level2_ports',
    ev_dc_fast_num:       'dcfc_ports',
    ev_connector_types:   'connector_types',
    access_code:          'access_code',
  },
  sourceConfidence: 0.9,
};
