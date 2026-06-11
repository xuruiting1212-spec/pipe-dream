<!-- ImageUploader — 图片上传 + 预览 + 灯箱 -->
<template>
  <div>
    <label class="text-sm font-medium text-gray-600 mb-2 block">🖼️ 图片（多张，不压缩原图）</label>

    <!-- 已选图片预览 -->
    <div v-if="images.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
      <div v-for="(img, index) in images" :key="index"
        class="relative group rounded-dream-sm overflow-hidden bg-gray-100 aspect-square cursor-pointer"
        @click="previewIndex = index">
        <img :src="img" alt="" class="w-full h-full object-cover" />
        <button @click.stop="removeImage(index)"
          class="absolute top-1 right-1 w-6 h-6 bg-red-500/80 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">✕</button>
        <span class="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full">{{ index + 1 }}</span>
      </div>
    </div>

    <!-- 上传按钮 -->
    <div class="flex items-center gap-3">
      <label class="dream-btn-ghost cursor-pointer inline-flex items-center gap-2 text-sm" :class="{ 'opacity-50': uploading }">
        <span v-if="uploading" class="w-4 h-4 border-2 border-dream-300 border-t-dream-500 rounded-full animate-spin"></span>
        <span v-else>📷</span>
        <span>{{ uploading ? '上传中...' : '选择图片' }}</span>
        <input type="file" accept="image/*" multiple class="hidden" @change="handleFileSelect" :disabled="uploading" />
      </label>
      <span class="text-xs text-gray-400">JPG/PNG/WebP，原图不压缩</span>
    </div>

    <!-- 图片灯箱预览 -->
    <div v-if="previewIndex !== null" class="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center cursor-pointer"
      @click="previewIndex = null" @keydown.escape="previewIndex = null">
      <button @click.stop="previewIndex = null" class="absolute top-4 right-4 text-white text-3xl hover:text-gray-300">✕</button>
      <button v-if="previewIndex > 0" @click.stop="previewIndex--"
        class="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300">‹</button>
      <img :src="images[previewIndex]" class="max-w-[95vw] max-h-[95vh] object-contain" @click.stop />
      <button v-if="previewIndex < images.length - 1" @click.stop="previewIndex++"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300">›</button>
      <span class="absolute bottom-4 text-white/60 text-sm">{{ previewIndex + 1 }} / {{ images.length }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePostsStore } from '@/stores/posts'

const props = defineProps<{ images: string[] }>()
const emit = defineEmits<{ 'update:images': [urls: string[]] }>()

const postsStore = usePostsStore()
const uploading = ref(false)
const previewIndex = ref<number | null>(null)

async function handleFileSelect(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  uploading.value = true
  const newUrls = [...props.images]
  try {
    for (const file of Array.from(input.files)) {
      const url = await postsStore.uploadFile(file, 'images')
      if (url) newUrls.push(url)
    }
    emit('update:images', newUrls)
  } finally {
    uploading.value = false; input.value = ''
  }
}

function removeImage(index: number): void {
  const urls = [...props.images]; urls.splice(index, 1)
  emit('update:images', urls)
}
</script>
