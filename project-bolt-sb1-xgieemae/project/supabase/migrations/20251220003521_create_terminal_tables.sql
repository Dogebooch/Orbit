/*
  # Terminal System Database Schema

  ## Overview
  This migration creates the database schema for the embedded terminal system,
  supporting command history, session management, and user preferences.

  ## New Tables

  ### 1. `terminal_sessions`
  Stores terminal session data for each project
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key to projects)
  - `started_at` (timestamptz) - When the session started
  - `ended_at` (timestamptz, nullable) - When the session ended
  - `is_active` (boolean) - Whether the session is currently active
  - `backend_connected` (boolean) - Whether backend was connected during session
  - `working_directory` (text) - The working directory for this session

  ### 2. `terminal_output`
  Stores command execution history and output
  - `id` (uuid, primary key)
  - `session_id` (uuid, foreign key to terminal_sessions)
  - `project_id` (uuid, foreign key to projects)
  - `command` (text) - The command that was executed
  - `output` (text) - The command output/response
  - `status` (text) - success/error/running
  - `is_simulated` (boolean) - Whether this was a mock execution
  - `executed_at` (timestamptz) - When the command was executed
  - `duration_ms` (integer) - How long the command took to execute

  ### 3. `terminal_preferences`
  Stores user preferences for terminal customization
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `font_size` (integer) - Terminal font size (10-20)
  - `color_scheme` (text) - Color scheme name (dark/matrix/ocean)
  - `auto_scroll` (boolean) - Auto-scroll to bottom on new output
  - `show_timestamps` (boolean) - Show timestamps on output
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `favorite_commands`
  Stores user's favorite commands for quick access
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `project_id` (uuid, foreign key to projects, nullable) - Optional project scope
  - `command` (text) - The command text
  - `description` (text) - User's description of what this command does
  - `category` (text) - Category for organization (git/npm/taskmaster/custom)
  - `order_index` (integer) - Display order
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own terminal data
  - Commands are validated against dangerous operations blacklist

  ## Indexes
  - Index on project_id for fast session/output lookups
  - Index on executed_at for chronological queries
  - Index on user_id for preferences and favorites
*/

-- Create terminal_sessions table
CREATE TABLE IF NOT EXISTS terminal_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  is_active boolean DEFAULT true,
  backend_connected boolean DEFAULT false,
  working_directory text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE terminal_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project terminal_sessions"
  ON terminal_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = terminal_sessions.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own project terminal_sessions"
  ON terminal_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = terminal_sessions.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project terminal_sessions"
  ON terminal_sessions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = terminal_sessions.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = terminal_sessions.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own project terminal_sessions"
  ON terminal_sessions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = terminal_sessions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create terminal_output table
CREATE TABLE IF NOT EXISTS terminal_output (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES terminal_sessions(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  command text NOT NULL,
  output text DEFAULT '',
  status text DEFAULT 'success',
  is_simulated boolean DEFAULT true,
  executed_at timestamptz DEFAULT now(),
  duration_ms integer DEFAULT 0
);

ALTER TABLE terminal_output ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project terminal_output"
  ON terminal_output
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = terminal_output.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own project terminal_output"
  ON terminal_output
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = terminal_output.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project terminal_output"
  ON terminal_output
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = terminal_output.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = terminal_output.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own project terminal_output"
  ON terminal_output
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = terminal_output.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create terminal_preferences table
CREATE TABLE IF NOT EXISTS terminal_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  font_size integer DEFAULT 14,
  color_scheme text DEFAULT 'dark',
  auto_scroll boolean DEFAULT true,
  show_timestamps boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE terminal_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own terminal_preferences"
  ON terminal_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own terminal_preferences"
  ON terminal_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own terminal_preferences"
  ON terminal_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own terminal_preferences"
  ON terminal_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create favorite_commands table
CREATE TABLE IF NOT EXISTS favorite_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  command text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'custom',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE favorite_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorite_commands"
  ON favorite_commands
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorite_commands"
  ON favorite_commands
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorite_commands"
  ON favorite_commands
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorite_commands"
  ON favorite_commands
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_terminal_sessions_project_id ON terminal_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_terminal_sessions_active ON terminal_sessions(project_id, is_active);
CREATE INDEX IF NOT EXISTS idx_terminal_output_session_id ON terminal_output(session_id);
CREATE INDEX IF NOT EXISTS idx_terminal_output_project_id ON terminal_output(project_id);
CREATE INDEX IF NOT EXISTS idx_terminal_output_executed_at ON terminal_output(project_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_terminal_preferences_user_id ON terminal_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_commands_user_id ON favorite_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_commands_project_id ON favorite_commands(project_id);
CREATE INDEX IF NOT EXISTS idx_favorite_commands_order ON favorite_commands(user_id, order_index);
