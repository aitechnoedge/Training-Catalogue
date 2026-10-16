import { importedInsights } from './importedInsights';

export interface InsightsHeroContent {
  titleLead: string;
  titleBridge: string;
  paragraphs: readonly string[];
}

export const insightsHeroContent: InsightsHeroContent = {
  titleLead: 'Insights That Move',
  titleBridge: 'Learning & Business Forward',
  paragraphs: [
    'Practical perspectives on AI, technology, learning, and workforce transformation grounded in the challenges businesses face today.',
    "Clear, useful ideas designed to help teams build capability, make better decisions, and stay ready for what's next.",
  ],
};

export type InsightCategory =
  | 'AI & Automation'
  | 'Cloud & Security'
  | 'Data & Analytics'
  | 'Leadership'
  | 'Technology'
  | 'Workforce Learning';

export interface InsightArticle {
  id: string;
  title: string;
  category: InsightCategory;
  excerpt: string;
  date: string;
  readTime: string;
  image: string;
  author: string;
  authorProfileUrl?: string;
  reviewer?: string;
  reviewerProfileUrl?: string;
  sourceUrls?: string[];
  reviewedAt?: string;
  aiAssistanceDisclosure?: string;
  imageAlt?: string;
  seoTitle?: string;
  metaDescription?: string;
  url: string;
  indexable: boolean;
  datePublished?: string;
  dateModified?: string;
}

export const insightsArticles: InsightArticle[] = importedInsights.map((article) => ({
  ...article,
  author: article.author === 'admintechnoedge' ? 'TechnoEdge Editorial Team' : article.author,
  category: article.category as InsightCategory,
  url: `/insights/${article.id}`,
  indexable: false,
  datePublished: undefined,
  dateModified: undefined,
  sourceUrls: [],
}));

export const insightCategories: ReadonlyArray<'All' | InsightCategory> = [
  'All',
  'AI & Automation',
  'Data & Analytics',
  'Cloud & Security',
  'Workforce Learning',
  'Leadership',
  'Technology',
];

export interface FeaturedArticleContent extends InsightArticle {
  summary: string;
}

export interface FeaturedPost {
  id: string;
  title: string;
  category: string;
  date: string;
  image: string;
  url: string;
}

export type FeaturedCategory = 'Latest' | 'AI' | 'Security';

const toFeaturedPost = (article: InsightArticle): FeaturedPost => ({
  id: article.id,
  title: article.title,
  category: article.category,
  date: article.date,
  image: article.image,
  url: article.url,
});

const latestArticle = insightsArticles[0];
if (!latestArticle) throw new Error('At least one imported insight is required.');

export const featuredArticle: FeaturedArticleContent = {
  ...latestArticle,
  summary: latestArticle.excerpt,
};

export const featuredPostsByCategory: Record<FeaturedCategory, FeaturedPost[]> = {
  Latest: insightsArticles.slice(1, 11).map(toFeaturedPost),
  AI: insightsArticles.filter((article) => article.category === 'AI & Automation').slice(0, 10).map(toFeaturedPost),
  Security: insightsArticles.filter((article) => article.category === 'Cloud & Security').slice(0, 10).map(toFeaturedPost),
};

export interface InsightArticleRecord extends InsightArticle {}

export const getInsightArticleById = (id: string): InsightArticleRecord | undefined => (
  insightsArticles.find((article) => article.id === id)
);
