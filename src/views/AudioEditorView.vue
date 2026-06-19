<!--
  AudioEditorView — 网页内建音频编辑器
  条形波纹 + 滚轮缩放 + 拖拽选区 + 切割/删除 + 片段排序 + 导出
-->
<template>
  <div class="h-[100dvh] flex flex-col bg-[#f5f3f0]">
    <!-- 顶栏 -->
    <div class="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 bg-white/80 backdrop-blur border-b border-gray-100">
      <button @click="goBack" class="text-gray-400 hover:text-gray-700 text-sm">← 返回</button>
      <h1 class="text-base font-bold text-gray-800">音频编辑器</h1>
      <span class="text-xs text-gray-400 ml-auto hidden sm:inline">🖱️ 滚轮缩放 · 拖拽选区</span>
    </div>

    <!-- 加载/错误 -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="flex flex-col items-center gap-3 text-gray-400">
        <div class="w-8 h-8 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
        <span class="text-sm">加载音频中...</span>
      </div>
    </div>
    <div v-else-if="errorMsg" class="flex-1 flex items-center justify-center px-4">
      <div class="text-center">
        <p class="text-red-400 mb-3">❌ {{ errorMsg }}</p>
        <button @click="goBack" class="text-sm text-purple-500 underline">返回</button>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <template v-else>
      <!-- 波形区（滚轮缩放） -->
      <div ref="wavePanel"
        class="flex-1 min-h-0 overflow-x-auto overflow-y-hidden bg-[#e8e6e1] cursor-crosshair select-none rounded-2xl mx-3 mt-3"
        @mousedown.left="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
        @wheel.prevent="onWheel">
        <canvas ref="canvasEl" :width="cw" :height="ch"
          class="block" />
      </div>

      <!-- 缩放滑块条（紧凑） -->
      <div class="flex-shrink-0 flex items-center gap-4 px-4 py-2 text-[11px] text-gray-400 overflow-x-auto">
        <label class="flex items-center gap-1.5 whitespace-nowrap">
          <span>🔉</span>
          <input type="range" min="0.5" max="15" step="0.5" v-model.number="ampZoom"
            class="w-16 h-1 accent-purple-500" />
          <span class="w-8 text-right">{{ ampZoom }}×</span>
        </label>
        <label class="flex items-center gap-1.5 whitespace-nowrap">
          <span>↔</span>
          <input type="range" min="5" max="300" step="1" v-model.number="pps"
            class="w-20 h-1 accent-blue-500" />
          <span class="w-12 text-right">{{ pps }}px/s</span>
        </label>
        <span class="ml-auto text-[10px] text-gray-300 whitespace-nowrap">滚轮缩放 · 点击定位 · 拖拽选区</span>
      </div>

      <!-- 片段条 -->
      <div class="flex-shrink-0 overflow-x-auto px-3 py-2">
        <div class="flex items-center gap-1.5 min-w-max">
          <span class="text-[10px] text-gray-400 mr-1">片段</span>
          <div v-for="(clip, idx) in clips" :key="clip.id"
            draggable="true"
            @dragstart="dragSrcIdx = idx"
            @dragover.prevent="dragOverIdx = idx"
            @dragleave="dragOverIdx = null"
            @drop="onDrop(idx)"
            @dragend="dragOverIdx = null"
            class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium cursor-grab active:cursor-grabbing transition-all select-none border"
            :class="dragOverIdx === idx
              ? 'bg-purple-100 border-purple-300 scale-105 shadow-sm'
              : 'bg-white border-gray-100 text-purple-700 hover:border-purple-200'">
            <span>🎵</span>
            <span>{{ fmt(clip.start) }}–{{ fmt(clip.end) }}</span>
          </div>
          <span v-if="!clips.length" class="text-[10px] text-gray-300 px-2">空</span>
        </div>
      </div>

      <!-- 底部工具栏（移动端加安全区） -->
      <div class="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 bg-white/80 backdrop-blur border-t border-gray-100"
        style="padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));">
        <button @click="togglePlay"
          class="w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all flex-shrink-0"
          :class="playing ? 'bg-gray-800 text-white' : 'bg-purple-500 text-white active:scale-95'">
          <span class="text-sm" :class="playing ? '' : 'ml-0.5'">{{ playing ? '⏸' : '▶' }}</span>
        </button>
        <span class="text-xs text-gray-500 font-mono tabular-nums whitespace-nowrap">{{ fmt(playheadTime) }} / {{ fmt(totalDuration) }}</span>

        <div class="w-px h-5 bg-gray-200 mx-0.5 flex-shrink-0"></div>

        <button @click="splitAtPlayhead" :disabled="!canSplit"
          class="px-2.5 py-1.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-600 border border-amber-200 active:bg-amber-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0">
          ✂️ 剪切
        </button>
        <button @click="deleteSelection" :disabled="!hasSelection"
          class="px-2.5 py-1.5 rounded-full text-[11px] font-medium bg-red-50 text-red-500 border border-red-200 active:bg-red-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0">
          🗑️ 删除
        </button>

        <div class="flex-1"></div>

        <button @click="exportAudio" :disabled="exporting || !clips.length"
          class="px-3.5 py-1.5 rounded-full text-xs font-medium bg-purple-500 text-white active:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow-sm">
          {{ exporting ? '导出中' : '💾 导出' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// ============ 状态 ============
const wavePanel = ref<HTMLElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const loading = ref(true)
const errorMsg = ref<string | null>(null)
const exporting = ref(false)

let audioBuffer: AudioBuffer | null = null
const totalDuration = ref(0)
const ch = 180 // canvas height — compact

// 缩放
const ampZoom = ref(3)
const pps = ref(80) // pixels per second
const cw = computed(() => Math.max(600, Math.ceil(totalDuration.value * pps.value) + 40))

// 播放
const playing = ref(false)
const playheadTime = ref(0)
let audioCtx: AudioContext | null = null
let playbackStartTime = 0
let playbackOffset = 0
let animFrameId = 0

// 选区
const selectionStart = ref<number | null>(null)
const selectionEnd = ref<number | null>(null)
const hasSelection = computed(() =>
  selectionStart.value !== null && selectionEnd.value !== null &&
  Math.abs(selectionEnd.value - selectionStart.value) > 0.05)
const isDragging = ref(false)
const canSplit = computed(() => clips.value.length > 0)

// 片段
interface Clip { id: string; start: number; end: number }
const clips = ref<Clip[]>([])
let clipIdCounter = 0
const dragOverIdx = ref<number | null>(null)
let dragSrcIdx: number | null = null

// 防抖重绘
let drawTimer: ReturnType<typeof setTimeout> | null = null
function scheduleDraw() {
  if (drawTimer) clearTimeout(drawTimer)
  drawTimer = setTimeout(() => drawWaveform(), 16)
}

// ============ 加载音频 ============
onMounted(async () => {
  const url = (route.query.url as string) || ''
  if (!url) { errorMsg.value = '没有音频 URL'; loading.value = false; return }
  try {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`下载失败 (${resp.status})`)
    const arrayBuf = await resp.arrayBuffer()
    const ctx = new AudioContext()
    audioBuffer = await ctx.decodeAudioData(arrayBuf)
    ctx.close()
    totalDuration.value = audioBuffer.duration
    clips.value = [{ id: `c-${clipIdCounter++}`, start: 0, end: audioBuffer.duration }]
    loading.value = false
    await nextTick()
    drawWaveform()
  } catch (e: any) {
    errorMsg.value = e.message || '加载失败'
    loading.value = false
  }
})

// ============ 波形绘制（条形柱状图风格）============
function drawWaveform(): void {
  const canvas = canvasEl.value
  if (!canvas || !audioBuffer) return

  const ctx = canvas.getContext('2d')!
  const w = cw.value
  const h = ch
  canvas.width = w
  canvas.height = h

  const padX = 20
  const padY = 20
  const plotW = w - padX * 2
  const plotH = h - padY * 2
  const centerY = padY + plotH / 2

  // 背景
  ctx.fillStyle = '#e8e6e1'
  ctx.fillRect(0, 0, w, h)

  // 中间线
  ctx.strokeStyle = 'rgba(0,0,0,0.06)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(padX, centerY); ctx.lineTo(padX + plotW, centerY); ctx.stroke()

  const samples = audioBuffer.getChannelData(0)
  const sr = audioBuffer.sampleRate
  const zoom = ampZoom.value

  // 片段底
  for (const clip of clips.value) {
    const cx = padX + clip.start * pps.value
    const cw2 = (clip.end - clip.start) * pps.value
    ctx.fillStyle = 'rgba(168,85,247,0.06)'
    ctx.fillRect(cx, padY, cw2, plotH)
  }

  // 片段虚线边界
  ctx.strokeStyle = 'rgba(168,85,247,0.35)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  for (const clip of clips.value) {
    const cx = padX + clip.end * pps.value
    if (cx < w - padX) {
      ctx.beginPath(); ctx.moveTo(cx, padY); ctx.lineTo(cx, padY + plotH); ctx.stroke()
    }
  }
  ctx.setLineDash([])

  // 选区高亮
  if (hasSelection.value) {
    const sL = padX + Math.min(selectionStart.value!, selectionEnd.value!) * pps.value
    const sR = padX + Math.max(selectionStart.value!, selectionEnd.value!) * pps.value
    ctx.fillStyle = 'rgba(147,51,234,0.18)'
    ctx.fillRect(sL, padY, sR - sL, plotH)
  }

  // === 波形柱状图 ===
  const barCount = plotW
  const samplesPerBar = Math.max(1, Math.floor(sr / pps.value))

  for (let i = 0; i < barCount; i++) {
    const px = padX + i
    const sampleStart = i * samplesPerBar
    const sampleEnd = sampleStart + samplesPerBar

    let minVal = 0, maxVal = 0
    // 隔几个采一个样（性能）
    const step = Math.max(1, Math.floor(samplesPerBar / 3))
    for (let s = sampleStart; s < sampleEnd; s += step) {
      if (s >= samples.length) break
      const v = samples[s]
      if (v < minVal) minVal = v
      if (v > maxVal) maxVal = v
    }

    const halfH = (plotH / 2) * zoom
    const y1 = centerY + minVal * halfH
    const y2 = centerY + maxVal * halfH
    const barH = Math.max(0.5, y2 - y1)

    // 在片段内 vs 外
    const t = (px - padX) / pps.value
    const inClip = clips.value.some(c => t >= c.start && t < c.end)

    if (inClip) {
      // 渐变紫
      const grad = ctx.createLinearGradient(px, y1, px, y2)
      grad.addColorStop(0, 'rgba(139,92,246,0.85)')
      grad.addColorStop(0.5, 'rgba(168,85,247,0.95)')
      grad.addColorStop(1, 'rgba(139,92,246,0.85)')
      ctx.fillStyle = grad
    } else {
      ctx.fillStyle = 'rgba(156,163,175,0.35)'
    }

    // 画圆角竖条
    const bw = Math.max(0.5, pps.value > 60 ? 1.5 : pps.value > 30 ? 1 : 0.5)
    const radius = Math.min(bw / 2, 1.5)
    ctx.beginPath()
    roundRect(ctx, px - bw / 2, y1, bw, barH, radius)
    ctx.fill()
  }

  // 播放头
  const phx = padX + playheadTime.value * pps.value
  ctx.strokeStyle = '#ef4444'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(phx, padY); ctx.lineTo(phx, padY + plotH); ctx.stroke()
  // 三角
  ctx.fillStyle = '#ef4444'
  ctx.beginPath(); ctx.moveTo(phx, padY); ctx.lineTo(phx - 5, padY + 10); ctx.lineTo(phx + 5, padY + 10); ctx.fill()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w < 2 * r) r = w / 2
  if (h < 2 * r) r = h / 2
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// 缩放/片段变化时防抖重绘
watch([ampZoom, pps, clips], () => scheduleDraw())
watch([playheadTime, () => selectionStart.value, () => selectionEnd.value], () => drawWaveform())

