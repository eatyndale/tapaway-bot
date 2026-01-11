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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      assessments: {
        Row: {
          age_group: string | null
          answers: number[]
          created_at: string
          id: string
          industry: string | null
          needs_crisis_support: boolean
          recommendation: string
          severity_level: string
          total_score: number
          user_id: string
        }
        Insert: {
          age_group?: string | null
          answers: number[]
          created_at?: string
          id?: string
          industry?: string | null
          needs_crisis_support?: boolean
          recommendation: string
          severity_level: string
          total_score: number
          user_id: string
        }
        Update: {
          age_group?: string | null
          answers?: number[]
          created_at?: string
          id?: string
          industry?: string | null
          needs_crisis_support?: boolean
          recommendation?: string
          severity_level?: string
          total_score?: number
          user_id?: string
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          age_group: string | null
          created_at: string
          crisis_detected: boolean | null
          crisis_resources: Json | null
          id: string
          industry: string | null
          messages: Json | null
          session_number: number
          updated_at: string
          user_id: string
        }
        Insert: {
          age_group?: string | null
          created_at?: string
          crisis_detected?: boolean | null
          crisis_resources?: Json | null
          id?: string
          industry?: string | null
          messages?: Json | null
          session_number: number
          updated_at?: string
          user_id: string
        }
        Update: {
          age_group?: string | null
          created_at?: string
          crisis_detected?: boolean | null
          crisis_resources?: Json | null
          id?: string
          industry?: string | null
          messages?: Json | null
          session_number?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      evaluation_results: {
        Row: {
          created_at: string | null
          crisis_detected: boolean | null
          crisis_match: boolean | null
          directive_valid: boolean | null
          error_message: string | null
          id: string
          input_tokens: number | null
          intent_match: boolean | null
          json_parse_success: boolean | null
          latency_ms: number | null
          model: string
          output_tokens: number | null
          response_content: string | null
          run_id: string | null
          test_case_id: string | null
        }
        Insert: {
          created_at?: string | null
          crisis_detected?: boolean | null
          crisis_match?: boolean | null
          directive_valid?: boolean | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          intent_match?: boolean | null
          json_parse_success?: boolean | null
          latency_ms?: number | null
          model: string
          output_tokens?: number | null
          response_content?: string | null
          run_id?: string | null
          test_case_id?: string | null
        }
        Update: {
          created_at?: string | null
          crisis_detected?: boolean | null
          crisis_match?: boolean | null
          directive_valid?: boolean | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          intent_match?: boolean | null
          json_parse_success?: boolean | null
          latency_ms?: number | null
          model?: string
          output_tokens?: number | null
          response_content?: string | null
          run_id?: string | null
          test_case_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_results_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "evaluation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_results_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "evaluation_test_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_runs: {
        Row: {
          completed_at: string | null
          id: string
          models_tested: string[]
          name: string
          started_at: string | null
          status: string
          test_case_count: number | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          models_tested: string[]
          name: string
          started_at?: string | null
          status?: string
          test_case_count?: number | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          models_tested?: string[]
          name?: string
          started_at?: string | null
          status?: string
          test_case_count?: number | null
        }
        Relationships: []
      }
      evaluation_test_cases: {
        Row: {
          category: string
          conversation_state: string | null
          created_at: string | null
          expected_crisis: boolean | null
          expected_directive_type: string | null
          expected_intent: string | null
          id: string
          input_message: string
          metadata: Json | null
          source: string
        }
        Insert: {
          category: string
          conversation_state?: string | null
          created_at?: string | null
          expected_crisis?: boolean | null
          expected_directive_type?: string | null
          expected_intent?: string | null
          id?: string
          input_message: string
          metadata?: Json | null
          source: string
        }
        Update: {
          category?: string
          conversation_state?: string | null
          created_at?: string | null
          expected_crisis?: boolean | null
          expected_directive_type?: string | null
          expected_intent?: string | null
          id?: string
          input_message?: string
          metadata?: Json | null
          source?: string
        }
        Relationships: []
      }
      human_evaluations: {
        Row: {
          comments: string | null
          created_at: string | null
          empathy_score: number | null
          id: string
          language_score: number | null
          overall_score: number | null
          protocol_score: number | null
          rater_id: string
          result_id: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          empathy_score?: number | null
          id?: string
          language_score?: number | null
          overall_score?: number | null
          protocol_score?: number | null
          rater_id: string
          result_id?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          empathy_score?: number | null
          id?: string
          language_score?: number | null
          overall_score?: number | null
          protocol_score?: number | null
          rater_id?: string
          result_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "human_evaluations_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "evaluation_results"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_group: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          industry: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_group?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          industry?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_group?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          industry?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tapping_sessions: {
        Row: {
          age_group: string | null
          body_location: string
          completed_at: string | null
          created_at: string
          feeling: string
          final_intensity: number | null
          id: string
          improvement: number | null
          industry: string | null
          initial_intensity: number
          problem: string
          reminder_phrases: string[] | null
          rounds_completed: number | null
          setup_statements: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_group?: string | null
          body_location: string
          completed_at?: string | null
          created_at?: string
          feeling: string
          final_intensity?: number | null
          id?: string
          improvement?: number | null
          industry?: string | null
          initial_intensity: number
          problem: string
          reminder_phrases?: string[] | null
          rounds_completed?: number | null
          setup_statements?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_group?: string | null
          body_location?: string
          completed_at?: string | null
          created_at?: string
          feeling?: string
          final_intensity?: number | null
          id?: string
          improvement?: number | null
          industry?: string | null
          initial_intensity?: number
          problem?: string
          reminder_phrases?: string[] | null
          rounds_completed?: number | null
          setup_statements?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      validate_assessment_answers: {
        Args: { answers: number[] }
        Returns: boolean
      }
      validate_intensity: { Args: { intensity: number }; Returns: boolean }
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
