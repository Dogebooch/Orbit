export interface StepExample {
  bad: string;
  good: string;
  badLabel?: string;
  goodLabel?: string;
}

export interface StepConfig {
  id: string;
  phase: 'vision' | 'user' | 'metrics' | 'challenge';
  phaseTitle: string;
  title: string;
  description: string;
  field: string;
  dataType: 'vision' | 'profile' | 'metrics';
  placeholder: string;
  whyItMatters: string;
  bestPractices: string[];
  examples?: StepExample;
  required: boolean;
  inputType: 'textarea' | 'input' | 'select' | 'multi-field';
  rows?: number;
  options?: { value: string; label: string; description?: string }[];
  subFields?: {
    id: string;
    label: string;
    placeholder: string;
    type: 'input' | 'textarea';
    rows?: number;
  }[];
  minLength?: number;
  validationHint?: string;
}

export const PHASES = [
  { id: 'vision', title: 'Define the Problem', icon: 'Lightbulb', steps: 3 },
  { id: 'user', title: 'Know Your User', icon: 'Users', steps: 5 },
  { id: 'metrics', title: 'Measure Success', icon: 'Target', steps: 2 },
  { id: 'challenge', title: 'Challenge Your Idea', icon: 'MessageSquare', steps: 1 },
];

export const GUIDED_STEPS: StepConfig[] = [
  {
    id: 'problem',
    phase: 'vision',
    phaseTitle: 'Define the Problem',
    title: 'What specific problem are you solving?',
    description: 'Focus on the core problem your users face, not your solution. Be as specific as possible - include who has this problem and what makes it painful.',
    field: 'problem',
    dataType: 'vision',
    placeholder: 'Example: Small business owners spend 15+ minutes per invoice because they have to manually enter client details, calculate totals, and format documents in Word before emailing as PDFs.',
    whyItMatters: 'AI coding tools like Claude Code and Copilot need specific problems to generate accurate code. Vague problems lead to generic solutions that miss the mark. The more concrete your problem statement, the better your AI-generated code will be.',
    bestPractices: [
      'Include WHO has this problem (specific user type)',
      'Describe WHAT the problem is (the pain point)',
      'Mention HOW OFTEN or HOW MUCH it costs them (time, money, frustration)',
      'Avoid mentioning your solution - focus only on the problem',
    ],
    examples: {
      bad: 'Make invoicing easier',
      good: 'Allow small business owners to generate and send invoices in under 2 minutes without accounting software',
      badLabel: 'Too vague - AI will make assumptions',
      goodLabel: 'Specific user, measurable outcome, clear constraint',
    },
    required: true,
    inputType: 'textarea',
    rows: 5,
    minLength: 50,
    validationHint: 'Aim for at least 50 characters with specific details',
  },
  {
    id: 'target_user',
    phase: 'vision',
    phaseTitle: 'Define the Problem',
    title: 'Who exactly will use this software?',
    description: 'Define your target user with enough detail that you could find them in real life. Include their role, experience level, and current situation.',
    field: 'target_user',
    dataType: 'vision',
    placeholder: 'Example: Solo consultants and freelancers who bill 5-20 clients monthly. They\'re not accounting experts, work from laptops, and get frustrated with bloated software that requires tutorials. They need to invoice between client calls.',
    whyItMatters: 'Claude will make thousands of micro-decisions about UX, naming, flow, and complexity. If you don\'t anchor it to a specific user, it defaults to "generic tech user" - which is usually wrong for your audience.',
    bestPractices: [
      'Be specific about their role or job',
      'Mention their technical skill level',
      'Include relevant constraints (time, device, environment)',
      'Describe what frustrates them about current tools',
    ],
    examples: {
      bad: 'Business owners who need invoicing',
      good: 'Solo consultants and freelancers who bill 5-20 clients monthly. They\'re not accounting experts, work from laptops, and get frustrated with bloated software that requires tutorials.',
      badLabel: 'Generic - could be anyone',
      goodLabel: 'Specific quantity, skill level, device, pain point',
    },
    required: true,
    inputType: 'textarea',
    rows: 4,
    minLength: 80,
    validationHint: 'Include role, skill level, and at least one specific detail',
  },
  {
    id: 'why_software',
    phase: 'vision',
    phaseTitle: 'Define the Problem',
    title: 'Why does this need to be custom software?',
    description: 'Be honest - could this be solved with a spreadsheet, existing tool, or manual process? This prevents building something that doesn\'t need to exist.',
    field: 'why_software',
    dataType: 'vision',
    placeholder: 'Example: Spreadsheets require manual formatting and client email lookup. Existing tools like FreshBooks are too complex for quick invoicing. Custom software can save 10+ minutes per invoice through templates and client auto-fill.',
    whyItMatters: 'This forces you to validate your idea before coding. Many projects fail because existing solutions work fine. Being honest here saves hours of wasted development.',
    bestPractices: [
      'Explain why spreadsheets or existing tools don\'t work',
      'Identify the specific automation or improvement needed',
      'Be honest - if existing tools work, maybe reconsider',
      'Focus on the unique value your software provides',
    ],
    examples: {
      bad: 'Because I want to build it',
      good: 'Spreadsheets require manual formatting and email lookup; existing tools are either too complex (FreshBooks) or too basic (email templates); automation saves 10+ minutes per invoice',
      badLabel: 'Not a reason - you need justification',
      goodLabel: 'Compares alternatives, quantifies benefit',
    },
    required: false,
    inputType: 'textarea',
    rows: 4,
  },
  {
    id: 'persona',
    phase: 'user',
    phaseTitle: 'Know Your User',
    title: 'Create a primary user persona',
    description: 'Give your target user a name and identity. This makes it easier to design with empathy and make user-centered decisions.',
    field: 'persona',
    dataType: 'profile',
    placeholder: '',
    whyItMatters: 'A named persona makes abstract "users" feel real. When you\'re stuck on a design decision, you can ask "What would Sarah prefer?" instead of "What would users prefer?"',
    bestPractices: [
      'Give them a realistic name',
      'Define their specific role or job',
      'Include one memorable characteristic',
      'Make them someone you can picture',
    ],
    examples: {
      bad: 'Business user',
      good: 'Sarah, a freelance graphic designer who bills 10-15 clients per month',
      badLabel: 'Generic, forgettable',
      goodLabel: 'Named, specific role, quantified detail',
    },
    required: true,
    inputType: 'multi-field',
    subFields: [
      { id: 'persona_name', label: 'Persona Name', placeholder: 'e.g., Sarah, Mike, Alex', type: 'input' },
      { id: 'persona_role', label: 'Role / Job Title', placeholder: 'e.g., freelance graphic designer, small business owner', type: 'input' },
      { id: 'primary_user', label: 'Full Description', placeholder: 'e.g., Sarah is a freelance graphic designer who bills 10-15 clients per month and prefers quick, simple tools over feature-rich software', type: 'textarea', rows: 3 },
    ],
  },
  {
    id: 'goal',
    phase: 'user',
    phaseTitle: 'Know Your User',
    title: 'What is their "job-to-be-done"?',
    description: 'Focus on the outcome they want to achieve, not features they might use. What does success look like for them after using your software?',
    field: 'goal',
    dataType: 'profile',
    placeholder: 'Example: Get paid faster by sending professional invoices immediately after completing work, without context switching to accounting software',
    whyItMatters: 'The "job-to-be-done" framework helps you focus on outcomes, not features. Users don\'t want "a dashboard" - they want to "understand their business at a glance."',
    bestPractices: [
      'Focus on the outcome, not the feature',
      'Use action words (get, complete, understand, save)',
      'Include the benefit or result they want',
      'Avoid technical or feature-focused language',
    ],
    examples: {
      bad: 'Users have a dashboard',
      good: 'Get paid faster by sending professional invoices immediately after completing work',
      badLabel: 'Feature-focused, no outcome',
      goodLabel: 'Outcome-focused with clear benefit',
    },
    required: true,
    inputType: 'textarea',
    rows: 3,
    minLength: 30,
  },
  {
    id: 'context',
    phase: 'user',
    phaseTitle: 'Know Your User',
    title: 'When and where will they use this?',
    description: 'Context shapes everything - the device they use, how much time they have, and what environment they\'re in all affect your design decisions.',
    field: 'context',
    dataType: 'profile',
    placeholder: 'Example: Right after finishing a client project, usually on a laptop, often between meetings or calls. Needs to be faster than writing an email. Sometimes on mobile when traveling.',
    whyItMatters: 'Context reveals critical constraints. Someone using your app "between meetings" needs a completely different UX than someone with "dedicated time at their desk."',
    bestPractices: [
      'Describe WHEN they\'ll use it (time of day, triggers)',
      'Mention WHERE (office, home, on-the-go)',
      'Note the device (desktop, mobile, tablet)',
      'Include time pressure or interruption likelihood',
    ],
    required: false,
    inputType: 'textarea',
    rows: 3,
  },
  {
    id: 'frustrations',
    phase: 'user',
    phaseTitle: 'Know Your User',
    title: 'What frustrates them about current solutions?',
    description: 'Understanding pain points guides what to avoid and what to optimize for. These frustrations become your competitive advantages.',
    field: 'frustrations',
    dataType: 'profile',
    placeholder: 'Example: Too many steps to create a simple invoice. Requires learning accounting concepts. Loses context switching between tools. Templates look unprofessional. Can\'t easily track who\'s paid.',
    whyItMatters: 'Frustrations are goldmines for differentiation. If users hate "too many steps," your app should minimize steps. If they hate "unprofessional templates," invest in great defaults.',
    bestPractices: [
      'List specific pain points, not general complaints',
      'Include both functional issues (slow, complex)',
      'Include emotional issues (confusing, frustrating)',
      'Prioritize the most common or severe frustrations',
    ],
    required: false,
    inputType: 'textarea',
    rows: 4,
  },
  {
    id: 'technical_comfort',
    phase: 'user',
    phaseTitle: 'Know Your User',
    title: 'What is their technical comfort level?',
    description: 'This determines how much complexity your UI can have and how much guidance users need. Match your interface to their abilities.',
    field: 'technical_comfort',
    dataType: 'profile',
    placeholder: '',
    whyItMatters: 'Technical comfort directly impacts your UI decisions. Low comfort = simple, guided interfaces with no jargon. High comfort = power features, keyboard shortcuts, advanced options.',
    bestPractices: [
      'Be realistic - don\'t assume your users are like you',
      'Consider the range within your user base',
      'When in doubt, design for lower comfort',
    ],
    required: true,
    inputType: 'select',
    options: [
      {
        value: 'low',
        label: 'Low - Needs simple, guided interfaces',
        description: 'No technical background. Avoid jargon. Use wizards and step-by-step flows. Provide clear feedback for every action.'
      },
      {
        value: 'medium',
        label: 'Medium - Comfortable with standard apps',
        description: 'Uses common apps daily. Understands basic patterns like forms, lists, dashboards. Can figure out standard interfaces without tutorials.'
      },
      {
        value: 'high',
        label: 'High - Can handle advanced features',
        description: 'Power user who appreciates keyboard shortcuts, bulk actions, advanced filters. Okay with some complexity if it saves time.'
      },
    ],
  },
  {
    id: 'time_constraints',
    phase: 'user',
    phaseTitle: 'Know Your User',
    title: 'How much time do they have for this task?',
    description: 'Time constraints directly impact your UX decisions and feature prioritization. Quick tasks need streamlined interfaces.',
    field: 'time_constraints',
    dataType: 'profile',
    placeholder: 'Example: Under 2 minutes between meetings. Needs to be faster than writing an email. Sometimes just 30 seconds on mobile.',
    whyItMatters: 'Time constraints shape everything from feature scope to interaction design. A 2-minute task needs a very different UX than a 30-minute task.',
    bestPractices: [
      'Be specific with time estimates',
      'Consider best case vs typical case',
      'Note if they\'re often interrupted',
      'Compare to something familiar ("faster than email")',
    ],
    required: false,
    inputType: 'input',
  },
  {
    id: 'target_level',
    phase: 'metrics',
    phaseTitle: 'Measure Success',
    title: 'What level of completeness are you targeting?',
    description: 'Choose your target - this helps Claude optimize for your actual needs rather than over-engineering.',
    field: 'target_level',
    dataType: 'vision',
    placeholder: '',
    whyItMatters: 'Different targets need different approaches. A proof of concept can have rough edges; a production app needs error handling and edge cases. Being explicit helps AI make better decisions.',
    bestPractices: [
      'Be honest about what you actually need',
      'Start with MVP unless you have a specific reason not to',
      'You can always level up later',
    ],
    required: true,
    inputType: 'select',
    options: [
      {
        value: 'poc',
        label: 'Proof of Concept',
        description: 'Demonstrates core functionality. May have rough edges, limited error handling. Goal: validate the idea works.'
      },
      {
        value: 'mvp',
        label: 'MVP (Minimum Viable Product)',
        description: 'Minimally viable for real users to test. Core features work reliably. Goal: validate users want this.'
      },
      {
        value: 'demo',
        label: 'Polished Demo',
        description: 'Ready for presentations or investor demos. Looks professional, handles common paths well. Goal: impress stakeholders.'
      },
      {
        value: 'production',
        label: 'Production Ready',
        description: 'Can handle real users and edge cases. Proper error handling, security, performance. Goal: launch to public.'
      },
    ],
  },
  {
    id: 'success_metrics',
    phase: 'metrics',
    phaseTitle: 'Measure Success',
    title: 'How will you know it\'s working?',
    description: 'Define specific, measurable outcomes. These become your acceptance criteria and help you know when you\'re done.',
    field: 'success_metrics',
    dataType: 'vision',
    placeholder: 'Example:\n- 90% of users complete their first invoice in under 2 minutes\n- Users can complete the full workflow without instructions\n- Works on both mobile and desktop browsers\n- Zero crashes during demo with realistic data',
    whyItMatters: 'If you can\'t define success, neither can Claude. Clear metrics help AI optimize for your specific goals rather than building generic features.',
    bestPractices: [
      'Make metrics specific and measurable',
      'Include at least one usability metric',
      'Include at least one technical metric',
      'Avoid vague goals like "users like it"',
    ],
    examples: {
      bad: '"Users like it", "It works well", "People find it useful"',
      good: '"90% of test users complete core task in under 2 minutes", "Zero crashes during demo", "Loads in under 2 seconds"',
      badLabel: 'Unmeasurable, subjective',
      goodLabel: 'Specific numbers, testable criteria',
    },
    required: false,
    inputType: 'textarea',
    rows: 5,
  },
  {
    id: 'ai_challenge',
    phase: 'challenge',
    phaseTitle: 'Challenge Your Idea',
    title: 'Challenge your assumptions with AI',
    description: 'Before you start building, use AI to stress-test your idea. This forces you to address gaps and potential issues before they become expensive problems.',
    field: 'ai_challenge_response',
    dataType: 'vision',
    placeholder: 'Paste the challenging questions from the AI and write your answers to each one here...',
    whyItMatters: 'This is one of the most valuable steps in vibe coding. AI can spot blind spots, missing pieces, and potential problems you haven\'t considered. Addressing these now saves hours of rework later.',
    bestPractices: [
      'Use the provided prompt in any AI (Claude, ChatGPT, etc.)',
      'Don\'t skip questions that make you uncomfortable',
      'Be honest in your answers',
      'Update your vision if the AI reveals important gaps',
    ],
    required: false,
    inputType: 'textarea',
    rows: 8,
  },
];

export function getStepsByPhase(phase: string): StepConfig[] {
  return GUIDED_STEPS.filter(step => step.phase === phase);
}

export function getPhaseProgress(phase: string, data: Record<string, string>): number {
  const phaseSteps = getStepsByPhase(phase);
  const completed = phaseSteps.filter(step => {
    const value = data[step.field];
    return value && value.length > 0;
  }).length;
  return phaseSteps.length > 0 ? (completed / phaseSteps.length) * 100 : 0;
}
