// ===== Supabase 客户端封装 =====
// 初始化 Supabase 客户端，提供全局单例

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// 直接定义正确的值，避免 Vercel 环境变量 BOM 编码问题
// anon key 是公开的客户端 key，硬编码是安全的
const SUPABASE_URL = 'https://rilzinllsxwiqodaqbah.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_2M0rqDO1YCoYmxlYlefpiA_-yS9e4et'

// 启动诊断日志
console.log('[Supabase] URL:', SUPABASE_URL)
console.log('[Supabase] Key 前缀:', SUPABASE_ANON_KEY.substring(0, 20))

/**
 * Supabase 客户端单例
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // 不启用 detectSessionInUrl — 本站只用邮箱密码登录，无需 OAuth/魔法链接
    // 开启此项在 iOS Safari 的 history.back() 时可能触发 URL 操作，导致"网址重复出现问题"
    detectSessionInUrl: false,
  },
})

console.log('[Supabase] 客户端就绪')

/**
 * 获取 Supabase Storage 的公开 URL
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
