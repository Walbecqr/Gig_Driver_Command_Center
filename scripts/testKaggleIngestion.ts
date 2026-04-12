/**
 * Kaggle ingestion parser smoke-test.
 *
 * Run with:
 *   npx tsx scripts/testKaggleIngestion.ts
 *
 * Verifies all five new parsers against inline sample CSV strings that mimic
 * the actual Kaggle dataset column names. No live database connection needed —
 * this only exercises the parse layer, not the Supabase insert layer.
 *
 * A non-zero exit code means at least one parser produced unexpected errors.
 */

import { parseUberEatsTrips }      from '../src/services/ingestion/uberEatsTripsParser';
import { parseUberRides }           from '../src/services/ingestion/uberRideParser';
import { parseMerchants }           from '../src/services/ingestion/merchantParser';
import { parseDeliveryOrders }      from '../src/services/ingestion/deliveryOrdersParser';
import { parseWeatherConditions }   from '../src/services/ingestion/weatherConditionsParser';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let totalFailed = 0;

function section(title: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

function check(label: string, passed: boolean, detail?: string) {
  const icon = passed ? '✓' : '✗';
  console.log(`  ${icon} ${label}${detail ? `  →  ${detail}` : ''}`);
  if (!passed) totalFailed++;
}

// ---------------------------------------------------------------------------
// 1. Uber Eats Driver trips
// ---------------------------------------------------------------------------

section('1. Uber Eats Driver Dataset — trip-level');

const uberEatsCsv = `trip_id,date,start_time,end_time,earnings,tip,distance,duration
TRP-001,2024-03-15,10:00:00,10:32:00,14.50,3.00,4.2,32
TRP-002,2024-03-15,11:45:00,12:15:00,9.75,1.50,2.8,30
TRP-003,2024-03-16,09:00:00,09:28:00,11.25,2.00,3.1,28
`;

const ueResult = parseUberEatsTrips(uberEatsCsv);
check('Parses 3 rows without errors', ueResult.rows.length === 3 && ueResult.errors.length === 0,
  `rows=${ueResult.rows.length} errors=${ueResult.errors.length}`);
check('platformTripId extracted', ueResult.rows[0]?.platformTripId === 'TRP-001',
  String(ueResult.rows[0]?.platformTripId));
check('grossAmount parsed correctly', ueResult.rows[0]?.grossAmount === 14.50,
  String(ueResult.rows[0]?.grossAmount));
check('tipAmount parsed correctly', ueResult.rows[0]?.tipAmount === 3.00,
  String(ueResult.rows[0]?.tipAmount));
check('distanceMiles parsed', ueResult.rows[0]?.distanceMiles === 4.2,
  String(ueResult.rows[0]?.distanceMiles));
check('dateLocal is ISO YYYY-MM-DD', ueResult.rows[0]?.dateLocal === '2024-03-15',
  String(ueResult.rows[0]?.dateLocal));

// Test alias columns (Kaggle alternate header names)
const ueAliasCsv = `order_id,order_date,total with tip,customer tips,distance (mi),duration (min)
ORD-1,3/20/2024,18.00,4.00,5.1,45
`;
const ueAliasResult = parseUberEatsTrips(ueAliasCsv);
check('Alias columns resolve (order_id, order_date, total with tip, distance (mi))',
  ueAliasResult.rows.length === 1 && ueAliasResult.errors.length === 0,
  `rows=${ueAliasResult.rows.length}`);
check('Slash date "3/20/2024" → ISO', ueAliasResult.rows[0]?.dateLocal === '2024-03-20',
  String(ueAliasResult.rows[0]?.dateLocal));

// ---------------------------------------------------------------------------
// 2. Uber Ride Analytics
// ---------------------------------------------------------------------------

section('2. Uber Ride Analytics Dataset — rideshare trips');

const uberRideCsv = `trip_id,date,booking_status,distance,revenue,surge_multiplier,duration_minutes
RIDE-001,2024-04-10,Trip Completed,8.5,22.00,1.5,25
RIDE-002,2024-04-10,Trip Cancelled,0,0,1.0,0
RIDE-003,2024-04-11,Trip Completed,12.3,31.50,1.0,38
`;

const urResult = parseUberRides(uberRideCsv);
check('Parses 3 rows without errors', urResult.rows.length === 3 && urResult.errors.length === 0,
  `rows=${urResult.rows.length} errors=${urResult.errors.length}`);
check('Status "Trip Completed" → "completed"', urResult.rows[0]?.tripStatus === 'completed',
  String(urResult.rows[0]?.tripStatus));
check('Status "Trip Cancelled" → "cancelled"', urResult.rows[1]?.tripStatus === 'cancelled',
  String(urResult.rows[1]?.tripStatus));
check('surgeMultiplier parsed', urResult.rows[0]?.surgeMultiplier === 1.5,
  String(urResult.rows[0]?.surgeMultiplier));
check('distanceMiles correct', urResult.rows[0]?.distanceMiles === 8.5,
  String(urResult.rows[0]?.distanceMiles));

// Test explicit cancellation_flag override
const cancelFlagCsv = `trip_id,date,booking_status,distance,revenue,cancellation_flag
R-1,2024-05-01,Trip Completed,3.0,10.00,1
`;
const cfResult = parseUberRides(cancelFlagCsv);
check('cancellation_flag=1 overrides "Completed" → "cancelled"',
  cfResult.rows[0]?.tripStatus === 'cancelled', String(cfResult.rows[0]?.tripStatus));

// ---------------------------------------------------------------------------
// 3. Restaurant / merchant locations
// ---------------------------------------------------------------------------

section('3. Restaurant Dataset — Uber Eats + DoorDash merchants');

const merchantCsv = `restaurant name,latitude,longitude,rating,price level,city,state,cuisine_type
Shake Shack,40.7580,-73.9855,4.2,$$,New York,NY,American
Nobu,40.7614,-73.9776,4.7,$$$$,New York,NY,Japanese
Joe's Pizza,40.7300,-74.0020,4.5,$,New York,NY,Pizza
`;

const mResult = parseMerchants(merchantCsv);
check('Parses 3 merchants without errors', mResult.rows.length === 3 && mResult.errors.length === 0,
  `rows=${mResult.rows.length} errors=${mResult.errors.length}`);
check('name extracted', mResult.rows[0]?.name === 'Shake Shack',
  String(mResult.rows[0]?.name));
check('latitude parsed', mResult.rows[0]?.latitude === 40.7580,
  String(mResult.rows[0]?.latitude));
check('"$$" → priceLevel 2', mResult.rows[0]?.priceLevel === 2,
  String(mResult.rows[0]?.priceLevel));
check('"$$$$" → priceLevel 4', mResult.rows[1]?.priceLevel === 4,
  String(mResult.rows[1]?.priceLevel));
check('"$" → priceLevel 1', mResult.rows[2]?.priceLevel === 1,
  String(mResult.rows[2]?.priceLevel));
check('cuisineType extracted', mResult.rows[2]?.cuisineType === 'Pizza',
  String(mResult.rows[2]?.cuisineType));

// DoorDash-specific columns
const ddMerchantCsv = `name,lat,lng,rating,price_level,city,state,delivery_fee,estimated_delivery_time
McDonald's,34.0522,-118.2437,3.8,1,Los Angeles,CA,2.99,25
Chipotle,34.0610,-118.2530,4.1,2,Los Angeles,CA,1.99,20
`;
const ddmResult = parseMerchants(ddMerchantCsv);
check('DoorDash columns: delivery_fee + estimated_delivery_time parsed',
  ddmResult.rows[0]?.deliveryFee === 2.99 && ddmResult.rows[0]?.estimatedDeliveryTimeMinutes === 25,
  `fee=${ddmResult.rows[0]?.deliveryFee} time=${ddmResult.rows[0]?.estimatedDeliveryTimeMinutes}`);

// ---------------------------------------------------------------------------
// 4. Delivery Orders simulation dataset
// ---------------------------------------------------------------------------

section('4. Delivery Orders Simulation Dataset');

const deliveryCsv = `order_id,date,order_value,delivery_time,distance,pickup_lat,pickup_lng,dropoff_lat,dropoff_lng
SIM-001,2024-01-10,28.50,35,4.8,40.7580,-73.9855,40.7484,-73.9967
SIM-002,2024-01-10,15.75,22,2.1,40.7614,-73.9776,40.7560,-73.9820
SIM-003,2024-01-11,42.00,55,7.3,40.7300,-74.0020,40.7450,-73.9950
`;

const doResult = parseDeliveryOrders(deliveryCsv);
check('Parses 3 rows without errors', doResult.rows.length === 3 && doResult.errors.length === 0,
  `rows=${doResult.rows.length} errors=${doResult.errors.length}`);
check('orderId extracted', doResult.rows[0]?.orderId === 'SIM-001',
  String(doResult.rows[0]?.orderId));
check('grossAmount correct', doResult.rows[0]?.grossAmount === 28.50,
  String(doResult.rows[0]?.grossAmount));
check('durationMinutes correct', doResult.rows[0]?.durationMinutes === 35,
  String(doResult.rows[0]?.durationMinutes));
check('pickupLat parsed', doResult.rows[0]?.pickupLat === 40.7580,
  String(doResult.rows[0]?.pickupLat));
check('dropoffLng parsed', doResult.rows[0]?.dropoffLng === -73.9967,
  String(doResult.rows[0]?.dropoffLng));

// Missing lat/lng — should still parse, just null coords
const simNoCoordscsv = `order_id,order_date,order_total,duration_minutes
S-001,2024-02-01,12.00,18
`;
const snResult = parseDeliveryOrders(simNoCoordscsv);
check('Parses row with no coordinates gracefully',
  snResult.rows.length === 1 && snResult.rows[0]?.pickupLat === null,
  `rows=${snResult.rows.length} pickupLat=${snResult.rows[0]?.pickupLat}`);

// ---------------------------------------------------------------------------
// 5. Uber/Lyft + Weather (external conditions)
// ---------------------------------------------------------------------------

section('5. Uber / Lyft + Weather Dataset — external conditions');

const weatherCsv = `timestamp,lat,lng,temp,weather,humidity,wind_speed,visibility,surge_multiplier
2024-01-15T08:00:00,40.7580,-73.9855,28.5,Snow,85,15.2,2.0,2.1
2024-01-15T09:00:00,40.7580,-73.9855,30.1,Overcast,78,10.5,5.0,1.5
2024-01-15T10:00:00,40.7580,-73.9855,32.0,Clear,65,8.0,10.0,1.0
`;

const wcResult = parseWeatherConditions(weatherCsv);
check('Parses 3 rows without errors', wcResult.rows.length === 3 && wcResult.errors.length === 0,
  `rows=${wcResult.rows.length} errors=${wcResult.errors.length}`);
check('recordedAt preserves full ISO timestamp',
  wcResult.rows[0]?.recordedAt === '2024-01-15T08:00:00',
  String(wcResult.rows[0]?.recordedAt));
check('temperatureF parsed', wcResult.rows[0]?.temperatureF === 28.5,
  String(wcResult.rows[0]?.temperatureF));
check('weatherCondition extracted', wcResult.rows[0]?.weatherCondition === 'Snow',
  String(wcResult.rows[0]?.weatherCondition));
check('surgeMultiplier parsed', wcResult.rows[0]?.surgeMultiplier === 2.1,
  String(wcResult.rows[0]?.surgeMultiplier));
check('humidityPct parsed', wcResult.rows[0]?.humidityPct === 85,
  String(wcResult.rows[0]?.humidityPct));

// Date-only timestamp → midnight fallback
const wcDateOnlyCsv = `date,lat,lng,temperature,weather_main,surge
2024-06-01,34.0522,-118.2437,72.0,Sunny,1.2
`;
const wdResult = parseWeatherConditions(wcDateOnlyCsv);
check('Date-only "2024-06-01" → "2024-06-01T00:00:00"',
  wdResult.rows[0]?.recordedAt === '2024-06-01T00:00:00',
  String(wdResult.rows[0]?.recordedAt));
check('Alias "weather_main" resolves', wdResult.rows[0]?.weatherCondition === 'Sunny',
  String(wdResult.rows[0]?.weatherCondition));

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n' + '='.repeat(60));
if (totalFailed === 0) {
  console.log('  All checks passed.');
} else {
  console.error(`  ${totalFailed} check(s) FAILED.`);
}
console.log('='.repeat(60) + '\n');

if (totalFailed > 0) process.exit(1);
