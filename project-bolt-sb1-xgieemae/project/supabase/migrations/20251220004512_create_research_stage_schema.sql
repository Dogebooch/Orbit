/*
  # Research Stage Database Schema

  ## Overview
  This migration creates the database schema for the Research stage, which replaces
  the Strategy stage. It supports comprehensive guided research with image attachments.

  ## New Tables

  ### 1. research_data
  Stores research information for each project
  - id (uuid, primary key)
  - project_id (uuid, foreign key to projects)
  - competitor_analysis (text) - Analysis of competitors
  - target_market (text) - Target market research
  - unique_value (text) - Unique value proposition
  - user_interviews (text) - Notes from user interviews
  - technical_requirements (text) - Technical requirements research
  - design_inspiration (text) - Design inspiration notes
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ### 2. research_images
  Stores image attachments for research
  - id (uuid, primary key)
  - project_id (uuid, foreign key to projects)
  - research_field (text) - Which research field this image belongs to
  - image_url (text) - URL to the image
  - image_data (text) - Base64 encoded image data
  - caption (text) - Image caption/description
  - order_index (integer) - Display order
  - created_at (timestamptz)

  ### 3. research_notes
  Stores additional notes and markdown content
  - id (uuid, primary key)
  - project_id (uuid, foreign key to projects)
  - section (text) - Research section name
  - content (text) - Markdown content
  - order_index (integer) - Display order
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own research data
  - Images are stored as base64 to keep them within database security

  ## Indexes
  - Index on project_id for fast lookups
  - Index on research_field for filtering images
*/

-- Create research_data table
CREATE TABLE IF NOT EXISTS research_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  competitor_analysis text DEFAULT '',
  target_market text DEFAULT '',
  unique_value text DEFAULT '',
  user_interviews text DEFAULT '',
  technical_requirements text DEFAULT '',
  design_inspiration text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id)
);

ALTER TABLE research_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project research_data"
  ON research_data
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_data.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own project research_data"
  ON research_data
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_data.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project research_data"
  ON research_data
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_data.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_data.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own project research_data"
  ON research_data
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_data.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create research_images table
CREATE TABLE IF NOT EXISTS research_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  research_field text NOT NULL,
  image_url text DEFAULT '',
  image_data text DEFAULT '',
  caption text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE research_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project research_images"
  ON research_images
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_images.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own project research_images"
  ON research_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_images.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project research_images"
  ON research_images
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_images.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_images.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own project research_images"
  ON research_images
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_images.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create research_notes table
CREATE TABLE IF NOT EXISTS research_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  section text NOT NULL,
  content text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE research_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project research_notes"
  ON research_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_notes.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own project research_notes"
  ON research_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_notes.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project research_notes"
  ON research_notes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_notes.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_notes.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own project research_notes"
  ON research_notes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = research_notes.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_research_data_project_id ON research_data(project_id);
CREATE INDEX IF NOT EXISTS idx_research_images_project_id ON research_images(project_id);
CREATE INDEX IF NOT EXISTS idx_research_images_field ON research_images(project_id, research_field);
CREATE INDEX IF NOT EXISTS idx_research_notes_project_id ON research_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_research_notes_section ON research_notes(project_id, section);
