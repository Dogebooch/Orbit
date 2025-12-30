import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Card, Input } from '../ui';
import { BookMarked, Copy, Search, Star, Plus, Lightbulb } from 'lucide-react';
import { DEFAULT_PROMPTS, PROMPT_CATEGORIES, type PromptCategory } from '../../config/promptsConfig';

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
  }, [currentProject]);

  const loadPrompts = async () => {
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
  };

  const seedDefaultPrompts = async () => {
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
  };

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

  const categories = [
    { value: 'all', label: 'All Prompts' },
    ...Object.entries(PROMPT_CATEGORIES).map(([value, label]) => ({ value, label })),
  ];

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
    </div>
  );
}
