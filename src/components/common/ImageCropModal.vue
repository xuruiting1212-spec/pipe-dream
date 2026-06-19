<!--
  ImageCropModal — 图片裁剪
  图片渲染为视觉尺寸（无CSS scale），坐标映射精确
-->
<template>
  <Teleport to="body">
    <div class="crop-root">
      <div class="crop-topbar">
        <button class="crop-btn-ghost" @click="$emit('close')">✕ 取消</button>
        <span class="crop-title">{{ title }}</span>
        <button class="crop-btn-done" @click="doCrop">✓ 确定裁剪</button>
      </div>

      <div ref="stageRef" class="crop-stage"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @wheel.prevent="onWheel">

        <img ref="imgRef" :src="src" class="crop-img" :style="imgStyle" draggable="false" />

        <!-- 遮罩：四面板，围出中心裁剪框 -->
        <div class="crop-mask" :style="maskTop" />
        <div class="crop-mask" :style="maskBottom" />
        <div class="crop-mask" :style="maskLeft" />
        <div class="crop-mask" :style="maskRight" />
        <div class="crop-outline" :style="frameOutline" />
      </div>

      <div class="crop-bottombar">
        🖱️ 拖拽移动 · 滚轮缩放 · 调整到满意后点「确定裁剪」
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'

const props = defineProps<{ src: string; title?: string; aspectRatio?: number }>()
const emit = defineEmits<{ close: []; cropped: [blob: Blob] }>()
const ratio = (props.aspectRatio && props.aspectRatio > 0) ? props.aspectRatio : null  // null = 自由比例

const stageRef = ref<HTMLDivElement | null>(null)
const imgRef   = ref<HTMLImageElement | null>(null)

// 图片：视觉宽高（CSS px） + 偏移
const vw = ref(800) // visual width
const vh = ref(600) // visual height
const dx = ref(0)   // translate X
const dy = ref(0)   // translate Y

// 裁剪框（stage正中，固定大小）
const frame = reactive({ w: 300, h: 300, x: 0, y: 0 })

const imgStyle = computed(() => ({
  transform: `translate(${dx.value}px, ${dy.value}px)`,
  width:  vw.value + 'px',
  height: vh.value + 'px',
}))

// 四块遮罩
const maskTop    = computed(() => ({ top: '0', left: '0', right: '0', height: frame.y + 'px' }))
const maskBottom = computed(() => ({ top: (frame.y + frame.h) + 'px', bottom: '0', left: '0', right: '0' }))
const maskLeft   = computed(() => ({ top: frame.y + 'px', height: frame.h + 'px', left: '0', width: frame.x + 'px' }))
const maskRight  = computed(() => ({ top: frame.y + 'px', height: frame.h + 'px', left: (frame.x + frame.w) + 'px', right: '0' }))
const frameOutline = computed(() => ({ left: frame.x + 'px', top: frame.y + 'px', width: frame.w + 'px', height: frame.h + 'px' }))

function recalcFrame() {
  const stg = stageRef.value
  if (!stg) return
  const sw = stg.clientWidth; const sh = stg.clientHeight
  if (!sw || !sh) return
  const maxFw = sw * 0.85; const maxFh = sh * 0.85
  if (ratio) {
    // 有固定比例（头像1:1，背景2:1）
    if (maxFw / ratio <= maxFh) {
      frame.w = Math.round(maxFw); frame.h = Math.round(maxFw / ratio)
    } else {
      frame.h = Math.round(maxFh); frame.w = Math.round(maxFh * ratio)
    }
  } else {
    // 自由比例 → 默认正方形，取宽高中较小的一侧
    const side = Math.round(Math.min(maxFw, maxFh))
    frame.w = side
    frame.h = side
  }
  frame.x = Math.round((sw - frame.w) / 2)
  frame.y = Math.round((sh - frame.h) / 2)
}

function fitImage() {
  const img = imgRef.value; const stg = stageRef.value
  if (!img || !stg) return
  if (!img.complete || !img.naturalWidth) { img.addEventListener('load', fitImage, { once: true }); return }

  recalcFrame()
  const sw = stg.clientWidth; const sh = stg.clientHeight
  const nw = img.naturalWidth; const nh = img.naturalHeight

  const s = Math.min(sw / nw, sh / nh, 1)
  vw.value = Math.round(nw * s)
  vh.value = Math.round(nh * s)  // 宽高独立从原尺寸算，比例不漂移

  dx.value = Math.round((sw - vw.value) / 2)
  dy.value = Math.round((sh - vh.value) / 2)
}

