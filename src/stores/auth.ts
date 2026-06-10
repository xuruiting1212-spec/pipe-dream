// ===== 认证状态管理 =====
// 管理用户登录状态，持久化到 localStorage

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/composables/useSupabase'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  /** 当前登录用户 */
  const user = ref<User | null>(null)
  /** 是否正在加载认证状态 */
  const loading = ref(true)
  /** 登录错误信息 */
  const error = ref<string | null>(null)

  /** 是否已登录（通过密码验证） */
  const isLoggedIn = computed(() => user.value !== null)

  /**
   * 初始化认证 — 应用启动时调用
   * 检查 Supabase 是否已有会话
   */
  async function init(): Promise<void> {
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
      console.error('认证初始化失败:', e)
    } finally {
      loading.value = false
    }

    // 监听认证状态变更
    supabase.auth.onAuthStateChange((_event, session) => {
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
   * 邮箱 + 密码登录
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
      error.value = '登录失败，请重试'
      return false
    } catch (e) {
      error.value = '登录异常，请稍后再试'
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

  /** 清除登录错误 */
  function clearError(): void {
    error.value = null
  }

  return {
    user,
    loading,
    error,
    isLoggedIn,
    init,
    login,
    logout,
    clearError,
  }
})
