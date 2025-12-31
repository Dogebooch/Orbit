/*
  # Add Copilot Instructions Column to Projects Table

  1. Changes
    - Add `copilot_instructions` column to `projects` table for storing GitHub Copilot AI instructions
    - Add `bootstrap_complete` boolean column to track Bolt bootstrap completion
  
  2. Purpose
    - Enable persistence of copilot instructions generated from actual codebase
    - Track workflow progress through Strategy stage steps
*/

-- Add copilot_instructions column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'copilot_instructions'
  ) THEN
    ALTER TABLE projects ADD COLUMN copilot_instructions text DEFAULT '';
  END IF;
END $$;

-- Add bootstrap_complete column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'bootstrap_complete'
  ) THEN
    ALTER TABLE projects ADD COLUMN bootstrap_complete boolean DEFAULT false;
  END IF;
END $$;

