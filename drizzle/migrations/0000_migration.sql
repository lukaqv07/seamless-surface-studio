CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 150),
  author text NOT NULL CHECK (char_length(author) BETWEEN 2 AND 60),
  content text NOT NULL CHECK (char_length(content) BETWEEN 10 AND 20000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author text NOT NULL CHECK (char_length(author) BETWEEN 2 AND 60),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.posts TO anon, authenticated;
GRANT SELECT, INSERT ON public.comments TO anon, authenticated;
GRANT ALL ON public.posts TO service_role;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read posts" ON public.posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "write posts" ON public.posts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "read comments" ON public.comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "write comments" ON public.comments FOR INSERT TO anon, authenticated WITH CHECK (true);
INSERT INTO public.posts (title, author, content) VALUES
('Dobrodošli na blog', 'Urednik', 'Ovo je prva objava na našem blogu. Ovdje možete čitati priče, pisati vlastite objave i komentirati tuđe. Sve se sprema u bazu podataka.'),
('Jutarnja kava u Zagrebu', 'Ana', 'Nema ništa bolje od subotnje špice na Cvjetnom trgu. Kava, novine i ljudi koji se šeću — to je pravi zagrebački ritual.');