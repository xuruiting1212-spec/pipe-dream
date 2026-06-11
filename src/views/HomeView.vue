<!-- HomeView — 时间线总览：所有发布（me + towa）按时间排列 + 多选分类筛选 -->
<template>
  <div>
    <TopBar />
    <PostFilter />
    <PostGrid :posts="postsStore.filteredPosts" :loading="postsStore.loading" />
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

async function loadPosts(): Promise<void> {
  await postsStore.fetchPosts(authStore.isLoggedIn)
}

function applyUrlFilter(): void {
  const { type, subtype, keyword } = route.query
  const types: any[] = []
  if (type === '日常') types.push('日常')
  else if (type === '碎碎念') types.push('碎碎念')
  else if (type === '情景剧') types.push('情景剧')
  /// else if type not set or invalid, types stays empty = show all

  postsStore.setFilter({
    types,
    subtype: (subtype as string) || undefined,
    keyword: (keyword as string) || '',
  } as any)
}

onMounted(async () => { applyUrlFilter(); await loadPosts() })
watch(() => authStore.isLoggedIn, () => loadPosts())
watch(() => route.query, () => applyUrlFilter())
</script>
