-- GovPlot Tracker — DB Migration v3.2
-- Run in Supabase SQL Editor BEFORE deploying scraper v3.2
-- Safe to run multiple times (IF NOT EXISTS)

ALTER TABLE public.schemes
  ADD COLUMN IF NOT EXISTS data_source VARCHAR(10) NOT NULL DEFAULT 'STATIC';

ALTER TABLE public.schemes
  ADD COLUMN IF NOT EXISTS scraper_status VARCHAR(20) NOT NULL DEFAULT 'ok';

CREATE INDEX IF NOT EXISTS idx_schemes_data_source ON public.schemes (data_source);
CREATE INDEX IF NOT EXISTS idx_schemes_scraper_status ON public.schemes (scraper_status);

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name='schemes'
  AND column_name IN ('data_source','scraper_status')
ORDER BY column_name;
