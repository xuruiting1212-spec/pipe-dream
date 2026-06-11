-- Towa 画板数据库迁移
-- 在 Supabase SQL Editor 中执行
-- https://supabase.com/dashboard/project/rilzinllsxwiqodaqbah/sql/new

-- 1. towa_posts 表（Towa的发布，继承 posts 结构但有独立的 user 标记）
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_type TEXT DEFAULT 'me';
-- author_type: 'me' = 我的发布, 'towa' = Towa的记录点滴

-- 2. towa_profile 表（人物卡片配置）
CREATE TABLE IF NOT EXISTS public.towa_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT DEFAULT 'Towa',
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  cover_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. moods 表（心情记录）
CREATE TABLE IF NOT EXISTS public.moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL,
  my_mood TEXT,      -- '心动'/'开心'/'生气'/'兴奋'/'伤心'/'心累'/'平静'/'烦躁'
  towa_mood TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 4. canvas_items 表（自由画板贴纸/文字/图片）
CREATE TABLE IF NOT EXISTS public.canvas_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL DEFAULT 'sticker',
  content TEXT DEFAULT '',
  pos_x REAL DEFAULT 100,
  pos_y REAL DEFAULT 100,
  width REAL DEFAULT 100,
  height REAL DEFAULT 100,
  rotation REAL DEFAULT 0,
  color TEXT,
  font_size INTEGER DEFAULT 16,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. sketchbook 表（速写本，存草稿）
CREATE TABLE IF NOT EXISTS public.sketchbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT DEFAULT '',
  content TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  video TEXT,
  visibility TEXT DEFAULT 'public',
  is_draft BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 全部授权
GRANT ALL ON public.towa_profile TO authenticated;
GRANT ALL ON public.moods TO authenticated;
GRANT ALL ON public.canvas_items TO authenticated;
GRANT ALL ON public.sketchbook TO authenticated;
GRANT SELECT ON public.towa_profile TO anon;
GRANT SELECT ON public.moods TO anon;
GRANT SELECT ON public.canvas_items TO anon;

-- 7. RLS for towa_profile
ALTER TABLE public.towa_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profile_owner_all" ON public.towa_profile FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "profile_public_read" ON public.towa_profile FOR SELECT USING (true);

-- 8. RLS for moods
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "moods_owner_all" ON public.moods FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "moods_public_read" ON public.moods FOR SELECT USING (true);

-- 9. RLS for canvas_items
ALTER TABLE public.canvas_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "canvas_owner_all" ON public.canvas_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "canvas_public_read" ON public.canvas_items FOR SELECT USING (true);

-- 10. RLS for sketchbook
ALTER TABLE public.sketchbook ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sketch_owner_all" ON public.sketchbook FOR ALL USING (auth.uid() = user_id);
