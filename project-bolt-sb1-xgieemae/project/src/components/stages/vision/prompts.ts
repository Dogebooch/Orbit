// Prompt constants for Claude AI assistance
// These prompts guide users through creating foundation documents

export const VISION_PROMPT = `# Vision Document Creation Guide

## Context
I need to create a \`0_vision.md\` file following the DougHub Project Setup Guide methodology. This document defines WHAT I'm building and WHY, and becomes the "no" list when AI suggests scope creep during development.

**Reference:** See \`guides/DougHub_Project_Setup_Guide.md\` Phase 1 → 0_vision.md section for the canonical template and examples.

## Your Role
Act as a Socratic product advisor. Guide me through the Purpose Framework first (3 questions), then help me fill out each section of the vision template. For each section, explain WHY it matters before asking me to fill it out. Challenge vague answers - be specific.

## Task

### Step 1: Purpose Framework (Answer These First)
Before writing anything, walk me through these 3 questions. Push back if my answers are vague:

1. **What problem is this solving?** (Be specific - "make X easier" is vague, "allow [user] to [action] in under [time] without [pain point]" is clear)
2. **What change do I want to see?** (Focus on outcome, not features - "users complete task 10x faster" not "users have dashboard")
3. **Is it worth solving with software?** (Could this be a spreadsheet? Existing tool? Manual process?)

After I answer all 3, challenge my project idea with 5 hard questions to surface gaps.

### Step 2: Vision Template Sections
Guide me through filling out each section in this order. For each section, explain WHY it matters, then ask me to draft it:

1. **Vision Statement** (write this LAST after everything else)
   - Format: FOR [target user] WHO [has this problem], [Product Name] is a [category] THAT [key benefit]. UNLIKE [alternatives], our product [key differentiator].

2. **Target User** (who specifically?)
   - NOT "developers" - be specific: "junior developers at startups who don't have time to read documentation"

3. **Problem** (what pain point triggers someone to need this?)
   - Be concrete. What specific behavior/situation creates the need?

4. **Core Insight** (what do you understand about this problem that others miss?)
   - The key realization that shapes your solution

5. **MVP Scope** (what you ARE building first - 3-5 concrete capabilities)
   - Include specific metrics where possible (<20 sec, one-click, etc.)

6. **Out of Scope (MVP)** (your "no" list)
   - Be aggressive. You can always add things later. This prevents scope creep.

7. **Technical Stack** (chosen technologies)
   - Locks in decisions so AI doesn't suggest alternatives mid-build

8. **Anti-Patterns** (what to avoid)
   - Design approaches, UX patterns, or technical choices that conflict with your goals
   - Example: "No complex dashboards—user is exhausted post-shift"

### Step 3: Review & Refine
After I draft all sections:
1. Check if Problem, Core Insight, and MVP Scope are aligned
2. Verify Out of Scope is explicit enough to say "no" during development
3. Ensure Anti-Patterns reflect actual user constraints (not just best practices)
4. NOW write the Vision Statement (one-sentence summary)

## Output Format
Save the final document as \`0_vision.md\` in markdown format following the template structure.

## Important Notes
- Push back on vague answers - specificity is critical
- The vision doc gets consumed twice: (1) PRD generation, (2) scope enforcement during development
- This is the foundation - spending 30-60 minutes here saves hours of rework later
- If I try to skip ahead or rush, remind me WHY each section matters for AI-assisted development

## Reference Best Practices
- See guide section "Purpose Framework" for the 3 foundational questions
- See guide section "0_vision.md Template" for full structure
- See guide section "When You Start Drifting" for how this document prevents scope creep

Begin by asking me the first Purpose Framework question.`;

