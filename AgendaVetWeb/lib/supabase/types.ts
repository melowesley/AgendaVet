npm warn exec The following package was not found and will be installed: supabase@2.83.0
Using workdir C:\Users\Computador\AgendaVet-Surgical-Fix
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
      ai_conversations: {
        Row: {
          clinic_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          model_used: string
          pet_id: string | null
          prompt_version_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model_used?: string
          pet_id?: string | null
          prompt_version_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model_used?: string
          pet_id?: string | null
          prompt_version_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          clinic_id: string
          clinical_action: Json | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          latency_ms: number | null
          model: string | null
          role: string
          token_count: number | null
          tool_calls: Json | null
        }
        Insert: {
          clinic_id: string
          clinical_action?: Json | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          latency_ms?: number | null
          model?: string | null
          role: string
          token_count?: number | null
          tool_calls?: Json | null
        }
        Update: {
          clinic_id?: string
          clinical_action?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          latency_ms?: number | null
          model?: string | null
          role?: string
          token_count?: number | null
          tool_calls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompt_versions: {
        Row: {
          clinic_id: string | null
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          slug: string
          version: number
        }
        Insert: {
          clinic_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          slug: string
          version?: number
        }
        Update: {
          clinic_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          slug?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompt_versions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_response_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          expires_at: string
          hit_count: number | null
          id: string
          model: string
          response: string
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          expires_at: string
          hit_count?: number | null
          id?: string
          model: string
          response: string
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          expires_at?: string
          hit_count?: number | null
          id?: string
          model?: string
          response?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          clinic_id: string
          completion_tokens: number
          conversation_id: string | null
          cost_usd: number | null
          created_at: string | null
          error: Json | null
          fallback_from: string | null
          id: string
          latency_ms: number | null
          model: string
          prompt_tokens: number
          provider: string
          total_tokens: number
          user_id: string
        }
        Insert: {
          clinic_id: string
          completion_tokens?: number
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          error?: Json | null
          fallback_from?: string | null
          id?: string
          latency_ms?: number | null
          model: string
          prompt_tokens?: number
          provider: string
          total_tokens?: number
          user_id: string
        }
        Update: {
          clinic_id?: string
          completion_tokens?: number
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          error?: Json | null
          fallback_from?: string | null
          id?: string
          latency_ms?: number | null
          model?: string
          prompt_tokens?: number
          provider?: string
          total_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
            foreignKeyName: "anamnesis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
          pet_id: string
          preferred_date: string
          preferred_time: string
          quick_notes: string | null
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
          organization_id?: string | null
          pet_id: string
          preferred_date: string
          preferred_time: string
          quick_notes?: string | null
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
          organization_id?: string | null
          pet_id?: string
          preferred_date?: string
          preferred_time?: string
          quick_notes?: string | null
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
            foreignKeyName: "appointment_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
      approval_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          token: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
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
      categorias_financeiro: {
        Row: {
          id: string
          nome: string
          tipo: string | null
        }
        Insert: {
          id?: string
          nome: string
          tipo?: string | null
        }
        Update: {
          id?: string
          nome?: string
          tipo?: string | null
        }
        Relationships: []
      }
      "check-table.sql": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      clinic_members: {
        Row: {
          clinic_id: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_members_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          created_at: string | null
          id: string
          name: string
          plan: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          plan?: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          plan?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      documentos_pets: {
        Row: {
          conteudo_final: string
          data_geracao: string | null
          id: string
          modelo_id: string | null
          pet_id: string
          titulo_documento: string
          veterinario_id: string
        }
        Insert: {
          conteudo_final: string
          data_geracao?: string | null
          id?: string
          modelo_id?: string | null
          pet_id: string
          titulo_documento: string
          veterinario_id: string
        }
        Update: {
          conteudo_final?: string
          data_geracao?: string | null
          id?: string
          modelo_id?: string | null
          pet_id?: string
          titulo_documento?: string
          veterinario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_pets_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "modelos_documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_records: {
        Row: {
          amount: number
          appointment_id: string | null
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          pet_id: string | null
          profile_id: string | null
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          appointment_id?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pet_id?: string | null
          profile_id?: string | null
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pet_id?: string | null
          profile_id?: string | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointment_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ia_memoria_clinica: {
        Row: {
          clinic_id: string | null
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          pet_id: string | null
          user_id: string | null
        }
        Insert: {
          clinic_id?: string | null
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          pet_id?: string | null
          user_id?: string | null
        }
        Update: {
          clinic_id?: string | null
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          pet_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          quantity: number
          service_id: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          service_id?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          service_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string | null
          due_date: string | null
          id: string
          owner_id: string
          payment_method: string | null
          pet_id: string
          receipt_url: string | null
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          owner_id: string
          payment_method?: string | null
          pet_id: string
          receipt_url?: string | null
          status?: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string
          payment_method?: string | null
          pet_id?: string
          receipt_url?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_financeiro: {
        Row: {
          categoria_id: string | null
          created_at: string | null
          estoque_atual: number | null
          id: string
          nome: string
          preco_venda: number
          unidade_medida: string | null
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string | null
          estoque_atual?: number | null
          id?: string
          nome: string
          preco_venda: number
          unidade_medida?: string | null
        }
        Update: {
          categoria_id?: string | null
          created_at?: string | null
          estoque_atual?: number | null
          id?: string
          nome?: string
          preco_venda?: number
          unidade_medida?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_financeiro_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_financeiro"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      modelos_documentos: {
        Row: {
          ativo: boolean | null
          conteudo_template: string
          created_at: string | null
          id: string
          tipo: string
          titulo: string
        }
        Insert: {
          ativo?: boolean | null
          conteudo_template: string
          created_at?: string | null
          id?: string
          tipo: string
          titulo: string
        }
        Update: {
          ativo?: boolean | null
          conteudo_template?: string
          created_at?: string | null
          id?: string
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      mortes: {
        Row: {
          causa: string | null
          data_de_morte: string | null
          id: string
          notas: string | null
          organization_id: string | null
          pet_id: string
        }
        Insert: {
          causa?: string | null
          data_de_morte?: string | null
          id?: string
          notas?: string | null
          organization_id?: string | null
          pet_id: string
        }
        Update: {
          causa?: string | null
          data_de_morte?: string | null
          id?: string
          notas?: string | null
          organization_id?: string | null
          pet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mortes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortes_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
          plan: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          plan?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          plan?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          payment_date: string | null
          payment_method: string | null
          pet_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          pet_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          pet_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointment_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_admin_history: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          module: string
          organization_id: string | null
          pet_id: string
          source_id: string | null
          source_table: string | null
          title: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          module: string
          organization_id?: string | null
          pet_id: string
          source_id?: string | null
          source_table?: string | null
          title: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          module?: string
          organization_id?: string | null
          pet_id?: string
          source_id?: string | null
          source_table?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_admin_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_admin_history_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_documents: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          document_type: string | null
          file_url: string | null
          id: string
          organization_id: string | null
          pet_id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          document_type?: string | null
          file_url?: string | null
          id?: string
          organization_id?: string | null
          pet_id: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          document_type?: string | null
          file_url?: string | null
          id?: string
          organization_id?: string | null
          pet_id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_documents_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_exams: {
        Row: {
          created_at: string | null
          exam_date: string
          exam_type: string
          file_url: string | null
          id: string
          notes: string | null
          organization_id: string | null
          pet_id: string
          results: string | null
          updated_at: string | null
          user_id: string
          veterinarian: string | null
        }
        Insert: {
          created_at?: string | null
          exam_date: string
          exam_type: string
          file_url?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          pet_id: string
          results?: string | null
          updated_at?: string | null
          user_id: string
          veterinarian?: string | null
        }
        Update: {
          created_at?: string | null
          exam_date?: string
          exam_type?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          pet_id?: string
          results?: string | null
          updated_at?: string | null
          user_id?: string
          veterinarian?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_exams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_exams_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_hospitalizations: {
        Row: {
          admission_date: string
          created_at: string | null
          daily_notes: Json | null
          diagnosis: string | null
          discharge_date: string | null
          id: string
          notes: string | null
          organization_id: string | null
          pet_id: string
          reason: string
          status: string | null
          treatment: string | null
          updated_at: string | null
          user_id: string
          veterinarian: string | null
        }
        Insert: {
          admission_date: string
          created_at?: string | null
          daily_notes?: Json | null
          diagnosis?: string | null
          discharge_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          pet_id: string
          reason: string
          status?: string | null
          treatment?: string | null
          updated_at?: string | null
          user_id: string
          veterinarian?: string | null
        }
        Update: {
          admission_date?: string
          created_at?: string | null
          daily_notes?: Json | null
          diagnosis?: string | null
          discharge_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          pet_id?: string
          reason?: string
          status?: string | null
          treatment?: string | null
          updated_at?: string | null
          user_id?: string
          veterinarian?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_hospitalizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_hospitalizations_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_observations: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          observation: string
          observation_date: string
          organization_id: string | null
          pet_id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          observation: string
          observation_date: string
          organization_id?: string | null
          pet_id: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          observation?: string
          observation_date?: string
          organization_id?: string | null
          pet_id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_observations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_observations_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_pathologies: {
        Row: {
          created_at: string | null
          description: string | null
          diagnosis_date: string
          id: string
          name: string
          notes: string | null
          organization_id: string | null
          pet_id: string
          status: string | null
          treatment: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          diagnosis_date: string
          id?: string
          name: string
          notes?: string | null
          organization_id?: string | null
          pet_id: string
          status?: string | null
          treatment?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          diagnosis_date?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string | null
          pet_id?: string
          status?: string | null
          treatment?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_pathologies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_pathologies_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_photos: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          id: string
          organization_id: string | null
          pet_id: string
          photo_url: string
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          organization_id?: string | null
          pet_id: string
          photo_url: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          organization_id?: string | null
          pet_id?: string
          photo_url?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_photos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_photos_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_prescriptions: {
        Row: {
          created_at: string | null
          dosage: string | null
          duration: string | null
          frequency: string | null
          id: string
          medication_name: string
          notes: string | null
          organization_id: string | null
          pet_id: string
          prescription_date: string
          updated_at: string | null
          user_id: string
          veterinarian: string | null
        }
        Insert: {
          created_at?: string | null
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          medication_name: string
          notes?: string | null
          organization_id?: string | null
          pet_id: string
          prescription_date: string
          updated_at?: string | null
          user_id: string
          veterinarian?: string | null
        }
        Update: {
          created_at?: string | null
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          medication_name?: string
          notes?: string | null
          organization_id?: string | null
          pet_id?: string
          prescription_date?: string
          updated_at?: string | null
          user_id?: string
          veterinarian?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_prescriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_prescriptions_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_services: {
        Row: {
          added_by: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string | null
          pet_id: string
          price_snapshot: number
          quantity: number
          service_id: string | null
          service_name: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          pet_id: string
          price_snapshot: number
          quantity?: number
          service_id?: string | null
          service_name: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          pet_id?: string
          price_snapshot?: number
          quantity?: number
          service_id?: string | null
          service_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_services_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_vaccines: {
        Row: {
          application_date: string
          batch_number: string | null
          created_at: string | null
          id: string
          next_dose_date: string | null
          notes: string | null
          organization_id: string | null
          pet_id: string
          updated_at: string | null
          user_id: string
          vaccine_name: string
          veterinarian: string | null
        }
        Insert: {
          application_date: string
          batch_number?: string | null
          created_at?: string | null
          id?: string
          next_dose_date?: string | null
          notes?: string | null
          organization_id?: string | null
          pet_id: string
          updated_at?: string | null
          user_id: string
          vaccine_name: string
          veterinarian?: string | null
        }
        Update: {
          application_date?: string
          batch_number?: string | null
          created_at?: string | null
          id?: string
          next_dose_date?: string | null
          notes?: string | null
          organization_id?: string | null
          pet_id?: string
          updated_at?: string | null
          user_id?: string
          vaccine_name?: string
          veterinarian?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_vaccines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_vaccines_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_videos: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          id: string
          organization_id: string | null
          pet_id: string
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string
          video_url: string
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          organization_id?: string | null
          pet_id: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          video_url: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          organization_id?: string | null
          pet_id?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_videos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_videos_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_weight_records: {
        Row: {
          created_at: string | null
          date: string
          id: string
          notes: string | null
          organization_id: string | null
          pet_id: string
          updated_at: string | null
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          pet_id: string
          updated_at?: string | null
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          pet_id?: string
          updated_at?: string | null
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "pet_weight_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_weight_records_pet_id_fkey"
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
          organization_id: string | null
          profile_id: string | null
          type: string
          updated_at: string
          user_id: string | null
          weight: string | null
        }
        Insert: {
          age?: string | null
          breed?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          organization_id?: string | null
          profile_id?: string | null
          type: string
          updated_at?: string
          user_id?: string | null
          weight?: string | null
        }
        Update: {
          age?: string | null
          breed?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string | null
          profile_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          stock: number | null
          unit: string | null
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price?: number
          stock?: number | null
          unit?: string | null
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          stock?: number | null
          unit?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          age: number | null
          created_at: string
          email: string | null
          full_name: string | null
          gender: string | null
          genero: string | null
          id: string
          idade: number | null
          organization_id: string | null
          phone: string | null
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          genero?: string | null
          id?: string
          idade?: number | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          genero?: string | null
          id?: string
          idade?: number | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_chunks: {
        Row: {
          chunk_index: number
          clinic_id: string | null
          content: string
          created_at: string | null
          document_id: string
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          chunk_index: number
          clinic_id?: string | null
          content: string
          created_at?: string | null
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          chunk_index?: number
          clinic_id?: string | null
          content?: string
          created_at?: string | null
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "rag_chunks_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rag_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "rag_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_documents: {
        Row: {
          chunk_count: number | null
          clinic_id: string | null
          created_at: string | null
          file_path: string | null
          id: string
          metadata: Json | null
          source_type: string
          source_url: string | null
          status: string
          title: string
        }
        Insert: {
          chunk_count?: number | null
          clinic_id?: string | null
          created_at?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          source_type: string
          source_url?: string | null
          status?: string
          title: string
        }
        Update: {
          chunk_count?: number | null
          clinic_id?: string | null
          created_at?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          source_type?: string
          source_url?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "rag_documents_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          name: string
          organization_id: string | null
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
          organization_id?: string | null
          price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name?: string
          organization_id?: string | null
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      my_organization_id: { Args: never; Returns: string }
      register_user_profile: {
        Args: {
          p_full_name: string
          p_genero?: string
          p_idade?: number
          p_role: Database["public"]["Enums"]["app_role"]
          p_status: string
          p_user_id: string
        }
        Returns: undefined
      }
      search_ia_memoria: {
        Args: {
          filter_clinic_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      search_rag_chunks: {
        Args: {
          filter_clinic_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          document_title: string
          id: string
          metadata: Json
          similarity: number
          source_type: string
        }[]
      }
      user_clinic_id: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user" | "vet" | "tutor"
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
      app_role: ["admin", "user", "vet", "tutor"],
    },
  },
} as const
