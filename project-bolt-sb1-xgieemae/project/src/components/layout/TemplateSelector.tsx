import React, { useState } from 'react';
import { PROJECT_TEMPLATES, ProjectTemplate } from '../../lib/projectTemplates';
import { Button } from '../ui';
import { Check, ChevronRight, ArrowLeft } from 'lucide-react';

interface TemplateSelectorProps {
  onSelectTemplate: (template: ProjectTemplate) => void;
  onBack: () => void;
}

const CATEGORY_LABELS: Record<ProjectTemplate['category'], string> = {
  web: '🌐 Web Applications',
  mobile: '📱 Mobile',
  api: '⚙️ APIs & Backend',
  tool: '🛠️ Developer Tools',
  other: '📄 Other',
};

export function TemplateSelector({ onSelectTemplate, onBack }: TemplateSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const categories = Object.entries(CATEGORY_LABELS);
  
  const handleConfirm = () => {
    const template = PROJECT_TEMPLATES.find(t => t.id === selectedId);
    if (template) {
      onSelectTemplate(template);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className="text-xs text-primary-500">Choose a template</span>
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
        {categories.map(([category, label]) => {
          const templates = PROJECT_TEMPLATES.filter(t => t.category === category);
          if (templates.length === 0) return null;

          return (
            <div key={category}>
              <h4 className="text-xs font-medium text-primary-500 mb-2">{label}</h4>
              <div className="space-y-1">
                {templates.map((template) => {
                  const isSelected = selectedId === template.id;
                  const isHovered = hoveredId === template.id;
                  
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedId(template.id)}
                      onMouseEnter={() => setHoveredId(template.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'bg-primary-600 border-2 border-primary-400'
                          : 'bg-primary-800/50 border-2 border-transparent hover:bg-primary-800 hover:border-primary-600/50'
                      }`}
                    >
                      <span className="text-xl flex-shrink-0">{template.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-primary-100'}`}>
                            {template.name}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-green-400 flex-shrink-0" />}
                        </div>
                        <p className={`text-xs truncate ${isSelected ? 'text-primary-200' : 'text-primary-400'}`}>
                          {template.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Template Preview */}
      {selectedId && selectedId !== 'blank' && (
        <div className="p-3 bg-primary-800/50 rounded-lg border border-primary-700 animate-fade-in">
          <h4 className="text-xs font-medium text-primary-300 mb-2">Template includes:</h4>
          <ul className="text-xs text-primary-400 space-y-1">
            <li>• Pre-filled vision & user profile</li>
            <li>• Suggested features list</li>
            <li>• Recommended tech stack</li>
          </ul>
        </div>
      )}

      <Button
        onClick={handleConfirm}
        disabled={!selectedId}
        className="w-full"
      >
        {selectedId === 'blank' ? 'Start Blank Project' : 'Use Template'}
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

