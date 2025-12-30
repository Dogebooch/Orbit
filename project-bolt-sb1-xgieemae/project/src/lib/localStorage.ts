/**
 * localStorage-based data store that mimics Supabase API patterns
 * for offline/local-only use of the Orbit app.
 */

// Helper to generate UUIDs
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper to get current timestamp
function now(): string {
  return new Date().toISOString();
}

// Generic storage helpers
function getStore<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setStore<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Storage keys
const KEYS = {
  projects: 'orbit_projects',
  visions: 'orbit_visions',
  userProfiles: 'orbit_user_profiles',
  tasks: 'orbit_tasks',
  prds: 'orbit_prds',
  prompts: 'orbit_prompts',
  settings: 'orbit_settings',
  terminalPreferences: 'orbit_terminal_preferences',
  favoriteCommands: 'orbit_favorite_commands',
  terminalSessions: 'orbit_terminal_sessions',
  terminalOutput: 'orbit_terminal_output',
  researchApps: 'orbit_research_apps',
  researchNotes: 'orbit_research_notes',
  researchImages: 'orbit_research_images',
  projectConfigs: 'orbit_project_configs',
  aiSettings: 'orbit_ai_settings',
};

// Types
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  current_stage: string;
  created_at: string;
  updated_at: string;
}

export interface Vision {
  id: string;
  project_id: string;
  problem: string;
  target_user: string;
  success_metrics: string;
  why_software: string;
  target_level?: string;
  ai_challenge_response?: string;
  markdown_content?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  project_id: string;
  primary_user: string;
  goal: string;
  context: string;
  frustrations: string;
  technical_comfort: string;
  time_constraints: string;
  persona_name?: string;
  persona_role?: string;
  markdown_content?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
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
}

export interface PRD {
  id: string;
  project_id: string;
  content: string;
  out_of_scope: string;
  created_at: string;
  updated_at: string;
}

export interface Prompt {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  is_favorite: boolean;
  source?: string | null;
  is_default?: boolean;
  created_at: string;
}

export interface TerminalPreferences {
  id: string;
  user_id: string;
  font_size: number;
  color_scheme: string;
  auto_scroll: boolean;
  show_timestamps: boolean;
  created_at: string;
  updated_at: string;
}

export interface FavoriteCommand {
  id: string;
  user_id: string;
  project_id: string | null;
  command: string;
  description: string;
  category: string;
  order_index: number;
  created_at: string;
}

export interface TerminalSession {
  id: string;
  project_id: string;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  backend_connected: boolean;
  working_directory: string;
}

export interface TerminalOutput {
  id: string;
  session_id: string;
  project_id: string;
  command: string;
  output: string;
  status: string;
  is_simulated: boolean;
  executed_at: string;
  duration_ms: number;
}

export interface ResearchApp {
  id: string;
  project_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

export interface ResearchNote {
  id: string;
  project_id: string;
  app_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ResearchImage {
  id: string;
  project_id: string;
  research_field: string;
  image_data: string;
  caption: string;
  order_index: number;
  created_at: string;
}

export interface ProjectConfig {
  id: string;
  project_id: string;
  tech_stack_id: string;
  tech_stack_custom: string | null;
  coding_standards: Record<string, unknown>;
  ai_instructions: Record<string, unknown>;
  custom_sections: Record<string, string>;
  foundation_data_hash: string;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AISettings {
  id: string;
  user_id: string;
  gemini_api_key: string | null;
  enable_codebase_analysis: boolean;
  created_at: string;
  updated_at: string;
}

// Query builder pattern to mimic Supabase
type FilterFn<T> = (item: T) => boolean;

class QueryBuilder<T extends { id: string }> {
  private storageKey: string;
  private filters: FilterFn<T>[] = [];
  private _selectFields: string[] | null = null;
  private orderByField: string | null = null;
  private orderAsc: boolean = true;
  private limitCount: number | null = null;
  private singleResult: boolean = false;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  select(fields: string = '*') {
    if (fields !== '*') {
      this._selectFields = fields.split(',').map((f) => f.trim());
    }
    return this;
  }

  eq<K extends keyof T>(field: K, value: T[K]) {
    this.filters.push((item) => item[field] === value);
    return this;
  }

  neq<K extends keyof T>(field: K, value: T[K]) {
    this.filters.push((item) => item[field] !== value);
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderByField = field;
    this.orderAsc = options?.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  maybeSingle() {
    this.singleResult = true;
    return this;
  }

  async then<TResult>(
    resolve: (value: { data: T | T[] | null; error: null } | { data: null; error: Error }) => TResult
  ): Promise<TResult> {
    try {
      let data = getStore<T>(this.storageKey);

      // Apply filters
      for (const filter of this.filters) {
        data = data.filter(filter);
      }

      // Apply ordering
      if (this.orderByField) {
        const field = this.orderByField as keyof T;
        data.sort((a, b) => {
          const aVal = a[field];
          const bVal = b[field];
          if (aVal < bVal) return this.orderAsc ? -1 : 1;
          if (aVal > bVal) return this.orderAsc ? 1 : -1;
          return 0;
        });
      }

      // Apply limit
      if (this.limitCount !== null) {
        data = data.slice(0, this.limitCount);
      }

      // Return single or array
      if (this.singleResult) {
        return resolve({ data: data[0] || null, error: null });
      }

      return resolve({ data, error: null });
    } catch (err) {
      return resolve({ data: null, error: err as Error });
    }
  }
}

class InsertBuilder<T extends { id: string }> {
  private storageKey: string;
  private items: Partial<T>[];
  private returnData: boolean = false;
  private singleResult: boolean = false;

