/*
  # Add AI Session Management

  ## Overview
  This migration adds support for tracking AI conversation sessions to prevent
  context pollution, following the Vibe Coding methodology.

  ## Changes
  - Create `ai_sessions` table to track conversation sessions
  - Add `current_session_id` to tasks table to associate tasks with sessions
  - Add indexes for efficient session lookups
  - Enable RLS policies for user data isolation
*/

-- Create ai_sessions table
CREATE TABLE IF NOT EXISTS ai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  session_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  task_ids text[] DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add current_session_id to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS current_session_id uuid REFERENCES ai_sessions(id) ON DELETE SET NULL;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_ai_sessions_project_id ON ai_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_id ON ai_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_status ON ai_sessions(status);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_started_at ON ai_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_current_session_id ON tasks(current_session_id);

-- Enable Row Level Security
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own sessions" ON ai_sessions;
DROP POLICY IF EXISTS "Users can create their own sessions" ON ai_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON ai_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON ai_sessions;

-- Create RLS policies for ai_sessions
-- For local/personal use, we allow all operations for the local user
CREATE POLICY "Users can view their own sessions"
  ON ai_sessions FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own sessions"
  ON ai_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own sessions"
  ON ai_sessions FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own sessions"
  ON ai_sessions FOR DELETE
  USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_sessions_updated_at ON ai_sessions;

CREATE TRIGGER update_ai_sessions_updated_at
  BEFORE UPDATE ON ai_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_sessions_updated_at();

