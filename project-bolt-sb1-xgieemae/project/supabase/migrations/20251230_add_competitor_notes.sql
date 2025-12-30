/*
  # Add competitor_notes field to user_profiles

  This migration adds a competitor_notes field to store
  research notes about competitor apps directly in the
  Foundation stage (as part of the simplified flow that
  removes the separate Research stage).
*/

-- Add competitor_notes column to user_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'competitor_notes'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN competitor_notes text DEFAULT '';
  END IF;
END $$;

