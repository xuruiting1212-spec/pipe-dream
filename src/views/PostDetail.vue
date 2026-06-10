<!--
  ===== PostDetail — 帖子详情页 =====
  完整显示帖子内容，图片从上到下滚动显示（不压缩）
  支持 Markdown 渲染
-->

<template>
  <div class="max-w-3xl mx-auto">
    <!-- 加载中 -->
    <LoadingSpinner v-if="loading" message="加载帖子详情..." />

    <!-- 帖子不存在 -->
    <div
      v-else-if="!post"
      class="text-center py-20"
    >
      <div class="text-6xl mb-4">🔍</div>
      <p class="text-gray-400 text-lg">帖子不存在</p>
      <button @click="router.push('/')" class="dream-btn-ghost mt-4 inline-block">
        ← 返回首页
      </button>
    </div>

    <!-- 帖子内容 -->
    <article v-else class="animate-fade-in">
      <!-- 返回按钮 -->
      <button
        @click="router.back()"
        class="text-gray-400 hover:text-dream-500 mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回
      </button>

      <!-- 分类标签 -->
      <div class="flex items-center gap-2 mb-3">
        <span class="dream-tag">{{ typeEmoji }} {{ post.type }}</span>
        <span v-if="post.subtype" class="text-sm text-purple-400">· {{ post.subtype }}</span>
        <span v-if="post.is_draft" class="text-xs text-amber-500 ml-auto">📝 草稿</span>
        <span v-else-if="post.visibility === 'private'" class="text-xs text-gray-400 ml-auto">🔒 仅自己可见</span>
      </div>

      <!-- 标题 -->
      <h1 class="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
        {{ post.title }}
      </h1>

      <!-- 元信息 -->
      <div class="flex items-center gap-4 text-sm text-gray-400 mb-6 pb-4 border-b border-gray-100">
        <span>🕐 {{ formatDate(post.created_at) }}</span>
        <span>👁️ {{ post.visibility === 'public' ? '公开' : '仅自己' }}</span>
      </div>

      <!-- 标签 -->
      <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-2 mb-6">
        <span
          v-for="tag in post.tags"
          :key="tag"
          class="dream-tag cursor-pointer hover:bg-dream-200/30"
          @click="searchByTag(tag)"
        >
          #{{ tag }}
        </span>
      </div>

      <!-- 视频 -->
      <div v-if="post.video" class="mb-6">
        <video
          :src="post.video"
          controls
          class="w-full rounded-dream shadow-dream"
          preload="metadata"
        >
          您的浏览器不支持视频播放
        </video>
      </div>

      <!-- 图片（不压缩，从上到下滚动显示） -->
      <div v-if="post.images && post.images.length > 0" class="mb-8 space-y-4">
        <img
          v-for="(img, idx) in post.images"
          :key="idx"
          :src="img"
          :alt="`${post.title} - 图片 ${idx + 1}`"
          class="w-full rounded-dream shadow-dream"
          style="image-rendering: auto;"
          loading="lazy"
        />
      </div>

      <!-- Markdown 正文 -->
      <div
        class="markdown-body bg-white/60 rounded-dream p-6 md:p-8 shadow-dream-sm"
        v-html="renderedContent"
      ></div>

      <!-- 底部操作（仅登录用户） -->
      <div v-if="authStore.isLoggedIn" class="flex gap-3 mt-8 pt-6 border-t border-gray-100">
        <button
          @click="router.push(`/publish/${post.id}`)"
          class="dream-btn-ghost text-sm"
        >
          ✏️ 编辑
        </button>
        <button
          @click="handleDelete"
          class="text-sm text-red-400 hover:text-red-600 hover:bg-red-50 px-6 py-3 rounded-full transition-all"
        >
          🗑️ 删除
        </button>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { usePostsStore } from '@/stores/posts'
import { useAuthStore } from '@/stores/auth'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const postsStore = usePostsStore()
const authStore = useAuthStore()

const post = computed(() => postsStore.currentPost)
const loading = ref(true)

/** 分类 emoji */
const typeEmoji = computed(() => {
  const map: Record<string, string> = {
    '日常': '🌸',
    '碎碎念': '💭',
    '情景剧': '🎭',
    '时间线总览': '🕐',
  }
  return map[post.value?.type || ''] || '📝'
})

/** 渲染 Markdown 正文 */
const renderedContent = computed(() => {
  if (!post.value?.content) return '<p class="text-gray-300">暂无内容</p>'
  return marked.parse(post.value.content, { breaks: true, gfm: true }) as string
})

/** 格式化日期 */
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** 通过标签搜索 */
function searchByTag(tag: string): void {
  router.push({ path: '/', query: { tag } })
}

/** 删除帖子 */
async function handleDelete(): Promise<void> {
  if (!post.value) return
  const confirmed = window.confirm('确定要删除这个帖子吗？此操作不可恢复。')
  if (!confirmed) return

  const success = await postsStore.deletePost(post.value.id)
  if (success) {
    router.push('/')
  } else {
    alert('删除失败: ' + (postsStore.error || '未知错误'))
  }
}

onMounted(async () => {
  const id = route.params.id as string
  await postsStore.fetchPostById(id)
  loading.value = false
})
</script>
