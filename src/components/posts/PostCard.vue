<!--
  PostCard — 帖子卡片（微信朋友圈风格）
  - 图片网格缩略图，1/2/3/4+ 张自适应
  - 视频显示为播放按钮叠加
  - 点击进入详情页
-->
<template>
  <article class="dream-card overflow-hidden cursor-pointer group flex flex-col animate-fade-in" @click="goToDetail">
    <!-- 图片网格 -->
    <div v-if="post.images && post.images.length > 0" class="p-2 pb-0">
      <div :class="gridClass">
        <div v-for="(img, idx) in displayImages" :key="idx" class="relative overflow-hidden rounded-lg bg-gray-100" :class="imgCellClass(idx)">
          <img :src="img" :alt="post.title" class="w-full h-full object-cover" loading="lazy" />
          <!-- 最后一张显示剩余数量 -->
          <div v-if="idx === displayImages.length - 1 && post.images.length > maxShow"
               class="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-lg font-bold">
            +{{ post.images.length - maxShow }}
          </div>
        </div>
      </div>
    </div>

    <!-- 视频封面 -->
    <div v-else-if="post.video" class="relative overflow-hidden aspect-video bg-gray-900 mx-2 mt-2 rounded-lg">
      <video :src="post.video" class="w-full h-full object-cover opacity-70" preload="metadata" />
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center shadow-lg">
          <span class="text-xl ml-1">▶</span>
        </div>
      </div>
    </div>

    <!-- 卡片内容 -->
    <div class="p-4 flex flex-col flex-1">
      <div class="flex items-center gap-2 mb-2">
        <span class="dream-tag" :class="typeTagClass">{{ typeEmoji }} {{ post.type }}</span>
        <span v-if="post.subtype" class="text-xs text-purple-400">· {{ post.subtype }}</span>
        <span v-if="post.is_draft" class="text-xs text-amber-500 ml-auto">📝 草稿</span>
        <span v-else-if="post.visibility === 'private'" class="text-xs text-gray-400 ml-auto">🔒</span>
      </div>
      <h3 class="font-semibold text-gray-800 mb-1.5 line-clamp-2 group-hover:text-dream-600 transition-colors">{{ post.title }}</h3>
      <p class="text-sm text-gray-500 mb-3 line-clamp-3 flex-1">{{ plainTextPreview }}</p>
      <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-1.5 mb-3">
        <span v-for="tag in post.tags.slice(0, 4)" :key="tag" class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">#{{ tag }}</span>
      </div>
      <div class="flex items-center justify-between text-xs text-gray-400 mt-auto pt-2 border-t border-gray-50">
        <div class="flex items-center gap-1.5">
          <div class="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
            :class="post.author_type === 'towa' ? 'bg-pink-100' : 'bg-purple-100'">
            {{ post.author_type === 'towa' ? '💖' : '🌸' }}
          </div>
          <span>{{ post.author_type === 'towa' ? 'Towa' : 'XRT' }}</span>
          <span>· {{ formatDate(post.created_at) }}</span>
        </div>
        <span class="opacity-0 group-hover:opacity-100 transition-opacity text-dream-500">查看详情 →</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Post } from '@/types'

const props = defineProps<{ post: Post }>()
const router = useRouter()

const maxShow = 9
const displayImages = computed(() => props.post.images?.slice(0, maxShow) || [])

/** 网格列数 */
const gridClass = computed(() => {
  const n = displayImages.value.length
  if (n === 1) return 'grid grid-cols-1 gap-1'
  if (n === 2) return 'grid grid-cols-2 gap-1'
  if (n === 3) return 'grid grid-cols-2 gap-1'
  return 'grid grid-cols-3 gap-1'
})

function imgCellClass(idx: number): string {
  const n = displayImages.value.length
  if (n === 3 && idx === 0) return 'row-span-2 h-full'
  return n === 1 ? 'aspect-[4/3]' : 'aspect-square'
}

const emojiMap: Record<string, string> = { '日常': '🌸', '碎碎念': '💭', '情景剧': '🎭', '时间线总览': '🕐' }
const typeEmoji = computed(() => emojiMap[props.post.type] || '📝')
const tagClassMap: Record<string, string> = { '日常': 'bg-green-100 text-green-700', '碎碎念': 'bg-blue-100 text-blue-700', '情景剧': 'bg-purple-100 text-purple-700', '时间线总览': 'bg-amber-100 text-amber-700' }
const typeTagClass = computed(() => tagClassMap[props.post.type] || '')

const plainTextPreview = computed(() => {
  if (!props.post.content) return ''
  return props.post.content.replace(/[#*`>\[\]()!\-|~]/g, '').replace(/\n/g, ' ').trim().slice(0, 150)
})

function formatDate(d: string): string {
  if (!d) return ''
  const date = new Date(d), now = new Date()
  const diff = now.getTime() - date.getTime()
  const min = Math.floor(diff / 60000), hrs = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  if (hrs < 24) return `${hrs} 小时前`
  if (days < 7) return `${days} 天前`
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function goToDetail(): void { router.push(`/post/${props.post.id}`) }
</script>

<style scoped>
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
</style>
