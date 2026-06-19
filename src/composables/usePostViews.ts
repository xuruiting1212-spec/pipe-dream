// ===== 帖子浏览量统计 =====
// 访客识别 → 作者豁免 → 24h 去重 → 记录浏览 → 查询统计
//
// 核心规则：
// 1. 同一访客对同一帖子，24 小时内只计 1 次浏览
// 2. 作者（登录用户）访问自己的帖子不计入浏览
// 3. 未登录访客用 localStorage 中的随机 UUID 标识

import { ref } from 'vue'
import { supabase } from './useSupabase'
import { useAuthStore } from '@/stores/auth'

/** localStorage 中存储 visitor_token 的 key */
const VISITOR_TOKEN_KEY = 'pd_visitor_token'

/**
 * 获取或生成访客标识 token
 * - 已登录用户：返回 user_id（格式 "user_<uuid>"）
 * - 未登录访客：从 localStorage 读取或生成随机 UUID
 *
 * 返回格式统一为字符串，区分来源：
 *   "user_<supabase-user-id>" ← 登录用户
 *   "<random-uuid>"            ← 匿名访客
 */
export function getVisitorToken(): string {
  const authStore = useAuthStore()
  if (authStore.isLoggedIn && authStore.user?.id) {
    return `user_${authStore.user.id}`
  }

  let token = localStorage.getItem(VISITOR_TOKEN_KEY)
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem(VISITOR_TOKEN_KEY, token)
  }
  return token
}

/**
 * 判断当前登录用户是否是帖子作者
 * 仅在已登录 + postUserId 一致时返回 true
 */
export function isPostAuthor(postUserId: string | null | undefined): boolean {
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn || !authStore.user?.id) return false
  return postUserId === authStore.user.id
}

/**
 * 记录一次浏览（如果满足条件）
 *
 * @param postId   帖子 ID
 * @param postUserId 帖子作者的 user_id（用于判断是否豁免）
 * @returns 是否实际记录了浏览（true = 新增记录，false = 被豁免或去重跳过）
 */
export async function recordView(
  postId: string,
  postUserId: string | null | undefined
): Promise<boolean> {
  // --- 规则 1：作者访问自己的帖子，不记录 ---
  if (isPostAuthor(postUserId)) return false

  const visitorToken = getVisitorToken()

  // --- 规则 2：24 小时内同一访客对同一帖子已有浏览记录，跳过 ---
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const { data: existing, error: lookupErr } = await supabase
    .from('post_views')
    .select('id')
    .eq('post_id', postId)
    .eq('visitor_token', visitorToken)
    .gte('viewed_at', twentyFourHoursAgo.toISOString())
    .limit(1)

  if (lookupErr) {
    console.error('[usePostViews] 查询已有浏览记录失败:', lookupErr.message)
    return false
  }

  if (existing && existing.length > 0) return false // 24h 内已有记录，跳过

  // --- 插入新浏览记录 ---
  const { error: insertErr } = await supabase
    .from('post_views')
    .insert({ post_id: postId, visitor_token: visitorToken })

  if (insertErr) {
    console.error('[usePostViews] 记录浏览失败:', insertErr.message)
    return false
  }

  return true
}

/**
 * 查询单篇帖子的浏览量
 * @param postId 帖子 ID
 * @returns 浏览总数
 */
export async function fetchViewCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from('post_views')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)

  if (error) {
    console.error('[usePostViews] 查询浏览量失败:', error.message)
    return 0
  }
  return count ?? 0
}

/**
 * 批量查询多篇帖子的浏览量
 * 一次查询获取所有帖子的浏览数，避免 N+1 问题
 *
 * @param postIds 帖子 ID 数组
 * @returns { [postId]: count } 映射
 */
export async function fetchViewCounts(
  postIds: string[]
): Promise<Record<string, number>> {
  if (!postIds.length) return {}

  const { data, error } = await supabase
    .from('post_views')
    .select('post_id')
    .in('post_id', postIds)

  if (error) {
    console.error('[usePostViews] 批量查询浏览量失败:', error.message)
    return {}
  }

  // 在前端做 GROUP BY 计数（避免 Supabase REST 不支持 GROUP BY 的限制）
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const pid = row.post_id
    counts[pid] = (counts[pid] ?? 0) + 1
  }
  return counts
}
