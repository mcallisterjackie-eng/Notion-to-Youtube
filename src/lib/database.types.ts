/**
 * GENERATED from the Supabase schema (supabase/migrations). Do not edit by hand.
 * Regenerate after every migration: Supabase dashboard / CLI
 * `supabase gen types typescript --project-id egogfmjojgcsbojbglsn`.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.18" };
  public: {
    Tables: {
      account_members: {
        Row: { account_id: string; created_at: string; role: Database["public"]["Enums"]["member_role"]; user_id: string };
        Insert: { account_id: string; created_at?: string; role?: Database["public"]["Enums"]["member_role"]; user_id: string };
        Update: { account_id?: string; created_at?: string; role?: Database["public"]["Enums"]["member_role"]; user_id?: string };
        Relationships: [
          { foreignKeyName: "account_members_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "accounts"; referencedColumns: ["id"] },
        ];
      };
      accounts: {
        Row: {
          automation_activated_at: string | null;
          automation_deactivated_at: string | null;
          automation_status: Database["public"]["Enums"]["automation_status"];
          created_at: string;
          id: string;
          name: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          automation_activated_at?: string | null;
          automation_deactivated_at?: string | null;
          automation_status?: Database["public"]["Enums"]["automation_status"];
          created_at?: string;
          id?: string;
          name: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          automation_activated_at?: string | null;
          automation_deactivated_at?: string | null;
          automation_status?: Database["public"]["Enums"]["automation_status"];
          created_at?: string;
          id?: string;
          name?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      connection_secrets: {
        Row: { account_id: string; connection_id: string; created_at: string; updated_at: string; vault_secret_id: string };
        Insert: { account_id: string; connection_id: string; created_at?: string; updated_at?: string; vault_secret_id: string };
        Update: { account_id?: string; connection_id?: string; created_at?: string; updated_at?: string; vault_secret_id?: string };
        Relationships: [
          { foreignKeyName: "connection_secrets_connection_id_account_id_fkey"; columns: ["connection_id", "account_id"]; isOneToOne: false; referencedRelation: "connections"; referencedColumns: ["id", "account_id"] },
        ];
      };
      connections: {
        Row: {
          account_id: string;
          connected_at: string | null;
          created_at: string;
          external_account_id: string | null;
          external_account_name: string | null;
          granted_scopes: string[];
          id: string;
          last_checked_at: string | null;
          last_error_code: string | null;
          last_error_message: string | null;
          provider: Database["public"]["Enums"]["connection_provider"];
          status: Database["public"]["Enums"]["connection_status"];
          updated_at: string;
        };
        Insert: {
          account_id: string;
          connected_at?: string | null;
          created_at?: string;
          external_account_id?: string | null;
          external_account_name?: string | null;
          granted_scopes?: string[];
          id?: string;
          last_checked_at?: string | null;
          last_error_code?: string | null;
          last_error_message?: string | null;
          provider: Database["public"]["Enums"]["connection_provider"];
          status?: Database["public"]["Enums"]["connection_status"];
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          connected_at?: string | null;
          created_at?: string;
          external_account_id?: string | null;
          external_account_name?: string | null;
          granted_scopes?: string[];
          id?: string;
          last_checked_at?: string | null;
          last_error_code?: string | null;
          last_error_message?: string | null;
          provider?: Database["public"]["Enums"]["connection_provider"];
          status?: Database["public"]["Enums"]["connection_status"];
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "connections_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "accounts"; referencedColumns: ["id"] },
        ];
      };
      data_sources: {
        Row: {
          account_id: string;
          connection_id: string;
          created_at: string;
          external_id: string;
          id: string;
          name: string | null;
          properties_snapshot: Json | null;
          properties_synced_at: string | null;
          source_type: Database["public"]["Enums"]["data_source_type"];
          updated_at: string;
          url: string | null;
        };
        Insert: {
          account_id: string;
          connection_id: string;
          created_at?: string;
          external_id: string;
          id?: string;
          name?: string | null;
          properties_snapshot?: Json | null;
          properties_synced_at?: string | null;
          source_type?: Database["public"]["Enums"]["data_source_type"];
          updated_at?: string;
          url?: string | null;
        };
        Update: {
          account_id?: string;
          connection_id?: string;
          created_at?: string;
          external_id?: string;
          id?: string;
          name?: string | null;
          properties_snapshot?: Json | null;
          properties_synced_at?: string | null;
          source_type?: Database["public"]["Enums"]["data_source_type"];
          updated_at?: string;
          url?: string | null;
        };
        Relationships: [
          { foreignKeyName: "data_sources_account_id_fkey"; columns: ["account_id"]; isOneToOne: true; referencedRelation: "accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "data_sources_connection_id_account_id_fkey"; columns: ["connection_id", "account_id"]; isOneToOne: false; referencedRelation: "connections"; referencedColumns: ["id", "account_id"] },
        ];
      };
      field_mappings: {
        Row: {
          account_id: string;
          created_at: string;
          id: string;
          mapping_config_id: string;
          settings: Json;
          source_property_id: string | null;
          source_property_name: string | null;
          source_property_type: string | null;
          target_key: string;
          updated_at: string;
        };
        Insert: {
          account_id: string;
          created_at?: string;
          id?: string;
          mapping_config_id: string;
          settings?: Json;
          source_property_id?: string | null;
          source_property_name?: string | null;
          source_property_type?: string | null;
          target_key: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          created_at?: string;
          id?: string;
          mapping_config_id?: string;
          settings?: Json;
          source_property_id?: string | null;
          source_property_name?: string | null;
          source_property_type?: string | null;
          target_key?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "field_mappings_mapping_config_id_account_id_fkey"; columns: ["mapping_config_id", "account_id"]; isOneToOne: false; referencedRelation: "mapping_configs"; referencedColumns: ["id", "account_id"] },
        ];
      };
      job_errors: {
        Row: {
          account_id: string;
          category: Database["public"]["Enums"]["error_category"];
          code: string;
          created_at: string;
          customer_message: string;
          external_record_id: string | null;
          external_response: Json | null;
          id: string;
          operation: string | null;
          service: string | null;
          technical_message: string | null;
          upload_job_id: string | null;
        };
        Insert: {
          account_id: string;
          category: Database["public"]["Enums"]["error_category"];
          code: string;
          created_at?: string;
          customer_message: string;
          external_record_id?: string | null;
          external_response?: Json | null;
          id?: string;
          operation?: string | null;
          service?: string | null;
          technical_message?: string | null;
          upload_job_id?: string | null;
        };
        Update: {
          account_id?: string;
          category?: Database["public"]["Enums"]["error_category"];
          code?: string;
          created_at?: string;
          customer_message?: string;
          external_record_id?: string | null;
          external_response?: Json | null;
          id?: string;
          operation?: string | null;
          service?: string | null;
          technical_message?: string | null;
          upload_job_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "job_errors_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "job_errors_upload_job_id_account_id_fkey"; columns: ["upload_job_id", "account_id"]; isOneToOne: false; referencedRelation: "upload_jobs"; referencedColumns: ["id", "account_id"] },
        ];
      };
      mapping_configs: {
        Row: { account_id: string; created_at: string; data_source_id: string; id: string; status: string; updated_at: string; validated_at: string | null; validation_results: Json };
        Insert: { account_id: string; created_at?: string; data_source_id: string; id?: string; status?: string; updated_at?: string; validated_at?: string | null; validation_results?: Json };
        Update: { account_id?: string; created_at?: string; data_source_id?: string; id?: string; status?: string; updated_at?: string; validated_at?: string | null; validation_results?: Json };
        Relationships: [
          { foreignKeyName: "mapping_configs_data_source_id_account_id_fkey"; columns: ["data_source_id", "account_id"]; isOneToOne: false; referencedRelation: "data_sources"; referencedColumns: ["id", "account_id"] },
        ];
      };
      profiles: {
        Row: { created_at: string; full_name: string; id: string; updated_at: string };
        Insert: { created_at?: string; full_name?: string; id: string; updated_at?: string };
        Update: { created_at?: string; full_name?: string; id?: string; updated_at?: string };
        Relationships: [];
      };
      status_mappings: {
        Row: { account_id: string; created_at: string; id: string; mapping_config_id: string; option_id: string | null; option_name: string; source_property_id: string; stage: string; updated_at: string };
        Insert: { account_id: string; created_at?: string; id?: string; mapping_config_id: string; option_id?: string | null; option_name: string; source_property_id: string; stage: string; updated_at?: string };
        Update: { account_id?: string; created_at?: string; id?: string; mapping_config_id?: string; option_id?: string | null; option_name?: string; source_property_id?: string; stage?: string; updated_at?: string };
        Relationships: [
          { foreignKeyName: "status_mappings_mapping_config_id_account_id_fkey"; columns: ["mapping_config_id", "account_id"]; isOneToOne: false; referencedRelation: "mapping_configs"; referencedColumns: ["id", "account_id"] },
        ];
      };
      subscriptions: {
        Row: {
          account_id: string;
          cancel_at_period_end: boolean;
          created_at: string;
          current_period_end: string | null;
          current_period_start: string | null;
          plan: string;
          status: Database["public"]["Enums"]["subscription_status"];
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          updated_at: string;
        };
        Insert: {
          account_id: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          plan?: string;
          status?: Database["public"]["Enums"]["subscription_status"];
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          plan?: string;
          status?: Database["public"]["Enums"]["subscription_status"];
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "subscriptions_account_id_fkey"; columns: ["account_id"]; isOneToOne: true; referencedRelation: "accounts"; referencedColumns: ["id"] },
        ];
      };
      upload_jobs: {
        Row: {
          account_id: string;
          attempt_count: number;
          created_at: string;
          data_source_id: string | null;
          external_record_id: string;
          external_record_url: string | null;
          finished_at: string | null;
          id: string;
          kind: Database["public"]["Enums"]["job_kind"];
          record_title: string | null;
          republish_of_job_id: string | null;
          scheduled_publish_at: string | null;
          source_video_url: string | null;
          started_at: string | null;
          state: string;
          updated_at: string;
          youtube_studio_url: string | null;
          youtube_video_id: string | null;
          youtube_video_url: string | null;
        };
        Insert: {
          account_id: string;
          attempt_count?: number;
          created_at?: string;
          data_source_id?: string | null;
          external_record_id: string;
          external_record_url?: string | null;
          finished_at?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["job_kind"];
          record_title?: string | null;
          republish_of_job_id?: string | null;
          scheduled_publish_at?: string | null;
          source_video_url?: string | null;
          started_at?: string | null;
          state?: string;
          updated_at?: string;
          youtube_studio_url?: string | null;
          youtube_video_id?: string | null;
          youtube_video_url?: string | null;
        };
        Update: {
          account_id?: string;
          attempt_count?: number;
          created_at?: string;
          data_source_id?: string | null;
          external_record_id?: string;
          external_record_url?: string | null;
          finished_at?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["job_kind"];
          record_title?: string | null;
          republish_of_job_id?: string | null;
          scheduled_publish_at?: string | null;
          source_video_url?: string | null;
          started_at?: string | null;
          state?: string;
          updated_at?: string;
          youtube_studio_url?: string | null;
          youtube_video_id?: string | null;
          youtube_video_url?: string | null;
        };
        Relationships: [
          { foreignKeyName: "upload_jobs_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "upload_jobs_data_source_id_account_id_fkey"; columns: ["data_source_id", "account_id"]; isOneToOne: false; referencedRelation: "data_sources"; referencedColumns: ["id", "account_id"] },
          { foreignKeyName: "upload_jobs_republish_of_job_id_account_id_fkey"; columns: ["republish_of_job_id", "account_id"]; isOneToOne: false; referencedRelation: "upload_jobs"; referencedColumns: ["id", "account_id"] },
        ];
      };
      usage_periods: {
        Row: { account_id: string; created_at: string; id: string; period_end: string; period_start: string; updated_at: string; video_limit: number; videos_counted: number };
        Insert: { account_id: string; created_at?: string; id?: string; period_end: string; period_start: string; updated_at?: string; video_limit?: number; videos_counted?: number };
        Update: { account_id?: string; created_at?: string; id?: string; period_end?: string; period_start?: string; updated_at?: string; video_limit?: number; videos_counted?: number };
        Relationships: [
          { foreignKeyName: "usage_periods_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "accounts"; referencedColumns: ["id"] },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      automation_status: "enabled" | "inactive";
      connection_provider: "notion" | "youtube" | "google_drive";
      connection_status: "not_connected" | "connected" | "error" | "permission_problem";
      data_source_type: "notion";
      error_category:
        | "configuration"
        | "authentication"
        | "permission"
        | "notion"
        | "google_drive"
        | "youtube"
        | "network"
        | "temporary"
        | "usage_subscription";
      job_kind: "automatic" | "republish";
      member_role: "owner";
      subscription_status: "none" | "active" | "past_due" | "canceled" | "expired";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
