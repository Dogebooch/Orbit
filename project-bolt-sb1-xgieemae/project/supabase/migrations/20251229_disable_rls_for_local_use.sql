/*
  # Disable Row Level Security for Local/Personal Use
  
  This migration disables RLS on all tables since the app is being used
  without authentication for personal use only.
  
  WARNING: Do not use this in production with multiple users!
*/

-- Disable RLS on all tables
ALTER TABLE IF EXISTS projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS visions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS prds DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS prompts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings DISABLE ROW LEVEL SECURITY;

-- Terminal tables
ALTER TABLE IF EXISTS terminal_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS terminal_output DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS terminal_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS favorite_commands DISABLE ROW LEVEL SECURITY;

-- Research tables
ALTER TABLE IF EXISTS research_apps DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS research_sections DISABLE ROW LEVEL SECURITY;
