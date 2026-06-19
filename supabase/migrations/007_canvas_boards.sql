-- canvas_boards 画板存档表
CREATE TABLE IF NOT EXISTS public.canvas_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL DEFAULT '画板 1',
  items_data JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.canvas_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boards_owner_all" ON public.canvas_boards FOR ALL USING (auth.uid() = user_id);

-- 允许 anon 读取（公开浏览画板）
CREATE POLICY "boards_public_read" ON public.canvas_boards FOR SELECT USING (true);
