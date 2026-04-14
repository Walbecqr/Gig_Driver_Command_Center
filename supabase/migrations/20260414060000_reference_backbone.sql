-- ============================================================
-- Reference data backbone: enums + 4 registry/ingestion tables
-- ============================================================
-- Tables created here:
--   reference_datasets        — one row per versioned data source
--   reference_ingest_batches  — one row per ingestion run
--   reference_features        — raw GeoJSON features (multi-res H3 centroid)
--   external_condition_alerts — NWS weather/alert polygons per zone
--
-- Naming conventions:
--   H3 single-resolution: zone_id text  (not h3_cell)
--   H3 multi-resolution on reference_features: h3_res6 / h3_res7 / h3_res8
--   Triggers: trg_{table}_set_updated_at → public.set_updated_at()
--   RLS: permissive, to public, auth.role() = 'authenticated'
-- ============================================================


-- ── Enum types ─────────────────────────────────────────────────────────────

create type "public"."reference_source_type_enum" as enum (
  'nws',
  'census_acs',
  'geojson_file',
  'data_gov_api',
  'manual'
);

create type "public"."reference_layer_category_enum" as enum (
  'external_conditions',
  'external_alerts',
  'demographics',
  'risk',
  'transport',
  'reference',
  'demand',
  'poi',
  'land_use',
  'infrastructure'
);

create type "public"."refresh_cadence_enum" as enum (
  'daily',
  'weekly',
  'monthly',
  'on_demand',
  'annually'
);


-- ── reference_datasets ──────────────────────────────────────────────────────

create table "public"."reference_datasets" (
  "reference_dataset_id" uuid not null default gen_random_uuid(),
  "dataset_name"         text not null,
  "dataset_slug"         text,
  "source_type"          public.reference_source_type_enum not null,
  "layer_category"       public.reference_layer_category_enum not null,
  "source_agency"        text,
  "source_url"           text,
  "source_vintage"       text,
  "description"          text,
  "refresh_cadence"      public.refresh_cadence_enum not null default 'on_demand',
  "parser_version"       text,
  "is_active"            boolean not null default true,
  "notes"                text,
  "created_at"           timestamp with time zone not null default now(),
  "updated_at"           timestamp with time zone not null default now()
);

alter table "public"."reference_datasets" enable row level security;

CREATE UNIQUE INDEX reference_datasets_pkey
  ON public.reference_datasets USING btree (reference_dataset_id);

CREATE UNIQUE INDEX idx_reference_datasets_slug
  ON public.reference_datasets USING btree (dataset_slug)
  WHERE (dataset_slug IS NOT NULL);

CREATE INDEX idx_reference_datasets_layer_category
  ON public.reference_datasets USING btree (layer_category);

alter table "public"."reference_datasets"
  add constraint "reference_datasets_pkey"
  PRIMARY KEY using index "reference_datasets_pkey";

alter table "public"."reference_datasets"
  add constraint "reference_datasets_name_not_blank"
  CHECK ((length(TRIM(BOTH FROM dataset_name)) > 0)) not valid;

alter table "public"."reference_datasets"
  validate constraint "reference_datasets_name_not_blank";

grant delete    on table "public"."reference_datasets" to "anon";
grant insert    on table "public"."reference_datasets" to "anon";
grant references on table "public"."reference_datasets" to "anon";
grant select    on table "public"."reference_datasets" to "anon";
grant trigger   on table "public"."reference_datasets" to "anon";
grant truncate  on table "public"."reference_datasets" to "anon";
grant update    on table "public"."reference_datasets" to "anon";

grant delete    on table "public"."reference_datasets" to "authenticated";
grant insert    on table "public"."reference_datasets" to "authenticated";
grant references on table "public"."reference_datasets" to "authenticated";
grant select    on table "public"."reference_datasets" to "authenticated";
grant trigger   on table "public"."reference_datasets" to "authenticated";
grant truncate  on table "public"."reference_datasets" to "authenticated";
grant update    on table "public"."reference_datasets" to "authenticated";

grant delete    on table "public"."reference_datasets" to "service_role";
grant insert    on table "public"."reference_datasets" to "service_role";
grant references on table "public"."reference_datasets" to "service_role";
grant select    on table "public"."reference_datasets" to "service_role";
grant trigger   on table "public"."reference_datasets" to "service_role";
grant truncate  on table "public"."reference_datasets" to "service_role";
grant update    on table "public"."reference_datasets" to "service_role";

create policy "reference_datasets_authenticated_read"
  on "public"."reference_datasets"
  as permissive
  for select
  to public
  using ((auth.role() = 'authenticated'::text));