export const USER_PROFILE_PROMPT = `# User Profile Creation Guide

## Context
I need to create a \`1_user_profile.md\` file following the DougHub Project Setup Guide methodology. This document captures the PRIMARY user as a specific person with habits, frustrations, and context - not a generic marketing persona. Claude will use this to make thousands of micro-decisions during development (naming, error messages, defaults, UX patterns).

**Reference:** See \`guides/DougHub_Project_Setup_Guide.md\` Phase 1 → 1_user_profile.md section for the canonical template and examples.

## Your Role
Act as a UX researcher conducting a deep user interview. Ask probing questions to uncover specific behaviors, frustrations, and context. Push me beyond generic answers ("users want intuitive interface") to specific, actionable details ("abandons tools that require >3 clicks to start").

## Task

### Step 0: Identify Your User
First, determine: **Are you building for yourself or someone else?**

- **If building for yourself:** We'll focus on brutal honesty about your limitations, worst-case states, and embarrassing details. The product should work even when you're tired/distracted/impatient.
- **If building for someone else:** We'll do a structured interview focusing on behaviors (what they actually do) vs. aspirations (what they wish they did). Include direct quotes.

### Step 1: Core Identity
Guide me through these fields, explaining WHY each matters:

1. **Name** (give them a name - makes discussions concrete)
2. **Role** (specific, not generic - "PGY-3 IM resident with ADHD" not "medical student")
3. **One-liner** (single sentence capturing their situation and key constraint)

### Step 2: Context (When/Where/State)
This shapes EVERY UX decision. For each, ask probing questions:

1. **When do they use this?** (Time of day, frequency, triggers)
   - Example follow-up: "What else are they doing at that time? What just happened before they need this tool?"

2. **Where are they using it?** (Device, location, distractions present)
   - Example follow-up: "Are they standing/sitting? Bright/dark environment? Multitasking?"

3. **What's their mental/physical state?** (Energy level, stress, cognitive load)
   - Example follow-up: "On a scale of 1-10, how much mental energy do they have left? What drains them before using this tool?"

### Step 3: Goals & Motivations
Ask me: "What does success look like for this user? What are they trying to accomplish - and WHY does it matter to them personally?"

Push beyond surface goals. If they say "organize information," ask "What happens if they don't? What's the real consequence?"

### Step 4: Frustrations & Pain Points
This is CRITICAL. Guide me through:

1. **What makes them abandon tools?** (Get specific examples - "Argus Monitor because...")
2. **What triggers anxiety or avoidance?** (Fear of data loss? Getting lost in UI? Unclear next steps?)
3. **What friction points do they hit repeatedly?** (Manual decisions? Long setup? No verification?)
4. **Any "no safe stops" scenarios?** (Can't verify setup works without risking consequences)

For each frustration, ask: "Can you give me a specific example when this happened?"

### Step 5: Technical Comfort
Map out their comfort zones:

1. **Comfortable with:** (What they can handle without friction - be specific: "Python errors" not "technical stuff")
2. **Uncomfortable with:** (What causes them to stop or seek help - be specific: "choosing between unknown options" not "complex tasks")

Ask: "When they hit something uncomfortable, what do they do? Troubleshoot? Google? Give up?"

### Step 6: Behavioral Patterns
Uncover HOW they actually work:

1. Do they read instructions or dive in?
2. Do they prefer keyboard shortcuts or clicking?
3. Do they customize tools heavily or use defaults?
4. When facing a new feature, what's their first action?
5. How do they react to friction? (Depends on task importance? Always abandon? Always persist?)

### Step 7: Core Conflict
Ask me: "What's the fundamental tension this user faces? Why do they need your product, AND why do existing solutions fail them?"

This should be one sentence that captures the paradox. Example: "Brain craves order but lacks energy to create it."

### Step 8: Job Statement
Format: "When [specific situation], I want to [specific action], so that [specific outcome]."

Example: "When exhausted after a shift, I want to capture facts instantly without organizing, trusting they'll resurface when needed, so I can build long-term knowledge without decision overhead."

### Step 9: UX Requirements (If Applicable)
Based on everything above, what are the non-negotiable UX constraints?
- Visual preferences (dark mode, high-density layouts, etc.)
- Interaction preferences (keyboard > mouse, search-first navigation)
- Performance requirements (<200ms, no spinners)
- Automation needs (auto-validation, no manual verification)

## Validation
After drafting, check if the profile passes these tests:

1. **Specific:** Can you tell if someone is this user or not?
2. **Behavioral:** Does it focus on what they DO, not demographics?
3. **Contextual:** Does it capture the SITUATION, not just the person?
4. **Wiggle-able:** Can you ask "would this user do X?" and get a meaningful answer?

## Anti-Patterns to Avoid
Call me out if I write:
- "Users want an intuitive interface" (everyone wants this - meaningless)
- Demographics without behavior ("35-year-old professional")
- Aspirational descriptions ("power user who maximizes productivity")
- Generic frustrations ("tools are complicated")

## Output Format
Save the final document as \`1_user_profile.md\` in markdown format following the template structure.

## Important Notes
- This profile gets used in 3 ways: (1) PRD generation for user stories, (2) TaskMaster complexity analysis, (3) Daily build UX decisions
- More context = better AI decisions. Generic descriptions lead to generic UX.
- The guide says: "Context helps frame the understanding—the more context, the broader the picture we can illuminate."
- If I'm building for myself: push me to include embarrassing details and worst-case states

## Reference Best Practices
- See guide section "1_user_profile.md Template" for full structure
- See guide section "What makes a good user profile" for quality criteria
- See guide section "User Context Injection" for how this gets used during development

Begin by asking me: "Are you building for yourself or someone else?"`;

