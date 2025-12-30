# AI Agent Instructions for Orbit

## Project Context
Orbit is a "Mission Control" web app that enforces a strategy-first workflow for AI-assisted development. The core philosophy: **"Context is King"** - Vision and User personas drive code decisions, not the other way around.

## Architecture Overview

### Stage-Based Workflow
The app enforces a linear stage progression ([App.tsx](../src/App.tsx#L1)):
1. **Vision** - Define problem, target user, success metrics ([VisionStage.tsx](../src/components/stages/VisionStage.tsx))
2. **Research** - Competitor analysis, market research ([ResearchStage.tsx](../src/components/stages/ResearchStage.tsx))
3. **Workbench** - Task execution with context clipping ([WorkbenchStage.tsx](../src/components/stages/WorkbenchStage.tsx))
4. **Testing** - Validation checklists ([TestingStage.tsx](../src/components/stages/TestingStage.tsx))
5. **Settings** - MCP server configurations ([SettingsStage.tsx](../src/components/stages/SettingsStage.tsx))

Each stage is a self-contained component. Current stage tracked in `projects.current_stage` in database.

### State Management
- **React Context API** - Two contexts only:
  - `AppContext` ([contexts/AppContext.tsx](../src/contexts/AppContext.tsx)) - user, project, stage
  - `TerminalContext` ([contexts/TerminalContext.tsx](../src/contexts/TerminalContext.tsx)) - terminal state, command history
- All contexts use Supabase for persistence, **never** localStorage
- Context updates trigger stage re-renders automatically

### Data Layer
- **Supabase only** - all persistence goes through [lib/supabase.ts](../src/lib/supabase.ts)
- Database schema in [supabase/migrations](../supabase/migrations)
- **RLS required** - every table has Row Level Security policies; users only access their own data
- Auto-save pattern: 2-second debounced saves on input changes (see [VisionStage.tsx](../src/components/stages/VisionStage.tsx#L177-L185))

## Critical Patterns

### Custom CSS Utilities ([index.css](../src/index.css))
Use pre-defined classes instead of inline Tailwind:
- Buttons: `.btn-primary`, `.btn-secondary`, `.btn-ghost`
- Inputs: `.input`, `.textarea`
- Cards: `.card`, `.card-hover`
- Labels: `.label`

Example:
```tsx
<button className="btn-primary">Save</button>
<input className="input" placeholder="Enter text" />
```

### Color Palette (Slate/Zinc)
From [tailwind.config.js](../tailwind.config.js#L5-L27):
- Primary: `primary-950` (background), `primary-100` (text), `primary-700` (interactive)
- Accent: `accent-800` (borders), `accent-900` (subtle backgrounds)
- Never use bright colors - this is a "quiet UI" design

### Auto-Save Implementation
Pattern used across Vision, Research, and Workbench stages:
```tsx
const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

const triggerAutoSave = useCallback(() => {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  const timeout = setTimeout(() => saveData(), 2000);
  setAutoSaveTimeout(timeout);
}, [autoSaveTimeout, saveData]);

// Trigger on every input change
onChange={() => triggerAutoSave()}
```

### Component Organization
```
src/components/
  auth/       - AuthForm, AuthGuard (Supabase auth)
  layout/     - Sidebar, ProjectSelector (shell components)
  stages/     - Main stage components
    vision/   - Substage components (GuidedSetup, MarkdownEditor)
    research/ - researchConfig.ts defines sections
    strategy/ - GuidedPRD component
    workbench/- TaskBoard, TerminalPanel
  terminal/   - Terminal UI components (command input, output, settings)
  ui/         - Reusable Button, Card, Input (export from index.ts)
```

### Database Type Safety
Types defined in [lib/supabase.ts](../src/lib/supabase.ts#L11-L113):
```tsx
type Database = {
  public: {
    Tables: {
      projects: { Row: {...}, Insert: {...}, Update: {...} }
      // ... other tables
    }
  }
}
```

When querying, TypeScript infers types:
```tsx
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('project_id', projectId);
// data is Task[] automatically
```

## Development Workflows

### Running the App
```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Production build
npm run typecheck    # TypeScript validation
npm run lint         # ESLint checks
```

### Environment Setup
Required in `.env` (Vite format):
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```
Access via `import.meta.env.VITE_*` ([lib/supabase.ts](../src/lib/supabase.ts#L3-L4))

### Adding New Database Tables
1. Create migration in `supabase/migrations/`
2. Add RLS policies in same migration file
3. Update type definitions in [lib/supabase.ts](../src/lib/supabase.ts)
4. Run migration via Supabase CLI or dashboard

### Creating New Stages
1. Create component in `src/components/stages/`
2. Add route case in [App.tsx](../src/App.tsx#L34-L48) `renderStage()`
3. Add navigation in [Sidebar.tsx](../src/components/layout/Sidebar.tsx)
4. Update `current_stage` field logic in database

## Common Gotchas

### Supabase RLS Policies
When users can't see their data, check:
1. RLS is enabled on table (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
2. Policy exists for operation (`CREATE POLICY ... FOR SELECT/INSERT/UPDATE`)
3. Policy uses `auth.uid() = user_id` check

### TypeScript Strict Mode
- All components use functional patterns, no classes
- Props interfaces required for all components
- Use `type` for single objects, `interface` for extensible types
- Supabase types use discriminated unions (Row/Insert/Update)

### Vite Import Paths
- Use relative imports for components: `../../contexts/AppContext`
- Use `import.meta.env` for env vars, not `process.env`
- Assets in `public/` accessible at `/filename`

### Terminal Simulation
The terminal ([TerminalPanel.tsx](../src/components/workbench/TerminalPanel.tsx)) is **simulated** - it doesn't execute real commands. It's a placeholder for the future Electron desktop version. Commands are stored in `terminal_commands` table.

## Testing Checklist
- Verify RLS policies prevent cross-user data access
- Test responsive design (mobile sidebar collapses)
- Validate all forms show error states
- Check dark theme contrast meets accessibility standards
- Ensure auto-save doesn't lose data on rapid inputs

## Future Architecture Notes
- Terminal integration requires Electron for real shell access
- File system operations currently use Supabase instead of local files
- TaskMaster AI integration is manual (copy/paste workflow)
- No real-time collaboration yet (Supabase real-time not enabled)
