import React, { useState, useEffect } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { useTerminal } from '../../../contexts/TerminalContext';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Download,
  FileCode,
  Sparkles,
  Settings,
  FileText,
  Copy,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  FolderOpen,
} from 'lucide-react';
import {
  TECH_STACK_TEMPLATES,
  DEFAULT_AI_INSTRUCTIONS,
  generateProjectFiles,
  getTechStackById,
  hashFoundationData,
  type CodingStandards,
  type AIInstructions,
  type GeneratedFile,
} from '../../../config/fileTemplates';
import {
  downloadFile,
  downloadFiles,
  copyToClipboard,
  writeFilesViaWebSocket,
} from '../../../utils/fileOutput';
import { getWebSocketClient } from '../../../lib/websocket';

type WizardStep = 'stack' | 'standards' | 'ai' | 'review';

interface ProjectFilesWizardProps {
  geminiApiKey?: string;
  onClose?: () => void;
}

export function ProjectFilesWizard({ geminiApiKey, onClose }: ProjectFilesWizardProps) {
  const { currentProject } = useApp();
  const { workingDirectory, isBackendConnected } = useTerminal();
  
  const [currentStep, setCurrentStep] = useState<WizardStep>('stack');
  const [selectedStackId, setSelectedStackId] = useState<string>('react-ts-vite');
  const [codingStandards, setCodingStandards] = useState<CodingStandards>(
    TECH_STACK_TEMPLATES[0].defaultCodingStandards
  );
  const [aiInstructions, setAiInstructions] = useState<AIInstructions>(DEFAULT_AI_INSTRUCTIONS);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [foundationData, setFoundationData] = useState<{
    vision: Record<string, string>;
    profile: Record<string, string>;
  } | null>(null);

  const steps: { id: WizardStep; title: string; icon: React.ElementType }[] = [
    { id: 'stack', title: 'Tech Stack', icon: FileCode },
    { id: 'standards', title: 'Coding Standards', icon: Settings },
    { id: 'ai', title: 'AI Instructions', icon: Sparkles },
    { id: 'review', title: 'Review & Generate', icon: FileText },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  // Load foundation data and existing config
  useEffect(() => {
    if (currentProject) {
      loadData();
    }
  }, [currentProject]);

  // Update coding standards when stack changes
  useEffect(() => {
    const stack = getTechStackById(selectedStackId);
    if (stack) {
      setCodingStandards(stack.defaultCodingStandards);
    }
  }, [selectedStackId]);

  // Generate files when reaching review step
  useEffect(() => {
    if (currentStep === 'review') {
      generateFiles();
    }
  }, [currentStep, selectedStackId, codingStandards, aiInstructions, foundationData]);

  const loadData = async () => {
    if (!currentProject) return;

    // Load vision data
    const { data: visionData } = await supabase
      .from('visions')
      .select('*')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    // Load user profile data
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    setFoundationData({
      vision: visionData || {},
      profile: profileData || {},
    });

    // Load existing project config
    const { data: configData } = await supabase
      .from('project_configs')
      .select('*')
      .eq('project_id', currentProject.id)
      .maybeSingle();

    if (configData) {
      setSelectedStackId(configData.tech_stack_id || 'react-ts-vite');
      if (configData.coding_standards) {
        setCodingStandards(configData.coding_standards as CodingStandards);
      }
      if (configData.ai_instructions) {
        setAiInstructions(configData.ai_instructions as AIInstructions);
      }
    }
  };

  const generateFiles = () => {
    const stack = getTechStackById(selectedStackId);
    if (!stack || !currentProject) return;

    const ctx = {
      projectName: currentProject.name,
      projectDescription: currentProject.description || '',
      targetUser: foundationData?.vision?.target_user || '',
      techStack: stack,
      codingStandards,
      aiInstructions,
      vision: foundationData?.vision ? {
        problem: foundationData.vision.problem || '',
        targetUser: foundationData.vision.target_user || '',
        successMetrics: foundationData.vision.success_metrics || '',
      } : undefined,
      userProfile: foundationData?.profile ? {
        primaryUser: foundationData.profile.primary_user || '',
        goal: foundationData.profile.goal || '',
        technicalComfort: foundationData.profile.technical_comfort || 'medium',
      } : undefined,
    };

    const files = generateProjectFiles(ctx);
    setGeneratedFiles(files);
  };

  const saveConfig = async () => {
    if (!currentProject) return;

    setSaving(true);
    try {
      const hash = hashFoundationData(foundationData?.vision, foundationData?.profile);

      const { data: existing } = await supabase
        .from('project_configs')
        .select('id')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      const configData = {
        project_id: currentProject.id,
        tech_stack_id: selectedStackId,
        coding_standards: codingStandards,
        ai_instructions: aiInstructions,
        foundation_data_hash: hash,
        generated_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase
          .from('project_configs')
          .update({ ...configData, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase.from('project_configs').insert(configData);
      }
    } catch (err) {
      console.error('Error saving config:', err);
    } finally {
      setSaving(false);
    }
  };

  const [writingToProject, setWritingToProject] = useState(false);
  const [writeSuccess, setWriteSuccess] = useState(false);

  const handleDownloadFile = (file: GeneratedFile) => {
    downloadFile(file.content, file.filename);
  };

  const handleDownloadAllFiles = async () => {
    await saveConfig();
    downloadFiles(generatedFiles);
  };

  const handleCopyFileContent = async (file: GeneratedFile) => {
    const success = await copyToClipboard(file.content);
    if (success) {
      setCopiedFile(file.filename);
      setTimeout(() => setCopiedFile(null), 2000);
    }
  };

  const handleWriteToWorkingDirectory = async () => {
    if (!isBackendConnected || !workingDirectory) {
      return;
    }

    setWritingToProject(true);
    setWriteSuccess(false);

    try {
      await saveConfig();
      
      // Get WebSocket client for file writing
      const wsClient = getWebSocketClient(
        () => {}, // Message handler not needed for write
        () => {}  // Status handler not needed for write
      );

      const results = await writeFilesViaWebSocket(
        wsClient,
        generatedFiles,
        workingDirectory
      );

      const allSuccess = results.every((r) => r.success);
      setWriteSuccess(allSuccess);

      if (allSuccess) {
        setTimeout(() => setWriteSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to write files:', error);
    } finally {
      setWritingToProject(false);
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const selectedStack = getTechStackById(selectedStackId);

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;
          
          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => index <= currentStepIndex && setCurrentStep(step.id)}
                className={`flex flex-col items-center gap-2 ${
                  index <= currentStepIndex ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : isCompleted
                      ? 'bg-green-700 text-white'
                      : 'bg-primary-800 text-primary-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isActive ? 'text-primary-100' : 'text-primary-400'
                  }`}
                >
                  {step.title}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    index < currentStepIndex ? 'bg-green-700' : 'bg-primary-700'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 'stack' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary-100 mb-2">Select Your Tech Stack</h3>
              <p className="text-sm text-primary-400">
                Choose a template that matches your project. This sets default coding standards and file content.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TECH_STACK_TEMPLATES.map((stack) => (
                <button
                  key={stack.id}
                  onClick={() => setSelectedStackId(stack.id)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    selectedStackId === stack.id
                      ? 'border-primary-500 bg-primary-800/50'
                      : 'border-primary-700 bg-primary-900 hover:border-primary-600'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{stack.icon}</span>
                    <h4 className="font-semibold text-primary-100">{stack.name}</h4>
                  </div>
                  <p className="text-sm text-primary-400 mb-3">{stack.description}</p>
                  {stack.frameworks.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {stack.frameworks.map((fw) => (
                        <span
                          key={fw}
                          className="text-xs px-2 py-0.5 bg-primary-700 text-primary-300 rounded"
                        >
                          {fw}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'standards' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-primary-100 mb-2">Coding Standards</h3>
              <p className="text-sm text-primary-400">
                Configure how the AI should write and organize code.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="label">TypeScript</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={codingStandards.typescript}
                        onChange={() => setCodingStandards({ ...codingStandards, typescript: true })}
                        className="text-primary-500"
                      />
                      <span className="text-sm text-primary-300">Required</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!codingStandards.typescript}
                        onChange={() => setCodingStandards({ ...codingStandards, typescript: false })}
                        className="text-primary-500"
                      />
                      <span className="text-sm text-primary-300">JavaScript OK</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="label">Strict Mode</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={codingStandards.strictMode}
                      onChange={(e) =>
                        setCodingStandards({ ...codingStandards, strictMode: e.target.checked })
                      }
                      className="rounded text-primary-500"
                    />
                    <span className="text-sm text-primary-300">Enable strict type checking</span>
                  </label>
                </div>

                <div>
                  <label className="label">Prefer Functional Patterns</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={codingStandards.preferFunctional}
                      onChange={(e) =>
                        setCodingStandards({ ...codingStandards, preferFunctional: e.target.checked })
                      }
                      className="rounded text-primary-500"
                    />
                    <span className="text-sm text-primary-300">
                      Use functional components and patterns over classes
                    </span>
                  </label>
                </div>

                <div>
                  <label className="label">Naming Convention</label>
                  <select
                    value={codingStandards.namingConvention}
                    onChange={(e) =>
                      setCodingStandards({
                        ...codingStandards,
                        namingConvention: e.target.value as CodingStandards['namingConvention'],
                      })
                    }
                    className="input"
                  >
                    <option value="camelCase">camelCase</option>
                    <option value="snake_case">snake_case</option>
                    <option value="PascalCase">PascalCase</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Max File Length (lines)</label>
                  <input
                    type="number"
                    value={codingStandards.maxFileLength}
                    onChange={(e) =>
                      setCodingStandards({
                        ...codingStandards,
                        maxFileLength: parseInt(e.target.value) || 300,
                      })
                    }
                    className="input"
                    min={100}
                    max={1000}
                  />
                </div>

                <div>
                  <label className="label">Testing Approach</label>
                  <select
                    value={codingStandards.testingApproach}
                    onChange={(e) =>
                      setCodingStandards({
                        ...codingStandards,
                        testingApproach: e.target.value as CodingStandards['testingApproach'],
                      })
                    }
                    className="input"
                  >
                    <option value="unit">Unit Tests</option>
                    <option value="integration">Integration Tests</option>
                    <option value="e2e">End-to-End Tests</option>
                    <option value="all">All Types</option>
                  </select>
                </div>

                <div>
                  <label className="label">Documentation Level</label>
                  <select
                    value={codingStandards.documentationLevel}
                    onChange={(e) =>
                      setCodingStandards({
                        ...codingStandards,
                        documentationLevel: e.target.value as CodingStandards['documentationLevel'],
                      })
                    }
                    className="input"
                  >
                    <option value="minimal">Minimal</option>
                    <option value="moderate">Moderate</option>
                    <option value="comprehensive">Comprehensive</option>
                  </select>
                </div>

                <div>
                  <label className="label">Error Handling</label>
                  <select
                    value={codingStandards.errorHandling}
                    onChange={(e) =>
                      setCodingStandards({
                        ...codingStandards,
                        errorHandling: e.target.value as CodingStandards['errorHandling'],
                      })
                    }
                    className="input"
                  >
                    <option value="basic">Basic</option>
                    <option value="comprehensive">Comprehensive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'ai' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-primary-100 mb-2">AI Behavior</h3>
              <p className="text-sm text-primary-400">
                Configure how AI assistants should communicate and behave.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="label">Communication Style</label>
                  <select
                    value={aiInstructions.communicationStyle}
                    onChange={(e) =>
                      setAiInstructions({
                        ...aiInstructions,
                        communicationStyle: e.target.value as AIInstructions['communicationStyle'],
                      })
                    }
                    className="input"
                  >
                    <option value="concise">Concise - Brief and to the point</option>
                    <option value="detailed">Detailed - Thorough explanations</option>
                    <option value="educational">Educational - Teaching focus</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="label">Behavior Preferences</label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiInstructions.codeExamples}
                      onChange={(e) =>
                        setAiInstructions({ ...aiInstructions, codeExamples: e.target.checked })
                      }
                      className="rounded text-primary-500"
                    />
                    <span className="text-sm text-primary-300">Include code examples in explanations</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiInstructions.askClarifyingQuestions}
                      onChange={(e) =>
                        setAiInstructions({
                          ...aiInstructions,
                          askClarifyingQuestions: e.target.checked,
                        })
                      }
                      className="rounded text-primary-500"
                    />
                    <span className="text-sm text-primary-300">Ask clarifying questions when needed</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiInstructions.suggestImprovements}
                      onChange={(e) =>
                        setAiInstructions({ ...aiInstructions, suggestImprovements: e.target.checked })
                      }
                      className="rounded text-primary-500"
                    />
                    <span className="text-sm text-primary-300">Suggest improvements proactively</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiInstructions.followExistingPatterns}
                      onChange={(e) =>
                        setAiInstructions({
                          ...aiInstructions,
                          followExistingPatterns: e.target.checked,
                        })
                      }
                      className="rounded text-primary-500"
                    />
                    <span className="text-sm text-primary-300">Follow existing codebase patterns</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiInstructions.preferSimpleSolutions}
                      onChange={(e) =>
                        setAiInstructions({
                          ...aiInstructions,
                          preferSimpleSolutions: e.target.checked,
                        })
                      }
                      className="rounded text-primary-500"
                    />
                    <span className="text-sm text-primary-300">Prefer simple solutions over complex ones</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="label">Custom Instructions</label>
                <textarea
                  value={aiInstructions.customInstructions}
                  onChange={(e) =>
                    setAiInstructions({ ...aiInstructions, customInstructions: e.target.value })
                  }
                  className="textarea h-48"
                  placeholder="Add any specific instructions for the AI assistant...

Example:
- Always use React Query for data fetching
- Prefer Zustand over Redux
- Use pnpm instead of npm"
                />
                <p className="text-xs text-primary-500 mt-2">
                  These will be added to the generated files as additional guidance.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary-100 mb-2">Review Generated Files</h3>
                <p className="text-sm text-primary-400">
                  Preview the files that will be generated for your project.
                </p>
              </div>
              
              {geminiApiKey && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsEnhancing(true);
                    // TODO: Implement Gemini enhancement
                    setTimeout(() => setIsEnhancing(false), 2000);
                  }}
                  disabled={isEnhancing}
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Enhance with Gemini
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Configuration Summary */}
            <div className="p-4 bg-primary-800/50 rounded-lg border border-primary-700">
              <h4 className="text-sm font-medium text-primary-200 mb-2">Configuration Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-primary-500">Stack:</span>
                  <span className="ml-2 text-primary-300">{selectedStack?.name}</span>
                </div>
                <div>
                  <span className="text-primary-500">TypeScript:</span>
                  <span className="ml-2 text-primary-300">{codingStandards.typescript ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="text-primary-500">Style:</span>
                  <span className="ml-2 text-primary-300">{aiInstructions.communicationStyle}</span>
                </div>
                <div>
                  <span className="text-primary-500">Testing:</span>
                  <span className="ml-2 text-primary-300">{codingStandards.testingApproach}</span>
                </div>
              </div>
            </div>

            {/* File List */}
            <div className="space-y-3">
              {generatedFiles.map((file) => (
                <div
                  key={file.filename}
                  className="border border-primary-700 rounded-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between p-3 bg-primary-800/50">
                    <div className="flex items-center gap-3">
                      <FileCode className="w-5 h-5 text-primary-400" />
                      <div>
                        <h4 className="font-medium text-primary-100">{file.filename}</h4>
                        <p className="text-xs text-primary-500">{file.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setPreviewFile(previewFile === file.filename ? null : file.filename)}
                        className="text-xs"
                      >
                        {previewFile === file.filename ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleCopyFileContent(file)}
                        className="text-xs"
                      >
                        {copiedFile === file.filename ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1 text-green-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" onClick={() => handleDownloadFile(file)} className="text-xs">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  {previewFile === file.filename && (
                    <div className="p-4 bg-primary-900 border-t border-primary-700 max-h-80 overflow-y-auto">
                      <pre className="text-xs text-primary-300 whitespace-pre-wrap font-mono">
                        {file.content}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Output Options */}
            <div className="pt-4 border-t border-primary-700 space-y-4">
              <div className="flex items-center gap-4">
                <Button onClick={handleDownloadAllFiles} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download All Files
                    </>
                  )}
                </Button>
                
                {isBackendConnected && workingDirectory && (
                  <Button
                    variant="secondary"
                    onClick={handleWriteToWorkingDirectory}
                    disabled={writingToProject}
                  >
                    {writingToProject ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Writing...
                      </>
                    ) : writeSuccess ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                        Written!
                      </>
                    ) : (
                      <>
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Write to Project
                      </>
                    )}
                  </Button>
                )}
              </div>

              {isBackendConnected && workingDirectory && (
                <div className="flex items-center gap-2 text-sm text-primary-400">
                  <FolderOpen className="w-4 h-4" />
                  <span>Target: <code className="bg-primary-900 px-2 py-0.5 rounded text-xs">{workingDirectory}</code></span>
                </div>
              )}

              {!isBackendConnected && (
                <div className="flex items-center gap-2 text-sm text-yellow-400">
                  <AlertTriangle className="w-4 h-4" />
                  Connect terminal backend to write files directly to your project
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-primary-700">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {currentStep !== 'review' ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button variant="ghost" onClick={onClose}>
            Done
          </Button>
        )}
      </div>
    </div>
  );
}

