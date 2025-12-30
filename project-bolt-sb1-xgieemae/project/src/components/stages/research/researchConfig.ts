export interface ResearchSection {
  id: string;
  title: string;
  description: string;
  field: string;
  placeholder: string;
  whyItMatters: string;
  bestPractices: string[];
  supportsImages: boolean;
  rows: number;
  icon: string;
}

export const RESEARCH_SECTIONS: ResearchSection[] = [
  {
    id: 'competitor_analysis',
    title: 'Competitor Analysis',
    description: 'Research existing solutions and competitors in your space. Understanding what already exists helps you identify gaps and opportunities.',
    field: 'competitor_analysis',
    placeholder: `List 3-5 competitors or similar solutions:

1. [Competitor Name]
   - What they do well:
   - What they do poorly:
   - Pricing:
   - Target audience:

2. [Competitor Name]
   ...

Key takeaways:
- What can we learn from them?
- What gaps can we fill?
- How can we differentiate?`,
    whyItMatters: 'Competitor research prevents you from rebuilding worse versions of existing tools. It helps you identify what users already like, what frustrates them, and where opportunities exist.',
    bestPractices: [
      'Focus on 3-5 main competitors rather than an exhaustive list',
      'Include both direct competitors and alternative solutions',
      'Look at pricing, features, target users, and user reviews',
      'Identify specific gaps or problems they don\'t solve well',
      'Screenshot key features for reference',
    ],
    supportsImages: true,
    rows: 12,
    icon: 'Target',
  },
  {
    id: 'target_market',
    title: 'Target Market Research',
    description: 'Deep dive into your target market - who they are, where to find them, and what they need.',
    field: 'target_market',
    placeholder: `Market Size & Demographics:
- Estimated number of potential users:
- Geographic focus:
- Age range / demographics:
- Income level / budget:

Where to find them:
- Communities (Reddit, Discord, forums):
- Social media platforms:
- Industry events:
- Publications they read:

Market Trends:
- Growing or shrinking?
- Key pain points:
- Willingness to pay:`,
    whyItMatters: 'Understanding your market helps validate demand, identify distribution channels, and inform pricing decisions. A clear target market makes marketing and user acquisition much easier.',
    bestPractices: [
      'Be specific about market size with numbers',
      'List actual communities and channels where you can find users',
      'Note any seasonal patterns or timing considerations',
      'Research if people are currently paying for solutions',
      'Identify early adopters vs mainstream users',
    ],
    supportsImages: true,
    rows: 12,
    icon: 'Users',
  },
  {
    id: 'unique_value',
    title: 'Unique Value Proposition',
    description: 'What makes your solution different and better? Why would someone choose you over alternatives?',
    field: 'unique_value',
    placeholder: `Our unique advantages:

1. [First Key Differentiator]
   - Why it matters to users:
   - Why competitors don't do this:

2. [Second Key Differentiator]
   ...

3. [Third Key Differentiator]
   ...

In one sentence: We help [target user] to [achieve goal] by [unique approach]

Example: "We help freelancers invoice clients in under 30 seconds through AI-powered templates and one-click sending"`,
    whyItMatters: 'A clear value proposition guides all product decisions and makes it easier to explain your product to users, investors, and yourself. If you can\'t articulate why someone should use your product, they won\'t.',
    bestPractices: [
      'Focus on benefits, not just features',
      'Explain why competitors can\'t or won\'t do what you do',
      'Make it specific and measurable when possible',
      'Test your one-sentence pitch on real people',
      'Avoid jargon and buzzwords',
    ],
    supportsImages: false,
    rows: 10,
    icon: 'Sparkles',
  },
  {
    id: 'user_interviews',
    title: 'User Interviews & Feedback',
    description: 'Document conversations with potential users. Real user insights are invaluable for building the right product.',
    field: 'user_interviews',
    placeholder: `Interview 1: [Name/Role]
Date: [Date]
Key insights:
- Pain point mentioned:
- Current solution:
- Willingness to switch:
- Must-have features:
- Nice-to-have features:
- Pricing feedback:

Interview 2: [Name/Role]
...

Common themes across interviews:
- [Theme 1]
- [Theme 2]
- [Theme 3]`,
    whyItMatters: 'Talking to real users prevents building based on assumptions. User interviews reveal priorities, pain points, and willingness to pay that desk research can\'t uncover.',
    bestPractices: [
      'Talk to at least 5 potential users before building',
      'Ask about their current workflow, not your solution',
      'Focus on pain points, not feature requests',
      'Ask about willingness to pay early',
      'Record quotes verbatim - they\'re gold for marketing',
    ],
    supportsImages: false,
    rows: 12,
    icon: 'MessageSquare',
  },
  {
    id: 'technical_requirements',
    title: 'Technical Requirements',
    description: 'Document technical constraints, integrations, and infrastructure needs.',
    field: 'technical_requirements',
    placeholder: `Core Technologies:
- Frontend: [React, Vue, etc.]
- Backend: [Node, Python, etc.]
- Database: [Postgres, MongoDB, etc.]
- Hosting: [Vercel, AWS, etc.]

Required Integrations:
- [Stripe for payments]
- [SendGrid for emails]
- [Auth0 for authentication]

Performance Requirements:
- Page load time: [< 2 seconds]
- Max response time: [< 500ms]
- Expected traffic: [100 users/day initially]

Security & Compliance:
- Data encryption needs
- GDPR/privacy requirements
- Authentication method`,
    whyItMatters: 'Understanding technical requirements early prevents costly rewrites later. It helps you choose the right tools and identify potential blockers before you hit them.',
    bestPractices: [
      'List required integrations with specific services',
      'Note performance expectations with numbers',
      'Consider scalability from day one',
      'Document any regulatory requirements',
      'Identify technical risks and unknowns',
    ],
    supportsImages: true,
    rows: 12,
    icon: 'Code',
  },
  {
    id: 'design_inspiration',
    title: 'Design Inspiration',
    description: 'Collect examples of designs, interfaces, and user experiences you want to emulate or learn from.',
    field: 'design_inspiration',
    placeholder: `Design References:

[App/Website Name]
- What works well: [Clean dashboard layout]
- What to avoid: [Too many colors]
- Screenshot attached: [Yes/No]

[App/Website Name]
- What works well: [Simple onboarding flow]
- What to avoid: [Hidden settings]
- Screenshot attached: [Yes/No]

Key Design Principles for our app:
- [Principle 1: Minimize clicks]
- [Principle 2: Mobile-first]
- [Principle 3: Accessible to non-technical users]

Color scheme ideas:
- Primary color:
- Accent color:
- Inspiration:`,
    whyItMatters: 'Design inspiration helps communicate vision to AI coding tools and designers. Screenshots and references make it much easier to describe what you want than trying to explain from scratch.',
    bestPractices: [
      'Attach screenshots or links to every example',
      'Note what specifically you like about each example',
      'Also note what to avoid',
      'Focus on UX patterns, not just visual style',
      'Consider your users\' technical comfort level',
    ],
    supportsImages: true,
    rows: 12,
    icon: 'Palette',
  },
];

export function getSectionById(id: string): ResearchSection | undefined {
  return RESEARCH_SECTIONS.find(section => section.id === id);
}
