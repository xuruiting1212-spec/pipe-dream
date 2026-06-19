export interface Database {
  public: {
    Tables: {
      posts: {
        Row: { id:string;created_at:string;title:string;content:string;type:string;subtype:string|null;tags:string[];visibility:string;images:string[];video:string|null;audio:string|null;audio_transcript:string|null;audio_transcript_confirmed:boolean;is_draft:boolean;user_id:string|null;deleted_at:string|null;author_type:string }
        Insert: { id?:string;created_at?:string;title:string;content:string;type:string;subtype?:string|null;tags?:string[];visibility?:string;images?:string[];video?:string|null;audio?:string|null;audio_transcript?:string|null;audio_transcript_confirmed?:boolean;is_draft?:boolean;user_id?:string|null;deleted_at?:string|null;author_type?:string }
        Update: { id?:string;title?:string;content?:string;type?:string;subtype?:string|null;tags?:string[];visibility?:string;images?:string[];video?:string|null;audio?:string|null;audio_transcript?:string|null;audio_transcript_confirmed?:boolean;is_draft?:boolean;user_id?:string|null;deleted_at?:string|null;author_type?:string }
        Relationships: []
      }
      profiles: { Row:{id:string;user_id:string|null;profile_type:string;name:string;bio:string;avatar_url:string|null;cover_url:string|null;sidebar_deco_url:string|null;sidebar_deco_thumb:string|null;main_deco_url:string|null;main_deco_thumb:string|null}; Insert:{id?:string;user_id?:string|null;profile_type?:string;name?:string;bio?:string;avatar_url?:string|null;cover_url?:string|null;sidebar_deco_url?:string|null;sidebar_deco_thumb?:string|null;main_deco_url?:string|null;main_deco_thumb?:string|null}; Update:{name?:string;bio?:string;avatar_url?:string|null;cover_url?:string|null;profile_type?:string;sidebar_deco_url?:string|null;sidebar_deco_thumb?:string|null;main_deco_url?:string|null;main_deco_thumb?:string|null}; Relationships:[] }
      moods: { Row:{id:string;user_id:string;date:string;my_mood:string|null;towa_mood:string|null}; Insert:{id?:string;user_id?:string;date:string;my_mood?:string|null;towa_mood?:string|null}; Update:{my_mood?:string|null;towa_mood?:string|null}; Relationships:[] }
      canvas_items: { Row:{id:string;user_id:string;type:string;content:string;pos_x:number;pos_y:number;width:number;height:number;rotation:number;color?:string;font_size?:number}; Insert:{id?:string;user_id?:string;type:string;content:string;pos_x?:number;pos_y?:number;width?:number;height?:number;rotation?:number;color?:string;font_size?:number}; Update:{content?:string;pos_x?:number;pos_y?:number;width?:number;height?:number;rotation?:number;color?:string;font_size?:number}; Relationships:[] }
      sketchbook: { Row:{id:string;user_id:string;title:string;content:string;tags:string[];images:string[];video:string|null;visibility:string;is_draft:boolean;deleted_at:string|null;created_at:string}; Insert:{id?:string;user_id?:string;title:string;content:string;tags?:string[];images?:string[];video?:string|null;visibility?:string;is_draft?:boolean;deleted_at?:string|null}; Update:{title?:string;content?:string;tags?:string[];images?:string[];video?:string|null;visibility?:string;is_draft?:boolean;deleted_at?:string|null}; Relationships:[] }
	      post_views: { Row:{id:string;post_id:string;visitor_token:string;viewed_at:string}; Insert:{id?:string;post_id:string;visitor_token:string;viewed_at?:string}; Update:{id?:string;post_id?:string;visitor_token?:string;viewed_at?:string}; Relationships:[] }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
