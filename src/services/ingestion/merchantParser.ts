/**
 * Restaurant / merchant location dataset parser (Kaggle).
 *
 * Handles both the Uber Eats restaurant dataset and the DoorDash restaurant
 * dataset — the column aliases cover both schemas. Pass the appropriate
 * `platform` value when calling ingestMerchants() in ./merchants.ts.
 *
 * No external dependencies — delegates to the shared csvUtils tokenizer.
 *
 * --------------------------------------------------------------------------
 * Expected columns (any order, case-insensitive; aliases tried left→right):
 *
 *   name           | restaurant_name | restaurant name | store_name | merchant_name | business_name
 *   lat            | latitude | restaurant_lat | pickup_latitude | lat_lng_lat
 *   lng            | longitude | long | restaurant_long | lon | pickup_longitude
 *   rating         | restaurant_rating | stars | avg_rating | average_rating
 *   price_level    | price_range | price | price level   (accepts "$"–"$$$$" or 1–4)
 *   city           | city_name
 *   state          | province | region | state_code
 *   postal_code    | zip | zip_code
 *   address        | address_line_1 | street_address | location
 *   delivery_fee   | fee | delivery fee          (DoorDash only)
 *   estimated_delivery_time | delivery_time | est_delivery_time | delivery_time_minutes (DoorDash)
 *   cuisine_type   | category | food_type | cuisine | food_category
 * --------------------------------------------------------------------------
 */

import {
  type ParseResult,
  tokenizeCsv,
  buildColMap,
  getCell,
  requireStr,
  parseOptionalFloat,
} from './csvUtils';

export interface MerchantRow {
  name: string;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  /** 1–4 (normalised from "$"–"$$$$" or integer). */
  priceLevel: number | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  addressLine1: string | null;
  /** DoorDash only; null for Uber Eats rows. */
  deliveryFee: number | null;
  /** DoorDash only; null for Uber Eats rows. */
  estimatedDeliveryTimeMinutes: number | null;
  cuisineType: string | null;
}

export function parseMerchants(csvText: string): ParseResult<MerchantRow> {
  const { headers, dataRows } = tokenizeCsv(csvText);
  const colMap = buildColMap(headers);

  const rows: MerchantRow[] = [];
  const errors: ParseResult<MerchantRow>['errors'] = [];

  dataRows.forEach((cells, i) => {
    try {
      const get = (key: string) => getCell(cells, colMap, key);

      const name = requireStr(
        get('name') ??
          get('restaurant_name') ??
          get('restaurant name') ??
          get('store_name') ??
          get('merchant_name') ??
          get('business_name'),
        'name',
      );

      const latitude = parseOptionalFloat(
        get('lat') ??
          get('latitude') ??
          get('restaurant_lat') ??
          get('pickup_latitude') ??
          get('lat_lng_lat'),
      );
      const longitude = parseOptionalFloat(
        get('lng') ??
          get('longitude') ??
          get('long') ??
          get('restaurant_long') ??
          get('lon') ??
          get('pickup_longitude'),
      );

      const ratingRaw =
        get('rating') ??
        get('restaurant_rating') ??
        get('stars') ??
        get('avg_rating') ??
        get('average_rating');
      const rating = parseOptionalFloat(ratingRaw);

      // Accept "$"–"$$$$" notation or a plain integer 1–4
      const priceLevelRaw =
        get('price_level') ?? get('price_range') ?? get('price') ?? get('price level');
      let priceLevel: number | null = null;
      if (priceLevelRaw) {
        if (/^\$+$/.test(priceLevelRaw)) {
          priceLevel = Math.min(priceLevelRaw.length, 4);
        } else {
          priceLevel = parseOptionalFloat(priceLevelRaw);
        }
      }

      const city = get('city') ?? get('city_name') ?? null;
      const state = get('state') ?? get('province') ?? get('region') ?? get('state_code') ?? null;
      const postalCode = get('postal_code') ?? get('zip') ?? get('zip_code') ?? null;
      const addressLine1 =
        get('address') ??
        get('address_line_1') ??
        get('street_address') ??
        get('location') ??
        null;

      const deliveryFee = parseOptionalFloat(
        get('delivery_fee') ?? get('fee') ?? get('delivery fee'),
      );
      const estimatedDeliveryTimeMinutes = parseOptionalFloat(
        get('estimated_delivery_time') ??
          get('delivery_time') ??
          get('est_delivery_time') ??
          get('delivery_time_minutes') ??
          get('estimated delivery time'),
      );

      const cuisineType =
        get('cuisine_type') ??
        get('category') ??
        get('food_type') ??
        get('cuisine') ??
        get('food_category') ??
        null;

      rows.push({
        name,
        latitude,
        longitude,
        rating,
        priceLevel,
        city,
        state,
        postalCode,
        addressLine1,
        deliveryFee,
        estimatedDeliveryTimeMinutes,
        cuisineType,
      });
    } catch (err) {
      errors.push({ rowIndex: i, reason: String(err instanceof Error ? err.message : err) });
    }
  });

  return { rows, errors };
}