export const SUCCESS_METRICS_PROMPT = `# Success Metrics Creation Guide

## Context
I need to create a \`2_success_metrics.md\` file following the DougHub Project Setup Guide methodology. This document defines what "working" means in concrete, measurable terms. Without this, Claude optimizes for generic "good software" rather than MY specific goals.

**Reference:** See \`guides/DougHub_Project_Setup_Guide.md\` Phase 1 → 2_success_metrics.md section for the canonical template and examples.

## Your Role
Act as a product manager helping me define clear success criteria. Push me to be specific with numbers (not adjectives like "fast"), explain WHY each metric matters, and identify what breaks if I miss the target. Help me distinguish between MVP must-haves vs. nice-to-haves.

## Task

### Step 0: Choose Your Target Level
This sets expectations for EVERYTHING else. Ask me to choose:

- **Proof of concept:** Demonstrates core functionality, may have rough edges. Good for: validating technical feasibility.
- **MVP:** Minimally viable product that real users (or I) can test daily. Good for: getting feedback before investing more time.
- **Polished demo:** Ready for presentation or investor demo. Good for: securing buy-in or funding.
- **Production ready:** Can handle real users and edge cases. Good for: actual deployment.

For each option I'm considering, explain what quality bar it implies.

### Step 1: Core Success Criteria Table
This is the MOST IMPORTANT section. For each metric, I need 4 things:

| Metric | Target | Why It Matters | How to Measure |

Guide me through identifying 3-7 core metrics by asking:

1. **What's the #1 thing that would make me abandon this project if it doesn't work?**
   - For products I'll use myself while developing: usually data persistence + backups
   - For products with time constraints: usually speed/latency
   - For products solving frustration: usually eliminating the frustrating behavior

2. **What user behavior defines "success" for this product?**
   - Example: "User completes 1hr session without leaving app" (flow state)
   - Example: "Zero manual tag/folder creation during session" (automation)

3. **Are there any anxiety triggers that must be addressed?**
   - Example: Fear of data loss → auto-backup metric
   - Example: "No safe stops" → auto-validation metric
   - Example: Incomplete coverage → completeness metric

For each metric I propose, ask me:
- **"Why does this number matter?"** (What breaks if you miss it?)
- **"How will you actually measure this?"** (Be specific - stopwatch? count? query?)
- **"Is this a must-have for [my target level] or nice-to-have?"**

### Step 2: Performance Requirements
Ask me about technical performance based on my user profile:

- **Response time:** What's the threshold where friction happens? (<200ms? <1 sec?)
- **Throughput:** How much data/volume must it handle? (100 cards? 10,000?)
- **Reliability:** What level of crashes/errors is acceptable? (Zero data loss? Graceful degradation?)
- **Backup frequency:** If building for myself while developing, how often must it auto-backup?

For each, ask: "What happens if this metric is missed?"

### Step 3: User Experience Thresholds
Based on my user profile, what are the UX breaking points?

- **Time to first action:** How fast must the app launch before I abandon? (<10 sec? <30 sec?)
- **Clicks/steps required:** What's the max before I hit decision paralysis? (2 clicks? 5?)
- **Error recovery:** When something breaks, what must happen? (Auto-restore? Manual retry? Clear error message?)
- **Visual confirmation:** Do I need to SEE things working? ("Saved ✓" indicator? Progress bars? Streak counters?)

Ask me: "Based on your user profile, which of these thresholds cause you to abandon tools?"

### Step 4: Feature Completeness (For MVP)
If my vision includes multiple MVP features, create a table:

| Feature | Success Criteria | Why It Matters | How to Measure |

Guide me through each feature in my MVP scope:
1. **What does "working" mean for this feature?** (Be specific - "100% bidirectional links work")
2. **Why can't I ship MVP without this?** (What user need goes unmet?)
3. **How will I know it works?** (Test method - "Click 20 random backlinks, all navigate correctly")

### Step 5: Validation Checklist
Help me create a checklist organized by category:

**Data Safety** (if applicable):
- [ ] What must be true about backups/persistence?
- [ ] What recovery scenarios must work? (Force-quit? Crash? Update?)

**Core Workflow:**
- [ ] End-to-end happy path
- [ ] What behavior defines success? (Complete 1hr without leaving app?)

**Feature Integration:**
- [ ] Each MVP feature works in isolation
- [ ] Features work together (flashcards ↔ notes?)

**User Experience:**
- [ ] Time/click thresholds met
- [ ] No manual intervention required for what behaviors?
- [ ] User can accomplish their goal using the product

### Step 6: Post-MVP Success Indicator (Optional)
If relevant, ask: "How will you know this product actually solves the problem long-term?"

Example: "Question accuracy improves from 55% to 76% after 2 weeks of daily use"

This proves the system works, not just that it's organized better.

## Validation
After drafting, check:

1. **Are metrics specific?** ("Fast" → "<200ms", "Easy" → "<2 clicks")
2. **Is "Why It Matters" clear?** (Links to user pain points or anxiety triggers?)
3. **Can you actually measure these?** (Do you have a concrete test method?)
4. **Do metrics align with target level?** (MVP doesn't need production-level error handling)

## Common Mistakes to Avoid
Call me out if I:
- Use adjectives instead of numbers ("fast", "reliable", "good")
- Define metrics I can't actually measure
- Include nice-to-haves in MVP core criteria
- Miss metrics related to my user profile frustrations (e.g., data loss anxiety → no backup metric)
- Focus only on features, not outcomes (having a dashboard vs. completing task 10x faster)

## Output Format
Save the final document as \`2_success_metrics.md\` in markdown format following the template structure.

## Important Notes
- Success metrics get used in 2 ways: (1) PRD acceptance criteria, (2) Implementation approach decisions
- Specific numbers help Claude optimize for YOUR goals, not generic "good software"
- The guide says: "If you need 90% accuracy on PDF processing, Claude should know that—it affects architecture decisions"
- For products you're building while using: data persistence + auto-backup are often core metrics #1 and #2

## Reference Best Practices
- See guide section "2_success_metrics.md Template" for full structure
- See guide section "Choose your target level first" for quality bar definitions
- See guide section "Success Criteria Injection" for how this gets used during development

Begin by asking me: "What's your target level for this project - Proof of concept, MVP, Polished demo, or Production ready?"`;

