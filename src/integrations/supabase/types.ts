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
      badges: {
        Row: {
          description: string
          icon: string
          kind: string
          name: string
          slug: string
          threshold: number
        }
        Insert: {
          description: string
          icon?: string
          kind?: string
          name: string
          slug: string
          threshold?: number
        }
        Update: {
          description?: string
          icon?: string
          kind?: string
          name?: string
          slug?: string
          threshold?: number
        }
        Relationships: []
      }
      chapters: {
        Row: {
          est_minutes: number
          is_free: boolean
          section_slug: string
          slug: string
          sort_order: number
          summary: string | null
          title: string
        }
        Insert: {
          est_minutes?: number
          is_free?: boolean
          section_slug: string
          slug: string
          sort_order?: number
          summary?: string | null
          title: string
        }
        Update: {
          est_minutes?: number
          is_free?: boolean
          section_slug?: string
          slug?: string
          sort_order?: number
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_section_slug_fkey"
            columns: ["section_slug"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["slug"]
          },
        ]
      }
      content_reports: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          note: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          note?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          note?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_subjects: {
        Row: {
          exam_slug: string
          subject_slug: string
          weight: string | null
        }
        Insert: {
          exam_slug: string
          subject_slug: string
          weight?: string | null
        }
        Update: {
          exam_slug?: string
          subject_slug?: string
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_subjects_exam_slug_fkey"
            columns: ["exam_slug"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "exam_subjects_subject_slug_fkey"
            columns: ["subject_slug"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["slug"]
          },
        ]
      }
      exams: {
        Row: {
          description: string | null
          name: string
          short_name: string
          slug: string
          sort_order: number
        }
        Insert: {
          description?: string | null
          name: string
          short_name: string
          slug: string
          sort_order?: number
        }
        Update: {
          description?: string | null
          name?: string
          short_name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      lesson_translations: {
        Row: {
          content: Json
          created_at: string
          id: string
          language: string
          lesson_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          language: string
          lesson_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          language?: string
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_translations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          chapter_slug: string
          content: Json
          created_at: string
          id: string
          needs_review: boolean
          sort_order: number
          title: string
        }
        Insert: {
          chapter_slug: string
          content: Json
          created_at?: string
          id?: string
          needs_review?: boolean
          sort_order?: number
          title: string
        }
        Update: {
          chapter_slug?: string
          content?: Json
          created_at?: string
          id?: string
          needs_review?: boolean
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_chapter_slug_fkey"
            columns: ["chapter_slug"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["slug"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          daily_goal_minutes: number
          display_name: string
          exam_slug: string | null
          id: string
          language: string
          last_active_date: string | null
          onboarded: boolean
          streak_count: number
          target_year: number | null
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          daily_goal_minutes?: number
          display_name?: string
          exam_slug?: string | null
          id: string
          language?: string
          last_active_date?: string | null
          onboarded?: boolean
          streak_count?: number
          target_year?: number | null
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          daily_goal_minutes?: number
          display_name?: string
          exam_slug?: string | null
          id?: string
          language?: string
          last_active_date?: string | null
          onboarded?: boolean
          streak_count?: number
          target_year?: number | null
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          lesson_id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          lesson_id: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          lesson_id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_index: number
          explanation: string | null
          id: string
          lesson_id: string
          options: Json
          question: string
          sort_order: number
        }
        Insert: {
          correct_index: number
          explanation?: string | null
          id?: string
          lesson_id: string
          options: Json
          question: string
          sort_order?: number
        }
        Update: {
          correct_index?: number
          explanation?: string | null
          id?: string
          lesson_id?: string
          options?: Json
          question?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      review_queue: {
        Row: {
          due_at: string
          id: string
          interval_days: number
          lesson_id: string
          repetitions: number
          user_id: string
        }
        Insert: {
          due_at?: string
          id?: string
          interval_days?: number
          lesson_id: string
          repetitions?: number
          user_id: string
        }
        Update: {
          due_at?: string
          id?: string
          interval_days?: number
          lesson_id?: string
          repetitions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_queue_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          description: string | null
          name: string
          slug: string
          sort_order: number
          subject_slug: string
        }
        Insert: {
          description?: string | null
          name: string
          slug: string
          sort_order?: number
          subject_slug: string
        }
        Update: {
          description?: string | null
          name?: string
          slug?: string
          sort_order?: number
          subject_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_subject_slug_fkey"
            columns: ["subject_slug"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["slug"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string
          id: string
          kind: string
          minutes: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          minutes: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          minutes?: number
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          description: string | null
          icon: string | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          description?: string | null
          icon?: string | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          description?: string | null
          icon?: string | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_paise: number
          created_at: string
          expires_at: string | null
          id: string
          plan: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paise?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          plan: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_slug: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_slug: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_slug?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_slug_fkey"
            columns: ["badge_slug"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["slug"]
          },
        ]
      }
      user_progress: {
        Row: {
          chapter_slug: string
          completed_at: string
          id: string
          lesson_id: string
          score: number
          subject_slug: string
          total: number
          user_id: string
        }
        Insert: {
          chapter_slug: string
          completed_at?: string
          id?: string
          lesson_id: string
          score?: number
          subject_slug: string
          total?: number
          user_id: string
        }
        Update: {
          chapter_slug?: string
          completed_at?: string
          id?: string
          lesson_id?: string
          score?: number
          subject_slug?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
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
      xp_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
