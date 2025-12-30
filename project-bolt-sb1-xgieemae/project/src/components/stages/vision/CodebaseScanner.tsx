import React, { useState } from 'react';
import { Button, Card, Input, Textarea } from '../../ui';
import {
  FolderSearch,
  FileJson,
  FileText,
  Code2,
  ArrowRight,
  AlertCircle,
  Check,
  Copy,
  Loader2,
  RefreshCw,
  Folder,
} from 'lucide-react';

interface CodebaseScannerProps {
  onImport: (data: ScannedData) => void;
}

interface ScannedData {
  projectName: string;
  description: string;
  vision: {
    problem: string;
    target_user: string;
    success_metrics: string;
    why_software: string;
  };
  userProfile: {
    primary_user: string;
    goal: string;
  };
  techStack: string[];
  suggestedFeatures: string[];
}

interface ScanResult {
  name: string;
  description: string;
  version?: string;
  dependencies: string[];
  devDependencies: string[];
  scripts: string[];
  readme?: string;
  hasTypescript: boolean;
  framework?: string;
  database?: string;
}

// AI prompt for analyzing codebase
const ANALYSIS_PROMPT = (scanResult: ScanResult) => `Analyze this existing project and generate foundation data for it.

PROJECT INFO:
Name: ${scanResult.name}
Description: ${scanResult.description || 'No description provided'}
Version: ${scanResult.version || 'N/A'}

DEPENDENCIES:
${scanResult.dependencies.join(', ') || 'None detected'}

DEV DEPENDENCIES:
${scanResult.devDependencies.join(', ') || 'None detected'}

NPM SCRIPTS:
${scanResult.scripts.join(', ') || 'None detected'}

TECH STACK DETECTED:
- TypeScript: ${scanResult.hasTypescript ? 'Yes' : 'No'}
- Framework: ${scanResult.framework || 'Unknown'}
- Database: ${scanResult.database || 'Unknown'}

README CONTENT (first 1000 chars):
${scanResult.readme?.substring(0, 1000) || 'No README found'}

Based on this information, generate a JSON response with this structure (no markdown, just JSON):
{
  "vision": {
    "problem": "What problem this project solves (infer from description/readme)",
    "target_user": "Who would use this (infer from functionality)",
    "success_metrics": "3-4 measurable success criteria",
    "why_software": "Why this needs to be software"
  },
  "userProfile": {
    "primary_user": "Description of the typical user",
    "goal": "What users want to achieve with this"
  },
  "suggestedFeatures": ["Feature 1", "Feature 2", "Feature 3"]
}

Return ONLY the JSON object, no additional text.`;

