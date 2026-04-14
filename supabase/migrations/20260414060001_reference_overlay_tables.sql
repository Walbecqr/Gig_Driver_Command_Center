-- ============================================================
-- Reference data overlay tables + zone_metric_registry
-- ============================================================
-- All overlay tables share the same layout:
--   zone_id text not null default ''  — H3 res-9 cell of feature centroid
--                                       (empty string when centroid unavailable)
--   reference_feature_id → reference_features
--   reference_dataset_id → reference_datasets
--   source_confidence numeric(4,3)
--   properties_json jsonb (raw properties for downstream use)
--
-- Tables:
--   zone_risk_layers         — FEMA flood zones, NHTSA crash risk
--   zone_transport_layers    — FHWA travel-time, road friction
--   zone_reference_layers    — TIGER boundaries, zip code polygons
--   zone_demand_drivers      — Airports, stadiums, event venues
--   poi_reference            — Transit hubs, hospitals, stadiums (point)
--   zone_land_use_layers     — NLCD / zoning overlays
--   infrastructure_reference — EV charging, fuel stops, rest areas (point)
--   zone_demographics        — Census ACS metrics per boundary/zone
--   zone_metric_registry     — Metadata for all overlay metric keys (seed-ready)
-- ============================================================


-- ── zone_risk_layers ─────────────────────────────────────────────────────────

create table "public"."zone_risk_layers" (
  "zone_risk_layer_id"  uuid not null default gen_random_uuid(),
  "reference_feature_id" uuid not null,
  "reference_dataset_id" uuid not null,
  "zone_id"             text not null default ''::text,
  "risk_type"           text not null,
  "risk_value_numeric"  numeric,
  "risk_value_text"     text,
  "units"               text,
  "source_confidence"   numeric(4,3) not null default 0.9,
  "properties_json"     jsonb,
  "created_at"          timestamp with time zone not null default now()
);

alter table "public"."zone_risk_layers" enable row level security;

CREATE UNIQUE INDEX zone_risk_layers_pkey
  ON public.zone_risk_layers USING btree (zone_risk_layer_id);

CREATE INDEX idx_zone_risk_layers_zone_id
  ON public.zone_risk_layers USING btree (zone_id)
  WHERE (zone_id <> ''::text);

CREATE INDEX idx_zone_risk_layers_risk_type
  ON public.zone_risk_layers USING btree (risk_type);

CREATE INDEX idx_zone_risk_layers_dataset
  ON public.zone_risk_layers USING btree (reference_dataset_id);

alter table "public"."zone_risk_layers"
  add constraint "zone_risk_layers_pkey"
  PRIMARY KEY using index "zone_risk_layers_pkey";

alter table "public"."zone_risk_layers"
  add constraint "zone_risk_layers_reference_feature_id_fkey"
  FOREIGN KEY (reference_feature_id)
  REFERENCES public.reference_features(reference_feature_id)
  ON DELETE CASCADE not valid;

alter table "public"."zone_risk_layers"
  validate constraint "zone_risk_layers_reference_feature_id_fkey";

alter table "public"."zone_risk_layers"
  add constraint "zone_risk_layers_reference_dataset_id_fkey"
  FOREIGN KEY (reference_dataset_id)
  REFERENCES public.reference_datasets(reference_dataset_id)
  ON DELETE CASCADE not valid;

alter table "public"."zone_risk_layers"
  validate constraint "zone_risk_layers_reference_dataset_id_fkey";

alter table "public"."zone_risk_layers"
  add constraint "zone_risk_layers_source_confidence_range"
  CHECK (((source_confidence >= (0)::numeric) AND (source_confidence <= (1)::numeric))) not valid;

alter table "public"."zone_risk_layers"
  validate constraint "zone_risk_layers_source_confidence_range";

grant delete    on table "public"."zone_risk_layers" to "anon";
grant insert    on table "public"."zone_risk_layers" to "anon";
grant references on table "public"."zone_risk_layers" to "anon";
grant select    on table "public"."zone_risk_layers" to "anon";
grant trigger   on table "public"."zone_risk_layers" to "anon";
grant truncate  on table "public"."zone_risk_layers" to "anon";
grant update    on table "public"."zone_risk_layers" to "anon";

grant delete    on table "public"."zone_risk_layers" to "authenticated";
grant insert    on table "public"."zone_risk_layers" to "authenticated";
grant references on table "public"."zone_risk_layers" to "authenticated";
grant select    on table "public"."zone_risk_layers" to "authenticated";
grant trigger   on table "public"."zone_risk_layers" to "authenticated";
grant truncate  on table "public"."zone_risk_layers" to "authenticated";
grant update    on table "public"."zone_risk_layers" to "authenticated";

grant delete    on table "public"."zone_risk_layers" to "service_role";
grant insert    on table "public"."zone_risk_layers" to "service_role";
grant references on table "public"."zone_risk_layers" to "service_role";
grant select    on table "public"."zone_risk_layers" to "service_role";
grant trigger   on table "public"."zone_risk_layers" to "service_role";
grant truncate  on table "public"."zone_risk_layers" to "service_role";
grant update    on table "public"."zone_risk_layers" to "service_role";

create policy "zone_risk_layers_authenticated_read"
  on "public"."zone_risk_layers"
  as permissive
  for select
  to public
  using ((auth.role() = 'authenticated'::text));

create policy "zone_risk_layers_authenticated_write"
  on "public"."zone_risk_layers"
  as permissive
  for insert
  to public
  with check ((auth.role() = 'authenticated'::text));

