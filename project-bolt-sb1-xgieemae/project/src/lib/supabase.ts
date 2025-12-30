/**
 * Local storage wrapper that provides a Supabase-like API
 * This replaces the cloud Supabase backend with local browser storage
 */
import { localDb } from './localStorage';

// Export localDb as 'supabase' so all existing imports continue to work
// We also add a mock auth object to satisfy the AuthForm component
const authMock = {
  signUp: async ({ email }: { email: string }) => {
    console.log('[Mock Auth] SignUp', email);
    return { data: { user: { id: 'mock-user-id', email } }, error: null };
  },
  signInWithPassword: async ({ email }: { email: string }) => {
    console.log('[Mock Auth] SignIn', email);
    return { data: { user: { id: 'mock-user-id', email } }, error: null };
  },
  signOut: async () => {
    console.log('[Mock Auth] SignOut');
    return { error: null };
  },
  getSession: async () => {
    return { data: { session: { user: { id: 'mock-user-id', email: 'mock@example.com' } } }, error: null };
  },
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    // Immediately trigger signed in state
    callback('SIGNED_IN', { user: { id: 'mock-user-id' } });
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
  getUser: async () => {
    return { data: { user: { id: 'mock-user-id', email: 'mock@example.com' } }, error: null };
  }
};

// Mock channel for real-time subscriptions (no-op for local-first app)
const createMockChannel = (name: string) => {
  return {
    on: (_event: string, _config: any, _callback: () => void) => {
      // Return self for chaining
      return createMockChannel(name);
    },
    subscribe: () => {
      // No-op subscription for local-first app
      return { status: 'SUBSCRIBED' };
    },
  };
};

export const supabase = {
  ...localDb,
  auth: authMock,
  channel: (name: string) => createMockChannel(name),
  removeChannel: (_channel: any) => {
    // No-op for local-first app
  },
};

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
