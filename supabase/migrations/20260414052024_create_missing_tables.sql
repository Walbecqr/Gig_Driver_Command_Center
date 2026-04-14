drop view if exists "public"."v_trip_import_review";

alter type "public"."platform_enum" rename to "platform_enum__old_version_to_be_dropped";

create type "public"."platform_enum" as enum ('uber_driver', 'uber_eats', 'doordash', 'grubhub', 'unknown', 'synthetic');

alter type "public"."source_type_enum" rename to "source_type_enum__old_version_to_be_dropped";

create type "public"."source_type_enum" as enum ('weekly_statement_csv', 'personal_data_export', 'manual_csv', 'manual_entry', 'app_gps', 'derived', 'other', 'kaggle_csv', 'simulation');


  create table "public"."external_conditions" (
    "condition_id" uuid not null default gen_random_uuid(),
    "recorded_at" timestamp with time zone not null,
    "latitude" numeric(9,6),
    "longitude" numeric(9,6),
    "zone_id" text,
    "weather_condition" text,
    "temperature_f" numeric(6,2),
    "humidity_pct" numeric(5,2),
    "wind_speed_mph" numeric(6,2),
    "visibility_miles" numeric(6,2),
    "surge_multiplier" numeric(6,3),
    "source_type" text not null default 'kaggle_csv'::text,
    "import_batch_id" uuid,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."external_conditions" enable row level security;


  create table "public"."merchant_locations" (
    "merchant_id" uuid not null default gen_random_uuid(),
    "platform" public.platform_enum not null,
    "name" text not null,
    "latitude" numeric(9,6),
    "longitude" numeric(9,6),
    "zone_id" text,
    "address_line_1" text,
    "city" text,
    "state" text,
    "postal_code" text,
    "rating" numeric(3,2),
    "price_level" integer,
    "delivery_fee" numeric(10,2),
    "estimated_delivery_time_minutes" integer,
    "cuisine_type" text,
    "source_type" text not null default 'kaggle_csv'::text,
    "import_batch_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."merchant_locations" enable row level security;

alter table "public"."import_batches" alter column source_platform type "public"."platform_enum" using source_platform::text::"public"."platform_enum";

alter table "public"."import_batches" alter column source_type type "public"."source_type_enum" using source_type::text::"public"."source_type_enum";

alter table "public"."platform_accounts" alter column platform type "public"."platform_enum" using platform::text::"public"."platform_enum";

alter table "public"."shift_source_links" alter column source_type type "public"."source_type_enum" using source_type::text::"public"."source_type_enum";

alter table "public"."trip_source_links" alter column source_type type "public"."source_type_enum" using source_type::text::"public"."source_type_enum";

alter table "public"."trips" alter column platform type "public"."platform_enum" using platform::text::"public"."platform_enum";

drop type "public"."platform_enum__old_version_to_be_dropped";

drop type "public"."source_type_enum__old_version_to_be_dropped";

CREATE UNIQUE INDEX external_conditions_pkey ON public.external_conditions USING btree (condition_id);

CREATE INDEX idx_external_conditions_recorded_at ON public.external_conditions USING btree (recorded_at DESC);

CREATE INDEX idx_external_conditions_zone_id ON public.external_conditions USING btree (zone_id) WHERE (zone_id IS NOT NULL);

CREATE INDEX idx_external_conditions_zone_time ON public.external_conditions USING btree (zone_id, recorded_at DESC) WHERE (zone_id IS NOT NULL);

CREATE INDEX idx_merchant_locations_city_state ON public.merchant_locations USING btree (city, state) WHERE (city IS NOT NULL);

CREATE INDEX idx_merchant_locations_platform ON public.merchant_locations USING btree (platform);

CREATE UNIQUE INDEX idx_merchant_locations_platform_name_coords ON public.merchant_locations USING btree (platform, name, latitude, longitude) WHERE ((latitude IS NOT NULL) AND (longitude IS NOT NULL));

CREATE INDEX idx_merchant_locations_zone_id ON public.merchant_locations USING btree (zone_id) WHERE (zone_id IS NOT NULL);

CREATE UNIQUE INDEX merchant_locations_pkey ON public.merchant_locations USING btree (merchant_id);

alter table "public"."external_conditions" add constraint "external_conditions_pkey" PRIMARY KEY using index "external_conditions_pkey";

alter table "public"."merchant_locations" add constraint "merchant_locations_pkey" PRIMARY KEY using index "merchant_locations_pkey";

alter table "public"."external_conditions" add constraint "external_conditions_humidity_range" CHECK (((humidity_pct IS NULL) OR ((humidity_pct >= (0)::numeric) AND (humidity_pct <= (100)::numeric)))) not valid;

alter table "public"."external_conditions" validate constraint "external_conditions_humidity_range";

alter table "public"."external_conditions" add constraint "external_conditions_import_batch_id_fkey" FOREIGN KEY (import_batch_id) REFERENCES public.import_batches(import_batch_id) ON DELETE SET NULL not valid;

alter table "public"."external_conditions" validate constraint "external_conditions_import_batch_id_fkey";

alter table "public"."external_conditions" add constraint "external_conditions_latitude_range" CHECK (((latitude IS NULL) OR ((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric)))) not valid;

alter table "public"."external_conditions" validate constraint "external_conditions_latitude_range";

alter table "public"."external_conditions" add constraint "external_conditions_longitude_range" CHECK (((longitude IS NULL) OR ((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric)))) not valid;

alter table "public"."external_conditions" validate constraint "external_conditions_longitude_range";

alter table "public"."external_conditions" add constraint "external_conditions_surge_nonneg" CHECK (((surge_multiplier IS NULL) OR (surge_multiplier >= (0)::numeric))) not valid;

alter table "public"."external_conditions" validate constraint "external_conditions_surge_nonneg";

alter table "public"."merchant_locations" add constraint "merchant_locations_delivery_fee_nonneg" CHECK (((delivery_fee IS NULL) OR (delivery_fee >= (0)::numeric))) not valid;

alter table "public"."merchant_locations" validate constraint "merchant_locations_delivery_fee_nonneg";

alter table "public"."merchant_locations" add constraint "merchant_locations_delivery_time_nonneg" CHECK (((estimated_delivery_time_minutes IS NULL) OR (estimated_delivery_time_minutes >= 0))) not valid;

alter table "public"."merchant_locations" validate constraint "merchant_locations_delivery_time_nonneg";

alter table "public"."merchant_locations" add constraint "merchant_locations_import_batch_id_fkey" FOREIGN KEY (import_batch_id) REFERENCES public.import_batches(import_batch_id) ON DELETE SET NULL not valid;

alter table "public"."merchant_locations" validate constraint "merchant_locations_import_batch_id_fkey";

alter table "public"."merchant_locations" add constraint "merchant_locations_latitude_range" CHECK (((latitude IS NULL) OR ((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric)))) not valid;

alter table "public"."merchant_locations" validate constraint "merchant_locations_latitude_range";

alter table "public"."merchant_locations" add constraint "merchant_locations_longitude_range" CHECK (((longitude IS NULL) OR ((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric)))) not valid;

alter table "public"."merchant_locations" validate constraint "merchant_locations_longitude_range";

alter table "public"."merchant_locations" add constraint "merchant_locations_name_not_blank" CHECK ((length(TRIM(BOTH FROM name)) > 0)) not valid;

alter table "public"."merchant_locations" validate constraint "merchant_locations_name_not_blank";

alter table "public"."merchant_locations" add constraint "merchant_locations_price_level_range" CHECK (((price_level IS NULL) OR ((price_level >= 1) AND (price_level <= 4)))) not valid;

alter table "public"."merchant_locations" validate constraint "merchant_locations_price_level_range";

alter table "public"."merchant_locations" add constraint "merchant_locations_rating_range" CHECK (((rating IS NULL) OR ((rating >= (0)::numeric) AND (rating <= (5)::numeric)))) not valid;

alter table "public"."merchant_locations" validate constraint "merchant_locations_rating_range";

create or replace view "public"."v_trip_import_review" as  SELECT t.trip_id,
    t.user_id,
    t.platform_account_id,
    t.shift_id,
    t.platform,
    t.service_type,
    t.platform_trip_id,
    t.platform_order_id,
    t.trip_status,
    t.trip_date_local,
    t.trip_start_ts_local,
    t.trip_end_ts_local,
    t.trip_timezone,
    t.completion_confidence,
    t.pickup_zone_id,
    t.dropoff_zone_id,
    tf.currency_code,
    tf.gross_amount,
    tf.net_payout,
    tf.base_fare,
    tf.tip_amount,
    tf.bonus_amount,
    tf.surge_amount,
    tf.wait_time_pay,
    tf.cancellation_pay,
    tf.adjustment_amt,
    tf.fee_amount,
    tf.payout_conf,
    tf.fin_source_type,
    tm.distance_miles,
    tm.duration_minutes,
    tm.active_minutes,
    tm.pickup_to_drop_minutes,
    tm.distance_source,
    tm.duration_source,
    tm.metric_confidence,
    t.created_at,
    t.updated_at
   FROM ((public.trips t
     LEFT JOIN public.trip_financials tf ON ((tf.trip_id = t.trip_id)))
     LEFT JOIN public.trip_metrics tm ON ((tm.trip_id = t.trip_id)));


grant delete on table "public"."external_conditions" to "anon";

grant insert on table "public"."external_conditions" to "anon";

grant references on table "public"."external_conditions" to "anon";

grant select on table "public"."external_conditions" to "anon";

grant trigger on table "public"."external_conditions" to "anon";

grant truncate on table "public"."external_conditions" to "anon";

grant update on table "public"."external_conditions" to "anon";

grant delete on table "public"."external_conditions" to "authenticated";

grant insert on table "public"."external_conditions" to "authenticated";

grant references on table "public"."external_conditions" to "authenticated";

grant select on table "public"."external_conditions" to "authenticated";

grant trigger on table "public"."external_conditions" to "authenticated";

grant truncate on table "public"."external_conditions" to "authenticated";

grant update on table "public"."external_conditions" to "authenticated";

grant delete on table "public"."external_conditions" to "service_role";

grant insert on table "public"."external_conditions" to "service_role";

grant references on table "public"."external_conditions" to "service_role";

grant select on table "public"."external_conditions" to "service_role";

grant trigger on table "public"."external_conditions" to "service_role";

grant truncate on table "public"."external_conditions" to "service_role";

grant update on table "public"."external_conditions" to "service_role";

grant delete on table "public"."merchant_locations" to "anon";

grant insert on table "public"."merchant_locations" to "anon";

grant references on table "public"."merchant_locations" to "anon";

grant select on table "public"."merchant_locations" to "anon";

grant trigger on table "public"."merchant_locations" to "anon";

grant truncate on table "public"."merchant_locations" to "anon";

grant update on table "public"."merchant_locations" to "anon";

grant delete on table "public"."merchant_locations" to "authenticated";

grant insert on table "public"."merchant_locations" to "authenticated";

grant references on table "public"."merchant_locations" to "authenticated";

grant select on table "public"."merchant_locations" to "authenticated";

grant trigger on table "public"."merchant_locations" to "authenticated";

grant truncate on table "public"."merchant_locations" to "authenticated";

grant update on table "public"."merchant_locations" to "authenticated";

grant delete on table "public"."merchant_locations" to "service_role";

grant insert on table "public"."merchant_locations" to "service_role";

grant references on table "public"."merchant_locations" to "service_role";

grant select on table "public"."merchant_locations" to "service_role";

grant trigger on table "public"."merchant_locations" to "service_role";

grant truncate on table "public"."merchant_locations" to "service_role";

grant update on table "public"."merchant_locations" to "service_role";


  create policy "external_conditions_authenticated_read"
  on "public"."external_conditions"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "external_conditions_authenticated_update"
  on "public"."external_conditions"
  as permissive
  for update
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "external_conditions_authenticated_write"
  on "public"."external_conditions"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "merchant_locations_authenticated_read"
  on "public"."merchant_locations"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "merchant_locations_authenticated_update"
  on "public"."merchant_locations"
  as permissive
  for update
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "merchant_locations_authenticated_write"
  on "public"."merchant_locations"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));


CREATE TRIGGER trg_merchant_locations_set_updated_at BEFORE UPDATE ON public.merchant_locations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


