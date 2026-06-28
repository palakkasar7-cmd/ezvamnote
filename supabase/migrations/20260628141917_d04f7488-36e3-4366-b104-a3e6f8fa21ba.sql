
CREATE TABLE public.custom_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Full Subject',
  author TEXT NOT NULL DEFAULT '',
  pages INTEGER NOT NULL DEFAULT 0,
  price INTEGER NOT NULL DEFAULT 0,
  original_price INTEGER,
  rating NUMERIC NOT NULL DEFAULT 5,
  reviews INTEGER NOT NULL DEFAULT 0,
  cover TEXT NOT NULL DEFAULT 'physics',
  tagline TEXT NOT NULL DEFAULT '',
  chapters TEXT[] NOT NULL DEFAULT '{}',
  highlights TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_products TO authenticated;
GRANT ALL ON public.custom_products TO service_role;

ALTER TABLE public.custom_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view custom products"
  ON public.custom_products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage custom products"
  ON public.custom_products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_custom_products_updated_at
  BEFORE UPDATE ON public.custom_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