create policy "zone_risk_layers_authenticated_update"
  on "public"."zone_risk_layers"
  as permissive
  for update
  to public
  using ((auth.role() = 'authenticated'::text));


-- ── zone_transport_layers ─────────────────────────────────────────────────────

create table "public"."zone_transport_layers" (
  "zone_transport_layer_id" uuid not null default gen_random_uuid(),
  "reference_feature_id"    uuid not null,
  "reference_dataset_id"    uuid not null,
  "zone_id"                 text not null default ''::text,
  "metric_key"              text not null,
  "metric_value_numeric"    numeric,
  "metric_value_text"       text,
  "units"                   text,
  "source_confidence"       numeric(4,3) not null default 0.9,
  "properties_json"         jsonb,
  "created_at"              timestamp with time zone not null default now()
);

alter table "public"."zone_transport_layers" enable row level security;

CREATE UNIQUE INDEX zone_transport_layers_pkey
  ON public.zone_transport_layers USING btree (zone_transport_layer_id);

CREATE INDEX idx_zone_transport_layers_zone_id
  ON public.zone_transport_layers USING btree (zone_id)
  WHERE (zone_id <> ''::text);

CREATE INDEX idx_zone_transport_layers_metric_key
  ON public.zone_transport_layers USING btree (metric_key);

CREATE INDEX idx_zone_transport_layers_dataset
  ON public.zone_transport_layers USING btree (reference_dataset_id);

alter table "public"."zone_transport_layers"
  add constraint "zone_transport_layers_pkey"
  PRIMARY KEY using index "zone_transport_layers_pkey";

alter table "public"."zone_transport_layers"
  add constraint "zone_transport_layers_reference_feature_id_fkey"
  FOREIGN KEY (reference_feature_id)
  REFERENCES public.reference_features(reference_feature_id)
  ON DELETE CASCADE not valid;

alter table "public"."zone_transport_layers"
  validate constraint "zone_transport_layers_reference_feature_id_fkey";

alter table "public"."zone_transport_layers"
  add constraint "zone_transport_layers_reference_dataset_id_fkey"
  FOREIGN KEY (reference_dataset_id)
  REFERENCES public.reference_datasets(reference_dataset_id)
  ON DELETE CASCADE not valid;

alter table "public"."zone_transport_layers"
  validate constraint "zone_transport_layers_reference_dataset_id_fkey";

alter table "public"."zone_transport_layers"
  add constraint "zone_transport_layers_source_confidence_range"
  CHECK (((source_confidence >= (0)::numeric) AND (source_confidence <= (1)::numeric))) not valid;

alter table "public"."zone_transport_layers"
  validate constraint "zone_transport_layers_source_confidence_range";

grant delete    on table "public"."zone_transport_layers" to "anon";
grant insert    on table "public"."zone_transport_layers" to "anon";
grant references on table "public"."zone_transport_layers" to "anon";
grant select    on table "public"."zone_transport_layers" to "anon";
grant trigger   on table "public"."zone_transport_layers" to "anon";
grant truncate  on table "public"."zone_transport_layers" to "anon";
grant update    on table "public"."zone_transport_layers" to "anon";

grant delete    on table "public"."zone_transport_layers" to "authenticated";
grant insert    on table "public"."zone_transport_layers" to "authenticated";
grant references on table "public"."zone_transport_layers" to "authenticated";
grant select    on table "public"."zone_transport_layers" to "authenticated";
grant trigger   on table "public"."zone_transport_layers" to "authenticated";
grant truncate  on table "public"."zone_transport_layers" to "authenticated";
grant update    on table "public"."zone_transport_layers" to "authenticated";

grant delete    on table "public"."zone_transport_layers" to "service_role";
grant insert    on table "public"."zone_transport_layers" to "service_role";
grant references on table "public"."zone_transport_layers" to "service_role";
grant select    on table "public"."zone_transport_layers" to "service_role";
grant trigger   on table "public"."zone_transport_layers" to "service_role";
grant truncate  on table "public"."zone_transport_layers" to "service_role";
grant update    on table "public"."zone_transport_layers" to "service_role";

create policy "zone_transport_layers_authenticated_read"
  on "public"."zone_transport_layers"
  as permissive
  for select
  to public
  using ((auth.role() = 'authenticated'::text));

create policy "zone_transport_layers_authenticated_write"
  on "public"."zone_transport_layers"
  as permissive
  for insert
  to public
  with check ((auth.role() = 'authenticated'::text));

create policy "zone_transport_layers_authenticated_update"
  on "public"."zone_transport_layers"
  as permissive
  for update
  to public
  using ((auth.role() = 'authenticated'::text));


-- ── zone_reference_layers ─────────────────────────────────────────────────────

create table "public"."zone_reference_layers" (
  "zone_reference_layer_id" uuid not null default gen_random_uuid(),
  "reference_feature_id"    uuid not null,
  "reference_dataset_id"    uuid not null,
  "zone_id"                 text not null default ''::text,
  "boundary_type"           text not null,
  "boundary_external_id"    text,
  "boundary_name"           text,
  "properties_json"         jsonb,
  "created_at"              timestamp with time zone not null default now()
);

alter table "public"."zone_reference_layers" enable row level security;

CREATE UNIQUE INDEX zone_reference_layers_pkey
  ON public.zone_reference_layers USING btree (zone_reference_layer_id);