create policy "reference_datasets_authenticated_write"
  on "public"."reference_datasets"
  as permissive
  for insert
  to public
  with check ((auth.role() = 'authenticated'::text));

create policy "reference_datasets_authenticated_update"
  on "public"."reference_datasets"
  as permissive
  for update
  to public
  using ((auth.role() = 'authenticated'::text));

CREATE TRIGGER trg_reference_datasets_set_updated_at
  BEFORE UPDATE ON public.reference_datasets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── reference_ingest_batches ─────────────────────────────────────────────────

create table "public"."reference_ingest_batches" (
  "reference_ingest_batch_id" uuid not null default gen_random_uuid(),
  "reference_dataset_id"      uuid not null,
  "import_batch_id"           uuid,
  "source_file_name"          text,
  "source_file_hash"          text,
  "source_record_count"       integer not null default 0,
  "parsed_record_count"       integer not null default 0,
  "ingest_status"             text not null default 'pending',
  "ingest_notes"              text,
  "ingested_at"               timestamp with time zone not null default now()
);

alter table "public"."reference_ingest_batches" enable row level security;

CREATE UNIQUE INDEX reference_ingest_batches_pkey
  ON public.reference_ingest_batches USING btree (reference_ingest_batch_id);

CREATE INDEX idx_reference_ingest_batches_dataset
  ON public.reference_ingest_batches USING btree (reference_dataset_id);

CREATE INDEX idx_reference_ingest_batches_ingested_at
  ON public.reference_ingest_batches USING btree (ingested_at DESC);

alter table "public"."reference_ingest_batches"
  add constraint "reference_ingest_batches_pkey"
  PRIMARY KEY using index "reference_ingest_batches_pkey";

alter table "public"."reference_ingest_batches"
  add constraint "reference_ingest_batches_reference_dataset_id_fkey"
  FOREIGN KEY (reference_dataset_id)
  REFERENCES public.reference_datasets(reference_dataset_id)
  ON DELETE CASCADE not valid;

alter table "public"."reference_ingest_batches"
  validate constraint "reference_ingest_batches_reference_dataset_id_fkey";

alter table "public"."reference_ingest_batches"
  add constraint "reference_ingest_batches_import_batch_id_fkey"
  FOREIGN KEY (import_batch_id)
  REFERENCES public.import_batches(import_batch_id)
  ON DELETE SET NULL not valid;

alter table "public"."reference_ingest_batches"
  validate constraint "reference_ingest_batches_import_batch_id_fkey";

grant delete    on table "public"."reference_ingest_batches" to "anon";
grant insert    on table "public"."reference_ingest_batches" to "anon";
grant references on table "public"."reference_ingest_batches" to "anon";
grant select    on table "public"."reference_ingest_batches" to "anon";
grant trigger   on table "public"."reference_ingest_batches" to "anon";
grant truncate  on table "public"."reference_ingest_batches" to "anon";
grant update    on table "public"."reference_ingest_batches" to "anon";

grant delete    on table "public"."reference_ingest_batches" to "authenticated";
grant insert    on table "public"."reference_ingest_batches" to "authenticated";
grant references on table "public"."reference_ingest_batches" to "authenticated";
grant select    on table "public"."reference_ingest_batches" to "authenticated";
grant trigger   on table "public"."reference_ingest_batches" to "authenticated";
grant truncate  on table "public"."reference_ingest_batches" to "authenticated";
grant update    on table "public"."reference_ingest_batches" to "authenticated";

grant delete    on table "public"."reference_ingest_batches" to "service_role";
grant insert    on table "public"."reference_ingest_batches" to "service_role";
grant references on table "public"."reference_ingest_batches" to "service_role";
grant select    on table "public"."reference_ingest_batches" to "service_role";
grant trigger   on table "public"."reference_ingest_batches" to "service_role";
grant truncate  on table "public"."reference_ingest_batches" to "service_role";
grant update    on table "public"."reference_ingest_batches" to "service_role";

create policy "reference_ingest_batches_authenticated_read"
  on "public"."reference_ingest_batches"
  as permissive
  for select
  to public
  using ((auth.role() = 'authenticated'::text));

create policy "reference_ingest_batches_authenticated_write"
  on "public"."reference_ingest_batches"
  as permissive
  for insert
  to public
  with check ((auth.role() = 'authenticated'::text));

create policy "reference_ingest_batches_authenticated_update"
  on "public"."reference_ingest_batches"
  as permissive
  for update
  to public
  using ((auth.role() = 'authenticated'::text));


-- ── reference_features ──────────────────────────────────────────────────────
-- Stores raw GeoJSON geometry per feature. Multi-resolution H3 centroids are
-- kept here (h3_res6/7/8) so callers can join at any resolution. Overlay
-- tables link back via reference_feature_id and store a single zone_id (res 9).