// ============ 鼠标交互 ============
function timeAtX(clientX: number): number {
  const panel = wavePanel.value
  if (!panel) return 0
  const rect = panel.getBoundingClientRect()
  return (clientX - rect.left - 20 + panel.scrollLeft) / pps.value
}

function onMouseDown(e: MouseEvent): void {
  stopPlayback()
  const t = clampTime(timeAtX(e.clientX))
  selectionStart.value = t
  selectionEnd.value = null
  isDragging.value = true
  playheadTime.value = t
}

function onMouseMove(e: MouseEvent): void {
  if (!isDragging.value) return
  const t = clampTime(timeAtX(e.clientX))
  selectionEnd.value = t
  // 自动滚动
  const panel = wavePanel.value
  if (panel) {
    const rect = panel.getBoundingClientRect()
    if (e.clientX > rect.right - 30) panel.scrollLeft += 10
    else if (e.clientX < rect.left + 30) panel.scrollLeft -= 10
  }
}

function onMouseUp(): void {
  if (!isDragging.value) return
  isDragging.value = false
  // 单击（几乎没拖）→ 清除选区
  if (selectionEnd.value === null || Math.abs((selectionEnd.value ?? 0) - (selectionStart.value ?? 0)) < 0.08) {
    selectionStart.value = null
    selectionEnd.value = null
  }
}

