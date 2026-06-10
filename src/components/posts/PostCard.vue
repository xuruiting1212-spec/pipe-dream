<!--
  ===== PostCard — 帖子卡片 =====
  仿微博/微信朋友圈风格卡片，用于列表展示
  - 点击进入详情页
  - 显示首张图片作为封面
  - 标签、时间、分类一目了然
-->

<template>
  <article
    class="dream-card overflow-hidden cursor-pointer group
           flex flex-col animate-fade-in"
    @click="goToDetail"
  >
    <!-- 首图封面（如果有图） -->
    <div v-if="post.images && post.images.length > 0" class="relative overflow-hidden aspect-[4/3]">
      <img
        :src="post.images[0]"
        :alt="post.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <!-- 多图标识 -->
      <span
        v-if="post.images.length > 1"
        class="absolute top-2 right-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm"
      >
        📷 {{ post.images.length }}
      </span>
    </div>

    <!-- 卡片内容区 -->
    <div class="p-4 flex flex-col flex-1">
      <!-- 分类标签 -->
      <div class="flex items-center gap-2 mb-2">
        <span class="dream-tag" :class="typeTagClass">
          {{ typeEmoji }} {{ post.type }}
        </span>
        <span v-if="post.subtype" class="text-xs text-purple-400">
          · {{ post.subtype }}
        </span>
        <!-- 草稿/私密标识 -->
        <span v-if="post.is_draft" class="text-xs text-amber-500 ml-auto">📝 草稿</span>
        <span v-else-if="post.visibility === 'private'" class="text-xs text-gray-400 ml-auto">🔒</span>
      </div>

      <!-- 标题 -->
      <h3 class="font-semibold text-gray-800 mb-1.5 line-clamp-2 group-hover:text-dream-600 transition-colors">
        {{ post.title }}
      </h3>

      <!-- 正文预览（纯文本截取） -->
      <p class="text-sm text-gray-500 mb-3 line-clamp-3 flex-1">
        {{ plainTextPreview }}
      </p>

      <!-- 标签 -->
      <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-1.5 mb-3">
        <span
          v-for="tag in post.tags.slice(0, 4)"
          :key="tag"
          class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
        >
          #{{ tag }}
        </span>
        <span v-if="post.tags.length > 4" class="text-[10px] text-gray-400">
          +{{ post.tags.length - 4 }}
        </span>
      </div>

      <!-- 底部：时间 -->
      <div class="flex items-center justify-between text-xs text-gray-400 mt-auto pt-2 border-t border-gray-50">
        <span>{{ formatDate(post.created_at) }}</span>
        <span class="opacity-0 group-hover:opacity-100 transition-opacity text-dream-500">
          查看详情 →
        </span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Post } from '@/types'

const props = defineProps<{
  post: Post
}>()

const router = useRouter()

/** 分类 emoji */
const typeEmoji = computed(() => {
  const map: Record<string, string> = {
    '日常': '🌸',
    '碎碎念': '💭',
    '情景剧': '🎭',
    '时间线总览': '🕐',
  }
  return map[props.post.type] || '📝'
})

/** 分类标签样式 */
const typeTagClass = computed(() => {
  const map: Record<string, string> = {
    '日常': 'bg-green-100 text-green-700',
    '碎碎念': 'bg-blue-100 text-blue-700',
    '情景剧': 'bg-purple-100 text-purple-700',
    '时间线总览': 'bg-amber-100 text-amber-700',
  }
  return map[props.post.type] || ''
})

/** 纯文本预览（去除 Markdown 标记） */
const plainTextPreview = computed(() => {
  if (!props.post.content) return ''
  return props.post.content
    .replace(/[#*`>\[\]()!\-|~]/g, '')
    .replace(/\n/g, ' ')
    .trim()
    .slice(0, 150)
})

/** 格式化日期 */
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** 跳转到详情页 */
function goToDetail(): void {
  router.push(`/post/${props.post.id}`)
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
