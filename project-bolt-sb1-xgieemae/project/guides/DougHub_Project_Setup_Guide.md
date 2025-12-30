# DougHub Project Setup Guide
*A Unified Workflow for AI-Assisted Development*

<a id="overview"></a>
## Overview

This guide takes you from idea to active development using a pipeline where each tool handles what it does best. The goal is to eliminate decision-making during coding sessions by front-loading all the thinking into structured documents that AI tools can consume.

The pipeline flows in one direction: your brain dumps become foundation docs, Bolt/Dyad turns those into real code, Copilot analyzes that code to understand what actually exists, Claude synthesizes everything into project guidelines and a PRD, TaskMaster breaks the PRD into executable tasks, and then you enter a simple daily loop of picking tasks and building.

<a id="the-full-pipeline"></a>
## The Full Pipeline

| Step | Output |
|------|--------|
| Your brain | Foundation docs (vision, user profile, metrics, research) |
| Bolt.new / Dyad | Working scaffold with your stack choices baked in |
| Copilot | AI instructions describing actual code patterns |
| Claude | CLAUDE.md + PRD synthesized from all inputs |
| TaskMaster | Parsed PRD becomes dependency-aware task backlog |
| Claude Code | Daily build loop until MVP complete |

---

<a id="phase-1-foundation-documents"></a>
# Phase 1: Foundation Documents

These documents capture your thinking before any code exists. Spend 30-60 minutes writing these before touching any code. The key is being specific rather than generic.

<a id="purpose-framework"></a>
## Purpose Framework

Before writing any document, answer these three questions:
**Note:** When going through these, stop thinking about solutions—think about purpose and results. This is critical at this stage.

1. **What problem is this solving?** Be specific. "Make invoicing easier" is vague. "Allow small business owners to generate and send invoices in under 2 minutes without accounting software" is clear.
   - *Why this matters:* This becomes the Problem section of your vision doc. Claude uses it to evaluate whether features actually solve your stated problem or are scope creep.

2. **What change do I want to see?** Focus on the outcome, not the features. "Users can complete task X 10x faster" vs. "Users have a dashboard".
   - *Why this matters:* This shapes your Core Insight and feeds into success metrics. It's how you'll know the product is working.

3. **Is it worth solving with software?** Could this be solved with a spreadsheet, existing tool, or manual process?
   - *Why this matters:* If the answer is "maybe," you'll waste weeks building something nobody needs. This question forces intellectual honesty before you invest time.

**Pro tip:** Challenge your assumptions. After writing your initial vision, paste it into Claude (any interface) and ask:

```
Challenge this project idea with 5 hard questions. Help me identify potential flaws or missing pieces.
```

This forces you to surface gaps before coding starts, saving hours of rework later.

<a id="required-documents"></a>
## Required Documents

<a id="vision.md"></a>
### 0_vision.md

**What it is:** A single-page document that defines why the product exists, what problem it solves, and what's in/out of scope for MVP.

**Why you need it:** This document gets consumed twice:
- **Phase 6 (PRD):** You'll paste it directly into Claude to generate your PRD
- **Phase 8 (Daily Build):** You'll reference it when Claude suggests features or you're tempted to add scope

Without clear scope boundaries, AI-assisted development drifts fast. Claude will happily build features you never asked for. The vision doc is your "no" list.

