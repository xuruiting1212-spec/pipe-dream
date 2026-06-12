<!-- ImageCropModal — 全屏裁剪，固定框+图片可拖移缩放 -->
<template>
  <Teleport to="body">
    <div class="crop-overlay" @click.self="$emit('close')">
      <!-- 顶部工具栏 -->
      <div class="crop-topbar">
        <button class="crop-btn-close" @click="$emit('close')">✕</button>
        <span>{{ title }}</span>
        <button class="crop-btn-done" @click="doCrop">确定裁剪</button>
      </div>

      <!-- 裁剪主体容器 -->
      <div ref="cropWrap" class="crop-stage">
        <img ref="cropImg" :src="src" />
      </div>

      <!-- 底部提示 -->
      <div class="crop-bottombar">
        🖱️ 拖拽移动 · 滚轮缩放 · {{ cropHintShort }}
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed, onBeforeUnmount } from 'vue'
import Cropper from 'cropperjs'

const props = defineProps<{
  src: string; title?: string; aspectRatio?: number; cropHint?: string
}>()

const emit = defineEmits<{ close: []; cropped: [blob: Blob] }>()

const cropImg = ref<HTMLImageElement | null>(null)
const cropWrap = ref<HTMLDivElement | null>(null)
let cropper: Cropper | null = null
const cropHintShort = computed(() => (props.aspectRatio ?? 1) === 1 ? '1:1 正方形' : '2:1 横幅')

function init() {
  const img = cropImg.value
  const wrap = cropWrap.value
  if (!img || !wrap) return
  if (cropper) cropper.destroy()

  cropper = new Cropper(img, {
    aspectRatio: props.aspectRatio ?? 1,
    viewMode: 0,
    dragMode: 'move',
    cropBoxMovable: false,
    cropBoxResizable: false,
    autoCropArea: 0.85,
    center: true,
    guides: true,
    highlight: true,
    background: false,
    modal: true,
    zoomable: true,
    zoomOnWheel: true,
    toggleDragModeOnDblclick: false,
    responsive: false,
  } as any)

  // cropperjs 会在 container/canvas 上设固定宽高（= 图片尺寸）
  // 我们需要清掉，让容器靠 CSS 保持尺寸
  nextTick(() => {
    fixCropperSize(wrap)
  })
}

/** 清除 cropperjs 写入的内联尺寸，让 CSS 接管 */
function fixCropperSize(wrap: HTMLElement) {
  const container = wrap.querySelector('.cropper-container') as HTMLElement | null
  if (!container) return
  container.style.removeProperty('width')
  container.style.removeProperty('height')
  container.style.removeProperty('max-width')
  container.style.removeProperty('max-height')
  container.style.position = ''   // 让 CSS 的 relative 生效

  const canvas = container.querySelector('.cropper-canvas') as HTMLElement | null
  if (canvas) {
    canvas.style.removeProperty('width')
    canvas.style.removeProperty('height')
  }

  const wrapBox = container.querySelector('.cropper-wrap-box') as HTMLElement | null
  if (wrapBox) {
    wrapBox.style.removeProperty('width')
    wrapBox.style.removeProperty('height')
  }
}

function doCrop() {
  if (!cropper) return
  const getCanvas = (cropper as any).getCroppedCanvas || cropper.getCropperCanvas.bind(cropper)
  const canvas = getCanvas({})
  if (!canvas) return
  canvas.toBlob((b: Blob | null) => { if (b) emit('cropped', b) }, 'image/png')
}

watch(() => props.src, () => nextTick(() => setTimeout(init, 200)))
onMounted(() => nextTick(() => setTimeout(init, 200)))
onBeforeUnmount(() => { if (cropper) { cropper.destroy(); cropper = null } })
</script>

