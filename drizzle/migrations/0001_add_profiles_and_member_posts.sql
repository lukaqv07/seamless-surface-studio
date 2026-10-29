CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 60),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles readable by all" ON public.profiles
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "owner can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  name_guess text;
BEGIN
  name_guess := coalesce(
    nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Netko'
  );
  IF char_length(name_guess) > 60 THEN
    name_guess := left(name_guess, 60);
  END IF;
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, name_guess)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.posts ADD COLUMN author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

REVOKE INSERT ON public.posts FROM anon;

DROP POLICY "write posts" ON public.posts;

CREATE POLICY "members publish own posts" ON public.posts
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());