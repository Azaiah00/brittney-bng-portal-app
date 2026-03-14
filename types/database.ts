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
      leads: {
        Row: {
          id: string
          name: string
          phone: string | null
          address: string | null
          project_type: string | null
          status: 'new' | 'contacted' | 'converted'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          address?: string | null
          project_type?: string | null
          status?: 'new' | 'contacted' | 'converted'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          address?: string | null
          project_type?: string | null
          status?: 'new' | 'contacted' | 'converted'
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          lead_id: string
          title: string
          start_date: string | null
          walkthrough_date: string | null
          calendar_event_id: string | null
          status: 'active' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          title: string
          start_date?: string | null
          walkthrough_date?: string | null
          calendar_event_id?: string | null
          status?: 'active' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          title?: string
          start_date?: string | null
          walkthrough_date?: string | null
          calendar_event_id?: string | null
          status?: 'active' | 'completed'
          created_at?: string
        }
      }
      logs: {
        Row: {
          id: string
          project_id: string
          note: string | null
          image_urls: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          note?: string | null
          image_urls?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          note?: string | null
          image_urls?: string[] | null
          created_at?: string
        }
      }
      estimates: {
        Row: {
          id: string
          project_id: string
          line_items: Json
          total_amount: number
          pdf_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          line_items?: Json
          total_amount?: number
          pdf_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          line_items?: Json
          total_amount?: number
          pdf_url?: string | null
          created_at?: string
        }
      }
    }
  }
}
