DougHub Project Setup Guide

*A Unified Workflow for AI-Assisted Development*

Overview

This guide takes you from idea to active development using a pipeline
where each tool handles what it does best. The goal is to eliminate
decision-making during coding sessions by front-loading all the thinking
into structured documents that AI tools can consume.

The pipeline flows in one direction: your brain dumps become foundation
docs, Bolt turns those into real code, Copilot analyzes that code to
understand what actually exists, Claude synthesizes everything into
project guidelines and a PRD, TaskMaster breaks the PRD into executable
tasks, and then you enter a simple daily loop of picking tasks and
building.

The Full Pipeline

  ---------------------------------------------------------------------
  **Step**      **Output**
  ------------- -------------------------------------------------------
  Your brain    Foundation docs (vision, user profile, metrics,
                research)

  Bolt.new      Working scaffold with your stack choices baked in

  Copilot       AI instructions describing actual code patterns

  Claude        CLAUDE.md + PRD synthesized from all inputs

  TaskMaster    Parsed PRD becomes dependency-aware task backlog

  Claude Code   Daily build loop until MVP complete
  ---------------------------------------------------------------------

Phase 1: Foundation Documents

These documents capture your thinking before any code exists. Spend
30-60 minutes writing these before touching any code. The key is being
specific rather than generic.

Purpose Framework

Before writing any document, answer these three questions:

1.  **What problem is this solving?** Be specific. \"Make invoicing
    easier\" is vague. \"Allow small business owners to generate and
    send invoices in under 2 minutes without accounting software\" is
    clear.

2.  **What change do I want to see?** Focus on the outcome, not the
    features. \"Users can complete task X 10x faster\" vs. \"Users have
    a dashboard\".

3.  **Is it worth solving with software?** Could this be solved with a
    spreadsheet, existing tool, or manual process?

Required Documents

0_vision.md

Defines the core problem, the insight, and what\'s in vs out of scope
for MVP. Template structure:

