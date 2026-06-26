
-- Role enum + user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Security definer role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Seed: make the existing user admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('dba0f641-5cd0-48ce-b080-1b0723d1984c', 'admin')
ON CONFLICT DO NOTHING;

-- Track uploaded note files per product slug
CREATE TABLE public.note_files (
  slug text PRIMARY KEY,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  size_bytes bigint NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.note_files TO authenticated;
GRANT ALL ON public.note_files TO service_role;

ALTER TABLE public.note_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage note files" ON public.note_files
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage policies for the 'notes' bucket (created via tool)
CREATE POLICY "Admins can upload notes" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'notes' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update notes" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'notes' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete notes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'notes' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read notes" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'notes' AND public.has_role(auth.uid(), 'admin'));
