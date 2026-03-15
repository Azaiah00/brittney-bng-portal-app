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
      lead_sources: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          name: string
          first_name: string | null
          last_name: string | null
          company_name: string | null
          phone: string | null
          email: string | null
          alternate_email: string | null
          address: string | null
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          project_type: string | null
          notes: string | null
          lead_source_id: string | null
          status: 'new' | 'contacted' | 'quoted' | 'converted'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          first_name?: string | null
          last_name?: string | null
          company_name?: string | null
          phone?: string | null
          email?: string | null
          alternate_email?: string | null
          address?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          project_type?: string | null
          notes?: string | null
          lead_source_id?: string | null
          status?: 'new' | 'contacted' | 'quoted' | 'converted'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          first_name?: string | null
          last_name?: string | null
          company_name?: string | null
          phone?: string | null
          email?: string | null
          alternate_email?: string | null
          address?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          project_type?: string | null
          notes?: string | null
          lead_source_id?: string | null
          status?: 'new' | 'contacted' | 'quoted' | 'converted'
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          first_name: string | null
          last_name: string | null
          company_name: string | null
          phone: string | null
          email: string | null
          alternate_email: string | null
          address: string | null
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          project_type: string | null
          notes: string | null
          lead_source_id: string | null
          converted_from_lead_id: string | null
          status: 'active' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          first_name?: string | null
          last_name?: string | null
          company_name?: string | null
          phone?: string | null
          email?: string | null
          alternate_email?: string | null
          address?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          project_type?: string | null
          notes?: string | null
          lead_source_id?: string | null
          converted_from_lead_id?: string | null
          status?: 'active' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          first_name?: string | null
          last_name?: string | null
          company_name?: string | null
          phone?: string | null
          email?: string | null
          alternate_email?: string | null
          address?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          project_type?: string | null
          notes?: string | null
          lead_source_id?: string | null
          converted_from_lead_id?: string | null
          status?: 'active' | 'completed'
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          lead_id: string | null
          customer_id: string | null
          title: string
          address: string | null
          budget: number | null
          phase: string | null
          progress: number
          start_date: string | null
          walkthrough_date: string | null
          calendar_event_id: string | null
          status: 'active' | 'completed' | 'pending'
          created_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          customer_id?: string | null
          title: string
          address?: string | null
          budget?: number | null
          phase?: string | null
          progress?: number
          start_date?: string | null
          walkthrough_date?: string | null
          calendar_event_id?: string | null
          status?: 'active' | 'completed' | 'pending'
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          customer_id?: string | null
          title?: string
          address?: string | null
          budget?: number | null
          phase?: string | null
          progress?: number
          start_date?: string | null
          walkthrough_date?: string | null
          calendar_event_id?: string | null
          status?: 'active' | 'completed' | 'pending'
          created_at?: string
        }
      }
      logs: {
        Row: {
          id: string
          project_id: string
          note: string | null
          image_urls: string[] | null
          author: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          note?: string | null
          image_urls?: string[] | null
          author?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          note?: string | null
          image_urls?: string[] | null
          author?: string | null
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
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_date: string
          start_time: string | null
          end_time: string | null
          event_type: 'walkthrough' | 'meeting' | 'review' | 'inspection' | 'other'
          project_id: string | null
          client_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_date: string
          start_time?: string | null
          end_time?: string | null
          event_type?: 'walkthrough' | 'meeting' | 'review' | 'inspection' | 'other'
          project_id?: string | null
          client_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_date?: string
          start_time?: string | null
          end_time?: string | null
          event_type?: 'walkthrough' | 'meeting' | 'review' | 'inspection' | 'other'
          project_id?: string | null
          client_name?: string | null
          created_at?: string
        }
      }
    }
  }
}