CREATE INDEX idx_zone_reference_layers_zone_id
  ON public.zone_reference_layers USING btree (zone_id)
  WHERE (zone_id <> ''::text);

CREATE INDEX idx_zone_reference_layers_boundary_type
  ON public.zone_reference_layers USING btree (boundary_type);

CREATE INDEX idx_zone_reference_layers_boundary_external_id
  ON public.zone_reference_layers USING btree (boundary_external_id)
  WHERE (boundary_external_id IS NOT NULL);

alter table "public"."zone_reference_layers"
  add constraint "zone_reference_layers_pkey"
  PRIMARY KEY using index "zone_reference_layers_pkey";

alter table "public"."zone_reference_layers"
  add constraint "zone_reference_layers_reference_feature_id_fkey"
  FOREIGN KEY (reference_feature_id)
  REFERENCES public.reference_features(reference_feature_id)
  ON DELETE CASCADE not valid;

alter table "public"."zone_reference_layers"
  validate constraint "zone_reference_layers_reference_feature_id_fkey";

alter table "public"."zone_reference_layers"
  add constraint "zone_reference_layers_reference_dataset_id_fkey"
  FOREIGN KEY (reference_dataset_id)
  REFERENCES public.reference_datasets(reference_dataset_id)
  ON DELETE CASCADE not valid;

alter table "public"."zone_reference_layers"
  validate constraint "zone_reference_layers_reference_dataset_id_fkey";

grant delete    on table "public"."zone_reference_layers" to "anon";
grant insert    on table "public"."zone_reference_layers" to "anon";
grant references on table "public"."zone_reference_layers" to "anon";
grant select    on table "public"."zone_reference_layers" to "anon";
grant trigger   on table "public"."zone_reference_layers" to "anon";
grant truncate  on table "public"."zone_reference_layers" to "anon";
grant update    on table "public"."zone_reference_layers" to "anon";

grant delete    on table "public"."zone_reference_layers" to "authenticated";
grant insert    on table "public"."zone_reference_layers" to "authenticated";
grant references on table "public"."zone_reference_layers" to "authenticated";
grant select    on table "public"."zone_reference_layers" to "authenticated";
grant trigger   on table "public"."zone_reference_layers" to "authenticated";
grant truncate  on table "public"."zone_reference_layers" to "authenticated";
grant update    on table "public"."zone_reference_layers" to "authenticated";

grant delete    on table "public"."zone_reference_layers" to "service_role";
grant insert    on table "public"."zone_reference_layers" to "service_role";
grant references on table "public"."zone_reference_layers" to "service_role";
grant select    on table "public"."zone_reference_layers" to "service_role";
grant trigger   on table "public"."zone_reference_layers" to "service_role";
grant truncate  on table "public"."zone_reference_layers" to "service_role";
grant update    on table "public"."zone_reference_layers" to "service_role";

create policy "zone_reference_layers_authenticated_read"
  on "public"."zone_reference_layers"
  as permissive
  for select
  to public
  using ((auth.role() = 'authenticated'::text));

create policy "zone_reference_layers_authenticated_write"
  on "public"."zone_reference_layers"
  as permissive
  for insert
  to public
  with check ((auth.role() = 'authenticated'::text));

create policy "zone_reference_layers_authenticated_update"
  on "public"."zone_reference_layers"
  as permissive
  for update
  to public
  using ((auth.role() = 'authenticated'::text));


-- ── zone_demand_drivers ───────────────────────────────────────────────────────

create table "public"."zone_demand_drivers" (
  "zone_demand_driver_id" uuid not null default gen_random_uuid(),
  "reference_feature_id"  uuid not null,
  "reference_dataset_id"  uuid not null,
  "zone_id"               text not null default ''::text,
  "driver_type"           text not null,
  "driver_name"           text,
  "driver_weight"         numeric,
  "capacity_value"        numeric,
  "units"                 text,
  "source_confidence"     numeric(4,3) not null default 0.9,
  "properties_json"       jsonb,
  "created_at"            timestamp with time zone not null default now()
);

alter table "public"."zone_demand_drivers" enable row level security;

CREATE UNIQUE INDEX zone_demand_drivers_pkey
  ON public.zone_demand_drivers USING btree (zone_demand_driver_id);

CREATE INDEX idx_zone_demand_drivers_zone_id
  ON public.zone_demand_drivers USING btree (zone_id)
  WHERE (zone_id <> ''::text);

CREATE INDEX idx_zone_demand_drivers_driver_type
  ON public.zone_demand_drivers USING btree (driver_type);

alter table "public"."zone_demand_drivers"
  add constraint "zone_demand_drivers_pkey"
  PRIMARY KEY using index "zone_demand_drivers_pkey";

alter table "public"."zone_demand_drivers"
  add constraint "zone_demand_drivers_reference_feature_id_fkey"
  FOREIGN KEY (reference_feature_id)
  REFERENCES public.reference_features(reference_feature_id)
  ON DELETE CASCADE not valid;

alter table "public"."zone_demand_drivers"
  validate constraint "zone_demand_drivers_reference_feature_id_fkey";

alter table "public"."zone_demand_drivers"
  add constraint "zone_demand_drivers_reference_dataset_id_fkey"
  FOREIGN KEY (reference_dataset_id)
  REFERENCES public.reference_datasets(reference_dataset_id)
  ON DELETE CASCADE not valid;

alter table "public"."zone_demand_drivers"
  validate constraint "zone_demand_drivers_reference_dataset_id_fkey";

