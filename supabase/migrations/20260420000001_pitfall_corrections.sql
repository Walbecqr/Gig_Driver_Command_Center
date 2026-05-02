-- ============================================================
-- Migration: 20260420000001_pitfall_corrections
-- ============================================================
-- Addresses findings from the Supabase pitfall audit:
--   1. RLS enablement on all user-data tables (idempotent DO block)
--   2. Scoped RLS policies with DROP IF EXISTS guards (idempotent)
--   3. FK column indexes for all FK relationships (idempotent)
-- ============================================================


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 1: RLS ENABLEMENT (idempotent DO block)
-- ──────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'merchant_performance_snapshot',
    'zone_performance_snapshot',
    'delivery_platforms',
    'offer_feedback_tags',
    'offer_feedback_tag_assignments',
    'import_raw_records',
    'reconciliation_issues',
    'profiles',
    'user_settings',
    'vehicles',
    'vehicle_cost_profiles',
    'goals',
    'preferred_navigation_apps',
    'platform_accounts',
    'platform_connection_events',
    'shifts',
    'shift_segments',
    'shift_location_summaries',
    'offers',
    'offer_versions',
    'offer_recommendations',
    'trips',
    'deliveries',
    'stops',
    'trip_financials',
    'trip_metrics',
    'imports',
    'expenses',
    'cash_ledger_entries',
    'incidents'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      RAISE NOTICE 'RLS enabled on public.%', t;
    ELSE
      RAISE NOTICE 'Table public.% does not exist — skipping', t;
    END IF;
  END LOOP;
END $$;


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 2: RLS POLICIES (scoped, idempotent)
-- ──────────────────────────────────────────────────────────────────────────────

-- ── delivery_platforms (global reference table — SELECT only for authenticated) ──
DROP POLICY IF EXISTS "delivery_platforms_select" ON public.delivery_platforms;
CREATE POLICY "delivery_platforms_select"
  ON public.delivery_platforms FOR SELECT
  TO authenticated
  USING (true);

-- ── offer_feedback_tags (global reference table — SELECT only for authenticated) ──
DROP POLICY IF EXISTS "offer_feedback_tags_select" ON public.offer_feedback_tags;
CREATE POLICY "offer_feedback_tags_select"
  ON public.offer_feedback_tags FOR SELECT
  TO authenticated
  USING (true);

-- ── zone_performance_snapshot (global reference table — SELECT only for authenticated) ──
DROP POLICY IF EXISTS "zone_performance_snapshot_select" ON public.zone_performance_snapshot;
CREATE POLICY "zone_performance_snapshot_select"
  ON public.zone_performance_snapshot FOR SELECT
  TO authenticated
  USING (true);

-- ── profiles ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_delete"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- ── user_settings ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "user_settings_select" ON public.user_settings;
CREATE POLICY "user_settings_select"
  ON public.user_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_settings_insert" ON public.user_settings;
CREATE POLICY "user_settings_insert"
  ON public.user_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_settings_update" ON public.user_settings;
CREATE POLICY "user_settings_update"
  ON public.user_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_settings_delete" ON public.user_settings;
CREATE POLICY "user_settings_delete"
  ON public.user_settings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── vehicles ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "vehicles_select" ON public.vehicles;
CREATE POLICY "vehicles_select"
  ON public.vehicles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "vehicles_insert" ON public.vehicles;
CREATE POLICY "vehicles_insert"
  ON public.vehicles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "vehicles_update" ON public.vehicles;
CREATE POLICY "vehicles_update"
  ON public.vehicles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "vehicles_delete" ON public.vehicles;
CREATE POLICY "vehicles_delete"
  ON public.vehicles FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── vehicle_cost_profiles (owned transitively via vehicles.user_id) ───────────
