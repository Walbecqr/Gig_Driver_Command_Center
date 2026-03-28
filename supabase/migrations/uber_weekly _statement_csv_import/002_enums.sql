create type platform_enum as enum (
  'uber_driver',
  'uber_eats',
  'doordash',
  'grubhub',
  'unknown'
);

create type connection_mode_enum as enum (
  'import_only',
  'linked',
  'manual'
);

create type connection_status_enum as enum (
  'active',
  'disconnected',
  'errored',
  'unknown'
);

create type source_type_enum as enum (
  'weekly_statement_csv',
  'personal_data_export',
  'manual_csv',
  'manual_entry',
  'app_gps',
  'derived',
  'other'
);

create type import_status_enum as enum (
  'processing',
  'completed',
  'partial',
  'failed'
);

create type parse_status_enum as enum (
  'parsed',
  'warning',
  'failed',
  'skipped'
);

create type platform_scope_enum as enum (
  'uber_only',
  'multi_platform',
  'unknown'
);

create type inference_method_enum as enum (
  'gap_clustering',
  'manual_merge',
  'manual_entry',
  'app_tracked'
);

create type service_type_enum as enum (
  'delivery',
  'rideshare',
  'unknown'
);

create type trip_status_enum as enum (
  'completed',
  'cancelled',
  'partial',
  'unknown'
);

create type financial_source_type_enum as enum (
  'statement_csv',
  'personal_data_export',
  'derived'
);

create type metric_source_enum as enum (
  'statement',
  'personal_export',
  'derived',
  'app_gps'
);

create type stop_type_enum as enum (
  'pickup',
  'dropoff',
  'waypoint',
  'unknown'
);

create type stop_status_enum as enum (
  'completed',
  'skipped',
  'unknown'
);

create type issue_type_enum as enum (
  'duplicate',
  'missing_trip_id',
  'amount_mismatch',
  'time_gap',
  'distance_mismatch',
  'unmapped_row',
  'summary_row_detected',
  'parse_failure',
  'suspected_duplicate'
);

create type severity_enum as enum (
  'low',
  'medium',
  'high'
);

create type resolution_status_enum as enum (
  'open',
  'resolved',
  'ignored'
);
