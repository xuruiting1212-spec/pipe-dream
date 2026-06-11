<!-- TrashView — 最近删除，7天内可恢复 -->
<template>
  <div class="animate-fade-in">
    <h1 class="text-2xl font-bold text-gray-800 mb-2">🗑️ 最近删除</h1>
    <p class="text-sm text-gray-400 mb-6">删除的帖子保留 7 天，过期后自动清除</p>

    <div v-if="!postsStore.loading && trashItems.length === 0" class="text-center py-20">
      <div class="text-6xl mb-4">🗑️</div>
      <p class="text-gray-400 text-lg">回收站是空的</p>
    </div>

    <div v-else class="space-y-3">
      <div v-for="item in trashItems" :key="item.id"
        class="dream-card p-4 flex items-center gap-4 group">
        <div v-if="item.images?.length" class="w-16 h-16 rounded-dream-sm overflow-hidden flex-shrink-0">
          <img :src="item.images[0]" alt="" class="w-full h-full object-cover opacity-50" />
        </div>
        <div v-else class="w-16 h-16 rounded-dream-sm bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">🗑️</div>

        <div class="flex-1 min-w-0">
          <h3 class="font-medium text-gray-500 truncate">{{ item.title || '未命名' }}</h3>
          <p class="text-xs text-gray-400 mt-1">
            删除于 {{ formatDate(item.deleted_at!) }}
            <span class="text-red-400 ml-2">· {{ remainingDays(item.deleted_at!) }} 天后永久删除</span>
          </p>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <button @click="restore(item.id)"
            class="text-xs text-green-500 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full transition-all">
            ↩ 恢复
          </button>
          <button @click="permDelete(item.id)"
            class="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all px-2">
            ❌ 永久删除
          </button>
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

const trashItems = computed(() =>
  postsStore.posts.filter(p => p.deleted_at && remainingDays(p.deleted_at) > 0)
)

function remainingDays(deletedAt: string): number {
  const d = new Date(deletedAt)
  const now = new Date()
  const diff = 7 - (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.ceil(diff))
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function restore(id: string): Promise<void> {
  const ok = await postsStore.restorePost(id)
  if (!ok) alert('恢复失败')
}

async function permDelete(id: string): Promise<void> {
  if (!window.confirm('确定永久删除？此操作不可恢复。')) return
  const ok = await postsStore.permanentDelete(id)
  if (!ok) alert('删除失败')
}

onMounted(async () => {
  if (!authStore.isLoggedIn) { router.push('/login'); return }
  await postsStore.fetchTrash()
})
</script>
