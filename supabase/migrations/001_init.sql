-- Supabase initial SQL schema for core entities.
-- Run using `supabase db push` or SQL editor (if local setup available).

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  preferred_currency text default 'USD',
  created_at timestamptz not null default now()
);

create table if not exists delivery_platform_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  platform text not null,
  account_name text,
  manual_mode boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  platform_account_id uuid references delivery_platform_accounts(id),
  start_time timestamptz not null,
  end_time timestamptz,
  starting_mileage numeric default 0,
  ending_mileage numeric,
  status text not null,
  notes text,
  updated_at timestamptz not null default now()
);

-- Add RLS policy notes in docs/policies.md
