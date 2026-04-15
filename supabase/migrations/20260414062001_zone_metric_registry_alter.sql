-- ============================================================
-- Migration: Add catalog columns to zone_metric_registry
-- ============================================================
-- zone_metric_registry was created by 20260414060001 with a narrow
-- schema. This migration adds the full catalog columns so the seed
-- migration (20260414062002) can INSERT against them.
--
-- Must be a separate committed transaction from the seed so the
-- column additions are visible when the INSERT runs.
-- ============================================================

ALTER TABLE public.zone_metric_registry
  ADD COLUMN IF NOT EXISTS metric_label            text,
  ADD COLUMN IF NOT EXISTS metric_category         text,
  ADD COLUMN IF NOT EXISTS metric_family           text,
  ADD COLUMN IF NOT EXISTS value_type              text,
  ADD COLUMN IF NOT EXISTS source_scope            text,
  ADD COLUMN IF NOT EXISTS default_h3_resolution   integer,
  ADD COLUMN IF NOT EXISTS preferred_boundary_type text,
  ADD COLUMN IF NOT EXISTS is_derived              boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_priority         integer NOT NULL DEFAULT 100;

-- display_name was NOT NULL in the original schema but is superseded by
-- metric_label in the new catalog schema. Drop the constraint so that
-- new rows inserted by the seed migration (which omit display_name) succeed.
ALTER TABLE public.zone_metric_registry
  ALTER COLUMN display_name DROP NOT NULL;

-- Backfill metric_label from legacy display_name for pre-existing rows.
UPDATE public.zone_metric_registry
  SET metric_label = display_name
  WHERE metric_label IS NULL AND display_name IS NOT NULL;
