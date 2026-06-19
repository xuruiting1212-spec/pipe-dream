<!--
  ===== PrivateView — 私有物页 =====
  仅登录用户可见，展示 visibility='private' 的帖子
-->

<template>
  <div class="animate-fade-in">
    <h1 class="text-2xl font-bold text-gray-800 mb-2">🔒 私有物</h1>
    <p class="text-sm text-gray-400 mb-6">这里存放仅自己可见的私密内容</p>

    <!-- 空状态 -->
    <div
      v-if="!postsStore.loading && privatePosts.length === 0"
      class="text-center py-20"
    >
      <div class="text-6xl mb-4">🔒</div>
      <p class="text-gray-400 text-lg">暂无私有内容</p>
      <p class="text-gray-300 text-sm mt-1">发布时选择"仅自己"的帖子会出现在这里</p>
    </div>

    <!-- 私有帖子网格 -->
    <PostGrid
      v-else
      :posts="privatePosts"
      :loading="postsStore.loading"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePostsStore } from '@/stores/posts'
import { useAuthStore } from '@/stores/auth'
import PostGrid from '@/components/posts/PostGrid.vue'

const router = useRouter()
const postsStore = usePostsStore()
const authStore = useAuthStore()

/** 私有帖子 */
const privatePosts = computed(() =>
  postsStore.posts.filter(p => p.visibility === 'private' && !p.is_draft)
)

onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  await postsStore.fetchPosts(true)
  // 加载私有帖子的浏览量
  const ids = privatePosts.value.map(p => p.id)
  if (ids.length > 0) await postsStore.fetchViewCounts(ids)
})
</script>
