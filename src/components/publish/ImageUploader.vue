<!--
  ===== ImageUploader — 图片上传组件 =====
  支持多张图片上传，不压缩画质
  预览已上传的图片，可拖拽排序和删除
-->

<template>
  <div>
    <label class="text-sm font-medium text-gray-600 mb-2 block">🖼️ 图片（多张，不压缩原图）</label>

    <!-- 已选图片预览 -->
    <div v-if="images.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
      <div
        v-for="(img, index) in images"
        :key="index"
        class="relative group rounded-dream-sm overflow-hidden bg-gray-100 aspect-square"
      >
        <img :src="img" alt="" class="w-full h-full object-cover" />
        <!-- 删除按钮 -->
        <button
          @click="removeImage(index)"
          class="absolute top-1 right-1 w-6 h-6 bg-red-500/80 text-white rounded-full
                 flex items-center justify-center text-xs
                 opacity-0 group-hover:opacity-100 transition-opacity
                 hover:bg-red-600"
        >
          ✕
        </button>
        <!-- 序号 -->
        <span class="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full">
          {{ index + 1 }}
        </span>
      </div>
    </div>

    <!-- 上传按钮 -->
    <div class="flex items-center gap-3">
      <label
        class="dream-btn-ghost cursor-pointer inline-flex items-center gap-2 text-sm"
        :class="{ 'opacity-50': uploading }"
      >
        <span v-if="uploading" class="w-4 h-4 border-2 border-dream-300 border-t-dream-500 rounded-full animate-spin"></span>
        <span v-else>📷</span>
        <span>{{ uploading ? '上传中...' : '选择图片' }}</span>
        <input
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="handleFileSelect"
          :disabled="uploading"
        />
      </label>
      <span class="text-xs text-gray-400">
        支持 JPG/PNG/WebP，原图上传不压缩
      </span>
    </div>

    <!-- 提示：长图保持清晰 -->
    <p class="text-xs text-gray-400 mt-2">
      💡 长图文字会保持清晰，图片不会被压缩
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePostsStore } from '@/stores/posts'

const props = defineProps<{
  images: string[]
}>()

const emit = defineEmits<{
  'update:images': [urls: string[]]
}>()

const postsStore = usePostsStore()
const uploading = ref(false)

/** 处理文件选择 */
async function handleFileSelect(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  uploading.value = true
  const newUrls: string[] = [...props.images]

  try {
    for (const file of Array.from(input.files)) {
      const url = await postsStore.uploadFile(file, 'images')
      if (url) {
        newUrls.push(url)
      }
    }
    emit('update:images', newUrls)
  } finally {
    uploading.value = false
    // 重置 input 以允许重新选择同一文件
    input.value = ''
  }
}

/** 删除图片 */
function removeImage(index: number): void {
  const newUrls = [...props.images]
  newUrls.splice(index, 1)
  emit('update:images', newUrls)
}
</script>
