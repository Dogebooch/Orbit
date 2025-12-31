import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { supabase } from '../../../lib/supabase';
import { Button, Card, Input, Textarea } from '../../ui';
import { Plus, Trash2, X, Upload, Image as ImageIcon, Loader2, Save } from 'lucide-react';

interface ResearchApp {
  id: string;
  name: string;
  what_does_well: string;
  what_does_poorly: string;
  key_insight: string;
  order_index: number;
}

interface ResearchImage {
  id: string;
  app_id: string | null;
  image_data: string;
  caption: string;
  order_index: number;
}

interface SynthesisNotes {
  patterns_to_borrow: string;
  patterns_to_avoid: string;
  opportunity_gap: string;
}

interface ResearchTabProps {
  onSave?: () => void;
  saving?: boolean;
  lastSaved?: Date;
}

export function ResearchTab({ onSave, saving, lastSaved }: ResearchTabProps) {
  const { currentProject } = useApp();
  const [apps, setApps] = useState<ResearchApp[]>([]);
  const [images, setImages] = useState<ResearchImage[]>([]);
  const [synthesis, setSynthesis] = useState<SynthesisNotes>({
    patterns_to_borrow: '',
    patterns_to_avoid: '',
    opportunity_gap: '',
  });
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [savingResearch, setSavingResearch] = useState(false);
  const [lastSavedResearch, setLastSavedResearch] = useState<Date | undefined>();
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (currentProject) {
      loadResearchData();
    }
  }, [currentProject]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  const loadResearchData = async () => {
    if (!currentProject) return;

    // Load apps
    const { data: appsData } = await supabase
      .from('research_apps')
      .select('*')
      .eq('project_id', currentProject.id)
      .order('order_index', { ascending: true });

    if (appsData) {
      // Map to ResearchApp interface, handling missing fields
      const mappedApps: ResearchApp[] = appsData.map((app: any) => ({
        id: app.id,
        name: app.name || '',
        what_does_well: app.what_does_well || '',
        what_does_poorly: app.what_does_poorly || '',
        key_insight: app.key_insight || '',
        order_index: app.order_index || 0,
      }));
      setApps(mappedApps);
      if (mappedApps.length > 0 && !expandedApp) {
        setExpandedApp(mappedApps[0].id);
      }
    }

    // Load images
    const { data: imagesData } = await supabase
      .from('research_images')
      .select('*')
      .eq('project_id', currentProject.id)
      .order('order_index', { ascending: true });

    if (imagesData) {
      setImages(imagesData);
    }

    // Load synthesis notes
    const { data: notesData } = await supabase
      .from('research_notes')
      .select('*')
      .eq('project_id', currentProject.id)
      .is('app_id', null);

    if (notesData) {
      const synthesisData: SynthesisNotes = {
        patterns_to_borrow: '',
        patterns_to_avoid: '',
        opportunity_gap: '',
      };

      notesData.forEach((note) => {
        if (note.section === 'patterns_to_borrow') {
          synthesisData.patterns_to_borrow = note.content || '';
        } else if (note.section === 'patterns_to_avoid') {
          synthesisData.patterns_to_avoid = note.content || '';
        } else if (note.section === 'opportunity_gap') {
          synthesisData.opportunity_gap = note.content || '';
        }
      });

      setSynthesis(synthesisData);
    }
  };

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    const timeout = setTimeout(() => {
      saveResearchData(true);
    }, 2000);
    setAutoSaveTimeout(timeout);
  }, [autoSaveTimeout]);

  const saveResearchData = async (silent = false) => {
    if (!currentProject) return;

    if (!silent) setSavingResearch(true);
    try {
      // Save apps
      for (const app of apps) {
        // Skip temp apps that haven't been filled in
        if (app.id.startsWith('temp-') && !app.name.trim()) {
          continue;
        }

        const appData: any = {
          name: app.name,
          order_index: app.order_index,
          updated_at: new Date().toISOString(),
        };

        // Only include new fields if they exist (for backward compatibility)
        if (app.what_does_well !== undefined) appData.what_does_well = app.what_does_well;
        if (app.what_does_poorly !== undefined) appData.what_does_poorly = app.what_does_poorly;
        if (app.key_insight !== undefined) appData.key_insight = app.key_insight;

        if (app.id.startsWith('temp-')) {
          // Insert new app
          const { data: newApp } = await supabase
            .from('research_apps')
            .insert({
              project_id: currentProject.id,
              ...appData,
            })
            .select()
            .single();

          if (newApp) {
            // Update the app ID in state
            setApps(apps.map((a) => (a.id === app.id ? { ...a, id: newApp.id } : a)));
          }
        } else {
          // Update existing app
          await supabase
            .from('research_apps')
            .update(appData)
            .eq('id', app.id);
        }
      }

      // Save synthesis notes
      const sections = [
        { section: 'patterns_to_borrow', content: synthesis.patterns_to_borrow },
        { section: 'patterns_to_avoid', content: synthesis.patterns_to_avoid },
        { section: 'opportunity_gap', content: synthesis.opportunity_gap },
      ];

      for (const { section, content } of sections) {
        const { data: existing } = await supabase
          .from('research_notes')
          .select('id')
          .eq('project_id', currentProject.id)
          .eq('section', section)
          .is('app_id', null)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('research_notes')
            .update({
              content,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        } else {
          await supabase.from('research_notes').insert({
            project_id: currentProject.id,
            section,
            content,
            app_id: null,
            order_index: 0,
          });
        }
      }

      if (!silent) {
        setLastSavedResearch(new Date());
        onSave?.();
      }
    } catch (err) {
      console.error('Error saving research data:', err);
    } finally {
      if (!silent) setSavingResearch(false);
    }
  };

  const handleAddApp = () => {
    if (!currentProject) return;
    const newApp: ResearchApp = {
      id: `temp-${Date.now()}`,
      name: '',
      what_does_well: '',
      what_does_poorly: '',
      key_insight: '',
      order_index: apps.length,
    };
    setApps([...apps, newApp]);
    setEditingApp(newApp.id);
    setExpandedApp(newApp.id);
  };

  const handleDeleteApp = async (appId: string) => {
    if (!currentProject) return;

    // Delete from database if it exists
    const app = apps.find((a) => a.id === appId);
    if (app && !appId.startsWith('temp-')) {
      await supabase.from('research_apps').delete().eq('id', appId);
      // Delete associated images
      await supabase.from('research_images').delete().eq('app_id', appId);
    }

    setApps(apps.filter((a) => a.id !== appId));
    setImages(images.filter((img) => img.app_id !== appId));
    if (expandedApp === appId) {
      setExpandedApp(null);
    }
  };

  const handleAppChange = (appId: string, field: keyof ResearchApp, value: string | number) => {
    setApps(
      apps.map((app) => (app.id === appId ? { ...app, [field]: value } : app))
    );
    triggerAutoSave();
  };

  const handleSynthesisChange = (field: keyof SynthesisNotes, value: string) => {
    setSynthesis({ ...synthesis, [field]: value });
    triggerAutoSave();
  };

  const handleImageUpload = async (appId: string, file: File) => {
    if (!currentProject) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      const imageData = base64Data.split(',')[1] || base64Data; // Remove data:image/... prefix if present

      const { data: existingImages } = await supabase
        .from('research_images')
        .select('*')
        .eq('app_id', appId);

      const orderIndex = existingImages ? existingImages.length : 0;

      const imageDataToInsert: any = {
        project_id: currentProject.id,
        image_data: imageData,
        caption: '',
        order_index: orderIndex,
        research_field: 'app_screenshot',
      };

      // Only add app_id if it's not a temp ID
      if (!appId.startsWith('temp-')) {
        imageDataToInsert.app_id = appId;
      }

      const { data: newImage } = await supabase
        .from('research_images')
        .insert(imageDataToInsert)
        .select()
        .single();

      if (newImage) {
        setImages([...images, newImage]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteImage = async (imageId: string) => {
    await supabase.from('research_images').delete().eq('id', imageId);
    setImages(images.filter((img) => img.id !== imageId));
  };

  const handleImageCaptionChange = async (imageId: string, caption: string) => {
    await supabase
      .from('research_images')
      .update({ caption })
      .eq('id', imageId);

    setImages(images.map((img) => (img.id === imageId ? { ...img, caption } : img)));
  };

  const getImageUrl = (imageData: string): string => {
    if (imageData.startsWith('data:')) {
      return imageData;
    }
    return `data:image/png;base64,${imageData}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary-100">Competitive Research</h2>
          <p className="text-primary-400 mt-1 text-sm">
            Document apps you've tried, what you liked, what you didn't, and key insights.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savingResearch ? (
            <div className="flex items-center gap-2 text-sm text-primary-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            <>
              {lastSavedResearch && (
                <span className="text-xs text-primary-500">
                  Saved: {lastSavedResearch.toLocaleTimeString()}
                </span>
              )}
              <Button variant="secondary" size="sm" onClick={() => saveResearchData()}>
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Apps Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary-100">Research Apps</h3>
          <Button variant="primary" size="sm" onClick={handleAddApp}>
            <Plus className="w-4 h-4 mr-2" />
            Add App
          </Button>
        </div>

        <div className="space-y-4">
          {apps.length === 0 ? (
            <div className="text-center py-8 text-primary-400">
              <p>No apps added yet. Click "Add App" to start documenting your research.</p>
            </div>
          ) : (
            apps.map((app) => (
              <div
                key={app.id}
                className="border border-primary-700 rounded-lg p-4 bg-primary-800/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <Input
                    value={app.name}
                    onChange={(e) => handleAppChange(app.id, 'name', e.target.value)}
                    placeholder="App name (e.g., Notion, Anki, Remnote)"
                    className="flex-1 mr-2"
                    onFocus={() => setEditingApp(app.id)}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                    >
                      {expandedApp === app.id ? 'Collapse' : 'Expand'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteApp(app.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {expandedApp === app.id && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        What it does well
                      </label>
                      <Textarea
                        value={app.what_does_well}
                        onChange={(e) => handleAppChange(app.id, 'what_does_well', e.target.value)}
                        placeholder="- [Specific strength with detail]&#10;- [UI pattern worth borrowing]"
                        rows={3}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        What it does poorly
                      </label>
                      <Textarea
                        value={app.what_does_poorly}
                        onChange={(e) => handleAppChange(app.id, 'what_does_poorly', e.target.value)}
                        placeholder="- [Specific weakness]&#10;- [Friction point or confusion]"
                        rows={3}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Key insight
                      </label>
                      <Textarea
                        value={app.key_insight}
                        onChange={(e) => handleAppChange(app.id, 'key_insight', e.target.value)}
                        placeholder="One sentence summary of what to learn from this app"
                        rows={2}
                        className="w-full"
                      />
                    </div>

                    {/* Image Upload Section */}
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Screenshots
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        ref={(el) => (fileInputRefs.current[app.id] = el)}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(app.id, file);
                          }
                        }}
                        className="hidden"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRefs.current[app.id]?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Screenshot
                      </Button>

                      {/* Display Images */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        {images
                          .filter((img) => img.app_id === app.id)
                          .map((img) => (
                            <div key={img.id} className="relative group">
                              <img
                                src={getImageUrl(img.image_data)}
                                alt={img.caption || 'Screenshot'}
                                className="w-full h-32 object-cover rounded border border-primary-700"
                              />
                              <button
                                onClick={() => handleDeleteImage(img.id)}
                                className="absolute top-2 right-2 p-1 bg-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4 text-white" />
                              </button>
                              <Input
                                value={img.caption}
                                onChange={(e) => handleImageCaptionChange(img.id, e.target.value)}
                                placeholder="Caption..."
                                className="mt-2 text-xs"
                                size="sm"
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Synthesis Section */}
      <Card>
        <h3 className="text-lg font-semibold text-primary-100 mb-4">Synthesis</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-200 mb-2">
              Patterns to Borrow
            </label>
            <Textarea
              value={synthesis.patterns_to_borrow}
              onChange={(e) => handleSynthesisChange('patterns_to_borrow', e.target.value)}
              placeholder="- [Specific pattern] from [Tool] because [reason]&#10;- [Specific pattern] from [Tool] because [reason]"
              rows={4}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-200 mb-2">
              Patterns to Avoid
            </label>
            <Textarea
              value={synthesis.patterns_to_avoid}
              onChange={(e) => handleSynthesisChange('patterns_to_avoid', e.target.value)}
              placeholder="- [Anti-pattern] seen in [Tool] because [reason]&#10;- [Anti-pattern] seen in [Tool] because [reason]"
              rows={4}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-200 mb-2">
              Opportunity Gap
            </label>
            <Textarea
              value={synthesis.opportunity_gap}
              onChange={(e) => handleSynthesisChange('opportunity_gap', e.target.value)}
              placeholder="What none of these tools do well that you could solve"
              rows={3}
              className="w-full"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

