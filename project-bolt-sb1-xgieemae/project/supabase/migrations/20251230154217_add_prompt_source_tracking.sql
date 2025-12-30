-- Add source and is_default columns to prompts table
ALTER TABLE prompts 
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- Backfill existing default prompts by matching title
-- This identifies prompts that were seeded from DEFAULT_PROMPTS config
UPDATE prompts
SET 
  is_default = true,
  source = CASE 
    WHEN title IN (
      'Create Functional Requirements',
      'Generate PRD from Requirements',
      'Parse PRD & Create Tasks',
      'Show All Tasks',
      'Get Next Task',
      'Add Context to Task Run',
      'Analyze Task Complexity',
      'Break Down Complex Tasks',
      'Break Down Individual Task',
      'Add New Task',
      'Implement Task',
      'Implement Subtask',
      'Update Task',
      'Remove Task',
      'Break Down Large File',
      'Create Bug Fix Task'
    ) THEN 'taskmaster-guide'
    WHEN title IN (
      'Generate PRD from Foundation Docs',
      'Opening Context Pattern',
      'Prompt Evolution Examples',
      'Options Pattern'
    ) THEN 'comprehensive-guide'
    WHEN title = 'Bolt.new Prompt Generator' THEN 'vibe-coding-guide'
    WHEN title IN (
      'Feature Specification Pattern',
      'Code Review',
      'Generate Comprehensive Tests',
      'User Testing Script',
      'Refactor for Simplicity',
      'Add Error Handling',
      'Optimize Performance',
      'Analyze User Feedback',
      'Challenge My Assumptions',
      'Implement Feature (Simple)',
      'Implementation Options',
      'Context-Aware Modifications Pattern'
    ) THEN 'built-in'
  END
WHERE title IN (
  'Create Functional Requirements',
  'Generate PRD from Requirements',
  'Generate PRD from Foundation Docs',
  'Feature Specification Pattern',
  'Parse PRD & Create Tasks',
  'Show All Tasks',
  'Get Next Task',
  'Add Context to Task Run',
  'Analyze Task Complexity',
  'Break Down Complex Tasks',
  'Break Down Individual Task',
  'Add New Task',
  'Implement Task',
  'Implement Subtask',
  'Update Task',
  'Remove Task',
  'Bolt.new Prompt Generator',
  'Code Review',
  'Generate Comprehensive Tests',
  'User Testing Script',
  'Refactor for Simplicity',
  'Break Down Large File',
  'Create Bug Fix Task',
  'Add Error Handling',
  'Optimize Performance',
  'Analyze User Feedback',
  'Challenge My Assumptions',
  'Opening Context Pattern',
  'Prompt Evolution Examples',
  'Implement Feature (Simple)',
  'Implementation Options',
  'Options Pattern',
  'Context-Aware Modifications Pattern'
)
AND (is_default IS NULL OR is_default = false);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_prompts_is_default ON prompts(is_default);
CREATE INDEX IF NOT EXISTS idx_prompts_source ON prompts(source);

