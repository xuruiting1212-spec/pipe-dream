<!--
  ===== PostFilter — 帖子筛选组件 =====
  提供按分类筛选的标签栏
-->

<template>
  <div class="flex flex-wrap items-center gap-2 mb-6">
    <!-- 全部分类 -->
    <button
      v-for="item in categories"
      :key="item.type"
      @click="selectCategory(item.type)"
      class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
      :class="activeType === item.type
        ? 'bg-gradient-to-r from-dream-500 to-purple-500 text-white shadow-dream'
        : 'bg-white/70 text-gray-600 hover:bg-dream-50 hover:text-dream-600'"
    >
      {{ item.emoji }} {{ item.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePostsStore } from '@/stores/posts'

const postsStore = usePostsStore()

/** 分类选项 */
const categories = [
  { type: 'all', label: '全部', emoji: '🏠' },
  { type: '日常', label: '日常', emoji: '🌸' },
  { type: '碎碎念', label: '碎碎念', emoji: '💭' },
  { type: '情景剧', label: '情景剧', emoji: '🎭' },
  { type: '时间线总览', label: '时间线', emoji: '🕐' },
]

/** 当前激活分类 */
const activeType = computed(() => postsStore.filter.type || 'all')

/** 选择分类 */
function selectCategory(type: string): void {
  postsStore.setFilter({
    type: type as any,
    subtype: undefined,
  })
}
</script>
