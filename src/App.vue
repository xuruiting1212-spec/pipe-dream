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
      <main class="flex-1 min-w-0 p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        <router-view v-slot="{ Component, route }">
          <transition name="page" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import SideDrawer from '@/components/layout/SideDrawer.vue'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

function isActive(path: string): boolean {
  return router.currentRoute.value.path === path
}

onMounted(async () => {
  await authStore.init()
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
