// ===== 认证逻辑 =====
// 基于 Supabase Auth 的 email + password 登录

import { ref, computed } from 'vue'
import { supabase } from './useSupabase'
import type { User } from '@/types'
import type { Session } from '@supabase/supabase-js'

/** 当前用户 */
const user = ref<User | null>(null)
/** 登录状态 */
const loading = ref(false)
/** 错误信息 */
const error = ref<string | null>(null)

/** 是否已登录 */
const isLoggedIn = computed(() => user.value !== null)

/**
 * 初始化认证状态 — 在应用启动时调用
 * 检查是否有已存在的 session，自动恢复登录状态
 */
async function initAuth(): Promise<void> {
  loading.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      user.value = {
        id: session.user.id,
        email: session.user.email ?? '',
      }
    }
  } catch (e) {
    console.error('初始化认证失败:', e)
  } finally {
    loading.value = false
  }

  // 监听登录状态变化（如 token 刷新、登出）
  supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
    if (session?.user) {
      user.value = {
        id: session.user.id,
        email: session.user.email ?? '',
      }
    } else {
      user.value = null
    }
  })
}

/**
 * 使用邮箱和密码登录
 * @param email - 预设的邮箱
 * @param password - 预设的密码
 */
async function login(email: string, password: string): Promise<boolean> {
  loading.value = true
  error.value = null
  try {
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (err) {
      error.value = err.message
      return false
    }
    if (data.user) {
      user.value = {
        id: data.user.id,
        email: data.user.email ?? '',
      }
      return true
    }
    return false
  } catch (e) {
    error.value = '登录失败，请重试'
    return false
  } finally {
    loading.value = false
  }
}

/**
 * 登出
 */
async function logout(): Promise<void> {
  await supabase.auth.signOut()
  user.value = null
}

/** 清除错误 */
function clearError(): void {
  error.value = null
}

/** 导出认证 composable */
export function useAuth() {
  return {
    // 状态
    user,
    loading,
    error,
    isLoggedIn,
    // 方法
    initAuth,
    login,
    logout,
    clearError,
  }
}
