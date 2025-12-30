/*
  # Enhanced Foundation Fields for Vibe Coding Guided Setup

  1. Changes to `visions` table
    - `ai_challenge_prompt` - The prompt sent to AI for challenging the idea
    - `ai_challenge_response` - User's recorded AI challenge Q&A responses
    - `target_level` - Proof of concept/MVP/Demo/Production

  2. Changes to `user_profiles` table
    - `persona_name` - Name for the user persona (e.g., "Sarah")
    - `persona_role` - Role/job title (e.g., "freelance graphic designer")
    - `device_preference` - Primary device (desktop/mobile/both)

  3. New `success_metrics` table
    - Stores structured success criteria for each project
    - `target_level` - What level of completeness is targeted
    - `criteria` - JSON array of specific measurable outcomes
    - `validation_methods` - JSON array of how success will be validated
    - `timeline` - Target completion timeframe

  4. New `prd_features` table
    - Stores features for PRD generation
    - `name` - Feature name
    - `user_story` - As a [user], I want [action] so that [benefit]
    - `priority` - must_have/should_have/nice_to_have
    - `acceptance_criteria` - JSON array of acceptance criteria
    - `order_index` - Display order

  5. Security
    - Enable RLS on new tables
    - Add policies for authenticated users to manage their own data
*/

-- Add new columns to visions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visions' AND column_name = 'ai_challenge_prompt'
  ) THEN
    ALTER TABLE visions ADD COLUMN ai_challenge_prompt text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visions' AND column_name = 'ai_challenge_response'
  ) THEN
    ALTER TABLE visions ADD COLUMN ai_challenge_response text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visions' AND column_name = 'target_level'
  ) THEN
    ALTER TABLE visions ADD COLUMN target_level text DEFAULT 'mvp';
  END IF;
END $$;

-- Add new columns to user_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'persona_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN persona_name text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'persona_role'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN persona_role text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'device_preference'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN device_preference text DEFAULT 'both';
  END IF;
END $$;

-- Create success_metrics table
CREATE TABLE IF NOT EXISTS success_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  target_level text DEFAULT 'mvp',
  criteria jsonb DEFAULT '[]'::jsonb,
  validation_methods jsonb DEFAULT '[]'::jsonb,
  timeline text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id)
);

ALTER TABLE success_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project success_metrics"
  ON success_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = success_metrics.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own project success_metrics"
  ON success_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = success_metrics.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project success_metrics"
  ON success_metrics
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = success_metrics.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = success_metrics.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own project success_metrics"
  ON success_metrics
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = success_metrics.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create prd_features table
CREATE TABLE IF NOT EXISTS prd_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  user_story text DEFAULT '',
  priority text DEFAULT 'should_have',
  acceptance_criteria jsonb DEFAULT '[]'::jsonb,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prd_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project prd_features"
  ON prd_features
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = prd_features.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own project prd_features"
  ON prd_features
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = prd_features.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project prd_features"
  ON prd_features
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = prd_features.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = prd_features.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own project prd_features"
  ON prd_features
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = prd_features.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_success_metrics_project_id ON success_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_prd_features_project_id ON prd_features(project_id);
CREATE INDEX IF NOT EXISTS idx_prd_features_order ON prd_features(project_id, order_index);
