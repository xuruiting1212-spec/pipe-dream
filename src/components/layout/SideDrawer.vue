<!--
  ===== SideDrawer — 右侧侧拉栏 =====
  显示头像、简介、功能按钮
  - 桌面端：固定右侧显示
  - 移动端：抽屉滑入（从右侧）
-->

<template>
  <!-- 移动端遮罩 -->
  <div
    v-if="uiStore.sidebarOpen"
    class="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
    @click="uiStore.closeSidebar()"
  />

  <!-- 侧拉栏主体 -->
  <aside
    class="fixed md:sticky top-0 right-0 h-screen md:h-auto
           w-[280px] flex-shrink-0 z-50
           bg-white/70 backdrop-blur-xl
           border-l border-dream-100/50
           flex flex-col items-center
           px-5 py-8
           overflow-y-auto
           transition-transform duration-300 ease-out
           shadow-dream-lg md:shadow-none"
    :class="{
      'translate-x-0': uiStore.sidebarOpen || !uiStore.isMobile,
      'translate-x-full': !uiStore.sidebarOpen && uiStore.isMobile,
    }"
  >
    <!-- 关闭按钮（仅移动端显示） -->
    <button
      class="md:hidden absolute top-4 left-4 text-gray-400 hover:text-gray-600 text-2xl"
      @click="uiStore.closeSidebar()"
    >
      ✕
    </button>

    <!-- 头像区域（背景图占位） -->
    <div class="relative w-full mb-6">
      <!-- 背景图占位 -->
      <div class="w-full h-32 rounded-dream bg-gradient-to-br from-dream-200 via-purple-200 to-pink-200
                  flex items-center justify-center overflow-hidden">
        <span class="text-4xl opacity-30">🌈</span>
        <span class="absolute bottom-2 right-3 text-[10px] text-white/70">封面背景</span>
      </div>

      <!-- 头像 -->
      <div class="flex justify-center -mt-10">
        <div class="w-20 h-20 rounded-full
                    bg-gradient-to-br from-dream-300 to-purple-300
                    border-[3px] border-white
                    shadow-dream
                    flex items-center justify-center
                    text-3xl">
          🌸
        </div>
      </div>
    </div>

    <!-- 昵称 -->
    <h2 class="text-lg font-bold text-gray-800 mb-1">XRT</h2>
    <!-- 简介 -->
    <p class="text-xs text-purple-400 mb-6 text-center leading-relaxed">
      ✨ 记录美好日常<br>
      <span class="text-gray-400">Pipe Dream · 白日梦收集者</span>
    </p>

    <!-- ===== 功能按钮 ===== -->
    <nav class="w-full flex flex-col gap-3">

      <!-- ➕ 增添新内容（突出按钮） -->
      <button
        @click="navigateTo('/publish')"
        class="w-full py-3.5 rounded-full font-semibold text-white text-center
               bg-gradient-to-r from-dream-500 via-dream-400 to-purple-500
               shadow-dream-lg hover:shadow-xl
               transform hover:scale-[1.02] active:scale-95
               transition-all duration-300
               flex items-center justify-center gap-2"
      >
        <span class="text-xl">➕</span>
        <span>增添新内容</span>
      </button>

      <!-- 我的草稿 -->
      <button
        @click="navigateTo('/drafts')"
        class="dream-btn-ghost text-left flex items-center gap-3"
      >
        <span class="text-lg">📋</span>
        <span>我的草稿</span>
        <span v-if="authStore.isLoggedIn" class="ml-auto bg-dream-100 text-dream-600 text-xs px-2 py-0.5 rounded-full">
          {{ draftCount || '' }}
        </span>
      </button>

      <!-- 我的发布（可展开子菜单） -->
      <div class="flex flex-col">
        <button
          @click="uiStore.togglePublishMenu()"
          class="dream-btn-ghost text-left flex items-center gap-3 w-full"
        >
          <span class="text-lg">📂</span>
          <span>我的发布</span>
          <span class="ml-auto transition-transform duration-300"
                :class="{ 'rotate-180': uiStore.publishMenuOpen }">
            ▾
          </span>
        </button>

        <!-- 子菜单 -->
        <div
          v-if="uiStore.publishMenuOpen"
          class="ml-8 mt-2 flex flex-col gap-1.5 animate-fade-in"
        >
          <button
            @click="navigateTo('/?type=时间线总览'); uiStore.closeSidebar()"
            class="text-sm text-gray-600 hover:text-dream-600 py-1.5 px-3 rounded-lg hover:bg-dream-50 transition-colors text-left"
          >
            🕐 时间线总览
          </button>
          <button
            @click="navigateTo('/?type=日常'); uiStore.closeSidebar()"
            class="text-sm text-gray-600 hover:text-dream-600 py-1.5 px-3 rounded-lg hover:bg-dream-50 transition-colors text-left"
          >
            🌸 日常
          </button>
          <button
            @click="navigateTo('/?type=碎碎念'); uiStore.closeSidebar()"
            class="text-sm text-gray-600 hover:text-dream-600 py-1.5 px-3 rounded-lg hover:bg-dream-50 transition-colors text-left"
          >
            💭 碎碎念
          </button>
          <!-- 情景剧（可再展开） -->
          <div>
            <button
              @click="uiStore.toggleDramaMenu()"
              class="text-sm text-gray-600 hover:text-dream-600 py-1.5 px-3 rounded-lg hover:bg-dream-50 transition-colors text-left w-full flex items-center gap-1"
            >
              🎭 情景剧
              <span class="text-[10px] transition-transform duration-300"
                    :class="{ 'rotate-180': uiStore.dramaMenuOpen }">
                ▾
              </span>
            </button>
            <!-- 情景剧子分类 -->
            <div
              v-if="uiStore.dramaMenuOpen"
              class="ml-4 flex flex-col gap-1 animate-fade-in"
            >
              <button
                @click="navigateTo('/?type=情景剧&subtype=亲密'); uiStore.closeSidebar()"
                class="text-xs text-gray-500 hover:text-dream-500 py-1 px-3 rounded hover:bg-dream-50 transition-colors text-left"
              >
                💕 亲密
              </button>
              <button
                @click="navigateTo('/?type=情景剧&subtype=约会'); uiStore.closeSidebar()"
                class="text-xs text-gray-500 hover:text-dream-500 py-1 px-3 rounded hover:bg-dream-50 transition-colors text-left"
              >
                💑 约会
              </button>
              <button
                @click="navigateTo('/?type=情景剧&subtype=日常'); uiStore.closeSidebar()"
                class="text-xs text-gray-500 hover:text-dream-500 py-1 px-3 rounded hover:bg-dream-50 transition-colors text-left"
              >
                🌿 日常
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 私有物 -->
      <button
        @click="navigateTo('/private')"
        class="dream-btn-ghost text-left flex items-center gap-3"
      >
        <span class="text-lg">🔒</span>
        <span>私有物</span>
      </button>

    </nav>

    <!-- 底部：登录/登出 -->
    <div class="mt-auto pt-8 w-full">
      <template v-if="authStore.isLoggedIn">
        <button
          @click="handleLogout"
          class="w-full text-xs text-gray-400 hover:text-dream-500 py-2 transition-colors"
        >
          退出登录
        </button>
      </template>
      <template v-else>
        <button
          @click="navigateTo('/login')"
          class="w-full text-xs text-gray-400 hover:text-dream-500 py-2 transition-colors"
        >
          🔑 管理员登录
        </button>
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePostsStore } from '@/stores/posts'
import { useUiStore } from '@/stores/ui'
import { supabase } from '@/composables/useSupabase'

const router = useRouter()
const authStore = useAuthStore()
const postsStore = usePostsStore()
const uiStore = useUiStore()

/** 草稿数量 */
const draftCount = ref(0)

/** 导航到指定路径 */
function navigateTo(path: string): void {
  router.push(path)
  uiStore.closeSidebar()
}

/** 退出登录 */
async function handleLogout(): Promise<void> {
  await authStore.logout()
  uiStore.closeSidebar()
}

onMounted(async () => {
  // 如果已登录，获取草稿数量
  if (authStore.isLoggedIn) {
    const { count, error } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_draft', true)
    if (!error && count !== null) {
      draftCount.value = count
    }
  }
})
</script>
