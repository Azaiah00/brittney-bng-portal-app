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
      proposals: {
        Row: {
          id: string
          project_id: string
          client_name: string | null
          client_address: string | null
          scope_of_work: string | null
          line_items: Json
          subtotal: number | null
          tax: number | null
          total_amount: number | null
          payment_schedule: Json
          start_date: string | null
          completion_date: string | null
          special_conditions: string | null
          status: 'draft' | 'sent' | 'accepted' | 'declined'
          created_at: string
          pdf_url: string | null
          signnow_document_id: string | null
          signnow_invite_id: string | null
          signing_link: string | null
          signature_status: string | null
          signer_email: string | null
          sent_for_signature_at: string | null
          signed_at: string | null
          signed_pdf_url: string | null
        }
        Insert: {
          id?: string
          project_id: string
          client_name?: string | null
          client_address?: string | null
          scope_of_work?: string | null
          line_items?: Json
          subtotal?: number | null
          tax?: number | null
          total_amount?: number | null
          payment_schedule?: Json
          start_date?: string | null
          completion_date?: string | null
          special_conditions?: string | null
          status?: 'draft' | 'sent' | 'accepted' | 'declined'
          created_at?: string
          pdf_url?: string | null
          signnow_document_id?: string | null
          signnow_invite_id?: string | null
          signing_link?: string | null
          signature_status?: string | null
          signer_email?: string | null
          sent_for_signature_at?: string | null
          signed_at?: string | null
          signed_pdf_url?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          client_name?: string | null
          client_address?: string | null
          scope_of_work?: string | null
          line_items?: Json
          subtotal?: number | null
          tax?: number | null
          total_amount?: number | null
          payment_schedule?: Json
          start_date?: string | null
          completion_date?: string | null
          special_conditions?: string | null
          status?: 'draft' | 'sent' | 'accepted' | 'declined'
          created_at?: string
          pdf_url?: string | null
          signnow_document_id?: string | null
          signnow_invite_id?: string | null
          signing_link?: string | null
          signature_status?: string | null
          signer_email?: string | null
          sent_for_signature_at?: string | null
          signed_at?: string | null
          signed_pdf_url?: string | null
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
      subcontractors: {
        Row: {
          id: string
          company_name: string | null
          name: string
          trade: string
          phone: string | null
          email: string | null
          notes: string | null
          rating: number
          created_at: string
        }
        Insert: {
          id?: string
          company_name?: string | null
          name: string
          trade?: string
          phone?: string | null
          email?: string | null
          notes?: string | null
          rating?: number
          created_at?: string
        }
        Update: {
          id?: string
          company_name?: string | null
          name?: string
          trade?: string
          phone?: string | null
          email?: string | null
          notes?: string | null
          rating?: number
          created_at?: string
        }
      }
      checklists: {
        Row: {
          id: string
          project_id: string
          items: Json
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          items?: Json
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          items?: Json
          created_at?: string
        }
      }
      punch_items: {
        Row: {
          id: string
          project_id: string
          description: string
          photo_url: string | null
          status: 'open' | 'in_progress' | 'resolved'
          assigned_to: string | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          description: string
          photo_url?: string | null
          status?: 'open' | 'in_progress' | 'resolved'
          assigned_to?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          description?: string
          photo_url?: string | null
          status?: 'open' | 'in_progress' | 'resolved'
          assigned_to?: string | null
          created_at?: string
          resolved_at?: string | null
        }
      }
      user_integrations: {
        Row: {
          id: string
          user_id: string
          provider: string
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          calendar_id: string | null
          connected_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          calendar_id?: string | null
          connected_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          calendar_id?: string | null
          connected_at?: string
        }
      }
    }
  }
}
