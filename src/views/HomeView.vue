<!--
  ===== HomeView — 主页 =====
  访客/登录用户共用，默认展示公开帖子
  支持分类筛选、标签筛选、关键词搜索
-->

<template>
  <div>
    <!-- 顶部标题栏 + 搜索 -->
    <TopBar />

    <!-- 分类筛选标签 -->
    <PostFilter />

    <!-- 帖子网格 -->
    <PostGrid
      :posts="postsStore.filteredPosts"
      :loading="postsStore.loading"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePostsStore } from '@/stores/posts'
import { useAuthStore } from '@/stores/auth'
import TopBar from '@/components/layout/TopBar.vue'
import PostFilter from '@/components/posts/PostFilter.vue'
import PostGrid from '@/components/posts/PostGrid.vue'

const postsStore = usePostsStore()
const authStore = useAuthStore()
const route = useRoute()

/**
 * 加载帖子
 * - 已登录用户：加载全部帖子
 * - 访客：只加载公开帖子
 */
async function loadPosts(): Promise<void> {
  await postsStore.fetchPosts(authStore.isLoggedIn)
}

/** 根据 URL 参数应用筛选 */
function applyUrlFilter(): void {
  const { type, subtype, keyword } = route.query
  postsStore.setFilter({
    type: (type as string) || 'all',
    subtype: (subtype as string) || undefined,
    keyword: (keyword as string) || '',
  } as any)
}

onMounted(async () => {
  applyUrlFilter()
  await loadPosts()
})

// 监听登录状态变化
watch(() => authStore.isLoggedIn, () => {
  loadPosts()
})

// 监听路由 query 变化
watch(() => route.query, () => {
  applyUrlFilter()
})
</script>