DROP POLICY IF EXISTS "vehicle_cost_profiles_select" ON public.vehicle_cost_profiles;
CREATE POLICY "vehicle_cost_profiles_select"
  ON public.vehicle_cost_profiles FOR SELECT
  TO authenticated
  USING (vehicle_id IN (
    SELECT id FROM public.vehicles WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "vehicle_cost_profiles_insert" ON public.vehicle_cost_profiles;
CREATE POLICY "vehicle_cost_profiles_insert"
  ON public.vehicle_cost_profiles FOR INSERT
  TO authenticated
  WITH CHECK (vehicle_id IN (
    SELECT id FROM public.vehicles WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "vehicle_cost_profiles_update" ON public.vehicle_cost_profiles;
CREATE POLICY "vehicle_cost_profiles_update"
  ON public.vehicle_cost_profiles FOR UPDATE
  TO authenticated
  USING (vehicle_id IN (
    SELECT id FROM public.vehicles WHERE user_id = auth.uid()
  ))
  WITH CHECK (vehicle_id IN (
    SELECT id FROM public.vehicles WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "vehicle_cost_profiles_delete" ON public.vehicle_cost_profiles;
CREATE POLICY "vehicle_cost_profiles_delete"
  ON public.vehicle_cost_profiles FOR DELETE
  TO authenticated
  USING (vehicle_id IN (
    SELECT id FROM public.vehicles WHERE user_id = auth.uid()
  ));

-- ── goals ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "goals_select" ON public.goals;
CREATE POLICY "goals_select"
  ON public.goals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "goals_insert" ON public.goals;
CREATE POLICY "goals_insert"
  ON public.goals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "goals_update" ON public.goals;
CREATE POLICY "goals_update"
  ON public.goals FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "goals_delete" ON public.goals;
CREATE POLICY "goals_delete"
  ON public.goals FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── preferred_navigation_apps ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "preferred_navigation_apps_select" ON public.preferred_navigation_apps;
CREATE POLICY "preferred_navigation_apps_select"
  ON public.preferred_navigation_apps FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "preferred_navigation_apps_insert" ON public.preferred_navigation_apps;
CREATE POLICY "preferred_navigation_apps_insert"
  ON public.preferred_navigation_apps FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "preferred_navigation_apps_update" ON public.preferred_navigation_apps;
CREATE POLICY "preferred_navigation_apps_update"
  ON public.preferred_navigation_apps FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "preferred_navigation_apps_delete" ON public.preferred_navigation_apps;
CREATE POLICY "preferred_navigation_apps_delete"
  ON public.preferred_navigation_apps FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── platform_accounts ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "platform_accounts_select" ON public.platform_accounts;
CREATE POLICY "platform_accounts_select"
  ON public.platform_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "platform_accounts_insert" ON public.platform_accounts;
CREATE POLICY "platform_accounts_insert"
  ON public.platform_accounts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "platform_accounts_update" ON public.platform_accounts;
CREATE POLICY "platform_accounts_update"
  ON public.platform_accounts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "platform_accounts_delete" ON public.platform_accounts;
CREATE POLICY "platform_accounts_delete"
  ON public.platform_accounts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── platform_connection_events ────────────────────────────────────────────────
DROP POLICY IF EXISTS "platform_connection_events_select" ON public.platform_connection_events;
CREATE POLICY "platform_connection_events_select"
  ON public.platform_connection_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "platform_connection_events_insert" ON public.platform_connection_events;
CREATE POLICY "platform_connection_events_insert"
  ON public.platform_connection_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "platform_connection_events_update" ON public.platform_connection_events;
CREATE POLICY "platform_connection_events_update"
  ON public.platform_connection_events FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "platform_connection_events_delete" ON public.platform_connection_events;
CREATE POLICY "platform_connection_events_delete"
  ON public.platform_connection_events FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── shifts ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "shifts_select" ON public.shifts;
CREATE POLICY "shifts_select"
  ON public.shifts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "shifts_insert" ON public.shifts;
CREATE POLICY "shifts_insert"
  ON public.shifts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "shifts_update" ON public.shifts;
CREATE POLICY "shifts_update"
  ON public.shifts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "shifts_delete" ON public.shifts;
CREATE POLICY "shifts_delete"
  ON public.shifts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── shift_segments (owned transitively via shifts.user_id) ────────────────────
DROP POLICY IF EXISTS "shift_segments_select" ON public.shift_segments;
CREATE POLICY "shift_segments_select"
  ON public.shift_segments FOR SELECT
  TO authenticated
  USING (shift_id IN (
    SELECT id FROM public.shifts WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "shift_segments_insert" ON public.shift_segments;
CREATE POLICY "shift_segments_insert"
  ON public.shift_segments FOR INSERT
  TO authenticated
  WITH CHECK (shift_id IN (
    SELECT id FROM public.shifts WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "shift_segments_update" ON public.shift_segments;
CREATE POLICY "shift_segments_update"
  ON public.shift_segments FOR UPDATE
  TO authenticated
  USING (shift_id IN (
    SELECT id FROM public.shifts WHERE user_id = auth.uid()
  ))
  WITH CHECK (shift_id IN (
    SELECT id FROM public.shifts WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "shift_segments_delete" ON public.shift_segments;
CREATE POLICY "shift_segments_delete"
  ON public.shift_segments FOR DELETE
  TO authenticated
  USING (shift_id IN (
    SELECT id FROM public.shifts WHERE user_id = auth.uid()
  ));

-- ── shift_location_summaries (owned transitively via shifts.user_id) ──────────
DROP POLICY IF EXISTS "shift_location_summaries_select" ON public.shift_location_summaries;
CREATE POLICY "shift_location_summaries_select"
  ON public.shift_location_summaries FOR SELECT
  TO authenticated
  USING (shift_id IN (
    SELECT id FROM public.shifts WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "shift_location_summaries_insert" ON public.shift_location_summaries;
CREATE POLICY "shift_location_summaries_insert"
  ON public.shift_location_summaries FOR INSERT
  TO authenticated
  WITH CHECK (shift_id IN (
    SELECT id FROM public.shifts WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "shift_location_summaries_update" ON public.shift_location_summaries;
CREATE POLICY "shift_location_summaries_update"
  ON public.shift_location_summaries FOR UPDATE
  TO authenticated
  USING (shift_id IN (
    SELECT id FROM public.shifts WHERE user_id = auth.uid()
  ))
  WITH CHECK (shift_id IN (
    SELECT id FROM public.shifts WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "shift_location_summaries_delete" ON public.shift_location_summaries;
CREATE POLICY "shift_location_summaries_delete"
  ON public.shift_location_summaries FOR DELETE
  TO authenticated
  USING (shift_id IN (
    SELECT id FROM public.shifts WHERE user_id = auth.uid()
  ));

-- ── offers ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "offers_select" ON public.offers;
CREATE POLICY "offers_select"
  ON public.offers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "offers_insert" ON public.offers;
CREATE POLICY "offers_insert"
  ON public.offers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "offers_update" ON public.offers;
CREATE POLICY "offers_update"
  ON public.offers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "offers_delete" ON public.offers;
CREATE POLICY "offers_delete"
  ON public.offers FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── offer_versions (owned transitively via offers.user_id) ───────────────────
DROP POLICY IF EXISTS "offer_versions_select" ON public.offer_versions;
CREATE POLICY "offer_versions_select"
  ON public.offer_versions FOR SELECT
  TO authenticated
  USING (offer_id IN (
    SELECT id FROM public.offers WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "offer_versions_insert" ON public.offer_versions;
CREATE POLICY "offer_versions_insert"
  ON public.offer_versions FOR INSERT
  TO authenticated
  WITH CHECK (offer_id IN (
    SELECT id FROM public.offers WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "offer_versions_update" ON public.offer_versions;
CREATE POLICY "offer_versions_update"
  ON public.offer_versions FOR UPDATE
  TO authenticated
  USING (offer_id IN (
    SELECT id FROM public.offers WHERE user_id = auth.uid()
  ))
  WITH CHECK (offer_id IN (
    SELECT id FROM public.offers WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "offer_versions_delete" ON public.offer_versions;
CREATE POLICY "offer_versions_delete"
  ON public.offer_versions FOR DELETE
  TO authenticated
  USING (offer_id IN (
    SELECT id FROM public.offers WHERE user_id = auth.uid()
  ));

-- ── offer_recommendations (SELECT only — system-generated) ────────────────────
DROP POLICY IF EXISTS "offer_recommendations_select" ON public.offer_recommendations;
CREATE POLICY "offer_recommendations_select"
  ON public.offer_recommendations FOR SELECT
  TO authenticated
  USING (offer_id IN (
    SELECT id FROM public.offers WHERE user_id = auth.uid()
  ));

-- ── offer_feedback_tag_assignments (owned transitively via offers.user_id) ────
DROP POLICY IF EXISTS "offer_feedback_tag_assignments_select" ON public.offer_feedback_tag_assignments;
CREATE POLICY "offer_feedback_tag_assignments_select"
  ON public.offer_feedback_tag_assignments FOR SELECT
  TO authenticated
  USING (offer_id IN (
    SELECT id FROM public.offers WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "offer_feedback_tag_assignments_insert" ON public.offer_feedback_tag_assignments;
CREATE POLICY "offer_feedback_tag_assignments_insert"
  ON public.offer_feedback_tag_assignments FOR INSERT
  TO authenticated
  WITH CHECK (offer_id IN (
    SELECT id FROM public.offers WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "offer_feedback_tag_assignments_update" ON public.offer_feedback_tag_assignments;
CREATE POLICY "offer_feedback_tag_assignments_update"
  ON public.offer_feedback_tag_assignments FOR UPDATE
  TO authenticated
  USING (offer_id IN (
    SELECT id FROM public.offers WHERE user_id = auth.uid()
  ))
  WITH CHECK (offer_id IN (
    SELECT id FROM public.offers WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "offer_feedback_tag_assignments_delete" ON public.offer_feedback_tag_assignments;
CREATE POLICY "offer_feedback_tag_assignments_delete"
  ON public.offer_feedback_tag_assignments FOR DELETE
  TO authenticated
  USING (offer_id IN (
    SELECT id FROM public.offers WHERE user_id = auth.uid()
  ));

-- ── trips ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "trips_select" ON public.trips;
CREATE POLICY "trips_select"
  ON public.trips FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "trips_insert" ON public.trips;
CREATE POLICY "trips_insert"
  ON public.trips FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "trips_update" ON public.trips;
CREATE POLICY "trips_update"
  ON public.trips FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "trips_delete" ON public.trips;
CREATE POLICY "trips_delete"
  ON public.trips FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── trip_financials (owned transitively via trips.user_id) ────────────────────
DROP POLICY IF EXISTS "trip_financials_select" ON public.trip_financials;
CREATE POLICY "trip_financials_select"
  ON public.trip_financials FOR SELECT
  TO authenticated
  USING (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "trip_financials_insert" ON public.trip_financials;
CREATE POLICY "trip_financials_insert"
  ON public.trip_financials FOR INSERT
  TO authenticated
  WITH CHECK (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "trip_financials_update" ON public.trip_financials;
CREATE POLICY "trip_financials_update"
  ON public.trip_financials FOR UPDATE
  TO authenticated
  USING (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ))
  WITH CHECK (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "trip_financials_delete" ON public.trip_financials;
CREATE POLICY "trip_financials_delete"
  ON public.trip_financials FOR DELETE
  TO authenticated
  USING (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

-- ── trip_metrics (owned transitively via trips.user_id) ───────────────────────
DROP POLICY IF EXISTS "trip_metrics_select" ON public.trip_metrics;
CREATE POLICY "trip_metrics_select"
  ON public.trip_metrics FOR SELECT
  TO authenticated
  USING (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "trip_metrics_insert" ON public.trip_metrics;
CREATE POLICY "trip_metrics_insert"
  ON public.trip_metrics FOR INSERT
  TO authenticated
  WITH CHECK (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "trip_metrics_update" ON public.trip_metrics;
CREATE POLICY "trip_metrics_update"
  ON public.trip_metrics FOR UPDATE
  TO authenticated
  USING (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ))
  WITH CHECK (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "trip_metrics_delete" ON public.trip_metrics;
CREATE POLICY "trip_metrics_delete"
  ON public.trip_metrics FOR DELETE
  TO authenticated
  USING (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

-- ── deliveries (owned transitively via trips.user_id) ─────────────────────────
DROP POLICY IF EXISTS "deliveries_select" ON public.deliveries;
CREATE POLICY "deliveries_select"
  ON public.deliveries FOR SELECT
  TO authenticated
  USING (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "deliveries_insert" ON public.deliveries;
CREATE POLICY "deliveries_insert"
  ON public.deliveries FOR INSERT
  TO authenticated
  WITH CHECK (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "deliveries_update" ON public.deliveries;
CREATE POLICY "deliveries_update"
  ON public.deliveries FOR UPDATE
  TO authenticated
  USING (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ))
  WITH CHECK (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "deliveries_delete" ON public.deliveries;
CREATE POLICY "deliveries_delete"
  ON public.deliveries FOR DELETE
  TO authenticated
  USING (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

-- ── stops (owned transitively via deliveries → trips.user_id) ─────────────────
-- Note: stops.trip_id is a direct FK on the trips table in the current schema.
-- If stops uses delivery_id, substitute the sub-select accordingly.
DROP POLICY IF EXISTS "stops_select" ON public.stops;
CREATE POLICY "stops_select"
  ON public.stops FOR SELECT
  TO authenticated
  USING (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "stops_insert" ON public.stops;
CREATE POLICY "stops_insert"
  ON public.stops FOR INSERT
  TO authenticated
  WITH CHECK (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "stops_update" ON public.stops;
CREATE POLICY "stops_update"
  ON public.stops FOR UPDATE
  TO authenticated
  USING (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ))
  WITH CHECK (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "stops_delete" ON public.stops;
CREATE POLICY "stops_delete"
  ON public.stops FOR DELETE
  TO authenticated
  USING (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

-- ── imports ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "imports_select" ON public.imports;
CREATE POLICY "imports_select"
  ON public.imports FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "imports_insert" ON public.imports;
CREATE POLICY "imports_insert"
  ON public.imports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "imports_update" ON public.imports;
CREATE POLICY "imports_update"
  ON public.imports FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "imports_delete" ON public.imports;
CREATE POLICY "imports_delete"
  ON public.imports FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── import_raw_records (owned transitively via imports.user_id) ───────────────
DROP POLICY IF EXISTS "import_raw_records_select" ON public.import_raw_records;
CREATE POLICY "import_raw_records_select"
  ON public.import_raw_records FOR SELECT
  TO authenticated
  USING (import_id IN (
    SELECT id FROM public.imports WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "import_raw_records_insert" ON public.import_raw_records;
CREATE POLICY "import_raw_records_insert"
  ON public.import_raw_records FOR INSERT
  TO authenticated
  WITH CHECK (import_id IN (
    SELECT id FROM public.imports WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "import_raw_records_update" ON public.import_raw_records;
CREATE POLICY "import_raw_records_update"
  ON public.import_raw_records FOR UPDATE
  TO authenticated
  USING (import_id IN (
    SELECT id FROM public.imports WHERE user_id = auth.uid()
  ))
  WITH CHECK (import_id IN (
    SELECT id FROM public.imports WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "import_raw_records_delete" ON public.import_raw_records;
CREATE POLICY "import_raw_records_delete"
  ON public.import_raw_records FOR DELETE
  TO authenticated
  USING (import_id IN (
    SELECT id FROM public.imports WHERE user_id = auth.uid()
  ));

-- ── reconciliation_issues (owned transitively via trips.user_id) ──────────────
DROP POLICY IF EXISTS "reconciliation_issues_select" ON public.reconciliation_issues;
CREATE POLICY "reconciliation_issues_select"
  ON public.reconciliation_issues FOR SELECT
  TO authenticated
  USING (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "reconciliation_issues_insert" ON public.reconciliation_issues;
CREATE POLICY "reconciliation_issues_insert"
  ON public.reconciliation_issues FOR INSERT
  TO authenticated
  WITH CHECK (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "reconciliation_issues_update" ON public.reconciliation_issues;
CREATE POLICY "reconciliation_issues_update"
  ON public.reconciliation_issues FOR UPDATE
  TO authenticated
  USING (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ))
  WITH CHECK (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "reconciliation_issues_delete" ON public.reconciliation_issues;
CREATE POLICY "reconciliation_issues_delete"
  ON public.reconciliation_issues FOR DELETE
  TO authenticated
  USING (trip_id IN (
    SELECT trip_id FROM public.trips WHERE user_id = auth.uid()
  ));

-- ── expenses ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
CREATE POLICY "expenses_select"
  ON public.expenses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
CREATE POLICY "expenses_insert"
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "expenses_update" ON public.expenses;
CREATE POLICY "expenses_update"
  ON public.expenses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;
CREATE POLICY "expenses_delete"
  ON public.expenses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── cash_ledger_entries ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cash_ledger_entries_select" ON public.cash_ledger_entries;
CREATE POLICY "cash_ledger_entries_select"
  ON public.cash_ledger_entries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "cash_ledger_entries_insert" ON public.cash_ledger_entries;
CREATE POLICY "cash_ledger_entries_insert"
  ON public.cash_ledger_entries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cash_ledger_entries_update" ON public.cash_ledger_entries;
CREATE POLICY "cash_ledger_entries_update"
  ON public.cash_ledger_entries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cash_ledger_entries_delete" ON public.cash_ledger_entries;
CREATE POLICY "cash_ledger_entries_delete"
  ON public.cash_ledger_entries FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── incidents ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "incidents_select" ON public.incidents;
CREATE POLICY "incidents_select"
  ON public.incidents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "incidents_insert" ON public.incidents;
CREATE POLICY "incidents_insert"
  ON public.incidents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "incidents_update" ON public.incidents;
CREATE POLICY "incidents_update"
  ON public.incidents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "incidents_delete" ON public.incidents;
CREATE POLICY "incidents_delete"
  ON public.incidents FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── merchant_performance_snapshot (owned transitively via platform_accounts.user_id) ──
DROP POLICY IF EXISTS "merchant_performance_snapshot_select" ON public.merchant_performance_snapshot;
CREATE POLICY "merchant_performance_snapshot_select"
  ON public.merchant_performance_snapshot FOR SELECT
  TO authenticated
  USING (merchant_id IN (
    SELECT id FROM public.platform_accounts WHERE user_id = auth.uid()
  ));


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 3: FK INDEXES (all idempotent via CREATE INDEX IF NOT EXISTS)
-- ──────────────────────────────────────────────────────────────────────────────

-- platform_accounts
CREATE INDEX IF NOT EXISTS idx_platform_accounts_user_id
  ON public.platform_accounts (user_id);

-- platform_connection_events
CREATE INDEX IF NOT EXISTS idx_platform_connection_events_user_id
  ON public.platform_connection_events (user_id);

-- shifts
CREATE INDEX IF NOT EXISTS idx_shifts_user_id
  ON public.shifts (user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_user_started_at
  ON public.shifts (user_id, started_at DESC);

-- shift_segments
CREATE INDEX IF NOT EXISTS idx_shift_segments_shift_id
  ON public.shift_segments (shift_id);

-- shift_location_summaries
CREATE INDEX IF NOT EXISTS idx_shift_location_summaries_shift_id
  ON public.shift_location_summaries (shift_id);

-- offers
CREATE INDEX IF NOT EXISTS idx_offers_user_id
  ON public.offers (user_id);
CREATE INDEX IF NOT EXISTS idx_offers_shift_id
  ON public.offers (shift_id);
CREATE INDEX IF NOT EXISTS idx_offers_platform_account_id
  ON public.offers (platform_account_id);
CREATE INDEX IF NOT EXISTS idx_offers_user_created_at
  ON public.offers (user_id, created_at DESC);

-- offer_versions
CREATE INDEX IF NOT EXISTS idx_offer_versions_offer_id
  ON public.offer_versions (offer_id);

-- offer_recommendations
CREATE INDEX IF NOT EXISTS idx_offer_recommendations_offer_id
  ON public.offer_recommendations (offer_id);

-- offer_feedback_tag_assignments
CREATE INDEX IF NOT EXISTS idx_offer_tag_assignments_offer_id
  ON public.offer_feedback_tag_assignments (offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_tag_assignments_tag_id
  ON public.offer_feedback_tag_assignments (feedback_tag_id);

-- trips
CREATE INDEX IF NOT EXISTS idx_trips_user_id
  ON public.trips (user_id);
CREATE INDEX IF NOT EXISTS idx_trips_shift_id
  ON public.trips (shift_id);
CREATE INDEX IF NOT EXISTS idx_trips_platform_account_id
  ON public.trips (platform_account_id);
CREATE INDEX IF NOT EXISTS idx_trips_user_started_at
  ON public.trips (user_id, started_at DESC);

-- trip_financials
CREATE INDEX IF NOT EXISTS idx_trip_financials_trip_id
  ON public.trip_financials (trip_id);

-- trip_metrics
CREATE INDEX IF NOT EXISTS idx_trip_metrics_trip_id
  ON public.trip_metrics (trip_id);

-- deliveries
CREATE INDEX IF NOT EXISTS idx_deliveries_trip_id
  ON public.deliveries (trip_id);

-- stops
CREATE INDEX IF NOT EXISTS idx_stops_delivery_id
  ON public.stops (delivery_id);

-- imports
CREATE INDEX IF NOT EXISTS idx_imports_user_id
  ON public.imports (user_id);

-- import_raw_records
CREATE INDEX IF NOT EXISTS idx_import_raw_records_import_id
  ON public.import_raw_records (import_id);

-- reconciliation_issues
CREATE INDEX IF NOT EXISTS idx_reconciliation_issues_trip_id
  ON public.reconciliation_issues (trip_id);

-- expenses
CREATE INDEX IF NOT EXISTS idx_expenses_user_id
  ON public.expenses (user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_shift_id
  ON public.expenses (shift_id);

-- cash_ledger_entries
CREATE INDEX IF NOT EXISTS idx_cash_ledger_user_id
  ON public.cash_ledger_entries (user_id);
CREATE INDEX IF NOT EXISTS idx_cash_ledger_shift_id
  ON public.cash_ledger_entries (shift_id);
CREATE INDEX IF NOT EXISTS idx_cash_ledger_user_occurred_at
  ON public.cash_ledger_entries (user_id, occurred_at DESC);

-- incidents
CREATE INDEX IF NOT EXISTS idx_incidents_user_id
  ON public.incidents (user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_shift_id
  ON public.incidents (shift_id);
CREATE INDEX IF NOT EXISTS idx_incidents_trip_id
  ON public.incidents (trip_id);

-- merchant_performance_snapshot
CREATE INDEX IF NOT EXISTS idx_merchant_perf_snapshot_merchant_id
  ON public.merchant_performance_snapshot (merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_perf_snapshot_date
  ON public.merchant_performance_snapshot (snapshot_date DESC);

-- zone_performance_snapshot
CREATE INDEX IF NOT EXISTS idx_zone_perf_snapshot_zone_id
  ON public.zone_performance_snapshot (zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_perf_snapshot_platform_id
  ON public.zone_performance_snapshot (platform_id);
CREATE INDEX IF NOT EXISTS idx_zone_perf_snapshot_zone_date
  ON public.zone_performance_snapshot (zone_id, snapshot_date DESC);


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 4: VERIFICATION QUERIES (copy-paste into Supabase SQL Editor after apply)
-- ──────────────────────────────────────────────────────────────────────────────

-- ── VERIFY 1: Tables still missing RLS (expect 0 rows) ──────────────────────
-- SELECT schemaname, tablename
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND rowsecurity = false
--   AND tablename NOT LIKE '\_%';

-- ── VERIFY 2: Overly permissive write policies (expect 0 rows) ───────────────
-- SELECT tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
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
