import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui';
import { FolderOpen, Plus, ChevronDown } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  current_stage: string;
  created_at: string;
  updated_at: string;
}

export function ProjectSelector() {
  const { user, currentProject, setCurrentProject } = useApp();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setProjects(data);
      if (!currentProject && data.length > 0) {
        setCurrentProject(data[0]);
      }
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProjectName.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: newProjectName.trim(),
          description: newProjectDescription.trim(),
          current_stage: 'vision',
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProjects([data, ...projects]);
        setCurrentProject(data);
        setNewProjectName('');
        setNewProjectDescription('');
        setShowNewProject(false);
      }
    } catch (err) {
      console.error('Error creating project:', err);
    } finally {
      setLoading(false);
    }
  };

  if (showNewProject) {
    return (
      <div className="p-4 border-b border-accent-800 bg-primary-900">
        <form onSubmit={createProject} className="space-y-3">
          <input
            type="text"
            placeholder="Project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="input text-sm"
            autoFocus
          />
          <textarea
            placeholder="Description (optional)"
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            className="textarea text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <Button type="submit" loading={loading} className="text-sm flex-1">
              Create
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowNewProject(false)}
              className="text-sm"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-accent-800 bg-primary-900 relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-primary-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-primary-400" />
          <div className="text-left">
            <div className="text-sm font-medium text-primary-100">
              {currentProject?.name || 'No project'}
            </div>
            {currentProject?.description && (
              <div className="text-xs text-primary-400 truncate max-w-[160px]">
                {currentProject.description}
              </div>
            )}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-primary-400" />
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 mx-4 bg-primary-800 border border-accent-700 rounded-lg shadow-soft-lg z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            <button
              onClick={() => {
                setShowNewProject(true);
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 p-2 rounded hover:bg-primary-700 text-primary-200 text-sm"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
          <div className="border-t border-accent-700">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  setCurrentProject(project);
                  setShowDropdown(false);
                }}
                className={`w-full p-3 text-left hover:bg-primary-700 transition-colors ${
                  currentProject?.id === project.id ? 'bg-primary-700' : ''
                }`}
              >
                <div className="text-sm font-medium text-primary-100">{project.name}</div>
                {project.description && (
                  <div className="text-xs text-primary-400 mt-1">{project.description}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
