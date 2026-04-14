-- Add staged review state for import batches.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'review_pending'
      AND enumtypid = 'public.import_status_enum'::regtype
  ) THEN
    ALTER TYPE public.import_status_enum ADD VALUE 'review_pending' AFTER 'processing';
  END IF;
END $$;
