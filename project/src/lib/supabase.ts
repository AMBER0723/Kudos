import { createClient } from '@supabase/supabase-js'

// These will be set when you connect to Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL 
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY


export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          short_code: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          short_code: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          short_code?: string
          color?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          organization_id: string
          position: string
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          organization_id: string
          position?: string
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          organization_id?: string
          position?: string
          is_admin?: boolean
          created_at?: string
        }
      }
      compliments: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          message: string
          is_anonymous: boolean
          is_moderated: boolean
          created_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          message: string
          is_anonymous?: boolean
          is_moderated?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          message?: string
          is_anonymous?: boolean
          is_moderated?: boolean
          created_at?: string
        }
      }
      confessions: {
        Row: {
          id: string
          author_id: string
          message: string
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          author_id: string
          message: string
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          message?: string
          created_at?: string
          expires_at?: string
        }
      }
    }
  }
}