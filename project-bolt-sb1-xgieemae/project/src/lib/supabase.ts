/**
 * Local storage wrapper that provides a Supabase-like API
 * This replaces the cloud Supabase backend with local browser storage
 */
import { localDb } from './localStorage';

// Export localDb as 'supabase' so all existing imports continue to work
export const supabase = localDb;

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          current_stage: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };
      visions: {
        Row: {
          id: string;
          project_id: string;
          problem: string;
          target_user: string;
          success_metrics: string;
          why_software: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['visions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['visions']['Insert']>;
      };
      user_profiles: {
        Row: {
          id: string;
          project_id: string;
          primary_user: string;
          goal: string;
          context: string;
          frustrations: string;
          technical_comfort: string;
          time_constraints: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string;
          status: string;
          priority: number;
          acceptance_criteria: string;
          notes: string;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      prds: {
        Row: {
          id: string;
          project_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['prds']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['prds']['Insert']>;
      };
      prompts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          category: string;
          is_favorite: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['prompts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['prompts']['Insert']>;
      };
      settings: {
        Row: {
          id: string;
          user_id: string;
          key: string;
          value: any;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['settings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['settings']['Insert']>;
      };
    };
  };
};
