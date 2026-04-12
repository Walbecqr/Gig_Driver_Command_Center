-- ============================================================
-- Migration: Zone metric registry for controlled demographic keys
-- ============================================================
-- Adds:
--   • public.zone_metric_registry (authoritative metric-key catalog)
--   • updated_at trigger for mutable table behavior
-- ============================================================

CREATE TABLE IF NOT EXISTS public.zone_metric_registry (
  zone_metric_registry_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key text NOT NULL UNIQUE,
  metric_label text NOT NULL,
  metric_category text NOT NULL,
  metric_family text NOT NULL,
  value_type text NOT NULL,
  units text,
  source_scope text NOT NULL,
  default_h3_resolution integer,
  preferred_boundary_type text,
  is_derived boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  source_priority integer NOT NULL DEFAULT 100,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT zone_metric_registry_metric_key_not_blank
    CHECK (length(trim(metric_key)) > 0),

  CONSTRAINT zone_metric_registry_metric_label_not_blank
    CHECK (length(trim(metric_label)) > 0),

  CONSTRAINT zone_metric_registry_metric_category_not_blank
    CHECK (length(trim(metric_category)) > 0),

  CONSTRAINT zone_metric_registry_metric_family_not_blank
    CHECK (length(trim(metric_family)) > 0),

  CONSTRAINT zone_metric_registry_value_type_not_blank
    CHECK (length(trim(value_type)) > 0),

  CONSTRAINT zone_metric_registry_source_scope_not_blank
    CHECK (length(trim(source_scope)) > 0),

  CONSTRAINT zone_metric_registry_default_h3_resolution_valid
    CHECK (
      default_h3_resolution IS NULL
      OR default_h3_resolution IN (6, 7, 8, 9)
    ),

  CONSTRAINT zone_metric_registry_source_priority_positive
    CHECK (source_priority > 0)
);

DROP TRIGGER IF EXISTS trg_zone_metric_registry_set_updated_at
  ON public.zone_metric_registry;

CREATE TRIGGER trg_zone_metric_registry_set_updated_at
  BEFORE UPDATE ON public.zone_metric_registry
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
