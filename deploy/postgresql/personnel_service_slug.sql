ALTER TABLE public.personnel
  ADD COLUMN IF NOT EXISTS service_slug text;

UPDATE public.personnel
SET service_slug = 'rectorat'
WHERE service_slug IS NULL
  AND lower(role) LIKE '%recteur%'
  AND EXISTS (
    SELECT 1
    FROM public.services
    WHERE slug = 'rectorat'
      AND published = true
  );