// 拖拽
let dragging = false
let dSX = 0, dSY = 0, dOrigX = 0, dOrigY = 0

function onPointerDown(e: PointerEvent) {
  stageRef.value?.setPointerCapture(e.pointerId)
  dragging = true; dSX = e.clientX; dSY = e.clientY; dOrigX = dx.value; dOrigY = dy.value
}
function onPointerMove(e: PointerEvent) {
  if (!dragging) return
  dx.value = dOrigX + (e.clientX - dSX); dy.value = dOrigY + (e.clientY - dSY)
}
function onPointerUp(_e: PointerEvent) { dragging = false }

function onWheel(e: WheelEvent) {
  const stg = stageRef.value; if (!stg) return
  const rect = stg.getBoundingClientRect()
  const mx = e.clientX - rect.left; const my = e.clientY - rect.top

  const img = imgRef.value
  if (!img?.naturalWidth) return
  const nw = img.naturalWidth; const nh = img.naturalHeight

  const s0 = vw.value / nw
  const s1 = Math.max(0.05, Math.min(8, s0 * (e.deltaY < 0 ? 1.06 : 0.94)))

  // 宽高都从原始尺寸 × 同一 scale 独立算，杜绝取整漂移
  vw.value = Math.round(nw * s1)
  vh.value = Math.round(nh * s1)

  const r = s1 / s0
  dx.value = mx - r * (mx - dx.value)
  dy.value = my - r * (my - dy.value)
}

function doCrop() {
  const img = imgRef.value; if (!img) return
  const nw = img.naturalWidth; const nh = img.naturalHeight
  if (!nw || !nh) return

  // scale = visual_pixels / natural_pixels
  const s = vw.value / nw

  const sx = (frame.x - dx.value) / s
  const sy = (frame.y - dy.value) / s
  const sw = frame.w / s
  const sh = frame.h / s

  const canvas = document.createElement('canvas')
  canvas.width = frame.w; canvas.height = frame.h
  canvas.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, frame.w, frame.h)
  canvas.toBlob((b: Blob | null) => { if (b) emit('cropped', b) }, 'image/png')
}

watch(() => props.src, () => nextTick(fitImage))
onMounted(() => { fitImage() })
</script>

<style>
/* 全局样式（不用 scoped — Teleport 移到 body 后 scoped 可能不命中） */
.crop-root {
  position: fixed; inset: 0; z-index: 140;
  display: flex; flex-direction: column;
  background: #111; user-select: none;
}
.crop-topbar {
  height: 52px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; background: rgba(0,0,0,.75);
  color: #fff; font-size: 14px; z-index: 20;
}
.crop-btn-ghost {
  color: rgba(255,255,255,.6); font-size: 14px; background: none;
  border: none; cursor: pointer; padding: 8px 12px; border-radius: 8px;
}
.crop-btn-ghost:hover { background: rgba(255,255,255,.1); color: #fff; }
.crop-title { font-size: 14px; color: rgba(255,255,255,.5); }
.crop-btn-done {
  background: linear-gradient(135deg, #e91e63, #9c27b0); color: #fff;
  padding: 8px 24px; border-radius: 9999px; font-size: 14px; font-weight: 600;
  border: none; cursor: pointer; z-index: 10;
}
.crop-btn-done:hover { opacity: .9; }

.crop-stage {
  flex: 1; min-height: 0; position: relative; overflow: hidden;
  background: #1a1a1a; touch-action: none;
}

.crop-img {
  position: absolute; top: 0; left: 0; display: block;
  transform-origin: top left;
  image-rendering: auto;
}

.crop-mask {
  position: absolute; background: rgba(0,0,0,.5); pointer-events: none;
}

.crop-outline {
  position: absolute; pointer-events: none;
  outline: 2px solid rgba(233,30,99,.85); z-index: 10;
}

.crop-bottombar {
  height: 36px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,.3); font-size: 12px;
  background: rgba(0,0,0,.75); z-index: 20;
}
</style>