/** 滚轮缩放时间轴 */
function onWheel(e: WheelEvent): void {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -5 : 5
  pps.value = Math.max(5, Math.min(300, pps.value + delta))
}

function clampTime(t: number): number {
  return Math.max(0, Math.min(totalDuration.value, t))
}

// ============ 播放 ============
async function togglePlay(): Promise<void> {
  if (playing.value) { stopPlayback(); return }
  if (!audioBuffer || !clips.value.length) return

  if (!audioCtx || audioCtx.state === 'closed') audioCtx = new AudioContext()

  const ordered = clips.value
  let firstIdx = 0, actualStart = ordered[0].start
  for (let i = 0; i < ordered.length; i++) {
    const c = ordered[i]
    if (playheadTime.value >= c.start && playheadTime.value < c.end) { actualStart = playheadTime.value; firstIdx = i; break }
    if (playheadTime.value < c.start) { actualStart = c.start; firstIdx = i; break }
  }

  let offset = 0
  for (let i = firstIdx; i < ordered.length; i++) {
    const c = ordered[i]
    const src = audioCtx!.createBufferSource()
    src.buffer = audioBuffer!
    src.connect(audioCtx!.destination)
    if (i === firstIdx) { src.start(offset, actualStart, c.end - actualStart); offset += c.end - actualStart }
    else { src.start(offset, c.start, c.end - c.start); offset += c.end - c.start }
  }

  playbackStartTime = audioCtx!.currentTime
  playbackOffset = actualStart
  playing.value = true
  animLoop()
}