export function CodebaseScanner({ onImport }: CodebaseScannerProps) {
  const [step, setStep] = useState<'input' | 'scan' | 'analyze' | 'import'>('input');
  const [projectPath, setProjectPath] = useState('');
  const [packageJsonContent, setPackageJsonContent] = useState('');
  const [readmeContent, setReadmeContent] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const detectFramework = (deps: string[]): string | undefined => {
    if (deps.includes('next')) return 'Next.js';
    if (deps.includes('react')) return 'React';
    if (deps.includes('vue')) return 'Vue';
    if (deps.includes('angular')) return 'Angular';
    if (deps.includes('svelte')) return 'Svelte';
    if (deps.includes('express')) return 'Express.js';
    if (deps.includes('fastify')) return 'Fastify';
    if (deps.includes('nest')) return 'NestJS';
    return undefined;
  };

  const detectDatabase = (deps: string[]): string | undefined => {
    if (deps.includes('@supabase/supabase-js')) return 'Supabase';
    if (deps.includes('prisma') || deps.includes('@prisma/client')) return 'Prisma';
    if (deps.includes('mongoose')) return 'MongoDB';
    if (deps.includes('pg') || deps.includes('postgres')) return 'PostgreSQL';
    if (deps.includes('mysql') || deps.includes('mysql2')) return 'MySQL';
    if (deps.includes('sqlite3') || deps.includes('better-sqlite3')) return 'SQLite';
    if (deps.includes('firebase')) return 'Firebase';
    return undefined;
  };

  const handleScanPackageJson = () => {
    setError(null);
    try {
      const pkg = JSON.parse(packageJsonContent);
      
      const allDeps = [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.devDependencies || {}),
      ];

      const result: ScanResult = {
        name: pkg.name || 'Unknown Project',
        description: pkg.description || '',
        version: pkg.version,
        dependencies: Object.keys(pkg.dependencies || {}),
        devDependencies: Object.keys(pkg.devDependencies || {}),
        scripts: Object.keys(pkg.scripts || {}),
        readme: readmeContent || undefined,
        hasTypescript: allDeps.includes('typescript') || allDeps.some(d => d.startsWith('@types/')),
        framework: detectFramework(allDeps),
        database: detectDatabase(allDeps),
      };

      setScanResult(result);
      setAiPrompt(ANALYSIS_PROMPT(result));
      setStep('analyze');
    } catch (err) {
      setError('Invalid package.json format. Please paste valid JSON.');
    }
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(aiPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleParseAiResponse = () => {
    setError(null);
    try {
      let jsonStr = aiResponse.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      
      const data = JSON.parse(jsonStr);
      
      if (!data.vision || !data.userProfile) {
        throw new Error('Invalid response structure');
      }

      const scannedData: ScannedData = {
        projectName: scanResult?.name || 'Imported Project',
        description: scanResult?.description || '',
        vision: {
          problem: data.vision.problem || '',
          target_user: data.vision.target_user || '',
          success_metrics: data.vision.success_metrics || '',
          why_software: data.vision.why_software || '',
        },
        userProfile: {
          primary_user: data.userProfile.primary_user || '',
          goal: data.userProfile.goal || '',
        },
        techStack: [
          scanResult?.framework,
          scanResult?.hasTypescript ? 'TypeScript' : 'JavaScript',
          scanResult?.database,
        ].filter(Boolean) as string[],
        suggestedFeatures: data.suggestedFeatures || [],
      };

      onImport(scannedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse AI response');
    }
  };

  const reset = () => {
    setStep('input');
    setPackageJsonContent('');
    setReadmeContent('');
    setScanResult(null);
    setAiPrompt('');
    setAiResponse('');
    setError(null);
  };

  return (
    <Card className="border-2 border-dashed border-amber-600/50 bg-gradient-to-br from-amber-900/20 to-primary-900/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl">
          <FolderSearch className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-primary-100">Import Existing Project</h2>
          <p className="text-sm text-primary-400">Analyze your codebase to generate foundation</p>
        </div>
      </div>

      {step === 'input' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
            <div className="flex items-start gap-3">
              <FileJson className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-200">
                <strong className="text-amber-300">How it works:</strong>
                <p className="mt-1 text-amber-300/80">
                  Paste your project's package.json content. We'll analyze it to understand your tech stack,
                  then use AI to generate foundation data.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-300 mb-2">
              <FileJson className="w-4 h-4 inline mr-2" />
              Paste package.json content
            </label>
            <Textarea
              value={packageJsonContent}
              onChange={(e) => setPackageJsonContent(e.target.value)}
              placeholder={`{
  "name": "my-project",
  "version": "1.0.0",
  "description": "...",
  "dependencies": { ... }
}`}
              rows={8}
              className="bg-primary-900 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-300 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Paste README.md content (optional)
            </label>
            <Textarea
              value={readmeContent}
              onChange={(e) => setReadmeContent(e.target.value)}
              placeholder="# Project Name&#10;&#10;Description of your project..."
              rows={4}
              className="bg-primary-900 font-mono text-sm"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <Button
            onClick={handleScanPackageJson}
            disabled={!packageJsonContent.trim()}
            className="w-full"
          >
            <Code2 className="w-4 h-4 mr-2" />
            Analyze Codebase
          </Button>
        </div>
      )}

      {step === 'analyze' && scanResult && (
        <div className="space-y-4">
          {/* Scan Summary */}
          <div className="p-4 bg-primary-800/50 rounded-lg">
            <h3 className="text-sm font-semibold text-primary-200 mb-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Codebase Analyzed
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-primary-500">Name:</span>
                <span className="text-primary-200 ml-2">{scanResult.name}</span>
              </div>
              <div>
                <span className="text-primary-500">Framework:</span>
                <span className="text-primary-200 ml-2">{scanResult.framework || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-primary-500">TypeScript:</span>
                <span className="text-primary-200 ml-2">{scanResult.hasTypescript ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span className="text-primary-500">Database:</span>
                <span className="text-primary-200 ml-2">{scanResult.database || 'None detected'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-primary-500">Dependencies:</span>
                <span className="text-primary-200 ml-2">{scanResult.dependencies.length} packages</span>
              </div>
            </div>
          </div>

          {/* AI Prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-primary-300">
                AI Analysis Prompt
              </label>
              <Button variant="ghost" size="sm" onClick={copyPrompt}>
                {copied ? (
                  <>
                    <Check className="w-3 h-3 mr-1 text-green-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="p-3 bg-primary-900 border border-primary-700 rounded-lg text-xs text-primary-400 max-h-32 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{aiPrompt.substring(0, 500)}...</pre>
            </div>
            <p className="text-xs text-primary-500 mt-2">
              Copy this prompt and paste it into Claude or ChatGPT to generate your foundation data.
            </p>
          </div>

          {/* AI Response Input */}
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-2">
              Paste AI Response (JSON)
            </label>
            <Textarea
              value={aiResponse}
              onChange={(e) => {
                setAiResponse(e.target.value);
                setError(null);
              }}
              placeholder="Paste the JSON response from the AI here..."
              rows={6}
              className="bg-primary-900 font-mono text-sm"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setStep('input')}>
              Back
            </Button>
            <Button
              onClick={handleParseAiResponse}
              disabled={!aiResponse.trim()}
              className="flex-1"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Import to Foundation
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-primary-700/50 flex items-center justify-between">
        <span className="text-xs text-primary-500">
          Step {step === 'input' ? 1 : 2} of 2
        </span>
        {step !== 'input' && (
          <button
            onClick={reset}
            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Start over
          </button>
        )}
      </div>
    </Card>
  );
}

