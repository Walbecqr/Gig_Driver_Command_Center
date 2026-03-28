create table public.users (
  user_id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text,
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint users_timezone_not_blank
    check (length(trim(timezone)) > 0)
);

create table public.platform_accounts (
  platform_account_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete cascade,
  platform platform_enum not null,
  account_external_id text,
  account_label text,
  connection_mode connection_mode_enum not null default 'import_only',
  connection_status connection_status_enum not null default 'unknown',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint platform_accounts_label_not_blank
    check (account_label is null or length(trim(account_label)) > 0)
);

create table public.import_batches (
  import_batch_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete cascade,
  platform_account_id uuid not null references public.platform_accounts(platform_account_id) on delete cascade,
  source_platform platform_enum not null,
  source_type source_type_enum not null,
  source_file_name text not null,
  source_file_hash text not null,
  source_statement_start_date date,
  source_statement_end_date date,
  parser_version text not null,
  row_count_raw integer not null default 0,
  row_count_parsed integer not null default 0,
  import_status import_status_enum not null default 'processing',
  import_notes text,
  imported_at timestamptz not null default now(),

  constraint import_batches_row_count_raw_nonnegative
    check (row_count_raw >= 0),

  constraint import_batches_row_count_parsed_nonnegative
    check (row_count_parsed >= 0),

  constraint import_batches_statement_dates_valid
    check (
      source_statement_start_date is null
      or source_statement_end_date is null
      or source_statement_start_date <= source_statement_end_date
    )
);

create table public.raw_import_records (
  raw_record_id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references public.import_batches(import_batch_id) on delete cascade,
  source_row_index integer not null,
  source_record_type text not null,
  source_payload_json jsonb not null,
  row_hash text not null,
  parse_status parse_status_enum not null default 'parsed',
  parse_warning text,
  parse_error text,
  created_at timestamptz not null default now(),

  constraint raw_import_records_source_row_index_nonnegative
    check (source_row_index >= 0),

  constraint raw_import_records_source_record_type_not_blank
    check (length(trim(source_record_type)) > 0)
);

