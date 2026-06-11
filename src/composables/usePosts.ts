// ===== 帖子 CRUD 逻辑 — 软删除 + Storage 上传 =====
import { ref } from 'vue'
import { supabase } from './useSupabase'
import type { Post, PostForm, ApiResponse, UploadResult } from '@/types'

const loading = ref(false); const error = ref<string | null>(null)

async function fetchPosts(includeAll = false): Promise<ApiResponse<Post[]>> {
  loading.value = true; error.value = null
  try {
    let query = supabase.from('posts').select('*').is('deleted_at', null).order('created_at', { ascending: false })
    if (!includeAll) query = query.eq('visibility', 'public').eq('is_draft', false)
    const { data, error: err } = await query
    if (err) { error.value = err.message; return { data: null, error: err.message } }
    return { data: data as Post[], error: null }
  } finally { loading.value = false }
}

async function fetchPostById(id: string): Promise<ApiResponse<Post>> {
  loading.value = true; error.value = null
  try {
    const { data, error: err } = await supabase.from('posts').select('*').eq('id', id).single()
    if (err) { error.value = err.message; return { data: null, error: err.message } }
    return { data: data as Post, error: null }
  } finally { loading.value = false }
}

async function savePost(form: PostForm, postId?: string): Promise<ApiResponse<Post>> {
  loading.value = true; error.value = null
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const userId: string | null = user?.id ? String(user.id) : null
    const postData: Record<string, unknown> = {
      title: form.title, content: form.content, type: form.type,
      subtype: form.subtype, tags: form.tags, visibility: form.visibility,
      images: form.images, video: form.video, is_draft: form.is_draft, user_id: userId,
    }
    let result
    if (postId) result = await supabase.from('posts').update(postData as any).eq('id', postId).select().single()
    else result = await supabase.from('posts').insert(postData as any).select().single()
    const { data, error: err } = result
    if (err) { error.value = err.message; return { data: null, error: err.message } }
    return { data: data as Post, error: null }
  } finally { loading.value = false }
}

async function softDelete(postId: string): Promise<boolean> {
  loading.value = true; error.value = null
  try {
    const { error: err } = await supabase.from('posts').update({ deleted_at: new Date().toISOString() } as any).eq('id', postId)
    if (err) { error.value = err.message; return false }
    return true
  } finally { loading.value = false }
}

async function restorePost(postId: string): Promise<boolean> {
  loading.value = true; error.value = null
  try {
    const { error: err } = await supabase.from('posts').update({ deleted_at: null } as any).eq('id', postId)
    if (err) { error.value = err.message; return false }
    return true
  } finally { loading.value = false }
}

async function permanentDelete(postId: string): Promise<boolean> {
  loading.value = true; error.value = null
  try {
    const { error: err } = await supabase.from('posts').delete().eq('id', postId)
    if (err) { error.value = err.message; return false }
    return true
  } finally { loading.value = false }
}

async function uploadFile(file: File, folder: 'images' | 'videos' = 'images'): Promise<ApiResponse<UploadResult>> {
  loading.value = true; error.value = null
  try {
    const ext = file.name.split('.').pop()
    const name = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`
    const { data, error: err } = await supabase.storage.from('posts-media').upload(`${folder}/${name}`, file, { cacheControl: '31536000', upsert: false })
    if (err) { error.value = err.message; return { data: null, error: err.message } }
    const { data: urlData } = supabase.storage.from('posts-media').getPublicUrl(data.path)
    return { data: { path: data.path, url: urlData.publicUrl }, error: null }
  } finally { loading.value = false }
}

export function usePosts() {
  return { loading, error, fetchPosts, fetchPostById, savePost, softDelete, restorePost, permanentDelete, uploadFile }
}
