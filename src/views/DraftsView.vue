<!-- DraftsView — 草稿箱 -->
<template>
  <div class="animate-fade-in">
    <h1 class="text-2xl font-bold text-gray-800 mb-2">📋 我的草稿</h1>
    <p class="text-sm text-gray-400 mb-6">这里保存了所有未发布的草稿</p>

    <div v-if="!postsStore.loading && drafts.length === 0" class="text-center py-20">
      <div class="text-6xl mb-4">📝</div>
      <p class="text-gray-400 text-lg">暂无草稿</p>
    </div>

    <div v-else class="space-y-3">
      <div v-for="draft in drafts" :key="draft.id"
        class="dream-card p-4 flex items-center gap-4 cursor-pointer hover:shadow-dream-lg transition-all group"
        @click="router.push(`/publish/${draft.id}`)">
        <div v-if="draft.images?.length" class="w-16 h-16 rounded-dream-sm overflow-hidden flex-shrink-0">
          <img :src="draft.images[0]" alt="" class="w-full h-full object-cover" />
        </div>
        <div v-else class="w-16 h-16 rounded-dream-sm bg-dream-50 flex items-center justify-center text-2xl flex-shrink-0">📝</div>

        <div class="flex-1 min-w-0">
          <h3 class="font-medium text-gray-800 truncate">{{ draft.title || '未命名草稿' }}</h3>
          <p class="text-xs text-gray-400 mt-1">{{ formatDate(draft.created_at) }} · {{ draft.type }}</p>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <span class="text-xs text-amber-500 bg-amber-50 px-2 py-1 rounded-full">草稿</span>
          <button @click.stop="handleDelete(draft.id)"
            class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-sm px-2">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePostsStore } from '@/stores/posts'
import { useAuthStore } from '@/stores/auth'

const router = useRouter(); const postsStore = usePostsStore(); const authStore = useAuthStore()
const drafts = computed(() => postsStore.posts.filter(p => p.is_draft && !p.deleted_at))

function formatDate(d: string): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function handleDelete(id: string): Promise<void> {
  if (!window.confirm('删除这个草稿？会移到回收站，7天内可恢复。')) return
  await postsStore.softDelete(id)
}

onMounted(async () => {
  if (!authStore.isLoggedIn) { router.push('/login'); return }
  await postsStore.fetchPosts(true)
})
</script>
