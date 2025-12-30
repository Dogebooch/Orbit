import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ChevronDown,
  ChevronRight,
  Check,
  FileText,
  Zap,
  Code2,
  FileCode,
  ListChecks,
  PlayCircle,
  TestTube,
} from 'lucide-react';
import { parseGuideStructure } from '../../utils/guideParser';

export function SetupGuideStage() {
  const { currentProject } = useApp();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    phase1: true,
    phase2: false,
    phase3: false,
    phase4: false,
    phase5: false,
    phase6: false,
    phase7: false,
  });
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [guideContent, setGuideContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const guideSections = parseGuideStructure();

  // Load markdown content
  useEffect(() => {
    const loadGuide = async () => {
      try {
        // Try public folder first (for Vite dev server)
        let response = await fetch('/guides/DougHub_Project_Setup_Guide.md');
        if (!response.ok) {
          // Fallback: try direct path (for Electron)
          response = await fetch('./guides/DougHub_Project_Setup_Guide.md');
        }
        if (response.ok) {
          const text = await response.text();
          setGuideContent(text);
        } else {
          console.error('Failed to load guide:', response.statusText);
          setGuideContent('# Setup Guide\n\nFailed to load guide content. Please ensure the guide file is accessible.');
        }
      } catch (error) {
        console.error('Error loading guide:', error);
        setGuideContent('# Setup Guide\n\nError loading guide content. Please ensure the guide file is accessible.');
      } finally {
        setLoading(false);
      }
    };
    loadGuide();
  }, []);

  // Load checkbox states from localStorage
  useEffect(() => {
    if (currentProject) {
      const storageKey = `guide_${currentProject.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setCheckedItems(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load guide progress:', e);
        }
      }
    }
  }, [currentProject]);

  // Save checkbox states to localStorage
  const toggleCheckbox = useCallback((itemId: string) => {
    if (!currentProject) return;
    const newChecked = { ...checkedItems, [itemId]: !checkedItems[itemId] };
    setCheckedItems(newChecked);
    const storageKey = `guide_${currentProject.id}`;
    localStorage.setItem(storageKey, JSON.stringify(newChecked));
  }, [currentProject, checkedItems]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  // Scroll to section when checklist item is clicked
  const scrollToSection = useCallback((anchorId: string) => {
    const element = document.getElementById(anchorId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Set up Intersection Observer to track visible sections
  useEffect(() => {
    if (!contentRef.current) return;

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        // Find the entry with the highest intersection ratio
        let maxRatio = 0;
        let activeEntry: IntersectionObserverEntry | null = null;

        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            activeEntry = entry;
          }
        }

        if (activeEntry) {
          const target = activeEntry.target as Element;
          if (target instanceof Element) {
            const anchorId = target.id;
            const sectionId = guideSections.find(s => s.anchorId === anchorId)?.id;
              if (sectionId) {
                setActiveSectionId(sectionId);
                // Auto-expand the section when it becomes active
                setExpandedSections((prev) => ({
                  ...prev,
                  [sectionId]: true,
                }));
              }
            }
          }
        },
      {
        root: contentRef.current,
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    // Observe all section anchors
    guideSections.forEach((section) => {
      const element = document.getElementById(section.anchorId);
      if (element) {
        observer.observe(element);
      }
    });

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [guideSections]);

  // Process markdown to add IDs to headings that match anchor tags and improve formatting
  const processedMarkdown = guideContent
    ? guideContent
        // Handle HTML anchor tags before headings
        .replace(
          /<a id="([^"]+)"><\/a>(#+)\s*(.+)/g,
          (_match, anchorId: string, hashes: string, title: string) => {
            return `${hashes} <span id="${anchorId}">${title}</span>`;
          }
        )
        // Handle anchor tags on their own line (standalone)
        .replace(/<a id="([^"]+)"><\/a>\n/g, '')
    : '';

  return (
    <div className="flex overflow-hidden h-full">
      {/* Checklist Sidebar */}
      <aside className="flex overflow-hidden flex-col w-80 border-r bg-primary-900 border-primary-800">
        <div className="p-4 border-b border-primary-800">
          <h2 className="text-lg font-semibold text-primary-100">Setup Checklist</h2>
          <p className="mt-1 text-xs text-primary-500">Track your progress through the guide</p>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {guideSections.map((section) => {
            const Icon = getSectionIcon(section.id);
            const isExpanded = expandedSections[section.id];
            const isActive = activeSectionId === section.id;
            const completedCount = section.items.filter((item) => checkedItems[item.id]).length;
            const totalCount = section.items.length;

            return (
              <div
                key={section.id}
                className={`rounded-lg border transition-colors ${
                  isActive
                    ? 'border-primary-500 bg-primary-800/50'
                    : 'border-primary-800 bg-primary-900'
                }`}
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex justify-between items-center p-3 w-full transition-colors hover:bg-primary-800/50"
                >
                  <div className="flex flex-1 gap-2 items-center min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="flex-shrink-0 w-4 h-4 text-primary-400" />
                    ) : (
                      <ChevronRight className="flex-shrink-0 w-4 h-4 text-primary-400" />
                    )}
                    <Icon className="flex-shrink-0 w-4 h-4 text-primary-400" />
                    <div className="flex-1 min-w-0 text-left">
                      <h3 className="text-sm font-medium truncate text-primary-100">{section.title}</h3>
                      <p className="text-xs text-primary-500">
                        {completedCount}/{totalCount} completed
                      </p>
                    </div>
                  </div>
                  {completedCount === totalCount && completedCount > 0 && (
                    <div className="flex flex-shrink-0 justify-center items-center ml-2 w-5 h-5 rounded-full bg-green-900/50">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                  )}
                </button>

                {isExpanded && (
                  <div className="px-3 pt-2 pb-3 space-y-1 border-t border-primary-800">
                    {section.items.map((item) => {
                      const isChecked = checkedItems[item.id] || false;
                      return (
                        <label
                          key={item.id}
                          className="flex gap-2 items-start p-2 rounded transition-colors cursor-pointer hover:bg-primary-800/30 group"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCheckbox(item.id)}
                            className="mt-0.5 w-4 h-4 rounded border-primary-600 bg-primary-800 text-primary-400 focus:ring-primary-500 focus:ring-2 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-xs font-medium ${
                                isChecked ? 'line-through text-primary-400' : 'text-primary-200'
                              }`}
                            >
                              {item.label}
                            </div>
                            {item.description && (
                              <div className="mt-0.5 text-xs text-primary-500">{item.description}</div>
                            )}
                            {item.anchorId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  scrollToSection(item.anchorId!);
                                }}
                                className="mt-1 text-xs opacity-0 transition-opacity text-primary-400 hover:text-primary-300 group-hover:opacity-100"
                              >
                                Jump to section →
                              </button>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto bg-[#fafafa] text-gray-900"
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        <div className="px-8 py-12 mx-auto max-w-4xl">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading guide...</div>
            </div>
          ) : (
            <div
              className="max-w-none prose prose-lg"
              style={{
                lineHeight: '1.7',
                fontSize: '17px',
              }}
            >
              <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                h1: ({ ...props }) => (
                  <h1
                    className="pb-3 mt-12 mb-6 text-4xl font-bold text-gray-900 border-b border-gray-200"
                    {...props}
                  />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                h2: ({ ...props }) => (
                  <h2
                    className="pb-2 mt-10 mb-4 text-3xl font-bold text-gray-900 border-b border-gray-200"
                    {...props}
                  />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                h3: ({ ...props }) => (
                  <h3 className="mt-8 mb-3 text-2xl font-semibold text-gray-900" {...props} />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                h4: ({ ...props }) => (
                  <h4 className="mt-6 mb-2 text-xl font-semibold text-gray-900" {...props} />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                p: ({ ...props }) => (
                  <p className="mb-4 leading-relaxed text-gray-800" {...props} />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                ul: ({ ...props }) => (
                  <ul className="mb-4 ml-6 space-y-2.5 list-disc text-gray-800 marker:text-gray-500" {...props} />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                ol: ({ ...props }) => (
                  <ol className="mb-4 ml-6 space-y-2.5 list-decimal text-gray-800 marker:text-gray-500" {...props} />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                li: ({ ...props }) => (
                  <li className="leading-relaxed pl-1" {...props} />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                code: ({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode; [key: string]: unknown }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  
                  return inline ? (
                    <code
                      className="px-1.5 py-0.5 bg-gray-100 rounded text-sm font-mono text-gray-900 border border-gray-200"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <code
                      className={`block overflow-x-auto p-4 mb-4 font-mono text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-200 ${className || ''}`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                pre: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
                  <pre className="overflow-x-auto mb-4 bg-gray-50 rounded-lg border border-gray-200 p-0" {...props}>
                    {children}
                  </pre>
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                blockquote: ({ ...props }) => (
                  <blockquote
                    className="pl-4 py-2 my-6 italic text-gray-700 border-l-4 border-blue-400 bg-blue-50 rounded-r"
                    {...props}
                  />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                table: ({ ...props }) => (
                  <div className="overflow-x-auto mb-6 my-6 shadow-sm rounded-lg border border-gray-200">
                    <table className="min-w-full border-collapse bg-white" {...props} />
                  </div>
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                th: ({ ...props }) => (
                  <th
                    className="px-4 py-3 font-semibold text-left bg-gray-50 border-b-2 border-gray-200 text-gray-900"
                    {...props}
                  />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                td: ({ ...props }) => (
                  <td className="px-4 py-3 border-b border-gray-100 text-gray-800" {...props} />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                strong: ({ ...props }) => (
                  <strong className="font-semibold text-gray-900 font-bold" {...props} />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                em: ({ ...props }) => (
                  <em className="italic text-gray-800" {...props} />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                a: ({ href, children, ...props }: { href?: string; children?: React.ReactNode; [key: string]: unknown }) => (
                  <a
                    href={href}
                    className="text-blue-600 underline hover:text-blue-800 transition-colors font-medium"
                    target={href?.startsWith('http') ? '_blank' : undefined}
                    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    {...props}
                  >
                    {children}
                  </a>
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                hr: ({ ...props }) => (
                  <hr className="my-8 border-gray-300" {...props} />
                ),
              }}
            >
                {processedMarkdown}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getSectionIcon(sectionId: string): React.ElementType {
  const iconMap: Record<string, React.ElementType> = {
    phase1: FileText,
    phase2: Zap,
    phase3: Code2,
    phase4: FileCode,
    phase5: ListChecks,
    phase6: PlayCircle,
    phase7: TestTube,
  };
  return iconMap[sectionId] || FileText;
}

