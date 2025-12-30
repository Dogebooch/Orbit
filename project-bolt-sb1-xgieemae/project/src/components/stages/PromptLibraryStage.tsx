import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Card, Input, Textarea, Button } from '../ui';
import { BookMarked, Copy, Search, Star, Plus, Lightbulb, X, Tag } from 'lucide-react';
import { DEFAULT_PROMPTS, PROMPT_CATEGORIES } from '../../config/promptsConfig';

interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  is_favorite: boolean;
  source?: string | null;
  is_default?: boolean;
}

export function PromptLibraryStage() {
  const { currentProject, user } = useApp();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [promptFilter, setPromptFilter] = useState<'all' | 'default' | 'custom'>('all');
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [hoveredPromptId, setHoveredPromptId] = useState<string | null>(null);
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

    // Check if user already has default prompts to avoid duplicates
    const { data: existingPrompts } = await supabase
      .from('prompts')
      .select('title, is_default')
      .eq('user_id', user.id)
      .eq('is_default', true);

    if (existingPrompts && existingPrompts.length > 0) {
      // User already has default prompts, don't seed again
      return;
    }

    // Use prompts from shared config, adding user_id, source, and is_default for database insertion
    const defaultPrompts = DEFAULT_PROMPTS.map(prompt => ({
      user_id: user.id,
      title: prompt.title,
      content: prompt.content,
      category: prompt.category,
      is_favorite: prompt.is_favorite,
      source: prompt.source || null,
      is_default: true,
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

    if (data && data.length > 0) {
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
          is_default: false,
          source: null,
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
    setEditingPrompt(null);
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

  const handleEditPrompt = (prompt: Prompt) => {
    // If editing a default prompt, we'll create a copy instead
    if (prompt.is_default) {
      setEditingPrompt(null); // Clear editing prompt to create new one
      setNewPrompt({
        title: `${prompt.title} (Copy)`,
        content: prompt.content,
        category: prompt.category,
        is_favorite: prompt.is_favorite,
        isNewCategory: false,
        newCategoryName: '',
      });
      setFormErrors({});
      setShowCreateModal(true);
    } else {
      setEditingPrompt(prompt);
      setNewPrompt({
        title: prompt.title,
        content: prompt.content,
        category: prompt.category,
        is_favorite: prompt.is_favorite,
        isNewCategory: false,
        newCategoryName: '',
      });
      setFormErrors({});
      setShowCreateModal(true);
    }
  };

  const updatePrompt = async () => {
    if (!editingPrompt) {
      // This is a copy of a default prompt, create new instead
      await createPrompt();
      return;
    }

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
      const { error } = await supabase
        .from('prompts')
        .update({
          title: newPrompt.title.trim(),
          content: newPrompt.content.trim(),
          category: finalCategory,
          is_favorite: newPrompt.is_favorite,
          // If updating a default prompt, convert it to custom
          is_default: false,
          source: null,
        })
        .eq('id', editingPrompt.id);

      if (error) {
        console.error('Error updating prompt:', error);
        setFormErrors({ title: 'Failed to update prompt. Please try again.' });
        return;
      }

      // Refresh prompts list
      await loadPrompts();
      // Auto-select the updated prompt's category
      setSelectedCategory(finalCategory);
      // Close modal and reset form
      handleCloseCreateModal();
    } catch (error) {
      console.error('Error updating prompt:', error);
      setFormErrors({ title: 'Failed to update prompt. Please try again.' });
    } finally {
      setIsCreating(false);
    }
  };

  const filteredPrompts = prompts.filter((p: Prompt) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      promptFilter === 'all' ||
      (promptFilter === 'default' && p.is_default === true) ||
      (promptFilter === 'custom' && (p.is_default === false || p.is_default === null || !p.is_default));
    return matchesCategory && matchesSearch && matchesFilter;
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

          {/* Prompt Type Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPromptFilter('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                promptFilter === 'all'
                  ? 'bg-primary-700 text-primary-100'
                  : 'bg-primary-800 text-primary-400 hover:bg-primary-700'
              }`}
            >
              All Prompts
            </button>
            <button
              onClick={() => setPromptFilter('default')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                promptFilter === 'default'
                  ? 'bg-primary-700 text-primary-100'
                  : 'bg-primary-800 text-primary-400 hover:bg-primary-700'
              }`}
            >
              Default
            </button>
            <button
              onClick={() => setPromptFilter('custom')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                promptFilter === 'custom'
                  ? 'bg-primary-700 text-primary-100'
                  : 'bg-primary-800 text-primary-400 hover:bg-primary-700'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Category Filter */}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className="relative group"
              onMouseEnter={() => setHoveredPromptId(prompt.id)}
              onMouseLeave={() => setHoveredPromptId(null)}
            >
              <div
                className={`p-3 rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                  prompt.is_default
                    ? 'bg-primary-800/80 border border-primary-600/50 hover:bg-primary-700/80'
                    : 'bg-primary-800 hover:bg-primary-700'
                }`}
                onClick={() => handleEditPrompt(prompt)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {prompt.is_favorite && (
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                  )}
                  {prompt.is_default && (
                    <Tag className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium text-primary-100 truncate">
                    {prompt.title}
                  </span>
                  {prompt.is_default && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary-700/50 text-primary-300 flex-shrink-0">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex gap-1 items-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => toggleFavorite(prompt.id, prompt.is_favorite)}
                    className="p-1 transition-colors text-primary-400 hover:text-yellow-400"
                    title={prompt.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star
                      className={`w-4 h-4 ${prompt.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
                    />
                  </button>
                  <button
                    onClick={() => copyPrompt(prompt.content, prompt.id)}
                    className="p-1 transition-colors text-primary-400 hover:text-primary-200"
                    title="Copy prompt"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Hover Tooltip */}
              {hoveredPromptId === prompt.id && (
                <div className="absolute z-50 mt-2 left-0 right-0 bg-primary-900 border border-primary-700 rounded-lg shadow-2xl p-4 max-w-md max-h-64 overflow-y-auto">
                  <div className="text-sm font-medium text-primary-100 mb-2 flex items-center gap-2">
                    {prompt.is_favorite && (
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    )}
                    {prompt.title}
                    {prompt.is_default && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary-700/50 text-primary-300 ml-1">
                        Default
                      </span>
                    )}
                  </div>
                  {prompt.source && (
                    <p className="text-xs text-primary-500 mb-2">
                      Source: {prompt.source.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-line text-primary-400">{prompt.content}</p>
                  {copiedPrompt === prompt.id && (
                    <p className="mt-2 text-xs text-green-400">Copied to clipboard!</p>
                  )}
                </div>
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

      {/* Create/Edit Prompt Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-primary-900 border border-primary-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-primary-100">
                {editingPrompt
                  ? editingPrompt.is_default
                    ? 'Create Custom Copy'
                    : 'Edit Prompt'
                  : 'Create New Prompt'}
              </h3>
              <button
                onClick={handleCloseCreateModal}
                className="p-1 rounded hover:bg-primary-800 text-primary-400 hover:text-primary-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {editingPrompt && editingPrompt.is_default && (
                <div className="p-3 rounded-lg border bg-amber-900/20 border-amber-700/50">
                  <p className="text-sm text-amber-200/80">
                    <strong className="text-amber-300">Note:</strong> You're editing a default prompt. This will create a custom copy that you can modify freely. The original default prompt will remain unchanged.
                  </p>
                </div>
              )}
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
                  onClick={editingPrompt ? updatePrompt : createPrompt}
                  loading={isCreating}
                >
                  {editingPrompt
                    ? editingPrompt.is_default
                      ? 'Create Copy'
                      : 'Update Prompt'
                    : 'Create Prompt'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
