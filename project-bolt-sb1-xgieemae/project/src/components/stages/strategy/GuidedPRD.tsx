import React, { useState } from 'react';
import { Button, Input, Textarea } from '../../ui';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Lightbulb, CheckCircle2 } from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  userStory: string;
  priority: 'must_have' | 'should_have' | 'nice_to_have';
  acceptanceCriteria: string[];
}

interface TechStack {
  frontend: string;
  backend: string;
  database: string;
  deployment: string;
  additionalTools: string;
}

interface GuidedPRDProps {
  projectName: string;
  visionProblem: string;
  visionTargetUser: string;
  userGoal: string;
  successMetrics: string;
  onGeneratePRD: (prd: string) => void;
}

const TECH_OPTIONS = {
  frontend: [
    { value: 'react-vite', label: 'React + Vite', description: 'Fast, modern React setup with Vite bundler' },
    { value: 'nextjs', label: 'Next.js', description: 'Full-stack React with SSR and API routes' },
    { value: 'vue', label: 'Vue 3', description: 'Progressive JavaScript framework' },
    { value: 'vanilla', label: 'Vanilla JS', description: 'Plain JavaScript, no framework' },
  ],
  backend: [
    { value: 'none', label: 'None (Client-only)', description: 'Frontend-only app, no backend needed' },
    { value: 'supabase', label: 'Supabase', description: 'Backend-as-a-service with Postgres' },
    { value: 'nodejs', label: 'Node.js + Express', description: 'Traditional Node.js server' },
    { value: 'edge', label: 'Edge Functions', description: 'Serverless functions at the edge' },
  ],
  database: [
    { value: 'none', label: 'None', description: 'No database needed for this project' },
    { value: 'supabase-postgres', label: 'Supabase (Postgres)', description: 'Hosted PostgreSQL with realtime' },
    { value: 'sqlite', label: 'SQLite', description: 'Local file-based database' },
    { value: 'firebase', label: 'Firebase', description: 'NoSQL document database' },
  ],
  deployment: [
    { value: 'vercel', label: 'Vercel', description: 'Best for Next.js and React apps' },
    { value: 'netlify', label: 'Netlify', description: 'Great for static sites and serverless' },
    { value: 'railway', label: 'Railway', description: 'Good for full-stack apps with databases' },
    { value: 'local', label: 'Local only', description: 'Development only, no deployment' },
  ],
};

