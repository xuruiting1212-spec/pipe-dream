<!--
  AudioEditorView v5 — 手机优化 + 视口裁剪绘制（修复长音频空白）
-->
<template>
  <div class="min-h-[100dvh] bg-white flex flex-col items-center p-0 sm:p-4"
    style="padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px) + 56px);">

    <!-- 白卡（加长） -->
    <div class="w-full max-w-2xl bg-white sm:rounded-3xl sm:shadow-xl sm:shadow-black/5 overflow-hidden flex flex-col flex-1 sm:flex-none"
      :style="{ minHeight: isMobile ? 'calc(100dvh - 60px)' : 'auto', maxHeight: isMobile ? 'auto' : 'calc(100dvh - 120px)' }">

      <!-- 顶栏 -->
      <div class="flex-shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 border-b border-gray-100">
        <button @click="goBack" class="text-gray-400 hover:text-gray-600 text-xs sm:text-sm">← 返回</button>
        <h1 class="text-sm sm:text-[15px] font-semibold text-gray-800 truncate">音频编辑器</h1>
        <span v-if="loading" class="text-[10px] text-gray-300 ml-auto">加载中</span>
        <span v-else class="text-[10px] text-gray-300 ml-auto whitespace-nowrap">{{ fmt(totalDur) }}</span>
      </div>

      <!-- 滑块 -->
      <div class="flex-shrink-0 flex items-center gap-3 px-4 sm:px-5 py-2.5 border-b border-gray-100 bg-gray-50/50">
        <label class="flex items-center gap-2 flex-1 min-w-0">
          <span class="text-[10px] text-gray-500">振幅</span>
          <input type="range" min="0.5" max="30" step="0.5" v-model.number="ampZoom"
            class="flex-1 h-1.5 rounded-full appearance-none bg-gray-200
              [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white" />
          <span class="text-[10px] text-gray-400 w-6 text-right font-mono">{{ ampZoom }}×</span>
        </label>
        <label class="flex items-center gap-2 flex-1 min-w-0">
          <span class="text-[10px] text-gray-500">缩放</span>
          <input type="range" :min="minPps" :max="maxPps" :step="ppsStep" v-model.number="pps"
            class="flex-1 h-1.5 rounded-full appearance-none bg-gray-200
              [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white" />
          <span class="text-[10px] text-gray-400 w-9 text-right font-mono">{{ pps }}px</span>
        </label>
      </div>

      <!-- 加载/错误 -->
      <div v-if="loading" class="flex-1 flex items-center justify-center py-16"><div class="w-8 h-8 border-2 border-purple-200 border-t-purple-400 rounded-full animate-spin"></div></div>
      <div v-else-if="errorMsg" class="flex-1 flex items-center justify-center py-16"><p class="text-red-400 text-sm">❌ {{ errorMsg }}</p></div>

      <!-- 波形 -->
      <div v-else ref="wp"
        class="flex-1 min-h-[150px] bg-[#faf9f6] overflow-x-auto overflow-y-hidden cursor-crosshair select-none border-b border-gray-100"
        @mousedown.left="onMD" @mousemove="onMM" @mouseup="onMU" @mouseleave="onMU"
        @touchstart.prevent="onTS" @touchmove.prevent="onTM" @touchend="onTE"
        @wheel.prevent="onWheel"
        @scroll="onScroll">
        <canvas ref="cEl" class="block" />
      </div>

      <!-- 片段条 -->
      <div class="flex-shrink-0 overflow-x-auto px-4 sm:px-5 py-2 border-b border-gray-100">
        <div class="flex items-center gap-1 min-w-max">
          <span class="text-[10px] text-gray-400 mr-1 flex-shrink-0">片段</span>
          <div v-for="(cl, i) in clips" :key="cl.id" draggable="true"
            @dragstart="dragS = i" @dragover.prevent="dragO = i" @dragleave="dragO = null" @drop="onDrop(i)" @dragend="dragO = null"
            class="flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-medium cursor-grab active:cursor-grabbing border flex-shrink-0"
            :class="dragO === i ? 'bg-purple-50 border-purple-300 scale-105 shadow-sm' : 'bg-white border-gray-150 text-purple-600 hover:border-purple-200'">
            <span>🎵</span><span class="tabular-nums whitespace-nowrap">{{ fmt(cl.start) }} – {{ fmt(cl.end) }}</span>
          </div>
        </div>
      </div>

      <!-- 工具栏（手机端两行） -->
      <div class="flex-shrink-0 px-3 sm:px-5 py-2.5 sm:py-3 bg-white">
        <div class="flex items-center gap-2">
          <button @click="togglePlay"
            class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm flex-shrink-0"
            :class="playing ? 'bg-gray-800 text-white' : 'bg-purple-500 text-white active:scale-95'">
            <span class="text-sm">{{ playing ? '⏸' : '▶' }}</span>
          </button>
          <span class="text-xs sm:text-sm text-gray-500 font-mono tabular-nums">{{ fmt(ph) }} / {{ fmt(totalDur) }}</span>
          <div class="flex-1 hidden sm:block"></div>
          <button @click="splitAtPlayhead" :disabled="!canSplit"
            class="px-2.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-amber-50 text-amber-600 border border-amber-200 active:bg-amber-100 disabled:opacity-30 flex-shrink-0">
            ✂️ 剪切
          </button>
          <button @click="deleteSelection" :disabled="!hasSel"
            class="px-2.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-red-50 text-red-500 border border-red-200 active:bg-red-100 disabled:opacity-30 flex-shrink-0">
            🗑️ 删除
          </button>
          <button @click="exportAudio" :disabled="exporting || !clips.length"
            class="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-semibold bg-purple-500 text-white active:bg-purple-600 disabled:opacity-40 shadow-sm flex-shrink-0">
            💾 导出
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const isMobile = window.innerWidth < 640

// === 状态 ===
const wp = ref<HTMLElement | null>(null)
const cEl = ref<HTMLCanvasElement | null>(null)
const loading = ref(true)
const errorMsg = ref<string | null>(null)
const exporting = ref(false)

let audioBuffer: AudioBuffer | null = null
const totalDur = ref(0)
const viewW = ref(360) // visible viewport width

const ampZoom = ref(3)
// 初始缩放：让 10 秒左右的内容占满视口，长音频能看完概览
const pps = ref(isMobile ? 30 : 60)

// 动态范围：最少让 viewW 显示 120s 概览，最多一秒 200px
const minPps = computed(() => Math.max(3, Math.floor(viewW.value / 120)))
const maxPps = 200
const ppsStep = computed(() => maxPps > 100 ? 5 : 2)

// 播放
const playing = ref(false)
const ph = ref(0)
let audioCtx: AudioContext | null = null
let pbStart = 0; let pbOffset = 0; let animId = 0

// 选区
const selS = ref<number | null>(null); const selE = ref<number | null>(null)
const hasSel = computed(() => selS.value !== null && selE.value !== null && Math.abs(selE.value - selS.value) > 0.02)
const canSplit = computed(() => clips.value.length > 0)

// 片段
interface Clip { id: string; start: number; end: number }
const clips = ref<Clip[]>([])
let cid = 0
const dragO = ref<number | null>(null); const dragS = ref<number | null>(null)

// ==== Canvas 全宽（虚拟） ====
const totalW = computed(() => Math.max(viewW.value, Math.ceil(totalDur.value * pps.value) + 24))
const H = 180
const padX = 12; const padY = 12

// ==== 视口裁剪绘制（核心优化：只画可见区 +/- 1 屏缓冲）====
let drawRaf = 0
function scheduleDraw() {
  if (drawRaf) return
  drawRaf = requestAnimationFrame(() => { drawRaf = 0; resizeAndDraw() })
}

function resizeAndDraw() {
  const c = cEl.value; if (!c) return
  const w = totalW.value
  if (c.width !== w || c.height !== H) {
    c.width = w; c.height = H
    c.style.width = w + 'px'; c.style.height = H + 'px'
  }
  drawViewport()
}

function onScroll() { scheduleDraw() }

/** 只画可见列 + 前后各一屏缓冲 */
function drawViewport() {
  const c = cEl.value; const panel = wp.value
  if (!c || !audioBuffer) return
  const ctx = c.getContext('2d')!
  const w = c.width

  const scrollL = panel ? panel.scrollLeft : 0
  const viewW2 = panel ? panel.clientWidth : viewW.value
  // 可见范围（像素）
  const visL = Math.max(0, scrollL - viewW2)
  const visR = Math.min(w, scrollL + viewW2 * 2)

  const plotH = H - padY * 2
  const cy = padY + plotH / 2
  const samples = audioBuffer.getChannelData(0)
  const sr = audioBuffer.sampleRate
  const zoom = ampZoom.value
  const sl = pps.value // secLen

  // 清可见区
  ctx.fillStyle = '#faf9f6'
  ctx.fillRect(visL, 0, visR - visL, H)

  // 中线（仅可见区）
  ctx.strokeStyle = 'rgba(0,0,0,0.05)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
  ctx.beginPath(); ctx.moveTo(visL, cy); ctx.lineTo(visR, cy); ctx.stroke(); ctx.setLineDash([])

  // 秒标记
  const secStep = sl > 60 ? 1 : sl > 25 ? 2 : sl > 15 ? 5 : 10
  const secStart = Math.floor((visL - padX) / sl / secStep) * secStep
  for (let sec = secStart; sec <= totalDur.value; sec += secStep) {
    const sx = padX + sec * sl
    if (sx < visL || sx > visR) continue
    ctx.strokeStyle = 'rgba(0,0,0,0.04)'; ctx.lineWidth = 0.5; ctx.setLineDash([2, 4])
    ctx.beginPath(); ctx.moveTo(sx, padY); ctx.lineTo(sx, padY + plotH); ctx.stroke(); ctx.setLineDash([])
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.font = '9px system-ui'; ctx.textAlign = 'center'
    ctx.fillText(sec + 's', sx, padY + plotH + 12)
  }

  // 片段（仅可见区）
  for (const cl of clips.value) {
    const cx = padX + cl.start * sl; const cw = (cl.end - cl.start) * sl
    if (cx + cw < visL || cx > visR) continue
    ctx.fillStyle = 'rgba(139,92,246,0.04)'; ctx.fillRect(cx, padY, cw, plotH)
  }
  for (const cl of clips.value) {
    const cx = padX + cl.end * sl
    if (cx < visL || cx > visR) continue
    ctx.strokeStyle = 'rgba(139,92,246,0.25)'; ctx.lineWidth = 1; ctx.setLineDash([3, 5])
    ctx.beginPath(); ctx.moveTo(cx, padY); ctx.lineTo(cx, padY + plotH); ctx.stroke(); ctx.setLineDash([])
  }

  // 选区
  if (hasSel.value) {
    const a = padX + Math.min(selS.value!, selE.value!) * sl; const b = padX + Math.max(selS.value!, selE.value!) * sl
    if (b >= visL && a <= visR) ctx.fillStyle = 'rgba(147,51,234,0.1)'; ctx.fillRect(Math.max(visL, a), padY, Math.min(visR, b) - Math.max(visL, a), plotH)
  }

  // === 波形（仅可见列，支持列跳过）===
  // 如果可见列超过 4000 就跳列
  const visCols = visR - visL
  const skip = visCols > 4000 ? Math.ceil(visCols / 3000) : 1
  const checkEvery = Math.max(1, Math.floor(sl / skip)) // 每个 bar 至少隔 1px

  for (let px = visL; px < visR; px += checkEvery) {
    if (px < padX || px >= w - padX) continue
    const s0 = Math.floor((px - padX) * sr / sl)
    const s1 = Math.floor((px + checkEvery - padX) * sr / sl)
    const step = Math.max(1, Math.floor((s1 - s0) / 6))
    let sum = 0; let cnt = 0
    for (let s = s0; s < s1; s += step) { if (s >= samples.length) break; sum += Math.abs(samples[s]); cnt++ }
    const rms = cnt > 0 ? sum / cnt : 0
    const halfH = (plotH * 0.44) * zoom
    const top = cy - rms * halfH * 1.6; const bot = cy + rms * halfH * 1.6
    const barH = bot - top
    const t = (px - padX) / sl
    const inClip = clips.value.some(c => t >= c.start && t < c.end)

    if (inClip) {
      const g = ctx.createLinearGradient(px, top, px, bot)
      g.addColorStop(0, '#c4b5fd'); g.addColorStop(0.35, '#a78bfa'); g.addColorStop(0.65, '#8b5cf6'); g.addColorStop(1, '#6d28d9')
      ctx.fillStyle = g
    } else { ctx.fillStyle = 'rgba(156,163,175,0.2)' }
    const bw = sl > 100 ? 1.5 : sl > 50 ? 1 : 0.5; const rr = Math.min(bw * 0.3, 1)
    ctx.beginPath(); rrct(ctx, px - bw / 2, top, bw, barH, rr); ctx.fill()
  }

  // 播放头
  const phx = padX + ph.value * sl
  if (phx >= visL && phx <= visR) {
    ctx.fillStyle = '#ef4444'; ctx.beginPath()
    ctx.moveTo(phx, padY); ctx.lineTo(phx - 4, padY + 9); ctx.lineTo(phx + 4, padY + 9); ctx.fill()
    ctx.beginPath(); ctx.moveTo(phx, padY + 9); ctx.lineTo(phx, padY + plotH); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5; ctx.stroke()
    ctx.shadowColor = 'rgba(239,68,68,0.3)'; ctx.shadowBlur = 4
    ctx.beginPath(); ctx.arc(phx, padY + plotH - 4, 4, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0
  }
}

function rrct(ctx: CanvasRenderingContext2D, x: number, y: number, ww: number, hh: number, r: number) {
  if (ww < 2 * r) r = ww / 2; if (hh < 2 * r) r = hh / 2
  ctx.moveTo(x + r, y); ctx.lineTo(x + ww - r, y); ctx.quadraticCurveTo(x + ww, y, x + ww, y + r)
  ctx.lineTo(x + ww, y + hh - r); ctx.quadraticCurveTo(x + ww, y + hh, x + ww - r, y + hh)
  ctx.lineTo(x + r, y + hh); ctx.quadraticCurveTo(x, y + hh, x, y + hh - r)
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath()
}

// ==== 加载 ====
onMounted(async () => {
  const url = (route.query.url as string) || ''
  if (!url) { errorMsg.value = '无音频 URL'; loading.value = false; return }
  if (wp.value) viewW.value = wp.value.clientWidth
  try {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`下载失败(${resp.status})`)
    const buf = await resp.arrayBuffer()
    const ctx2 = new AudioContext()
    audioBuffer = await ctx2.decodeAudioData(buf); ctx2.close()
    totalDur.value = audioBuffer.duration
    clips.value = [{ id: `c-${cid++}`, start: 0, end: audioBuffer.duration }]
    loading.value = false
    await nextTick()
    // 初始缩放：让音频全貌可见（至少 3px/s）
    if (wp.value) {
      viewW.value = wp.value.clientWidth
      pps.value = Math.max(3, Math.round(viewW.value / totalDur.value))
    }
    scheduleDraw()
  } catch (e: any) { errorMsg.value = e.message || '加载失败'; loading.value = false }
})

// 缩放/选区/片段变化 → 重绘
watch([ampZoom, pps, () => selS.value, () => selE.value, clips, ph], () => scheduleDraw())
window.addEventListener('resize', () => { if (wp.value) viewW.value = wp.value.clientWidth; scheduleDraw() })

// ==== 交互 ====
function tox(cx: number): number { const p = wp.value; if (!p) return 0; const r = p.getBoundingClientRect(); return (cx - r.left + p.scrollLeft - padX) / pps.value }
function clampT(t: number): number { return Math.max(0, Math.min(totalDur.value, t)) }
function beginDrag(cx: number): void { halt(); const t = clampT(tox(cx)); selS.value = t; selE.value = null; ph.value = t }
function contDrag(cx: number): void { if (!selS.value && selS.value !== 0) return; selE.value = clampT(tox(cx)); const p = wp.value; if (!p) return; const r = p.getBoundingClientRect(); if (cx > r.right - 30) p.scrollLeft += 10; else if (cx < r.left + 30) p.scrollLeft -= 10 }
function endDrag(): void { if (selE.value !== null && Math.abs((selE.value ?? 0) - (selS.value ?? 0)) < 0.02) { selS.value = selE.value = null } }
function onMD(e: MouseEvent): void { beginDrag(e.clientX) }
function onMM(e: MouseEvent): void { contDrag(e.clientX) }
function onMU(): void { endDrag() }
function onTS(e: TouchEvent): void { halt(); beginDrag(e.touches[0].clientX) }
function onTM(e: TouchEvent): void { contDrag(e.touches[0].clientX) }
function onTE(): void { endDrag() }
function onWheel(e: WheelEvent): void { pps.value = Math.max(minPps.value, Math.min(maxPps, pps.value + (e.deltaY > 0 ? -5 : 5))) }

// 播放时自动滚
watch(ph, () => { if (!playing.value || !wp.value) return; const p = wp.value; const px2 = padX + ph.value * pps.value; if (px2 < p.scrollLeft + 50 || px2 > p.scrollLeft + p.clientWidth - 50) p.scrollLeft = Math.max(0, px2 - p.clientWidth / 2); scheduleDraw() })

// ==== 播放 ====
async function togglePlay(): Promise<void> {
  if (playing.value) { halt(); return }
  if (!audioBuffer || !clips.value.length) return
  if (!audioCtx || audioCtx.state === 'closed') audioCtx = new AudioContext()
  const ordered = clips.value; let fi = 0, as = ordered[0].start
  for (let i = 0; i < ordered.length; i++) { const c = ordered[i]; if (ph.value >= c.start && ph.value < c.end) { as = ph.value; fi = i; break } else if (ph.value < c.start) { as = c.start; fi = i; break } }
  let off = 0
  for (let i = fi; i < ordered.length; i++) { const c = ordered[i]; const src = audioCtx!.createBufferSource(); src.buffer = audioBuffer!; src.connect(audioCtx!.destination); if (i === fi) { src.start(off, as, c.end - as); off += c.end - as } else { src.start(off, c.start, c.end - c.start); off += c.end - c.start } }
  pbStart = audioCtx!.currentTime; pbOffset = as; playing.value = true; animLoop()
}
function halt(): void { playing.value = false; cancelAnimationFrame(animId); if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null } }
function animLoop(): void { if (!playing.value || !audioCtx) return; ph.value = Math.min(totalDur.value, pbOffset + (audioCtx!.currentTime - pbStart)); animId = requestAnimationFrame(animLoop) }

// ==== 编辑 ====
function splitAtPlayhead(): void { const t = ph.value; const idx = clips.value.findIndex(c => t > c.start && t < c.end); if (idx === -1) return; const a = [...clips.value]; const cc = a[idx]; a.splice(idx, 1, { id: `c-${cid++}`, start: cc.start, end: t }, { id: `c-${cid++}`, start: t, end: cc.end }); clips.value = a }
function deleteSelection(): void { if (!hasSel.value) return; const a = Math.min(selS.value!, selE.value!); const b = Math.max(selS.value!, selE.value!); const r: Clip[] = []; for (const c of clips.value) { if (b <= c.start || a >= c.end) { r.push(c); continue } if (a <= c.start && b >= c.end) continue; if (a > c.start && b < c.end) { r.push({ id: `c-${cid++}`, start: c.start, end: a }, { id: `c-${cid++}`, start: b, end: c.end }) } else if (a <= c.start) { r.push({ id: `c-${cid++}`, start: b, end: c.end }) } else { r.push({ id: `c-${cid++}`, start: c.start, end: a }) } }; clips.value = r; selS.value = selE.value = null }
function onDrop(ti: number): void { dragO.value = null; if (dragS.value === null || dragS.value === ti) return; const a = [...clips.value]; const [it] = a.splice(dragS.value, 1); a.splice(ti, 0, it); clips.value = a; dragS.value = null }

// ==== 导出 ====
async function exportAudio(): Promise<void> { if (!audioBuffer || !clips.value.length) return; exporting.value = true; try { const tl = clips.value.reduce((s, c) => s + (c.end - c.start), 0); const sr = audioBuffer.sampleRate; const nc = audioBuffer.numberOfChannels; const oc = new OfflineAudioContext(nc, Math.ceil(tl * sr), sr); let off = 0; for (const c of clips.value) { const src = oc.createBufferSource(); src.buffer = audioBuffer; src.connect(oc.destination); src.start(off, c.start, c.end - c.start); off += c.end - c.start } const rendered = await oc.startRendering(); const blob = encWAV(rendered); const { supabase } = await import('@/composables/useSupabase'); const name = `edited-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.wav`; const { data, error: err } = await supabase.storage.from('posts-media').upload(`audio/${name}`, blob, { cacheControl: '31536000', upsert: false }); if (err) throw new Error(`上传: ${err.message}`); const { data: urlData } = supabase.storage.from('posts-media').getPublicUrl(data.path); sessionStorage.setItem('audio_editor_result', urlData.publicUrl); router.back() } catch (e: any) { alert('导出失败: ' + (e.message || '未知错误')) } finally { exporting.value = false } }
function encWAV(buf: AudioBuffer): Blob { const nc = buf.numberOfChannels; const sr = buf.sampleRate; const ba = nc * 2; const dl = buf.length * ba; const wav = new ArrayBuffer(44 + dl); const v = new DataView(wav); ws(v, 0, 'RIFF'); v.setUint32(4, 36 + dl, true); ws(v, 8, 'WAVE'); ws(v, 12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nc, true); v.setUint32(24, sr, true); v.setUint32(28, sr * ba, true); v.setUint16(32, ba, true); v.setUint16(34, 16, true); ws(v, 36, 'data'); v.setUint32(40, dl, true); let o = 44; for (let i = 0; i < buf.length; i++) for (let ch = 0; ch < nc; ch++) { const s = Math.max(-1, Math.min(1, buf.getChannelData(ch)[i])); v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2 } return new Blob([wav], { type: 'audio/wav' }) }
function ws(v: DataView, o: number, s: string): void { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }

function fmt(s: number): string { if (!isFinite(s) || s < 0) return '0:00'; const m = Math.floor(s / 60); return `${m}:${String(Math.floor(s) % 60).padStart(2, '0')}` }
function goBack(): void { halt(); if (audioCtx) audioCtx.close(); router.back() }
onUnmounted(() => { halt(); if (audioCtx) audioCtx.close() })
</script>
