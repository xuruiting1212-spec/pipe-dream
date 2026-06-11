<!-- PostFilter — 多选分类筛选（时间线总览不在此列，所有帖子均按时间排列） -->
<template>
  <div class="flex flex-wrap items-center gap-2 mb-6">
    <button v-for="item in categories" :key="item.type"
      @click="postsStore.toggleType(item.type)"
      class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
      :class="isActive(item.type)
        ? 'bg-gradient-to-r from-dream-500 to-purple-500 text-white shadow-dream'
        : 'bg-white/70 text-gray-600 hover:bg-dream-50 hover:text-dream-600'"
    >
      {{ item.emoji }} {{ item.label }}
    </button>
    <!-- 已选多个时显示清除 -->
    <button v-if="postsStore.filter.types.length > 0" @click="postsStore.resetFilter()"
      class="text-xs text-gray-400 hover:text-dream-500 transition-colors px-2">✕ 清除</button>
  </div>
</template>

<script setup lang="ts">
import { usePostsStore } from '@/stores/posts'

const postsStore = usePostsStore()

const categories = [
  { type: '日常' as const, label: '日常', emoji: '🌸' },
  { type: '碎碎念' as const, label: '碎碎念', emoji: '💭' },
  { type: '情景剧' as const, label: '情景剧', emoji: '🎭' },
]

function isActive(t: string): boolean {
  return postsStore.filter.types.includes(t as any)
}
</script>
