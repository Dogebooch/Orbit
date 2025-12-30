/**
 * Config Generator for MCP and TaskMaster configuration files
 * 
 * Generates:
 * - .mcp.json for Claude Code MCP servers
 * - .taskmaster/config.json for TaskMaster AI configuration
 */

export interface McpServerConfig {
  type: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface McpJson {
  mcpServers: Record<string, McpServerConfig>;
}

export interface TaskmasterModelConfig {
  provider: string;
  modelId: string;
  maxTokens: number;
  temperature: number;
}

export interface TaskmasterConfig {
  models: {
    main: TaskmasterModelConfig;
    research: TaskmasterModelConfig;
    fallback: TaskmasterModelConfig;
  };
  global: {
    logLevel: string;
    debug: boolean;
    defaultSubtasks: number;
    defaultPriority: string;
    projectName: string;
    ollamaBaseURL: string;
    bedrockBaseURL: string;
    userId: string;
    defaultTag: string;
  };
}

/**
 * Generate .mcp.json configuration for Claude Code
 */
export function generateMcpJson(projectPath: string): string {
  const config: McpJson = {
    mcpServers: {
      "taskmaster-ai": {
        type: "stdio",
        command: "npx",
        args: ["-y", "--package=task-master-ai", "task-master-ai"]
      },
      "filesystem": {
        type: "stdio",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", projectPath]
      },
      "memory": {
        type: "stdio",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-memory"]
      }
    }
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Generate TaskMaster config.json
 */
export function generateTaskmasterConfig(projectName: string): string {
  const config: TaskmasterConfig = {
    models: {
      main: {
        provider: "claude-code",
        modelId: "sonnet",
        maxTokens: 64000,
        temperature: 0.2
      },
      research: {
        provider: "claude-code",
        modelId: "opus",
        maxTokens: 32000,
        temperature: 0.1
      },
      fallback: {
        provider: "claude-code",
        modelId: "sonnet",
        maxTokens: 64000,
        temperature: 0.2
      }
    },
    global: {
      logLevel: "info",
      debug: false,
      defaultSubtasks: 5,
      defaultPriority: "medium",
      projectName: projectName,
      ollamaBaseURL: "http://localhost:11434/api",
      bedrockBaseURL: "https://bedrock.us-east-1.amazonaws.com",
      userId: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      defaultTag: "master"
    }
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Generate both config files as a single downloadable archive
 */
export function generateConfigBundle(projectPath: string, projectName: string): {
  mcpJson: string;
  taskmasterConfig: string;
} {
  return {
    mcpJson: generateMcpJson(projectPath),
    taskmasterConfig: generateTaskmasterConfig(projectName),
  };
}

/**
 * Download a file to the user's computer
 */
export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download MCP config file
 */
export function downloadMcpJson(projectPath: string): void {
  const content = generateMcpJson(projectPath);
  downloadFile(content, '.mcp.json');
}

/**
 * Download TaskMaster config file
 */
export function downloadTaskmasterConfig(projectName: string): void {
  const content = generateTaskmasterConfig(projectName);
  downloadFile(content, 'config.json');
}

/**
 * Download all config files
 */
export function downloadAllConfigs(projectPath: string, projectName: string): void {
  downloadMcpJson(projectPath);
  setTimeout(() => {
    downloadTaskmasterConfig(projectName);
  }, 100);
}

/**
 * Write config file via WebSocket (backend server)
 * Returns a promise that resolves when the write is confirmed
 */
export function writeConfigViaWebSocket(
  wsClient: { send: (data: unknown) => void },
  relativePath: string,
  content: string
): void {
  wsClient.send({
    type: 'config:writeFile',
    relativePath,
    content,
  });
}

/**
 * Create directory via WebSocket (backend server)
 */
export function createDirViaWebSocket(
  wsClient: { send: (data: unknown) => void },
  relativePath: string
): void {
  wsClient.send({
    type: 'config:createDir',
    relativePath,
  });
}

/**
 * Write all config files via WebSocket
 */
export function writeAllConfigsViaWebSocket(
  wsClient: { send: (data: unknown) => void },
  projectPath: string,
  projectName: string
): void {
  // Create .taskmaster directory first
  createDirViaWebSocket(wsClient, '.taskmaster');
  
  // Write .mcp.json at project root
  writeConfigViaWebSocket(wsClient, '.mcp.json', generateMcpJson(projectPath));
  
  // Write TaskMaster config
  writeConfigViaWebSocket(wsClient, '.taskmaster/config.json', generateTaskmasterConfig(projectName));
}