> \# Project Vision
>
> \## Problem
>
> \[Specific problem you\'re solving\]
>
> \## Core Insight
>
> \[The key realization that shapes your solution\]
>
> \## MVP Scope
>
> \[What you ARE building first\]
>
> \## Out of Scope (MVP)
>
> \[What you are NOT building yet\]
>
> \## Technical Stack
>
> \[Your chosen technologies\]
>
> \## Anti-Patterns
>
> \[What to avoid\]

1_user_profile.md

Describes yourself (or your target user) with uncomfortable specificity.
Template structure:

> \# User Profile
>
> \## Context
>
> \- Role: \[Specific role\]
>
> \- When: \[When they\'ll use this\]
>
> \- Where: \[Environment/device\]
>
> \- State: \[Mental/physical state\]
>
> \## Learning/Working Style
>
> \[How they process information\]
>
> \## Technical Comfort
>
> \- Comfortable: \[What they can handle\]
>
> \- Uncomfortable: \[What causes friction\]
>
> \## Core Conflict
>
> \[The fundamental tension they face\]
>
> \## UX Requirements
>
> \[Specific interface needs\]
>
> \## Job Statement
>
> \"When \[situation\], I want to \[action\], trusting \[outcome\].\"

2_success_metrics.md

Defines what \"working\" means in measurable terms. Choose your target
level:

-   **Proof of concept:** Demonstrates core functionality, may have
    rough edges

-   **MVP:** Minimally viable product that real users can test

-   **Polished demo:** Ready for presentation or investor demo

-   **Production ready:** Can handle real users and edge cases

Template structure:

> \# Success Metrics
>
> \## MVP Validation
>
> \| Metric \| Target \| Validation Method \|
>
> \|\-\-\-\-\-\-\--\|\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--\|
>
> \| \[Metric 1\] \| \[Specific target\] \| \[How to measure\] \|
>
> \## Validation Checklist
>
> \- \[ \] \[Specific testable outcome\]
>
> \- \[ \] \[Performance threshold\]
>
> \- \[ \] \[User can complete X without Y\]

Competitive Research Document

Spend 30 minutes analyzing 3-5 existing tools. For each tool, document:

-   **What it does well:** Specific strengths, UI patterns to borrow

-   **What it does poorly:** Complexity, confusion points, missing
    features

-   **Key insight:** What to learn from this tool

-   **Screenshots:** Include visual references for Claude

Phase 2: Bolt Bootstrap

Why This Matters

**Critical:** Never let Claude Code scaffold a project from scratch. It
wastes tokens on boilerplate and often makes inconsistent foundational
choices. Bolt gives you a working codebase with your stack decisions
already implemented---routing, component structure, database
connections, styling setup.

Minimum Stack Requirements

  ----------------------------------------------------------------------
  **Feature**             **Recommended**
  ----------------------- ----------------------------------------------
  Framework               Next.js / Electron

  UI Components           React + Shadcn UI

  Type Checks             TypeScript

  CSS Library             TailwindCSS (AI works better with it)

  Linter/Formatter        ESLint + Prettier

  State Management        Zustand
  ----------------------------------------------------------------------

What To Do

1.  Go to Bolt.new and describe your app in natural language

2.  Include your stack preferences explicitly (framework, styling,
    database)

3.  Describe the main screens you need

4.  Download the generated project as a zip file

5.  Extract to your working directory

6.  Run the dev server and verify it starts

Phase 3: GitHub Copilot AI Instructions

Why This Matters

Copilot\'s \"Generate AI Instructions\" feature analyzes your actual
codebase and produces a document describing what it found---frameworks
detected, file organization patterns, coding conventions inferred. This
is based on real code, not aspirations about what the code might be.

What To Do

1.  Open your Bolt-generated project in VS Code with GitHub Copilot
    installed

2.  Open the Copilot Chat panel

3.  Find and run \"Generate AI Instructions\" (in chat menu or command
    palette)

4.  Save the output to .github/copilot-instructions.md

5.  Read through what it generated to understand your codebase\'s actual
    patterns

**What you\'re getting:** A ground-truth document about your codebase
written by an AI that actually looked at the files. When you feed this
to Claude later, Claude isn\'t guessing about your project structure.

Phase 4: Generate CLAUDE.md and PRD

Why This Matters

Now you synthesize everything into two documents that govern all future
Claude Code sessions. The CLAUDE.md file lives in your project root and
gets automatically pulled into Claude Code\'s context. The PRD becomes
input for TaskMaster to generate your task list.

CLAUDE.md Template

This file should include:

> \# Project Guidelines for Claude
>
> \## Project Overview
>
> \[Brief description from vision doc\]
>
> \## Target User
>
> \[User profile summary\]
>
> \## Technical Stack
>
> \- Frontend: \[Confirmed by Copilot analysis\]
>
> \- Backend: \[If applicable\]
>
> \- Database: \[Your choice\]
>
> \- Deployment: \[Target platform\]
>
> \## Coding Standards
>
> \- Use TypeScript for all new files
>
> \- Follow functional component patterns in React
>
> \- Add comments for complex business logic
>
> \- No external dependencies without approval
>
> \- Mobile-first responsive design
>
> \## Architecture Principles
>
> \- Keep components small and focused
>
> \- Separate business logic from UI components
>
> \- Use consistent error handling patterns
>
> \## AI Instructions
>
> \- Always explain architectural decisions
>
> \- Ask clarifying questions if requirements ambiguous
>
> \- Suggest improvements but don\'t implement without approval
>
> \- Generate complete, working code blocks (no placeholders)
>
> \- Start with the simplest solution that works
>
> \## Constraints
>
> \[Project-specific limitations\]

PRD Generation Prompt

Use this prompt in Claude (web interface) to generate your PRD:

> You are an expert technical product manager specializing in
>
> feature development and creating comprehensive PRDs.
>
> Generate a detailed PRD based on these inputs:
>
> \- Vision: \[paste 0_vision.md\]
>
> \- User: \[paste 1_user_profile.md\]
>
> \- Metrics: \[paste 2_success_metrics.md\]
>
> \- Copilot Analysis: \[paste copilot-instructions.md\]
>
> Include these sections:
>
> 1\. Introduction
>
> 2\. Product Overview
>
> 3\. Goals and Objectives
>
> 4\. Target Audience
>
> 5\. Features and Requirements
>
> 6\. User Stories and Acceptance Criteria
>
> 7\. Technical Requirements / Stack
>
> 8\. Design and User Interface
>
> For user stories:
>
> \- Assign unique IDs (ST-101, ST-102\...)
>
> \- Include primary, alternative, and edge-case scenarios
>
> \- Make each story testable
>
> \- Include acceptance criteria
>
> Output as markdown.

**Save the PRD to:** scripts/prd.txt

Phase 5: TaskMaster Setup

Why This Matters

TaskMaster is an MCP server that turns your PRD into a managed task list
with dependencies, complexity analysis, and subtask breakdown. It gives
Claude Code persistent awareness of what needs building and what order
to build it in.

**TaskMaster vs Claude Code Plan Mode:** Plan mode is only useful for
one task at a time. TaskMaster manages entire projects with
dependencies, complexity tracking, and persistent context across
sessions.

Configuration Files

.taskmaster/config.json

> {
>
> \"models\": {
>
> \"main\": {
>
> \"provider\": \"claude-code\",
>
> \"modelId\": \"sonnet\",
>
> \"maxTokens\": 64000,
>
> \"temperature\": 0.2
>
> },
>
> \"research\": {
>
> \"provider\": \"claude-code\",
>
> \"modelId\": \"opus\",
>
> \"maxTokens\": 32000,
>
> \"temperature\": 0.1
>
> },
>
> \"fallback\": {
>
> \"provider\": \"claude-code\",
>
> \"modelId\": \"sonnet\",
>
> \"maxTokens\": 64000,
>
> \"temperature\": 0.2
>
> }
>
> },
>
> \"global\": {
>
> \"logLevel\": \"info\",
>
> \"debug\": false,
>
> \"defaultSubtasks\": 5,
>
> \"defaultPriority\": \"medium\",
>
> \"projectName\": \"DougHub\"
>
> }
>
> }

