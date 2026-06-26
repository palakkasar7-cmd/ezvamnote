ALTER TABLE public.note_files ADD COLUMN IF NOT EXISTS cover_name text;

CREATE TABLE IF NOT EXISTS public.product_overrides (
  slug text PRIMARY KEY,
  cover_name text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.product_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_overrides TO authenticated;
GRANT ALL ON public.product_overrides TO service_role;

ALTER TABLE public.product_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product overrides"
  ON public.product_overrides FOR SELECT
  USING (true);

CREATE POLICY "Admins manage product overrides"
  ON public.product_overrides FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));