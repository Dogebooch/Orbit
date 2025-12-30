/*
  # Create research apps structure

  1. New Tables
    - `research_apps`: Store different apps/projects being researched
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `name` (text) - name of the app being researched
      - `order_index` (integer) - display order
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Modified Tables
    - Add `app_id` column to `research_notes` to link notes to specific apps

  3. Security
    - Enable RLS on `research_apps` table
    - Add policy for authenticated users to access their project's research apps
*/

CREATE TABLE IF NOT EXISTS research_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'research_notes' AND column_name = 'app_id'
  ) THEN
    ALTER TABLE research_notes ADD COLUMN app_id uuid REFERENCES research_apps(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE research_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access research apps for their projects"
  ON research_apps
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_apps.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create research apps for their projects"
  ON research_apps
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_apps.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update research apps for their projects"
  ON research_apps
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_apps.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_apps.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete research apps for their projects"
  ON research_apps
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_apps.project_id
      AND projects.user_id = auth.uid()
    )
  );
