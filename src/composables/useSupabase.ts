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
    // 生产环境关键配置：避免 Vercel 部署时的重定向问题
    flowType: 'pkce',
  },
  global: {
    // 生产环境调试：捕获所有请求错误
    fetch: (...args) => {
      return fetch(...args).catch((err) => {
        console.error('[Supabase] 网络请求失败:', err)
        throw err
      })
    },
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
