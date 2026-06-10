<!--
  ===== TopBar — 顶部标题栏 =====
  显示网站标题 + 搜索栏
-->

<template>
  <div class="mb-6 md:mb-8">
    <!-- 标题区 -->
    <div class="flex items-baseline gap-3 mb-4">
      <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold
                 bg-gradient-to-r from-dream-500 via-dream-400 to-purple-500
                 bg-clip-text text-transparent">
        Pipe Dream
      </h1>
      <span class="text-sm md:text-base text-purple-300 font-medium">
        Towa❤️XRT
      </span>
    </div>

    <!-- 搜索栏 -->
    <div class="relative max-w-md">
      <input
        v-model="searchKeyword"
        type="text"
        placeholder="搜索帖子标题或内容..."
        class="dream-input pl-10 pr-4"
        @input="handleSearch"
        @keydown.enter="handleSearch"
      />
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        🔍
      </span>
      <!-- 清除按钮 -->
      <button
        v-if="searchKeyword"
        @click="clearSearch"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostsStore } from '@/stores/posts'

const postsStore = usePostsStore()
const route = useRoute()
const router = useRouter()

const searchKeyword = ref('')

/** 从 URL query 同步搜索关键词 */
watch(
  () => route.query.keyword,
  (val) => {
    searchKeyword.value = (val as string) || ''
  },
  { immediate: true }
)

/** 执行搜索 */
function handleSearch(): void {
  postsStore.setFilter({ keyword: searchKeyword.value })
  // 同步到 URL
  router.replace({
    query: { ...route.query, keyword: searchKeyword.value || undefined },
  })
}

/** 清除搜索 */
function clearSearch(): void {
  searchKeyword.value = ''
  handleSearch()
}
</script>
