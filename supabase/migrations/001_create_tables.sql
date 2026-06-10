-- ============================================
-- Pipe Dream — Supabase 数据库初始化迁移
-- 使用方法：
--   1. 在 Supabase Dashboard → SQL Editor 中执行此脚本
--   2. 或使用 Supabase CLI: supabase migration up
-- ============================================

-- ===== 1. 创建 posts 表 =====
CREATE TABLE IF NOT EXISTS public.posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL DEFAULT '日常'
              CHECK (type IN ('日常', '碎碎念', '情景剧', '时间线总览')),
  subtype     TEXT
              CHECK (subtype IS NULL OR subtype IN ('亲密', '约会', '日常')),
  tags        TEXT[] DEFAULT '{}',
  visibility  TEXT NOT NULL DEFAULT 'public'
              CHECK (visibility IN ('public', 'private')),
  images      TEXT[] DEFAULT '{}',
  video       TEXT,
  is_draft    BOOLEAN DEFAULT FALSE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 索引：加速常用查询
CREATE INDEX IF NOT EXISTS idx_posts_created_at   ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type          ON public.posts (type);
CREATE INDEX IF NOT EXISTS idx_posts_visibility    ON public.posts (visibility);
CREATE INDEX IF NOT EXISTS idx_posts_is_draft      ON public.posts (is_draft);
CREATE INDEX IF NOT EXISTS idx_posts_user_id       ON public.posts (user_id);
-- 全文搜索索引（关键词搜索标题和内容）
CREATE INDEX IF NOT EXISTS idx_posts_title_search  ON public.posts USING gin (to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_posts_tags          ON public.posts USING gin (tags);

-- ===== 2. 开启 Row Level Security =====
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- ===== 3. RLS 策略定义 =====

-- 策略 1：所有人可读公开帖子（非草稿）
CREATE POLICY "公开帖子所有人可读"
  ON public.posts
  FOR SELECT
  USING (
    visibility = 'public'
    AND is_draft = FALSE
  );

-- 策略 2：已认证用户可读自己的全部帖子
CREATE POLICY "登录用户可读自己的帖子"
  ON public.posts
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  );

-- 策略 3：已认证用户可创建帖子
CREATE POLICY "登录用户可创建帖子"
  ON public.posts
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  );

-- 策略 4：已认证用户可更新自己的帖子
CREATE POLICY "登录用户可更新自己的帖子"
  ON public.posts
  FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  );

-- 策略 5：已认证用户可删除自己的帖子
CREATE POLICY "登录用户可删除自己的帖子"
  ON public.posts
  FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  );

-- ===== 4. 创建存储桶（Storage） =====
-- 注意：Storage 的创建需要在 Supabase Dashboard 中手动操作
-- 或者在 SQL Editor 中执行以下 INSERT：
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('posts-media', 'posts-media', true);
--
-- Storage 策略：
-- CREATE POLICY "公开读取媒体文件"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'posts-media');
--
-- CREATE POLICY "登录用户可上传媒体"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'posts-media'
--     AND auth.role() = 'authenticated'
--   );

-- ===== 5. 创建函数：自动设置 user_id =====
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 插入帖子时自动设置 user_id
CREATE TRIGGER trg_posts_set_user_id
  BEFORE INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

-- ============================================
-- 完成！接下来需要在 Supabase Dashboard 中：
-- 1. 创建 Storage 桶 (名称: posts-media, 公开)
-- 2. 设置 Storage 的 RLS 策略
-- 3. 创建一个用户 (Authentication → Users → Add User)
--    作为你的管理员账户
-- ============================================