**Template (Roman Pichler's Product Vision Board, adapted for AI development):**

This template is widely used in agile product management. It forces you to define target users and their needs before jumping to features.

```markdown
# Project Vision

## Vision Statement
[One sentence: FOR [target user] WHO [has this problem], [Product Name]
is a [category] THAT [key benefit]. UNLIKE [alternatives], our product
[key differentiator].]

## Problem
[Specific problem you're solving. Be concrete—what pain point triggers
someone to need this?]

## Core Insight
[The key realization that shapes your solution. What do you understand
about this problem that others miss?]

## Target User
[Who specifically will use this? Not "developers" but "junior developers
at startups who don't have time to read documentation."]

## MVP Scope
[What you ARE building first. List 3-5 concrete capabilities.]

## Out of Scope (MVP)
[What you are NOT building yet. Be explicit—this is your "no" list when
Claude suggests features.]

## Technical Stack
[Your chosen technologies. Locks in decisions so Claude doesn't suggest
alternatives mid-build.]

## Anti-Patterns
[What to avoid. Design approaches, UX patterns, or technical choices
that conflict with your goals.]
```

**How to fill it out:**

1. Start with the Problem section—everything else flows from this
2. Write the Vision Statement last (it's a summary)
3. Be aggressive with Out of Scope—you can always add things later
4. Anti-Patterns should include things that sound good but don't fit your user (e.g., "No complex dashboards—user is exhausted post-shift")

**Create a "Realign to Vision" prompt:** Save this to your prompt library (e.g., `.claude/commands/realign.md`) for use when development starts drifting:

```markdown
# Vision Realignment Check

I need you to pause and realign with the project vision before proceeding.

## Current Vision
[Paste your 0_vision.md contents here]

## Realignment Tasks
1. **Scope check:** Review what you're about to build/suggest. Does it
   fall within MVP Scope, or is it in Out of Scope?

2. **Problem alignment:** Does this feature/change directly address the
   core Problem statement? If it's "nice to have" but doesn't solve the
   stated problem, flag it.

3. **Anti-pattern check:** Does this approach violate any listed
   Anti-Patterns?

4. **Complexity audit:** For the target user in their stated context,
   does this add decision points or cognitive load? If yes, simplify or
   defer.

5. **Decision:** Based on the above, should we:
   - Proceed as planned
   - Modify the approach
   - Defer to post-MVP
   - Abandon entirely

Explain your reasoning, then wait for my confirmation before continuing.
```

<a id="user_profile.md"></a>
### 1_user_profile.md

**What it is:** A detailed character sketch of your primary user—not a marketing persona, but a specific person with habits, frustrations, and context that affect how they'll use your product.

**Why you need it:** Claude makes thousands of micro-decisions during development: naming conventions, error messages, default settings, interaction patterns. Without a concrete user, Claude defaults to "generic tech user"—which may be completely wrong for your audience.

The user profile gets used in three ways:
- **Phase 6 (PRD Generation):** Claude uses it to write user stories that reflect real workflows, not theoretical ones
- **Phase 7 (TaskMaster):** Complexity analysis considers user context when breaking down tasks
- **Phase 8 (Daily Build):** When Claude suggests UX patterns, it should match your user's technical comfort and mental state

**The key insight:** "Context helps frame the understanding—the more context, the broader the picture we can illuminate." Generic descriptions like "business users" lead to generic UX. Specific descriptions like "exhausted resident post-12-hour-shift with zero tolerance for admin work" lead to UX decisions that actually fit.

**Template (adapted from UX persona best practices):**

```markdown
# User Profile

## Identity
- **Name:** [Give them a name—it makes discussions concrete]
- **Role:** [Specific role, not generic]
- **One-liner:** [Single sentence that captures their situation]

## Context
- **When:** [When will they use this? Time of day, frequency, triggers]
- **Where:** [Environment—device, location, distractions present]
- **State:** [Mental/physical state when using the product]

## Goals & Motivations
[What are they trying to accomplish? What does success look like to them?]

## Frustrations & Pain Points
[What slows them down? What makes them abandon tools? What triggers
anxiety or avoidance?]

## Technical Comfort
- **Comfortable with:** [What they can handle without friction]
- **Uncomfortable with:** [What causes them to stop or seek help]

## Behavioral Patterns
[How do they typically approach tasks? Do they read instructions or dive
in? Do they prefer keyboard shortcuts or clicking? Do they customize
tools or use defaults?]

## Core Conflict
[The fundamental tension they face—the reason they need your product but
also the reason existing solutions fail them]

## Job Statement
"When [specific situation], I want to [specific action], so that
[specific outcome]."
```

**How to fill it out:**

If the user is you:
- Be brutally honest about your limitations and frustrations
- Describe your worst-case state (tired, distracted, impatient)—the product should work even then
- Include specific details that sound embarrassing ("I will abandon any tool that requires more than 2 clicks to start")

If the user is someone else:
- Interview 2-3 real people, or use detailed observation
- Focus on behaviors, not aspirations ("what do you actually do" vs "what do you wish you did")
- Include direct quotes where possible

**What makes a good user profile:**
- **Specific:** You can tell if someone is this user or not
- **Behavioral:** Focuses on what they do, not demographics
- **Contextual:** Captures the situation, not just the person
- **Wiggle-able:** You can ask "would this user do X?" and get a meaningful answer

**Anti-patterns to avoid:**
- "Users want an intuitive interface" (everyone wants this—it's meaningless)
- Demographics without behavior ("35-year-old professional")
- Aspirational descriptions ("power user who maximizes productivity")

**Create a "User Context" prompt:** Save this to your prompt library (e.g., `.claude/commands/user-context.md`):

```markdown
# User Context Injection

Before proceeding with this task, internalize the following user context.
All design decisions, UX patterns, naming conventions, and feature
suggestions should be evaluated against this user's reality.

## User Profile
[Paste your 1_user_profile.md contents here]

## How to Apply This Context

1. **Complexity filter:** Before suggesting any feature or interaction,
   ask: "Would this user, in their stated context and mental state,
   actually use this?" If the answer is "probably not," simplify or cut.

2. **Language check:** Use terminology this user would use. Avoid jargon
   they'd find confusing. Match their technical comfort level.

3. **Default decisions:** When choosing defaults, choose what this user
   would want 80% of the time. Don't make them configure things.

4. **Friction audit:** Every click, decision point, or text input is
   friction. For this user, is each friction point justified by the
   value it provides?

5. **Failure mode:** When this user makes a mistake (and they will),
   what's the graceful recovery? Design for their worst state, not their
   best.

Confirm you've internalized this context, then proceed with the task.
```

**When to use this prompt:**

| Phase | When to Use |
|-------|-------------|
| Phase 6 (PRD) | Already embedded—user profile is pasted into PRD generation prompt |
| Phase 7 (TaskMaster) | Use when asking Claude to analyze task complexity or break down features |
| Phase 8 (Daily Build) | Use at session start when working on UI/UX tasks, or when Claude's suggestions feel "off" for your user |
| Any time | When Claude suggests something that feels wrong but you can't articulate why—re-inject user context |

**Example usage in Phase 8:**

You're implementing a settings panel and Claude suggests a tabbed interface with 15 configuration options. You use the User Context prompt, and Claude reassesses: "Given this user's state (exhausted, zero tolerance for admin work), a tabbed interface with 15 options violates the friction audit. Recommend: 3 essential settings visible, everything else hidden under 'Advanced' that 90% of users never touch."

<a id="success_metrics.md"></a>
### 2_success_metrics.md

**What it is:** A document that defines what "working" means in concrete, measurable terms. It specifies your target quality level and the specific criteria you'll use to validate the product.

**Why you need it:** Without explicit success criteria, Claude optimizes for generic "good software" rather than your specific goals. If you need 90% accuracy on PDF processing, Claude should know that—it affects architecture decisions, error handling approaches, and feature priorities.

The success metrics get used in two ways:
- **Phase 6 (PRD Generation):** Metrics feed into acceptance criteria for user stories, ensuring tasks have clear "done" definitions
- **Phase 8 (Daily Build):** When evaluating implementation approaches, Claude can optimize for your specific performance/quality targets

**Choose your target level first:**

- **Proof of concept:** Demonstrates core functionality, may have rough edges. Good for: validating technical feasibility.
- **MVP:** Minimally viable product that real users can test. Good for: getting feedback before investing more time.
- **Polished demo:** Ready for presentation or investor demo. Good for: securing buy-in or funding.
- **Production ready:** Can handle real users and edge cases. Good for: actual deployment.

**Template:**

```markdown
# Success Metrics

## Target Level
[Proof of concept / MVP / Polished demo / Production ready]

## Core Success Criteria
| Metric | Target | Why It Matters | How to Measure |
|--------|--------|----------------|----------------|
| [Metric 1] | [Specific number] | [What breaks if missed] | [Test method] |
| [Metric 2] | [Specific number] | [What breaks if missed] | [Test method] |

## Performance Requirements
- Response time: [target, e.g., "<200ms for search"]
- Throughput: [target, e.g., "handle 100 cards without lag"]
- Reliability: [target, e.g., "zero data loss on crash"]

## User Experience Thresholds
- Time to complete core task: [target, e.g., "<20 seconds"]
- Clicks/steps required: [target, e.g., "max 3 clicks to capture"]
- Error recovery: [target, e.g., "undo available for all actions"]

## Validation Checklist
- [ ] [Specific testable outcome]
- [ ] [Performance threshold met]
- [ ] [User can complete X without Y]
- [ ] [Edge case handled: ...]
```

**How to fill it out:**

1. Start with your target level—this sets expectations for everything else
2. For each metric, include "Why It Matters"—this helps Claude understand tradeoffs (e.g., "if search takes >200ms, user loses flow state")
3. Be specific with numbers, not adjectives ("fast" means nothing; "<200ms" means something)
4. Include edge cases in the validation checklist—these often get skipped

**Create a "Success Criteria" prompt:** Save this to your prompt library (e.g., `.claude/commands/success-criteria.md`):

```markdown
# Success Criteria Injection

Before implementing this feature, internalize the following success
criteria. All architecture decisions, error handling approaches, and
implementation choices should be evaluated against these targets.

## Success Metrics
[Paste your 2_success_metrics.md contents here]

## How to Apply These Criteria

1. **Architecture filter:** Before choosing an implementation approach,
   ask: "Does this approach make it possible to hit the performance
   targets?" If a simple approach meets targets, prefer it over a
   complex one.

2. **Tradeoff decisions:** When facing tradeoffs (speed vs. accuracy,
   features vs. simplicity), use these metrics to decide. The metrics
   tell you what matters most.

3. **Edge case priority:** The validation checklist shows which edge
   cases must be handled for MVP vs. which can be deferred.

4. **Testing approach:** When implementing, also describe how you'd
   test against these specific metrics.

5. **"Good enough" calibration:** The target level (MVP/demo/production)
   tells you when to stop polishing. MVP doesn't need production-level
   error handling.

Confirm you've internalized these criteria, then proceed with
implementation. Flag if any proposed approach would make a target
impossible to hit.
```

**When to use this prompt:**

| Phase | When to Use |
|-------|-------------|
| Phase 6 (PRD) | Already embedded—metrics are pasted into PRD generation prompt |
| Phase 7 (TaskMaster) | Use when breaking down tasks to ensure subtasks include performance requirements |
| Phase 8 (Daily Build) | Use when starting implementation of performance-critical features, or when choosing between implementation approaches |
| Code review | Use when evaluating whether an implementation is "done" |

**Example usage in Phase 8:**

You're implementing search functionality. Claude suggests using a simple array filter. You inject the Success Criteria prompt, which includes "<200ms search latency with 1000+ cards." Claude reassesses: "Array filter won't scale to 1000 cards within 200ms. Recommend: SQLite FTS (full-text search) or pre-built index. Here's the tradeoff..."

<a id="competitive-research-document"></a>
### 3_competitive_research.md

**What it is:** A structured analysis of 3-5 existing tools that solve similar problems to yours. It captures what works, what doesn't, and specific UI/UX patterns worth borrowing or avoiding.

**Why you need it:** Claude works significantly better when it understands the solution space you're operating in. Without competitive context, Claude invents UI patterns from scratch—often poorly. With research, Claude can combine the best elements of existing tools while avoiding their mistakes.

The research document gets used in two ways:
- **Phase 6 (PRD Generation):** Informs feature priorities and UX decisions in user stories
- **Phase 8 (Daily Build):** Provides concrete reference points when implementing UI ("make it like Tool A's sidebar, but simpler")

**How to do the research (30 minutes):**

1. Identify 3-5 tools that solve similar problems (direct competitors, adjacent solutions, or tools that handle part of your workflow)
2. Actually use each tool for 5-10 minutes—don't just read about them
3. Take screenshots of UI patterns you like or dislike
4. Document specific observations, not vague impressions

**Template:**

```markdown
# Competitive Research

## Tool 1: [Name]
**What it does well:**
- [Specific strength with detail]
- [UI pattern worth borrowing]

**What it does poorly:**
- [Specific weakness]
- [Friction point or confusion]

**Key insight:** [One sentence summary of what to learn]

**Screenshots:** [Attach or describe specific screens]

## Tool 2: [Name]
[Same structure...]

## Tool 3: [Name]
[Same structure...]

## Synthesis

### Patterns to Borrow
- [Specific pattern] from [Tool] because [reason]
- [Specific pattern] from [Tool] because [reason]

### Patterns to Avoid
- [Anti-pattern] seen in [Tool] because [reason]
- [Anti-pattern] seen in [Tool] because [reason]

### Opportunity Gap
[What none of these tools do well that you could solve]
```

**Create a "Research Context" prompt:** Save this to your prompt library (e.g., `.claude/commands/research-context.md`):

```markdown
# Research Context Injection

Before designing this interface or feature, internalize the following
competitive research. Use these insights to make informed design
decisions rather than inventing patterns from scratch.

## Competitive Research
[Paste your competitive research document here]

## How to Apply This Research

1. **Pattern matching:** When implementing a UI element, first check if
   any analyzed tool has a good solution. Reference it explicitly:
   "Similar to Tool A's approach, but simplified for our user."

2. **Anti-pattern avoidance:** Before finalizing any design, check the
   "Patterns to Avoid" list. If your approach resembles a documented
   anti-pattern, reconsider.

3. **Opportunity gaps:** When making design tradeoffs, consider whether
   your choice addresses the identified opportunity gap. That's your
   differentiator.

4. **Screenshot reference:** If screenshots are attached, reference them
   directly: "Use a layout similar to Screenshot 2, but with [specific
   modification] for our user context."

5. **Synthesis over copying:** Don't copy any single tool. Combine the
   best elements: "Tool A's speed + Tool B's visual design + neither's
   complexity."

Confirm you've reviewed this research, then proceed with the design.
When presenting options, explain how each relates to the competitive
landscape.
```

**When to use this prompt:**

| Phase | When to Use |
|-------|-------------|
| Phase 6 (PRD) | Already embedded—research is pasted into PRD generation prompt |
| Phase 8 (Daily Build) | Use when starting any UI/UX task, designing new screens, or when Claude's UI suggestions feel generic |
| Design decisions | Use when choosing between layout options or interaction patterns |
| Feature scoping | Use when deciding what to include vs. exclude—research shows what competitors prioritize |

**Example usage in Phase 8:**

You're implementing the main capture interface. Claude suggests a multi-step wizard with 5 screens. You inject the Research Context prompt, which includes "Tool B: Fast but lacks templates—key insight: speed matters more than features for capture." Claude reassesses: "Given the research emphasis on speed, a 5-step wizard contradicts the pattern. Recommend: single-screen capture like Tool B, but with Tool A's visual polish. Here's a mockup..."

**Pro tip on screenshots:** Even simple sketches or wireframes help Claude understand your visual intent better than text descriptions. When uploading screenshots:
- Reference them specifically: "Use a layout similar to Screenshot 2 but adapted for [your specific use case]"
- Annotate what you like: "I want the sidebar from this screenshot, but not the header"
- Include both good and bad examples: "Screenshot 3 shows what NOT to do—too cluttered"

---

<a id="phase-2-bolt-bootstrap"></a>
# Phase 2: Bootstrap Your Codebase

<a id="why-this-matters"></a>
## Why This Matters

**Critical:** Never let Claude Code scaffold a project from scratch. It wastes tokens on boilerplate and often makes inconsistent foundational choices. Using Bolt.new or Dyad gives you a working codebase with your stack decisions already implemented—routing, component structure, database connections, styling setup.

**Bolt.new vs Dyad:**
- **Bolt.new:** More mature, better for complex apps, uses tokens (paid)
- **Dyad:** Free alternative, good for simpler projects, lightweight
- Both output the same thing: a working scaffold you can download

<a id="minimum-stack-requirements"></a>
## Recommended Stack

| Feature | Recommended |
|---------|-------------|
| Framework | Next.js / Electron |
| UI Components | React + Shadcn UI |
| Type Checks | TypeScript |
| CSS Library | TailwindCSS (AI works better with it) |
| Linter/Formatter | ESLint + Prettier |
| State Management | Zustand |

<a id="what-to-do"></a>
## What To Do

1. Go to **Bolt.new** or **Dyad** and describe your app in natural language
2. Include your stack preferences explicitly (framework, styling, database)
3. Describe the main screens you need
4. Download the generated project as a zip file
5. Extract to your working directory
6. Run the dev server and verify it starts

**Example prompt for Bolt/Dyad:**
```
Build a task management app with:
- Framework: Next.js 14 with TypeScript
- Styling: TailwindCSS + Shadcn UI
- Database: SQLite with Drizzle ORM
- Main screens: Dashboard, Task List, Task Detail, Settings
- Dark mode support
```

---

<a id="phase-3-setup-project-guidelines"></a>
# Phase 3: Setup Project Guidelines

<a id="phase-3-copilot"></a>
## 3.1: Generate Copilot AI Instructions

**Why this matters:** Copilot's "Generate AI Instructions" feature analyzes your actual codebase and produces a document describing what it found—frameworks detected, file organization patterns, coding conventions inferred. This is based on real code, not aspirations about what the code might be.

**What to do:**

1. Open your Bolt/Dyad-generated project in VS Code with GitHub Copilot installed
2. Open the Copilot Chat panel
3. Find and run "Generate AI Instructions" (in chat menu or command palette)
4. Save the output to `.github/copilot-instructions.md`
5. Read through what it generated to understand your codebase's actual patterns

**What you're getting:** A ground-truth document about your codebase written by an AI that actually looked at the files. When you feed this to Claude later, Claude isn't guessing about your project structure.

<a id="phase-3-claude-md"></a>
## 3.2: Generate CLAUDE.md

**What this step does:** After you've created your foundation documents and scaffolded your codebase, you can generate a CLAUDE.md file by combining all your inputs into a single prompt. This ensures consistency and saves time versus writing it manually.

### What is CLAUDE.md?

**What it is:** A project-specific instruction file that Claude Code automatically loads into every conversation. It's your persistent context—the rules, standards, and constraints that Claude should follow throughout development.

**Why you need it:** Without CLAUDE.md, every Claude Code session starts fresh. You'd have to re-explain your tech stack, coding standards, and project constraints every time. CLAUDE.md solves this by giving Claude persistent awareness of your project's rules.

**How it differs from foundation docs:**
- Foundation docs (vision, user, metrics) define *what* you're building and *why*
- CLAUDE.md defines *how* Claude should work on this specific codebase
- Foundation docs get pasted into prompts when needed; CLAUDE.md is always present

### What to Include in CLAUDE.md

| Section | Purpose | Where It Comes From |
|---------|---------|---------------------|
| Project Overview | Quick context for Claude | Summarize from 0_vision.md |
| Target User | Who Claude is building for | Summarize from 1_user_profile.md |
| Technical Stack | Locks in technology decisions | From Bolt/Dyad scaffold + your choices |
| Coding Standards | How code should be written | Your preferences + team standards |
| Architecture Principles | Structural decisions | Your preferences |
| AI Instructions | How Claude should behave | What works for your workflow |
| Constraints | Hard limits Claude must respect | Project-specific limitations |

### CLAUDE.md Template

```markdown
# Project Guidelines for Claude

## Project Overview
[2-3 sentences from your vision doc. What is this? What problem does it
solve? Keep it brief—Claude will reference this constantly.]

## Target User
[1-2 sentences summarizing your user profile. Mental state, technical
comfort, key constraints. This shapes every UX decision Claude makes.]

## Technical Stack
- Frontend: [Framework + styling, e.g., "Next.js 14 + Tailwind CSS"]
- Backend: [If applicable, e.g., "Node.js API routes"]
- Database: [Your choice, e.g., "SQLite for local development"]
- Deployment: [Target platform, e.g., "Vercel"]
- Key Libraries: [Important dependencies, e.g., "FSRS for spaced repetition"]

## Coding Standards
- Use TypeScript for all new files
- Follow functional component patterns in React
- Add comments for complex business logic
- No external dependencies without explicit approval
- [Add your own standards here]

## Architecture Principles
- Keep components small and focused (<200 lines)
- Separate business logic from UI components
- Use consistent error handling patterns
- [Add your own principles here]

## File Organization
[Describe your project structure if it's non-obvious]
- /components - Reusable UI components
- /lib - Business logic and utilities
- /app - Next.js routes and pages

## AI Instructions
- Always explain architectural decisions before implementing
- Ask clarifying questions if requirements are ambiguous
- Suggest improvements but don't implement without approval
- Generate complete, working code blocks (no placeholders)
- Start with the simplest solution that works
- When in doubt, ask rather than assume

## Constraints
- [Hard limits, e.g., "Must work offline for core features"]
- [Platform constraints, e.g., "Desktop only, no mobile support in MVP"]
- [Performance requirements, e.g., "All interactions must feel instant (<200ms)"]
- [Scope boundaries, e.g., "No user accounts or cloud sync in MVP"]
```

### How to Fill Out CLAUDE.md

1. **Start after Bolt/Dyad scaffold:** You need a real codebase before CLAUDE.md makes sense. The Technical Stack section should reflect what actually exists, not aspirations.
2. **Pull from foundation docs:** Project Overview and Target User are summaries—don't copy entire documents, extract the essential context Claude needs for every decision.
3. **Be specific in Coding Standards:** "Write clean code" is useless. "Use TypeScript, functional components, and add comments for business logic" is actionable.
4. **Constraints are your guard rails:** These are things Claude should *never* do without asking. If you have hard limits (offline-first, no external APIs, desktop-only), state them explicitly.
5. **Iterate as you learn:** CLAUDE.md is a living document. When Claude repeatedly makes mistakes, add a rule to prevent it. When a rule causes friction, remove it.

**Common mistakes:**
- Too vague: "Use best practices" (which ones?)
- Too long: Claude will ignore walls of text. Keep it scannable.
- Out of sync: CLAUDE.md says React but you're using Vue—Claude gets confused
- Missing constraints: Claude adds a dependency you didn't want because you never said not to

### CLAUDE.md Generation Prompt

**What you need:**
- Your foundation docs (0_vision.md, 1_user_profile.md, 2_success_metrics.md)
- Your competitive research document
- The copilot-instructions.md you just generated from your actual codebase

Use this prompt in Claude (web interface or API). Paste your documents where indicated:

```
You are an expert at creating CLAUDE.md files for AI-assisted development
projects. Generate a CLAUDE.md file based on the following inputs.

## Inputs

### Vision Document
[Paste your 0_vision.md here]

### User Profile
[Paste your 1_user_profile.md here]

### Success Metrics
[Paste your 2_success_metrics.md here]

### Competitive Research
[Paste your competitive research document here]

### Copilot AI Instructions (Codebase Analysis)
[Paste your copilot-instructions.md here]

## Instructions

Generate a CLAUDE.md file that:

1. **Project Overview**: Synthesize a 2-3 sentence summary from the vision
   document. Focus on what problem this solves and for whom.

2. **Target User**: Extract the essential user context from the user profile.
   Include mental state, technical comfort, and key constraints that should
   shape UX decisions. Keep to 1-2 sentences.

3. **Technical Stack**: Use the Copilot analysis as ground truth for what
   actually exists in the codebase. List frontend, backend, database,
   deployment target, and key libraries.

4. **Coding Standards**: Infer coding standards from the Copilot analysis
   (detected patterns, conventions). Add standards that align with the
   user's technical comfort level.

5. **Architecture Principles**: Based on the codebase analysis and project
   constraints, define 3-5 architecture principles.

6. **File Organization**: Document the actual project structure from the
   Copilot analysis.

7. **AI Instructions**: Create instructions that help Claude:
   - Respect the user's cognitive constraints (from user profile)
   - Stay within scope boundaries (from vision doc)
   - Meet success criteria (from metrics)
   - Follow established patterns (from Copilot analysis)

8. **Constraints**: Extract hard limits from:
   - Out of Scope items in vision doc
   - Anti-patterns in vision doc
   - Performance requirements in success metrics
   - User limitations in user profile

9. **Testing Requirements**: Based on success metrics, define what testing
   is needed.

Output the complete CLAUDE.md file in markdown format, ready to save to
the project root.
```

**After generating:**

1. Review the output for accuracy—especially Technical Stack (should match your actual codebase)
2. Add any project-specific rules Claude missed
3. Remove anything too verbose—CLAUDE.md should be scannable
4. Save to your project root as `CLAUDE.md`
5. Commit to version control

**Example workflow:**

```bash
# You have these files ready:
docs/0_vision.md
docs/1_user_profile.md
docs/2_success_metrics.md
docs/3_competitive_research.md
.github/copilot-instructions.md

# Paste them all into the generation prompt
# Review and save output to project root
CLAUDE.md
```

<a id="phase-3-permissions"></a>
## 3.3: Configure Tool Permissions

**What this is:** Claude Code has access to powerful tools (file reading, file writing, bash commands, web fetching, MCP integrations). By default, it asks permission before using most of them. Tool curation lets you pre-approve safe operations so Claude can work faster, while blocking dangerous ones.

**Why beginners should care:** Without configuration, Claude will interrupt you constantly asking "Can I run npm test?" or "Can I edit this file?" Pre-approving common operations removes friction. Blocking dangerous operations (like rm -rf or reading .env files) adds safety.

### Core Tool Types

| Tool | What It Does | Notes |
|------|--------------|-------|
| Read | Read file contents | Also affects LS, Glob, Grep |
| Edit | Modify existing files | Deny Edit also denies Write |
| Write | Create new files | Deny Write does NOT deny Edit |
| Bash | Execute shell commands | Most powerful, most dangerous |
| WebFetch | Fetch URL contents | Can specify allowed domains |
| WebSearch | Search the web | Adds results to context |
| MCP tools | External integrations | Format: mcp__server__tool |

### Configuration Locations

Claude Code checks settings in this order (later overrides earlier):

| Priority | File | Scope |
|----------|------|-------|
| 1 (lowest) | ~/.claude/settings.json | User (all projects) |
| 2 | .claude/settings.json | Project (shared, commit to git) |
| 3 | .claude/settings.local.json | Project (personal, gitignored) |
| 4 | CLI flags | Session only |
| 5 (highest) | managed-settings.json | Enterprise (cannot be overridden) |

For beginners, use `.claude/settings.json` in your project root.

### Important: How Permissions Are Checked

1. **Deny rules are checked first** — if denied, action is blocked
2. **Allow rules are checked second** — if allowed, action proceeds
3. **Otherwise** — Claude asks for permission

**Critical nuances:**
- **Read deny ≠ Write deny:** Denying Read(.env*) does NOT prevent writing to .env files. Add both if you want full protection.
- **Edit deny = Write deny:** Denying Edit also blocks Write, but denying Write does NOT block Edit.
- **Some bash commands run without asking:** Commands like ls, pwd, echo, whoami may run without prompting (in a sandbox). This is by design for read-only operations.

### Starter Configuration for Beginners

Create `.claude/settings.json` in your project root:

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Edit",
      "Write(src/**)",
      "Write(docs/**)",
      "Bash(npm run *)",
      "Bash(npm test *)",
      "Bash(npm install *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git add *)",
      "Bash(git commit *)"
    ],
    "deny": [
      "Read(.env*)",
      "Read(**/.env)",
      "Read(**/secrets/**)",
      "Edit(.env*)",
      "Write(.env*)",
      "Bash(rm -rf *)",
      "Bash(sudo *)",
      "Bash(git push *)",
      "Bash(git reset --hard *)"
    ]
  }
}
```

**What this config does:**
- **Allows:** Reading all files, editing files, writing to src/ and docs/, running npm scripts, safe git operations
- **Denies:** Reading AND writing environment files, destructive commands, sudo, auto-pushing (review pushes manually)

### Permission Syntax

```
ToolName              # All uses of tool
ToolName(*)           # Same as above (wildcard)
ToolName(pattern)     # Only matching uses
```

**Bash patterns:**
- `Bash(git status)` — Exact match only
- `Bash(git *)` — All git commands
- `Bash(git commit:*)` — git commit with any arguments
- `Bash(npm run test:*)` — npm run test:unit, test:e2e, etc.

**File path patterns:**
- `Write(src/**)` — Anywhere in src/ directory (recursive)
- `Read(.env*)` — .env, .env.local, .env.production
- `Edit(*.config.js)` — Any file ending in .config.js

**WebFetch patterns:**
- `WebFetch(domain:example.com)` — Only example.com (not subdomains)
- Note: Wildcards don't work for domains. *.example.com won't match.

### Interactive Permission Management

Instead of editing JSON, use these methods:

**During a session:**
- When Claude asks permission, click **"Always allow"** to add to allowlist
- Use `/permissions` command to view and modify

**From command line:**

```bash
/permissions                    # View current permissions
/permissions add Edit           # Allow file editing
/permissions add Bash(git *)    # Allow git commands
```

### Recommended Workflow for Beginners

1. **Start with the starter config** above
2. **Add permissions as needed:** When Claude asks for something safe, click "Always allow"
3. **Review periodically:** Check .claude/settings.json and tighten overly broad permissions
4. **Never auto-allow:**
   - rm -rf or rm -r (data loss)
   - sudo (privilege escalation)
   - git push (review before pushing)
   - curl | sh or wget | sh (remote code execution)

### Common Patterns by Project Type

**Node.js/React:**
```json
"allow": ["Bash(npm *)", "Bash(npx *)", "Bash(node *)"]
```

**Python:**
```json
"allow": ["Bash(python *)", "Bash(pip install *)", "Bash(pytest *)"]
```

**Git (conservative):**
```json
"allow": ["Bash(git status)", "Bash(git diff *)", "Bash(git log *)",
          "Bash(git add *)", "Bash(git commit *)"],
"deny": ["Bash(git push *)", "Bash(git reset --hard *)"]
```

### Warning: YOLO Mode

The `--dangerously-skip-permissions` flag bypasses ALL permission checks. **Do not use this** unless:
- You're in an isolated container without internet access
- You have proper safeguards (timeouts, max turns)
- You fully understand the risks (data loss, system corruption, exfiltration)

There was a real-world attack in August 2025 where a compromised npm package used Claude Code to exfiltrate .env files. Proper deny rules would have mitigated this.

### References

- **Official settings docs:** https://docs.anthropic.com/en/docs/claude-code/settings
- **Anthropic best practices:** https://www.anthropic.com/engineering/claude-code-best-practices
- **Security deep dive:** https://www.petefreitag.com/blog/claude-code-permissions/

---

<a id="phase-4-optional-custom-commands"></a>
# Phase 4 (Optional): Custom Slash Commands

Store reusable prompts in `.claude/commands/` folder. You can also leverage bash tools and other command-line utilities by instructing Claude to use them.

**File:** `.claude/commands/test.md`
**Usage:** Type `/test user authentication system` in Claude Code.

**Why This Helps:** These commands become Claude's "working memory"—ensuring consistency across sessions and preventing common mistakes from recurring.

You can skip this phase initially and add commands as you discover patterns you want to reuse.

---

<a id="phase-5-generate-prd"></a>
# Phase 5: Generate PRD

<a id="why-this-matters-prd"></a>
## Why This Matters

With your CLAUDE.md generated in Phase 3, you now create the PRD that TaskMaster will use to generate your task list.

<a id="step-0-functional-requirements"></a>
## Step 0: Generate Functional Requirements (Optional but Recommended)

Before generating the full PRD, ask Claude to synthesize concise functional requirements.

**File:** `.claude/commands/reqs.md`
**Usage:** `/reqs`

**Content:**
```markdown
I would like to create concise functional requirements for the following application:
[Brief description]

My Requirements:
- [Paste contents of 0_vision.md]
- [Paste contents of 1_user_profile.md]

Output as markdown code.
```

<a id="prd-generation-prompt"></a>
## PRD Generation Prompt

Use this prompt in Claude (web interface) to generate your PRD.

**Important:** This is where your foundation documents get consumed. Open each file and paste its full contents into the prompt where indicated. The vision file defines scope boundaries, user profile shapes UX decisions, and metrics define success criteria—Claude uses all of this to generate targeted user stories and requirements.

**Prompt:**

```
You are an expert technical product manager specializing in feature
development and creating comprehensive PRDs.

Generate a detailed PRD based on these inputs:

- Vision: [paste 0_vision.md]
- User: [paste 1_user_profile.md]
- Metrics: [paste 2_success_metrics.md]
- Copilot Analysis: [paste copilot-instructions.md]

Include these sections:

1. Introduction
2. Product Overview
3. Goals and Objectives
4. Target Audience
5. Features and Requirements
6. User Stories and Acceptance Criteria
7. Technical Requirements / Stack
8. Design and User Interface

For user stories:
- Assign unique IDs (ST-101, ST-102...)
- Include primary, alternative, and edge-case scenarios
- Make each story testable
- Include acceptance criteria

Output as markdown.
```

**Save the PRD to:** `scripts/prd.txt`

---

<a id="phase-6-taskmaster-setup"></a>
# Phase 6: TaskMaster Setup

<a id="why-this-matters-taskmaster"></a>
## Why This Matters

TaskMaster is an MCP server that turns your PRD into a managed task list with dependencies, complexity analysis, and subtask breakdown. It gives Claude Code persistent awareness of what needs building and what order to build it in.

**TaskMaster vs Claude Code Plan Mode:** Plan mode is only useful for one task at a time. TaskMaster manages entire projects with dependencies, complexity tracking, and persistent context across sessions.

<a id="configuration-files"></a>
## Configuration Files

### .taskmaster/config.json

```json
{
  "models": {
    "main": {
      "provider": "claude-code",
      "modelId": "sonnet",
      "maxTokens": 64000,
      "temperature": 0.2
    },
    "research": {
      "provider": "claude-code",
      "modelId": "opus",
      "maxTokens": 32000,
      "temperature": 0.1
    },
    "fallback": {
      "provider": "claude-code",
      "modelId": "sonnet",
      "maxTokens": 64000,
      "temperature": 0.2
    }
  },
  "global": {
    "logLevel": "info",
    "debug": false,
    "defaultSubtasks": 5,
    "defaultPriority": "medium",
    "projectName": "YourProject",
    "ollamaBaseURL": "http://localhost:11434/api",
    "bedrockBaseURL": "https://bedrock.us-east-1.amazonaws.com",
    "userId": "1234567890",
    "defaultTag": "master"
  }
}
```

### .mcp.json (project root)

```json
{
  "mcpServers": {
    "taskmaster-ai": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"],
      "env": {}
    }
  }
}
```

<a id="setup-steps"></a>
## Setup Steps

**Orbit Accelerator:** Run the included setup script to generate your prompt library automatically.
```bash
python setup_orbit.py
```

1. Initialize git and commit your Bolt scaffold plus all documents

```bash
git init && git add . && git commit -m "Bolt scaffold + foundation docs"
```

2. Create the config files shown above
3. Start Claude Code from your project directory

```bash
claude
```

4. Parse your PRD

```
I have a PRD at scripts/prd.txt. Can you parse it and set up initial tasks?
```

5. Analyze complexity

```
Can you analyze the complexity of our tasks to identify which need breakdown?
```

6. Break down high-complexity tasks

```
Can you help me break down all of the high complexity tasks?
```

<a id="known-issue-json-parsing-error"></a>
## Known Issue: JSON Parsing Error

Claude Code may encounter this error when parsing large PRDs:

```
taskmaster-ai:parse_prd Error: Unterminated string in JSON at position 14000
```

**Workaround:** Use Cursor (or another AI tool) to generate initial tasks from the PRD, then switch back to Claude Code for implementation.

---

<a id="phase-7-daily-build-loop"></a>
# Phase 7: The Overseer Build Loop

<a id="the-core-loop"></a>
## The Core Loop (Overseer Workflow)

In this workflow, you act as the **Bridge**. Claude is the **Architect/PM** who manages the plan. GitHub Copilot is the **Developer** who writes the code. This saves tokens and keeps you in control.

1. **Start Session**
   Start Claude Code in your project directory.
   **Usage:** `/start`

2. **View Tasks**
   Check the current status of the project.
   **Usage:** `/tasks`

3. **Select Task**
   Ask Claude which task is next based on dependencies.
   **Usage:** `/next`

4. **Generate Copilot Brief**
   Ask Claude to write a detailed "ticket" or prompt for Copilot.
   **Usage:** `/brief [Task ID]`
   *Claude will generate a context-rich prompt containing requirements, constraints, and file paths.*

5. **Implement with Copilot**
   - Copy the brief generated by Claude.
   - Switch to VS Code (Copilot Chat or Composer).
   - Paste the brief.
   - Verify and apply the changes in your editor.

6. **Architectural Audit**
   Ask Claude to review Copilot's work against the PRD and constraints.
   **Usage:** `/review`

7. **Commit**
   **Usage:** `/git-commit`
   *Repeat.*

<a id="when-you-start-drifting"></a>
## When You Start Drifting

During the build loop, Claude will suggest features and you'll be tempted to add scope. This is where your vision file earns its keep.

**Signs you're drifting:**
- Claude suggests something that sounds useful but wasn't in your plan
- You think "it would be cool if..."
- A task is taking way longer than expected because scope expanded
- You're building something you can't trace back to a user story
- Claude's UX suggestions feel "off" but you can't articulate why

**What to do:**

1. Open `0_vision.md` and check against these sections:
   - **MVP Scope** — Is this feature listed? If not, it waits.
   - **Out of Scope** — Is it explicitly deferred? Then it's a no.
   - **Anti-Patterns** — Does this approach violate your principles?

2. If still unsure, use your realign prompt (from Phase 1) to force Claude to justify the work against your vision.

3. If Claude's UX decisions feel wrong for your user, re-inject user context using the User Context prompt (from Phase 1). This regrounds Claude in who you're building for.

**Example:** Claude suggests adding a graph view for knowledge connections. You check Out of Scope: "Picture editor, PDF annotation, graph view, gamification, mobile." Graph view is listed. Answer is no—add it to a post-MVP backlog if you want, but don't build it now.

**Example (UX drift):** Claude suggests a settings panel with 12 toggles. It's technically in scope, but feels wrong. You re-inject the User Context prompt. Claude reassesses against your user's "zero tolerance for admin work" state and simplifies to 3 essential settings with smart defaults.

---

<a id="phase-8-testing-and-validation"></a>
# Phase 8: Testing and Validation

You have a working prototype. Now verify it actually solves the problem you defined in Phase 1. This requires a two-layer approach: Technical functionality + Real-world usefulness.

<a id="layer-1-functional-testing"></a>
## Layer 1: Functional Testing (Does it work?)

### Automated Testing with Claude's Help

Use this prompt to generate a test suite.

**File:** `.claude/commands/test-gen.md`
**Usage:** `/test-gen`

**Content:**
```markdown
Please create comprehensive tests for the current application:
- Unit tests for core business logic functions
- Integration tests for the main user workflows
- Error handling tests for edge cases
- Performance tests for file processing

Use [your preferred testing framework] and include both positive and negative test cases.
```

### Manual Testing Checklist

Verify these items manually before release.

#### Core Functionality
- [ ] Happy path works end-to-end
- [ ] Each feature works in isolation
- [ ] Error states display appropriately

#### Cross-Platform Compatibility
- [ ] Works on desktop browsers (Chrome, Firefox, Safari)
- [ ] Functions properly on mobile devices
- [ ] Responsive design adapts correctly

#### Performance Testing
- [ ] Loads within acceptable time limits
- [ ] Handles expected data volumes

<a id="layer-2-user-validation"></a>
## Layer 2: User Validation (Does it solve the problem?)

Get the app in front of 1-3 actual users.

### User Testing Script Template

**File:** `docs/user_testing_script.md`

1. **Introduction:** "I'm testing a new tool for [problem]. I'm going to ask you to complete a few tasks. Please think aloud as you go."
2. **Tasks:**
   - Task 1: [Core workflow]
   - Task 2: [Secondary workflow]
3. **Debrief:** "What was most frustrating? What was most helpful?"

### Analyzing User Feedback with Claude

Use this prompt to turn observations into action.

**File:** `.claude/commands/analyze-feedback.md`
**Usage:** `/analyze-feedback`

**Content:**
```markdown
Based on user testing, here's what I observed:

User 1:
[Specific behaviors and comments]

User 2:
[Specific behaviors and comments]

Common patterns:
- [Issue that multiple users hit]
- [Unexpected user behavior]

Please analyze this feedback and suggest:
- Critical UX improvements needed
- Changes to improve user success rate
```

**The Goal:** Confidence that your application solves the intended problem for real users, with acceptable technical quality.

---

# REFERENCE SECTIONS

The sections below are reference material you'll use throughout development. You don't need to read them linearly—bookmark them and refer back as needed.

---

<a id="effective-prompting-patterns"></a>
# Reference: Effective Prompting Patterns

**Core Principle:** Each conversation round should bring you closer to your intended outcome through strategic refinement. Vibe Coding means iterating not just code, but the prompts themselves into increasingly effective instructions.

<a id="opening-context-start-each-major-session"></a>
## Opening Context (Start Each Major Session)

**File:** `.claude/commands/start.md`
**Usage:** `/start`

**Content:**
```markdown
Context:

Project: [Brief description from vision doc]
User: [User profile summary]
Current goal: [What you want to accomplish this session]
Files to consider: [Specific files if relevant]

Task: [Specific, actionable request]

Please ask any clarifying questions before starting.
```

<a id="the-specification-pattern"></a>
## The Specification Pattern

Use this for new features to ensure all constraints are met.

**File:** `.claude/commands/spec.md`
**Usage:** `/spec`

**Content:**
```markdown
## Feature Specification: [Feature Name]

### User Story
As a [user type], I want to [action] so that [benefit].

### Acceptance Criteria
- [ ] [Specific testable requirement]
- [ ] [Performance requirement]
- [ ] [Edge case handling]

### Technical Requirements
- [Implementation constraints]
- [Integration points]

### Out of Scope
- [What NOT to build]
```

<a id="the-options-pattern"></a>
## The Options Pattern

Use this when you're not sure about implementation details.

**File:** `.claude/commands/options.md`
**Usage:** `/options`

**Content:**
```markdown
I need to implement [specific feature]. Please analyze these requirements and suggest 3 approaches:

**Requirements:**
[List specific needs]

For each approach, explain:
- Implementation complexity
- User experience impact
- Maintenance considerations
- Pros and cons

I'll choose one and you can implement it.
```

<a id="context-aware-modifications"></a>
## Context-Aware Modifications

Use this for refactoring or small changes.

**File:** `.claude/commands/mod.md`
**Usage:** `/mod`

**Content:**
```markdown
Looking at the current [component/file], I need to:
- [Specific change 1]
- [Specific change 2]

Please modify the existing code while maintaining the current patterns and style.
```

<a id="prompt-evolution-examples"></a>
## Prompt Evolution Examples

**Level 1 (Too vague):** "Build a user authentication system."
*Problem: Too vague, Claude will make many assumptions.*

**Level 2 (Better):** "Build a user authentication system with: Email/password registration and login, JWT-based sessions, Password reset functionality, Input validation and error handling."
*Better, but still missing context.*

**Level 3 (Optimal):**
```
Context: Building a B2B invoice tool for small business owners who need quick, secure access.

Task: Implement user authentication with:
- Email/password registration and login
- JWT-based sessions (7-day expiry)
- Password reset via email
- Client-side validation with clear error messages
- Mobile-first responsive design

Constraints:
- Use existing design system (Tailwind classes)
- Follow security best practices
- Keep forms simple (max 3 fields per step)
- No social login for MVP

Please implement the registration flow first, then ask before proceeding to login.
```

---

<a id="taskmaster-prompt-recipes"></a>
# Reference: TaskMaster Prompt Recipes

**Pro Tip:** Save these prompts to your `.claude/commands/` folder so you can use them as slash commands (e.g., `/task-add`) during development.

<a id="initialize-taskmaster"></a>
## Initialize TaskMaster

**File:** `.claude/commands/task-init.md`
**Usage:** `/task-init`
**Content:**
```
I have a PRD at scripts/prd.txt. Can you parse it and set up initial tasks?
```

<a id="analyze-complexity"></a>
## Analyze Complexity

**File:** `.claude/commands/task-analyze.md`
**Usage:** `/task-analyze`
**Content:**
```
Can you analyze the complexity of our tasks to identify which need breakdown?
```

<a id="break-down-tasks"></a>
## Break Down High Complexity

**File:** `.claude/commands/task-breakdown.md`
**Usage:** `/task-breakdown`
**Content:**
```
Can you help me break down all of the high complexity tasks?
```

<a id="add-a-new-task"></a>
## Add a New Task

```
Let's add a new task. We should implement sorting of the timeline.

Here are the requirements:
- you should be able to sort the timeline by date
- a dropdown should be available to select the sorting direction
- the sorting should be persisted when a new page is loaded
```

<a id="change-direction-of-a-task"></a>
## Change Direction of a Task

```
There should be a change in the image generation task.

Can you update task 3 with this and set it back to pending?

The image generation should use gpt-image-1 as the model.
```

<a id="deprecate-a-task"></a>
## Deprecate a Task

```
Task 8 is not needed anymore. You can remove it.
```

<a id="break-down-individual-task"></a>
## Break Down Individual Task

```
Task 3 seems complex. Can you break it down into subtasks?
```

---

<a id="copilot-handoff-prompts"></a>
# Reference: Copilot Handoff Prompts

## The Copilot Brief

Use this to generate the instructions for GitHub Copilot.

**File:** `.claude/commands/brief.md`
**Usage:** `/brief`

**Content:**
```markdown
I am about to implement the next task using GitHub Copilot.
Please analyze Task [Task ID/Description] and generate a comprehensive prompt I can paste into Copilot Chat.

The prompt should include:
1. **Context:** A summary of what we are building.
2. **Requirements:** The specific acceptance criteria for this task.
3. **Constraints:** Relevant technical constraints from CLAUDE.md.
4. **Files:** The list of files that likely need to be created or modified.
5. **Implementation Strategy:** A high-level pseudo-code or logic guide.

Format the output as a code block so I can easily copy it.
```

## The Technical Advisor

Use this for open-ended discussion, brainstorming, or mentorship.

**File:** `.claude/commands/advisor.md`
**Usage:** `/advisor`

**Content:**
```markdown
I need your architectural advice, opinion, or mentorship on a topic.
I am NOT asking for code implementation yet, but for high-level guidance.

**Topic:** [Describe your question]

Please provide:
1. Analysis of the concepts.
2. Options for our specific context.
3. Trade-offs (Pros/Cons).
4. Recommendation.
```

---

<a id="code-review-checklist"></a>
# Reference: Code Review and Quality Control

Don't accept everything blindly. You're still the architect.

## Review Checklist for Claude's Output

Before accepting code, verify:

**1. Version Control Safety:**
```bash
# After each working feature
git add .
git commit -m "feat: Add PDF upload component with drag-drop"

# Before major changes
git tag v0.1 -m "Working file upload"
```

**2. Quality Check:**
- Does it follow your coding standards?
- Are there obvious security issues?
- Is it overengineered for your needs?
- Does it match your user experience goals?
- Can you understand and maintain this code?

## Unified Code Review Prompt (Architectural Audit)

Use this to have Claude audit Copilot's work.

**File:** `.claude/commands/review.md`
**Usage:** `/review`

**Content:**
```markdown
I have implemented the task using GitHub Copilot. Please review the current codebase changes against these challenges:

1. **Requirements:** Does the implementation fully meet the task requirements?
2. **Architecture:** Does it follow our defined patterns and constraints?
3. **Robustness:** Are edge cases handled?
4. **Security:** Are there any security vulnerabilities?

If issues are found, list them clearly so I can feed them back to Copilot. If it looks good, confirm the task is complete.
```

**Goal of this Phase:** A working prototype that demonstrates your core value proposition and sets the foundation for iterative improvement.

---

<a id="pro-tips"></a>
# Reference: Pro Tips

## 1. Add Extra Context to Task Runs

When prompting for the next task, provide additional context on UI preferences, API docs, or attach images. This guides Claude on the path you want.

## 2. Break Down Large Files

AI struggles with files over 500 lines. Use this prompt:

```
Break down this file into logical modules so it's easier to read.
Create directories if needed and move utils and interfaces to
separate files, maintaining a domain-driven file structure.
```

## 3. Bugs Are Tasks

For bugs requiring architectural changes, create a task instead of letting Claude apply surface fixes:

```
The filter feature is not working as expected.

Create a new task to fix it:
- the filter should be case insensitive
- it should work with pagination
- it should work with the debounce
```

## 4. Commit Frequently

Claude Code doesn't have automatic checkpointing. Commit after completing each task to avoid losing work.

## 5. Start Fresh Sessions When...

- Switching to a completely different feature
- The conversation gets too long (20+ exchanges)
- You want to change technical direction significantly
- The current session is making repetitive mistakes

---

<a id="critical-best-practices"></a>
# Reference: Critical Best Practices

## Foundation-First Approach

Before opening Claude Code, write your `0_vision.md`, `1_user_profile.md`, and `CLAUDE.md`. This investment pays off in every subsequent interaction.

## Prompt Engineering Excellence

Use structured prompts (Context, Task, Constraints) and break down complex features into incremental stages. Never rely on one-shot prompting for complex logic.

## Session and Context Management

Start new chat sessions for new features to avoid context overload. If the conversation gets too long or Claude starts making repetitive mistakes, reset the context.

## Quality Control

**You are the architect.** Review every output. Challenge Claude to simplify, justify dependencies, and handle edge cases. Don't accept code you don't understand.

---

<a id="critical-pitfalls-to-avoid"></a>
# Reference: Critical Pitfalls to Avoid

## Foundational Mistakes

- **Wandering prompts:** Starting without clear goals leads to feature creep
- **Vague user definition:** "For business users" leads to generic UX. Be specific.
- **Skipping foundation docs:** Without vision/user/metrics, Claude makes random assumptions

## Technical Pitfalls

- **Over-engineering from the start:** Ask for "the simplest solution that works" first
- **Ignoring code quality:** After major features, ask Claude to refactor and clean up
- **Not using version control:** Git is your safety net. Commit frequently.
- **Letting Claude scaffold from scratch:** Always use Bolt/Dyad or similar for initial setup

## Process Pitfalls

- **Accepting first output:** The magic happens in iteration rounds 2-3
- **Using Claude like Google:** It's a collaborator, not a search engine. Guide the conversation.
- **Building without user validation:** Get real users to try your prototype early

---

<a id="when-to-restart-the-process"></a>
# Reference: When to Restart the Process

- **Significant pivot** (different user, different problem) → Go back to Phase 1
- **Tech stack change** → Go back to Phase 2 and re-scaffold
- **Major new features post-MVP** → Write user stories, add to PRD, have TaskMaster parse
- **Normal development** → Stay in Phase 7 indefinitely

---

<a id="claude-code-taskmaster-advantages"></a>
# Reference: Claude Code + TaskMaster Advantages

| Advantage | Description |
|-----------|-------------|
| No Extra Token Costs | All TaskMaster requests use your Claude Code subscription |
| Native MCP Support | Built-in MCP server support makes integration seamless |
| Extended Context | Larger context window helps with complex tasks |
| Better Error Recovery | Thinking capabilities help recover from errors gracefully |
| Integrated Environment | No need to switch between windows |

---

<a id="appendix-prompt-library-index"></a>
# Appendix: Prompt Library Index

Save these files in `.claude/commands/` to enable them as slash commands.

| Command | File | Description |
|---------|------|-------------|
| `/advisor` | `advisor.md` | Seek architectural advice |
| `/brief` | `brief.md` | Generate prompt for Copilot |
| `/realign` | `realign.md` | Realign with project vision |
| `/user-context` | `user-context.md` | Inject user profile context |
| `/success-criteria` | `success-criteria.md` | Inject success metrics |
| `/research-context` | `research-context.md` | Inject competitive research |
| `/reqs` | `reqs.md` | Generate functional requirements |
| `/task-init` | `task-init.md` | Initialize TaskMaster from PRD |
| `/task-analyze` | `task-analyze.md` | Analyze task complexity |
| `/task-breakdown` | `task-breakdown.md` | Break down complex tasks |
| `/tasks` | `tasks.md` | Show current tasks |
| `/next` | `next.md` | Get next task recommendation |
| `/test-gen` | `test-gen.md` | Generate automated tests |
| `/analyze-feedback` | `analyze-feedback.md` | Analyze user feedback |
| `/spec` | `spec.md` | Feature specification template |
| `/options` | `options.md` | Implementation options analysis |
| `/mod` | `mod.md` | Context-aware code modification |
| `/start` | `start.md` | Opening context for sessions |
| `/git-commit` | `git-commit.md` | Generate commit message |
| `/review` | `review.md` | Code review checklist |

---

*— End of Guide —*
