-- 修复 Towa 帖子的分类和作者类型
-- 将画板"记录点滴"发布的历史帖子统一改为正确分类

-- 1. Towa 的帖子类型统一改为 '时间线总览'（不归属日常/碎碎念/情景剧）
UPDATE public.posts SET type = '时间线总览' WHERE author_type = 'towa' AND type != '时间线总览';

-- 2. 确保所有 Towa 帖子都是公开的
UPDATE public.posts SET visibility = 'public' WHERE author_type = 'towa' AND visibility != 'public';
