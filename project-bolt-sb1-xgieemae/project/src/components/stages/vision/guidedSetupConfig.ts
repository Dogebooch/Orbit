export interface StepExample {
  bad: string;
  good: string;
  badLabel?: string;
  goodLabel?: string;
}

export interface StepConfig {
  id: string;
  phase: 'vision' | 'user' | 'metrics';
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
    optional?: boolean;
  }[];
  minLength?: number;
  validationHint?: string;
}

export interface AdditionalContextField {
  id: string;
  label: string;
  placeholder: string;
  field: string;
  dataType: 'vision' | 'profile';
  inputType: 'textarea' | 'input' | 'select';
  rows?: number;
  options?: { value: string; label: string; description?: string }[];
}

export const PHASES = [
  { id: 'vision', title: 'Define the Problem', icon: 'Lightbulb', steps: 3 },
  { id: 'user', title: 'Know Your User', icon: 'Users', steps: 1 },
  { id: 'metrics', title: 'Measure Success', icon: 'Target', steps: 2 },
];

export const GUIDED_STEPS: StepConfig[] = [
  // Step 1: Problem Statement (required)
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

  // Step 2: Target User (required)
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

  // Step 3: Why Software? (required - changed from optional)
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
    required: true,
    inputType: 'textarea',
    rows: 4,
  },

  // Step 4: User Persona & Goal (required) - MERGED from persona + goal
  {
    id: 'persona_goal',
    phase: 'user',
    phaseTitle: 'Know Your User',
    title: 'Create your primary user persona and define their goal',
    description: 'Give your target user a name and identity, then define what success looks like for them. Focus on the outcome they want to achieve.',
    field: 'persona_goal',
    dataType: 'profile',
    placeholder: '',
    whyItMatters: 'A named persona makes abstract "users" feel real. When you\'re stuck on a design decision, you can ask "What would Sarah prefer?" The goal helps you focus on outcomes, not features.',
    bestPractices: [
      'Give them a realistic name (optional but helpful)',
      'Define their specific role or job',
      'Focus on the outcome, not the feature',
      'Use action words (get, complete, understand, save)',
    ],
    examples: {
      bad: 'Business user wants a dashboard',
      good: 'Sarah, a freelance designer, wants to get paid faster by sending professional invoices immediately after completing work',
      badLabel: 'Generic, feature-focused',
      goodLabel: 'Named persona, outcome-focused with clear benefit',
    },
    required: true,
    inputType: 'multi-field',
    subFields: [
      { id: 'persona_name', label: 'Persona Name (optional)', placeholder: 'e.g., Sarah, Mike, Alex', type: 'input', optional: true },
      { id: 'persona_role', label: 'Role / Job Title (optional)', placeholder: 'e.g., freelance graphic designer, small business owner', type: 'input', optional: true },
      { id: 'primary_user', label: 'User Description', placeholder: 'e.g., A freelance graphic designer who bills 10-15 clients per month and prefers quick, simple tools', type: 'textarea', rows: 2 },
      { id: 'goal', label: 'User Goal (Job-to-be-done)', placeholder: 'e.g., Get paid faster by sending professional invoices immediately after completing work', type: 'textarea', rows: 2 },
    ],
  },

  // Step 5: Target Level (required)
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

  // Step 6: Success Metrics (optional)
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
];

// Additional context fields (shown in collapsible section)
export const ADDITIONAL_CONTEXT_FIELDS: AdditionalContextField[] = [
  {
    id: 'context',
    label: 'When & Where',
    placeholder: 'When and where will users use this? e.g., Right after finishing a client project, usually on a laptop, often between meetings...',
    field: 'context',
    dataType: 'profile',
    inputType: 'textarea',
    rows: 3,
  },
  {
    id: 'frustrations',
    label: 'Current Frustrations',
    placeholder: 'What frustrates them about current solutions? e.g., Too many steps, requires learning accounting concepts, templates look unprofessional...',
    field: 'frustrations',
    dataType: 'profile',
    inputType: 'textarea',
    rows: 3,
  },
  {
    id: 'technical_comfort',
    label: 'Technical Comfort Level',
    placeholder: '',
    field: 'technical_comfort',
    dataType: 'profile',
    inputType: 'select',
    options: [
      {
        value: 'low',
        label: 'Low - Needs simple, guided interfaces',
        description: 'No technical background. Avoid jargon. Use wizards and step-by-step flows.'
      },
      {
        value: 'medium',
        label: 'Medium - Comfortable with standard apps',
        description: 'Uses common apps daily. Understands basic patterns like forms, lists, dashboards.'
      },
      {
        value: 'high',
        label: 'High - Can handle advanced features',
        description: 'Power user who appreciates keyboard shortcuts, bulk actions, advanced filters.'
      },
    ],
  },
  {
    id: 'competitor_notes',
    label: 'Competitor Research Notes',
    placeholder: 'Notes from researching similar apps. What do they do well? What do users complain about? What would you steal or avoid?',
    field: 'competitor_notes',
    dataType: 'profile',
    inputType: 'textarea',
    rows: 4,
  },
  {
    id: 'tech_stack',
    label: 'Planned Tech Stack',
    placeholder: 'e.g., React + TypeScript + Vite, Supabase, TailwindCSS',
    field: 'tech_stack',
    dataType: 'vision',
    inputType: 'textarea',
    rows: 2,
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
