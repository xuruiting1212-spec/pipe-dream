<!--
  AudioPlayer — 自定义音频播放器
  播放/暂停 + 进度条拖拽/点击 + 时间显示
  底层使用 HTML5 <audio>，自定义 UI 覆盖
-->
<template>
  <div class="bg-gradient-to-r from-purple-50/70 to-pink-50/70 rounded-2xl p-4 my-4 border border-purple-100/50">
    <audio
      ref="audioEl"
      :src="src"
      preload="metadata"
      @loadedmetadata="onLoaded"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
    />

    <div class="flex items-center gap-4">
      <!-- 播放/暂停按钮 -->
      <button
        @click="togglePlay"
        class="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
        :class="isPlaying
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
          : 'bg-white text-purple-500 hover:bg-purple-50'"
      >
        <span class="text-lg" :class="{ 'ml-0.5': !isPlaying }">
          {{ isPlaying ? '⏸' : '▶' }}
        </span>
      </button>

      <!-- 右侧信息区 -->
      <div class="flex-1 min-w-0">
        <!-- 标题行 -->
        <p class="text-sm text-gray-600 mb-2 truncate">🎵 音频播放</p>

        <!-- 进度条 -->
        <div
          ref="progressBar"
          class="relative h-2 bg-white/70 rounded-full cursor-pointer group mb-1.5"
          @click="seekByClick"
        >
          <!-- 已播放进度 -->
          <div
            class="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400 transition-[width] duration-100"
            :style="{ width: progressPercent + '%' }"
          />
          <!-- 拖拽圆点 -->
          <div
            class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            :style="{ left: progressPercent + '%' }"
          />
        </div>

        <!-- 时间 -->
        <div class="flex justify-between text-xs text-gray-400">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{ src: string }>()

const audioEl = ref<HTMLAudioElement | null>(null)
const progressBar = ref<HTMLElement | null>(null)

const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

/** 进度百分比 (0–100) */
const progressPercent = computed(() => {
  if (duration.value <= 0) return 0
  return (currentTime.value / duration.value) * 100
})

function togglePlay(): void {
  const audio = audioEl.value
  if (!audio) return
  if (audio.paused) {
    audio.play()
    isPlaying.value = true
  } else {
    audio.pause()
    isPlaying.value = false
  }
}

function onLoaded(): void {
  const audio = audioEl.value
  if (audio) duration.value = audio.duration
}

function onTimeUpdate(): void {
  const audio = audioEl.value
  if (audio) currentTime.value = audio.currentTime
}

function onEnded(): void {
  isPlaying.value = false
}

/** 点击进度条跳转 */
function seekByClick(event: MouseEvent): void {
  const bar = progressBar.value
  const audio = audioEl.value
  if (!bar || !audio) return

  const rect = bar.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  audio.currentTime = Math.max(0, percent * duration.value)
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>
