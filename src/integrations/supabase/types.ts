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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      anamnesis: {
        Row: {
          acesso_plantas: string | null
          acesso_roedores: string | null
          acesso_rua: Json | null
          alimentacao: Json | null
          ambiente: Json | null
          appointment_request_id: string
          banho: Json | null
          bulhas_cardiacas: string | null
          campos_pulmonares: string | null
          comportamento: Json | null
          contactantes: Json | null
          cor: string | null
          created_at: string
          ectoparasitas: Json | null
          fc: string | null
          fr: string | null
          hidratacao: string | null
          id: string
          linfonodos: Json | null
          medicamentos: string | null
          mucosas: Json | null
          nascimento: string | null
          palpacao_abdominal: string | null
          pet_id: string
          pulso: string | null
          queixa_principal: string | null
          ritmo_cardiaco: string | null
          sexo: string | null
          sistema_cardiorespiratório: Json | null
          sistema_gastrintestinal: Json | null
          sistema_genitourinario: Json | null
          sistema_genitourinario_extras: Json | null
          sistema_musculoesqueletico: Json | null
          sistema_neurologico: Json | null
          sistema_ototegumentar: Json | null
          sistema_ototegumentar_obs: string | null
          temperatura: string | null
          tpc: string | null
          updated_at: string
          user_id: string
          vacinacao: Json | null
          vermifugo: string | null
        }
        Insert: {
          acesso_plantas?: string | null
          acesso_roedores?: string | null
          acesso_rua?: Json | null
          alimentacao?: Json | null
          ambiente?: Json | null
          appointment_request_id: string
          banho?: Json | null
          bulhas_cardiacas?: string | null
          campos_pulmonares?: string | null
          comportamento?: Json | null
          contactantes?: Json | null
          cor?: string | null
          created_at?: string
          ectoparasitas?: Json | null
          fc?: string | null
          fr?: string | null
          hidratacao?: string | null
          id?: string
          linfonodos?: Json | null
          medicamentos?: string | null
          mucosas?: Json | null
          nascimento?: string | null
          palpacao_abdominal?: string | null
          pet_id: string
          pulso?: string | null
          queixa_principal?: string | null
          ritmo_cardiaco?: string | null
          sexo?: string | null
          sistema_cardiorespiratório?: Json | null
          sistema_gastrintestinal?: Json | null
          sistema_genitourinario?: Json | null
          sistema_genitourinario_extras?: Json | null
          sistema_musculoesqueletico?: Json | null
          sistema_neurologico?: Json | null
          sistema_ototegumentar?: Json | null
          sistema_ototegumentar_obs?: string | null
          temperatura?: string | null
          tpc?: string | null
          updated_at?: string
          user_id: string
          vacinacao?: Json | null
          vermifugo?: string | null
        }
        Update: {
          acesso_plantas?: string | null
          acesso_roedores?: string | null
          acesso_rua?: Json | null
          alimentacao?: Json | null
          ambiente?: Json | null
          appointment_request_id?: string
          banho?: Json | null
          bulhas_cardiacas?: string | null
          campos_pulmonares?: string | null
          comportamento?: Json | null
          contactantes?: Json | null
          cor?: string | null
          created_at?: string
          ectoparasitas?: Json | null
          fc?: string | null
          fr?: string | null
          hidratacao?: string | null
          id?: string
          linfonodos?: Json | null
          medicamentos?: string | null
          mucosas?: Json | null
          nascimento?: string | null
          palpacao_abdominal?: string | null
          pet_id?: string
          pulso?: string | null
          queixa_principal?: string | null
          ritmo_cardiaco?: string | null
          sexo?: string | null
          sistema_cardiorespiratório?: Json | null
          sistema_gastrintestinal?: Json | null
          sistema_genitourinario?: Json | null
          sistema_genitourinario_extras?: Json | null
          sistema_musculoesqueletico?: Json | null
          sistema_neurologico?: Json | null
          sistema_ototegumentar?: Json | null
          sistema_ototegumentar_obs?: string | null
          temperatura?: string | null
          tpc?: string | null
          updated_at?: string
          user_id?: string
          vacinacao?: Json | null
          vermifugo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_appointment_request_id_fkey"
            columns: ["appointment_request_id"]
            isOneToOne: false
            referencedRelation: "appointment_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          notes: string | null
          pet_id: string
          preferred_date: string
          preferred_time: string
          reason: string
          scheduled_date: string | null
          scheduled_time: string | null
          service_id: string | null
          status: string
          updated_at: string
          user_id: string
          veterinarian: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          pet_id: string
          preferred_date: string
          preferred_time: string
          reason: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          veterinarian?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          pet_id?: string
          preferred_date?: string
          preferred_time?: string
          reason?: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          veterinarian?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_requests_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pet_records: {
        Row: {
          id: string
          pet_id: string
          record_type: string
          title: string | null
          data: Json
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          pet_id: string
          record_type: string
          title?: string | null
          data?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          pet_id?: string
          record_type?: string
          title?: string | null
          data?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_records_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          age: string | null
          breed: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          type: string
          updated_at: string
          user_id: string
          weight: string | null
        }
        Insert: {
          age?: string | null
          breed?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          type: string
          updated_at?: string
          user_id: string
          weight?: string | null
        }
        Update: {
          age?: string | null
          breed?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          weight?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name?: string
          price?: number
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
