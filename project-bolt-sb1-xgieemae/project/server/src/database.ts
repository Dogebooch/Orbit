/**
 * JSON file-based storage for project state persistence
 * Simple, no compilation required
 */

import * as path from 'path';
import * as fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data', 'projects');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface ProjectState {
  project: {
    id: string;
    user_id: string;
    name: string;
    description: string;
    current_stage: string;
    copilot_instructions?: string;
    bootstrap_complete?: boolean;
    created_at: string;
    updated_at: string;
  };
  vision: any | null;
  userProfile: any | null;
  successMetrics: any | null;
  prd: any | null;
  tasks: any[];
  projectConfig: any | null;
  prdFeatures: any[];
  researchApps: any[];
  researchSynthesis: any[];
  savedAt: string;
  version: string;
}

export function saveProjectState(projectState: ProjectState): void {
  const filePath = path.join(DATA_DIR, `${projectState.project.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(projectState, null, 2), 'utf-8');
}

export function loadProjectState(projectId: string): ProjectState | null {
  const filePath = path.join(DATA_DIR, `${projectId}.json`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as ProjectState;
  } catch (error) {
    console.error(`[Database] Error loading project ${projectId}:`, error);
    return null;
  }
}

export function listProjects(): string[] {
  if (!fs.existsSync(DATA_DIR)) {
    return [];
  }

  try {
    const files = fs.readdirSync(DATA_DIR);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  } catch (error) {
    console.error('[Database] Error listing projects:', error);
    return [];
  }
}
