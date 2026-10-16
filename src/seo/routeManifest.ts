import { careerJobs } from '../data/careersData';
import { isIndexableCareerJob } from './careerJobQuality';
import { getInsightArticleById } from '../data/insightsData';
import { getSeoLandingPage, seoLandingPages, type SeoLandingPage } from '../data/seoLandingPages';
import type { BaseProgramme } from '../types';
import type { InsightArticle } from '../data/insightsData';
import { catalogueDirectoryPage, catalogueDirectoryPath } from './cataloguePagination';

export const SITE_ORIGIN = 'https://www.technoedgels.com';
export const SITE_NAME = 'TechnoEdge Learning Services';
export const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
export const NOINDEX_ROBOTS = 'noindex, follow';

export interface SeoDocument {
  title: string;
  description: string;
  canonicalUrl?: string;
  robots: string;
  openGraph: {
    type: 'website' | 'article';
    image: string;
  };
  jsonLd: Record<string, unknown>[];
}

export interface IndexableRoute {
  path: string;
  pageType: 'home' | 'service' | 'category' | 'programme' | 'article' | 'job' | 'market';
  indexable: boolean;
  lastModified?: string;
  loadData(): Promise<unknown>;
}

export interface SeoRouteContext {
  selectedProgramme?: BaseProgramme | null;
  isProgrammeLoading?: boolean;
  programmeLoadError?: string | null;
  search?: string;
  insightArticle?: InsightArticle | null;
}

const DEFAULT_SOCIAL_IMAGE = `${SITE_ORIGIN}/technoedge-brand-logo.png`;
const CAPABILITY_SOCIAL_IMAGE = `${SITE_ORIGIN}/website/assets/hero-ai-capability-ascent-optimized.jpg`;

const absoluteUrl = (path: string) => new URL(path, `${SITE_ORIGIN}/`).href;

export const cleanDescription = (value: string) => {
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length <= 160 ? compact : `${compact.slice(0, 157).trimEnd()}…`;
};

