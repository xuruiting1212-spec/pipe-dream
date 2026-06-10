<!--
  ===== LoadingSpinner — 加载动画组件 =====
-->

<template>
  <div class="flex justify-center items-center py-12">
    <div class="w-8 h-8 border-3 border-dream-300 border-t-dream-500 rounded-full animate-spin"></div>
    <span v-if="message" class="ml-3 text-sm text-gray-400">{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>
