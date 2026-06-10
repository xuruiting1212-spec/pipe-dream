<!--
  ===== MarkdownEditor — Markdown 编辑器（所见即所得） =====
  左侧编辑区 + 右侧预览区，两端同步滚动
-->

<template>
  <div class="flex flex-col md:flex-row gap-4 min-h-[400px]">
    <!-- 编辑区 -->
    <div class="flex-1 flex flex-col">
      <label class="text-sm font-medium text-gray-600 mb-2">📝 正文 (Markdown)</label>
      <textarea
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        :placeholder="placeholder"
        class="dream-input flex-1 min-h-[300px] resize-y font-mono text-sm leading-relaxed"
      ></textarea>
      <p class="text-xs text-gray-400 mt-1">
        支持 Markdown 语法：**粗体** *斜体* # 标题 [链接](url) ![图片](url)
      </p>
    </div>

    <!-- 预览区 -->
    <div class="flex-1 flex flex-col">
      <label class="text-sm font-medium text-gray-600 mb-2">👁️ 预览</label>
      <div
        class="dream-input flex-1 min-h-[300px] overflow-y-auto p-4
               markdown-body bg-white/60"
        v-html="renderedMarkdown"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

/** 渲染 Markdown 为 HTML */
const renderedMarkdown = computed(() => {
  if (!props.modelValue) return '<p class="text-gray-300 text-sm">在左侧输入内容查看预览...</p>'
  return marked.parse(props.modelValue, {
    breaks: true,       // 换行即 <br>
    gfm: true,          // GitHub Flavored Markdown
  }) as string
})
</script>
