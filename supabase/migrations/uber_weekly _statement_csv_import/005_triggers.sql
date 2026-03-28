create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger trg_platform_accounts_set_updated_at
before update on public.platform_accounts
for each row execute function public.set_updated_at();

create trigger trg_shifts_set_updated_at
before update on public.shifts
for each row execute function public.set_updated_at();

create trigger trg_trips_set_updated_at
before update on public.trips
for each row execute function public.set_updated_at();
