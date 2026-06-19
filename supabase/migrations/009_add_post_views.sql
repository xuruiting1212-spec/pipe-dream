-- Pipe Dream 增量迁移：添加帖子浏览量统计
-- 在 Supabase SQL Editor 中执行：https://supabase.com/dashboard/project/rilzinllsxwiqodaqbah/sql/new
--
-- 需求：
--  1. 每篇帖子独立统计浏览量
--  2. 同一访客 24 小时内重复访问不重复计数
--  3. 作者（登录用户）访问自己的帖子不计入
--  4. 浏览量仅作者可见（前端控制）

-- ============================================================
-- 1. 创建浏览记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS public.post_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  visitor_token TEXT NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. 索引
-- ============================================================
-- 按帖子统计浏览量
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);

-- 24 小时去重查询：同一访客对同一帖子的最近访问
CREATE INDEX IF NOT EXISTS idx_post_views_lookup
  ON public.post_views(post_id, visitor_token, viewed_at DESC);

-- ============================================================
-- 3. 权限
-- ============================================================
GRANT INSERT, SELECT ON public.post_views TO anon, authenticated;

-- ============================================================
-- 4. RLS 策略
-- ============================================================
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- 任何人都可以记录浏览（匿名访客 + 登录用户）
CREATE POLICY "anyone_insert" ON public.post_views
  FOR INSERT WITH CHECK (true);

-- 任何人都可以查看统计数据（前端只计算 COUNT，不需要具体记录）
CREATE POLICY "anyone_select" ON public.post_views
  FOR SELECT USING (true);
