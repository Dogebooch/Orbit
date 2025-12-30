# Orbit - Mission Control for AI Development

A comprehensive "Mission Control" desktop application for developers using AI. This app bridges rapid prototyping (Bolt.new) and robust engineering (VS Code + AI assistants) by enforcing a strategy-first workflow where context drives code.

## Philosophy: "Context is King"

Most AI workflows fail because the model forgets the **Why** (Vision) and **Who** (User) while focusing on the **How** (Code). This app enforces a workflow where Strategy is the "Source of Truth" that drives the Code.

## Features

### 🎯 Stage 1: Foundation (Vision & User)
- **Vision Board**: Define your project's problem, target user, success metrics, and rationale
- **User Persona Builder**: Create detailed user profiles with technical comfort, frustrations, and goals
- **Export to Markdown**: Generate `0_vision.md` and `1_user_profile.md` files
- **Validation**: Ensures complete foundation before moving forward

### 📋 Stage 2: Strategy (Tasks & PRD)
- **PRD Editor**: Write and maintain your Product Requirements Document with markdown support
- **Visual Task Board**: Create, organize, and track tasks with status management
- **Task Generation Guide**: Instructions for integrating TaskMaster AI
- **Auto-save**: All changes are automatically saved to Supabase

### 💻 Stage 3: Workbench (Build & Code)
- **Context Clipper**: One-click copy of complete project context for AI assistants
  - Includes: Current task + Vision + User profile + Guidelines
- **Command Library**: Searchable collection of prompt templates
  - Code review, testing, refactoring, optimization prompts
  - Custom prompt creation and favorites
- **Active Task Display**: Always see what you're working on
- **Terminal Placeholder**: Ready for integrated terminal in desktop version

### 🚀 Stage 4: Testing & Deployment
- **Interactive Validation Checklist**: Track testing progress with visual completion meter
- **User Testing Guide**: Step-by-step instructions for validating with real users
- **Deployment Configurations**: Ready-to-use configs for Vercel, Netlify, Railway
- **CI/CD Templates**: GitHub Actions workflow for automated deployment

### ⚙️ Settings & MCP Integration
- **MCP Server Hub**: Complete guide to Model Context Protocol servers
  - TaskMaster AI for project management
  - Memory Server for user preferences
  - Filesystem Server for file operations
  - Brave Search for latest documentation
  - Codebase Index for large projects
- **One-Click Configuration**: Copy JSON snippets for easy setup
- **Installation Guide**: Step-by-step instructions for each server

## Tech Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** with custom Slate/Zinc dark theme
- **Lucide React** for beautiful, consistent icons
- **React Context API** for state management

### Backend & Data
- **Supabase** for:
  - PostgreSQL database with Row Level Security (RLS)
  - Authentication (email/password)
  - Real-time data synchronization
  - Secure API endpoints

### Design System
- **Dark Theme**: Custom Slate/Zinc palette for reduced eye strain
- **Quiet UI**: Minimal, professional aesthetic
- **Responsive**: Works on desktop and tablet devices
- **Accessible**: Proper contrast ratios and keyboard navigation

## Database Schema

The app uses a comprehensive Supabase schema:

- **projects**: Project metadata and current stage tracking
- **visions**: Problem statements and project vision
- **user_profiles**: Target user personas and requirements
- **tasks**: Project tasks with status and priority
- **prds**: Product requirements documents
- **prompts**: User's custom prompt library
- **settings**: User preferences and configuration

All tables have:
- Row Level Security (RLS) enabled
- Policies ensuring users only access their own data
- Automatic timestamps for created_at and updated_at
- Proper foreign key relationships

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (database is pre-configured)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment variables are already configured** in `.env`:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

### First-Time Setup

1. **Sign up** for an account (email + password)
2. **Create a project** using the project selector
3. **Complete the Foundation stage** (Vision & User Profile)
4. **Progress through stages** linearly for best results

## Project Structure

```
src/
├── components/
│   ├── auth/              # Authentication components
│   ├── layout/            # Sidebar, ProjectSelector
│   ├── stages/            # Main stage components
│   │   ├── VisionStage.tsx
│   │   ├── StrategyStage.tsx
│   │   ├── WorkbenchStage.tsx
│   │   ├── TestingStage.tsx
│   │   └── SettingsStage.tsx
│   └── ui/                # Reusable UI components
├── contexts/              # React Context providers
├── lib/                   # Supabase client and types
├── App.tsx               # Main application component
├── main.tsx              # Application entry point
└── index.css             # Global styles and Tailwind

```

## Workflow

The Vibe Coding workflow follows a linear progression:

1. **Foundation** → Define your project vision and target user
2. **Strategy** → Break down into PRD and tasks
3. **Workbench** → Build with AI assistants using context clipping
4. **Testing** → Validate and prepare for deployment

Each stage builds on the previous one, ensuring your AI assistants always have the necessary context to generate appropriate code.

## Key Features Explained

### Context Clipping
The Context Clipper aggregates:
- Your current active task
- Project vision and success metrics
- User persona and technical comfort level
- Coding guidelines and constraints

This comprehensive context can be pasted into:
- GitHub Copilot
- Claude Code
- ChatGPT
- Any AI coding assistant

### Auto-Save
All form inputs auto-save to Supabase:
- Vision and user profile data
- PRD content
- Tasks and their statuses
- Custom prompts

No need to manually save - your work is always protected.

### Project Switching
Work on multiple projects simultaneously:
- Switch between projects instantly
- Each project maintains its own context
- Stage progress is tracked per project

## Future Enhancements

### Desktop Version (Electron)
The architecture is designed for easy "ejection" to Electron:
- Integrated terminal with xterm.js + node-pty
- Direct file system operations
- Native notifications
- System tray integration

### Planned Features
- Export entire project to markdown files
- Import existing project files
- Collaboration features (share projects with team)
- AI-powered vision validation
- Integration with TaskMaster AI CLI
- VS Code extension for syncing

## Development

### Running Tests
```bash
npm test
```

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

## Contributing

This is a production-ready application built for developers who use AI coding assistants. Contributions are welcome!

## License

MIT

## Acknowledgments

Based on the comprehensive "Vibe Coding" methodology by Michał Gołębiowski, which emphasizes strategy-first development with AI assistants.

## Support

For issues, questions, or feature requests, please check the documentation or reach out to the development team.

---

**Built with ❤️ for developers who vibe code.**