alter table "public"."zone_demand_drivers"
  add constraint "zone_demand_drivers_source_confidence_range"
  CHECK (((source_confidence >= (0)::numeric) AND (source_confidence <= (1)::numeric))) not valid;

alter table "public"."zone_demand_drivers"
  validate constraint "zone_demand_drivers_source_confidence_range";

grant delete    on table "public"."zone_demand_drivers" to "anon";
grant insert    on table "public"."zone_demand_drivers" to "anon";
grant references on table "public"."zone_demand_drivers" to "anon";
grant select    on table "public"."zone_demand_drivers" to "anon";
grant trigger   on table "public"."zone_demand_drivers" to "anon";
grant truncate  on table "public"."zone_demand_drivers" to "anon";
grant update    on table "public"."zone_demand_drivers" to "anon";

grant delete    on table "public"."zone_demand_drivers" to "authenticated";
grant insert    on table "public"."zone_demand_drivers" to "authenticated";
grant references on table "public"."zone_demand_drivers" to "authenticated";
grant select    on table "public"."zone_demand_drivers" to "authenticated";
grant trigger   on table "public"."zone_demand_drivers" to "authenticated";
grant truncate  on table "public"."zone_demand_drivers" to "authenticated";
grant update    on table "public"."zone_demand_drivers" to "authenticated";

grant delete    on table "public"."zone_demand_drivers" to "service_role";
grant insert    on table "public"."zone_demand_drivers" to "service_role";
grant references on table "public"."zone_demand_drivers" to "service_role";
grant select    on table "public"."zone_demand_drivers" to "service_role";
grant trigger   on table "public"."zone_demand_drivers" to "service_role";
grant truncate  on table "public"."zone_demand_drivers" to "service_role";
grant update    on table "public"."zone_demand_drivers" to "service_role";

create policy "zone_demand_drivers_authenticated_read"
  on "public"."zone_demand_drivers"
  as permissive
  for select
  to public
  using ((auth.role() = 'authenticated'::text));

create policy "zone_demand_drivers_authenticated_write"
  on "public"."zone_demand_drivers"
  as permissive
  for insert
  to public
  with check ((auth.role() = 'authenticated'::text));

create policy "zone_demand_drivers_authenticated_update"
  on "public"."zone_demand_drivers"
  as permissive
  for update
  to public
  using ((auth.role() = 'authenticated'::text));


-- ── poi_reference ─────────────────────────────────────────────────────────────

create table "public"."poi_reference" (
  "poi_reference_id"     uuid not null default gen_random_uuid(),
  "reference_feature_id" uuid not null,
  "reference_dataset_id" uuid not null,
  "zone_id"              text not null default ''::text,
  "poi_type"             text not null,
  "poi_name"             text,
  "latitude"             numeric(9,6),
  "longitude"            numeric(9,6),
  "source_confidence"    numeric(4,3) not null default 0.9,
  "properties_json"      jsonb,
  "created_at"           timestamp with time zone not null default now()
);

alter table "public"."poi_reference" enable row level security;

CREATE UNIQUE INDEX poi_reference_pkey
  ON public.poi_reference USING btree (poi_reference_id);

CREATE INDEX idx_poi_reference_zone_id
  ON public.poi_reference USING btree (zone_id)
  WHERE (zone_id <> ''::text);

CREATE INDEX idx_poi_reference_poi_type
  ON public.poi_reference USING btree (poi_type);

alter table "public"."poi_reference"
  add constraint "poi_reference_pkey"
  PRIMARY KEY using index "poi_reference_pkey";

alter table "public"."poi_reference"
  add constraint "poi_reference_reference_feature_id_fkey"
  FOREIGN KEY (reference_feature_id)
  REFERENCES public.reference_features(reference_feature_id)
  ON DELETE CASCADE not valid;

alter table "public"."poi_reference"
  validate constraint "poi_reference_reference_feature_id_fkey";

alter table "public"."poi_reference"
  add constraint "poi_reference_reference_dataset_id_fkey"
  FOREIGN KEY (reference_dataset_id)
  REFERENCES public.reference_datasets(reference_dataset_id)
  ON DELETE CASCADE not valid;

alter table "public"."poi_reference"
  validate constraint "poi_reference_reference_dataset_id_fkey";

alter table "public"."poi_reference"
  add constraint "poi_reference_latitude_range"
  CHECK (((latitude IS NULL) OR ((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric)))) not valid;

alter table "public"."poi_reference"
  validate constraint "poi_reference_latitude_range";

alter table "public"."poi_reference"
  add constraint "poi_reference_longitude_range"
  CHECK (((longitude IS NULL) OR ((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric)))) not valid;

alter table "public"."poi_reference"
  validate constraint "poi_reference_longitude_range";

grant delete    on table "public"."poi_reference" to "anon";
grant insert    on table "public"."poi_reference" to "anon";
grant references on table "public"."poi_reference" to "anon";
grant select    on table "public"."poi_reference" to "anon";
grant trigger   on table "public"."poi_reference" to "anon";
grant truncate  on table "public"."poi_reference" to "anon";
grant update    on table "public"."poi_reference" to "anon";

grant delete    on table "public"."poi_reference" to "authenticated";
grant insert    on table "public"."poi_reference" to "authenticated";
grant references on table "public"."poi_reference" to "authenticated";
grant select    on table "public"."poi_reference" to "authenticated";
grant trigger   on table "public"."poi_reference" to "authenticated";
grant truncate  on table "public"."poi_reference" to "authenticated";
grant update    on table "public"."poi_reference" to "authenticated";

