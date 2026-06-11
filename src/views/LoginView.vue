<!--
  ===== LoginView — 密码登录页 =====
  使用 Supabase Auth 的 email + password 登录
  预设单一账户，无需注册功能
-->

<template>
  <div class="min-h-[80vh] flex items-center justify-center">
    <div class="w-full max-w-sm">
      <!-- 卡片 -->
      <div class="dream-card p-8 text-center">
        <!-- Logo -->
        <div class="w-20 h-20 mx-auto mb-4
                    rounded-full bg-gradient-to-br from-dream-300 to-purple-300
                    flex items-center justify-center text-3xl shadow-dream">
          🌸
        </div>

        <h2 class="text-xl font-bold text-gray-800 mb-2">Pipe Dream</h2>
        <p class="text-sm text-gray-400 mb-8">管理员登录</p>

        <!-- 登录表单 -->
        <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
          <!-- 邮箱 -->
          <div class="text-left">
            <label class="text-sm font-medium text-gray-600 mb-1 block">邮箱</label>
            <input
              v-model="email"
              type="email"
              placeholder="admin@pipe-dream.com"
              class="dream-input"
              required
            />
          </div>

          <!-- 密码 -->
          <div class="text-left">
            <label class="text-sm font-medium text-gray-600 mb-1 block">密码</label>
            <input
              v-model="password"
              type="password"
              placeholder="输入密码"
              class="dream-input"
              required
            />
          </div>

          <!-- 错误提示 -->
          <div
            v-if="authStore.error"
            class="text-sm text-red-500 bg-red-50 rounded-dream-sm px-3 py-2"
          >
            ❌ {{ authStore.error }}
          </div>

          <!-- 登录按钮 -->
          <button
            type="submit"
            class="dream-btn-primary w-full"
            :disabled="authStore.loading"
          >
            <span v-if="authStore.loading" class="inline-flex items-center gap-2">
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              登录中...
            </span>
            <span v-else>🔑 登录</span>
          </button>
        </form>

        <!-- 返回首页 -->
        <button
          @click="router.push('/')"
          class="mt-6 text-xs text-gray-400 hover:text-dream-500 transition-colors"
        >
          ← 返回首页
        </button>
      </div>

      <!-- 提示信息 -->
      <p class="text-center text-xs text-gray-300 mt-4">
        仅限网站所有者登录。如果你忘记了密码，请联系管理员重置。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('xuruiting1212@me.com')
const password = ref('towa520')

/** 处理登录 */
async function handleLogin(): Promise<void> {
  const success = await authStore.login(email.value, password.value)
  if (success) {
    // 清除错误，跳转到首页
    authStore.clearError()
    router.push('/')
  }
}
</script>
