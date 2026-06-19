<!--
  ===== TagInput — 标签输入组件 =====
  支持逗号或空格分隔的标签输入
  已添加的标签以卡片形式展示，可删除
-->

<template>
  <div>
    <label class="text-sm font-medium text-gray-600 mb-2 block">🏷️ 标签（用逗号或空格分隔）</label>

    <!-- 已添加的标签 -->
    <div v-if="tags.length > 0" class="flex flex-wrap gap-2 mb-3">
      <span
        v-for="(tag, index) in tags"
        :key="index"
        class="dream-tag flex items-center gap-1 cursor-default"
      >
        #{{ tag }}
        <button
          type="button"
          @click="removeTag(index)"
          class="text-dream-400 hover:text-dream-600 text-xs ml-0.5"
        >
          ✕
        </button>
      </span>
    </div>

    <!-- 输入框 -->
    <input
      v-model="inputValue"
      type="text"
      placeholder="输入标签，按回车/逗号/空格添加"
      class="dream-input"
      @keydown="handleKeydown"
      @blur="addTag"
    />
    <p class="text-xs text-gray-400 mt-1">
      示例：旅行 日常 美食
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  tags: string[]
}>()

const emit = defineEmits<{
  'update:tags': [tags: string[]]
}>()

const inputValue = ref('')

/** 处理键盘事件 */
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
    event.preventDefault()
    addTag()
  }
  // Backspace 删除最后一个标签
  if (event.key === 'Backspace' && inputValue.value === '' && props.tags.length > 0) {
    const newTags = [...props.tags]
    newTags.pop()
    emit('update:tags', newTags)
  }
}

/** 添加标签 */
function addTag(): void {
  const raw = inputValue.value.trim().replace(/,/g, ' ')
  if (!raw) return

  // 用空格分割
  const newTags = raw
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0 && !props.tags.includes(t))

  if (newTags.length > 0) {
    emit('update:tags', [...props.tags, ...newTags])
  }

  inputValue.value = ''
}

/** 删除标签 */
function removeTag(index: number): void {
  const newTags = [...props.tags]
  newTags.splice(index, 1)
  emit('update:tags', newTags)
}
</script>
