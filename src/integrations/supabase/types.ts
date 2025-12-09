export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_chat_history: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          api_key: string
          created_at: string
          id: string
          is_active: boolean
          key_name: string
          last_used_at: string | null
          permissions: Json | null
          user_id: string
        }
        Insert: {
          api_key?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key_name: string
          last_used_at?: string | null
          permissions?: Json | null
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key_name?: string
          last_used_at?: string | null
          permissions?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      biometric_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_name: string | null
          id: string
          last_used_at: string | null
          public_key: string
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          event_type: string
          id: string
          project_id: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string
          id?: string
          project_id?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string
          id?: string
          project_id?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      company_documents: {
        Row: {
          created_at: string
          description: string | null
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_reports: {
        Row: {
          created_at: string
          gross_margin: number | null
          id: string
          project_count: number | null
          report_data: Json | null
          report_month: string
          total_costs: number | null
          total_revenue: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          gross_margin?: number | null
          id?: string
          project_count?: number | null
          report_data?: Json | null
          report_month: string
          total_costs?: number | null
          total_revenue?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          gross_margin?: number | null
          id?: string
          project_count?: number | null
          report_data?: Json | null
          report_month?: string
          total_costs?: number | null
          total_revenue?: number | null
          user_id?: string
        }
        Relationships: []
      }
      item_templates: {
        Row: {
          category: string
          created_at: string
          default_price: number
          default_qty: number
          description: string | null
          id: string
          name: string
          unit: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          default_price?: number
          default_qty?: number
          description?: string | null
          id?: string
          name: string
          unit?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          default_price?: number
          default_qty?: number
          description?: string | null
          id?: string
          name?: string
          unit?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offer_approvals: {
        Row: {
          approved_at: string | null
          client_comment: string | null
          client_email: string | null
          client_name: string | null
          created_at: string
          expires_at: string | null
          id: string
          project_id: string
          public_token: string
          signature_data: string | null
          status: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          client_comment?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          project_id: string
          public_token?: string
          signature_data?: string | null
          status?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          client_comment?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          project_id?: string
          public_token?: string
          signature_data?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_approvals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_sends: {
        Row: {
          client_email: string
          error_message: string | null
          id: string
          message: string | null
          pdf_generated_at: string | null
          pdf_url: string | null
          project_id: string
          sent_at: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          client_email: string
          error_message?: string | null
          id?: string
          message?: string | null
          pdf_generated_at?: string | null
          pdf_url?: string | null
          project_id: string
          sent_at?: string
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          client_email?: string
          error_message?: string | null
          id?: string
          message?: string | null
          pdf_generated_at?: string | null
          pdf_url?: string | null
          project_id?: string
          sent_at?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          completed_at: string | null
          completed_steps: number[] | null
          created_at: string
          current_step: number
          id: string
          is_completed: boolean
          skipped_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: number[] | null
          created_at?: string
          current_step?: number
          id?: string
          is_completed?: boolean
          skipped_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: number[] | null
          created_at?: string
          current_step?: number
          id?: string
          is_completed?: boolean
          skipped_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_user_id: string
          plan_id: string | null
          settings: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_user_id: string
          plan_id?: string | null
          settings?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_user_id?: string
          plan_id?: string | null
          settings?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      pdf_data: {
        Row: {
          created_at: string
          deadline_text: string | null
          id: string
          offer_text: string | null
          project_id: string
          terms: string | null
          title: string
          user_id: string
          version: string
        }
        Insert: {
          created_at?: string
          deadline_text?: string | null
          id?: string
          offer_text?: string | null
          project_id: string
          terms?: string | null
          title?: string
          user_id: string
          version?: string
        }
        Update: {
          created_at?: string
          deadline_text?: string | null
          id?: string
          offer_text?: string | null
          project_id?: string
          terms?: string | null
          title?: string
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bank_account: string | null
          city: string | null
          company_name: string
          created_at: string
          email_for_offers: string | null
          email_greeting: string | null
          email_signature: string | null
          email_subject_template: string | null
          id: string
          logo_url: string | null
          nip: string | null
          owner_name: string | null
          phone: string | null
          postal_code: string | null
          street: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_account?: string | null
          city?: string | null
          company_name?: string
          created_at?: string
          email_for_offers?: string | null
          email_greeting?: string | null
          email_signature?: string | null
          email_subject_template?: string | null
          id?: string
          logo_url?: string | null
          nip?: string | null
          owner_name?: string | null
          phone?: string | null
          postal_code?: string | null
          street?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_account?: string | null
          city?: string | null
          company_name?: string
          created_at?: string
          email_for_offers?: string | null
          email_greeting?: string | null
          email_signature?: string | null
          email_subject_template?: string | null
          id?: string
          logo_url?: string | null
          nip?: string | null
          owner_name?: string | null
          phone?: string | null
          postal_code?: string | null
          street?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_photos: {
        Row: {
          analysis_result: Json | null
          analysis_status: string
          created_at: string
          file_name: string
          id: string
          photo_url: string
          project_id: string
          user_id: string
        }
        Insert: {
          analysis_result?: Json | null
          analysis_status?: string
          created_at?: string
          file_name: string
          id?: string
          photo_url: string
          project_id: string
          user_id: string
        }
        Update: {
          analysis_result?: Json | null
          analysis_status?: string
          created_at?: string
          file_name?: string
          id?: string
          photo_url?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          end_date: string | null
          id: string
          priority: string | null
          project_name: string
          start_date: string | null
          status: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          priority?: string | null
          project_name: string
          start_date?: string | null
          status?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          priority?: string | null
          project_name?: string
          start_date?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_costs: {
        Row: {
          created_at: string
          document_url: string | null
          gross_amount: number
          id: string
          invoice_date: string | null
          invoice_number: string | null
          items: Json
          net_amount: number
          ocr_status: string
          project_id: string
          supplier_name: string | null
          user_id: string
          vat_amount: number
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          gross_amount?: number
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          items?: Json
          net_amount?: number
          ocr_status?: string
          project_id: string
          supplier_name?: string | null
          user_id: string
          vat_amount?: number
        }
        Update: {
          created_at?: string
          document_url?: string | null
          gross_amount?: number
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          items?: Json
          net_amount?: number
          ocr_status?: string
          project_id?: string
          supplier_name?: string | null
          user_id?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          platform: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_versions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          project_id: string
          quote_snapshot: Json
          user_id: string
          version_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          project_id: string
          quote_snapshot?: Json
          user_id: string
          version_name?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          project_id?: string
          quote_snapshot?: Json
          user_id?: string
          version_name?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          created_at: string
          id: string
          margin_percent: number
          positions: Json
          project_id: string
          summary_labor: number
          summary_materials: number
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          margin_percent?: number
          positions?: Json
          project_id: string
          summary_labor?: number
          summary_materials?: number
          total?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          margin_percent?: number
          positions?: Json
          project_id?: string
          summary_labor?: number
          summary_materials?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewer_user_id: string
          subcontractor_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewer_user_id: string
          subcontractor_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewer_user_id?: string
          subcontractor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_reviews_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_services: {
        Row: {
          created_at: string
          id: string
          price_per_unit: number | null
          service_name: string
          subcontractor_id: string
          unit: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          price_per_unit?: number | null
          service_name: string
          subcontractor_id: string
          unit?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          price_per_unit?: number | null
          service_name?: string
          subcontractor_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_services_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractors: {
        Row: {
          avatar_url: string | null
          company_name: string
          contact_name: string | null
          created_at: string
          description: string | null
          email: string | null
          hourly_rate: number | null
          id: string
          is_public: boolean
          location_city: string | null
          location_lat: number | null
          location_lng: number | null
          phone: string | null
          portfolio_images: Json | null
          rating: number | null
          review_count: number | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_public?: boolean
          location_city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          phone?: string | null
          portfolio_images?: Json | null
          rating?: number | null
          review_count?: number | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_public?: boolean
          location_city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          phone?: string | null
          portfolio_images?: Json | null
          rating?: number | null
          review_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      team_locations: {
        Row: {
          id: string
          latitude: number
          longitude: number
          project_id: string | null
          recorded_at: string
          status: string
          team_member_id: string
          user_id: string
        }
        Insert: {
          id?: string
          latitude: number
          longitude: number
          project_id?: string | null
          recorded_at?: string
          status?: string
          team_member_id: string
          user_id: string
        }
        Update: {
          id?: string
          latitude?: number
          longitude?: number
          project_id?: string | null
          recorded_at?: string
          status?: string
          team_member_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_locations_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          owner_user_id: string
          phone: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          owner_user_id: string
          phone?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          owner_user_id?: string
          phone?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          consent_type: string
          created_at: string
          granted: boolean
          granted_at: string | null
          id: string
          ip_address: string | null
          revoked_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          consent_type: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          consent_type?: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      work_tasks: {
        Row: {
          assigned_team_member_id: string | null
          color: string | null
          created_at: string
          description: string | null
          end_date: string
          id: string
          project_id: string
          start_date: string
          status: string
          task_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          assigned_team_member_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          project_id: string
          start_date: string
          status?: string
          task_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          assigned_team_member_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          project_id?: string
          start_date?: string
          status?: string
          task_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_tasks_assigned_team_member_id_fkey"
            columns: ["assigned_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_ids: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_subcontractor_owner: {
        Args: { _subcontractor_id: string; _user_id: string }
        Returns: boolean
      }
      validate_offer_token: { Args: { _token: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
