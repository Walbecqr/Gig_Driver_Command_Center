import { captureException } from '@/services/crash';
import { isSupabaseConfigured, supabaseClient } from '@/services/supabase/client';

export interface WeatherContextSummary {
  observedAt: string;
  weatherCondition: string | null;
  temperatureF: number | null;
  windSpeedMph: number | null;
  activeAlerts: number;
}

export interface MerchantDensitySummary {
  merchantCount: number;
  avgRating: number | null;
  dominantPlatform: string | null;
  densestZoneId: string | null;
  densestZoneMerchantCount: number;
}

export interface ExternalZoneContextSummary {
  referenceBoundaryCount: number;
  topBoundaryType: string | null;
  demandDriverCount: number;
  topDemandDriverType: string | null;
}

export interface ReferenceContextSummary {
  weather: WeatherContextSummary | null;
  merchantDensity: MerchantDensitySummary | null;
  externalZone: ExternalZoneContextSummary | null;
  source: 'supabase' | 'unavailable';
}

const EMPTY_SUMMARY: ReferenceContextSummary = {
  weather: null,
  merchantDensity: null,
  externalZone: null,
  source: 'unavailable',
};

export async function getReferenceContextSummary(
  zoneIds: string[],
): Promise<ReferenceContextSummary> {
  const cleanZoneIds = Array.from(new Set(zoneIds.filter(Boolean)));
  if (cleanZoneIds.length === 0) return EMPTY_SUMMARY;

  if (!isSupabaseConfigured || !supabaseClient) {
    return EMPTY_SUMMARY;
  }

  const nowIso = new Date().toISOString();

  try {
    const [
      latestWeather,
      activeAlerts,
      merchantRows,
      merchantCountResult,
      boundaryRows,
      demandRows,
    ] = await Promise.all([
      supabaseClient
        .from('external_conditions')
        .select('zone_id, recorded_at, weather_condition, temperature_f, wind_speed_mph')
        .in('zone_id', cleanZoneIds)
        .order('zone_id')
        .order('recorded_at', { ascending: false }),
      supabaseClient
        .from('external_condition_alerts')
        .select('external_condition_alert_id', { count: 'exact', head: true })
        .in('zone_id', cleanZoneIds)
        .or(`expires_ts.is.null,expires_ts.gt.${nowIso}`),
      supabaseClient
        .from('merchant_locations')
        .select('zone_id, platform, rating')
        .in('zone_id', cleanZoneIds)
        .limit(500),
      supabaseClient
        .from('merchant_locations')
        .select('merchant_id', { count: 'exact', head: true })
        .in('zone_id', cleanZoneIds),
      supabaseClient
        .from('zone_reference_layers')
        .select('boundary_type')
        .in('zone_id', cleanZoneIds)
        .limit(500),
      supabaseClient
        .from('zone_demand_drivers')
        .select('driver_type')
        .in('zone_id', cleanZoneIds)
        .limit(500),
    ]);

    if (
      latestWeather.error ||
      activeAlerts.error ||
      merchantRows.error ||
      merchantCountResult.error ||
      boundaryRows.error ||
      demandRows.error
    ) {
      throw (
        latestWeather.error ??
        activeAlerts.error ??
        merchantRows.error ??
        merchantCountResult.error ??
        boundaryRows.error ??
        demandRows.error
      );
    }

    // Deduplicate: keep the most-recent row per zone_id, then take the newest overall.
    const seenZones = new Set<string>();
    const deduplicatedWeather = (latestWeather.data ?? []).filter((row) => {
      if (seenZones.has(row.zone_id)) return false;
      seenZones.add(row.zone_id);
      return true;
    });
    const weatherRow = deduplicatedWeather.sort(
      (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
    )[0];

    const ratings = (merchantRows.data ?? [])
      .map((row) => row.rating)
      .filter((r): r is number => typeof r === 'number');

    const platformCounts = new Map<string, number>();
    const zoneMerchantCounts = new Map<string, number>();

    for (const row of merchantRows.data ?? []) {
      if (row.platform) {
        platformCounts.set(row.platform, (platformCounts.get(row.platform) ?? 0) + 1);
      }
      if (row.zone_id) {
        zoneMerchantCounts.set(row.zone_id, (zoneMerchantCounts.get(row.zone_id) ?? 0) + 1);
      }
    }

    const dominantPlatform =
      [...platformCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const densestZone = [...zoneMerchantCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

    const topBoundaryType = pickTopType(
      boundaryRows.data?.map((x) => x.boundary_type ?? null) ?? [],
    );
    const topDemandDriverType = pickTopType(
      demandRows.data?.map((x) => x.driver_type ?? null) ?? [],
    );

    return {
      source: 'supabase',
      weather: weatherRow
        ? {
            observedAt: weatherRow.recorded_at,
            weatherCondition: weatherRow.weather_condition,
            temperatureF: weatherRow.temperature_f,
            windSpeedMph: weatherRow.wind_speed_mph,
            activeAlerts: activeAlerts.count ?? 0,
          }
        : null,
      merchantDensity: {
        merchantCount: merchantCountResult.count ?? merchantRows.data?.length ?? 0,
        avgRating: ratings.length
          ? roundTo(ratings.reduce((a, b) => a + b, 0) / ratings.length, 2)
          : null,
        dominantPlatform,
        densestZoneId: densestZone?.[0] ?? null,
        densestZoneMerchantCount: densestZone?.[1] ?? 0,
      },
      externalZone: {
        referenceBoundaryCount: boundaryRows.data?.length ?? 0,
        topBoundaryType,
        demandDriverCount: demandRows.data?.length ?? 0,
        topDemandDriverType,
      },
    };
  } catch (error) {
    captureException(error, {
      context: 'market/getReferenceContextSummary',
      zoneCount: cleanZoneIds.length,
    });
    return EMPTY_SUMMARY;
  }
}

function pickTopType(values: Array<string | null>): string | null {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function roundTo(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
