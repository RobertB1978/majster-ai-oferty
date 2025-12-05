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
      offer_sends: {
        Row: {
          client_email: string
          error_message: string | null
          id: string
          message: string | null
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
          project_id?: string
          sent_at?: string
          status?: string
          subject?: string
          user_id?: string
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
      projects: {
        Row: {
          client_id: string
          created_at: string
          id: string
          project_name: string
          status: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          project_name: string
          status?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          project_name?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
