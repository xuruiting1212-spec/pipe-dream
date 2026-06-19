<!--
  TranscriptPanel — 音频转文字面板
  - 折叠展开
  - 作者视角：转文字按钮 → 调用本地 Whisper → 编辑 → 确认
  - 访客视角：只读展示确认后的文字
-->
<template>
  <div class="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 rounded-2xl border border-blue-100/50 my-4 overflow-hidden">
    <!-- 标题栏：点击展开/收起 -->
    <button
      @click="expanded = !expanded"
      class="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100/30 transition-colors"
    >
      <span class="flex items-center gap-2">
        <span>📝 转文字</span>
        <span v-if="confirmed" class="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full">已确认</span>
        <span v-else-if="localTranscript" class="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">待确认</span>
      </span>
      <span class="text-blue-400 transition-transform duration-200" :class="{ 'rotate-180': expanded }">▼</span>
    </button>

    <!-- 下拉内容 -->
    <div v-if="expanded" class="px-4 pb-4 pt-1 animate-fade-in">
      <!-- 加载中 -->
      <div v-if="transcribing" class="flex items-center gap-3 text-sm text-blue-500 py-3">
        <span class="w-5 h-5 border-2 border-blue-300 border-t-blue-500 rounded-full animate-spin"></span>
        <span>正在转文字，请稍候...</span>
      </div>

      <!-- 作者视角 -->
      <template v-if="!readonly">
        <!-- 未转录：显示转文字按钮 -->
        <div v-if="!localTranscript" class="py-2">
          <button
            @click="startTranscribe"
            :disabled="transcribing"
            class="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >
            🎙️ 开始转文字
          </button>
          <p class="text-xs text-gray-400 mt-2">
            请确保本地 Whisper 服务已启动（python whisper_server/server.py）
          </p>
        </div>

        <!-- 已有转录：编辑区 -->
        <div v-else class="space-y-3">
          <textarea
            v-model="editingText"
            class="w-full min-h-[120px] p-3 rounded-xl bg-white/70 border border-blue-200 text-sm text-gray-700 resize-y focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
            placeholder="编辑转文字内容..."
          ></textarea>

          <div class="flex gap-2">
            <button
              v-if="!confirmed"
              @click="confirmTranscript"
              :disabled="saving"
              class="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {{ saving ? '保存中...' : '✅ 确认内容' }}
            </button>
            <button
              v-if="confirmed"
              @click="reEdit"
              class="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium hover:bg-amber-200 transition-all"
            >
              ✏️ 重新编辑
            </button>
            <button
              @click="reTranscribe"
              :disabled="transcribing"
              class="px-4 py-2 bg-white/70 text-blue-600 rounded-full text-sm hover:bg-blue-50 transition-all disabled:opacity-50 border border-blue-200"
            >
              🔄 重新转文字
            </button>
          </div>
        </div>
      </template>

      <!-- 访客视角：只读展示 -->
      <template v-else>
        <div class="bg-white/60 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {{ localTranscript }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePostsStore } from '@/stores/posts'

const props = defineProps<{
  postId: string
  audioUrl: string
  transcript: string | null
  confirmed: boolean
  readonly?: boolean
}>()

const postsStore = usePostsStore()

const expanded = ref(false)
const transcribing = ref(false)
const saving = ref(false)
const localTranscript = ref(props.transcript || '')
const editingText = ref('')

/** 开始转文字 — 调用本地 Whisper 服务 */
async function startTranscribe(): Promise<void> {
  transcribing.value = true
  try {
    const resp = await fetch('http://localhost:8765/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio_url: props.audioUrl }),
    })

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: `HTTP ${resp.status}` }))
      throw new Error(err.detail || `请求失败 (${resp.status})`)
    }

    const data = await resp.json()
    localTranscript.value = data.text || ''
    editingText.value = data.text || ''

    // 自动保存原始转录到数据库（未确认状态）
    await postsStore.updateTranscript(props.postId, data.text || '', false)
  } catch (e: any) {
    console.error('[TranscriptPanel] 转文字失败:', e)
    if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
      alert('无法连接到本地 Whisper 服务。\n\n请确保已运行：\ncd whisper_server && python server.py')
    } else {
      alert('转文字失败: ' + (e.message || '未知错误'))
    }
  } finally {
    transcribing.value = false
  }
}

/** 确认转文字内容 */
async function confirmTranscript(): Promise<void> {
  saving.value = true
  try {
    const ok = await postsStore.updateTranscript(props.postId, editingText.value, true)
    if (ok) {
      localTranscript.value = editingText.value
    } else {
      alert('保存失败: ' + (postsStore.error || '未知错误'))
    }
  } finally {
    saving.value = false
  }
}

/** 重新编辑（已确认 → 未确认状态） */
async function reEdit(): Promise<void> {
  await postsStore.updateTranscript(props.postId, editingText.value, false)
}

/** 重新转文字 */
async function reTranscribe(): Promise<void> {
  localTranscript.value = ''
  editingText.value = ''
  await startTranscribe()
}

// 同步外部 transcript 变化到本地
watch(() => props.transcript, (val) => {
  if (val && !localTranscript.value) {
    localTranscript.value = val
    editingText.value = val
  }
})
</script>
