import os

# Base directory for commands
commands_dir = os.path.join('.claude', 'commands')
os.makedirs(commands_dir, exist_ok=True)

# Define prompts
prompts = {
    'brief.md': """I am about to implement the next task using GitHub Copilot.
Please analyze Task [Task ID/Description] and generate a comprehensive prompt I can paste into Copilot Chat.

The prompt should include:
1. **Context:** A summary of what we are building.
2. **Requirements:** The specific acceptance criteria for this task.
3. **Constraints:** Relevant technical constraints from CLAUDE.md.
4. **Files:** The list of files that likely need to be created or modified.
5. **Implementation Strategy:** A high-level pseudo-code or logic guide.

Format the output as a code block so I can easily copy it.""",

    'review.md': """I have implemented the task using GitHub Copilot. Please review the current codebase changes against these challenges:
1. **Requirements:** Does the implementation fully meet the task requirements?
2. **Architecture:** Does it follow our defined patterns and constraints?
3. **Robustness:** Are edge cases handled?
4. **Security:** Are there any security vulnerabilities?

If issues are found, list them clearly so I can feed them back to Copilot. If it looks good, confirm the task is complete.""",

    'reqs.md': """I would like to create concise functional requirements for the following application:
[Brief description]

My Requirements:
- [Paste contents of 0_vision.md]
- [Paste contents of 1_user_profile.md]

Output as markdown code.""",

    'task-init.md': """I have a PRD at scripts/prd.txt. Can you parse it and set up initial tasks?""",

    'task-analyze.md': """Can you analyze the complexity of our tasks to identify which need breakdown?""",

    'task-breakdown.md': """Can you help me break down all of the high complexity tasks?""",

    'tasks.md': """Show tasks""",

    'next.md': """What's the next task I should work on? Please consider dependencies and priorities.""",

    'test-gen.md': """Please create comprehensive tests for the current application:
- Unit tests for core business logic functions
- Integration tests for the main user workflows
- Error handling tests for edge cases
- Performance tests for file processing

Use [your preferred testing framework] and include both positive and negative test cases.""",

    'analyze-feedback.md': """Based on user testing, here's what I observed:

User 1:
[Specific behaviors and comments]

User 2:
[Specific behaviors and comments]

Common patterns:
- [Issue that multiple users hit]
- [Unexpected user behavior]

Please analyze this feedback and suggest:
- Critical UX improvements needed
- Changes to improve user success rate""",

    'spec.md': """## Feature Specification: [Feature Name]
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
- [What NOT to build]""",

    'options.md': """I need to implement [specific feature]. Please analyze these requirements and suggest 3 approaches:

**Requirements:**
[List specific needs]

For each approach, explain:
- Implementation complexity
- User experience impact
- Maintenance considerations
- Pros and cons

I'll choose one and you can implement it.""",

    'mod.md': """Looking at the current [component/file], I need to:
- [Specific change 1]
- [Specific change 2]

Please modify the existing code while maintaining the current patterns and style.""",

    'start.md': """Context:

Project: [Brief description from vision doc]

User: [User profile summary]

Current goal: [What you want to accomplish this session]

Files to consider: [Specific files if relevant]

Task: [Specific, actionable request]

Please ask any clarifying questions before starting.""",

    'git-commit.md': """Please review my current changes and suggest an appropriate commit message that follows conventional commit format.""",

    'realign.md': """# Vision Realignment Check

I need you to pause and realign with the project vision before proceeding.

## Current Vision
[Paste your 0_vision.md contents here]

## Realignment Tasks
1. **Scope check:** Review what you're about to build/suggest. Does it fall within MVP Scope, or is it in Out of Scope?
2. **Problem alignment:** Does this feature/change directly address the core Problem statement? If it's "nice to have" but doesn't solve the stated problem, flag it.
3. **Anti-pattern check:** Does this approach violate any listed Anti-Patterns?
4. **Complexity audit:** For the target user in their stated context, does this add decision points or cognitive load? If yes, simplify or defer.

5. **Decision:** Based on the above, should we:
   - Proceed as planned
   - Modify the approach
   - Defer to post-MVP
   - Abandon entirely

Explain your reasoning, then wait for my confirmation before continuing.""",

    'advisor.md': """# Technical Advisor Mode

I need your architectural advice, opinion, or mentorship on a topic.
I am NOT asking for code implementation yet, but for high-level guidance.

## Topic
[Describe your question, dilemma, or concept]

## Request
Please act as a Senior Architect and provide:
1. **Analysis:** A breakdown of the concepts involved.
2. **Options:** Different ways to approach this in our specific project context.
3. **Trade-offs:** Pros/Cons (Complexity vs. Performance vs. UX).
4. **Recommendation:** Your preferred path and why.""",

    'user-context.md': """# User Context Injection

Before proceeding with this task, internalize the following user context.
All design decisions, UX patterns, naming conventions, and feature suggestions should be evaluated against this user's reality.

## User Profile
[Paste your 1_user_profile.md contents here]

## How to Apply This Context
1. **Complexity filter:** Before suggesting any feature or interaction, ask: "Would this user, in their stated context and mental state, actually use this?"
2. **Language check:** Use terminology this user would use. Avoid jargon they'd find confusing.
3. **Default decisions:** When choosing defaults, choose what this user would want 80% of the time.
4. **Friction audit:** For this user, is each friction point justified by the value it provides?
5. **Failure mode:** When this user makes a mistake, what's the graceful recovery?

Confirm you've internalized this context, then proceed with the task.""",

    'success-criteria.md': """# Success Criteria Injection

Before implementing this feature, internalize the following success criteria.

## Success Metrics
[Paste your 2_success_metrics.md contents here]

## How to Apply These Criteria
1. **Architecture filter:** Does this approach make it possible to hit the performance targets?
2. **Tradeoff decisions:** When facing tradeoffs, use these metrics to decide.
3. **Edge case priority:** The validation checklist shows which edge cases must be handled for MVP.
4. **Testing approach:** Describe how you'd test against these specific metrics.
5. **"Good enough" calibration:** The target level tells you when to stop polishing.

Confirm you've internalized these criteria, then proceed with implementation.""",

    'research-context.md': """# Research Context Injection

Before designing this interface or feature, internalize the following competitive research.

## Competitive Research
[Paste your competitive research document here]

## How to Apply This Research
1. **Pattern matching:** Check if any analyzed tool has a good solution. Reference it explicitly.
2. **Anti-pattern avoidance:** Check the "Patterns to Avoid" list.
3. **Opportunity gaps:** Consider whether your choice addresses the identified opportunity gap.
4. **Screenshot reference:** If screenshots are attached, reference them directly.
5. **Synthesis over copying:** Combine the best elements.

Confirm you've reviewed this research, then proceed with the design."""
}

for filename, content in prompts.items():
    full_path = os.path.join(commands_dir, filename)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Created {filename}")

print("\nOrbit Prompt Library setup complete.")
