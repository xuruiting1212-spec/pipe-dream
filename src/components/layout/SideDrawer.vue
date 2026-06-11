<template>
  <div v-if="uiStore.sidebarOpen" class="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" @click="uiStore.closeSidebar()" />
  <aside class="fixed md:sticky top-0 right-0 h-screen md:h-auto w-[280px] flex-shrink-0 z-50 bg-white/70 backdrop-blur-xl border-l border-dream-100/50
    flex flex-col items-center px-5 py-8 overflow-y-auto transition-transform duration-300 ease-out shadow-dream-lg md:shadow-none"
    :class="{ 'translate-x-0': uiStore.sidebarOpen || !uiStore.isMobile, 'translate-x-full': !uiStore.sidebarOpen && uiStore.isMobile }">
    <button class="md:hidden absolute top-4 left-4 text-gray-400 hover:text-gray-600 text-2xl" @click="uiStore.closeSidebar()">✕</button>

    <div class="relative w-full mb-4">
      <div class="w-full h-24 rounded-dream bg-gradient-to-br from-dream-200 via-purple-200 to-pink-200 flex items-center justify-center overflow-hidden" />
      <div class="flex justify-center -mt-8">
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-dream-300 to-purple-300 border-[3px] border-white shadow-dream flex items-center justify-center text-2xl">🌸</div>
      </div>
    </div>
    <h2 class="text-lg font-bold text-gray-800">XRT</h2>
    <p class="text-xs text-purple-400 mb-5 text-center">✨ Pipe Dream · 白日梦收集者</p>

    <nav class="w-full flex flex-col gap-2.5">
      <button @click="nav('/publish')" class="w-full py-3 rounded-full font-semibold text-white bg-gradient-to-r from-dream-500 to-purple-500 shadow-dream-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-center text-sm">➕ 增添新内容</button>
      <button @click="nav('/drafts')" class="dream-btn-ghost text-left flex items-center gap-3 text-sm"><span>📋</span>我的草稿</button>

      <!-- 我的发布 -->
      <div class="flex flex-col">
        <button @click="uiStore.togglePublishMenu()" class="dream-btn-ghost text-left flex items-center gap-3 w-full text-sm"><span>📂</span>我的发布<span class="ml-auto transition-transform" :class="{ 'rotate-180': uiStore.publishMenuOpen }">▾</span></button>
        <div v-if="uiStore.publishMenuOpen" class="ml-8 mt-2 flex flex-col gap-1 animate-fade-in">
          <button @click="nav('/?type=日常')" class="text-sm text-gray-600 hover:text-dream-600 py-1.5 px-3 rounded-lg hover:bg-dream-50 text-left">🌸 日常</button>
          <button @click="nav('/?type=碎碎念')" class="text-sm text-gray-600 hover:text-dream-600 py-1.5 px-3 rounded-lg hover:bg-dream-50 text-left">💭 碎碎念</button>
          <div>
            <button @click="uiStore.toggleDramaMenu()" class="text-sm text-gray-600 hover:text-dream-600 py-1.5 px-3 rounded-lg hover:bg-dream-50 text-left w-full">🎭 情景剧 <span class="text-[10px]" :class="{ 'rotate-180': uiStore.dramaMenuOpen }">▾</span></button>
            <div v-if="uiStore.dramaMenuOpen" class="ml-4 flex flex-col gap-1 animate-fade-in">
              <button @click="nav('/?type=情景剧&subtype=亲密')" class="text-xs text-gray-500 hover:text-dream-500 py-1 px-3 rounded hover:bg-dream-50 text-left">💕 亲密</button>
              <button @click="nav('/?type=情景剧&subtype=约会')" class="text-xs text-gray-500 hover:text-dream-500 py-1 px-3 rounded hover:bg-dream-50 text-left">💑 约会</button>
              <button @click="nav('/?type=情景剧&subtype=日常')" class="text-xs text-gray-500 hover:text-dream-500 py-1 px-3 rounded hover:bg-dream-50 text-left">🌿 日常</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 时间线总览（独立板块） -->
      <button @click="nav('/')" class="dream-btn-ghost text-left flex items-center gap-3 text-sm"><span>🕐</span>时间线总览</button>

      <!-- Towa 下拉栏 -->
      <div class="flex flex-col">
        <button @click="uiStore.towaMenuOpen = !uiStore.towaMenuOpen" class="dream-btn-ghost text-left flex items-center gap-3 w-full text-sm">
          <span>💖</span>Towa<span class="ml-auto transition-transform" :class="{ 'rotate-180': uiStore.towaMenuOpen }">▾</span>
        </button>
        <div v-if="uiStore.towaMenuOpen" class="ml-8 mt-2 flex flex-col gap-1 animate-fade-in">
          <button @click="nav('/canvas')" class="text-sm text-gray-600 hover:text-dream-600 py-1.5 px-3 rounded-lg hover:bg-dream-50 text-left">🎨 画板</button>
          <button @click="nav('/towa-posts')" class="text-sm text-gray-600 hover:text-dream-600 py-1.5 px-3 rounded-lg hover:bg-dream-50 text-left">💬 Towa的发布</button>
        </div>
      </div>

      <button @click="nav('/private')" class="dream-btn-ghost text-left flex items-center gap-3 text-sm"><span>🔒</span>私有物</button>
      <button v-if="authStore.isLoggedIn" @click="nav('/trash')" class="dream-btn-ghost text-left flex items-center gap-3 text-sm"><span>🗑️</span>最近删除</button>
    </nav>

    <div class="mt-auto pt-8 w-full">
      <button v-if="authStore.isLoggedIn" @click="handleLogout" class="w-full text-xs text-gray-400 hover:text-dream-500 py-2">退出登录</button>
      <button v-else @click="nav('/login')" class="w-full text-xs text-gray-400 hover:text-dream-500 py-2">🔑 管理员登录</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'; import { useAuthStore } from '@/stores/auth'; import { useUiStore } from '@/stores/ui'
const router = useRouter(); const authStore = useAuthStore(); const uiStore = useUiStore()
function nav(path: string): void { router.push(path); uiStore.closeSidebar() }
async function handleLogout(): Promise<void> { await authStore.logout(); uiStore.closeSidebar() }
</script>
