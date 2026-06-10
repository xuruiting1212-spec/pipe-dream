// ===== 帖子 CRUD 逻辑 =====
// 封装对 Supabase posts 表的所有操作

import { ref } from 'vue'
import { supabase } from './useSupabase'
import type { Post, PostForm, PostFilter, ApiResponse, UploadResult } from '@/types'

/** 加载状态 */
const loading = ref(false)
/** 错误信息 */
const error = ref<string | null>(null)

/**
 * 获取帖子列表
 * @param filter - 筛选条件（可选）
 * @param includePrivate - 是否包含私有帖子（仅登录用户）
 */
async function fetchPosts(
  filter?: PostFilter,
  includePrivate = false
): Promise<ApiResponse<Post[]>> {
  loading.value = true
  error.value = null
  try {
    // 构建查询
    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    // 可见性过滤：RLS 已限制，但客户端再加一层更安全
    if (!includePrivate) {
      query = query
        .eq('visibility', 'public')
        .eq('is_draft', false)
    }

    // 类型过滤
    if (filter?.type && filter.type !== 'all') {
      query = query.eq('type', filter.type)
    }
    // 子类型过滤
    if (filter?.subtype && filter.subtype !== 'all') {
      query = query.eq('subtype', filter.subtype)
    }
    // 标签过滤（数组包含）
    if (filter?.tag) {
      query = query.contains('tags', [filter.tag])
    }
    // 关键词搜索（标题匹配）— 正文搜索在客户端做
    if (filter?.keyword) {
      query = query.ilike('title', `%${filter.keyword}%`)
    }

    const { data, error: err } = await query

    if (err) {
      error.value = err.message
      return { data: null, error: err.message }
    }

    // 如果有关键词，进一步在客户端过滤正文
    let posts = data as Post[]
    if (filter?.keyword) {
      const kw = filter.keyword.toLowerCase()
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(kw) ||
        p.content.toLowerCase().includes(kw)
      )
    }

    return { data: posts, error: null }
  } catch (e) {
    const msg = '获取帖子列表失败'
    error.value = msg
    return { data: null, error: msg }
  } finally {
    loading.value = false
  }
}

/**
 * 根据 ID 获取单个帖子
 */
async function fetchPostById(id: string): Promise<ApiResponse<Post>> {
  loading.value = true
  error.value = null
  try {
    const { data, error: err } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()

    if (err) {
      error.value = err.message
      return { data: null, error: err.message }
    }
    return { data: data as Post, error: null }
  } catch (e) {
    const msg = '获取帖子详情失败'
    error.value = msg
    return { data: null, error: msg }
  } finally {
    loading.value = false
  }
}

/**
 * 创建或更新帖子
 * @param form - 帖子表单数据
 * @param postId - 编辑时传入已有帖子 ID
 */
async function savePost(
  form: PostForm,
  postId?: string
): Promise<ApiResponse<Post>> {
  loading.value = true
  error.value = null
  try {
    // 获取当前用户 ID
    const { data: { user } } = await supabase.auth.getUser()

    const postData = {
      ...form,
      user_id: user?.id ?? null,
    }

    let result
    if (postId) {
      // 更新已有帖子
      result = await supabase
        .from('posts')
        .update(postData)
        .eq('id', postId)
        .select()
        .single()
    } else {
      // 创建新帖子
      result = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single()
    }

    const { data, error: err } = result
    if (err) {
      error.value = err.message
      return { data: null, error: err.message }
    }
    return { data: data as Post, error: null }
  } catch (e) {
    const msg = '保存帖子失败'
    error.value = msg
    return { data: null, error: msg }
  } finally {
    loading.value = false
  }
}

/**
 * 删除帖子
 */
async function deletePost(postId: string): Promise<boolean> {
  loading.value = true
  error.value = null
  try {
    const { error: err } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)

    if (err) {
      error.value = err.message
      return false
    }
    return true
  } catch (e) {
    error.value = '删除帖子失败'
    return false
  } finally {
    loading.value = false
  }
}

/**
 * 上传图片到 Supabase Storage
 * 注意：不上传压缩版本，保留原图质量
 * @param file - 图片文件
 */
async function uploadImage(file: File): Promise<ApiResponse<UploadResult>> {
  loading.value = true
  error.value = null
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `images/${fileName}`

    const { data, error: err } = await supabase.storage
      .from('posts-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        // 不压缩：上传原文件
      })

    if (err) {
      error.value = err.message
      return { data: null, error: err.message }
    }

    // 获取公开访问 URL
    const { data: urlData } = supabase.storage
      .from('posts-media')
      .getPublicUrl(data.path)

    return {
      data: { path: data.path, url: urlData.publicUrl },
      error: null,
    }
  } catch (e) {
    const msg = '图片上传失败'
    error.value = msg
    return { data: null, error: msg }
  } finally {
    loading.value = false
  }
}

/**
 * 上传视频到 Supabase Storage
 */
async function uploadVideo(file: File): Promise<ApiResponse<UploadResult>> {
  loading.value = true
  error.value = null
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `videos/${fileName}`

    const { data, error: err } = await supabase.storage
      .from('posts-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (err) {
      error.value = err.message
      return { data: null, error: err.message }
    }

    const { data: urlData } = supabase.storage
      .from('posts-media')
      .getPublicUrl(data.path)

    return {
      data: { path: data.path, url: urlData.publicUrl },
      error: null,
    }
  } catch (e) {
    const msg = '视频上传失败'
    error.value = msg
    return { data: null, error: msg }
  } finally {
    loading.value = false
  }
}

/** 导出帖子 composable */
export function usePosts() {
  return {
    // 状态
    loading,
    error,
    // 方法
    fetchPosts,
    fetchPostById,
    savePost,
    deletePost,
    uploadImage,
    uploadVideo,
  }
}
