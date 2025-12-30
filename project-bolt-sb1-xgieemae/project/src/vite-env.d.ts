/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_TERMINAL_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  electronAPI?: {
    getAppVersion: () => Promise<string>;
    openLocalFile: (relativePath: string) => Promise<{ success: boolean; error?: string }>;
    openDirectory: (directoryPath: string) => Promise<{ success: boolean; error?: string }>;
    platform: string;
    isElectron: boolean;
  };
}
