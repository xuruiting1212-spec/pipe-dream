// ===== 帖子状态管理 =====
// 管理帖子列表、筛选、草稿等功能

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/composables/useSupabase'
import type { Post, PostForm, PostFilter } from '@/types'

export const usePostsStore = defineStore('posts', () => {
  /** 所有已加载的帖子 */
  const posts = ref<Post[]>([])
  /** 当前选中的帖子（详情查看） */
  const currentPost = ref<Post | null>(null)
  /** 加载状态 */
  const loading = ref(false)
  /** 错误 */
  const error = ref<string | null>(null)
  /** 当前筛选条件 */
  const filter = ref<PostFilter>({ type: 'all', tag: '', keyword: '' })

  /** 根据筛选条件过滤后的帖子 */
  const filteredPosts = computed(() => {
    let result = posts.value

    if (filter.value.type && filter.value.type !== 'all') {
      result = result.filter(p => p.type === filter.value.type)
    }
    if (filter.value.subtype && filter.value.subtype !== 'all') {
      result = result.filter(p => p.subtype === filter.value.subtype)
    }
    if (filter.value.tag) {
      result = result.filter(p => p.tags.includes(filter.value.tag!))
    }
    if (filter.value.keyword) {
      const kw = filter.value.keyword.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(kw) ||
        p.content.toLowerCase().includes(kw)
      )
    }
    return result
  })

  /** 草稿帖子 */
  const drafts = computed(() =>
    posts.value.filter(p => p.is_draft)
  )

  /** 私有帖子 */
  const privatePosts = computed(() =>
    posts.value.filter(p => p.visibility === 'private')
  )

  /** 分类帖子 */
  function getPostsByType(type: string) {
    return posts.value.filter(p => p.type === type && !p.is_draft)
  }

  /**
   * 加载帖子列表
   * @param includeAll - 是否加载所有帖子（含私有和草稿，仅登录用户）
   */
  async function fetchPosts(includeAll = false): Promise<void> {
    loading.value = true
    error.value = null
    try {
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (!includeAll) {
        // 访客只看到公开的非草稿帖子
        query = query
          .eq('visibility', 'public')
          .eq('is_draft', false)
      }

      const { data, error: err } = await query
      if (err) {
        error.value = err.message
        return
      }
      posts.value = data as Post[]
    } catch (e) {
      error.value = '加载帖子失败'
    } finally {
      loading.value = false
    }
  }

  /**
   * 根据 ID 获取单个帖子
   */
  async function fetchPostById(id: string): Promise<Post | null> {
    loading.value = true
    try {
      const { data, error: err } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single()

      if (err) {
        error.value = err.message
        return null
      }
      currentPost.value = data as Post
      return data as Post
    } catch (e) {
      error.value = '加载帖子详情失败'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存帖子（新建或编辑）
   */
  async function savePost(form: PostForm, postId?: string): Promise<Post | null> {
    loading.value = true
    error.value = null
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userId: string | null = user?.id ? String(user.id) : null
      const postData: Record<string, unknown> = {
        title: form.title,
        content: form.content,
        type: form.type,
        subtype: form.subtype,
        tags: form.tags,
        visibility: form.visibility,
        images: form.images,
        video: form.video,
        is_draft: form.is_draft,
        user_id: userId,
      }

      let result
      if (postId) {
        result = await supabase
          .from('posts')
          .update(postData as any)
          .eq('id', postId)
          .select()
          .single()
      } else {
        result = await supabase
          .from('posts')
          .insert(postData as any)
          .select()
          .single()
      }

      const { data, error: err } = result
      if (err) {
        error.value = err.message
        return null
      }

      const savedPost = data as Post
      // 更新本地列表
      if (postId) {
        const idx = posts.value.findIndex(p => p.id === postId)
        if (idx !== -1) posts.value[idx] = savedPost
      } else {
        posts.value.unshift(savedPost)
      }

      return savedPost
    } catch (e) {
      error.value = '保存帖子失败'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除帖子
   */
  async function deletePost(postId: string): Promise<boolean> {
    loading.value = true
    try {
      const { error: err } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (err) {
        error.value = err.message
        return false
      }
      posts.value = posts.value.filter(p => p.id !== postId)
      return true
    } catch (e) {
      error.value = '删除失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 上传文件到 Supabase Storage
   */
  async function uploadFile(file: File, folder: 'images' | 'videos' = 'images'): Promise<string | null> {
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`
      const filePath = `${folder}/${fileName}`

      const { data, error: err } = await supabase.storage
        .from('posts-media')
        .upload(filePath, file, {
          cacheControl: '31536000',
          upsert: false,
        })

      if (err) {
        error.value = `上传失败: ${err.message}`
        return null
      }

      // 获取公开 URL
      const { data: urlData } = supabase.storage
        .from('posts-media')
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (e) {
      error.value = '上传异常'
      return null
    }
  }

  /** 设置筛选条件 */
  function setFilter(newFilter: Partial<PostFilter>): void {
    filter.value = { ...filter.value, ...newFilter }
  }

  /** 重置筛选 */
  function resetFilter(): void {
    filter.value = { type: 'all', tag: '', keyword: '' }
  }

  /** 清空错误 */
  function clearError(): void {
    error.value = null
  }

  return {
    // 状态
    posts,
    currentPost,
    loading,
    error,
    filter,
    // 计算属性
    filteredPosts,
    drafts,
    privatePosts,
    // 方法
    fetchPosts,
    fetchPostById,
    savePost,
    deletePost,
    uploadFile,
    setFilter,
    resetFilter,
    clearError,
    getPostsByType,
  }
})