function stopPlayback(): void {
  playing.value = false
  cancelAnimationFrame(animFrameId)
  if (audioCtx && audioCtx.state !== 'closed') { audioCtx.close().catch(() => {}); audioCtx = null }
}

function animLoop(): void {
  if (!playing.value || !audioCtx) return
  playheadTime.value = Math.min(totalDuration.value, playbackOffset + (audioCtx!.currentTime - playbackStartTime))
  animFrameId = requestAnimationFrame(animLoop)
}

// ============ 编辑操作 ============
function splitAtPlayhead(): void {
  const t = playheadTime.value
  const idx = clips.value.findIndex(c => t > c.start && t < c.end)
  if (idx === -1) return
  const clip = clips.value[idx]
  const arr = [...clips.value]
  arr.splice(idx, 1,
    { id: `c-${clipIdCounter++}`, start: clip.start, end: t },
    { id: `c-${clipIdCounter++}`, start: t, end: clip.end },
  )
  clips.value = arr
}

function deleteSelection(): void {
  if (!hasSelection.value) return
  const s1 = Math.min(selectionStart.value!, selectionEnd.value!)
  const s2 = Math.max(selectionStart.value!, selectionEnd.value!)
  const result: Clip[] = []
  for (const c of clips.value) {
    if (s2 <= c.start || s1 >= c.end) { result.push(c); continue }
    if (s1 <= c.start && s2 >= c.end) continue // 全覆盖
    if (s1 > c.start && s2 < c.end) {
      result.push({ id: `c-${clipIdCounter++}`, start: c.start, end: s1 })
      result.push({ id: `c-${clipIdCounter++}`, start: s2, end: c.end })
    } else if (s1 <= c.start) {
      result.push({ id: `c-${clipIdCounter++}`, start: s2, end: c.end })
    } else {
      result.push({ id: `c-${clipIdCounter++}`, start: c.start, end: s1 })
    }
  }
  clips.value = result
  selectionStart.value = null
  selectionEnd.value = null
}