<style>
/* === 弹窗结构 === */
.crop-overlay {
  position: fixed; inset: 0; z-index: 140;
  display: flex; flex-direction: column; align-items: center;
  background: #111;
}
.crop-topbar {
  width: 100%; height: 52px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; background: rgba(0,0,0,.7);
  color: rgba(255,255,255,.8); font-size: 14px; box-sizing: border-box;
}
.crop-btn-close {
  color: rgba(255,255,255,.7); font-size: 20px; width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: none; border: none; cursor: pointer;
}
.crop-btn-close:hover { background: rgba(255,255,255,.1); }
.crop-btn-done {
  background: linear-gradient(135deg,#e91e63,#9c27b0); color: white;
  padding: 8px 24px; border-radius: 9999px; font-size: 14px;
  border: none; cursor: pointer;
}
.crop-stage {
  /* 桌面端 90vw × 70vh，手机端 95vw × 50vh */
  width: 90vw; height: 70vh;
  flex-shrink: 0; position: relative;
  background: #1a1a1a; overflow: hidden;
}
.crop-bottombar {
  width: 100%; height: 32px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,.35); font-size: 12px;
  background: rgba(0,0,0,.7);
}

/* === cropperjs 容器强制充满 crop-stage === */
.crop-stage .cropper-container {
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  position: relative !important;
  direction: ltr; font-size: 0; line-height: 0;
  touch-action: none; user-select: none;
}
/* 让画布也跟着拉伸 */
.crop-stage .cropper-canvas {
  width: 100% !important;
  height: 100% !important;
  position: absolute; inset: 0; overflow: hidden;
}
.crop-stage .cropper-wrap-box {
  width: 100% !important;
  height: 100% !important;
  position: absolute; inset: 0; overflow: hidden;
}
/* 图片在画布内铺满 */
.crop-stage .cropper-canvas img {
  object-fit: contain;
  min-width: 100% !important;
  min-height: 100% !important;
}

/* === 裁剪框/模态/辅助线 === */
.cropper-drag-box  { background: #fff; opacity: 0; position: absolute; inset: 0; }
.cropper-modal     { background: #000; opacity: .55; position: absolute; inset: 0; }
.cropper-view-box  { outline: 2px solid rgba(233,30,99,.85); }
.cropper-dashed     { border: 0 dashed rgba(255,255,255,.4); display: block; opacity: .5; position: absolute; }
.cropper-dashed.dashed-h { border-bottom-width: 1px; border-top-width: 1px; height: 33.3333%; left: 0; top: 33.3333%; width: 100%; }
.cropper-dashed.dashed-v { border-left-width: 1px; border-right-width: 1px; height: 100%; left: 33.3333%; top: 0; width: 33.3333%; }
.cropper-center     { display: block; height: 0; left: 50%; opacity: .75; position: absolute; top: 50%; width: 0; }
.cropper-center::before,.cropper-center::after { background: rgba(255,255,255,.6); content: ' '; display: block; position: absolute; }
.cropper-center::before { height: 1px; left: -3px; top: 0; width: 7px; }
.cropper-center::after  { height: 7px; left: 0; top: -3px; width: 1px; }
.cropper-face       { background: #fff; left: 0; top: 0; opacity: .1; position: absolute; }
.cropper-line       { background: #e91e63; position: absolute; }
.cropper-line.line-e { right: -3px; top: 0; width: 5px; }
.cropper-line.line-n { height: 5px; left: 0; top: -3px; }
.cropper-line.line-w { left: -3px; top: 0; width: 5px; }
.cropper-line.line-s { bottom: -3px; height: 5px; left: 0; }
.cropper-point       { background: #e91e63; height: 5px; opacity: .75; width: 5px; position: absolute; display: none; } /* 隐藏拖拽手柄 — 裁剪框不可缩放 */
.cropper-point.point-se { display: none; }
.cropper-invisible   { opacity: 0; }
.cropper-hide        { display: block; height: 0; position: absolute; width: 0; }
.cropper-hidden      { display: none !important; }
.cropper-move        { cursor: move; }
.cropper-crop        { cursor: crosshair; }

/* === 手机端 === */
@media (max-width: 767px) {
  .crop-stage {
    width: 95vw; height: 55vh;
  }
  .crop-topbar { padding: 0 16px; height: 46px; }
  .crop-btn-done { padding: 6px 18px; font-size: 13px; }
}
</style>
