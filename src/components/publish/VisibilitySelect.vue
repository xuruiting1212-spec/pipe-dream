<!--
  ===== VisibilitySelect — 可见范围选择组件 =====
  公开 / 仅自己可见
-->

<template>
  <div>
    <label class="text-sm font-medium text-gray-600 mb-2 block">👁️ 可见范围</label>
    <div class="flex gap-3">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        @click="$emit('update:modelValue', option.value)"
        class="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium
               transition-all duration-300"
        :class="modelValue === option.value
          ? 'bg-gradient-to-r from-dream-500 to-purple-500 text-white shadow-dream'
          : 'bg-white/70 text-gray-600 hover:bg-dream-50'"
      >
        <span>{{ option.emoji }}</span>
        <span>{{ option.label }}</span>
      </button>
    </div>
    <p class="text-xs text-gray-400 mt-1.5">
      <template v-if="modelValue === 'public'">
        🌍 所有人可见 — 任何人访问网站都能看到
      </template>
      <template v-else>
        🔒 仅自己可见 — 只有登录后的你可以看到
      </template>
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

const options = [
  { value: 'public', label: '公开', emoji: '🌍' },
  { value: 'private', label: '仅自己', emoji: '🔒' },
]
</script>