  constructor(storageKey: string, items: Partial<T> | Partial<T>[]) {
    this.storageKey = storageKey;
    this.items = Array.isArray(items) ? items : [items];
  }

  select(_fields: string = '*') {
    this.returnData = true;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  async then<TResult>(
    resolve: (value: { data: T | T[] | null; error: null } | { data: null; error: Error }) => TResult
  ): Promise<TResult> {
    try {
      const store = getStore<T>(this.storageKey);
      const timestamp = now();
      const newItems = this.items.map((item) => ({
        id: generateId(),
        created_at: timestamp,
        updated_at: timestamp,
        ...item,
      })) as unknown as T[];

      store.push(...newItems);
      setStore(this.storageKey, store);

      if (this.returnData) {
        return resolve({ data: this.singleResult ? newItems[0] : newItems, error: null });
      }
      return resolve({ data: null, error: null });
    } catch (err) {
      return resolve({ data: null, error: err as Error });
    }
  }
}

class UpdateBuilder<T extends { id: string }> {
  private storageKey: string;
  private updates: Partial<T>;
  private filters: FilterFn<T>[] = [];
  private returnData: boolean = false;
  private singleResult: boolean = false;

  constructor(storageKey: string, updates: Partial<T>) {
    this.storageKey = storageKey;
    this.updates = updates;
  }

  eq<K extends keyof T>(field: K, value: T[K]) {
    this.filters.push((item) => item[field] === value);
    return this;
  }

  select(_fields: string = '*') {
    this.returnData = true;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  async then<TResult>(
    resolve: (value: { data: T | T[] | null; error: null } | { data: null; error: Error }) => TResult
  ): Promise<TResult> {
    try {
      const store = getStore<T>(this.storageKey);
      const updated: T[] = [];
      const timestamp = now();

      for (let i = 0; i < store.length; i++) {
        let matches = true;
        for (const filter of this.filters) {
          if (!filter(store[i])) {
            matches = false;
            break;
          }
        }
        if (matches) {
          store[i] = { ...store[i], ...this.updates, updated_at: timestamp };
          updated.push(store[i]);
        }
      }

      setStore(this.storageKey, store);

      if (this.returnData) {
        return resolve({ data: this.singleResult ? updated[0] || null : updated, error: null });
      }
      return resolve({ data: null, error: null });
    } catch (err) {
      return resolve({ data: null, error: err as Error });
    }
  }
}

class DeleteBuilder<T extends { id: string }> {
  private storageKey: string;
  private filters: FilterFn<T>[] = [];

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  eq<K extends keyof T>(field: K, value: T[K]) {
    this.filters.push((item) => item[field] === value);
    return this;
  }

  async then<TResult>(
    resolve: (value: { data: null; error: null } | { data: null; error: Error }) => TResult
  ): Promise<TResult> {
    try {
      let store = getStore<T>(this.storageKey);

      store = store.filter((item) => {
        for (const filter of this.filters) {
          if (filter(item)) {
            return false; // Remove this item
          }
        }
        return true;
      });

      setStore(this.storageKey, store);
      return resolve({ data: null, error: null });
    } catch (err) {
      return resolve({ data: null, error: err as Error });
    }
  }
}

// Table accessor that mimics Supabase's .from() pattern
function createTableAccessor<T extends { id: string }>(storageKey: string) {
  return {
    select: (fields: string = '*') => new QueryBuilder<T>(storageKey).select(fields),
    insert: (items: Partial<T> | Partial<T>[]) => new InsertBuilder<T>(storageKey, items),
    update: (updates: Partial<T>) => new UpdateBuilder<T>(storageKey, updates),
    delete: () => new DeleteBuilder<T>(storageKey),
  };
}

// Main localDb object that mimics supabase.from()
export const localDb = {
  from: (table: string) => {
    const keyMap: Record<string, string> = {
      projects: KEYS.projects,
      visions: KEYS.visions,
      user_profiles: KEYS.userProfiles,
      tasks: KEYS.tasks,
      prds: KEYS.prds,
      prompts: KEYS.prompts,
      settings: KEYS.settings,
      terminal_preferences: KEYS.terminalPreferences,
      favorite_commands: KEYS.favoriteCommands,
      terminal_sessions: KEYS.terminalSessions,
      terminal_output: KEYS.terminalOutput,
      research_apps: KEYS.researchApps,
      research_notes: KEYS.researchNotes,
      research_images: KEYS.researchImages,
      project_configs: KEYS.projectConfigs,
      ai_settings: KEYS.aiSettings,
    };

    const storageKey = keyMap[table];
    if (!storageKey) {
      console.warn(`Unknown table: ${table}, using as key directly`);
      return createTableAccessor<any>(`orbit_${table}`);
    }

    return createTableAccessor<any>(storageKey);
  },
};

// Export for direct use as a drop-in replacement
export default localDb;
