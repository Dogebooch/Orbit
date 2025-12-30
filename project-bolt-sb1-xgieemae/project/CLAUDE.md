# Project Guidelines for Claude

## Project Overview
Orbit - Mission Control for AI Development - A comprehensive desktop application that helps developers maintain strategic context throughout AI-assisted development. The app enforces a workflow where Vision and User personas drive code decisions.

## Target User
Developers who use AI coding assistants (Copilot, Claude Code, ChatGPT) and want to maintain context consistency throughout their development lifecycle. They move between rapid prototyping (Bolt.new) and production code (VS Code).

## Technical Stack
- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS (custom Slate/Zinc dark theme)
- Icons: Lucide React
- Backend: Supabase (PostgreSQL + Auth + Real-time)
- State: React Context API

## Coding Standards
- Use TypeScript for all new files
- Follow functional component patterns in React
- Use custom CSS utility classes defined in index.css (btn, input, card, etc.)
- Keep components focused and single-responsibility
- Mobile-first responsive design
- Dark theme by default (Slate/Zinc palette)

## Architecture Principles
- Components are organized by feature (auth, layout, stages, ui)
- Each stage is a self-contained component
- Use Supabase for all data persistence
- Real-time updates via Supabase subscriptions
- Row Level Security (RLS) on all database tables

## Design Philosophy
- "Quiet UI" aesthetic - minimal, professional, not flashy
- Slate/Zinc color palette for reduced eye strain
- Clear visual hierarchy with typography and spacing
- Consistent 8px spacing system
- Soft shadows instead of hard borders
- Smooth transitions for all interactive elements

## Security Requirements
- NEVER expose authentication credentials
- All database tables must have RLS enabled
- Users can only access their own data
- Input validation on all forms
- Secure password requirements (handled by Supabase)

## Testing Requirements
- Test all user workflows end-to-end
- Verify RLS policies prevent unauthorized access
- Test responsive design on mobile and desktop
- Validate all forms handle errors gracefully

## Constraints
- Must work in browser (Bolt.new compatible)
- Desktop features (terminal, file system) are placeholders for now
- Keep bundle size reasonable (<500KB for main bundle)
- Support modern browsers only (no IE)
- Supabase is the only allowed backend

## AI Instructions

### When Modifying UI Components
- Always maintain the dark Slate/Zinc theme
- Use existing CSS utility classes from index.css
- Follow the card-based layout pattern
- Ensure sufficient contrast for accessibility
- Add loading states for async operations

### When Working with Database
- Always use Supabase client from lib/supabase.ts
- Never bypass RLS policies
- Use TypeScript types from Database type definition
- Handle errors gracefully with user-friendly messages
- Auto-save form inputs to prevent data loss

### When Adding New Features
- Follow the stage-based workflow (Vision → Strategy → Workbench → Testing)
- Maintain the "Context is King" philosophy
- Ensure new features integrate with existing context clipping
- Update relevant markdown export functionality
- Consider mobile responsiveness from the start

### Problem Solving Approach
- Start with the simplest solution that works
- Only add complexity when specifically requested
- Highlight potential issues or edge cases
- Suggest testing approaches for new features
- Ask clarifying questions if requirements are ambiguous

## Current Implementation Status
✅ Database schema with RLS policies
✅ Authentication system (email/password)
✅ Project management and switching
✅ Vision & User Profile stage (Stage 1)
✅ Strategy & Task Management stage (Stage 2)
✅ Workbench with Context Clipper (Stage 3)
✅ Testing & Deployment stage (Stage 4)
✅ Settings & MCP Integration hub
✅ Responsive dark-themed UI
✅ Auto-save functionality
✅ Integrated terminal with xterm.js + node-pty backend
✅ Real-time file watching with chokidar
✅ TaskMaster AI auto-sync (tasks.json)

## Known Limitations
- File system operations use Supabase instead of local files
- No real-time collaboration features yet
- No export to local markdown files (only clipboard copy)
- Terminal backend must be running locally for real command execution

## Future Enhancements Planned
- Electron desktop version for native installation
- Direct file system operations (read/write markdown files)
- Real-time collaboration features
- VS Code extension for context syncing
- AI-powered vision validation

## Communication Guidelines
- Be concise and direct in explanations
- Focus on what was accomplished, not how
- Suggest improvements but don't implement without approval
- Flag breaking changes or major architectural decisions
- Provide code examples when explaining complex concepts