const decodePathSegment = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const breadcrumbData = (items: Array<{ name: string; path: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

const organization = {
  '@type': 'Organization',
  name: SITE_NAME,
  legalName: 'TechnoEdge Learning Services India Pvt. Ltd.',
  url: `${SITE_ORIGIN}/`,
  logo: DEFAULT_SOCIAL_IMAGE,
  email: 'training@technoedgels.com',
  telephone: '+91-93564-33629',
  sameAs: ['https://www.linkedin.com/company/technoedge-learning-services-india-pvt-ltd'],
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Office B-704, B-705 & B-706, 7th Floor, Baner Biz Bay, Laxman Nagar, Baner',
    addressLocality: 'Pune',
    postalCode: '411045',
    addressRegion: 'Maharashtra',
    addressCountry: 'IN',
  },
};

const pageTypeForLanding = (page: SeoLandingPage): IndexableRoute['pageType'] => {
  if (page.kind === 'service' || page.kind === 'solution') return 'service';
  if (page.kind === 'category') return 'category';
  return 'market';
};

export const indexableRoutes: IndexableRoute[] = [
  {
    path: '/catalogue',
    pageType: 'category',
    indexable: true,
    loadData: async () => null,
  },
  {
    path: '/insights',
    pageType: 'article',
    indexable: true,
    loadData: async () => null,
  },
  {
    path: '/careers',
    pageType: 'job',
    indexable: true,
    loadData: async () => null,
  },
  {
    path: '/training-roi',
    pageType: 'service',
    indexable: true,
    loadData: async () => null,
  },
  ...seoLandingPages.map((page): IndexableRoute => ({
    path: page.path,
    pageType: pageTypeForLanding(page),
    indexable: true,
    lastModified: page.updated,
    loadData: async () => page,
  })),
];

const landingDocument = (page: SeoLandingPage): SeoDocument => {
  const canonicalUrl = absoluteUrl(page.path);
  const schemaType = page.kind === 'service'
    ? 'Service'
    : page.kind === 'category'
      ? 'CollectionPage'
      : page.path === '/about'
        ? 'AboutPage'
        : page.path === '/contact'
          ? 'ContactPage'
          : 'WebPage';

  const schema = page.kind === 'service'
    ? {
        '@context': 'https://schema.org',
        '@type': schemaType,
        name: page.h1,
        description: page.answer,
        url: canonicalUrl,
        provider: organization,
        areaServed: ['IN', 'Worldwide'],
        audience: { '@type': 'BusinessAudience', audienceType: page.audience },
      }
    : {
        '@context': 'https://schema.org',
        '@type': schemaType,
        name: page.h1,
        description: page.answer,
        url: canonicalUrl,
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_ORIGIN}/` },
      };

  return {
    title: page.title,
    description: cleanDescription(page.description),
    canonicalUrl,
    robots: INDEX_ROBOTS,
    openGraph: { type: 'website', image: CAPABILITY_SOCIAL_IMAGE },
    jsonLd: [
      schema,
      breadcrumbData([
        { name: 'Home', path: '/' },
        { name: page.h1, path: page.path },
      ]),
    ],
  };
};

export function resolveSeoDocument(pathnameInput: string, context: SeoRouteContext = {}): SeoDocument {
  const pathname = pathnameInput.length > 1 ? pathnameInput.replace(/\/+$/, '') : pathnameInput;
  const landing = getSeoLandingPage(pathname);
  if (landing) return landingDocument(landing);

  if (pathname === '/training-roi') {
    const canonicalUrl = absoluteUrl('/training-roi');
    return {
      title: 'AI Time-Back 360 | Training ROI Measurement | TechnoEdge',
      description: 'Measure the time employees get back after training with TechnoEdge AI Time-Back 360, an outcome-focused training ROI measurement experience.',
      canonicalUrl,
      robots: INDEX_ROBOTS,
      openGraph: { type: 'website', image: DEFAULT_SOCIAL_IMAGE },
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'AI Time-Back 360',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          description: 'A TechnoEdge tool for measuring time saved and training ROI across roles, departments and industries.',
          url: canonicalUrl,
          publisher: organization,
        },
        breadcrumbData([
          { name: 'Home', path: '/' },
          { name: 'Training ROI', path: '/training-roi' },
        ]),
      ],
    };
  }

  if (pathname === '/catalogue') {
    const canonicalUrl = absoluteUrl('/catalogue');
    return {
      title: 'Corporate Training Catalogue | TechnoEdge',
      description: 'Explore role-based, technical, certification, AI, tools, technology, people and process training programmes for enterprise teams.',
      canonicalUrl,
      robots: context.search ? NOINDEX_ROBOTS : INDEX_ROBOTS,
      openGraph: { type: 'website', image: DEFAULT_SOCIAL_IMAGE },
      jsonLd: [{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'TechnoEdge Corporate Training Catalogue',
        url: canonicalUrl,
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_ORIGIN}/` },
      }],
    };
  }

  const cataloguePage = catalogueDirectoryPage(pathname);
  if (cataloguePage && cataloguePage > 1) {
    const canonicalPath = catalogueDirectoryPath(cataloguePage);
    const canonicalUrl = absoluteUrl(canonicalPath);
    const name = `Corporate training programme directory — page ${cataloguePage}`;
    return {
      title: `Corporate Training Programmes — Page ${cataloguePage} | TechnoEdge`,
      description: cleanDescription(`Browse quality-approved TechnoEdge corporate training programmes listed on catalogue directory page ${cataloguePage}.`),
      canonicalUrl,
      robots: context.search ? NOINDEX_ROBOTS : INDEX_ROBOTS,
      openGraph: { type: 'website', image: DEFAULT_SOCIAL_IMAGE },
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name,
          url: canonicalUrl,
          isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_ORIGIN}/` },
        },
        breadcrumbData([
          { name: 'Home', path: '/' },
          { name: 'Training catalogue', path: '/catalogue' },
          { name: `Page ${cataloguePage}`, path: canonicalPath },
        ]),
      ],
    };
  }

  if (pathname.startsWith('/programmes/')) {
    const requestedId = decodePathSegment(pathname.slice('/programmes/'.length)).toUpperCase();
    const programme = context.selectedProgramme;
    if (programme && programme.id !== 'NOT_FOUND') {
      const canonicalId = programme.id.toUpperCase();
      const canonicalPath = `/programmes/${encodeURIComponent(canonicalId)}`;
      const description = cleanDescription(
        programme.seoDescription
        || programme.details?.summary
        || programme.details?.objective
        || `${programme.title} is a TechnoEdge corporate training programme for enterprise teams.`,
      );
      const outcomes = programme.details?.objectives?.filter(Boolean) ?? [];
      const syllabus = programme.details?.modules?.map((module) => ({
        '@type': 'Syllabus',
        name: module.title,
        description: module.description,
      })) ?? [];
      const isIndexable = programme.seoIndexable === true || canonicalId.startsWith('PP');
      return {
        title: programme.seoTitle || `${programme.title} | TechnoEdge Training`,
        description,
        canonicalUrl: absoluteUrl(canonicalPath),
        robots: isIndexable ? INDEX_ROBOTS : NOINDEX_ROBOTS,
        openGraph: {
          type: 'website',
          image: absoluteUrl(
            (programme as BaseProgramme & { imageUrl?: string; toolLogoUrl?: string }).imageUrl
            || (programme as BaseProgramme & { imageUrl?: string; toolLogoUrl?: string }).toolLogoUrl
            || '/website/assets/hero-ai-capability-ascent-optimized.jpg',
          ),
        },
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: programme.title,
            description,
            url: absoluteUrl(canonicalPath),
            provider: organization,
            educationalLevel: programme.level,
            timeRequired: programme.duration,
            teaches: outcomes,
            syllabusSections: syllabus.length ? syllabus : undefined,
            audience: programme.details?.audience?.length
              ? { '@type': 'Audience', audienceType: programme.details.audience.join(', ') }
              : undefined,
          },
          breadcrumbData([
            { name: 'Home', path: '/' },
            { name: 'Training catalogue', path: '/catalogue' },
            { name: programme.title, path: canonicalPath },
          ]),
        ],
      };
    }

    const unavailable = Boolean(context.programmeLoadError) || programme?.id === 'NOT_FOUND';
    return {
      title: unavailable ? 'Programme not found | TechnoEdge' : `Loading ${requestedId || 'programme'} | TechnoEdge`,
      description: unavailable
        ? 'The requested TechnoEdge training programme is not available.'
        : 'Loading programme information from the TechnoEdge corporate training catalogue.',
      robots: NOINDEX_ROBOTS,
      openGraph: { type: 'website', image: DEFAULT_SOCIAL_IMAGE },
      jsonLd: [],
    };
  }

  if (pathname === '/insights') {
    return {
      title: 'Enterprise Learning and Technology Insights | TechnoEdge',
      description: 'Practical perspectives on enterprise AI, data, cloud, security, leadership and workforce capability development.',
      canonicalUrl: absoluteUrl('/insights'),
      robots: INDEX_ROBOTS,
      openGraph: { type: 'website', image: DEFAULT_SOCIAL_IMAGE },
      jsonLd: [],
    };
  }

  if (pathname.startsWith('/insights/')) {
    const slug = decodePathSegment(pathname.slice('/insights/'.length));
    const article = context.insightArticle?.id === slug ? context.insightArticle : getInsightArticleById(slug);
    if (article) {
      const canonicalPath = `/insights/${encodeURIComponent(article.id)}`;
      return {
        title: article.seoTitle || `${article.title} | TechnoEdge Insights`,
        description: cleanDescription(article.metaDescription || article.excerpt),
        canonicalUrl: absoluteUrl(canonicalPath),
        robots: article.indexable ? INDEX_ROBOTS : NOINDEX_ROBOTS,
        openGraph: { type: 'article', image: absoluteUrl(article.image) },
        jsonLd: article.indexable ? [{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: article.title,
          description: cleanDescription(article.metaDescription || article.excerpt),
          url: absoluteUrl(canonicalPath),
          mainEntityOfPage: absoluteUrl(canonicalPath),
          image: absoluteUrl(article.image),
          datePublished: article.datePublished,
          dateModified: article.dateModified,
          author: {
            '@type': article.authorProfileUrl ? 'Person' : 'Organization',
            name: article.author,
            url: article.authorProfileUrl || `${SITE_ORIGIN}/authors/technoedge-editorial-team`,
          },
          reviewedBy: article.reviewer ? {
            '@type': 'Person',
            name: article.reviewer,
            url: article.reviewerProfileUrl || undefined,
          } : undefined,
          citation: article.sourceUrls?.length ? article.sourceUrls : undefined,
          publisher: organization,
        }, breadcrumbData([
          { name: 'Home', path: '/' },
          { name: 'Insights', path: '/insights' },
          { name: article.title, path: canonicalPath },
        ])] : [],
      };
    }
  }

  if (pathname === '/careers') {
    return {
      title: 'Careers at TechnoEdge | Learning, Technology and Innovation',
      description: 'Explore opportunities to build your career in learning, technology, content, design, sales and AI solutions at TechnoEdge.',
      canonicalUrl: absoluteUrl('/careers'),
      robots: INDEX_ROBOTS,
      openGraph: { type: 'website', image: DEFAULT_SOCIAL_IMAGE },
      jsonLd: [],
    };
  }

  if (pathname.startsWith('/careers/')) {
    const slug = decodePathSegment(pathname.slice('/careers/'.length));
    const job = careerJobs.find((item) => item.slug === slug);
    if (job) {
      const canonicalPath = `/careers/${encodeURIComponent(job.slug)}`;
      const jobIndexable = isIndexableCareerJob(job);
      return {
        title: `${job.title} | Careers at TechnoEdge`,
        description: cleanDescription(job.description),
        canonicalUrl: absoluteUrl(canonicalPath),
        robots: jobIndexable ? INDEX_ROBOTS : NOINDEX_ROBOTS,
        openGraph: { type: 'website', image: DEFAULT_SOCIAL_IMAGE },
        jsonLd: jobIndexable ? [{
          '@context': 'https://schema.org',
          '@type': 'JobPosting',
          title: job.title,
          description: job.description,
          datePosted: job.datePosted,
          validThrough: job.validThrough,
          employmentType: job.type === 'Internship' ? 'INTERN' : 'FULL_TIME',
          hiringOrganization: organization,
          jobLocation: {
            '@type': 'Place',
            address: organization.address,
          },
          directApply: true,
          url: absoluteUrl(canonicalPath),
        }, breadcrumbData([
          { name: 'Home', path: '/' },
          { name: 'Careers', path: '/careers' },
          { name: job.title, path: canonicalPath },
        ])] : [],
      };
    }
  }

  if (pathname === '/adminzz' || pathname.startsWith('/adminzz/')) {
    return {
      title: 'Catalogue Administration | TechnoEdge',
      description: 'Restricted catalogue administration area.',
      robots: 'noindex, nofollow, noarchive',
      openGraph: { type: 'website', image: DEFAULT_SOCIAL_IMAGE },
      jsonLd: [],
    };
  }

  return {
    title: context.isProgrammeLoading ? 'Loading | TechnoEdge' : 'Page not found | TechnoEdge',
    description: 'The requested TechnoEdge page is not available.',
    robots: NOINDEX_ROBOTS,
    openGraph: { type: 'website', image: DEFAULT_SOCIAL_IMAGE },
    jsonLd: [],
  };
}
