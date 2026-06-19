<!-- PostDetail — 帖子详情页，图片点击放大，长图不压缩 -->
<template>
  <div class="max-w-3xl mx-auto">
    <LoadingSpinner v-if="loading" message="加载中..." />

    <div v-else-if="!post" class="text-center py-20">
      <div class="text-6xl mb-4">🔍</div>
      <p class="text-gray-400 text-lg">帖子不存在</p>
      <button @click="router.push('/')" class="dream-btn-ghost mt-4 inline-block">← 返回首页</button>
    </div>

    <article v-else class="animate-fade-in">
      <button @click="router.back()" class="text-gray-400 hover:text-dream-500 mb-4 inline-flex items-center gap-1 transition-colors">← 返回</button>

      <div class="flex items-center gap-2 mb-3">
        <span class="dream-tag">{{ typeEmoji }} {{ post.type }}</span>
        <span v-if="post.subtype" class="text-sm text-purple-400">· {{ post.subtype }}</span>
        <span v-if="post.is_draft" class="text-xs text-amber-500 ml-auto">📝 草稿</span>
        <span v-else-if="post.visibility === 'private'" class="text-xs text-gray-400 ml-auto">🔒 仅自己可见</span>
      </div>

      <h1 class="text-2xl md:text-3xl font-bold text-gray-800 mb-4">{{ post.title }}</h1>

      <div class="flex items-center gap-4 text-sm text-gray-400 mb-6 pb-4 border-b border-gray-100">
        <span>🕐 {{ formatDate(post.created_at) }}</span>
        <span v-if="authStore.isLoggedIn && post.visibility !== 'private'">👁️ {{ viewCount }} 次浏览</span>
        <span v-if="post.visibility !== 'public'">🔒 仅自己可见</span>
      </div>

      <!-- 标签 -->
      <div v-if="post.tags?.length" class="flex flex-wrap gap-2 mb-6">
        <span v-for="tag in post.tags" :key="tag" class="dream-tag cursor-pointer hover:bg-dream-200/30" @click="searchByTag(tag)">#{{ tag }}</span>
      </div>

      <!-- 视频 -->
      <div v-if="post.video" class="mb-6">
        <video :src="post.video" controls class="w-full rounded-dream shadow-dream" preload="metadata">不支持视频播放</video>
      </div>

      <!-- 图片区：宽图/长图从上到下滚动 -->
      <div v-if="post.images?.length" class="mb-8 -mx-4 md:mx-0">
        <img v-for="(img, idx) in post.images" :key="idx" :src="img"
          class="w-full cursor-pointer hover:opacity-95 transition-opacity"
          style="image-rendering: auto; max-height: none; object-fit: contain; display: block;"
          loading="lazy" @click="openLightbox(idx)" />
      </div>

      <!-- 音频播放器 -->
      <AudioPlayer v-if="post.audio" :src="post.audio" />

      <!-- 转文字面板 -->
      <!-- 作者视角：始终显示面板（可以转文字/编辑/确认） -->
      <TranscriptPanel
        v-if="post.audio && authStore.isLoggedIn"
        :post-id="post.id"
        :audio-url="post.audio"
        :transcript="post.audio_transcript"
        :confirmed="post.audio_transcript_confirmed"
      />
      <!-- 访客视角：仅确认后才显示文字 -->
      <TranscriptPanel
        v-if="post.audio && !authStore.isLoggedIn && post.audio_transcript_confirmed && post.audio_transcript"
        :post-id="post.id"
        :audio-url="post.audio"
        :transcript="post.audio_transcript"
        :confirmed="true"
        :readonly="true"
      />

      <!-- Markdown 正文 -->
      <div class="markdown-body bg-white/60 rounded-dream p-6 md:p-8 shadow-dream-sm" v-html="renderedContent"></div>

      <!-- 操作按钮 -->
      <div v-if="authStore.isLoggedIn" class="flex gap-3 mt-8 pt-6 border-t border-gray-100">
        <button @click="router.push(`/publish/${post.id}`)" class="dream-btn-ghost text-sm">✏️ 编辑</button>
        <button @click="handleDelete" class="text-sm text-red-400 hover:text-red-600 hover:bg-red-50 px-6 py-3 rounded-full transition-all">🗑️ 删除</button>
      </div>
    </article>

    <!-- 图片灯箱 -->
    <div v-if="lightboxImage" class="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-pointer"
      @click="lightboxImage = null" @keydown.escape="lightboxImage = null">
      <button @click.stop="lightboxImage = null" class="absolute top-4 right-4 text-white text-3xl hover:text-gray-300">✕</button>
      <button v-if="post?.images && lightboxIndex > 0" @click.stop="prevImage"
        class="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300">‹</button>
      <img :src="lightboxImage" class="max-w-[95vw] max-h-[95vh] object-contain" @click.stop />
      <button v-if="post?.images && lightboxIndex < (post.images.length - 1)" @click.stop="nextImage"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300">›</button>
      <span class="absolute bottom-4 text-white/60 text-sm">{{ lightboxIndex + 1 }} / {{ post?.images?.length }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { usePostsStore } from '@/stores/posts'
import { useAuthStore } from '@/stores/auth'
import { recordView, fetchViewCount } from '@/composables/usePostViews'
import AudioPlayer from '@/components/posts/AudioPlayer.vue'
import TranscriptPanel from '@/components/posts/TranscriptPanel.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute(); const router = useRouter()
const postsStore = usePostsStore(); const authStore = useAuthStore()
const post = computed(() => postsStore.currentPost)
const loading = ref(true)
const viewCount = ref(0)
const lightboxImage = ref<string | null>(null)
const lightboxIndex = ref(0)

const typeEmojiMap: Record<string, string> = { '日常': '🌸', '碎碎念': '💭', '情景剧': '🎭', '时间线总览': '🕐' }
const typeEmoji = computed(() => typeEmojiMap[post.value?.type ?? ''] || '📝')

const renderedContent = computed(() => {
  if (!post.value?.content) return '<p class="text-gray-300">暂无内容</p>'
  return marked.parse(post.value.content, { breaks: true, gfm: true }) as string
})

function formatDate(d: string): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function openLightbox(idx: number): void {
  if (!post.value?.images) return
  lightboxIndex.value = idx
  lightboxImage.value = post.value.images[idx]
}
function prevImage(): void {
  if (!post.value?.images) return
  lightboxIndex.value = Math.max(0, lightboxIndex.value - 1)
  lightboxImage.value = post.value.images[lightboxIndex.value]
}
function nextImage(): void {
  if (!post.value?.images) return
  lightboxIndex.value = Math.min(post.value.images.length - 1, lightboxIndex.value + 1)
  lightboxImage.value = post.value.images[lightboxIndex.value]
}

function searchByTag(tag: string): void { router.push({ path: '/', query: { tag } }) }

async function handleDelete(): Promise<void> {
  if (!post.value) return
  if (!window.confirm('确定删除？会移到回收站，7天内可恢复。')) return
  const ok = await postsStore.softDelete(post.value.id)
  if (ok) router.push('/')
  else alert('删除失败')
}

onMounted(async () => {
  const id = route.params.id as string
  await postsStore.fetchPostById(id)
  if (postsStore.currentPost) {
    // 记录浏览（内部会自动判断是否作者、是否 24h 内已记录）
    await recordView(id, postsStore.currentPost.user_id)
    // 获取最新浏览量（仅登录用户能看到，但不登录的访客也需要这个数字）
    viewCount.value = await fetchViewCount(id)
  }
  loading.value = false
})
</script>