grant delete    on table "public"."poi_reference" to "service_role";
grant insert    on table "public"."poi_reference" to "service_role";
grant references on table "public"."poi_reference" to "service_role";
grant select    on table "public"."poi_reference" to "service_role";
grant trigger   on table "public"."poi_reference" to "service_role";
grant truncate  on table "public"."poi_reference" to "service_role";
grant update    on table "public"."poi_reference" to "service_role";

create policy "poi_reference_authenticated_read"
  on "public"."poi_reference"
  as permissive
  for select
  to public
  using ((auth.role() = 'authenticated'::text));

create policy "poi_reference_authenticated_write"
  on "public"."poi_reference"
  as permissive
  for insert
  to public
  with check ((auth.role() = 'authenticated'::text));

create policy "poi_reference_authenticated_update"
  on "public"."poi_reference"
  as permissive
  for update
  to public
  using ((auth.role() = 'authenticated'::text));


-- ── zone_land_use_layers ──────────────────────────────────────────────────────

create table "public"."zone_land_use_layers" (
  "zone_land_use_layer_id" uuid not null default gen_random_uuid(),
  "reference_feature_id"   uuid not null,
  "reference_dataset_id"   uuid not null,
  "zone_id"                text not null default ''::text,
  "land_use_type"          text not null,
  "coverage_fraction"      numeric,
  "intensity_score"        numeric,
  "source_confidence"      numeric(4,3) not null default 0.9,
  "properties_json"        jsonb,
  "created_at"             timestamp with time zone not null default now()
);

alter table "public"."zone_land_use_layers" enable row level security;

CREATE UNIQUE INDEX zone_land_use_layers_pkey
  ON public.zone_land_use_layers USING btree (zone_land_use_layer_id);

CREATE INDEX idx_zone_land_use_layers_zone_id
  ON public.zone_land_use_layers USING btree (zone_id)
  WHERE (zone_id <> ''::text);

CREATE INDEX idx_zone_land_use_layers_land_use_type
  ON public.zone_land_use_layers USING btree (land_use_type);

alter table "public"."zone_land_use_layers"
  add constraint "zone_land_use_layers_pkey"
  PRIMARY KEY using index "zone_land_use_layers_pkey";

alter table "public"."zone_land_use_layers"
  add constraint "zone_land_use_layers_reference_feature_id_fkey"
  FOREIGN KEY (reference_feature_id)
  REFERENCES public.reference_features(reference_feature_id)
  ON DELETE CASCADE not valid;

alter table "public"."zone_land_use_layers"
  validate constraint "zone_land_use_layers_reference_feature_id_fkey";

alter table "public"."zone_land_use_layers"
  add constraint "zone_land_use_layers_reference_dataset_id_fkey"
  FOREIGN KEY (reference_dataset_id)
  REFERENCES public.reference_datasets(reference_dataset_id)
  ON DELETE CASCADE not valid;

alter table "public"."zone_land_use_layers"
  validate constraint "zone_land_use_layers_reference_dataset_id_fkey";

alter table "public"."zone_land_use_layers"
  add constraint "zone_land_use_layers_coverage_fraction_range"
  CHECK (((coverage_fraction IS NULL) OR ((coverage_fraction >= (0)::numeric) AND (coverage_fraction <= (1)::numeric)))) not valid;

alter table "public"."zone_land_use_layers"
  validate constraint "zone_land_use_layers_coverage_fraction_range";

grant delete    on table "public"."zone_land_use_layers" to "anon";
grant insert    on table "public"."zone_land_use_layers" to "anon";
grant references on table "public"."zone_land_use_layers" to "anon";
grant select    on table "public"."zone_land_use_layers" to "anon";
grant trigger   on table "public"."zone_land_use_layers" to "anon";
grant truncate  on table "public"."zone_land_use_layers" to "anon";
grant update    on table "public"."zone_land_use_layers" to "anon";

grant delete    on table "public"."zone_land_use_layers" to "authenticated";
grant insert    on table "public"."zone_land_use_layers" to "authenticated";
grant references on table "public"."zone_land_use_layers" to "authenticated";
grant select    on table "public"."zone_land_use_layers" to "authenticated";
grant trigger   on table "public"."zone_land_use_layers" to "authenticated";
grant truncate  on table "public"."zone_land_use_layers" to "authenticated";
grant update    on table "public"."zone_land_use_layers" to "authenticated";

grant delete    on table "public"."zone_land_use_layers" to "service_role";
grant insert    on table "public"."zone_land_use_layers" to "service_role";
grant references on table "public"."zone_land_use_layers" to "service_role";
grant select    on table "public"."zone_land_use_layers" to "service_role";
grant trigger   on table "public"."zone_land_use_layers" to "service_role";
grant truncate  on table "public"."zone_land_use_layers" to "service_role";
grant update    on table "public"."zone_land_use_layers" to "service_role";

create policy "zone_land_use_layers_authenticated_read"
  on "public"."zone_land_use_layers"
  as permissive
  for select
  to public
  using ((auth.role() = 'authenticated'::text));

create policy "zone_land_use_layers_authenticated_write"
  on "public"."zone_land_use_layers"
  as permissive
  for insert
  to public
  with check ((auth.role() = 'authenticated'::text));

create policy "zone_land_use_layers_authenticated_update"
  on "public"."zone_land_use_layers"
  as permissive
  for update
  to public
  using ((auth.role() = 'authenticated'::text));


