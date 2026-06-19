// ===== 帖子状态管理 =====
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/composables/useSupabase'
import { fetchViewCounts as fetchViewCountsRemote, fetchViewCount as fetchViewCountRemote } from '@/composables/usePostViews'
import type { Post, PostForm, PostFilter } from '@/types'

export const usePostsStore = defineStore('posts', () => {
  const posts = ref<Post[]>([])
  const currentPost = ref<Post | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filter = ref<PostFilter>({ types: [], tag: '', keyword: '' })
  /** 帖子浏览量映射 { postId: count } */
  const viewCounts = ref<Record<string, number>>({})

  /** 根据多选分类过滤后的帖子（排除已删除和草稿） */
  const filteredPosts = computed(() => {
    let result = posts.value.filter(p => !p.deleted_at && !p.is_draft)

    if (filter.value.author && filter.value.author !== 'all') {
      result = result.filter(p => p.author_type === filter.value.author)
    }
    if (filter.value.types.length > 0) {
      result = result.filter(p => filter.value.types.includes(p.type as any))
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
        p.title.toLowerCase().includes(kw) || p.content.toLowerCase().includes(kw)
      )
    }
    // 时间线总览：按时间倒序排列
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  })

  const drafts = computed(() =>
    posts.value.filter(p => p.is_draft && !p.deleted_at)
  )

  const privatePosts = computed(() =>
    posts.value.filter(p => p.visibility === 'private' && !p.is_draft && !p.deleted_at)
  )

  /** 回收站：deleted_at 非空且未超过 7 天 */
  const trashedPosts = computed(() => {
    const now = new Date()
    return posts.value.filter(p => {
      if (!p.deleted_at) return false
      const deleted = new Date(p.deleted_at)
      const days = (now.getTime() - deleted.getTime()) / (1000 * 60 * 60 * 24)
      return days <= 7
    })
  })

  /** 加载帖子（排除回收站） */
  async function fetchPosts(includeAll = false): Promise<void> {
    loading.value = true; error.value = null
    try {
      let query = supabase.from('posts').select('*').is('deleted_at', null).order('created_at', { ascending: false })
      if (!includeAll) {
        query = query.eq('visibility', 'public').eq('is_draft', false)
      }
      const { data, error: err } = await query
      if (err) { error.value = err.message; return }
      posts.value = data as Post[]
    } finally { loading.value = false }
  }

  /** 加载回收站帖子 */
  async function fetchTrash(): Promise<void> {
    loading.value = true; error.value = null
    try {
      const { data, error: err } = await supabase.from('posts').select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
      if (err) { error.value = err.message; return }
      posts.value = data as Post[]
    } finally { loading.value = false }
  }

  async function fetchPostById(id: string): Promise<Post | null> {
    loading.value = true
    try {
      const { data, error: err } = await supabase.from('posts').select('*').eq('id', id).single()
      if (err) { error.value = err.message; return null }
      currentPost.value = data as Post
      return data as Post
    } finally { loading.value = false }
  }

  async function savePost(form: PostForm, postId?: string): Promise<Post | null> {
    loading.value = true; error.value = null
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userId: string | null = user?.id ? String(user.id) : null
      const postData: Record<string, unknown> = {
        title: form.title, content: form.content, type: form.type,
        subtype: form.subtype, tags: form.tags, visibility: form.visibility,
        images: form.images, video: form.video, audio: form.audio, is_draft: form.is_draft,
        user_id: userId, author_type: form.author_type || 'me',
      }

      let result
      if (postId) {
        result = await supabase.from('posts').update(postData as any).eq('id', postId).select().single()
      } else {
        result = await supabase.from('posts').insert(postData as any).select().single()
      }
      const { data, error: err } = result
      if (err) { error.value = err.message; return null }
      const saved = data as Post
      if (postId) {
        const idx = posts.value.findIndex(p => p.id === postId)
        if (idx !== -1) posts.value[idx] = saved
      } else { posts.value.unshift(saved) }
      return saved
    } finally { loading.value = false }
  }

  /** 软删除：设置 deleted_at */
  async function softDelete(postId: string): Promise<boolean> {
    loading.value = true
    try {
      const { error: err } = await supabase.from('posts').update({ deleted_at: new Date().toISOString() } as any).eq('id', postId)
      if (err) { error.value = err.message; return false }
      const p = posts.value.find(p => p.id === postId)
      if (p) p.deleted_at = new Date().toISOString()
      return true
    } finally { loading.value = false }
  }

  /** 从回收站恢复 */
  async function restorePost(postId: string): Promise<boolean> {
    loading.value = true
    try {
      const { error: err } = await supabase.from('posts').update({ deleted_at: null } as any).eq('id', postId)
      if (err) { error.value = err.message; return false }
      posts.value = posts.value.filter(p => p.id !== postId)
      return true
    } finally { loading.value = false }
  }

  /** 永久删除 */
  async function permanentDelete(postId: string): Promise<boolean> {
    loading.value = true
    try {
      const { error: err } = await supabase.from('posts').delete().eq('id', postId)
      if (err) { error.value = err.message; return false }
      posts.value = posts.value.filter(p => p.id !== postId)
      return true
    } finally { loading.value = false }
  }

  async function uploadFile(file: File, folder: 'images' | 'videos' | 'audio' = 'images'): Promise<string | null> {
    try {
      const ext = file.name.split('.').pop()
      const name = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`
      const { data, error: err } = await supabase.storage.from('posts-media').upload(`${folder}/${name}`, file, { cacheControl: '31536000', upsert: false })
      if (err) { error.value = `上传失败: ${err.message}`; return null }
      const { data: urlData } = supabase.storage.from('posts-media').getPublicUrl(data.path)
      return urlData.publicUrl
    } catch (e) { error.value = '上传异常'; return null }
  }

  /** 查询单篇帖子浏览量 */
  async function fetchViewCount(postId: string): Promise<number> {
    const count = await fetchViewCountRemote(postId)
    viewCounts.value[postId] = count
    return count
  }

  /** 批量查询帖子浏览量并更新 viewCounts */
  async function fetchViewCounts(postIds: string[]): Promise<void> {
    const counts = await fetchViewCountsRemote(postIds)
    viewCounts.value = { ...viewCounts.value, ...counts }
  }

  /** 更新帖子转文字内容和确认状态 */
  async function updateTranscript(
    postId: string,
    transcript: string,
    confirmed = false
  ): Promise<boolean> {
    try {
      const { error: err } = await supabase
        .from('posts')
        .update({ audio_transcript: transcript, audio_transcript_confirmed: confirmed } as any)
        .eq('id', postId)
      if (err) { error.value = err.message; return false }
      // 更新本地 currentPost 和 posts 数组
      if (currentPost.value && currentPost.value.id === postId) {
        currentPost.value.audio_transcript = transcript
        currentPost.value.audio_transcript_confirmed = confirmed
      }
      const idx = posts.value.findIndex(p => p.id === postId)
      if (idx !== -1) {
        posts.value[idx].audio_transcript = transcript
        posts.value[idx].audio_transcript_confirmed = confirmed
      }
      return true
    } catch (e) { error.value = '更新转文字失败'; return false }
  }

  function setFilter(f: Partial<PostFilter>): void { filter.value = { ...filter.value, ...f } }
  function toggleType(type: Post['type']): void {
    const idx = filter.value.types.indexOf(type)
    if (idx === -1) filter.value.types.push(type)
    else filter.value.types.splice(idx, 1)
  }
  function resetFilter(): void { filter.value = { types: [], tag: '', keyword: '' } }
  function clearError(): void { error.value = null }

  return {
    posts, currentPost, loading, error, filter, viewCounts,
    filteredPosts, drafts, privatePosts, trashedPosts,
    fetchPosts, fetchTrash, fetchPostById, savePost,
    softDelete, restorePost, permanentDelete, uploadFile,
    fetchViewCount, fetchViewCounts, updateTranscript,
    setFilter, toggleType, resetFilter, clearError,
  }
})
