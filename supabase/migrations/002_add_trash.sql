-- Pipe Dream 增量迁移：添加软删除 + 修复权限
-- 在 Supabase SQL Editor 中执行：https://supabase.com/dashboard/project/rilzinllsxwiqodaqbah/sql/new

-- 1. 添加 deleted_at 字段（软删除用）
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. 确保所有权限到位
GRANT ALL ON public.posts TO authenticated;
GRANT SELECT ON public.posts TO anon;

-- 3. 重建 RLS 策略（包含软删除过滤）
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 先删除所有旧策略
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'posts' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.posts';
  END LOOP;
END $$;

-- 公开帖子可读（排除已删除）
CREATE POLICY "public_read" ON public.posts
  FOR SELECT USING (
    visibility = 'public'
    AND is_draft = FALSE
    AND deleted_at IS NULL
  );

-- 登录用户可读自己的帖子（排除已删除，除非在回收站查看）
CREATE POLICY "owner_read" ON public.posts
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- 登录用户可创建（触发器自动设置 user_id）
CREATE POLICY "owner_insert" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 登录用户可更新自己的帖子
CREATE POLICY "owner_update" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

-- 登录用户可删除自己的帖子（硬删除，回收站用软删除即更新 deleted_at）
CREATE POLICY "owner_delete" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- 4. 确认触发器存在
DROP TRIGGER IF EXISTS trg_posts_set_user_id ON public.posts;
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_posts_set_user_id
  BEFORE INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();
