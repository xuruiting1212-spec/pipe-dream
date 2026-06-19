-- Pipe Dream 增量迁移：添加音频字段
-- 在 Supabase SQL Editor 中执行：https://supabase.com/dashboard/project/rilzinllsxwiqodaqbah/sql/new
--
-- 新增：
--  audio            — 音频文件 URL（Supabase Storage）
--  audio_transcript — 转文字内容
--  audio_transcript_confirmed — 作者是否已确认转文字内容

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS audio TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS audio_transcript TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS audio_transcript_confirmed BOOLEAN DEFAULT FALSE;
