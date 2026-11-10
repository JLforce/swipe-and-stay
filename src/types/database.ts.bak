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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      campuses: {
        Row: {
          city: string
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
          short_name: string
        }
        Insert: {
          city?: string
          created_at?: string
          id?: string
          lat: number
          lng: number
          name: string
          short_name: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          short_name?: string
        }
        Relationships: []
      }
      lease_reviews: {
        Row: {
          completed_at: string | null
          created_at: string
          deposit: string | null
          flagged_clauses: Json
          id: string
          lease_text: string
          notice_period: string | null
          penalties: string | null
          summary_text: string | null
          user_id: string
          utilities_included: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deposit?: string | null
          flagged_clauses?: Json
          id?: string
          lease_text: string
          notice_period?: string | null
          penalties?: string | null
          summary_text?: string | null
          user_id: string
          utilities_included?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deposit?: string | null
          flagged_clauses?: Json
          id?: string
          lease_text?: string
          notice_period?: string | null
          penalties?: string | null
          summary_text?: string | null
          user_id?: string
          utilities_included?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lease_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_admin_notes: {
        Row: {
          admin_notes: string
          listing_id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string
          listing_id: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string
          listing_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_admin_notes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string
          amenities: string[]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          landlord_email: string | null
          landlord_link: string | null
          landlord_name: string | null
          landlord_phone: string | null
          lat: number
          lng: number
          occupancy: string | null
          photo_urls: string[]
          price: number
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          address: string
          amenities?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          landlord_email?: string | null
          landlord_link?: string | null
          landlord_name?: string | null
          landlord_phone?: string | null
          lat: number
          lng: number
          occupancy?: string | null
          photo_urls?: string[]
          price: number
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          address?: string
          amenities?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          landlord_email?: string | null
          landlord_link?: string | null
          landlord_name?: string | null
          landlord_phone?: string | null
          lat?: number
          lng?: number
          occupancy?: string | null
          photo_urls?: string[]
          price?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_explanations: {
        Row: {
          created_at: string
          explanation: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          explanation: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          explanation?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_explanations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_explanations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          listing_id: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      preference_weights: {
        Row: {
          priority_weights: Json
          swipe_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          priority_weights?: Json
          swipe_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          priority_weights?: Json
          swipe_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preference_weights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          budget_max: number | null
          budget_min: number | null
          campus_id: string | null
          contact_info: string | null
          created_at: string
          desired_amenities: string[]
          email: string | null
          full_name: string | null
          housing_type: string | null
          id: string
          onboarding_completed: boolean
          program: string | null
          role: string
          roommate_pref: string | null
        }
        Insert: {
          avatar_url?: string | null
          budget_max?: number | null
          budget_min?: number | null
          campus_id?: string | null
          contact_info?: string | null
          created_at?: string
          desired_amenities?: string[]
          email?: string | null
          full_name?: string | null
          housing_type?: string | null
          id: string
          onboarding_completed?: boolean
          program?: string | null
          role?: string
          roommate_pref?: string | null
        }
        Update: {
          avatar_url?: string | null
          budget_max?: number | null
          budget_min?: number | null
          campus_id?: string | null
          contact_info?: string | null
          created_at?: string
          desired_amenities?: string[]
          email?: string | null
          full_name?: string | null
          housing_type?: string | null
          id?: string
          onboarding_completed?: boolean
          program?: string | null
          role?: string
          roommate_pref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      swipes: {
        Row: {
          direction: string
          id: string
          listing_id: string
          swiped_at: string
          unliked_at: string | null
          user_id: string
        }
        Insert: {
          direction: string
          id?: string
          listing_id: string
          swiped_at?: string
          unliked_at?: string | null
          user_id: string
        }
        Update: {
          direction?: string
          id?: string
          listing_id?: string
          swiped_at?: string
          unliked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      liked_listings: {
        Row: {
          liked_at: string | null
          listing_id: string | null
          user_id: string | null
        }
        Insert: {
          liked_at?: string | null
          listing_id?: string | null
          user_id?: string | null
        }
        Update: {
          liked_at?: string | null
          listing_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "swipes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
