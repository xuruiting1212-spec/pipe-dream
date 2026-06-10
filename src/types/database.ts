// Supabase 数据库类型定义
// 对应 posts 表结构

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string
          created_at: string
          title: string
          content: string
          type: string
          subtype: string | null
          tags: string[]
          visibility: string
          images: string[]
          video: string | null
          is_draft: boolean
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          content: string
          type: string
          subtype?: string | null
          tags?: string[]
          visibility?: string
          images?: string[]
          video?: string | null
          is_draft?: boolean
          user_id?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string
          type?: string
          subtype?: string | null
          tags?: string[]
          visibility?: string
          images?: string[]
          video?: string | null
          is_draft?: boolean
          user_id?: string | null
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
