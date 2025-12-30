# Orbit Terminal Server

Backend server for Orbit Mission Control terminal and Gemini CLI integration.

## Features

- Express HTTP server with health check endpoint
- WebSocket server for real-time terminal communication
- PTY process management for Claude CLI and Gemini CLI
- Question flow system for Gemini-assisted document refinement
- Session management with automatic cleanup

## Prerequisites

- Node.js 18+
- Gemini CLI: `npm install -g @google/gemini-cli` (for Gemini terminal)
- Claude Code CLI: `npm install -g @anthropic-ai/claude-code` (for regular terminal)

## Installation

```bash
cd server
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=3001
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
```

## Running

### Development

```bash
npm run dev
```

This uses `tsx watch` for hot-reloading during development.

### Production

```bash
npm run build
npm start
```

## API

### HTTP Endpoints

- `GET /health` - Health check endpoint

### WebSocket

Connect to: `ws://localhost:3001`

See main project README for WebSocket message types.

## Architecture

- `src/index.ts` - Main server entry point
- `src/terminal.ts` - Regular terminal (Claude CLI) handler
- `src/geminiTerminal.ts` - Gemini CLI PTY management
- `src/geminiHandler.ts` - Gemini terminal message handlers
- `src/questionFlow.ts` - Question generation and flow
- `src/contextBuilder.ts` - Context building for Gemini
- `src/sessions.ts` - Session management
- `src/types.ts` - Type definitions

