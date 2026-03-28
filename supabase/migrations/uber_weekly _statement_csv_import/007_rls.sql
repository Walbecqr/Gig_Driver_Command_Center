alter table public.users enable row level security;
alter table public.platform_accounts enable row level security;
alter table public.import_batches enable row level security;
alter table public.raw_import_records enable row level security;
alter table public.shifts enable row level security;
alter table public.trips enable row level security;
alter table public.trip_financials enable row level security;
alter table public.trip_metrics enable row level security;
alter table public.stops enable row level security;
alter table public.trip_source_links enable row level security;
alter table public.shift_source_links enable row level security;
alter table public.reconciliation_issues enable row level security;

create policy "users_select_own"
on public.users
for select
using (user_id = auth.uid());

create policy "users_update_own"
on public.users
for update
using (user_id = auth.uid());

create policy "platform_accounts_own_all"
on public.platform_accounts
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "import_batches_own_all"
on public.import_batches
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "raw_import_records_via_batch"
on public.raw_import_records
for all
using (
  exists (
    select 1
    from public.import_batches ib
    where ib.import_batch_id = raw_import_records.import_batch_id
      and ib.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.import_batches ib
    where ib.import_batch_id = raw_import_records.import_batch_id
      and ib.user_id = auth.uid()
  )
);

create policy "shifts_own_all"
on public.shifts
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "trips_own_all"
on public.trips
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "trip_financials_via_trip"
on public.trip_financials
for all
using (
  exists (
    select 1 from public.trips t
    where t.trip_id = trip_financials.trip_id
      and t.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.trips t
    where t.trip_id = trip_financials.trip_id
      and t.user_id = auth.uid()
  )
);

create policy "trip_metrics_via_trip"
on public.trip_metrics
for all
using (
  exists (
    select 1 from public.trips t
    where t.trip_id = trip_metrics.trip_id
      and t.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.trips t
    where t.trip_id = trip_metrics.trip_id
      and t.user_id = auth.uid()
  )
);

create policy "stops_via_trip"
on public.stops
for all
using (
  exists (
    select 1 from public.trips t
    where t.trip_id = stops.trip_id
      and t.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.trips t
    where t.trip_id = stops.trip_id
      and t.user_id = auth.uid()
  )
);

create policy "trip_source_links_via_trip"
on public.trip_source_links
for all
using (
  exists (
    select 1 from public.trips t
    where t.trip_id = trip_source_links.trip_id
      and t.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.trips t
    where t.trip_id = trip_source_links.trip_id
      and t.user_id = auth.uid()
  )
);

create policy "shift_source_links_via_shift"
on public.shift_source_links
for all
using (
  exists (
    select 1 from public.shifts s
    where s.shift_id = shift_source_links.shift_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.shifts s
    where s.shift_id = shift_source_links.shift_id
      and s.user_id = auth.uid()
  )
);

create policy "reconciliation_issues_own_all"
on public.reconciliation_issues
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
