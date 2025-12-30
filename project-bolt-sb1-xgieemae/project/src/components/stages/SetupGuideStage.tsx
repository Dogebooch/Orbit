import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
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
  ExternalLink,
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
    phase8: false,
  });
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [guideContent, setGuideContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const guideSections = parseGuideStructure();

  // Helper function to extract text from React children recursively
  const extractTextFromChildren = (children: React.ReactNode): string => {
    if (typeof children === 'string') {
      return children;
    }
    if (typeof children === 'number') {
      return String(children);
    }
    if (Array.isArray(children)) {
      return children.map(extractTextFromChildren).join('');
    }
    if (children && typeof children === 'object' && 'props' in children) {
      return extractTextFromChildren((children as { props?: { children?: React.ReactNode } }).props?.children);
    }
    return '';
  };

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

  // Extract anchor ID mappings and process markdown
  // Creates a mapping of heading text to anchor IDs for custom heading components
  const anchorIdMap = useRef<Map<string, string>>(new Map());
  
  // Process markdown to extract anchor IDs and apply them to headings
  // Converts: <a id="overview"></a>\n## Overview  ->  ## Overview (with ID stored in map)
  const processedMarkdown = useMemo(() => {
    if (!guideContent) return '';
    
    const map = new Map<string, string>();
    const processed = guideContent
      // Handle HTML anchor tags on their own line followed by a heading
      // Matches: <a id="id"></a>\n## Heading or <a id="id"></a>\n# Heading
      .replace(
        /<a id="([^"]+)"><\/a>\n(#+)\s+(.+)/g,
        (_match, anchorId: string, hashes: string, title: string) => {
          // Store mapping of heading text to anchor ID
          map.set(title.trim(), anchorId);
          // Return heading without anchor tag
          return `${hashes} ${title}`;
        }
      )
      // Remove any remaining standalone anchor tags
      .replace(/<a id="[^"]+"><\/a>\n?/g, '');
    
    anchorIdMap.current = map;
    return processed;
  }, [guideContent]);

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
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`text-xs font-medium ${
                                  isChecked ? 'line-through text-primary-400' : 'text-primary-200'
                                }`}
                              >
                                {item.label}
                              </div>
                              {item.isExternal && (
                                <ExternalLink 
                                  className="w-3 h-3 text-primary-500 flex-shrink-0" 
                                  title="External tool - requires action outside this app"
                                />
                              )}
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
        className="overflow-y-auto flex-1 bg-primary-950 text-primary-100"
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        <div className="px-8 py-12 mx-auto max-w-4xl">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-primary-400">Loading guide...</div>
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
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: ({ children, ...props }) => {
                  const headingText = extractTextFromChildren(children);
                  const anchorId = anchorIdMap.current.get(headingText.trim());
                  return (
                    <h1
                      id={anchorId}
                      className="pb-3 mt-12 mb-6 text-4xl font-bold border-b text-primary-50 border-primary-700"
                      {...props}
                    >
                      {children}
                    </h1>
                  );
                },
                h2: ({ children, ...props }) => {
                  const headingText = extractTextFromChildren(children);
                  const anchorId = anchorIdMap.current.get(headingText.trim());
                  return (
                    <h2
                      id={anchorId}
                      className="pb-2 mt-10 mb-4 text-3xl font-bold border-b text-primary-50 border-primary-700"
                      {...props}
                    >
                      {children}
                    </h2>
                  );
                },
                h3: ({ children, ...props }) => {
                  const headingText = extractTextFromChildren(children);
                  const anchorId = anchorIdMap.current.get(headingText.trim());
                  return (
                    <h3 
                      id={anchorId}
                      className="mt-8 mb-3 text-2xl font-semibold text-primary-100" 
                      {...props}
                    >
                      {children}
                    </h3>
                  );
                },
                h4: ({ children, ...props }) => {
                  const headingText = extractTextFromChildren(children);
                  const anchorId = anchorIdMap.current.get(headingText.trim());
                  return (
                    <h4 
                      id={anchorId}
                      className="mt-6 mb-2 text-xl font-semibold text-primary-100" 
                      {...props}
                    >
                      {children}
                    </h4>
                  );
                },
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                p: ({ ...props }) => (
                  <p className="mb-4 leading-relaxed text-primary-200" {...props} />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                ul: ({ ...props }) => (
                  <ul className="mb-4 ml-6 space-y-2.5 list-disc text-primary-200 marker:text-primary-400" {...props} />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                ol: ({ ...props }) => (
                  <ol className="mb-4 ml-6 space-y-2.5 list-decimal text-primary-200 marker:text-primary-400" {...props} />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                li: ({ ...props }) => (
                  <li className="pl-1 leading-relaxed" {...props} />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                code: ({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode; [key: string]: unknown }) => {
                  return inline ? (
                    <code
                      className="px-1.5 py-0.5 bg-primary-800 rounded text-sm font-mono text-primary-100 border border-primary-700"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <code
                      className={`block overflow-x-auto p-4 mb-4 font-mono text-sm text-primary-100 bg-primary-800 rounded-lg border border-primary-700 ${className || ''}`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                pre: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
                  <pre className="overflow-x-auto p-0 mb-4 rounded-lg border bg-primary-800 border-primary-700" {...props}>
                    {children}
                  </pre>
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                blockquote: ({ ...props }) => (
                  <blockquote
                    className="py-2 pl-4 my-6 italic text-primary-200 bg-primary-800/50 rounded-r border-l-4 border-blue-400"
                    {...props}
                  />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                table: ({ ...props }) => (
                  <div className="overflow-x-auto my-6 mb-6 rounded-lg border border-primary-700 shadow-sm">
                    <table className="min-w-full bg-primary-900 border-collapse" {...props} />
                  </div>
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                th: ({ ...props }) => (
                  <th
                    className="px-4 py-3 font-semibold text-left text-primary-100 bg-primary-800 border-b-2 border-primary-700"
                    {...props}
                  />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                td: ({ ...props }) => (
                  <td className="px-4 py-3 text-primary-200 border-b border-primary-800" {...props} />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                strong: ({ ...props }) => (
                  <strong className="font-bold text-primary-100" {...props} />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                em: ({ ...props }) => (
                  <em className="italic text-primary-200" {...props} />
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                a: ({ href, children, ...props }: { href?: string; children?: React.ReactNode; [key: string]: unknown }) => (
                  <a
                    href={href}
                    className="font-medium text-blue-400 underline transition-colors hover:text-blue-300"
                    target={href?.startsWith('http') ? '_blank' : undefined}
                    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    {...props}
                  >
                    {children}
                  </a>
                ),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                hr: ({ ...props }) => (
                  <hr className="my-8 border-primary-700" {...props} />
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

