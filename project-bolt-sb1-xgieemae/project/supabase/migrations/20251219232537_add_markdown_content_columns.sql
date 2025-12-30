/*
  # Add Markdown Content Columns

  1. Changes
    - Add `markdown_content` column to `visions` table for storing generated markdown
    - Add `markdown_content` column to `user_profiles` table for storing generated markdown
    - Add `editor_mode` column to `settings` table for storing user's preferred editing mode
  
  2. Purpose
    - Enable dual-mode editing: structured forms and direct markdown editing
    - Store generated markdown separately from structured data
    - Track user's preferred editing mode (guided vs editor)
*/

-- Add markdown_content to visions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visions' AND column_name = 'markdown_content'
  ) THEN
    ALTER TABLE visions ADD COLUMN markdown_content text DEFAULT '';
  END IF;
END $$;

-- Add markdown_content to user_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'markdown_content'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN markdown_content text DEFAULT '';
  END IF;
END $$;