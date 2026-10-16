export interface CareerPrinciple {
  number: string;
  title: string;
  description: string;
  variant: 'light' | 'blue' | 'soft';
}

export interface CareerJob {
  id: number;
  slug: string;
  title: string;
  department: string;
  type: string;
  location?: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  applicationInstructions: string;
  datePosted?: string;
  validThrough?: string;
  indexable: boolean;
}

export interface CareerPhoto {
  id: string;
  src: string;
  alt: string;
  position: string;
}

export const careerPrinciples: CareerPrinciple[] = [
  {
    number: '01',
    title: 'Learn',
    description: 'Grow your skills through real projects, continuous learning, and practical exposure.',
    variant: 'light',
  },
  {
    number: '02',
    title: 'Build',
    description: 'Contribute to meaningful projects, solve real challenges, and turn ideas into practical solutions.',
    variant: 'blue',
  },
  {
    number: '03',
    title: 'Grow',
    description: 'Take on new responsibilities, expand your capabilities, and build a career with continuous opportunities to progress.',
    variant: 'soft',
  },
];

export const careerJobs: CareerJob[] = [
  {
    id: 1,
    slug: 'designer',
    title: 'Designer',
    department: 'Design',
    type: 'Full-time',
    location: 'Pune',
    description: 'Help shape clear, credible and useful experiences across TechnoEdge learning, technology and enterprise communication work. You will turn ideas and requirements into considered visual solutions that are easy for audiences to understand and use.',
    responsibilities: [
      'Create visual concepts and production-ready design assets for digital learning, marketing and enterprise communication work.',
      'Work with content, learning and technology colleagues to translate requirements into clear user journeys and visual systems.',
      'Maintain consistency across layouts, components, typography, imagery and presentation materials.',
    ],
    requirements: [
      'A portfolio that demonstrates thoughtful visual, interaction or communication design work.',
      'Comfort working with modern design and collaboration tools and incorporating feedback constructively.',
      'Clear communication, attention to detail and an interest in learning, technology or enterprise audiences.',
    ],
    applicationInstructions: 'Email your CV and portfolio link, using “Application for Designer” as the subject. Include a brief note on your availability and preferred work location.',
    indexable: false,
  },
  {
    id: 2,
    slug: 'ai-solutions-intern',
    title: 'AI Solutions Intern',
    department: 'AI Solutions',
    type: 'Internship',
    description: 'Support the exploration and delivery of practical AI-enabled solutions for enterprise learning and business workflows. This internship is suited to someone who enjoys structured problem-solving, testing ideas and explaining technical work clearly.',
    responsibilities: [
      'Research AI tools, workflows and use cases that can improve learning, content or business operations.',
      'Assist with prototypes, prompt experiments, testing and clear documentation of findings.',
      'Collaborate with cross-functional colleagues to turn validated ideas into useful, responsible solution concepts.',
    ],
    requirements: [
      'Interest in applied AI, automation, data or software-enabled problem-solving.',
      'Comfort learning new tools, documenting work carefully and asking well-framed questions.',
      'Clear written and verbal communication and a practical, collaborative approach.',
    ],
    applicationInstructions: 'Email your CV and a short note on an AI, automation or technical project you have explored, using “Application for AI Solutions Intern” as the subject.',
    indexable: false,
  },
  {
    id: 3,
    slug: 'content-creator',
    title: 'Content Creator',
    department: 'Content',
    type: 'Full-time',
    description: 'Create useful, well-researched content that helps enterprise audiences understand learning, technology, data and AI topics. You will make complex subjects clearer without losing the practical detail decision-makers need.',
    responsibilities: [
      'Research, plan, write and edit content for website pages, articles, campaigns and learning-related materials.',
      'Work with subject-matter contributors to turn source information into accurate, reader-focused narratives.',
      'Maintain editorial quality across structure, clarity, tone, citations and search intent.',
    ],
    requirements: [
      'Writing samples that show strong structure, clarity and audience awareness.',
      'Research and editing habits that distinguish evidence from unsupported claims.',
      'Interest in enterprise learning, technology, AI or workforce transformation topics.',
    ],
    applicationInstructions: 'Email your CV and two or three relevant writing samples, using “Application for Content Creator” as the subject. Tell us which type of content you most enjoy creating.',
    indexable: false,
  },
  {
    id: 4,
    slug: 'sales-intern',
    title: 'Sales Intern',
    department: 'Sales',
    type: 'Internship',
    description: 'Support TechnoEdge’s sales team with disciplined market research, prospect preparation and follow-through. This internship suits someone who is organised, curious about business problems and comfortable communicating with professional audiences.',
    responsibilities: [
      'Research target organisations and prepare concise account and contact background for the sales team.',
      'Help maintain accurate prospect, outreach and follow-up information in agreed sales workflows.',
      'Support the preparation of relevant, audience-aware communication and meeting materials.',
    ],
    requirements: [
      'Interest in business development, customer research or enterprise sales.',
      'Strong organisation, written communication and comfort working with structured information.',
      'A respectful, curious approach to understanding customer needs and following agreed processes.',
    ],
    applicationInstructions: 'Email your CV and a brief note on why enterprise sales or business development interests you, using “Application for Sales Intern” as the subject.',
    indexable: false,
  },
];

export const careerPhotos: CareerPhoto[] = [
  {
    id: 'rooftop-gathering',
    src: '/media/careers/team-rooftop-gathering.jpg',
    alt: 'The TechnoEdge team gathered together after a group activity',
    position: 'center 48%',
  },
  {
    id: 'office-celebration',
    src: '/media/careers/team-office-celebration.jpg',
    alt: 'TechnoEdge colleagues celebrating together in the office',
    position: 'center 42%',
  },
  {
    id: 'festive-portrait',
    src: '/media/careers/team-festive-portrait.jpg',
    alt: 'TechnoEdge colleagues in traditional attire during a workplace celebration',
    position: 'center 38%',
  },
  {
    id: 'community-event',
    src: '/media/careers/team-community-event.jpg',
    alt: 'TechnoEdge colleagues together at a community event',
    position: 'center center',
  },
  {
    id: 'festive-women',
    src: '/media/careers/team-festive-women.jpg',
    alt: 'TechnoEdge team members celebrating in traditional attire',
    position: 'center 42%',
  },
  {
    id: 'festive-group',
    src: '/media/careers/team-festive-group.jpg',
    alt: 'The TechnoEdge team posing together during a festive celebration',
    position: 'center 36%',
  },
  {
    id: 'festive-candid',
    src: '/media/careers/team-festive-candid.jpg',
    alt: 'TechnoEdge colleagues sharing a candid moment at the office',
    position: 'center 38%',
  },
  {
    id: 'celebration-selfie',
    src: '/media/careers/team-celebration-selfie.jpg',
    alt: 'TechnoEdge colleagues taking a group selfie during a celebration',
    position: 'center 38%',
  },
  {
    id: 'celebration-women',
    src: '/media/careers/team-celebration-women.jpg',
    alt: 'TechnoEdge team members together at a celebration',
    position: 'center 34%',
  },
  {
    id: 'outdoor-gathering',
    src: '/media/careers/team-outdoor-gathering.jpg',
    alt: 'A large TechnoEdge team gathering outdoors',
    position: 'center center',
  },
  {
    id: 'annual-day',
    src: '/media/careers/team-annual-day.jpg',
    alt: 'TechnoEdge colleagues attending an annual day presentation',
    position: 'center center',
  },
];
