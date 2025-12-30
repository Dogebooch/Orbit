/**
 * Gemini API client for AI-enhanced file generation
 */

export interface GeminiConfig {
  apiKey: string;
  model?: string;
}

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
      role: string;
    };
    finishReason: string;
  }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export interface EnhancementRequest {
  templateContent: string;
  projectContext: {
    name: string;
    description: string;
    vision?: {
      problem: string;
      targetUser: string;
      successMetrics: string;
    };
    userProfile?: {
      primaryUser: string;
      goal: string;
      technicalComfort: string;
    };
    techStack: {
      languages: string[];
      frameworks: string[];
    };
  };
  codebaseFiles?: {
    path: string;
    content: string;
  }[];
}

export interface EnhancementResult {
  enhancedContent: string;
  suggestions: string[];
  tokensUsed: number;
}

const DEFAULT_MODEL = 'gemini-1.5-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Gemini API client class
 */
export class GeminiClient {
  private apiKey: string;
  private model: string;

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || DEFAULT_MODEL;
  }

  /**
   * Generate content using Gemini API
   */
  async generateContent(prompt: string): Promise<string> {
    const url = `${API_BASE}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini');
    }

    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Enhance a project file template with AI suggestions
   */
  async enhanceProjectFile(request: EnhancementRequest): Promise<EnhancementResult> {
    const prompt = this.buildEnhancementPrompt(request);
    
    try {
      const response = await this.generateContent(prompt);
      return this.parseEnhancementResponse(response, request.templateContent);
    } catch (error) {
      console.error('Gemini enhancement failed:', error);
      // Return original content on failure
      return {
        enhancedContent: request.templateContent,
        suggestions: [],
        tokensUsed: 0,
      };
    }
  }

  /**
   * Build the prompt for file enhancement
   */
  private buildEnhancementPrompt(request: EnhancementRequest): string {
    const { templateContent, projectContext, codebaseFiles } = request;

    let prompt = `You are an expert software architect helping to enhance AI assistant configuration files.

## Task
Review and enhance the following project configuration file template. Add project-specific details, improve clarity, and ensure it provides the best guidance for AI assistants working on this project.

## Project Context
- **Name**: ${projectContext.name}
- **Description**: ${projectContext.description || 'Not provided'}
${projectContext.vision ? `
- **Problem Being Solved**: ${projectContext.vision.problem}
- **Target User**: ${projectContext.vision.targetUser}
- **Success Metrics**: ${projectContext.vision.successMetrics}
` : ''}
${projectContext.userProfile ? `
- **Primary User**: ${projectContext.userProfile.primaryUser}
- **User Goal**: ${projectContext.userProfile.goal}
- **Technical Comfort**: ${projectContext.userProfile.technicalComfort}
` : ''}
- **Tech Stack**: ${projectContext.techStack.languages.join(', ')} with ${projectContext.techStack.frameworks.join(', ')}

`;

    if (codebaseFiles && codebaseFiles.length > 0) {
      prompt += `## Codebase Analysis
Here are some key files from the project:

`;
      for (const file of codebaseFiles.slice(0, 5)) {
        prompt += `### ${file.path}
\`\`\`
${file.content.slice(0, 500)}${file.content.length > 500 ? '...' : ''}
\`\`\`

`;
      }
    }

    prompt += `## Current Template
\`\`\`
${templateContent}
\`\`\`

## Instructions
1. Enhance the template with project-specific details
2. Add any missing sections that would be valuable
3. Improve clarity and specificity where possible
4. Keep the same overall structure and format
5. Do NOT remove existing content, only enhance it

## Response Format
Respond with ONLY the enhanced file content, no explanations or markdown code blocks.
`;

    return prompt;
  }

  /**
   * Parse the enhancement response
   */
  private parseEnhancementResponse(
    response: string,
    originalContent: string
  ): EnhancementResult {
    // Clean up the response
    let enhancedContent = response.trim();
    
    // Remove markdown code blocks if present
    if (enhancedContent.startsWith('```')) {
      enhancedContent = enhancedContent.replace(/^```[\w]*\n/, '').replace(/\n```$/, '');
    }

    // Extract any suggestions that might be at the end
    const suggestions: string[] = [];
    const suggestionMatch = enhancedContent.match(/## Suggestions\n([\s\S]*?)$/);
    if (suggestionMatch) {
      const suggestionLines = suggestionMatch[1].split('\n').filter((line) => line.startsWith('-'));
      suggestions.push(...suggestionLines.map((line) => line.replace(/^-\s*/, '')));
      enhancedContent = enhancedContent.replace(/## Suggestions\n[\s\S]*$/, '').trim();
    }

    return {
      enhancedContent,
      suggestions,
      tokensUsed: 0, // Would need to extract from API response
    };
  }

  /**
   * Validate the API key by making a simple request
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.generateContent('Say "OK" if you can read this.');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get suggestions for improving a PRD or project documentation
   */
  async getSuggestions(content: string, type: 'prd' | 'vision' | 'userProfile'): Promise<string[]> {
    const prompts: Record<string, string> = {
      prd: `Review this PRD and suggest 3-5 specific improvements:

${content}

Respond with a numbered list of actionable suggestions.`,
      vision: `Review this project vision and suggest 3-5 ways to make it more specific and actionable:

${content}

Respond with a numbered list of actionable suggestions.`,
      userProfile: `Review this user profile and suggest 3-5 ways to make it more detailed and useful:

${content}

Respond with a numbered list of actionable suggestions.`,
    };

    try {
      const response = await this.generateContent(prompts[type] || prompts.prd);
      
      // Parse numbered list
      const lines = response.split('\n');
      const suggestions = lines
        .filter((line) => /^\d+\./.test(line.trim()))
        .map((line) => line.replace(/^\d+\.\s*/, '').trim());
      
      return suggestions;
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }
}

/**
 * Create a Gemini client instance
 */
export function createGeminiClient(apiKey: string): GeminiClient {
  return new GeminiClient({ apiKey });
}

/**
 * Check if an API key is configured
 */
export function isGeminiConfigured(apiKey?: string | null): boolean {
  return !!apiKey && apiKey.length > 20;
}

/**
 * Storage helpers for Gemini settings
 */
const GEMINI_SETTINGS_KEY = 'orbit_gemini_settings';

export interface GeminiSettings {
  apiKey: string | null;
  enableCodebaseAnalysis: boolean;
  model: string;
}

export function getGeminiSettings(): GeminiSettings {
  const stored = localStorage.getItem(GEMINI_SETTINGS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Ignore parse errors
    }
  }
  return {
    apiKey: null,
    enableCodebaseAnalysis: false,
    model: DEFAULT_MODEL,
  };
}

export function saveGeminiSettings(settings: Partial<GeminiSettings>): void {
  const current = getGeminiSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(GEMINI_SETTINGS_KEY, JSON.stringify(updated));
}

export function clearGeminiApiKey(): void {
  const current = getGeminiSettings();
  saveGeminiSettings({ ...current, apiKey: null });
}

