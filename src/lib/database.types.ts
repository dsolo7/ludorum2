export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          trial_ends_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          trial_ends_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          trial_ends_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      admin_users: {
        Row: {
          id: string
          user_id: string | null
          role: 'admin' | 'super_admin'
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          role?: 'admin' | 'super_admin'
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          role?: 'admin' | 'super_admin'
          created_at?: string | null
          updated_at?: string | null
        }
      }
      ai_models: {
        Row: {
          id: string
          name: string
          description: string | null
          sport_id: string | null
          betting_type_id: string | null
          llm_provider_id: string | null
          api_feed_id: string | null
          prompt_template: string | null
          created_at: string
          updated_at: string
          is_active: boolean
          settings: Json | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          sport_id?: string | null
          betting_type_id?: string | null
          llm_provider_id?: string | null
          api_feed_id?: string | null
          prompt_template?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
          settings?: Json | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          sport_id?: string | null
          betting_type_id?: string | null
          llm_provider_id?: string | null
          api_feed_id?: string | null
          prompt_template?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
          settings?: Json | null
        }
      }
      sports: {
        Row: {
          id: string
          name: string
          icon: string | null
          is_active: boolean
          description: string | null
          sport_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          is_active?: boolean
          description?: string | null
          sport_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          is_active?: boolean
          description?: string | null
          sport_order?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      betting_types: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      llm_providers: {
        Row: {
          id: string
          name: string
          base_url: string | null
          model_name: string | null
          notes: string | null
          api_key: string | null
        }
        Insert: {
          id?: string
          name: string
          base_url?: string | null
          model_name?: string | null
          notes?: string | null
          api_key?: string | null
        }
        Update: {
          id?: string
          name?: string
          base_url?: string | null
          model_name?: string | null
          notes?: string | null
          api_key?: string | null
        }
      }
      api_feeds: {
        Row: {
          id: string
          name: string
          url: string
          api_key: string
          sport_id: string | null
          is_active: boolean | null
          refresh_interval: number | null
          last_fetch: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          url: string
          api_key: string
          sport_id?: string | null
          is_active?: boolean | null
          refresh_interval?: number | null
          last_fetch?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          url?: string
          api_key?: string
          sport_id?: string | null
          is_active?: boolean | null
          refresh_interval?: number | null
          last_fetch?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      ad_placements: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string | null
          placement_type: string
          max_ads: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          description?: string | null
          placement_type: string
          max_ads?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          description?: string | null
          placement_type?: string
          max_ads?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ad_placement_assignments: {
        Row: {
          id: string
          ad_id: string
          placement_id: string
          priority: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          ad_id: string
          placement_id: string
          priority?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          ad_id?: string
          placement_id?: string
          priority?: number
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      admin_role: 'admin' | 'super_admin'
      model_status: 'active' | 'archived' | 'draft' | 'inactive'
      betting_type: 'fantasy_lineup' | 'moneyline' | 'over_under' | 'parlay' | 'player_props' | 'spread'
      sport_type: 'MLB' | 'NBA' | 'NFL' | 'NHL' | 'Soccer'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}