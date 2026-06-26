
CREATE TABLE public.note_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  chapter_number integer NOT NULL,
  title text NOT NULL,
  pdf_url text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, chapter_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.note_chapters TO authenticated;
GRANT ALL ON public.note_chapters TO service_role;

ALTER TABLE public.note_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view chapters" ON public.note_chapters
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage chapters" ON public.note_chapters
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_note_chapters_updated_at
  BEFORE UPDATE ON public.note_chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