-- ── infrastructure_reference ──────────────────────────────────────────────────

create table "public"."infrastructure_reference" (
  "infrastructure_reference_id" uuid not null default gen_random_uuid(),
  "reference_feature_id"        uuid not null,
  "reference_dataset_id"        uuid not null,
  "zone_id"                     text not null default ''::text,
  "infrastructure_type"         text not null,
  "infrastructure_name"         text,
  "latitude"                    numeric(9,6),
  "longitude"                   numeric(9,6),
  "source_confidence"           numeric(4,3) not null default 0.9,
  "properties_json"             jsonb,
  "created_at"                  timestamp with time zone not null default now()
);

alter table "public"."infrastructure_reference" enable row level security;

CREATE UNIQUE INDEX infrastructure_reference_pkey
  ON public.infrastructure_reference USING btree (infrastructure_reference_id);

CREATE INDEX idx_infrastructure_reference_zone_id
  ON public.infrastructure_reference USING btree (zone_id)
  WHERE (zone_id <> ''::text);

CREATE INDEX idx_infrastructure_reference_type
  ON public.infrastructure_reference USING btree (infrastructure_type);

alter table "public"."infrastructure_reference"
  add constraint "infrastructure_reference_pkey"
  PRIMARY KEY using index "infrastructure_reference_pkey";

alter table "public"."infrastructure_reference"
  add constraint "infrastructure_reference_reference_feature_id_fkey"
  FOREIGN KEY (reference_feature_id)
  REFERENCES public.reference_features(reference_feature_id)
  ON DELETE CASCADE not valid;

alter table "public"."infrastructure_reference"
  validate constraint "infrastructure_reference_reference_feature_id_fkey";

alter table "public"."infrastructure_reference"
  add constraint "infrastructure_reference_reference_dataset_id_fkey"
  FOREIGN KEY (reference_dataset_id)
  REFERENCES public.reference_datasets(reference_dataset_id)
  ON DELETE CASCADE not valid;

alter table "public"."infrastructure_reference"
  validate constraint "infrastructure_reference_reference_dataset_id_fkey";

alter table "public"."infrastructure_reference"
  add constraint "infrastructure_reference_latitude_range"
  CHECK (((latitude IS NULL) OR ((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric)))) not valid;

alter table "public"."infrastructure_reference"
  validate constraint "infrastructure_reference_latitude_range";

alter table "public"."infrastructure_reference"
  add constraint "infrastructure_reference_longitude_range"
  CHECK (((longitude IS NULL) OR ((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric)))) not valid;

alter table "public"."infrastructure_reference"
  validate constraint "infrastructure_reference_longitude_range";

grant delete    on table "public"."infrastructure_reference" to "anon";
grant insert    on table "public"."infrastructure_reference" to "anon";
grant references on table "public"."infrastructure_reference" to "anon";
grant select    on table "public"."infrastructure_reference" to "anon";
grant trigger   on table "public"."infrastructure_reference" to "anon";
grant truncate  on table "public"."infrastructure_reference" to "anon";
grant update    on table "public"."infrastructure_reference" to "anon";

grant delete    on table "public"."infrastructure_reference" to "authenticated";
grant insert    on table "public"."infrastructure_reference" to "authenticated";
grant references on table "public"."infrastructure_reference" to "authenticated";
grant select    on table "public"."infrastructure_reference" to "authenticated";
grant trigger   on table "public"."infrastructure_reference" to "authenticated";
grant truncate  on table "public"."infrastructure_reference" to "authenticated";
grant update    on table "public"."infrastructure_reference" to "authenticated";

grant delete    on table "public"."infrastructure_reference" to "service_role";
grant insert    on table "public"."infrastructure_reference" to "service_role";
grant references on table "public"."infrastructure_reference" to "service_role";
grant select    on table "public"."infrastructure_reference" to "service_role";
grant trigger   on table "public"."infrastructure_reference" to "service_role";
grant truncate  on table "public"."infrastructure_reference" to "service_role";
grant update    on table "public"."infrastructure_reference" to "service_role";

create policy "infrastructure_reference_authenticated_read"
  on "public"."infrastructure_reference"
  as permissive
  for select
  to public
  using ((auth.role() = 'authenticated'::text));

create policy "infrastructure_reference_authenticated_write"
  on "public"."infrastructure_reference"
  as permissive
  for insert
  to public
  with check ((auth.role() = 'authenticated'::text));

create policy "infrastructure_reference_authenticated_update"
  on "public"."infrastructure_reference"
  as permissive
  for update
  to public
  using ((auth.role() = 'authenticated'::text));


-- ── zone_demographics ─────────────────────────────────────────────────────────
-- Census ACS metrics. One row per (reference_feature, metric_key).
-- zone_id is optional ('' when feature has no computable centroid, e.g. county
-- boundaries that span many zones — callers should tessellate separately).

create table "public"."zone_demographics" (
  "zone_demographic_id"  uuid not null default gen_random_uuid(),
  "reference_feature_id" uuid not null,
  "reference_dataset_id" uuid not null,
  "boundary_type"        text not null default 'tract',
  "boundary_external_id" text,
  "zone_id"              text not null default ''::text,
  "metric_key"           text not null,
  "metric_value_numeric" numeric,
  "metric_value_text"    text,
  "units"                text,
  "source_vintage"       text,
  "source_confidence"    numeric(4,3) not null default 0.9,
  "created_at"           timestamp with time zone not null default now()
);

alter table "public"."zone_demographics" enable row level security;

