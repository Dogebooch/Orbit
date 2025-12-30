export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'web' | 'mobile' | 'api' | 'tool' | 'other';
  vision: {
    problem: string;
    target_user: string;
    success_metrics: string;
    why_software: string;
    target_level: string;
  };
  userProfile: {
    primary_user: string;
    goal: string;
    context: string;
    frustrations: string;
    technical_comfort: string;
    time_constraints: string;
    persona_name: string;
    persona_role: string;
  };
  suggestedFeatures: string[];
  techStackHints: {
    frontend?: string;
    backend?: string;
    database?: string;
    deployment?: string;
  };
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start from scratch with a clean slate',
    icon: '📄',
    category: 'other',
    vision: {
      problem: '',
      target_user: '',
      success_metrics: '',
      why_software: '',
      target_level: 'mvp',
    },
    userProfile: {
      primary_user: '',
      goal: '',
      context: '',
      frustrations: '',
      technical_comfort: 'medium',
      time_constraints: '',
      persona_name: '',
      persona_role: '',
    },
    suggestedFeatures: [],
    techStackHints: {},
  },
  {
    id: 'saas-web-app',
    name: 'SaaS Web Application',
    description: 'Subscription-based web application with user accounts',
    icon: '🚀',
    category: 'web',
    vision: {
      problem: 'Users struggle with [specific pain point] and need a streamlined solution that saves time and reduces errors.',
      target_user: 'Small to medium business owners and professionals who need to [key activity] but find current solutions too complex or expensive.',
      success_metrics: '- User can complete core workflow in under 5 minutes\n- 80% of users return within 7 days\n- Average session duration of 10+ minutes\n- NPS score of 40+',
      why_software: 'Manual processes are time-consuming and error-prone. A software solution can automate repetitive tasks, ensure consistency, and provide real-time insights.',
      target_level: 'mvp',
    },
    userProfile: {
      primary_user: 'A busy professional who needs to accomplish [task] efficiently without technical expertise.',
      goal: 'Complete [primary task] quickly and accurately so they can focus on higher-value work.',
      context: 'Uses the app during work hours, often on desktop. May check on mobile occasionally. Values reliability over fancy features.',
      frustrations: '- Current solutions require too many steps\n- Data entry is tedious and error-prone\n- Lack of visibility into progress and status\n- Poor integration with existing tools',
      technical_comfort: 'medium',
      time_constraints: 'Busy schedule, needs quick wins. Can spend 15-30 minutes learning the app initially.',
      persona_name: 'Alex',
      persona_role: 'Operations Manager',
    },
    suggestedFeatures: [
      'User authentication (email/password)',
      'Dashboard with key metrics',
      'CRUD operations for main data type',
      'Search and filtering',
      'Export to CSV/PDF',
      'Settings and preferences',
    ],
    techStackHints: {
      frontend: 'react-vite',
      backend: 'supabase',
      database: 'supabase-postgres',
      deployment: 'vercel',
    },
  },
  {
    id: 'mobile-app',
    name: 'Mobile Application',
    description: 'iOS/Android app with offline support',
    icon: '📱',
    category: 'mobile',
    vision: {
      problem: 'Users need to [key action] on the go but existing solutions are desktop-focused or have poor mobile experiences.',
      target_user: 'Mobile-first users who primarily interact with services through their phones and expect instant, tap-friendly experiences.',
      success_metrics: '- App store rating of 4.5+\n- Day 1 retention of 40%+\n- Crash-free rate of 99.5%+\n- Session length of 3+ minutes',
      why_software: 'A native mobile experience enables offline access, push notifications, and device integration (camera, GPS) that web apps cannot match.',
      target_level: 'mvp',
    },
    userProfile: {
      primary_user: 'A mobile-savvy individual who prefers apps over websites and expects smooth, native interactions.',
      goal: 'Accomplish [task] while on the move, during commute, or in situations where desktop access is impractical.',
      context: 'Uses phone as primary device. Often in variable network conditions. Short attention span for individual sessions.',
      frustrations: '- Mobile websites are clunky and slow\n- Data not available offline\n- Too many steps to complete simple tasks\n- Apps that drain battery',
      technical_comfort: 'high',
      time_constraints: 'Short bursts of usage throughout the day. Needs to accomplish tasks in under 2 minutes.',
      persona_name: 'Jordan',
      persona_role: 'Young Professional',
    },
    suggestedFeatures: [
      'Social login (Google, Apple)',
      'Offline mode with sync',
      'Push notifications',
      'Camera integration',
      'Quick actions / shortcuts',
      'Dark mode',
    ],
    techStackHints: {
      frontend: 'react-vite',
      backend: 'supabase',
      database: 'supabase-postgres',
      deployment: 'vercel',
    },
  },
  {
    id: 'api-backend',
    name: 'API / Backend Service',
    description: 'RESTful or GraphQL API for other applications',
    icon: '⚙️',
    category: 'api',
    vision: {
      problem: 'Developers need programmatic access to [data/functionality] but no reliable, well-documented API exists.',
      target_user: 'Software developers and technical teams who need to integrate [capability] into their own applications.',
      success_metrics: '- API uptime of 99.9%+\n- Response time under 200ms for 95th percentile\n- Developer satisfaction score of 4.5/5\n- Time to first successful API call under 30 minutes',
      why_software: 'A well-designed API enables third-party integrations, automation, and ecosystem development that manual processes cannot support.',
      target_level: 'mvp',
    },
    userProfile: {
      primary_user: 'A backend developer integrating external services into their product.',
      goal: 'Quickly integrate [capability] with minimal code and clear documentation.',
      context: 'Works in a development environment, tests locally before deploying. Values stability and predictability.',
      frustrations: '- Poor or outdated documentation\n- Breaking API changes without warning\n- Inconsistent error messages\n- Rate limits that are too restrictive',
      technical_comfort: 'high',
      time_constraints: 'Evaluates tools quickly. If integration takes more than 1 hour, will look for alternatives.',
      persona_name: 'Sam',
      persona_role: 'Senior Developer',
    },
    suggestedFeatures: [
      'API key authentication',
      'Rate limiting',
      'Comprehensive error handling',
      'OpenAPI/Swagger documentation',
      'Webhook support',
      'Health check endpoint',
    ],
    techStackHints: {
      frontend: 'vanilla',
      backend: 'nodejs',
      database: 'supabase-postgres',
      deployment: 'railway',
    },
  },
  {
    id: 'cli-tool',
    name: 'CLI Tool',
    description: 'Command-line interface for developers',
    icon: '💻',
    category: 'tool',
    vision: {
      problem: 'Developers waste time on repetitive [task] that could be automated with a simple command.',
      target_user: 'Developers and DevOps engineers who prefer terminal-based workflows and scriptable tools.',
      success_metrics: '- Command execution under 1 second for common operations\n- Zero-config quick start\n- Scriptable output (JSON/plain text)\n- Works on macOS, Linux, and Windows',
      why_software: 'CLI tools integrate seamlessly into existing developer workflows, CI/CD pipelines, and can be combined with other tools.',
      target_level: 'mvp',
    },
    userProfile: {
      primary_user: 'A developer who lives in the terminal and values efficiency and scriptability.',
      goal: 'Automate [task] and integrate it into existing workflows and scripts.',
      context: 'Uses terminal daily. Expects tools to follow Unix conventions. Often works in CI/CD environments.',
      frustrations: '- GUIs for simple tasks\n- Tools that require manual configuration\n- Inconsistent argument parsing\n- Poor error messages',
      technical_comfort: 'high',
      time_constraints: 'Wants to install and use in under 5 minutes. Long documentation is acceptable if searchable.',
      persona_name: 'Morgan',
      persona_role: 'DevOps Engineer',
    },
    suggestedFeatures: [
      'Install via npm/brew/curl',
      'Help and usage commands',
      'Config file support',
      'JSON and human-readable output',
      'Progress indicators',
      'Verbose/quiet modes',
    ],
    techStackHints: {
      frontend: 'vanilla',
      backend: 'nodejs',
      database: 'sqlite',
      deployment: 'local',
    },
  },
  {
    id: 'browser-extension',
    name: 'Browser Extension',
    description: 'Chrome/Firefox extension for web enhancement',
    icon: '🧩',
    category: 'tool',
    vision: {
      problem: 'Users repeatedly perform [tedious action] while browsing that could be automated or enhanced with a browser extension.',
      target_user: 'Power users who want to customize and enhance their browsing experience with productivity tools.',
      success_metrics: '- Install-to-active-use conversion of 60%+\n- Daily active users / Weekly active users of 40%+\n- Uninstall rate under 30% in first week\n- Chrome Web Store rating of 4.5+',
      why_software: 'Browser extensions can intercept and enhance web pages in ways that external tools cannot, providing seamless integration.',
      target_level: 'mvp',
    },
    userProfile: {
      primary_user: 'A productivity-focused individual who uses browser extensions to customize their workflow.',
      goal: 'Enhance [specific website or workflow] without leaving the browser or switching contexts.',
      context: 'Uses browser as primary work tool. May have multiple extensions installed. Concerned about privacy and performance.',
      frustrations: '- Context switching between apps\n- Repetitive manual tasks\n- Extensions that slow down the browser\n- Privacy-invasive tools',
      technical_comfort: 'medium',
      time_constraints: 'Expects extension to work immediately after install. Minimal configuration tolerance.',
      persona_name: 'Taylor',
      persona_role: 'Knowledge Worker',
    },
    suggestedFeatures: [
      'Popup UI with quick actions',
      'Content script injection',
      'Options/settings page',
      'Keyboard shortcuts',
      'Badge notifications',
      'Cross-browser support',
    ],
    techStackHints: {
      frontend: 'react-vite',
      backend: 'none',
      database: 'none',
      deployment: 'local',
    },
  },
  {
    id: 'landing-page',
    name: 'Landing Page / Marketing Site',
    description: 'Static site with contact form and analytics',
    icon: '🌐',
    category: 'web',
    vision: {
      problem: 'The business needs an online presence to capture leads and communicate value proposition effectively.',
      target_user: 'Potential customers researching solutions and evaluating whether to engage with the business.',
      success_metrics: '- Time on page of 2+ minutes\n- Scroll depth of 75%+\n- Form submission rate of 3%+\n- Bounce rate under 50%',
      why_software: 'A well-designed landing page works 24/7 to capture and qualify leads while building brand credibility.',
      target_level: 'mvp',
    },
    userProfile: {
      primary_user: 'A potential customer evaluating whether this product/service meets their needs.',
      goal: 'Quickly understand the value proposition and take the next step (sign up, contact, or learn more).',
      context: 'Found the page through search, ads, or referral. Comparing multiple options. Mobile traffic is significant.',
      frustrations: '- Confusing navigation\n- Unclear pricing or offering\n- Slow page load times\n- Intrusive popups',
      technical_comfort: 'low',
      time_constraints: 'Will decide to engage or leave within 30 seconds. Needs clear value prop immediately.',
      persona_name: 'Casey',
      persona_role: 'Decision Maker',
    },
    suggestedFeatures: [
      'Hero section with clear CTA',
      'Feature highlights',
      'Social proof / testimonials',
      'Contact / signup form',
      'FAQ section',
      'Analytics integration',
    ],
    techStackHints: {
      frontend: 'react-vite',
      backend: 'none',
      database: 'none',
      deployment: 'vercel',
    },
  },
];

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: ProjectTemplate['category']): ProjectTemplate[] {
  return PROJECT_TEMPLATES.filter(t => t.category === category);
}

