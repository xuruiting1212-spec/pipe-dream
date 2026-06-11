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
        // 区分不同错误类型给出友好提示
        if (err.message.includes('Invalid login credentials')) {
          error.value = '邮箱或密码错误，请检查'
        } else if (err.message.includes('Email not confirmed')) {
          error.value = '邮箱未验证，请在 Supabase 后台确认用户'
        } else if (err.message.includes('fetch')) {
          error.value = '无法连接到服务器，请检查 Supabase 项目是否处于活跃状态'
        } else {
          error.value = err.message
        }
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
    } catch (e: any) {
      console.error('登录异常:', e)
      if (e?.message?.includes('fetch') || e?.name === 'TypeError') {
        error.value = '网络连接失败（Failed to fetch）。请检查：\n1. Supabase 项目是否暂停（免费版 7 天不用会暂停）\n2. 项目 URL 是否正确'
      } else {
        error.value = '登录异常: ' + (e?.message || '未知错误')
      }
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
