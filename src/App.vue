<!--
  ===== App.vue — 应用根组件 =====
  整体布局：左侧主内容区 + 右侧侧拉栏
  移动端：侧拉栏默认隐藏，通过汉堡菜单唤起
-->

<template>
  <div class="min-h-screen bg-gradient-to-br from-dream-50 via-purple-50/30 to-pink-50/50">
    <!-- 认证初始化加载 -->
    <div
      v-if="authStore.loading"
      class="fixed inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-50"
    >
      <div class="flex flex-col items-center gap-3">
        <div class="w-10 h-10 border-3 border-dream-300 border-t-dream-500 rounded-full animate-spin"></div>
        <span class="text-dream-700 text-sm">正在加载...</span>
      </div>
    </div>

    <!-- 主布局 -->
    <div v-else class="flex min-h-screen max-w-[1600px] mx-auto relative">
      <!-- ===== 左侧主内容区 ===== -->
      <main class="flex-1 min-w-0 p-4 md:p-6 lg:p-8 pb-20 md:pb-8 relative">
        <!-- 左侧边缘虚化 — 夹在装饰图(底)与文字(顶)之间，桌面端可见 -->
        <div class="absolute left-0 top-0 bottom-0 pointer-events-none z-[5] hidden md:block"
          style="width: 280px; background: linear-gradient(to right, rgba(252,228,236,0.92) 0%, rgba(252,228,236,0.65) 20%, rgba(252,228,236,0.3) 50%, rgba(252,228,236,0.06) 80%, transparent 100%);">
        </div>

        <!-- 主区装饰 — 用原图高清、更高、虚化更晚开始 -->
        <div v-if="mainDecoBg" class="absolute top-0 left-0 right-0 pointer-events-none z-0 hidden md:block" style="height:500px">
          <div style="width:100%;height:100%"
            :style="{ background: 'url('+mainDecoBg+') center 30% / cover no-repeat',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.06) 80%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.06) 80%, transparent 100%)',
            }" />
        </div>
        <div class="relative z-10">
          <router-view v-slot="{ Component, route }">
            <!-- 桌面端使用页面切换动画；移动端跳过，避免与 iOS Safari 返回导航冲突 -->
            <transition v-if="!isTouchDevice" name="page" mode="out-in">
              <component :is="Component" :key="route.path" />
            </transition>
            <component v-else :is="Component" :key="route.path" />
          </router-view>
        </div>
      </main>

      <!-- ===== 右侧侧拉栏 ===== -->
      <SideDrawer />

      <!-- ===== 移动端底部导航条 ===== -->
      <nav
        class="md:hidden fixed bottom-0 left-0 right-0 z-40
               bg-white/90 backdrop-blur-md border-t border-dream-100
               flex items-center justify-around py-2 px-4 rounded-t-2xl"
        style="padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));"
      >
        <button @click="router.push('/')" class="flex flex-col items-center gap-1 p-2 transition-colors relative"
          :class="isActive('/') ? 'text-dream-600' : 'text-gray-400'">
          <span v-if="isActive('/')" class="absolute inset-0 bg-dream-500/10 rounded-2xl -z-0"></span>
          <span class="text-xl relative z-10">🏠</span>
          <span class="text-[10px] relative z-10">首页</span>
        </button>
        <button @click="router.push('/canvas')" class="flex flex-col items-center gap-1 p-2 transition-colors relative"
          :class="isActive('/canvas') ? 'text-dream-600' : 'text-gray-400'">
          <span v-if="isActive('/canvas')" class="absolute inset-0 bg-dream-500/10 rounded-2xl -z-0"></span>
          <span class="text-xl relative z-10">🎨</span>
          <span class="text-[10px] relative z-10">画板</span>
        </button>
        <button
          v-if="authStore.isLoggedIn"
          @click="router.push('/publish')"
          class="flex flex-col items-center gap-1 p-2
                 bg-gradient-to-r from-dream-500 to-purple-500 text-white
                 rounded-full px-5 -mt-4 shadow-dream-lg"
        >
          <span class="text-2xl">➕</span>
          <span class="text-[10px]">发布</span>
        </button>
        <button v-else @click="router.push('/login')" class="flex flex-col items-center gap-1 p-2 transition-colors relative"
          :class="isActive('/login') ? 'text-dream-600' : 'text-gray-400'">
          <span v-if="isActive('/login')" class="absolute inset-0 bg-dream-500/10 rounded-2xl -z-0"></span>
          <span class="text-xl relative z-10">🔑</span>
          <span class="text-[10px] relative z-10">登录</span>
        </button>
        <button @click="uiStore.toggleSidebar()" class="flex flex-col items-center gap-1 p-2 transition-colors relative"
          :class="uiStore.sidebarOpen ? 'text-dream-600' : 'text-gray-400'">
          <span v-if="uiStore.sidebarOpen" class="absolute inset-0 bg-dream-500/10 rounded-2xl -z-0"></span>
          <span class="text-xl relative z-10">📂</span>
          <span class="text-[10px] relative z-10">菜单</span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { supabase } from '@/composables/useSupabase'
import SideDrawer from '@/components/layout/SideDrawer.vue'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const mainDecoBg = ref('')
/** 检测触屏设备：移动端跳过页面切换动画，避免与 iOS Safari 返回导航冲突 */
const isTouchDevice = ref(false)

function isActive(path: string): boolean {
  return router.currentRoute.value.path === path
}

async function loadMainDeco() {
  const { data } = await supabase.from('profiles').select('main_deco_thumb,main_deco_url').eq('profile_type','side').limit(1).single()
  if (data) { const d = data as any; mainDecoBg.value = d.main_deco_url || d.main_deco_thumb || '' }
}

onMounted(async () => {
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  await authStore.init()
  loadMainDeco()
  // iOS Safari bfcache 恢复后刷新装饰图（bfcache 恢复时连接可能已断开）
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) loadMainDeco()
  })
})
</script>

<style>
/* 页面切换动画 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