create table "public"."reference_features" (
  "reference_feature_id"       uuid not null default gen_random_uuid(),
  "reference_dataset_id"       uuid not null,
  "reference_ingest_batch_id"  uuid,
  "feature_external_id"        text,
  "feature_name"               text,
  "feature_subtype"            text,
  "geometry_type"              text not null default 'unknown',
  "geometry_json"              jsonb,
  "centroid_lat"               numeric(9,6),
  "centroid_lng"               numeric(9,6),
  "h3_res6"                    text,
  "h3_res7"                    text,
  "h3_res8"                    text,
  "raw_properties_json"        jsonb,
  "normalized_properties_json" jsonb,
  "source_confidence"          numeric(4,3) not null default 0.9,
  "effective_start_ts"         timestamp with time zone,
  "effective_end_ts"           timestamp with time zone,
  "created_at"                 timestamp with time zone not null default now(),
  "updated_at"                 timestamp with time zone not null default now()
);

alter table "public"."reference_features" enable row level security;

CREATE UNIQUE INDEX reference_features_pkey
  ON public.reference_features USING btree (reference_feature_id);

CREATE INDEX idx_reference_features_dataset
  ON public.reference_features USING btree (reference_dataset_id);

CREATE INDEX idx_reference_features_h3_res8
  ON public.reference_features USING btree (h3_res8)
  WHERE (h3_res8 IS NOT NULL);

CREATE INDEX idx_reference_features_external_id
  ON public.reference_features USING btree (reference_dataset_id, feature_external_id)
  WHERE (feature_external_id IS NOT NULL);

alter table "public"."reference_features"
  add constraint "reference_features_pkey"
  PRIMARY KEY using index "reference_features_pkey";

alter table "public"."reference_features"
  add constraint "reference_features_reference_dataset_id_fkey"
  FOREIGN KEY (reference_dataset_id)
  REFERENCES public.reference_datasets(reference_dataset_id)
  ON DELETE CASCADE not valid;

alter table "public"."reference_features"
  validate constraint "reference_features_reference_dataset_id_fkey";

alter table "public"."reference_features"
  add constraint "reference_features_reference_ingest_batch_id_fkey"
  FOREIGN KEY (reference_ingest_batch_id)
  REFERENCES public.reference_ingest_batches(reference_ingest_batch_id)
  ON DELETE SET NULL not valid;

alter table "public"."reference_features"
  validate constraint "reference_features_reference_ingest_batch_id_fkey";

alter table "public"."reference_features"
  add constraint "reference_features_source_confidence_range"
  CHECK (((source_confidence >= (0)::numeric) AND (source_confidence <= (1)::numeric))) not valid;

alter table "public"."reference_features"
  validate constraint "reference_features_source_confidence_range";

grant delete    on table "public"."reference_features" to "anon";
grant insert    on table "public"."reference_features" to "anon";
grant references on table "public"."reference_features" to "anon";
grant select    on table "public"."reference_features" to "anon";
grant trigger   on table "public"."reference_features" to "anon";
grant truncate  on table "public"."reference_features" to "anon";
grant update    on table "public"."reference_features" to "anon";

grant delete    on table "public"."reference_features" to "authenticated";
grant insert    on table "public"."reference_features" to "authenticated";
grant references on table "public"."reference_features" to "authenticated";
grant select    on table "public"."reference_features" to "authenticated";
grant trigger   on table "public"."reference_features" to "authenticated";
grant truncate  on table "public"."reference_features" to "authenticated";
grant update    on table "public"."reference_features" to "authenticated";

grant delete    on table "public"."reference_features" to "service_role";
grant insert    on table "public"."reference_features" to "service_role";
grant references on table "public"."reference_features" to "service_role";
grant select    on table "public"."reference_features" to "service_role";
grant trigger   on table "public"."reference_features" to "service_role";
grant truncate  on table "public"."reference_features" to "service_role";
grant update    on table "public"."reference_features" to "service_role";

create policy "reference_features_authenticated_read"
  on "public"."reference_features"
  as permissive
  for select
  to public
  using ((auth.role() = 'authenticated'::text));

create policy "reference_features_authenticated_write"
  on "public"."reference_features"
  as permissive
  for insert
  to public
  with check ((auth.role() = 'authenticated'::text));

create policy "reference_features_authenticated_update"
  on "public"."reference_features"
  as permissive
  for update
  to public
  using ((auth.role() = 'authenticated'::text));

