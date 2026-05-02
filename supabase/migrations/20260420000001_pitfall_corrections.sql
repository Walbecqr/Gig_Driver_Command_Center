-- ============================================================
-- Migration: 20260420000001_pitfall_corrections
-- ============================================================
-- Addresses findings from the Supabase pitfall audit:
--   1. RLS enablement on all user-data tables (idempotent DO block)
--   2. Scoped RLS policies with DO block guards (idempotent, safe for
--      tables not yet in schema — each group checks existence before acting)
--   3. FK column indexes for all existing FK relationships (idempotent)
--
-- Schema notes applied in this correction pass:
--   - raw_import_records (not import_raw_records) is the actual table name
--   - import_batches (not imports) is the user-owned batch table
--   - trips uses trip_date_local (no started_at column)
--   - shifts uses start_time (no started_at column)
--   - stops uses trip_id directly (no delivery_id column)
--   - reconciliation_issues has user_id directly (no transitive sub-select needed)
--   - platform_accounts PK is platform_account_id (not id)
--   - merchant_performance_snapshot and zone_performance_snapshot are in
--     the analytics schema (not public)
--   - Tables not yet in schema are skipped gracefully via IF EXISTS guards
-- ============================================================


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 1: RLS ENABLEMENT (idempotent DO block)
-- ──────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  t   text;
  sch text;
  tables text[][] := ARRAY[
    ARRAY['public',    'delivery_platforms'],
    ARRAY['public',    'offer_feedback_tags'],
    ARRAY['public',    'offer_feedback_tag_assignments'],
    ARRAY['public',    'raw_import_records'],
    ARRAY['public',    'reconciliation_issues'],
    ARRAY['public',    'profiles'],
    ARRAY['public',    'user_settings'],
    ARRAY['public',    'vehicles'],
    ARRAY['public',    'vehicle_cost_profiles'],
    ARRAY['public',    'goals'],
    ARRAY['public',    'preferred_navigation_apps'],
    ARRAY['public',    'platform_accounts'],
    ARRAY['public',    'platform_connection_events'],
    ARRAY['public',    'import_batches'],
    ARRAY['public',    'shifts'],
    ARRAY['public',    'shift_segments'],
    ARRAY['public',    'shift_location_summaries'],
    ARRAY['public',    'offers'],
    ARRAY['public',    'offer_versions'],
    ARRAY['public',    'offer_recommendations'],
    ARRAY['public',    'trips'],
    ARRAY['public',    'deliveries'],
    ARRAY['public',    'stops'],
    ARRAY['public',    'trip_financials'],
    ARRAY['public',    'trip_metrics'],
    ARRAY['public',    'expenses'],
    ARRAY['public',    'cash_ledger_entries'],
    ARRAY['public',    'incidents'],
    ARRAY['analytics', 'merchant_performance_snapshot'],
    ARRAY['analytics', 'zone_performance_snapshot']
  ];
BEGIN
  FOR i IN 1 .. array_length(tables, 1) LOOP
    sch := tables[i][1];
    t   := tables[i][2];
    IF EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = sch AND tablename = t
    ) THEN
      EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', sch, t);
      RAISE NOTICE 'RLS enabled on %.%', sch, t;
    ELSE
      RAISE NOTICE 'Table %.% does not exist — skipping RLS enablement', sch, t;
    END IF;
  END LOOP;
END $$;


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 2: RLS POLICIES (scoped, idempotent)
-- Each table group is wrapped in a DO block that checks existence first so the
-- migration is safe to run even when some tables haven't been created yet.
-- ──────────────────────────────────────────────────────────────────────────────