create table public.shifts (
  shift_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete cascade,
  platform_account_id uuid not null references public.platform_accounts(platform_account_id) on delete cascade,
  shift_date_local date not null,
  shift_start_ts_local timestamp without time zone not null,
  shift_end_ts_local timestamp without time zone not null,
  platform_scope platform_scope_enum not null default 'unknown',
  inferred_flag boolean not null default true,
  inference_method inference_method_enum,
  inference_confidence numeric(4,3) not null default 1.000,
  total_trip_count integer not null default 0,
  total_gross_amount numeric(12,2),
  total_net_amount numeric(12,2),
  total_distance_miles numeric(10,3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint shifts_time_order_valid
    check (shift_end_ts_local >= shift_start_ts_local),

  constraint shifts_total_trip_count_nonnegative
    check (total_trip_count >= 0),

  constraint shifts_inference_confidence_range
    check (inference_confidence >= 0 and inference_confidence <= 1),

  constraint shifts_total_distance_nonnegative
    check (total_distance_miles is null or total_distance_miles >= 0)
);

create table public.trips (
  trip_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete cascade,
  platform_account_id uuid not null references public.platform_accounts(platform_account_id) on delete cascade,
  shift_id uuid references public.shifts(shift_id) on delete set null,
  trip_date_local date not null,
  trip_start_ts_local timestamp without time zone,
  trip_end_ts_local timestamp without time zone,
  trip_timezone text not null default 'America/New_York',
  platform platform_enum not null,
  service_type service_type_enum not null default 'unknown',
  platform_trip_id text,
  platform_order_id text,
  trip_status trip_status_enum not null default 'unknown',
  completion_confidence numeric(4,3) not null default 1.000,
  source_priority integer not null default 1,
  raw_trip_ref uuid references public.raw_import_records(raw_record_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trips_time_order_valid
    check (
      trip_start_ts_local is null
      or trip_end_ts_local is null
      or trip_end_ts_local >= trip_start_ts_local
    ),

  constraint trips_completion_confidence_range
    check (completion_confidence >= 0 and completion_confidence <= 1),

  constraint trips_source_priority_positive
    check (source_priority > 0),

  constraint trips_timezone_not_blank
    check (length(trim(trip_timezone)) > 0),

  constraint trips_has_minimum_identity
    check (
      platform_trip_id is not null
      or (trip_start_ts_local is not null and trip_end_ts_local is not null)
      or trip_date_local is not null
    )
);

create table public.trip_financials (
  trip_fin_id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references public.trips(trip_id) on delete cascade,
  currency_code text not null default 'USD',
  gross_amount numeric(12,2),
  net_payout numeric(12,2),
  base_fare numeric(12,2),
  tip_amount numeric(12,2),
  bonus_amount numeric(12,2),
  surge_amount numeric(12,2),
  wait_time_pay numeric(12,2),
  cancellation_pay numeric(12,2),
  adjustment_amt numeric(12,2),
  fee_amount numeric(12,2),
  payout_conf numeric(4,3) not null default 1.000,
  fin_source_type financial_source_type_enum not null,

  constraint trip_financials_currency_not_blank
    check (length(trim(currency_code)) > 0),

  constraint trip_financials_payout_conf_range
    check (payout_conf >= 0 and payout_conf <= 1)
);

create table public.trip_metrics (
  trip_metric_id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references public.trips(trip_id) on delete cascade,
  distance_miles numeric(10,3),
  duration_minutes numeric(10,2),
  active_minutes numeric(10,2),
  pickup_to_drop_minutes numeric(10,2),
  distance_source metric_source_enum not null,
  duration_source metric_source_enum not null,
  metric_confidence numeric(4,3) not null default 1.000,

  constraint trip_metrics_distance_nonnegative
    check (distance_miles is null or distance_miles >= 0),

  constraint trip_metrics_duration_nonnegative
    check (duration_minutes is null or duration_minutes >= 0),

  constraint trip_metrics_active_minutes_nonnegative
    check (active_minutes is null or active_minutes >= 0),

  constraint trip_metrics_pickup_to_drop_minutes_nonnegative
    check (pickup_to_drop_minutes is null or pickup_to_drop_minutes >= 0),

  constraint trip_metrics_metric_confidence_range
    check (metric_confidence >= 0 and metric_confidence <= 1)
);

create table public.stops (
  stop_id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(trip_id) on delete cascade,
  stop_sequence integer not null,
  stop_type stop_type_enum not null default 'unknown',
  stop_status stop_status_enum not null default 'unknown',
  location_name text,
  address_line_1 text,
  city text,
  state text,
  postal_code text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  arrival_ts_local timestamp without time zone,
  departure_ts_local timestamp without time zone,
  created_at timestamptz not null default now(),

  constraint stops_sequence_positive
    check (stop_sequence > 0),

  constraint stops_latitude_range
    check (latitude is null or (latitude >= -90 and latitude <= 90)),

  constraint stops_longitude_range
    check (longitude is null or (longitude >= -180 and longitude <= 180)),

  constraint stops_time_order_valid
    check (
      arrival_ts_local is null
      or departure_ts_local is null
      or departure_ts_local >= arrival_ts_local
    ),

  constraint stops_trip_sequence_unique
    unique (trip_id, stop_sequence)
);

create table public.trip_source_links (
  trip_source_link_id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(trip_id) on delete cascade,
  import_batch_id uuid not null references public.import_batches(import_batch_id) on delete cascade,
  raw_record_id uuid references public.raw_import_records(raw_record_id) on delete set null,
  source_type source_type_enum not null,
  source_field_map_json jsonb,
  source_confidence numeric(4,3) not null default 1.000,
  created_at timestamptz not null default now(),

  constraint trip_source_links_source_confidence_range
    check (source_confidence >= 0 and source_confidence <= 1)
);

create table public.shift_source_links (
  shift_source_link_id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(shift_id) on delete cascade,
  import_batch_id uuid not null references public.import_batches(import_batch_id) on delete cascade,
  source_type source_type_enum not null,
  inference_notes text,
  source_confidence numeric(4,3) not null default 1.000,
  created_at timestamptz not null default now(),

  constraint shift_source_links_source_confidence_range
    check (source_confidence >= 0 and source_confidence <= 1)
);

create table public.reconciliation_issues (
  reconciliation_issue_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete cascade,
  platform_account_id uuid not null references public.platform_accounts(platform_account_id) on delete cascade,
  import_batch_id uuid references public.import_batches(import_batch_id) on delete set null,
  shift_id uuid references public.shifts(shift_id) on delete set null,
  trip_id uuid references public.trips(trip_id) on delete set null,
  issue_type issue_type_enum not null,
  severity severity_enum not null default 'medium',
  issue_summary text not null,
  source_a text,
  source_b text,
  resolution_status resolution_status_enum not null default 'open',
  resolution_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,

  constraint reconciliation_issues_summary_not_blank
    check (length(trim(issue_summary)) > 0),

  constraint reconciliation_issues_resolved_time_valid
    check (resolved_at is null or resolved_at >= created_at)
);
