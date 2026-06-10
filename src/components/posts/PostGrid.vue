<!--
  ===== PostGrid — 帖子网格 =====
  响应式网格布局：
  - 大屏 (≥1280px)：3 列
  - 中屏 (768-1279px)：2 列
  - 手机 (<768px)：1 列
-->

<template>
  <div>
    <!-- 空状态 -->
    <div
      v-if="!loading && posts.length === 0"
      class="text-center py-20"
    >
      <div class="text-6xl mb-4">🌸</div>
      <p class="text-gray-400 text-lg">还没有帖子</p>
      <p class="text-gray-300 text-sm mt-1">美好的事物值得等待 ✨</p>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-8 h-8 border-3 border-dream-300 border-t-dream-500 rounded-full animate-spin"></div>
    </div>

    <!-- 帖子网格 -->
    <div
      v-if="posts.length > 0"
      class="grid gap-4 md:gap-5 lg:gap-6"
      :class="gridCols"
    >
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PostCard from './PostCard.vue'
import type { Post } from '@/types'

const props = defineProps<{
  posts: Post[]
  loading?: boolean
}>()

/** 响应式列数 */
const gridCols = computed(() =>
  'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
)
</script>
