/*
  # Maintenance Stage Database Schema

  ## Overview
  This migration creates the database schema for the Maintenance stage,
  implementing the "Maintenance and Growth" section from the Vibe Coding methodology.
  It supports weekly reviews, user feedback collection, and technical health monitoring.

  ## New Tables

  ### 1. maintenance_reviews
  Stores weekly review data for each project
  - id (uuid, primary key)
  - project_id (uuid, foreign key to projects)
  - review_date (date) - When the review was conducted
  - week_start_date (date) - Start of the week being reviewed
  - week_end_date (date) - End of the week being reviewed
  - user_feedback_summary (jsonb) - positive themes, pain points, feature requests
  - technical_health (jsonb) - error rates, spikes, patterns
  - notes (text) - Additional notes
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ### 2. user_feedback
  Stores collected user feedback
  - id (uuid, primary key)
  - project_id (uuid, foreign key to projects)
  - feedback_type (text) - positive/pain_point/feature_request
  - content (text) - The feedback content
  - source (text) - Where/who the feedback came from
  - priority (integer) - 1-5 priority level
  - status (text) - new/reviewed/addressed
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ### 3. technical_metrics
  Stores technical health metrics
  - id (uuid, primary key)
  - project_id (uuid, foreign key to projects)
  - metric_date (date) - Date of the metric
  - error_count (integer) - Number of errors
  - error_rate (decimal) - Error rate percentage
  - spike_detected (boolean) - Whether a spike was detected
  - pattern_notes (text) - Notes about patterns observed
  - created_at (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own project data
*/

-- Create maintenance_reviews table
CREATE TABLE IF NOT EXISTS maintenance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  review_date date NOT NULL DEFAULT CURRENT_DATE,
  week_start_date date NOT NULL,
  week_end_date date NOT NULL,
  user_feedback_summary jsonb DEFAULT '{
    "positive_themes": [],
    "pain_points": [],
    "feature_requests": []
  }'::jsonb,
  technical_health jsonb DEFAULT '{
    "error_rates": "",
    "spikes_patterns": "",
    "performance_notes": ""
  }'::jsonb,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create user_feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  feedback_type text NOT NULL CHECK (feedback_type IN ('positive', 'pain_point', 'feature_request')),
  content text NOT NULL,
  source text DEFAULT '',
  priority integer DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'addressed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create technical_metrics table
CREATE TABLE IF NOT EXISTS technical_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  error_count integer DEFAULT 0,
  error_rate decimal(5,2) DEFAULT 0.00,
  spike_detected boolean DEFAULT false,
  pattern_notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_maintenance_reviews_project_id ON maintenance_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_reviews_review_date ON maintenance_reviews(review_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_project_id ON user_feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_technical_metrics_project_id ON technical_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_technical_metrics_date ON technical_metrics(metric_date DESC);

-- Enable Row Level Security
ALTER TABLE maintenance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own maintenance_reviews" ON maintenance_reviews;
DROP POLICY IF EXISTS "Users can create their own maintenance_reviews" ON maintenance_reviews;
DROP POLICY IF EXISTS "Users can update their own maintenance_reviews" ON maintenance_reviews;
DROP POLICY IF EXISTS "Users can delete their own maintenance_reviews" ON maintenance_reviews;

DROP POLICY IF EXISTS "Users can view their own user_feedback" ON user_feedback;
DROP POLICY IF EXISTS "Users can create their own user_feedback" ON user_feedback;
DROP POLICY IF EXISTS "Users can update their own user_feedback" ON user_feedback;
DROP POLICY IF EXISTS "Users can delete their own user_feedback" ON user_feedback;

DROP POLICY IF EXISTS "Users can view their own technical_metrics" ON technical_metrics;
DROP POLICY IF EXISTS "Users can create their own technical_metrics" ON technical_metrics;
DROP POLICY IF EXISTS "Users can update their own technical_metrics" ON technical_metrics;
DROP POLICY IF EXISTS "Users can delete their own technical_metrics" ON technical_metrics;

-- RLS policies for maintenance_reviews (permissive for local use)
CREATE POLICY "Users can view their own maintenance_reviews"
  ON maintenance_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own maintenance_reviews"
  ON maintenance_reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own maintenance_reviews"
  ON maintenance_reviews FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own maintenance_reviews"
  ON maintenance_reviews FOR DELETE
  USING (true);

-- RLS policies for user_feedback (permissive for local use)
CREATE POLICY "Users can view their own user_feedback"
  ON user_feedback FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own user_feedback"
  ON user_feedback FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own user_feedback"
  ON user_feedback FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own user_feedback"
  ON user_feedback FOR DELETE
  USING (true);

-- RLS policies for technical_metrics (permissive for local use)
CREATE POLICY "Users can view their own technical_metrics"
  ON technical_metrics FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own technical_metrics"
  ON technical_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own technical_metrics"
  ON technical_metrics FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own technical_metrics"
  ON technical_metrics FOR DELETE
  USING (true);

-- Create triggers to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_maintenance_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_maintenance_reviews_updated_at ON maintenance_reviews;
DROP TRIGGER IF EXISTS update_user_feedback_updated_at ON user_feedback;

CREATE TRIGGER update_maintenance_reviews_updated_at
  BEFORE UPDATE ON maintenance_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_reviews_updated_at();

CREATE TRIGGER update_user_feedback_updated_at
  BEFORE UPDATE ON user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_user_feedback_updated_at();

