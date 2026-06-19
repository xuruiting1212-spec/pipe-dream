<!--
  AudioUploader — 音频上传组件
  参考 PublishView 中视频上传的模式
  props: audio — 当前音频 URL（null = 未上传）
  emits: update:audio — 双向绑定
-->
<template>
  <div>
    <label class="text-sm font-medium text-gray-600 mb-2 block">🎵 音频（可选）</label>

    <!-- 已上传：显示文件名 + 移除按钮 -->
    <div v-if="audioUrl" class="mb-2 flex items-center gap-3 bg-purple-50/50 rounded-dream-sm p-3 max-w-md">
      <span class="text-2xl">🎵</span>
      <div class="flex-1 min-w-0">
        <p class="text-sm text-gray-700 truncate">{{ fileName }}</p>
        <audio :src="audioUrl" controls class="mt-1 w-full h-8" preload="metadata"></audio>
      </div>
      <button
        type="button"
        @click="openEditor"
        class="text-purple-400 hover:text-purple-600 text-sm flex-shrink-0"
      >
        ✂️ 编辑
      </button>
      <button
        type="button"
        @click="$emit('update:audio', null)"
        class="text-red-400 hover:text-red-600 text-sm flex-shrink-0"
      >
        移除
      </button>
    </div>

    <!-- 上传按钮 -->
    <label
      v-else
      class="dream-btn-ghost cursor-pointer inline-flex items-center gap-2 text-sm"
      :class="{ 'opacity-50': uploading }"
    >
      <span v-if="uploading" class="w-4 h-4 border-2 border-dream-300 border-t-dream-500 rounded-full animate-spin"></span>
      <span v-else>🎵</span>
      <span>{{ uploading ? '上传中...' : '选择音频' }}</span>
      <input
        type="file"
        accept="audio/*,.m4a,.mp3,.wav,.ogg,.aac,.flac,.wma,.webm,.mp4,.m4b,.aiff,.aif,.caf,.amr,.3gp"
        class="hidden"
        @change="handleAudioSelect"
        :disabled="uploading"
      />
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePostsStore } from '@/stores/posts'

const props = defineProps<{ audio: string | null }>()
const emit = defineEmits<{ 'update:audio': [url: string | null] }>()

const postsStore = usePostsStore()
const router = useRouter()
const uploading = ref(false)

const audioUrl = computed(() => props.audio)

/** 从 URL 中提取文件名 */
const fileName = computed(() => {
  if (!props.audio) return ''
  const parts = props.audio.split('/')
  const last = parts[parts.length - 1]
  try {
    return decodeURIComponent(last)
  } catch {
    return last
  }
})

async function handleAudioSelect(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  uploading.value = true
  try {
    const url = await postsStore.uploadFile(input.files[0], 'audio')
    if (url) {
      emit('update:audio', url)
    }
  } finally {
    uploading.value = false
    input.value = ''
  }
}

/** 跳转到音频编辑器 */
function openEditor(): void {
  if (!props.audio) return
  router.push(`/audio-editor?url=${encodeURIComponent(props.audio)}`)
}

/** 编辑器返回后，检查是否有新 URL */
onMounted(() => {
  const result = sessionStorage.getItem('audio_editor_result')
  if (result && audioUrl.value !== result) {
    sessionStorage.removeItem('audio_editor_result')
    emit('update:audio', result)
  }
})
</script>