-- ── delivery_platforms (global reference — SELECT only) ──────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='delivery_platforms') THEN
    DROP POLICY IF EXISTS "delivery_platforms_select" ON public.delivery_platforms;
    CREATE POLICY "delivery_platforms_select"
      ON public.delivery_platforms FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- ── offer_feedback_tags (global reference — SELECT only) ─────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='offer_feedback_tags') THEN
    DROP POLICY IF EXISTS "offer_feedback_tags_select" ON public.offer_feedback_tags;
    CREATE POLICY "offer_feedback_tags_select"
      ON public.offer_feedback_tags FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- ── platform_accounts ────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='platform_accounts') THEN
    DROP POLICY IF EXISTS "platform_accounts_select" ON public.platform_accounts;
    CREATE POLICY "platform_accounts_select"
      ON public.platform_accounts FOR SELECT TO authenticated
      USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "platform_accounts_insert" ON public.platform_accounts;
    CREATE POLICY "platform_accounts_insert"
      ON public.platform_accounts FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "platform_accounts_update" ON public.platform_accounts;
    CREATE POLICY "platform_accounts_update"
      ON public.platform_accounts FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "platform_accounts_delete" ON public.platform_accounts;
    CREATE POLICY "platform_accounts_delete"
      ON public.platform_accounts FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ── platform_connection_events ───────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='platform_connection_events') THEN
    DROP POLICY IF EXISTS "platform_connection_events_select" ON public.platform_connection_events;
    CREATE POLICY "platform_connection_events_select"
      ON public.platform_connection_events FOR SELECT TO authenticated
      USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "platform_connection_events_insert" ON public.platform_connection_events;
    CREATE POLICY "platform_connection_events_insert"
      ON public.platform_connection_events FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "platform_connection_events_update" ON public.platform_connection_events;
    CREATE POLICY "platform_connection_events_update"
      ON public.platform_connection_events FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "platform_connection_events_delete" ON public.platform_connection_events;
    CREATE POLICY "platform_connection_events_delete"
      ON public.platform_connection_events FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ── import_batches ───────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='import_batches') THEN
    DROP POLICY IF EXISTS "import_batches_select" ON public.import_batches;
    CREATE POLICY "import_batches_select"
      ON public.import_batches FOR SELECT TO authenticated
      USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "import_batches_insert" ON public.import_batches;
    CREATE POLICY "import_batches_insert"
      ON public.import_batches FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "import_batches_update" ON public.import_batches;
    CREATE POLICY "import_batches_update"
      ON public.import_batches FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "import_batches_delete" ON public.import_batches;
    CREATE POLICY "import_batches_delete"
      ON public.import_batches FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ── raw_import_records (owned transitively via import_batches.user_id) ────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='raw_import_records') THEN
    DROP POLICY IF EXISTS "raw_import_records_select" ON public.raw_import_records;
    CREATE POLICY "raw_import_records_select"
      ON public.raw_import_records FOR SELECT TO authenticated
      USING (import_batch_id IN (
        SELECT import_batch_id FROM public.import_batches WHERE user_id = auth.uid()
      ));

    DROP POLICY IF EXISTS "raw_import_records_insert" ON public.raw_import_records;
    CREATE POLICY "raw_import_records_insert"
      ON public.raw_import_records FOR INSERT TO authenticated
      WITH CHECK (import_batch_id IN (
        SELECT import_batch_id FROM public.import_batches WHERE user_id = auth.uid()
      ));

    DROP POLICY IF EXISTS "raw_import_records_update" ON public.raw_import_records;
    CREATE POLICY "raw_import_records_update"
      ON public.raw_import_records FOR UPDATE TO authenticated
      USING (import_batch_id IN (
        SELECT import_batch_id FROM public.import_batches WHERE user_id = auth.uid()
      ))
      WITH CHECK (import_batch_id IN (
        SELECT import_batch_id FROM public.import_batches WHERE user_id = auth.uid()
      ));

    DROP POLICY IF EXISTS "raw_import_records_delete" ON public.raw_import_records;
    CREATE POLICY "raw_import_records_delete"
      ON public.raw_import_records FOR DELETE TO authenticated
      USING (import_batch_id IN (
        SELECT import_batch_id FROM public.import_batches WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

-- ── shifts ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='shifts') THEN
    DROP POLICY IF EXISTS "shifts_select" ON public.shifts;
    CREATE POLICY "shifts_select"
      ON public.shifts FOR SELECT TO authenticated
      USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "shifts_insert" ON public.shifts;
    CREATE POLICY "shifts_insert"
      ON public.shifts FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "shifts_update" ON public.shifts;
    CREATE POLICY "shifts_update"
      ON public.shifts FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "shifts_delete" ON public.shifts;
    CREATE POLICY "shifts_delete"
      ON public.shifts FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ── shift_segments (owned transitively via shifts.user_id) ────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='shift_segments') THEN
    DROP POLICY IF EXISTS "shift_segments_select" ON public.shift_segments;
    CREATE POLICY "shift_segments_select"
      ON public.shift_segments FOR SELECT TO authenticated
      USING (shift_id IN (SELECT id FROM public.shifts WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "shift_segments_insert" ON public.shift_segments;
    CREATE POLICY "shift_segments_insert"
      ON public.shift_segments FOR INSERT TO authenticated
      WITH CHECK (shift_id IN (SELECT id FROM public.shifts WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "shift_segments_update" ON public.shift_segments;
    CREATE POLICY "shift_segments_update"
      ON public.shift_segments FOR UPDATE TO authenticated
      USING (shift_id IN (SELECT id FROM public.shifts WHERE user_id = auth.uid()))
      WITH CHECK (shift_id IN (SELECT id FROM public.shifts WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "shift_segments_delete" ON public.shift_segments;
    CREATE POLICY "shift_segments_delete"
      ON public.shift_segments FOR DELETE TO authenticated
      USING (shift_id IN (SELECT id FROM public.shifts WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ── shift_location_summaries (owned transitively via shifts.user_id) ──────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='shift_location_summaries') THEN
    DROP POLICY IF EXISTS "shift_location_summaries_select" ON public.shift_location_summaries;
    CREATE POLICY "shift_location_summaries_select"
      ON public.shift_location_summaries FOR SELECT TO authenticated
      USING (shift_id IN (SELECT id FROM public.shifts WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "shift_location_summaries_insert" ON public.shift_location_summaries;
    CREATE POLICY "shift_location_summaries_insert"
      ON public.shift_location_summaries FOR INSERT TO authenticated
      WITH CHECK (shift_id IN (SELECT id FROM public.shifts WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "shift_location_summaries_update" ON public.shift_location_summaries;
    CREATE POLICY "shift_location_summaries_update"
      ON public.shift_location_summaries FOR UPDATE TO authenticated
      USING (shift_id IN (SELECT id FROM public.shifts WHERE user_id = auth.uid()))
      WITH CHECK (shift_id IN (SELECT id FROM public.shifts WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "shift_location_summaries_delete" ON public.shift_location_summaries;
    CREATE POLICY "shift_location_summaries_delete"
      ON public.shift_location_summaries FOR DELETE TO authenticated
      USING (shift_id IN (SELECT id FROM public.shifts WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ── trips ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='trips') THEN
    DROP POLICY IF EXISTS "trips_select" ON public.trips;
    CREATE POLICY "trips_select"
      ON public.trips FOR SELECT TO authenticated
      USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "trips_insert" ON public.trips;
    CREATE POLICY "trips_insert"
      ON public.trips FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "trips_update" ON public.trips;
    CREATE POLICY "trips_update"
      ON public.trips FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "trips_delete" ON public.trips;
    CREATE POLICY "trips_delete"
      ON public.trips FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ── trip_financials (owned transitively via trips.user_id) ────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='trip_financials') THEN
    DROP POLICY IF EXISTS "trip_financials_select" ON public.trip_financials;
    CREATE POLICY "trip_financials_select"
      ON public.trip_financials FOR SELECT TO authenticated
      USING (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "trip_financials_insert" ON public.trip_financials;
    CREATE POLICY "trip_financials_insert"
      ON public.trip_financials FOR INSERT TO authenticated
      WITH CHECK (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "trip_financials_update" ON public.trip_financials;
    CREATE POLICY "trip_financials_update"
      ON public.trip_financials FOR UPDATE TO authenticated
      USING (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()))
      WITH CHECK (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "trip_financials_delete" ON public.trip_financials;
    CREATE POLICY "trip_financials_delete"
      ON public.trip_financials FOR DELETE TO authenticated
      USING (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ── trip_metrics (owned transitively via trips.user_id) ───────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='trip_metrics') THEN
    DROP POLICY IF EXISTS "trip_metrics_select" ON public.trip_metrics;
    CREATE POLICY "trip_metrics_select"
      ON public.trip_metrics FOR SELECT TO authenticated
      USING (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "trip_metrics_insert" ON public.trip_metrics;
    CREATE POLICY "trip_metrics_insert"
      ON public.trip_metrics FOR INSERT TO authenticated
      WITH CHECK (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "trip_metrics_update" ON public.trip_metrics;
    CREATE POLICY "trip_metrics_update"
      ON public.trip_metrics FOR UPDATE TO authenticated
      USING (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()))
      WITH CHECK (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "trip_metrics_delete" ON public.trip_metrics;
    CREATE POLICY "trip_metrics_delete"
      ON public.trip_metrics FOR DELETE TO authenticated
      USING (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ── stops (owned transitively via trips.user_id; trip_id is direct FK) ────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='stops') THEN
    DROP POLICY IF EXISTS "stops_select" ON public.stops;
    CREATE POLICY "stops_select"
      ON public.stops FOR SELECT TO authenticated
      USING (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "stops_insert" ON public.stops;
    CREATE POLICY "stops_insert"
      ON public.stops FOR INSERT TO authenticated
      WITH CHECK (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "stops_update" ON public.stops;
    CREATE POLICY "stops_update"
      ON public.stops FOR UPDATE TO authenticated
      USING (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()))
      WITH CHECK (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "stops_delete" ON public.stops;
    CREATE POLICY "stops_delete"
      ON public.stops FOR DELETE TO authenticated
      USING (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ── reconciliation_issues (user_id direct FK) ─────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='reconciliation_issues') THEN
    DROP POLICY IF EXISTS "reconciliation_issues_select" ON public.reconciliation_issues;
    CREATE POLICY "reconciliation_issues_select"
      ON public.reconciliation_issues FOR SELECT TO authenticated
      USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "reconciliation_issues_insert" ON public.reconciliation_issues;
    CREATE POLICY "reconciliation_issues_insert"
      ON public.reconciliation_issues FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "reconciliation_issues_update" ON public.reconciliation_issues;
    CREATE POLICY "reconciliation_issues_update"
      ON public.reconciliation_issues FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "reconciliation_issues_delete" ON public.reconciliation_issues;
    CREATE POLICY "reconciliation_issues_delete"
      ON public.reconciliation_issues FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ── profiles ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='profiles') THEN
    DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
    CREATE POLICY "profiles_select"
      ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());

    DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
    CREATE POLICY "profiles_insert"
      ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

    DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
    CREATE POLICY "profiles_update"
      ON public.profiles FOR UPDATE TO authenticated
      USING (id = auth.uid()) WITH CHECK (id = auth.uid());

    DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
    CREATE POLICY "profiles_delete"
      ON public.profiles FOR DELETE TO authenticated USING (id = auth.uid());
  END IF;
END $$;

-- ── user_settings ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_settings') THEN
    DROP POLICY IF EXISTS "user_settings_select" ON public.user_settings;
    CREATE POLICY "user_settings_select"
      ON public.user_settings FOR SELECT TO authenticated USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "user_settings_insert" ON public.user_settings;
    CREATE POLICY "user_settings_insert"
      ON public.user_settings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "user_settings_update" ON public.user_settings;
    CREATE POLICY "user_settings_update"
      ON public.user_settings FOR UPDATE TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "user_settings_delete" ON public.user_settings;
    CREATE POLICY "user_settings_delete"
      ON public.user_settings FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- ── vehicles ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='vehicles') THEN
    DROP POLICY IF EXISTS "vehicles_select" ON public.vehicles;
    CREATE POLICY "vehicles_select"
      ON public.vehicles FOR SELECT TO authenticated USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "vehicles_insert" ON public.vehicles;
    CREATE POLICY "vehicles_insert"
      ON public.vehicles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "vehicles_update" ON public.vehicles;
    CREATE POLICY "vehicles_update"
      ON public.vehicles FOR UPDATE TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "vehicles_delete" ON public.vehicles;
    CREATE POLICY "vehicles_delete"
      ON public.vehicles FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- ── vehicle_cost_profiles (owned transitively via vehicles.user_id) ───────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='vehicle_cost_profiles') THEN
    DROP POLICY IF EXISTS "vehicle_cost_profiles_select" ON public.vehicle_cost_profiles;
    CREATE POLICY "vehicle_cost_profiles_select"
      ON public.vehicle_cost_profiles FOR SELECT TO authenticated
      USING (vehicle_id IN (SELECT id FROM public.vehicles WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "vehicle_cost_profiles_insert" ON public.vehicle_cost_profiles;
    CREATE POLICY "vehicle_cost_profiles_insert"
      ON public.vehicle_cost_profiles FOR INSERT TO authenticated
      WITH CHECK (vehicle_id IN (SELECT id FROM public.vehicles WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "vehicle_cost_profiles_update" ON public.vehicle_cost_profiles;
    CREATE POLICY "vehicle_cost_profiles_update"
      ON public.vehicle_cost_profiles FOR UPDATE TO authenticated
      USING (vehicle_id IN (SELECT id FROM public.vehicles WHERE user_id = auth.uid()))
      WITH CHECK (vehicle_id IN (SELECT id FROM public.vehicles WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "vehicle_cost_profiles_delete" ON public.vehicle_cost_profiles;
    CREATE POLICY "vehicle_cost_profiles_delete"
      ON public.vehicle_cost_profiles FOR DELETE TO authenticated
      USING (vehicle_id IN (SELECT id FROM public.vehicles WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ── goals ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='goals') THEN
    DROP POLICY IF EXISTS "goals_select" ON public.goals;
    CREATE POLICY "goals_select"
      ON public.goals FOR SELECT TO authenticated USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "goals_insert" ON public.goals;
    CREATE POLICY "goals_insert"
      ON public.goals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "goals_update" ON public.goals;
    CREATE POLICY "goals_update"
      ON public.goals FOR UPDATE TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "goals_delete" ON public.goals;
    CREATE POLICY "goals_delete"
      ON public.goals FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- ── preferred_navigation_apps ─────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='preferred_navigation_apps') THEN
    DROP POLICY IF EXISTS "preferred_navigation_apps_select" ON public.preferred_navigation_apps;
    CREATE POLICY "preferred_navigation_apps_select"
      ON public.preferred_navigation_apps FOR SELECT TO authenticated USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "preferred_navigation_apps_insert" ON public.preferred_navigation_apps;
    CREATE POLICY "preferred_navigation_apps_insert"
      ON public.preferred_navigation_apps FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "preferred_navigation_apps_update" ON public.preferred_navigation_apps;
    CREATE POLICY "preferred_navigation_apps_update"
      ON public.preferred_navigation_apps FOR UPDATE TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "preferred_navigation_apps_delete" ON public.preferred_navigation_apps;
    CREATE POLICY "preferred_navigation_apps_delete"
      ON public.preferred_navigation_apps FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- ── offers ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='offers') THEN
    DROP POLICY IF EXISTS "offers_select" ON public.offers;
    CREATE POLICY "offers_select"
      ON public.offers FOR SELECT TO authenticated USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "offers_insert" ON public.offers;
    CREATE POLICY "offers_insert"
      ON public.offers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "offers_update" ON public.offers;
    CREATE POLICY "offers_update"
      ON public.offers FOR UPDATE TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "offers_delete" ON public.offers;
    CREATE POLICY "offers_delete"
      ON public.offers FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- ── offer_versions (owned transitively via offers.user_id) ────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='offer_versions') THEN
    DROP POLICY IF EXISTS "offer_versions_select" ON public.offer_versions;
    CREATE POLICY "offer_versions_select"
      ON public.offer_versions FOR SELECT TO authenticated
      USING (offer_id IN (SELECT id FROM public.offers WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "offer_versions_insert" ON public.offer_versions;
    CREATE POLICY "offer_versions_insert"
      ON public.offer_versions FOR INSERT TO authenticated
      WITH CHECK (offer_id IN (SELECT id FROM public.offers WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "offer_versions_update" ON public.offer_versions;
    CREATE POLICY "offer_versions_update"
      ON public.offer_versions FOR UPDATE TO authenticated
      USING (offer_id IN (SELECT id FROM public.offers WHERE user_id = auth.uid()))
      WITH CHECK (offer_id IN (SELECT id FROM public.offers WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "offer_versions_delete" ON public.offer_versions;
    CREATE POLICY "offer_versions_delete"
      ON public.offer_versions FOR DELETE TO authenticated
      USING (offer_id IN (SELECT id FROM public.offers WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ── offer_recommendations (SELECT only — system-generated) ────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='offer_recommendations') THEN
    DROP POLICY IF EXISTS "offer_recommendations_select" ON public.offer_recommendations;
    CREATE POLICY "offer_recommendations_select"
      ON public.offer_recommendations FOR SELECT TO authenticated
      USING (offer_id IN (SELECT id FROM public.offers WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ── offer_feedback_tag_assignments (owned transitively via offers.user_id) ────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='offer_feedback_tag_assignments') THEN
    DROP POLICY IF EXISTS "offer_feedback_tag_assignments_select" ON public.offer_feedback_tag_assignments;
    CREATE POLICY "offer_feedback_tag_assignments_select"
      ON public.offer_feedback_tag_assignments FOR SELECT TO authenticated
      USING (offer_id IN (SELECT id FROM public.offers WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "offer_feedback_tag_assignments_insert" ON public.offer_feedback_tag_assignments;
    CREATE POLICY "offer_feedback_tag_assignments_insert"
      ON public.offer_feedback_tag_assignments FOR INSERT TO authenticated
      WITH CHECK (offer_id IN (SELECT id FROM public.offers WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "offer_feedback_tag_assignments_update" ON public.offer_feedback_tag_assignments;
    CREATE POLICY "offer_feedback_tag_assignments_update"
      ON public.offer_feedback_tag_assignments FOR UPDATE TO authenticated
      USING (offer_id IN (SELECT id FROM public.offers WHERE user_id = auth.uid()))
      WITH CHECK (offer_id IN (SELECT id FROM public.offers WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "offer_feedback_tag_assignments_delete" ON public.offer_feedback_tag_assignments;
    CREATE POLICY "offer_feedback_tag_assignments_delete"
      ON public.offer_feedback_tag_assignments FOR DELETE TO authenticated
      USING (offer_id IN (SELECT id FROM public.offers WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ── deliveries (owned transitively via trips.user_id) ─────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='deliveries') THEN
    DROP POLICY IF EXISTS "deliveries_select" ON public.deliveries;
    CREATE POLICY "deliveries_select"
      ON public.deliveries FOR SELECT TO authenticated
      USING (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "deliveries_insert" ON public.deliveries;
    CREATE POLICY "deliveries_insert"
      ON public.deliveries FOR INSERT TO authenticated
      WITH CHECK (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "deliveries_update" ON public.deliveries;
    CREATE POLICY "deliveries_update"
      ON public.deliveries FOR UPDATE TO authenticated
      USING (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()))
      WITH CHECK (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "deliveries_delete" ON public.deliveries;
    CREATE POLICY "deliveries_delete"
      ON public.deliveries FOR DELETE TO authenticated
      USING (trip_id IN (SELECT trip_id FROM public.trips WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ── expenses ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='expenses') THEN
    DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
    CREATE POLICY "expenses_select"
      ON public.expenses FOR SELECT TO authenticated USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
    CREATE POLICY "expenses_insert"
      ON public.expenses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "expenses_update" ON public.expenses;
    CREATE POLICY "expenses_update"
      ON public.expenses FOR UPDATE TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;
    CREATE POLICY "expenses_delete"
      ON public.expenses FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- ── cash_ledger_entries ───────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='cash_ledger_entries') THEN
    DROP POLICY IF EXISTS "cash_ledger_entries_select" ON public.cash_ledger_entries;
    CREATE POLICY "cash_ledger_entries_select"
      ON public.cash_ledger_entries FOR SELECT TO authenticated USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "cash_ledger_entries_insert" ON public.cash_ledger_entries;
    CREATE POLICY "cash_ledger_entries_insert"
      ON public.cash_ledger_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "cash_ledger_entries_update" ON public.cash_ledger_entries;
    CREATE POLICY "cash_ledger_entries_update"
      ON public.cash_ledger_entries FOR UPDATE TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "cash_ledger_entries_delete" ON public.cash_ledger_entries;
    CREATE POLICY "cash_ledger_entries_delete"
      ON public.cash_ledger_entries FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- ── incidents ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='incidents') THEN
    DROP POLICY IF EXISTS "incidents_select" ON public.incidents;
    CREATE POLICY "incidents_select"
      ON public.incidents FOR SELECT TO authenticated USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "incidents_insert" ON public.incidents;
    CREATE POLICY "incidents_insert"
      ON public.incidents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "incidents_update" ON public.incidents;
    CREATE POLICY "incidents_update"
      ON public.incidents FOR UPDATE TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "incidents_delete" ON public.incidents;
    CREATE POLICY "incidents_delete"
      ON public.incidents FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- ── analytics.merchant_performance_snapshot (service-role managed; no user scope) ──
-- merchant_id links to core.merchant — user ownership chain is ambiguous at this
-- schema version. RLS is enabled (Section 1); reads require service_role until a
-- proper scoped policy is added when the merchant→user FK chain is clarified.

-- ── analytics.zone_performance_snapshot (service-role managed) ───────────────
-- Aggregated zone data computed server-side. RLS enabled in Section 1.
-- Add a SELECT policy scoped to auth.uid() once a user_id FK is added.


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 3: FK INDEXES (all idempotent via CREATE INDEX IF NOT EXISTS;
--            wrapped in DO blocks for tables that may not exist yet)
-- ──────────────────────────────────────────────────────────────────────────────

-- ── platform_accounts ────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='platform_accounts') THEN
    CREATE INDEX IF NOT EXISTS idx_platform_accounts_user_id
      ON public.platform_accounts (user_id);
  END IF;
END $$;

-- ── platform_connection_events ───────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='platform_connection_events') THEN
    CREATE INDEX IF NOT EXISTS idx_platform_connection_events_user_id
      ON public.platform_connection_events (user_id);
  END IF;
END $$;

-- ── import_batches ───────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='import_batches') THEN
    CREATE INDEX IF NOT EXISTS idx_import_batches_user_id
      ON public.import_batches (user_id);
  END IF;
END $$;

-- ── raw_import_records ────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='raw_import_records') THEN
    CREATE INDEX IF NOT EXISTS idx_raw_import_records_import_batch_id
      ON public.raw_import_records (import_batch_id);
  END IF;
END $$;

-- ── shifts ────────────────────────────────────────────────────────────────────
-- shifts.start_time is the actual column name (not started_at)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='shifts') THEN
    CREATE INDEX IF NOT EXISTS idx_shifts_user_id
      ON public.shifts (user_id);
    CREATE INDEX IF NOT EXISTS idx_shifts_user_start_time
      ON public.shifts (user_id, start_time DESC);
  END IF;
END $$;

-- ── shift_segments ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='shift_segments') THEN
    CREATE INDEX IF NOT EXISTS idx_shift_segments_shift_id
      ON public.shift_segments (shift_id);
  END IF;
END $$;

-- ── shift_location_summaries ──────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='shift_location_summaries') THEN
    CREATE INDEX IF NOT EXISTS idx_shift_location_summaries_shift_id
      ON public.shift_location_summaries (shift_id);
  END IF;
END $$;

-- ── offers ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='offers') THEN
    CREATE INDEX IF NOT EXISTS idx_offers_user_id
      ON public.offers (user_id);
    CREATE INDEX IF NOT EXISTS idx_offers_shift_id
      ON public.offers (shift_id);
    CREATE INDEX IF NOT EXISTS idx_offers_platform_account_id
      ON public.offers (platform_account_id);
    CREATE INDEX IF NOT EXISTS idx_offers_user_created_at
      ON public.offers (user_id, created_at DESC);
  END IF;
END $$;

-- ── offer_versions ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='offer_versions') THEN
    CREATE INDEX IF NOT EXISTS idx_offer_versions_offer_id
      ON public.offer_versions (offer_id);
  END IF;
END $$;

-- ── offer_recommendations ─────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='offer_recommendations') THEN
    CREATE INDEX IF NOT EXISTS idx_offer_recommendations_offer_id
      ON public.offer_recommendations (offer_id);
  END IF;
END $$;

-- ── offer_feedback_tag_assignments ────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='offer_feedback_tag_assignments') THEN
    CREATE INDEX IF NOT EXISTS idx_offer_tag_assignments_offer_id
      ON public.offer_feedback_tag_assignments (offer_id);
    CREATE INDEX IF NOT EXISTS idx_offer_tag_assignments_tag_id
      ON public.offer_feedback_tag_assignments (feedback_tag_id);
  END IF;
END $$;

-- ── trips ─────────────────────────────────────────────────────────────────────
-- trips.trip_date_local is the date column (no started_at column exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='trips') THEN
    CREATE INDEX IF NOT EXISTS idx_trips_user_id
      ON public.trips (user_id);
    -- idx_trips_shift_id already created in 20260329000001_csv_import_schema.sql
    CREATE INDEX IF NOT EXISTS idx_trips_platform_account_id
      ON public.trips (platform_account_id);
    CREATE INDEX IF NOT EXISTS idx_trips_user_trip_date
      ON public.trips (user_id, trip_date_local DESC);
  END IF;
END $$;

-- ── trip_financials ───────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='trip_financials') THEN
    CREATE INDEX IF NOT EXISTS idx_trip_financials_trip_id
      ON public.trip_financials (trip_id);
  END IF;
END $$;

-- ── trip_metrics ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='trip_metrics') THEN
    CREATE INDEX IF NOT EXISTS idx_trip_metrics_trip_id
      ON public.trip_metrics (trip_id);
  END IF;
END $$;

-- ── stops (FK is trip_id; no delivery_id column in current schema) ─────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='stops') THEN
    CREATE INDEX IF NOT EXISTS idx_stops_trip_id
      ON public.stops (trip_id);
  END IF;
END $$;

-- ── deliveries ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='deliveries') THEN
    CREATE INDEX IF NOT EXISTS idx_deliveries_trip_id
      ON public.deliveries (trip_id);
  END IF;
END $$;

-- ── reconciliation_issues ─────────────────────────────────────────────────────
-- idx_reconciliation_issues_trip_id already created in 20260329000001_csv_import_schema.sql
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='reconciliation_issues') THEN
    CREATE INDEX IF NOT EXISTS idx_reconciliation_issues_user_id
      ON public.reconciliation_issues (user_id);
  END IF;
END $$;

-- ── expenses ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='expenses') THEN
    CREATE INDEX IF NOT EXISTS idx_expenses_user_id
      ON public.expenses (user_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_shift_id
      ON public.expenses (shift_id);
  END IF;
END $$;

-- ── cash_ledger_entries ───────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='cash_ledger_entries') THEN
    CREATE INDEX IF NOT EXISTS idx_cash_ledger_user_id
      ON public.cash_ledger_entries (user_id);
    CREATE INDEX IF NOT EXISTS idx_cash_ledger_shift_id
      ON public.cash_ledger_entries (shift_id);
    -- Composite index uses occurred_at; adjust column name when table is created
    -- if the actual timestamp column has a different name.
    CREATE INDEX IF NOT EXISTS idx_cash_ledger_user_occurred_at
      ON public.cash_ledger_entries (user_id, occurred_at DESC);
  END IF;
END $$;

-- ── incidents ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='incidents') THEN
    CREATE INDEX IF NOT EXISTS idx_incidents_user_id
      ON public.incidents (user_id);
    CREATE INDEX IF NOT EXISTS idx_incidents_shift_id
      ON public.incidents (shift_id);
    CREATE INDEX IF NOT EXISTS idx_incidents_trip_id
      ON public.incidents (trip_id);
  END IF;
END $$;

-- ── analytics.merchant_performance_snapshot ───────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='analytics' AND tablename='merchant_performance_snapshot') THEN
    CREATE INDEX IF NOT EXISTS idx_merchant_perf_snapshot_merchant_id
      ON analytics.merchant_performance_snapshot (merchant_id);
    CREATE INDEX IF NOT EXISTS idx_merchant_perf_snapshot_date
      ON analytics.merchant_performance_snapshot (snapshot_date DESC);
  END IF;
END $$;

-- ── analytics.zone_performance_snapshot ───────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='analytics' AND tablename='zone_performance_snapshot') THEN
    CREATE INDEX IF NOT EXISTS idx_zone_perf_snapshot_zone_id
      ON analytics.zone_performance_snapshot (zone_id);
    CREATE INDEX IF NOT EXISTS idx_zone_perf_snapshot_platform_id
      ON analytics.zone_performance_snapshot (platform_id);
    CREATE INDEX IF NOT EXISTS idx_zone_perf_snapshot_zone_date
      ON analytics.zone_performance_snapshot (zone_id, snapshot_date DESC);
  END IF;
END $$;


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 4: VERIFICATION QUERIES (copy-paste into Supabase SQL Editor after apply)
-- ──────────────────────────────────────────────────────────────────────────────

-- ── VERIFY 1: Public tables still missing RLS (expect 0 rows) ───────────────
-- SELECT schemaname, tablename
-- FROM pg_tables
-- WHERE schemaname IN ('public', 'analytics')
--   AND rowsecurity = false
--   AND tablename NOT LIKE '\_%';

-- ── VERIFY 2: Overly permissive write policies (expect 0 rows) ───────────────
-- SELECT tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname IN ('public', 'analytics')
--   AND cmd IN ('INSERT','UPDATE','DELETE')
--   AND (qual = 'true' OR qual = '(auth.uid() IS NOT NULL)');

-- ── VERIFY 3: FK columns without indexes (expect 0 rows) ─────────────────────
-- SELECT tc.table_name, kcu.column_name,
--   'CREATE INDEX idx_' || tc.table_name || '_' || kcu.column_name
--   || ' ON public.' || tc.table_name || '(' || kcu.column_name || ');' AS fix
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.key_column_usage kcu
--   ON tc.constraint_name = kcu.constraint_name
--   AND tc.table_schema = kcu.table_schema
-- LEFT JOIN pg_indexes pi
--   ON pi.tablename = tc.table_name
--   AND pi.schemaname = 'public'
--   AND pi.indexdef LIKE '%' || kcu.column_name || '%'
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--   AND tc.table_schema = 'public'
--   AND pi.indexname IS NULL;
