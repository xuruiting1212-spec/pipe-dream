<!-- TowaPostsView — Towa的发布 -->
<template>
  <div class="animate-fade-in">
    <h1 class="text-2xl font-bold text-gray-800 mb-2">💬 Towa的发布</h1>
    <p class="text-sm text-gray-400 mb-6">通过画板「记录点滴」发布的内容</p>
    <PostGrid :posts="towaPosts" :loading="loading" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'; import { supabase } from '@/composables/useSupabase'
import PostGrid from '@/components/posts/PostGrid.vue'
const towaPosts = ref<any[]>([]); const loading = ref(true)
onMounted(async () => {
  const { data } = await supabase.from('posts').select('*').eq('author_type', 'towa').eq('is_draft', false).is('deleted_at', null).order('created_at', { ascending: false })
  if (data) towaPosts.value = data; loading.value = false
})
</script>