CREATE TRIGGER trg_reference_features_set_updated_at
  BEFORE UPDATE ON public.reference_features
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── external_condition_alerts ────────────────────────────────────────────────
-- NWS polygon alerts (tornado warnings, severe thunderstorm, etc.).
-- zone_id is the H3 res-9 cell of the alert polygon centroid; empty string
-- when centroid could not be computed (polygon-only alerts).

create table "public"."external_condition_alerts" (
  "external_condition_alert_id" uuid not null default gen_random_uuid(),
  "reference_feature_id"        uuid not null,
  "reference_dataset_id"        uuid not null,
  "zone_id"                     text not null default ''::text,
  "event_type"                  text not null,
  "alert_external_id"           text,
  "headline"                    text,
  "description"                 text,
  "severity"                    text,
  "urgency"                     text,
  "certainty"                   text,
  "onset_ts"                    timestamp with time zone,
  "expires_ts"                  timestamp with time zone,
  "properties_json"             jsonb,
  "created_at"                  timestamp with time zone not null default now()
);

alter table "public"."external_condition_alerts" enable row level security;

CREATE UNIQUE INDEX external_condition_alerts_pkey
  ON public.external_condition_alerts USING btree (external_condition_alert_id);

CREATE INDEX idx_external_condition_alerts_zone_id
  ON public.external_condition_alerts USING btree (zone_id)
  WHERE (zone_id <> ''::text);

CREATE INDEX idx_external_condition_alerts_event_type
  ON public.external_condition_alerts USING btree (event_type);

CREATE INDEX idx_external_condition_alerts_onset
  ON public.external_condition_alerts USING btree (onset_ts DESC)
  WHERE (onset_ts IS NOT NULL);

CREATE INDEX idx_external_condition_alerts_expires
  ON public.external_condition_alerts USING btree (expires_ts DESC)
  WHERE (expires_ts IS NOT NULL);

alter table "public"."external_condition_alerts"
  add constraint "external_condition_alerts_pkey"
  PRIMARY KEY using index "external_condition_alerts_pkey";

alter table "public"."external_condition_alerts"
  add constraint "external_condition_alerts_reference_feature_id_fkey"
  FOREIGN KEY (reference_feature_id)
  REFERENCES public.reference_features(reference_feature_id)
  ON DELETE CASCADE not valid;

alter table "public"."external_condition_alerts"
  validate constraint "external_condition_alerts_reference_feature_id_fkey";

alter table "public"."external_condition_alerts"
  add constraint "external_condition_alerts_reference_dataset_id_fkey"
  FOREIGN KEY (reference_dataset_id)
  REFERENCES public.reference_datasets(reference_dataset_id)
  ON DELETE CASCADE not valid;

alter table "public"."external_condition_alerts"
  validate constraint "external_condition_alerts_reference_dataset_id_fkey";

grant delete    on table "public"."external_condition_alerts" to "anon";
grant insert    on table "public"."external_condition_alerts" to "anon";
grant references on table "public"."external_condition_alerts" to "anon";
grant select    on table "public"."external_condition_alerts" to "anon";
grant trigger   on table "public"."external_condition_alerts" to "anon";
grant truncate  on table "public"."external_condition_alerts" to "anon";
grant update    on table "public"."external_condition_alerts" to "anon";

grant delete    on table "public"."external_condition_alerts" to "authenticated";
grant insert    on table "public"."external_condition_alerts" to "authenticated";
grant references on table "public"."external_condition_alerts" to "authenticated";
grant select    on table "public"."external_condition_alerts" to "authenticated";
grant trigger   on table "public"."external_condition_alerts" to "authenticated";
grant truncate  on table "public"."external_condition_alerts" to "authenticated";
grant update    on table "public"."external_condition_alerts" to "authenticated";

grant delete    on table "public"."external_condition_alerts" to "service_role";
grant insert    on table "public"."external_condition_alerts" to "service_role";
grant references on table "public"."external_condition_alerts" to "service_role";
grant select    on table "public"."external_condition_alerts" to "service_role";
grant trigger   on table "public"."external_condition_alerts" to "service_role";
grant truncate  on table "public"."external_condition_alerts" to "service_role";
grant update    on table "public"."external_condition_alerts" to "service_role";

create policy "external_condition_alerts_authenticated_read"
  on "public"."external_condition_alerts"
  as permissive
  for select
  to public
  using ((auth.role() = 'authenticated'::text));

create policy "external_condition_alerts_authenticated_write"
  on "public"."external_condition_alerts"
  as permissive
  for insert
  to public
  with check ((auth.role() = 'authenticated'::text));

create policy "external_condition_alerts_authenticated_update"
  on "public"."external_condition_alerts"
  as permissive
  for update
  to public
  using ((auth.role() = 'authenticated'::text));
