/*
  # Add Markdown Content Column to Success Metrics Table

  1. Changes
    - Add `markdown_content` column to `success_metrics` table for storing generated markdown
  
  2. Purpose
    - Enable persistence of success metrics markdown content in Foundation stage
    - Store markdown alongside structured data for dual-mode editing
    - Consistent with markdown_content columns in visions and user_profiles tables
*/

-- Add markdown_content column to success_metrics table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'success_metrics' AND column_name = 'markdown_content'
  ) THEN
    ALTER TABLE success_metrics ADD COLUMN markdown_content text DEFAULT '';
  END IF;
END $$;

