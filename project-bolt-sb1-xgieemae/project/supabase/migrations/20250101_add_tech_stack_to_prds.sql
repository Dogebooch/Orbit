/*
  # Add Tech Stack Column to PRDs Table

  1. Changes
    - Add `tech_stack` column to `prds` table for storing technology stack description
    - Add `out_of_scope` column to `prds` table if it doesn't exist (for safety)
  
  2. Purpose
    - Enable persistence of tech stack information in Strategy stage
    - Store tech stack alongside PRD content for project context
*/

-- Add tech_stack column to prds table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prds' AND column_name = 'tech_stack'
  ) THEN
    ALTER TABLE prds ADD COLUMN tech_stack text DEFAULT '';
  END IF;
END $$;

-- Add out_of_scope column to prds table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prds' AND column_name = 'out_of_scope'
  ) THEN
    ALTER TABLE prds ADD COLUMN out_of_scope text DEFAULT '';
  END IF;
END $$;

