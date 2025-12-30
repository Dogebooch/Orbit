import React, { useState, useEffect } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui';
import { Plus, Upload, X, Trash2, ArrowRight } from 'lucide-react';

interface ResearchApp {
  id: string;
  name: string;
  createdAt: string;
}

interface ResearchNote {
  id: string;
  appId: string;
  content: string;
  updatedAt: string;
}

interface ResearchImage {
  id: string;
  appId: string;
  imageData: string;
  caption: string;
  orderIndex: number;
}

export function AppResearch() {
  const { currentProject, setCurrentStage } = useApp();
  const [apps, setApps] = useState<ResearchApp[]>([]);
  const [notes, setNotes] = useState<Record<string, ResearchNote>>({});
  const [images, setImages] = useState<ResearchImage[]>([]);
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [newAppName, setNewAppName] = useState('');
  const [showNewApp, setShowNewApp] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentProject) {
      loadApps();
      loadNotes();
      loadImages();
    }
  }, [currentProject]);

  const loadApps = async () => {
    if (!currentProject) return;
    const { data } = await supabase
      .from('research_apps')
      .select('*')
      .eq('project_id', currentProject.id)
      .order('order_index');

    if (data) {
      const appsList = data.map((app) => ({
        id: app.id,
        name: app.name,
        createdAt: app.created_at,
      }));
      setApps(appsList);
      if (appsList.length > 0 && !activeAppId) {
        setActiveAppId(appsList[0].id);
      }
    }
  };

  const loadNotes = async () => {
    if (!currentProject) return;
    const { data } = await supabase
      .from('research_notes')
      .select('*')
      .eq('project_id', currentProject.id);

    if (data) {
      const notesMap: Record<string, ResearchNote> = {};
      data.forEach((note) => {
        notesMap[note.app_id] = {
          id: note.id,
          appId: note.app_id,
          content: note.content || '',
          updatedAt: note.updated_at,
        };
      });
      setNotes(notesMap);
    }
  };

  const loadImages = async () => {
    if (!currentProject) return;
    const { data } = await supabase
      .from('research_images')
      .select('*')
      .eq('project_id', currentProject.id)
      .order('order_index');

    if (data) {
      setImages(
        data.map((img) => ({
          id: img.id,
          appId: img.research_field,
          imageData: img.image_data,
          caption: img.caption || '',
          orderIndex: img.order_index,
        }))
      );
    }
  };

  const createApp = async () => {
    if (!currentProject || !newAppName.trim()) return;

    const { data } = await supabase
      .from('research_apps')
      .insert({
        project_id: currentProject.id,
        name: newAppName,
        order_index: apps.length,
      })
      .select()
      .single();

    if (data) {
      const newApp = {
        id: data.id,
        name: data.name,
        createdAt: data.created_at,
      };
      setApps((prev) => [...prev, newApp]);
      setActiveAppId(data.id);
      setNewAppName('');
      setShowNewApp(false);
    }
  };

  const saveNote = async (appId: string, content: string) => {
    if (!currentProject) return;

    setSaving(true);
    try {
      const existing = notes[appId];

      if (existing) {
        await supabase
          .from('research_notes')
          .update({
            content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        const { data } = await supabase
          .from('research_notes')
          .insert({
            project_id: currentProject.id,
            app_id: appId,
            content,
          })
          .select()
          .single();

        if (data) {
          setNotes((prev) => ({
            ...prev,
            [appId]: {
              id: data.id,
              appId: data.app_id,
              content: data.content || '',
              updatedAt: data.updated_at,
            },
          }));
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteApp = async (appId: string) => {
    await supabase.from('research_apps').delete().eq('id', appId);
    setApps((prev) => prev.filter((app) => app.id !== appId));
    setNotes((prev) => {
      const newNotes = { ...prev };
      delete newNotes[appId];
      return newNotes;
    });
    if (activeAppId === appId) {
      setActiveAppId(apps[0]?.id || null);
    }
  };

  const handleImageUpload = async (appId: string, imageData: string, caption: string) => {
    if (!currentProject) return;

    const orderIndex = images.filter((img) => img.appId === appId).length;

    const { data } = await supabase
      .from('research_images')
      .insert({
        project_id: currentProject.id,
        research_field: appId,
        image_data: imageData,
        caption,
        order_index: orderIndex,
      })
      .select()
      .single();

    if (data) {
      setImages((prev) => [
        ...prev,
        {
          id: data.id,
          appId: data.research_field,
          imageData: data.image_data,
          caption: data.caption || '',
          orderIndex: data.order_index,
        },
      ]);
    }
  };

  const removeImage = async (imageId: string) => {
    await supabase.from('research_images').delete().eq('id', imageId);
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleContinue = async () => {
    if (activeAppId && notes[activeAppId]) {
      await saveNote(activeAppId, notes[activeAppId].content);
    }
    await supabase
      .from('projects')
      .update({ current_stage: 'workbench' })
      .eq('id', currentProject?.id);
    setCurrentStage('workbench');
  };

  const activeNote = activeAppId ? notes[activeAppId] : null;
  const appImages = activeAppId ? images.filter((img) => img.appId === activeAppId) : [];

  return (
    <div className="max-w-7xl mx-auto h-screen flex flex-col">
      <div className="pt-8 pb-6 border-b border-slate-700">
        <h1 className="text-3xl font-bold text-primary-100">Research</h1>
        <p className="text-primary-400 mt-1">Test out different apps and document your findings</p>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        <div className="w-56 border-r border-slate-700 py-4 px-3 overflow-y-auto">
          <button
            onClick={() => setShowNewApp(!showNewApp)}
            className="w-full mb-4 flex items-center justify-center gap-2 px-3 py-2 bg-primary-700 hover:bg-primary-600 text-primary-100 rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New App
          </button>

          {showNewApp && (
            <div className="mb-4 p-3 bg-primary-800/50 border border-primary-700 rounded-lg">
              <input
                type="text"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createApp()}
                placeholder="App name..."
                className="w-full px-2 py-1 bg-primary-900 border border-primary-700 rounded text-sm text-primary-100 placeholder-primary-500 mb-2"
                autoFocus
              />
              <button
                onClick={createApp}
                className="text-xs px-2 py-1 bg-primary-600 hover:bg-primary-500 text-primary-100 rounded"
              >
                Create
              </button>
            </div>
          )}

          <div className="space-y-2">
            {apps.map((app) => (
              <div key={app.id} className="group">
                <button
                  onClick={() => setActiveAppId(app.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                    activeAppId === app.id
                      ? 'bg-primary-700 text-primary-100'
                      : 'text-primary-300 hover:bg-primary-800/50'
                  }`}
                >
                  {app.name}
                </button>
                {activeAppId === app.id && (
                  <button
                    onClick={() => deleteApp(app.id)}
                    className="text-xs text-red-400 hover:text-red-300 pl-3 mt-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {activeAppId ? (
          <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
            <div className="flex-1 flex gap-6 overflow-hidden">
              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-sm font-medium text-primary-300 mb-2">Notes</label>
                <textarea
                  value={activeNote?.content || ''}
                  onChange={(e) => {
                    setNotes((prev) => ({
                      ...prev,
                      [activeAppId]: {
                        id: activeNote?.id || '',
                        appId: activeAppId,
                        content: e.target.value,
                        updatedAt: activeNote?.updatedAt || '',
                      },
                    }));
                  }}
                  placeholder="Document your thoughts, observations, and insights..."
                  className="flex-1 p-4 bg-primary-900 border border-primary-700 rounded-lg text-primary-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 overflow-auto"
                  spellCheck={false}
                />
              </div>

              {appImages.length > 0 && (
                <div className="w-48 flex flex-col gap-2 overflow-y-auto">
                  <label className="text-sm font-medium text-primary-300">Images</label>
                  <div className="space-y-2">
                    {appImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.imageData}
                          alt={image.caption}
                          className="w-full h-32 object-cover rounded-lg border border-primary-700"
                        />
                        {image.caption && (
                          <p className="text-xs text-primary-400 mt-1 truncate">{image.caption}</p>
                        )}
                        <button
                          onClick={() => removeImage(image.id)}
                          className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <label className="flex items-center gap-2 px-3 py-2 bg-primary-700 hover:bg-primary-600 text-primary-100 rounded-lg transition-colors text-sm cursor-pointer">
                <Upload className="w-4 h-4" />
                Add Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 5 * 1024 * 1024) {
                      const reader = new FileReader();
                      reader.onload = async () => {
                        const caption = prompt('Image caption (optional):') || '';
                        await handleImageUpload(
                          activeAppId,
                          reader.result as string,
                          caption
                        );
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => saveNote(activeAppId, activeNote?.content || '')}
                disabled={saving}
                className="px-3 py-2 bg-primary-700 hover:bg-primary-600 disabled:opacity-50 text-primary-100 rounded-lg transition-colors text-sm"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleContinue}
                className="ml-auto px-3 py-2 bg-slate-700 hover:bg-slate-600 text-primary-100 rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-primary-400">
            Create an app to get started
          </div>
        )}
      </div>
    </div>
  );
}
