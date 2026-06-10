// Supabase 数据库类型定义
// 对应 posts 表结构
// Supabase JS v2 要求每个 Table 包含 Row/Insert/Update/Relationships

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
        // Supabase JS v2 必需字段，否则 TS 推导为 never
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