function onDrop(targetIdx: number): void {
  dragOverIdx.value = null
  if (dragSrcIdx === null || dragSrcIdx === targetIdx) return
  const arr = [...clips.value]
  const [item] = arr.splice(dragSrcIdx, 1)
  arr.splice(targetIdx, 0, item)
  clips.value = arr
  dragSrcIdx = null
}

// ============ 导出 ============
async function exportAudio(): Promise<void> {
  if (!audioBuffer || !clips.value.length) return
  exporting.value = true
  try {
    const totalLen = clips.value.reduce((s, c) => s + (c.end - c.start), 0)
    const sr = audioBuffer.sampleRate
    const chs = audioBuffer.numberOfChannels
    const offlineCtx = new OfflineAudioContext(chs, Math.ceil(totalLen * sr), sr)
    let off = 0
    for (const c of clips.value) {
      const src = offlineCtx.createBufferSource()
      src.buffer = audioBuffer
      src.connect(offlineCtx.destination)
      src.start(off, c.start, c.end - c.start)
      off += c.end - c.start
    }
    const rendered = await offlineCtx.startRendering()
    const wavBlob = encodeWAV(rendered)
    const { supabase } = await import('@/composables/useSupabase')
    const name = `edited-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.wav`
    const { data, error: err } = await supabase.storage.from('posts-media')
      .upload(`audio/${name}`, wavBlob, { cacheControl: '31536000', upsert: false })
    if (err) throw new Error(`上传失败: ${err.message}`)
    const { data: urlData } = supabase.storage.from('posts-media').getPublicUrl(data.path)
    sessionStorage.setItem('audio_editor_result', urlData.publicUrl)
    router.back()
  } catch (e: any) { alert('导出失败: ' + (e.message || '未知错误')) }
  finally { exporting.value = false }
}

// ============ WAV 编码 ============
function encodeWAV(buffer: AudioBuffer): Blob {
  const nc = buffer.numberOfChannels, sr = buffer.sampleRate
  const bps = 16, bpsByte = bps / 8, ba = nc * bpsByte, dl = buffer.length * ba
  const wav = new ArrayBuffer(44 + dl), v = new DataView(wav)
  ws(v, 0, 'RIFF'); v.setUint32(4, 36 + dl, true); ws(v, 8, 'WAVE')
  ws(v, 12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true)
  v.setUint16(22, nc, true); v.setUint32(24, sr, true)
  v.setUint32(28, sr * ba, true); v.setUint16(32, ba, true); v.setUint16(34, bps, true)
  ws(v, 36, 'data'); v.setUint32(40, dl, true)
  let o = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < nc; ch++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]))
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2
    }
  }
  return new Blob([wav], { type: 'audio/wav' })
}
function ws(v: DataView, o: number, s: string): void { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }

// ============ 工具 ============
function fmt(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00'
  return `${Math.floor(s / 60)}:${(Math.floor(s) % 60).toString().padStart(2, '0')}`
}
function goBack(): void { stopPlayback(); if (audioCtx) audioCtx.close(); router.back() }
onUnmounted(() => { stopPlayback(); if (audioCtx) audioCtx.close() })
</script>
