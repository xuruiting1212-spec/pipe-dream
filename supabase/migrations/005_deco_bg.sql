-- profiles 表新增装饰背景字段
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sidebar_deco_url   TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sidebar_deco_thumb TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS main_deco_url      TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS main_deco_thumb    TEXT;
