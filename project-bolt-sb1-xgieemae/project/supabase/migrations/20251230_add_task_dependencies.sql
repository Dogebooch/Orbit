/*
  # Add Task Dependencies and Subtasks Support

  ## Overview
  This migration adds support for task dependencies and subtasks by adding:
  - `dependencies` array column to store IDs of blocking tasks
  - `parent_task_id` to support flat subtask structure with references

  ## Changes
  - Add `dependencies` text array column (stores task IDs as strings)
  - Add `parent_task_id` foreign key column for subtask relationships
  - Add index for efficient parent task lookups
*/

-- Add dependencies column (array of task IDs that must be completed first)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependencies text[] DEFAULT '{}';

-- Add parent_task_id column for subtask relationships
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL;

-- Create index for efficient parent task lookups
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);

-- Create index for dependency lookups
CREATE INDEX IF NOT EXISTS idx_tasks_dependencies ON tasks USING GIN(dependencies);