export function GuidedPRD({
  projectName,
  visionProblem,
  visionTargetUser,
  userGoal,
  successMetrics,
  onGeneratePRD,
}: GuidedPRDProps) {
  const [features, setFeatures] = useState<Feature[]>([
    { id: '1', name: '', userStory: '', priority: 'must_have', acceptanceCriteria: [''] },
  ]);
  const [techStack, setTechStack] = useState<TechStack>({
    frontend: 'react-vite',
    backend: 'supabase',
    database: 'supabase-postgres',
    deployment: 'vercel',
    additionalTools: '',
  });
  const [outOfScope, setOutOfScope] = useState('');
  const [expandedFeature, setExpandedFeature] = useState<string | null>('1');

  const addFeature = () => {
    const newFeature: Feature = {
      id: Date.now().toString(),
      name: '',
      userStory: '',
      priority: 'should_have',
      acceptanceCriteria: [''],
    };
    setFeatures([...features, newFeature]);
    setExpandedFeature(newFeature.id);
  };

  const removeFeature = (id: string) => {
    setFeatures(features.filter(f => f.id !== id));
  };

  const updateFeature = (id: string, updates: Partial<Feature>) => {
    setFeatures(features.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const addAcceptanceCriteria = (featureId: string) => {
    setFeatures(features.map(f => {
      if (f.id === featureId) {
        return { ...f, acceptanceCriteria: [...f.acceptanceCriteria, ''] };
      }
      return f;
    }));
  };

  const updateAcceptanceCriteria = (featureId: string, index: number, value: string) => {
    setFeatures(features.map(f => {
      if (f.id === featureId) {
        const newCriteria = [...f.acceptanceCriteria];
        newCriteria[index] = value;
        return { ...f, acceptanceCriteria: newCriteria };
      }
      return f;
    }));
  };

  const removeAcceptanceCriteria = (featureId: string, index: number) => {
    setFeatures(features.map(f => {
      if (f.id === featureId && f.acceptanceCriteria.length > 1) {
        return { ...f, acceptanceCriteria: f.acceptanceCriteria.filter((_, i) => i !== index) };
      }
      return f;
    }));
  };

  const generatePRD = () => {
    const mustHave = features.filter(f => f.priority === 'must_have' && f.name);
    const shouldHave = features.filter(f => f.priority === 'should_have' && f.name);
    const niceToHave = features.filter(f => f.priority === 'nice_to_have' && f.name);

    const formatFeature = (f: Feature, index: number) => {
      const lines = [`### ${index + 1}. ${f.name}`];
      if (f.userStory) {
        lines.push('', `**User Story:** ${f.userStory}`);
      }
      if (f.acceptanceCriteria.filter(c => c).length > 0) {
        lines.push('', '**Acceptance Criteria:**');
        f.acceptanceCriteria.filter(c => c).forEach(c => {
          lines.push(`- [ ] ${c}`);
        });
      }
      return lines.join('\n');
    };

    const getTechLabel = (category: keyof typeof TECH_OPTIONS, value: string) => {
      return TECH_OPTIONS[category].find(o => o.value === value)?.label || value;
    };

    const prd = `# Product Requirements Document: ${projectName}

## Project Overview

### Problem Statement
${visionProblem || '_Define in Foundation tab_'}

### Target User
${visionTargetUser || '_Define in Foundation tab_'}

### User Goal
${userGoal || '_Define in Foundation tab_'}

## Technical Stack

- **Frontend:** ${getTechLabel('frontend', techStack.frontend)}
- **Backend:** ${getTechLabel('backend', techStack.backend)}
- **Database:** ${getTechLabel('database', techStack.database)}
- **Deployment:** ${getTechLabel('deployment', techStack.deployment)}
${techStack.additionalTools ? `- **Additional Tools:** ${techStack.additionalTools}` : ''}

## Core Features

${mustHave.length > 0 ? `### Must Have (MVP)
${mustHave.map((f, i) => formatFeature(f, i)).join('\n\n')}` : ''}

${shouldHave.length > 0 ? `### Should Have
${shouldHave.map((f, i) => formatFeature(f, i)).join('\n\n')}` : ''}

${niceToHave.length > 0 ? `### Nice to Have (Future)
${niceToHave.map((f, i) => formatFeature(f, i)).join('\n\n')}` : ''}

## Success Criteria

${successMetrics || '_Define in Foundation tab_'}

## Out of Scope (MVP)

${outOfScope || '- _No items marked as out of scope_'}

---

> This PRD was generated to work with TaskMaster AI and Claude Code.
> Place this file at \`scripts/prd.txt\` for TaskMaster integration.
`;

    onGeneratePRD(prd);
  };

  const priorityLabels = {
    must_have: { label: 'Must Have', color: 'text-red-400 bg-red-900/30 border-red-700/50' },
    should_have: { label: 'Should Have', color: 'text-amber-400 bg-amber-900/30 border-amber-700/50' },
    nice_to_have: { label: 'Nice to Have', color: 'text-green-400 bg-green-900/30 border-green-700/50' },
  };

  return (
    <div className="space-y-8">
      <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-300 mb-1">Why a PRD Matters</h4>
            <p className="text-sm text-amber-200/80">
              Your PRD combines vision, user profile, and technical decisions into one document that AI coding tools understand.
              This becomes the source of truth for TaskMaster AI to break down into actionable development tasks.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-primary-100 mb-4">Technical Stack</h3>
        <p className="text-sm text-primary-400 mb-4">
          Choose your technology stack. These choices affect how AI generates code and what patterns it uses.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {(Object.keys(TECH_OPTIONS) as Array<keyof typeof TECH_OPTIONS>).map((category) => (
            <div key={category}>
              <label className="block text-sm font-medium text-primary-300 mb-2 capitalize">
                {category === 'additionalTools' ? 'Additional Tools' : category}
              </label>
              {category === 'additionalTools' ? (
                <Input
                  value={techStack.additionalTools}
                  onChange={(e) => setTechStack({ ...techStack, additionalTools: e.target.value })}
                  placeholder="e.g., TailwindCSS, Zod, React Query"
                  className="bg-primary-800"
                />
              ) : (
                <select
                  value={techStack[category]}
                  onChange={(e) => setTechStack({ ...techStack, [category]: e.target.value })}
                  className="w-full bg-primary-800 border border-primary-600 rounded-lg px-4 py-2 text-primary-100"
                >
                  {TECH_OPTIONS[category].map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-primary-100">Features</h3>
            <p className="text-sm text-primary-400">
              Define features with user stories and acceptance criteria. Prioritize for MVP.
            </p>
          </div>
          <Button onClick={addFeature} variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            Add Feature
          </Button>
        </div>

        <div className="space-y-4">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className="bg-primary-800/50 border border-primary-700 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-primary-700/50 transition-colors"
              >
                <GripVertical className="w-4 h-4 text-primary-500" />
                <span className="text-primary-300 text-sm font-medium">#{index + 1}</span>
                <span className="flex-1 text-left text-primary-100 font-medium">
                  {feature.name || 'Untitled Feature'}
                </span>
                <span className={`px-2 py-1 text-xs rounded border ${priorityLabels[feature.priority].color}`}>
                  {priorityLabels[feature.priority].label}
                </span>
                {expandedFeature === feature.id ? (
                  <ChevronUp className="w-4 h-4 text-primary-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-primary-400" />
                )}
              </button>

              {expandedFeature === feature.id && (
                <div className="p-4 pt-0 space-y-4 border-t border-primary-700">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-300 mb-2">
                        Feature Name
                      </label>
                      <Input
                        value={feature.name}
                        onChange={(e) => updateFeature(feature.id, { name: e.target.value })}
                        placeholder="e.g., User Authentication"
                        className="bg-primary-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-300 mb-2">
                        Priority
                      </label>
                      <select
                        value={feature.priority}
                        onChange={(e) => updateFeature(feature.id, { priority: e.target.value as Feature['priority'] })}
                        className="w-full bg-primary-900 border border-primary-600 rounded-lg px-4 py-2 text-primary-100"
                      >
                        <option value="must_have">Must Have (MVP)</option>
                        <option value="should_have">Should Have</option>
                        <option value="nice_to_have">Nice to Have (Future)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-300 mb-2">
                      User Story
                    </label>
                    <Textarea
                      value={feature.userStory}
                      onChange={(e) => updateFeature(feature.id, { userStory: e.target.value })}
                      placeholder="As a [user type], I want to [action] so that [benefit]"
                      rows={2}
                      className="bg-primary-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-300 mb-2">
                      Acceptance Criteria
                    </label>
                    <div className="space-y-2">
                      {feature.acceptanceCriteria.map((criteria, i) => (
                        <div key={i} className="flex gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <CheckCircle2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
                            <Input
                              value={criteria}
                              onChange={(e) => updateAcceptanceCriteria(feature.id, i, e.target.value)}
                              placeholder="User can..."
                              className="bg-primary-900 flex-1"
                            />
                          </div>
                          {feature.acceptanceCriteria.length > 1 && (
                            <button
                              onClick={() => removeAcceptanceCriteria(feature.id, i)}
                              className="p-2 text-primary-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addAcceptanceCriteria(feature.id)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Criteria
                      </Button>
                    </div>
                  </div>

                  {features.length > 1 && (
                    <div className="flex justify-end pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(feature.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove Feature
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-primary-100 mb-2">Out of Scope (MVP)</h3>
        <p className="text-sm text-primary-400 mb-3">
          Explicitly list what you're NOT building for MVP. This helps AI stay focused.
        </p>
        <Textarea
          value={outOfScope}
          onChange={(e) => setOutOfScope(e.target.value)}
          placeholder="- Advanced analytics dashboard&#10;- Social login (Google, Facebook)&#10;- Mobile app (web only for MVP)&#10;- Multi-language support"
          rows={4}
          className="bg-primary-800"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={generatePRD} size="lg">
          Generate PRD
        </Button>
      </div>
    </div>
  );
}
