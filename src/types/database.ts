// Supabase 数据库类型定义
export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string; created_at: string; title: string; content: string
          type: string; subtype: string | null; tags: string[]
          visibility: string; images: string[]; video: string | null
          is_draft: boolean; user_id: string | null; deleted_at: string | null
        }
        Insert: {
          id?: string; created_at?: string; title: string; content: string
          type: string; subtype?: string | null; tags?: string[]
          visibility?: string; images?: string[]; video?: string | null
          is_draft?: boolean; user_id?: string | null; deleted_at?: string | null
        }
        Update: {
          id?: string; title?: string; content?: string
          type?: string; subtype?: string | null; tags?: string[]
          visibility?: string; images?: string[]; video?: string | null
          is_draft?: boolean; user_id?: string | null; deleted_at?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
