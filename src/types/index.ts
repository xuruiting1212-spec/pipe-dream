// ===== Pipe Dream 核心类型定义 =====

export type PostType = '日常' | '碎碎念' | '情景剧' | '时间线总览'
export type Subtype = '亲密' | '约会' | '日常' | ''
export type Visibility = 'public' | 'private'
export type AuthorType = 'me' | 'towa'
export type MoodType = '心动' | '开心' | '生气' | '兴奋' | '伤心' | '心累' | '平静' | '烦躁'

export interface Post {
  id: string; created_at: string; title: string; content: string
  type: PostType; subtype: Subtype | null; tags: string[]
  visibility: Visibility; images: string[]; video: string | null
  is_draft: boolean; user_id?: string; deleted_at?: string | null
  author_type: AuthorType
}

export interface PostForm {
  title: string; content: string; type: PostType; subtype: Subtype | null
  tags: string[]; visibility: Visibility; images: string[]; video: string | null
  is_draft: boolean; author_type: AuthorType
}

export interface PostFilter {
  types: PostType[]; subtype?: Subtype | 'all'; tag?: string; keyword?: string
  author?: AuthorType | 'all'
}

export interface User { id: string; email: string }

export interface UploadResult { path: string; url: string }

export interface ApiResponse<T> { data: T | null; error: string | null }

export interface TowaProfile {
  id: string; name: string; bio: string; avatar_url?: string | null
  cover_url?: string | null
}

export interface MoodRecord {
  id?: string; user_id?: string; date: string
  my_mood: MoodType | null; towa_mood: MoodType | null
}

export interface CanvasItem {
  id?: string; user_id?: string; type: 'sticker' | 'text' | 'photo' | 'doodle'
  content: string; pos_x: number; pos_y: number; width: number; height: number
  rotation: number; color?: string; font_size?: number
}

export interface SketchbookEntry {
  id: string; title: string; content: string; tags: string[]
  images: string[]; video: string | null; visibility: Visibility
  is_draft: boolean; deleted_at?: string | null; created_at: string
}

/** 心情球配置 */
export const MOOD_CONFIG: Record<MoodType, { emoji: string; color: string; label: string }> = {
  '心动': { emoji: '💗', color: '#f8bbd0', label: '心动' },
  '开心': { emoji: '😊', color: '#ffcc80', label: '开心' },
  '生气': { emoji: '😡', color: '#ef5350', label: '生气' },
  '兴奋': { emoji: '🤩', color: '#fdd835', label: '兴奋' },
  '伤心': { emoji: '😢', color: '#42a5f5', label: '伤心' },
  '心累': { emoji: '😮‍💨', color: '#8d6e63', label: '心累' },
  '平静': { emoji: '😌', color: '#66bb6a', label: '平静' },
  '烦躁': { emoji: '😤', color: '#78909c', label: '烦躁' },
}
