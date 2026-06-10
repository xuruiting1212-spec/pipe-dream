// ===== Pipe Dream 核心类型定义 =====

/** 帖子类型 */
export type PostType = '日常' | '碎碎念' | '情景剧' | '时间线总览'

/** 情景剧子分类 */
export type Subtype = '亲密' | '约会' | '日常' | ''

/** 可见范围 */
export type Visibility = 'public' | 'private'

/** 帖子数据结构（对应 Supabase posts 表） */
export interface Post {
  id: string
  created_at: string
  title: string
  content: string          // Markdown 正文
  type: PostType
  subtype: Subtype | null   // 仅情景剧有子分类
  tags: string[]            // 标签数组
  visibility: Visibility
  images: string[]          // 图片 URL 数组
  video: string | null      // 视频 URL
  is_draft: boolean
  user_id?: string          // 关联的 Supabase Auth 用户 ID
}

/** 创建帖子的表单数据 */
export interface PostForm {
  title: string
  content: string
  type: PostType
  subtype: Subtype | null
  tags: string[]
  visibility: Visibility
  images: string[]
  video: string | null
  is_draft: boolean
}

/** 帖子筛选条件 */
export interface PostFilter {
  type?: PostType | 'all'
  subtype?: Subtype | 'all'
  tag?: string
  keyword?: string          // 搜索标题和正文
  visibility?: Visibility | 'all'
}

/** 用户信息 */
export interface User {
  id: string
  email: string
}

/** Supabase Storage 上传结果 */
export interface UploadResult {
  path: string
  url: string
}

/** API 响应 */
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}
