import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui';
import { BookMarked, Copy, Search, Star } from 'lucide-react';

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

    const defaultPrompts = [
      {
        user_id: user.id,
        title: 'Code Review',
        content:
          'Review the current code for:\n- Potential bugs or edge cases\n- Security vulnerabilities\n- Performance optimizations\n- Code quality and maintainability\n\nProvide specific suggestions for improvement.',
        category: 'review',
        is_favorite: true,
      },
      {
        user_id: user.id,
        title: 'Generate Tests',
        content:
          'Generate comprehensive tests for the current code:\n- Unit tests for core functions\n- Integration tests for workflows\n- Edge case scenarios\n- Error handling tests\n\nUse the project\'s testing framework.',
        category: 'testing',
        is_favorite: true,
      },
      {
        user_id: user.id,
        title: 'Refactor for Simplicity',
        content:
          'Refactor this code to be simpler and more maintainable:\n- Remove unnecessary complexity\n- Extract reusable functions\n- Improve naming\n- Add comments where logic isn\'t obvious\n\nKeep the same functionality.',
        category: 'refactor',
        is_favorite: false,
      },
      {
        user_id: user.id,
        title: 'Add Error Handling',
        content:
          'Add comprehensive error handling:\n- Try-catch blocks where needed\n- User-friendly error messages\n- Logging for debugging\n- Graceful fallbacks\n\nEnsure the app doesn\'t crash on errors.',
        category: 'improvement',
        is_favorite: false,
      },
      {
        user_id: user.id,
        title: 'Optimize Performance',
        content:
          'Analyze and optimize performance:\n- Identify bottlenecks\n- Reduce unnecessary renders/calculations\n- Implement caching where appropriate\n- Optimize database queries\n\nMeasure before and after.',
        category: 'optimization',
        is_favorite: false,
      },
    ];

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
    { value: 'review', label: 'Code Review' },
    { value: 'testing', label: 'Testing' },
    { value: 'refactor', label: 'Refactoring' },
    { value: 'improvement', label: 'Improvements' },
    { value: 'optimization', label: 'Optimization' },
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
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary-100 flex items-center gap-3">
          <BookMarked className="w-8 h-8 text-primary-400" />
          Prompt Library
        </h1>
        <p className="text-primary-400 mt-2">
          Save and reuse common prompts for code review, testing, refactoring, and more
        </p>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary-100">Your Prompts</h2>
        </div>

        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
            <Input
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
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
              className="p-4 bg-primary-800 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-primary-100 flex items-center gap-2">
                  {prompt.title}
                  {prompt.is_favorite && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFavorite(prompt.id, prompt.is_favorite)}
                    className="text-primary-400 hover:text-yellow-400 transition-colors"
                  >
                    <Star
                      className={`w-4 h-4 ${prompt.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
                    />
                  </button>
                  <button
                    onClick={() => copyPrompt(prompt.content, prompt.id)}
                    className="text-primary-400 hover:text-primary-200 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-primary-400 whitespace-pre-line">{prompt.content}</p>
              {copiedPrompt === prompt.id && (
                <p className="text-xs text-green-400 mt-2">Copied to clipboard!</p>
              )}
            </div>
          ))}
        </div>

        {filteredPrompts.length === 0 && (
          <div className="text-center py-12">
            <BookMarked className="w-12 h-12 text-primary-600 mx-auto mb-3" />
            <p className="text-primary-400 text-sm">No prompts found</p>
            <p className="text-xs text-primary-500 mt-2">Create your first prompt or try a different filter</p>
          </div>
        )}
      </Card>
    </div>
  );
}
