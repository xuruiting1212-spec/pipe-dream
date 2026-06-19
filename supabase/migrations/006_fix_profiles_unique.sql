-- ===== 修复 profiles 表的 UNIQUE 约束 =====
-- 问题：user_id 有 UNIQUE 约束，一个用户只能有一行 profile
-- 但我们需要两行：profile_type='side'（侧栏）和 profile_type='canvas'（画板Towa）
-- 解决：删掉 user_id UNIQUE，换成 (user_id, profile_type) 组合 UNIQUE

-- 1. 删掉旧的 UNIQUE 约束
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;

-- 2. 确保 user_id 可以重复（但每个 user 每个 profile_type 唯一）
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_type
  ON public.profiles (user_id, profile_type);

-- 3. 如果之前因为 UNIQUE 冲突导致 canvas 那行没写入成功，
--    可以手动清理一下旧数据（可选，不影响功能）
