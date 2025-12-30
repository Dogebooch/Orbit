import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Card, Input } from '../ui';
import { BookMarked, Copy, Search, Star, Plus, Lightbulb } from 'lucide-react';

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
      // PRD & Requirements Category
      {
        user_id: user.id,
        title: 'Create Functional Requirements',
        content:
          'I would like to create concise functional requirements for the following application:\n\n[DESCRIBE YOUR APP]\n\nBe sure to include:\n- App name\n- Tech stack\n- Core features\n- Database needs\n- API integrations\n- Design style\n- Things NOT to build\n- Ask it to research a comparable, existing app (if applicable)\n\nOutput as markdown code.',
        category: 'prd',
        is_favorite: true,
      },
      {
        user_id: user.id,
        title: 'Generate PRD from Requirements',
        content:
          'You are an expert technical product manager specializing in feature development and creating comprehensive product requirements documents (PRDs). Your task is to generate a detailed and well-structured PRD based on the following instructions:\n\n<prd_instructions>\n{{PRD_INSTRUCTIONS}}\n</prd_instructions>\n\nFollow these steps to create the PRD:\n\n1. Begin with a brief overview explaining the project and the purpose of the document.\n\n2. Use sentence case for all headings except for the title of the document, which should be in title case.\n\n3. Organize your PRD into the following sections:\n   a. Introduction\n   b. Product Overview\n   c. Goals and Objectives\n   d. Target Audience\n   e. Features and Requirements\n   f. User Stories and Acceptance Criteria\n   g. Technical Requirements / Stack\n   h. Design and User Interface\n\n4. For each section, provide detailed and relevant information based on the PRD instructions. Ensure that you:\n   - Use clear and concise language\n   - Provide specific details and metrics where required\n   - Maintain consistency throughout the document\n   - Address all points mentioned in each section\n\n5. When creating user stories and acceptance criteria:\n   - List ALL necessary user stories including primary, alternative, and edge-case scenarios\n   - Assign a unique requirement ID (e.g., ST-101) to each user story for direct traceability\n   - Include at least one user story specifically for secure access or authentication if the application requires user identification\n   - Include at least one user story specifically for Database modelling if the application requires a database\n   - Ensure no potential user interaction is omitted\n   - Make sure each user story is testable\n\n6. Format your PRD professionally:\n   - Use consistent styles\n   - Include numbered sections and subsections\n   - Use bullet points and tables where appropriate to improve readability\n   - Ensure proper spacing and alignment throughout the document\n\n7. Review your PRD to ensure all aspects of the project are covered comprehensively and that there are no contradictions or ambiguities.\n\nPresent your final PRD within <PRD> tags. Begin with the title of the document in title case, followed by each section with its corresponding content. Use appropriate subheadings within each section as needed.\n\nRemember to tailor the content to the specific project described in the PRD instructions, providing detailed and relevant information for each section based on the given context.',
        category: 'prd',
        is_favorite: true,
      },
      {
        user_id: user.id,
        title: 'Feature Specification Pattern',
        content:
          '## Feature Specification: [FEATURE_NAME]\n\n## User Story\nAs a [user type], I want to [action] so that [benefit].\n\n## Acceptance Criteria\n- [ ] [Specific testable requirement]\n- [ ] [Specific testable requirement]\n- [ ] [Specific testable requirement]',
        category: 'prd',
        is_favorite: true,
      },

      // TaskMaster Category
      {
        user_id: user.id,
        title: 'Parse PRD & Create Tasks',
        content:
          "I've initialized a new project with Claude Task Master. I have a PRD at scripts/prd.txt.\nCan you parse it and set up initial tasks?",
        category: 'taskmaster',
        is_favorite: true,
      },
      {
        user_id: user.id,
        title: 'Analyze Task Complexity',
        content:
          'Can you analyze the complexity of our tasks to help me understand which ones need to be broken down further?',
        category: 'taskmaster',
        is_favorite: true,
      },
      {
        user_id: user.id,
        title: 'Break Down Complex Tasks',
        content:
          'Can you help me break down all of the high complexity tasks?',
        category: 'taskmaster',
        is_favorite: false,
      },
      {
        user_id: user.id,
        title: 'Show All Tasks',
        content: 'Show tasks',
        category: 'taskmaster',
        is_favorite: false,
      },
      {
        user_id: user.id,
        title: 'Get Next Task',
        content:
          "What's the next task I should work on? Please consider dependencies and priorities.",
        category: 'taskmaster',
        is_favorite: false,
      },
      {
        user_id: user.id,
        title: 'Add New Task',
        content:
          "Let's add a new task. We should implement [FEATURE_NAME].\nHere are the requirements:\n\n- Requirement 1\n- Requirement 2\n- Requirement 3",
        category: 'taskmaster',
        is_favorite: false,
      },

      // Code Review Category
      {
        user_id: user.id,
        title: 'Code Review',
        content:
          'Review the current code for:\n- Potential bugs or edge cases\n- Security vulnerabilities\n- Performance optimizations\n- Code quality and maintainability\n\nProvide specific suggestions for improvement.',
        category: 'review',
        is_favorite: true,
      },

      // Testing Category
      {
        user_id: user.id,
        title: 'Generate Comprehensive Tests',
        content:
          "Please create comprehensive tests for the current application:\n\n- Unit tests for core business logic functions\n- Integration tests for the main user workflows\n- Error handling tests for edge cases\n- Performance tests for file processing\n\nUse [your preferred testing framework] and include both positive and negative test cases.",
        category: 'testing',
        is_favorite: true,
      },
      {
        user_id: user.id,
        title: 'User Testing Script',
        content:
          '## User Test Script\n\n### Setup\n"I\'d like you to try using this tool. I\'m testing the tool, not you, so there are no wrong answers. Please think out loud as you use it."\n\n### Task\n"Your goal is to [REALISTIC TASK]. Take your time and let me know if anything is confusing."\n\n### Observation Points\n- Do they understand what the tool does?\n- Can they complete the primary task without help?\n- Where do they hesitate or show confusion?\n- What do they say out loud while using it?',
        category: 'testing',
        is_favorite: false,
      },

      // Refactoring Category
      {
        user_id: user.id,
        title: 'Refactor for Simplicity',
        content:
          "Refactor this code to be simpler and more maintainable:\n- Remove unnecessary complexity\n- Extract reusable functions\n- Improve naming\n- Add comments where logic isn't obvious\n\nKeep the same functionality.",
        category: 'refactor',
        is_favorite: false,
      },
      {
        user_id: user.id,
        title: 'Break Down Large File',
        content:
          'Break down this file into logical modules so it\'s easier to read.\nCreate directories if needed and move utils and interfaces to separate files, maintaining a domain-driven file structure.',
        category: 'refactor',
        is_favorite: false,
      },

      // Debugging Category
      {
        user_id: user.id,
        title: 'Create Bug Fix Task',
        content:
          'The [FEATURE] is not working as expected. Create a new task to fix it:\n\n- Expected behavior: [WHAT SHOULD HAPPEN]\n- Actual behavior: [WHAT IS HAPPENING]\n- Steps to reproduce: [HOW TO TRIGGER THE BUG]\n\nRequirements for the fix:\n- [Requirement 1]\n- [Requirement 2]',
        category: 'debugging',
        is_favorite: true,
      },
      {
        user_id: user.id,
        title: 'Add Error Handling',
        content:
          "Add comprehensive error handling:\n- Try-catch blocks where needed\n- User-friendly error messages\n- Logging for debugging\n- Graceful fallbacks\n\nEnsure the app doesn't crash on errors.",
        category: 'debugging',
        is_favorite: false,
      },

      // Optimization Category
      {
        user_id: user.id,
        title: 'Optimize Performance',
        content:
          'Analyze and optimize performance:\n- Identify bottlenecks\n- Reduce unnecessary renders/calculations\n- Implement caching where appropriate\n- Optimize database queries\n\nMeasure before and after.',
        category: 'optimization',
        is_favorite: false,
      },

      // Context Category
      {
        user_id: user.id,
        title: 'Analyze User Feedback',
        content:
          "Based on user testing, here's what I observed:\n\nUser 1: [Specific behaviors and comments]\nUser 2: [Specific behaviors and comments]\n\nCommon patterns:\n- [Issue that multiple users hit]\n- [Unexpected user behavior]\n\nPlease analyze this feedback and suggest:\n1. Critical UX improvements needed\n2. Changes to improve user success rate",
        category: 'context',
        is_favorite: false,
      },
      {
        user_id: user.id,
        title: 'Challenge My Assumptions',
        content:
          "I'm building [APP DESCRIPTION]. Before I start coding, please challenge my assumptions:\n\n**Problem:** [PROBLEM STATEMENT]\n**Target User:** [USER DESCRIPTION]\n**Why Software:** [WHY THIS NEEDS TO BE BUILT]\n\nAsk me tough questions about:\n- Is this the right problem to solve?\n- Are there existing solutions I'm missing?\n- What could go wrong with this approach?\n- What am I not considering?",
        category: 'context',
        is_favorite: true,
      },

      // Implementation Category
      {
        user_id: user.id,
        title: 'Implement Feature (Simple)',
        content:
          'I need to implement [SPECIFIC FEATURE].\n\nRequirements:\n- [Requirement 1]\n- [Requirement 2]\n- [Requirement 3]\n\nPlease analyze these requirements and suggest the simplest solution that works. Avoid over-engineering.',
        category: 'implementation',
        is_favorite: false,
      },
      {
        user_id: user.id,
        title: 'Implementation Options',
        content:
          'I need to implement [SPECIFIC FEATURE]. Please analyze these requirements and suggest 3 approaches:\n\nRequirements:\n- [List specific needs]\n\nFor each approach, explain:\n1. Implementation complexity\n2. User experience impact\n3. Maintenance considerations\n4. Pros and cons\n\nI\'ll choose one and you can implement it.',
        category: 'implementation',
        is_favorite: false,
      },
      {
        user_id: user.id,
        title: 'Context-Aware Modifications Pattern',
        content:
          'Looking at the current [component/file], I need to:\n[Specific change 1]\n[Specific change 2]\n[Specific change 3]\n\nPlease modify the existing code while maintaining the current patterns and style.',
        category: 'implementation',
        is_favorite: true,
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
    { value: 'prd', label: 'PRD & Requirements' },
    { value: 'taskmaster', label: 'TaskMaster' },
    { value: 'review', label: 'Code Review' },
    { value: 'testing', label: 'Testing' },
    { value: 'refactor', label: 'Refactoring' },
    { value: 'debugging', label: 'Debugging' },
    { value: 'optimization', label: 'Optimization' },
    { value: 'context', label: 'Context' },
    { value: 'implementation', label: 'Implementation' },
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
