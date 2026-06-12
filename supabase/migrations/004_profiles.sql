-- profiles 表：用户资料（侧栏 XRT + 画板 Towa 通用）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  profile_type TEXT DEFAULT 'side',   -- 'side' = 侧栏, 'canvas' = 画板Towa
  name TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  cover_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_owner_all" ON public.profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
