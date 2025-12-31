/*
  # Add fields to research_apps table
  
  Adds fields to store structured research data for each app:
  - what_does_well: What the app does well
  - what_does_poorly: What the app does poorly  
  - key_insight: Key insight from researching this app
*/

DO $$
BEGIN
  -- Add what_does_well column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'research_apps' AND column_name = 'what_does_well'
  ) THEN
    ALTER TABLE research_apps ADD COLUMN what_does_well text DEFAULT '';
  END IF;

  -- Add what_does_poorly column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'research_apps' AND column_name = 'what_does_poorly'
  ) THEN
    ALTER TABLE research_apps ADD COLUMN what_does_poorly text DEFAULT '';
  END IF;

  -- Add key_insight column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'research_apps' AND column_name = 'key_insight'
  ) THEN
    ALTER TABLE research_apps ADD COLUMN key_insight text DEFAULT '';
  END IF;

  -- Add app_id to research_images if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'research_images' AND column_name = 'app_id'
  ) THEN
    ALTER TABLE research_images ADD COLUMN app_id uuid REFERENCES research_apps(id) ON DELETE CASCADE;
  END IF;
END $$;

