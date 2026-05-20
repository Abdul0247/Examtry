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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          id: string
          is_correct: boolean | null
          question_id: string
          selected_option_id: string | null
          submission_id: string
        }
        Insert: {
          id?: string
          is_correct?: boolean | null
          question_id: string
          selected_option_id?: string | null
          submission_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean | null
          question_id?: string
          selected_option_id?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          access_code: string
          class_name: string
          closes_at: string | null
          created_at: string
          duration_minutes: number
          id: string
          opens_at: string | null
          status: string
          subject: string
          summary_email_sent: boolean
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          access_code: string
          class_name: string
          closes_at?: string | null
          created_at?: string
          duration_minutes: number
          id?: string
          opens_at?: string | null
          status?: string
          subject: string
          summary_email_sent?: boolean
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          access_code?: string
          class_name?: string
          closes_at?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          opens_at?: string | null
          status?: string
          subject?: string
          summary_email_sent?: boolean
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      options: {
        Row: {
          id: string
          image_url: string | null
          is_correct: boolean
          position: number
          question_id: string
          text: string
        }
        Insert: {
          id?: string
          image_url?: string | null
          is_correct?: boolean
          position?: number
          question_id: string
          text: string
        }
        Update: {
          id?: string
          image_url?: string | null
          is_correct?: boolean
          position?: number
          question_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          school_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          school_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          school_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          image_url: string | null
          position: number
          text: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          image_url?: string | null
          position?: number
          text: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          image_url?: string | null
          position?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_students: {
        Row: {
          created_at: string
          exam_id: string
          full_name: string
          id: string
          student_number: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          full_name: string
          id?: string
          student_number: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          full_name?: string
          id?: string
          student_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_students_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          exam_id: string
          id: string
          roster_student_id: string
          score: number | null
          started_at: string
          student_full_name: string
          student_number: string
          submitted_at: string | null
          time_taken_seconds: number | null
          total_questions: number | null
        }
        Insert: {
          exam_id: string
          id?: string
          roster_student_id: string
          score?: number | null
          started_at?: string
          student_full_name: string
          student_number: string
          submitted_at?: string | null
          time_taken_seconds?: number | null
          total_questions?: number | null
        }
        Update: {
          exam_id?: string
          id?: string
          roster_student_id?: string
          score?: number | null
          started_at?: string
          student_full_name?: string
          student_number?: string
          submitted_at?: string | null
          time_taken_seconds?: number | null
          total_questions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_roster_student_id_fkey"
            columns: ["roster_student_id"]
            isOneToOne: false
            referencedRelation: "roster_students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_close_exams: { Args: never; Returns: undefined }
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