CREATE UNIQUE INDEX zone_demographics_pkey
  ON public.zone_demographics USING btree (zone_demographic_id);

CREATE INDEX idx_zone_demographics_zone_id
  ON public.zone_demographics USING btree (zone_id)
  WHERE (zone_id <> ''::text);

CREATE INDEX idx_zone_demographics_metric_key
  ON public.zone_demographics USING btree (metric_key);

CREATE INDEX idx_zone_demographics_boundary_external_id
  ON public.zone_demographics USING btree (boundary_external_id)
  WHERE (boundary_external_id IS NOT NULL);

CREATE UNIQUE INDEX idx_zone_demographics_feature_metric
  ON public.zone_demographics USING btree (reference_feature_id, metric_key);

alter table "public"."zone_demographics"
  add constraint "zone_demographics_pkey"
  PRIMARY KEY using index "zone_demographics_pkey";

alter table "public"."zone_demographics"
  add constraint "zone_demographics_reference_feature_id_fkey"
  FOREIGN KEY (reference_feature_id)
  REFERENCES public.reference_features(reference_feature_id)
  ON DELETE CASCADE not valid;

alter table "public"."zone_demographics"
  validate constraint "zone_demographics_reference_feature_id_fkey";

alter table "public"."zone_demographics"
  add constraint "zone_demographics_reference_dataset_id_fkey"
  FOREIGN KEY (reference_dataset_id)
  REFERENCES public.reference_datasets(reference_dataset_id)
  ON DELETE CASCADE not valid;

alter table "public"."zone_demographics"
  validate constraint "zone_demographics_reference_dataset_id_fkey";

alter table "public"."zone_demographics"
  add constraint "zone_demographics_source_confidence_range"
  CHECK (((source_confidence >= (0)::numeric) AND (source_confidence <= (1)::numeric))) not valid;

alter table "public"."zone_demographics"
  validate constraint "zone_demographics_source_confidence_range";

grant delete    on table "public"."zone_demographics" to "anon";
grant insert    on table "public"."zone_demographics" to "anon";
grant references on table "public"."zone_demographics" to "anon";
grant select    on table "public"."zone_demographics" to "anon";
grant trigger   on table "public"."zone_demographics" to "anon";
grant truncate  on table "public"."zone_demographics" to "anon";
grant update    on table "public"."zone_demographics" to "anon";

grant delete    on table "public"."zone_demographics" to "authenticated";
grant insert    on table "public"."zone_demographics" to "authenticated";
grant references on table "public"."zone_demographics" to "authenticated";
grant select    on table "public"."zone_demographics" to "authenticated";
grant trigger   on table "public"."zone_demographics" to "authenticated";
grant truncate  on table "public"."zone_demographics" to "authenticated";
grant update    on table "public"."zone_demographics" to "authenticated";

grant delete    on table "public"."zone_demographics" to "service_role";
grant insert    on table "public"."zone_demographics" to "service_role";
grant references on table "public"."zone_demographics" to "service_role";
grant select    on table "public"."zone_demographics" to "service_role";
grant trigger   on table "public"."zone_demographics" to "service_role";
grant truncate  on table "public"."zone_demographics" to "service_role";
grant update    on table "public"."zone_demographics" to "service_role";

create policy "zone_demographics_authenticated_read"
  on "public"."zone_demographics"
  as permissive
  for select
  to public
  using ((auth.role() = 'authenticated'::text));

create policy "zone_demographics_authenticated_write"
  on "public"."zone_demographics"
  as permissive
  for insert
  to public
  with check ((auth.role() = 'authenticated'::text));

create policy "zone_demographics_authenticated_update"
  on "public"."zone_demographics"
  as permissive
  for update
  to public
  using ((auth.role() = 'authenticated'::text));


-- ── zone_metric_registry ──────────────────────────────────────────────────────
-- Metadata catalogue for all metric_key / risk_type / driver_type values used
-- across overlay tables. Allows UI to render human-readable labels + units
-- without hardcoding. Seed rows are inserted below.

create table "public"."zone_metric_registry" (
  "metric_key"       text not null,
  "display_name"     text not null,
  "description"      text,
  "units"            text,
  "layer_category"   public.reference_layer_category_enum not null,
  "source_type"      public.reference_source_type_enum,
  "is_active"        boolean not null default true,
  "created_at"       timestamp with time zone not null default now(),
  "updated_at"       timestamp with time zone not null default now()
);

alter table "public"."zone_metric_registry" enable row level security;

CREATE UNIQUE INDEX zone_metric_registry_pkey
  ON public.zone_metric_registry USING btree (metric_key);

CREATE INDEX idx_zone_metric_registry_layer_category
  ON public.zone_metric_registry USING btree (layer_category);

alter table "public"."zone_metric_registry"
  add constraint "zone_metric_registry_pkey"
  PRIMARY KEY using index "zone_metric_registry_pkey";

alter table "public"."zone_metric_registry"
  add constraint "zone_metric_registry_metric_key_not_blank"
  CHECK ((length(TRIM(BOTH FROM metric_key)) > 0)) not valid;

alter table "public"."zone_metric_registry"
  validate constraint "zone_metric_registry_metric_key_not_blank";

grant delete    on table "public"."zone_metric_registry" to "anon";
grant insert    on table "public"."zone_metric_registry" to "anon";
grant references on table "public"."zone_metric_registry" to "anon";
grant select    on table "public"."zone_metric_registry" to "anon";
grant trigger   on table "public"."zone_metric_registry" to "anon";
grant truncate  on table "public"."zone_metric_registry" to "anon";
grant update    on table "public"."zone_metric_registry" to "anon";

