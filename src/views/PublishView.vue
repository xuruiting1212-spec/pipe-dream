<!--
  ===== PublishView — 发布/编辑帖子页 =====
  支持：
  - 标题、正文（Markdown）
  - 可见范围（公开/仅自己）
  - 标签
  - 类型 + 情景剧子分类
  - 图片上传（多张，不压缩）
  - 视频上传
  - 保存为草稿
-->

<template>
  <div class="max-w-4xl mx-auto animate-fade-in">
    <!-- 返回按钮 -->
    <button
      @click="router.back()"
      class="text-gray-400 hover:text-dream-500 mb-4 inline-flex items-center gap-1 transition-colors"
    >
      ← 返回
    </button>

    <h1 class="text-2xl font-bold text-gray-800 mb-8">
      {{ isEdit ? '✏️ 编辑帖子' : '✨ 增添新内容' }}
    </h1>

    <!-- 错误提示 -->
    <div
      v-if="errorMsg"
      class="mb-4 p-3 bg-red-50 text-red-500 rounded-dream-sm text-sm"
    >
      ❌ {{ errorMsg }}
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- 标题 -->
      <div>
        <label class="text-sm font-medium text-gray-600 mb-2 block">📌 标题</label>
        <input
          v-model="form.title"
          type="text"
          placeholder="给帖子起个标题..."
          class="dream-input text-lg font-medium"
          required
        />
      </div>

      <!-- 类型选择 -->
      <div>
        <label class="text-sm font-medium text-gray-600 mb-2 block">📂 分类</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="t in postTypes"
            :key="t.value"
            type="button"
            @click="selectType(t.value)"
            class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
            :class="form.type === t.value
              ? 'bg-gradient-to-r from-dream-500 to-purple-500 text-white shadow-dream'
              : 'bg-white/70 text-gray-600 hover:bg-dream-50'"
          >
            {{ t.emoji }} {{ t.label }}
          </button>
        </div>

        <!-- 情景剧子分类 -->
        <div v-if="form.type === '情景剧'" class="mt-3 ml-2 flex flex-wrap gap-2 animate-fade-in">
          <span class="text-xs text-gray-400 self-center mr-1">子分类：</span>
          <button
            v-for="s in subtypes"
            :key="s"
            type="button"
            @click="form.subtype = s"
            class="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300"
            :class="form.subtype === s
              ? 'bg-purple-100 text-purple-700 border border-purple-300'
              : 'bg-white/70 text-gray-500 hover:bg-purple-50'"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <!-- Markdown 编辑器 -->
      <MarkdownEditor v-model="form.content" placeholder="写下你的想法...支持 Markdown 格式" />

      <!-- 标签 -->
      <TagInput v-model:tags="form.tags" />

      <!-- 可见范围 -->
      <VisibilitySelect v-model="form.visibility" />

      <!-- 图片上传 -->
      <ImageUploader v-model:images="form.images" />

      <!-- 视频上传 -->
      <div>
        <label class="text-sm font-medium text-gray-600 mb-2 block">🎬 视频（可选）</label>
        <div v-if="form.video" class="mb-2">
          <video :src="form.video" controls class="w-full max-w-md rounded-dream-sm" preload="metadata"></video>
          <button
            type="button"
            @click="form.video = null"
            class="text-xs text-red-400 hover:text-red-600 mt-1"
          >
            移除视频
          </button>
        </div>
        <label class="dream-btn-ghost cursor-pointer inline-flex items-center gap-2 text-sm"
               :class="{ 'opacity-50': uploadingVideo }">
          <span v-if="uploadingVideo" class="w-4 h-4 border-2 border-dream-300 border-t-dream-500 rounded-full animate-spin"></span>
          <span v-else>🎬</span>
          <span>{{ uploadingVideo ? '上传中...' : '选择视频' }}</span>
          <input
            type="file"
            accept="video/*"
            class="hidden"
            @change="handleVideoSelect"
            :disabled="uploadingVideo"
          />
        </label>
      </div>

      <!-- 操作按钮 -->
      <div class="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
        <!-- 保存草稿 -->
        <button
          type="button"
          @click="saveDraft"
          class="dream-btn-ghost text-sm"
          :disabled="saving"
        >
          📝 保存草稿
        </button>

        <!-- 发布 -->
        <button
          type="submit"
          class="dream-btn-primary flex-1 md:flex-none"
          :disabled="saving"
        >
          <span v-if="saving" class="inline-flex items-center gap-2">
            <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            保存中...
          </span>
          <span v-else>{{ isEdit ? '💾 更新' : '✨ 发布' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostsStore } from '@/stores/posts'
import { useAuthStore } from '@/stores/auth'
import type { PostForm, PostType, Subtype } from '@/types'
import MarkdownEditor from '@/components/publish/MarkdownEditor.vue'
import TagInput from '@/components/publish/TagInput.vue'
import VisibilitySelect from '@/components/publish/VisibilitySelect.vue'
import ImageUploader from '@/components/publish/ImageUploader.vue'

const route = useRoute()
const router = useRouter()
const postsStore = usePostsStore()
const authStore = useAuthStore()

/** 是否是编辑模式 */
const isEdit = computed(() => !!route.params.id)

const saving = ref(false)
const uploadingVideo = ref(false)
const errorMsg = ref<string | null>(null)

/** 帖子类型选项 */
const postTypes = [
  { value: '日常' as PostType, label: '日常', emoji: '🌸' },
  { value: '碎碎念' as PostType, label: '碎碎念', emoji: '💭' },
  { value: '情景剧' as PostType, label: '情景剧', emoji: '🎭' },
  { value: '时间线总览' as PostType, label: '时间线总览', emoji: '🕐' },
]

/** 情景剧子分类选项 */
const subtypes: Subtype[] = ['亲密', '约会', '日常']

/** 表单数据 */
const form = reactive<PostForm>({
  title: '',
  content: '',
  type: '日常',
  subtype: null,
  tags: [],
  visibility: 'public',
  images: [],
  video: null,
  is_draft: false,
})

/** 选择类型 */
function selectType(type: PostType): void {
  form.type = type
  if (type !== '情景剧') {
    form.subtype = null
  }
}

/** 处理视频选择 */
async function handleVideoSelect(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  uploadingVideo.value = true
  try {
    const url = await postsStore.uploadFile(input.files[0], 'videos')
    if (url) {
      form.video = url
    }
  } finally {
    uploadingVideo.value = false
    input.value = ''
  }
}

/** 发布/更新帖子 */
async function handleSubmit(): Promise<void> {
  if (!form.title.trim()) {
    errorMsg.value = '请输入标题'
    return
  }
  saving.value = true
  errorMsg.value = null
  form.is_draft = false

  try {
    const postId = route.params.id as string | undefined
    const result = await postsStore.savePost({ ...form }, postId)
    if (result) {
      router.push(`/post/${result.id}`)
    } else {
      errorMsg.value = postsStore.error || '保存失败'
    }
  } finally {
    saving.value = false
  }
}

/** 保存草稿 */
async function saveDraft(): Promise<void> {
  saving.value = true
  errorMsg.value = null
  form.is_draft = true

  try {
    const postId = route.params.id as string | undefined
    const result = await postsStore.savePost({ ...form }, postId)
    if (result) {
      router.push('/drafts')
    } else {
      errorMsg.value = postsStore.error || '保存草稿失败'
    }
  } finally {
    saving.value = false
  }
}

// 编辑模式：加载已有帖子数据
onMounted(async () => {
  // 未登录不允许访问
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }

  const postId = route.params.id as string | undefined
  if (postId) {
    const post = await postsStore.fetchPostById(postId)
    if (post) {
      form.title = post.title
      form.content = post.content
      form.type = post.type
      form.subtype = post.subtype || null
      form.tags = post.tags || []
      form.visibility = post.visibility
      form.images = post.images || []
      form.video = post.video
      form.is_draft = post.is_draft
    }
  }
})
</script>