.mcp.json (project root)

> {
>
> \"mcpServers\": {
>
> \"taskmaster-ai\": {
>
> \"type\": \"stdio\",
>
> \"command\": \"npx\",
>
> \"args\": \[\"-y\", \"\--package=task-master-ai\",
> \"task-master-ai\"\],
>
> \"env\": {}
>
> }
>
> }
>
> }

Setup Steps

1.  Initialize git and commit your Bolt scaffold plus all documents

> git init && git add . && git commit -m \"Bolt scaffold + foundation
> docs\"

2.  Create the config files shown above

3.  Start Claude Code from your project directory

> claude

4.  Parse your PRD

> I have a PRD at scripts/prd.txt. Can you parse it and set up initial
> tasks?

5.  Analyze complexity

> Can you analyze the complexity of our tasks to identify which need
> breakdown?

6.  Break down high-complexity tasks

> Can you help me break down all of the high complexity tasks?

Known Issue: JSON Parsing Error

Claude Code may encounter this error when parsing large PRDs:

> taskmaster-ai:parse_prd Error: Unterminated string in JSON at position
> 14000

**Workaround:** Use Cursor (or another AI tool) to generate initial
tasks from the PRD, then switch back to Claude Code for implementation.

Phase 6: Daily Build Loop

The Core Loop

All that preparation pays off here. Your daily coding sessions become
almost mechanical:

1.  Start Claude Code in your project directory (CLAUDE.md auto-loads)

2.  View current tasks

> Show tasks

3.  Get next task recommendation

> What\'s the next task I should work on? Please consider dependencies
> and priorities.

4.  Implement the task

> Implement task 2 and all of its subtasks.

5.  Test manually against acceptance criteria

6.  Commit changes

7.  Repeat

TaskMaster Prompt Recipes

Add a New Task

> Let\'s add a new task. We should implement sorting of the timeline.
>
> Here are the requirements:
>
> \- you should be able to sort the timeline by date
>
> \- a dropdown should be available to select the sorting direction
>
> \- the sorting should be persisted when a new page is loaded

Change Direction of a Task

> There should be a change in the image generation task.
>
> Can you update task 3 with this and set it back to pending?
>
> The image generation should use gpt-image-1 as the model.

Deprecate a Task

> Task 8 is not needed anymore. You can remove it.

Break Down Individual Task

> Task 3 seems complex. Can you break it down into subtasks?

Effective Prompting Patterns

Opening Context (Start Each Major Session)

> Context:
>
> Project: \[Brief description from vision doc\]
>
> User: \[User profile summary\]
>
> Current goal: \[What you want to accomplish this session\]
>
> Files to consider: \[Specific files if relevant\]
>
> Task: \[Specific, actionable request\]
>
> Please ask any clarifying questions before starting.

The Options Pattern

When you\'re not sure about implementation:

> I need to implement \[specific feature\].
>
> Please provide 3 different approaches:
>
> 1\. The simplest solution that works
>
> 2\. A more robust solution with better error handling
>
> 3\. The most user-friendly solution
>
> For each approach, explain:
>
> \- Implementation complexity
>
> \- User experience impact
>
> \- Maintenance considerations
>
> \- Pros and cons
>
> I\'ll choose one and you can implement it.

Context-Aware Modifications

> Looking at the current \[component/file\], I need to:
>
> \- \[Specific change 1\]
>
> \- \[Specific change 2\]
>
> Please modify the existing code while maintaining
>
> the current patterns and style.

Prompt Evolution Examples

**Level 1 (Too vague):** \"Build a user authentication system.\"

**Level 2 (Better):** \"Build a user authentication system with
email/password registration, JWT sessions, and password reset.\"

**Level 3 (Optimal):** \"Context: Building a B2B invoice tool for small
business owners who need quick, secure access. Task: Implement user
authentication with email/password, JWT sessions (7-day expiry),
password reset via email, client-side validation, mobile-first design.
Constraints: Use existing design system, follow security best practices,
keep forms simple (max 3 fields per step). Please implement registration
flow first, then ask before proceeding.\"

Code Review Checklist

Don\'t accept everything blindly. You\'re still the architect. Review
Claude\'s output:

-   Does it follow your coding standards?

-   Are there obvious security issues?

-   Is it overengineered for your needs?

-   Does it match your user experience goals?

-   Can you understand and maintain this code?

Common Things to Challenge

> Can you simplify this implementation?
>
> Is this dependency necessary for our use case?
>
> How would this handle \[specific edge case\]?
>
> Can you add comments explaining the business logic?

Pro Tips

1\. Add Extra Context to Task Runs

When prompting for the next task, provide additional context on UI
preferences, API docs, or attach images. This guides Claude on the path
you want.

2\. Break Down Large Files

AI struggles with files over 500 lines. Use this prompt:

> Break down this file into logical modules so it\'s easier to read.
>
> Create directories if needed and move utils and interfaces to
>
> separate files, maintaining a domain-driven file structure.

3\. Bugs Are Tasks

For bugs requiring architectural changes, create a task instead of
letting Claude apply surface fixes:

> The filter feature is not working as expected.
>
> Create a new task to fix it:
>
> \- the filter should be case insensitive
>
> \- it should work with pagination
>
> \- it should work with the debounce

4\. Commit Frequently

Claude Code doesn\'t have automatic checkpointing. Commit after
completing each task to avoid losing work.

5\. Start Fresh Sessions When\...

-   Switching to a completely different feature

-   The conversation gets too long (20+ exchanges)

-   You want to change technical direction significantly

-   The current session is making repetitive mistakes

Critical Pitfalls to Avoid

Foundational Mistakes

-   **Wandering prompts:** Starting without clear goals leads to feature
    creep

-   **Vague user definition:** \"For business users\" leads to generic
    UX. Be specific.

-   **Skipping foundation docs:** Without vision/user/metrics, Claude
    makes random assumptions

Technical Pitfalls

-   **Over-engineering from the start:** Ask for \"the simplest solution
    that works\" first

-   **Ignoring code quality:** After major features, ask Claude to
    refactor and clean up

-   **Not using version control:** Git is your safety net. Commit
    frequently.

-   **Letting Claude scaffold from scratch:** Always use Bolt or similar
    for initial setup

Process Pitfalls

-   **Accepting first output:** The magic happens in iteration rounds
    2-3

-   **Using Claude like Google:** It\'s a collaborator, not a search
    engine. Guide the conversation.

-   **Building without user validation:** Get real users to try your
    prototype early

When to Restart the Process

-   **Significant pivot** (different user, different problem) → Go back
    to Phase 1

-   **Tech stack change** → Go back to Phase 2 and re-scaffold

-   **Major new features post-MVP** → Write user stories, add to PRD,
    have TaskMaster parse

-   **Normal development** → Stay in Phase 6 indefinitely

Claude Code + TaskMaster Advantages

  ---------------------------------------------------------------------
  **Advantage**         **Description**
  --------------------- -----------------------------------------------
  No Extra Token Costs  All TaskMaster requests use your Claude Code
                        subscription

  Native MCP Support    Built-in MCP server support makes integration
                        seamless

  Extended Context      Larger context window helps with complex tasks

  Better Error Recovery Thinking capabilities help recover from errors
                        gracefully

  Integrated            No need to switch between windows
  Environment           
  ---------------------------------------------------------------------

*--- End of Guide ---*