grant delete    on table "public"."zone_metric_registry" to "authenticated";
grant insert    on table "public"."zone_metric_registry" to "authenticated";
grant references on table "public"."zone_metric_registry" to "authenticated";
grant select    on table "public"."zone_metric_registry" to "authenticated";
grant trigger   on table "public"."zone_metric_registry" to "authenticated";
grant truncate  on table "public"."zone_metric_registry" to "authenticated";
grant update    on table "public"."zone_metric_registry" to "authenticated";

grant delete    on table "public"."zone_metric_registry" to "service_role";
grant insert    on table "public"."zone_metric_registry" to "service_role";
grant references on table "public"."zone_metric_registry" to "service_role";
grant select    on table "public"."zone_metric_registry" to "service_role";
grant trigger   on table "public"."zone_metric_registry" to "service_role";
grant truncate  on table "public"."zone_metric_registry" to "service_role";
grant update    on table "public"."zone_metric_registry" to "service_role";

create policy "zone_metric_registry_authenticated_read"
  on "public"."zone_metric_registry"
  as permissive
  for select
  to public
  using ((auth.role() = 'authenticated'::text));

create policy "zone_metric_registry_authenticated_write"
  on "public"."zone_metric_registry"
  as permissive
  for insert
  to public
  with check ((auth.role() = 'authenticated'::text));

create policy "zone_metric_registry_authenticated_update"
  on "public"."zone_metric_registry"
  as permissive
  for update
  to public
  using ((auth.role() = 'authenticated'::text));

CREATE TRIGGER trg_zone_metric_registry_set_updated_at
  BEFORE UPDATE ON public.zone_metric_registry
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── zone_metric_registry seed rows ───────────────────────────────────────────
-- Risk layer metrics
insert into "public"."zone_metric_registry"
  (metric_key, display_name, description, units, layer_category, source_type)
values
  ('flood_zone',         'FEMA Flood Zone',          'FEMA Special Flood Hazard Area designation',              null,       'risk',        'geojson_file'),
  ('crash_risk_score',   'Crash Risk Score',          'NHTSA-derived crash frequency per zone, normalised 0–1', null,       'risk',        'data_gov_api'),
  ('travel_time_index',  'Travel Time Index',         'FHWA travel-time reliability index (1.0 = free flow)',   null,       'transport',   'data_gov_api'),
  ('road_friction_score','Road Friction Score',       'Estimated road friction 0–1 (1 = high grip)',            null,       'transport',   'data_gov_api'),
  ('boundary',           'Administrative Boundary',  'TIGER census boundary polygon',                           null,       'reference',   'geojson_file'),
  ('zip_code',           'ZIP Code Boundary',         'USPS ZIP code tabulation area',                          null,       'reference',   'geojson_file'),
  ('airport',            'Airport',                   'Commercial or regional airport demand driver',           null,       'demand',      'geojson_file'),
  ('stadium',            'Stadium / Arena',           'Sports or entertainment venue demand driver',            null,       'demand',      'geojson_file'),
  ('convention_center',  'Convention Center',         'Convention / conference centre demand driver',           null,       'demand',      'geojson_file'),
  ('transit_hub',        'Transit Hub',               'Major transit station or terminal',                      null,       'poi',         'geojson_file'),
  ('hospital',           'Hospital',                  'Hospital or major medical centre',                       null,       'poi',         'geojson_file'),
  ('university',         'University / College',      'University or college campus',                           null,       'poi',         'geojson_file'),
  ('commercial',         'Commercial Land Use',       'NLCD commercial land-cover class',                       null,       'land_use',    'geojson_file'),
  ('residential',        'Residential Land Use',      'NLCD residential land-cover class',                      null,       'land_use',    'geojson_file'),
  ('industrial',         'Industrial Land Use',       'NLCD industrial land-cover class',                       null,       'land_use',    'geojson_file'),
  ('ev_charging',        'EV Charging Station',       'Electric vehicle charging station',                      null,       'infrastructure', 'data_gov_api'),
  ('fuel_station',       'Fuel Station',              'Gasoline / diesel fuel station',                         null,       'infrastructure', 'geojson_file'),
  ('rest_stop',          'Rest Stop',                 'Highway rest area or truck stop',                        null,       'infrastructure', 'geojson_file'),
-- Census ACS demographic metrics
  ('population_total',           'Total Population',             'ACS total population estimate',                         'persons',  'demographics', 'census_acs'),
  ('median_household_income',    'Median Household Income',      'ACS median household income',                           'USD',      'demographics', 'census_acs'),
  ('pct_renter_occupied',        'Renter-Occupied %',            'ACS percentage of housing units renter-occupied',       'percent',  'demographics', 'census_acs'),
  ('pct_bachelor_or_higher',     'Bachelor Degree or Higher %',  'ACS population 25+ with bachelor degree or higher',     'percent',  'demographics', 'census_acs'),
  ('pct_below_poverty',          'Below Poverty Line %',         'ACS population below federal poverty threshold',        'percent',  'demographics', 'census_acs'),
  ('median_commute_minutes',     'Median Commute Time',          'ACS mean travel time to work',                          'minutes',  'demographics', 'census_acs'),
  ('housing_units_total',        'Total Housing Units',          'ACS total housing units',                               'units',    'demographics', 'census_acs')
on conflict (metric_key) do nothing;
