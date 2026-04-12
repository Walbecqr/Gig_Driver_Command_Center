-- ============================================================
-- Migration: Optional governance FK for zone_demographics.metric_key
-- ============================================================
-- Adds a NOT VALID FK if zone_demographics exists.
-- This allows existing rows to remain until cleanup/validation.
-- ============================================================

DO $$
BEGIN
  IF to_regclass('public.zone_demographics') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'fk_zone_demographics_metric_key_registry'
         AND conrelid = 'public.zone_demographics'::regclass
     ) THEN
    EXECUTE $stmt$
      ALTER TABLE public.zone_demographics
      ADD CONSTRAINT fk_zone_demographics_metric_key_registry
      FOREIGN KEY (metric_key)
      REFERENCES public.zone_metric_registry(metric_key)
      NOT VALID
    $stmt$;
  END IF;
END
$$;
