import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Card, Input, Textarea, Button } from '../ui';
import { BookMarked, Copy, Search, Star, Plus, Lightbulb, X } from 'lucide-react';
import { DEFAULT_PROMPTS, PROMPT_CATEGORIES } from '../../config/promptsConfig';

interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  is_favorite: boolean;
}

export function PromptLibraryStage() {
  const { currentProject, user } = useApp();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPrompt, setNewPrompt] = useState({
    title: '',
    content: '',
    category: '',
    is_favorite: false,
    isNewCategory: false,
    newCategoryName: '',
  });
  const [formErrors, setFormErrors] = useState<{ title?: string; content?: string; category?: string }>({});

  const seedDefaultPrompts = useCallback(async () => {
    if (!user) return;

    // Use prompts from shared config, adding user_id for database insertion
    const defaultPrompts = DEFAULT_PROMPTS.map(prompt => ({
      user_id: user.id,
      title: prompt.title,
      content: prompt.content,
      category: prompt.category,
      is_favorite: prompt.is_favorite,
    }));

    const { data } = await supabase.from('prompts').insert(defaultPrompts).select();

    if (data) {
      setPrompts(data);
    }
  }, [user]);

  const loadPrompts = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setPrompts(data);
    } else {
      await seedDefaultPrompts();
    }
  }, [user, seedDefaultPrompts]);

  useEffect(() => {
    if (currentProject) {
      loadPrompts();
      // Check for filter from sessionStorage (set by other stages when linking here)
      const filter = sessionStorage.getItem('promptLibraryFilter');
      if (filter) {
        setSelectedCategory(filter);
        sessionStorage.removeItem('promptLibraryFilter'); // Clear after use
      }
      // Check for search query from sessionStorage
      const search = sessionStorage.getItem('promptLibrarySearch');
      if (search) {
        setSearchQuery(search);
        sessionStorage.removeItem('promptLibrarySearch'); // Clear after use
      }
    }
  }, [currentProject, loadPrompts]);

  const copyPrompt = async (content: string, promptId: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedPrompt(promptId);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  const toggleFavorite = async (promptId: string, isFavorite: boolean) => {
    await supabase.from('prompts').update({ is_favorite: !isFavorite }).eq('id', promptId);

    setPrompts(
      prompts.map((p: Prompt) => (p.id === promptId ? { ...p, is_favorite: !isFavorite } : p))
    );
  };

  // Get unique categories from prompts in database
  const customCategories = useMemo(() => {
    const categorySet = new Set<string>();
    prompts.forEach((p) => {
      if (p.category && !Object.keys(PROMPT_CATEGORIES).includes(p.category)) {
        categorySet.add(p.category);
      }
    });
    return Array.from(categorySet).map((cat) => ({ value: cat, label: cat }));
  }, [prompts]);

  // Build dynamic category list
  const categories = useMemo(() => {
    const baseCategories = [
      { value: 'all', label: 'All Prompts' },
      ...Object.entries(PROMPT_CATEGORIES).map(([value, label]) => ({ value, label })),
    ];
    // Add custom categories that aren't in the predefined list
    return [...baseCategories, ...customCategories];
  }, [customCategories]);

  const createPrompt = async () => {
    // Reset errors
    setFormErrors({});

    // Validation
    if (!newPrompt.title.trim()) {
      setFormErrors({ title: 'Title is required' });
      return;
    }
    if (!newPrompt.content.trim()) {
      setFormErrors({ content: 'Content is required' });
      return;
    }
    const finalCategory = newPrompt.isNewCategory
      ? newPrompt.newCategoryName.trim()
      : newPrompt.category;
    if (!finalCategory) {
      setFormErrors({ category: 'Category is required' });
      return;
    }

    setIsCreating(true);
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('prompts')
        .insert({
          user_id: user.id,
          title: newPrompt.title.trim(),
          content: newPrompt.content.trim(),
          category: finalCategory,
          is_favorite: newPrompt.is_favorite,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating prompt:', error);
        setFormErrors({ title: 'Failed to create prompt. Please try again.' });
        return;
      }

      if (data) {
        // Refresh prompts list
        await loadPrompts();
        // Auto-select the new prompt's category
        setSelectedCategory(finalCategory);
        // Close modal and reset form
        setShowCreateModal(false);
        setNewPrompt({
          title: '',
          content: '',
          category: '',
          is_favorite: false,
          isNewCategory: false,
          newCategoryName: '',
        });
        setFormErrors({});
      }
    } catch (error) {
      console.error('Error creating prompt:', error);
      setFormErrors({ title: 'Failed to create prompt. Please try again.' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    setNewPrompt({
      title: '',
      content: '',
      category: '',
      is_favorite: false,
      isNewCategory: false,
      newCategoryName: '',
    });
    setFormErrors({});
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setNewPrompt({
      title: '',
      content: '',
      category: '',
      is_favorite: false,
      isNewCategory: false,
      newCategoryName: '',
    });
    setFormErrors({});
  };

  const filteredPrompts = prompts.filter((p: Prompt) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="flex gap-3 items-center text-3xl font-bold text-primary-100">
          <BookMarked className="w-8 h-8 text-primary-400" />
          Prompt Library
        </h1>
        <p className="mt-2 text-primary-400">
          Field-tested prompts from the Vibe Coding and TaskMaster guides. Click to copy and paste into Claude Code, Copilot, or any AI assistant.
        </p>
      </div>

      <div className="p-4 mb-6 rounded-lg border bg-amber-900/20 border-amber-700/50">
        <div className="flex gap-3 items-start">
          <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-200/80">
            <strong className="text-amber-300">Pro Tip:</strong> Start with PRD prompts in the Strategy stage, then use TaskMaster prompts in the Workbench. The [BRACKETS] indicate where you should fill in your specific details.
          </div>
        </div>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary-100">Your Prompts</h2>
          <Button onClick={handleOpenCreateModal} variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Create Prompt
          </Button>
        </div>

        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 w-5 h-5 transform -translate-y-1/2 text-primary-400" />
            <Input
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-primary-700 text-primary-100'
                    : 'bg-primary-800 text-primary-400 hover:bg-primary-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className="p-4 rounded-lg transition-colors bg-primary-800 hover:bg-primary-700"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="flex gap-2 items-center font-medium text-primary-100">
                  {prompt.title}
                  {prompt.is_favorite && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFavorite(prompt.id, prompt.is_favorite)}
                    className="transition-colors text-primary-400 hover:text-yellow-400"
                  >
                    <Star
                      className={`w-4 h-4 ${prompt.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
                    />
                  </button>
                  <button
                    onClick={() => copyPrompt(prompt.content, prompt.id)}
                    className="transition-colors text-primary-400 hover:text-primary-200"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm whitespace-pre-line text-primary-400">{prompt.content}</p>
              {copiedPrompt === prompt.id && (
                <p className="mt-2 text-xs text-green-400">Copied to clipboard!</p>
              )}
            </div>
          ))}
        </div>

        {filteredPrompts.length === 0 && (
          <div className="py-12 text-center">
            <BookMarked className="mx-auto mb-3 w-12 h-12 text-primary-600" />
            <p className="text-sm text-primary-400">No prompts found</p>
            <p className="mt-2 text-xs text-primary-500">Create your first prompt or try a different filter</p>
          </div>
        )}
      </Card>

      {/* Create Prompt Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-primary-900 border border-primary-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-primary-100">Create New Prompt</h3>
              <button
                onClick={handleCloseCreateModal}
                className="p-1 rounded hover:bg-primary-800 text-primary-400 hover:text-primary-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-primary-200 mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <Input
                  value={newPrompt.title}
                  onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
                  placeholder="Enter prompt title..."
                  error={formErrors.title}
                  className="w-full"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-primary-200 mb-2">
                  Content <span className="text-red-400">*</span>
                </label>
                <Textarea
                  value={newPrompt.content}
                  onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                  placeholder="Enter prompt content..."
                  rows={8}
                  error={formErrors.content}
                  className="w-full"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-primary-200 mb-2">
                  Category <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      id="existing-category"
                      name="category-type"
                      checked={!newPrompt.isNewCategory}
                      onChange={() => setNewPrompt({ ...newPrompt, isNewCategory: false, newCategoryName: '' })}
                      className="w-4 h-4 text-primary-600"
                    />
                    <label htmlFor="existing-category" className="text-sm text-primary-300">
                      Use existing category
                    </label>
                  </div>
                  {!newPrompt.isNewCategory && (
                    <select
                      value={newPrompt.category}
                      onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                      className="w-full px-3 py-2 bg-primary-800 border border-primary-700 rounded text-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-600"
                    >
                      <option value="">Select a category...</option>
                      {Object.entries(PROMPT_CATEGORIES).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                      {customCategories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="radio"
                      id="new-category"
                      name="category-type"
                      checked={newPrompt.isNewCategory}
                      onChange={() => setNewPrompt({ ...newPrompt, isNewCategory: true, category: '' })}
                      className="w-4 h-4 text-primary-600"
                    />
                    <label htmlFor="new-category" className="text-sm text-primary-300">
                      Create new category
                    </label>
                  </div>
                  {newPrompt.isNewCategory && (
                    <Input
                      value={newPrompt.newCategoryName}
                      onChange={(e) => setNewPrompt({ ...newPrompt, newCategoryName: e.target.value })}
                      placeholder="Enter new category name..."
                      error={formErrors.category}
                      className="w-full"
                    />
                  )}
                </div>
              </div>

              {/* Favorite Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is-favorite"
                  checked={newPrompt.is_favorite}
                  onChange={(e) => setNewPrompt({ ...newPrompt, is_favorite: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="is-favorite" className="text-sm text-primary-300">
                  Mark as favorite
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-primary-700">
                <Button
                  variant="ghost"
                  onClick={handleCloseCreateModal}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={createPrompt}
                  loading={isCreating}
                >
                  Create Prompt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
