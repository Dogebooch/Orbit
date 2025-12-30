import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { Rocket, CheckCircle2, Circle, Download, Code } from 'lucide-react';

export function TestingStage() {
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Happy path works end-to-end', checked: false },
    { id: 2, text: 'Each feature works in isolation', checked: false },
    { id: 3, text: 'Error states display appropriately', checked: false },
    { id: 4, text: 'Works on desktop browsers (Chrome, Firefox, Safari)', checked: false },
    { id: 5, text: 'Functions properly on mobile devices', checked: false },
    { id: 6, text: 'Responsive design adapts correctly', checked: false },
    { id: 7, text: 'Loads within acceptable time limits', checked: false },
    { id: 8, text: 'Input validation prevents malicious data', checked: false },
    { id: 9, text: '3+ users completed core workflow without help', checked: false },
    { id: 10, text: 'Zero critical bugs during user testing', checked: false },
  ]);

  const toggleCheck = (id: number) => {
    setChecklist(checklist.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  const completionPercentage = Math.round((checklist.filter((item) => item.checked).length / checklist.length) * 100);

  const deploymentConfigs = [
    {
      platform: 'Vercel',
      description: 'Best for Next.js and React apps',
      config: `{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}`,
    },
    {
      platform: 'Netlify',
      description: 'Great for static sites and JAMstack',
      config: `{
  "build": {
    "command": "npm run build",
    "publish": "dist"
  }
}`,
    },
    {
      platform: 'Railway',
      description: 'Full-stack apps with databases',
      config: `{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}`,
    },
  ];

  const cicdTemplate = `name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build application
        run: npm run build
      - name: Deploy
        run: npm run deploy
        env:
          DEPLOY_TOKEN: \${{ secrets.DEPLOY_TOKEN }}`;

  const downloadConfig = (platform: string, config: string) => {
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${platform.toLowerCase()}.json`;
    a.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary-100 flex items-center gap-3">
          <Rocket className="w-8 h-8 text-primary-400" />
          Testing & Deployment
        </h1>
        <p className="text-primary-400 mt-2">
          Validate your work and prepare for launch.
        </p>
      </div>

      <Card>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-primary-100">Validation Checklist</h2>
            <span className="text-2xl font-bold text-primary-400">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-primary-800 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {checklist.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary-800 transition-colors text-left"
            >
              {item.checked ? (
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-primary-500 flex-shrink-0" />
              )}
              <span className={`${item.checked ? 'text-primary-300 line-through' : 'text-primary-100'}`}>
                {item.text}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-primary-100 mb-4">User Testing Guide</h2>

        <div className="space-y-4">
          <div className="p-4 bg-primary-800 rounded-lg">
            <h3 className="font-semibold text-primary-100 mb-2">Setup</h3>
            <p className="text-sm text-primary-300">
              "I'd like you to try using this tool. I'm testing the tool, not you, so there are no
              wrong answers. Please think out loud as you use it."
            </p>
          </div>

          <div className="p-4 bg-primary-800 rounded-lg">
            <h3 className="font-semibold text-primary-100 mb-2">Task</h3>
            <p className="text-sm text-primary-300">
              "Your goal is to [realistic task that matches your user story]. Take your time and let
              me know if anything is confusing."
            </p>
          </div>

          <div className="p-4 bg-primary-800 rounded-lg">
            <h3 className="font-semibold text-primary-100 mb-2">Observation Points</h3>
            <ul className="text-sm text-primary-300 space-y-1 list-disc list-inside">
              <li>Do they understand what the tool does?</li>
              <li>Can they complete the primary task without help?</li>
              <li>Where do they hesitate or show confusion?</li>
              <li>What do they say out loud while using it?</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-primary-100 mb-4">Deployment Configuration</h2>

        <div className="space-y-4">
          {deploymentConfigs.map((config) => (
            <div key={config.platform} className="p-4 bg-primary-800 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-primary-100">{config.platform}</h3>
                  <p className="text-sm text-primary-400">{config.description}</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => downloadConfig(config.platform, config.config)}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
              <pre className="text-xs bg-primary-900 p-3 rounded mt-3 overflow-x-auto">
                <code className="text-primary-300">{config.config}</code>
              </pre>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-primary-100">CI/CD Pipeline Template</h2>
          <Button
            variant="ghost"
            onClick={() => {
              const blob = new Blob([cicdTemplate], { type: 'text/yaml' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'deploy.yml';
              a.click();
            }}
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        </div>

        <p className="text-sm text-primary-400 mb-4">
          GitHub Actions workflow for automated testing and deployment
        </p>

        <pre className="text-xs bg-primary-900 p-4 rounded overflow-x-auto">
          <code className="text-primary-300">{cicdTemplate}</code>
        </pre>
      </Card>

      <div className="p-6 bg-green-900/20 border border-green-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-green-300 mb-2">Ready to Ship?</h3>
            <p className="text-sm text-green-200 mb-3">
              Before deploying to production, make sure you've:
            </p>
            <ul className="text-sm text-green-200 space-y-1 list-disc list-inside">
              <li>Completed at least 80% of the validation checklist</li>
              <li>Tested with real users who match your persona</li>
              <li>Fixed all critical bugs</li>
              <li>Set up error monitoring and analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
