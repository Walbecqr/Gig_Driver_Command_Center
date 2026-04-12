import { describe, it, expect } from 'vitest';

import { parseUberEatsTrips }    from '@/services/ingestion/uberEatsTripsParser';
import { parseUberRides }         from '@/services/ingestion/uberRideParser';
import { parseMerchants }         from '@/services/ingestion/merchantParser';
import { parseDeliveryOrders }    from '@/services/ingestion/deliveryOrdersParser';
import { parseWeatherConditions } from '@/services/ingestion/weatherConditionsParser';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid CSV string from a header row and data rows. */
function csv(header: string, ...dataRows: string[]): string {
  return [header, ...dataRows].join('\n');
}

// ---------------------------------------------------------------------------
// parseUberEatsTrips
// ---------------------------------------------------------------------------

describe('parseUberEatsTrips', () => {
  it('parses a canonical row correctly', () => {
    const input = csv(
      'trip_id,date,start_time,end_time,earnings,tip,distance,duration',
      'T-1,2024-03-15,10:00:00,10:30:00,14.50,3.00,4.2,30',
    );
    const { rows, errors } = parseUberEatsTrips(input);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.platformTripId).toBe('T-1');
    expect(row.dateLocal).toBe('2024-03-15');
    expect(row.grossAmount).toBe(14.5);
    expect(row.tipAmount).toBe(3.0);
    expect(row.distanceMiles).toBe(4.2);
    expect(row.durationMinutes).toBe(30);
  });

  it('resolves "order_id", "total with tip", "customer tips", "distance (mi)" aliases', () => {
    const input = csv(
      'order_id,order_date,total with tip,customer tips,distance (mi),duration (min)',
      'ORD-1,3/20/2024,18.00,4.00,5.1,45',
    );
    const { rows, errors } = parseUberEatsTrips(input);
    expect(errors).toHaveLength(0);
    expect(rows[0]?.platformTripId).toBe('ORD-1');
    expect(rows[0]?.grossAmount).toBe(18.0);
    expect(rows[0]?.tipAmount).toBe(4.0);
    expect(rows[0]?.distanceMiles).toBe(5.1);
  });

  it('converts slash date M/D/YYYY to ISO YYYY-MM-DD', () => {
    const input = csv(
      'date,earnings,tip,distance',
      '3/5/2024,10.00,2.00,3.0',
    );
    const { rows } = parseUberEatsTrips(input);
    expect(rows[0]?.dateLocal).toBe('2024-03-05');
  });

  it('sets platformTripId to null when no id column is present', () => {
    const input = csv(
      'date,earnings,tip,distance',
      '2024-06-01,10.00,0,2.0',
    );
    const { rows } = parseUberEatsTrips(input);
    expect(rows[0]?.platformTripId).toBeNull();
  });

  it('records a parse error for a row missing the required date', () => {
    const input = csv(
      'trip_id,earnings,tip,distance',
      'T-1,10.00,2.00,3.0',
    );
    const { rows, errors } = parseUberEatsTrips(input);
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.rowIndex).toBe(0);
  });

  it('returns empty rows and no errors for an empty CSV', () => {
    const { rows, errors } = parseUberEatsTrips('');
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });

  it('skips blank lines between data rows', () => {
    const input = 'trip_id,date,earnings,tip,distance\nT-1,2024-01-01,10,1,2\n\nT-2,2024-01-02,12,2,3\n';
    const { rows, errors } = parseUberEatsTrips(input);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// parseUberRides
// ---------------------------------------------------------------------------

describe('parseUberRides', () => {
  it('parses a completed ride correctly', () => {
    const input = csv(
      'trip_id,date,booking_status,distance,revenue,surge_multiplier,duration_minutes',
      'R-1,2024-04-10,Trip Completed,8.5,22.00,1.5,25',
    );
    const { rows, errors } = parseUberRides(input);
    expect(errors).toHaveLength(0);
    expect(rows[0]?.tripStatus).toBe('completed');
    expect(rows[0]?.distanceMiles).toBe(8.5);
    expect(rows[0]?.grossAmount).toBe(22.0);
    expect(rows[0]?.surgeMultiplier).toBe(1.5);
    expect(rows[0]?.durationMinutes).toBe(25);
  });

  it('maps "Trip Cancelled" → "cancelled"', () => {
    const input = csv(
      'trip_id,date,booking_status,distance,revenue',
      'R-2,2024-04-10,Trip Cancelled,0,0',
    );
    const { rows } = parseUberRides(input);
    expect(rows[0]?.tripStatus).toBe('cancelled');
  });

  it('maps "Trip Rejected" → "cancelled"', () => {
    const input = csv(
      'trip_id,date,booking_status,distance,revenue',
      'R-3,2024-04-11,Trip Rejected,0,0',
    );
    const { rows } = parseUberRides(input);
    expect(rows[0]?.tripStatus).toBe('cancelled');
  });

  it('cancellation_flag=1 overrides a "Completed" status', () => {
    const input = csv(
      'trip_id,date,booking_status,distance,revenue,cancellation_flag',
      'R-4,2024-05-01,Trip Completed,3.0,10.00,1',
    );
    const { rows } = parseUberRides(input);
    expect(rows[0]?.tripStatus).toBe('cancelled');
  });

  it('unknown booking_status resolves to "unknown"', () => {
    const input = csv(
      'trip_id,date,booking_status,distance,revenue',
      'R-5,2024-05-02,pending,5.0,15.00',
    );
    const { rows } = parseUberRides(input);
    expect(rows[0]?.tripStatus).toBe('unknown');
  });

  it('resolves "fare", "ride_id", "ride_date" aliases', () => {
    const input = csv(
      'ride_id,ride_date,status,distance,fare',
      'R-6,2024-06-01,Trip Completed,6.0,18.00',
    );
    const { rows, errors } = parseUberRides(input);
    expect(errors).toHaveLength(0);
    expect(rows[0]?.platformTripId).toBe('R-6');
    expect(rows[0]?.grossAmount).toBe(18.0);
  });

  it('sets cancellationPay when column present', () => {
    const input = csv(
      'trip_id,date,booking_status,distance,revenue,cancellation_fee',
      'R-7,2024-07-01,Trip Cancelled,0,0,5.00',
    );
    const { rows } = parseUberRides(input);
    expect(rows[0]?.cancellationPay).toBe(5.0);
  });
});

// ---------------------------------------------------------------------------
// parseMerchants
// ---------------------------------------------------------------------------

describe('parseMerchants', () => {
  it('parses Uber Eats-style columns correctly', () => {
    const input = csv(
      'restaurant name,latitude,longitude,rating,price level,city,state,cuisine_type',
      'Shake Shack,40.758,-73.9855,4.2,$$,New York,NY,American',
    );
    const { rows, errors } = parseMerchants(input);
    expect(errors).toHaveLength(0);
    expect(rows[0]?.name).toBe('Shake Shack');
    expect(rows[0]?.latitude).toBe(40.758);
    expect(rows[0]?.rating).toBe(4.2);
    expect(rows[0]?.priceLevel).toBe(2);
    expect(rows[0]?.city).toBe('New York');
    expect(rows[0]?.cuisineType).toBe('American');
  });

  it('parses DoorDash-style columns with delivery_fee and est. delivery time', () => {
    const input = csv(
      'name,lat,lng,rating,price_level,city,state,delivery_fee,estimated_delivery_time',
      "McDonald's,34.0522,-118.2437,3.8,1,Los Angeles,CA,2.99,25",
    );
    const { rows, errors } = parseMerchants(input);
    expect(errors).toHaveLength(0);
    expect(rows[0]?.deliveryFee).toBe(2.99);
    expect(rows[0]?.estimatedDeliveryTimeMinutes).toBe(25);
  });

  it('normalises "$" → 1, "$$" → 2, "$$$" → 3, "$$$$" → 4', () => {
    const levels = ['$', '$$', '$$$', '$$$$'];
    for (const [idx, sym] of levels.entries()) {
      const input = csv('name,lat,lng,price_level', `Place,0,0,${sym}`);
      const { rows } = parseMerchants(input);
      expect(rows[0]?.priceLevel).toBe(idx + 1);
    }
  });

  it('accepts integer price_level 1–4 directly', () => {
    const input = csv('name,lat,lng,price_level', 'Place,0,0,3');
    const { rows } = parseMerchants(input);
    expect(rows[0]?.priceLevel).toBe(3);
  });

  it('records error for row with missing name', () => {
    const input = csv('latitude,longitude,rating', '40.0,-74.0,4.0');
    const { rows, errors } = parseMerchants(input);
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });

  it('parses row with no coordinates (both null)', () => {
    const input = csv('name,city,state', 'Ghost Kitchen,Austin,TX');
    const { rows, errors } = parseMerchants(input);
    expect(errors).toHaveLength(0);
    expect(rows[0]?.latitude).toBeNull();
    expect(rows[0]?.longitude).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseDeliveryOrders
// ---------------------------------------------------------------------------

describe('parseDeliveryOrders', () => {
  it('parses a full simulation row', () => {
    const input = csv(
      'order_id,date,order_value,delivery_time,distance,pickup_lat,pickup_lng,dropoff_lat,dropoff_lng',
      'SIM-001,2024-01-10,28.50,35,4.8,40.758,-73.9855,40.748,-73.997',
    );
    const { rows, errors } = parseDeliveryOrders(input);
    expect(errors).toHaveLength(0);
    expect(rows[0]?.orderId).toBe('SIM-001');
    expect(rows[0]?.grossAmount).toBe(28.5);
    expect(rows[0]?.durationMinutes).toBe(35);
    expect(rows[0]?.distanceMiles).toBe(4.8);
    expect(rows[0]?.pickupLat).toBe(40.758);
    expect(rows[0]?.dropoffLng).toBe(-73.997);
  });

  it('resolves alias columns: order_total, duration_minutes, origin_lat', () => {
    const input = csv(
      'delivery_id,order_date,order_total,duration_minutes,distance_miles,origin_lat,origin_lng,destination_lat,destination_lng',
      'D-1,2024-02-15,19.99,28,3.5,41.0,-87.0,41.1,-87.1',
    );
    const { rows, errors } = parseDeliveryOrders(input);
    expect(errors).toHaveLength(0);
    expect(rows[0]?.grossAmount).toBe(19.99);
    expect(rows[0]?.pickupLat).toBe(41.0);
  });

  it('handles missing coordinates gracefully (all null)', () => {
    const input = csv('order_id,date,order_value', 'S-1,2024-03-01,10.00');
    const { rows, errors } = parseDeliveryOrders(input);
    expect(errors).toHaveLength(0);
    expect(rows[0]?.pickupLat).toBeNull();
    expect(rows[0]?.dropoffLat).toBeNull();
    expect(rows[0]?.durationMinutes).toBeNull();
  });

  it('records a parse error for a row with an unparseable date', () => {
    const input = csv('order_id,date,order_value', 'S-1,not-a-date,10.00');
    const { rows, errors } = parseDeliveryOrders(input);
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });

  it('strips currency symbols from order_value', () => {
    const input = csv('order_id,date,order_value', 'S-1,2024-04-01,$22.50');
    const { rows } = parseDeliveryOrders(input);
    expect(rows[0]?.grossAmount).toBe(22.5);
  });
});

// ---------------------------------------------------------------------------
// parseWeatherConditions
// ---------------------------------------------------------------------------

describe('parseWeatherConditions', () => {
  it('parses a full weather row', () => {
    const input = csv(
      'timestamp,lat,lng,temp,weather,humidity,wind_speed,visibility,surge_multiplier',
      '2024-01-15T08:00:00,40.758,-73.9855,28.5,Snow,85,15.2,2.0,2.1',
    );
    const { rows, errors } = parseWeatherConditions(input);
    expect(errors).toHaveLength(0);
    expect(rows[0]?.recordedAt).toBe('2024-01-15T08:00:00');
    expect(rows[0]?.temperatureF).toBe(28.5);
    expect(rows[0]?.weatherCondition).toBe('Snow');
    expect(rows[0]?.humidityPct).toBe(85);
    expect(rows[0]?.windSpeedMph).toBe(15.2);
    expect(rows[0]?.visibilityMiles).toBe(2.0);
    expect(rows[0]?.surgeMultiplier).toBe(2.1);
    expect(rows[0]?.latitude).toBe(40.758);
  });

  it('resolves alias columns: datetime, latitude, temperature_f, weather_main, surge_factor', () => {
    const input = csv(
      'datetime,latitude,longitude,temperature_f,weather_main,surge_factor',
      '2024-06-01T12:00:00,34.0522,-118.2437,88.0,Clear,1.3',
    );
    const { rows, errors } = parseWeatherConditions(input);
    expect(errors).toHaveLength(0);
    expect(rows[0]?.temperatureF).toBe(88.0);
    expect(rows[0]?.weatherCondition).toBe('Clear');
    expect(rows[0]?.surgeMultiplier).toBe(1.3);
  });

  it('date-only value gets midnight fallback', () => {
    const input = csv('date,lat,lng,temperature,weather', '2024-06-01,34.0,-118.0,72.0,Sunny');
    const { rows } = parseWeatherConditions(input);
    expect(rows[0]?.recordedAt).toBe('2024-06-01T00:00:00');
  });

  it('records a parse error when no timestamp column exists', () => {
    const input = csv('temperature,weather,surge', '72.0,Clear,1.0');
    const { rows, errors } = parseWeatherConditions(input);
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });

  it('allows null lat/lng (location-agnostic weather records)', () => {
    const input = csv('timestamp,temperature,weather', '2024-07-04T14:00:00,95.0,Hot');
    const { rows, errors } = parseWeatherConditions(input);
    expect(errors).toHaveLength(0);
    expect(rows[0]?.latitude).toBeNull();
    expect(rows[0]?.longitude).toBeNull();
  });

  it('allows null surgeMultiplier when column is absent', () => {
    const input = csv(
      'timestamp,lat,lng,temperature,weather',
      '2024-08-01T06:00:00,40.0,-74.0,65.0,Cloudy',
    );
    const { rows } = parseWeatherConditions(input);
    expect(rows[0]?.surgeMultiplier).toBeNull();
  });
});
