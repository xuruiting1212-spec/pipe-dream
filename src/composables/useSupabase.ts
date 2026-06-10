// ===== Supabase 客户端封装 =====
// 初始化 Supabase 客户端，提供全局单例

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 请在 .env 文件中配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
}

/**
 * Supabase 客户端单例
 * 使用 anon key 初始化，配合 RLS 策略控制数据访问权限
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,           // 持久化登录状态
    autoRefreshToken: true,         // 自动刷新 token
    detectSessionInUrl: true,       // 从 URL 检测 OAuth 回调
  },
})

/**
 * 获取 Supabase Storage 的公开 URL
 * @param bucket - 存储桶名称
 * @param path - 文件路径
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
