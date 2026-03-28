create index idx_platform_accounts_user_platform
  on public.platform_accounts (user_id, platform);

create index idx_import_batches_user_platform_imported_at
  on public.import_batches (user_id, source_platform, imported_at desc);

create unique index idx_import_batches_file_hash_per_account
  on public.import_batches (platform_account_id, source_file_hash);

create index idx_raw_import_records_batch_row
  on public.raw_import_records (import_batch_id, source_row_index);

create index idx_raw_import_records_row_hash
  on public.raw_import_records (row_hash);

create index idx_shifts_user_date
  on public.shifts (user_id, shift_date_local);

create index idx_shifts_platform_account_start
  on public.shifts (platform_account_id, shift_start_ts_local);

create index idx_trips_user_date
  on public.trips (user_id, trip_date_local);

create index idx_trips_shift_id
  on public.trips (shift_id);

create index idx_trips_start_ts
  on public.trips (trip_start_ts_local);

create index idx_trips_platform_trip_id
  on public.trips (platform_account_id, platform_trip_id)
  where platform_trip_id is not null;

create index idx_reconciliation_issues_user_status_severity
  on public.reconciliation_issues (user_id, resolution_status, severity);

create index idx_reconciliation_issues_trip_id
  on public.reconciliation_issues (trip_id);

create index idx_reconciliation_issues_import_batch_id
  on public.reconciliation_issues (import_batch_id);

create index idx_trip_source_links_trip_id
  on public.trip_source_links (trip_id);

create index idx_trip_source_links_import_batch_id
  on public.trip_source_links (import_batch_id);

create index idx_shift_source_links_shift_id
  on public.shift_source_links (shift_id);

create index idx_raw_import_records_payload_gin
  on public.raw_import_records
  using gin (source_payload_json);

create index idx_trip_source_links_field_map_gin
  on public.trip_source_links
  using gin (source_field_map_json);
