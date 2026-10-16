import 'dotenv/config';

import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { careerJobs } from '../src/data/careersData';
import { insightsArticles } from '../src/data/insightsData';
import type { ImportedArticleContent } from '../src/components/insights/InsightArticlePage';
import { peopleProcessProgrammes } from '../src/data/peopleProcessProgrammes';
import { indexableRoutes, resolveSeoDocument, type SeoDocument } from '../src/seo/routeManifest';
import type { AppInitialData } from '../src/App';
import type { BaseProgramme, PeopleProcessProgramme } from '../src/types';
import { closePool, getPool } from '../server/database.mjs';
import { getPublicBlog, listPublicBlogs } from '../server/blogRepository.mjs';
import { CATALOGUE_DIRECTORY_PAGE_SIZE, catalogueDirectoryPath } from '../src/seo/cataloguePagination';

const projectRoot = path.resolve(import.meta.dirname, '..');
const distRoot = path.join(projectRoot, 'dist');
const ssrRoot = path.join(projectRoot, '.runtime', 'ssr');

type RootRenderer = (url: string, initialData?: AppInitialData) => Promise<string>;
type SimpleRenderer = () => Promise<string>;

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const safeJson = (value: unknown) => JSON.stringify(value)
  .replace(/</g, '\\u003c')
  .replace(/-->/g, '--\\u003e');

const renderHead = (document: SeoDocument) => [
  `<title>${escapeHtml(document.title)}</title>`,
  `<meta name="description" content="${escapeHtml(document.description)}" />`,
  `<meta name="robots" content="${escapeHtml(document.robots)}" />`,
  document.canonicalUrl ? `<link rel="canonical" href="${escapeHtml(document.canonicalUrl)}" />` : '',
  '<meta property="og:site_name" content="TechnoEdge Learning Services" />',
  `<meta property="og:title" content="${escapeHtml(document.title)}" />`,
  `<meta property="og:description" content="${escapeHtml(document.description)}" />`,
  `<meta property="og:type" content="${document.openGraph.type}" />`,
  document.canonicalUrl ? `<meta property="og:url" content="${escapeHtml(document.canonicalUrl)}" />` : '',
  `<meta property="og:image" content="${escapeHtml(document.openGraph.image)}" />`,
  '<meta name="twitter:card" content="summary_large_image" />',
  `<meta name="twitter:title" content="${escapeHtml(document.title)}" />`,
  `<meta name="twitter:description" content="${escapeHtml(document.description)}" />`,
  `<meta name="twitter:image" content="${escapeHtml(document.openGraph.image)}" />`,
  ...document.jsonLd.map((entry, index) => `<script id="technoedge-route-structured-data-${index + 1}" data-technoedge-route-schema="true" type="application/ld+json">${safeJson(entry)}</script>`),
].filter(Boolean).join('\n    ');

const stripRouteHead = (html: string) => html
  .replace(/\s*<title>[\s\S]*?<\/title>/i, '')
  .replace(/\s*<meta\s+(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'][^>]*>/gi, '')
  .replace(/\s*<link\s+rel=["']canonical["'][^>]*>/gi, '')
  .replace(/\s*<script[^>]+data-technoedge-route-schema=["']true["'][^>]*>[\s\S]*?<\/script>/gi, '');

const injectDocument = (
  template: string,
  markup: string,
  document?: SeoDocument,
  initialData?: AppInitialData,
) => {
  let html = document ? stripRouteHead(template) : template;
  if (document) html = html.replace('</head>', `    ${renderHead(document)}\n  </head>`);
  // React 19 emits image preload hints ahead of the rendered application.
  // Leaving them as children of #root makes the browser DOM differ from the
  // client component tree and causes hydration to abort. Hoist those hints to
  // the document head before injecting the application markup.
  const resourceHints = [...markup.matchAll(/<link\b[^>]*\brel=["']preload["'][^>]*\/?\s*>/gi)]
    .map((match) => match[0]);
  const applicationMarkup = markup.replace(/<link\b[^>]*\brel=["']preload["'][^>]*\/?\s*>/gi, '');
  if (resourceHints.length) {
    html = html.replace('</head>', `    ${[...new Set(resourceHints)].join('\n    ')}\n  </head>`);
  }
  const initialDataScript = initialData
    ? `<script id="__TECHNOEDGE_INITIAL_DATA__" type="application/json">${safeJson(initialData)}</script>`
    : '';
  return html.replace('<div id="root"></div>', `<div id="root">${applicationMarkup}</div>${initialDataScript}`);
};

const outputPathForRoute = (route: string) => {
  const normalized = route.replace(/^\/+|\/+$/g, '');
  if (!normalized) return path.join(distRoot, 'index.html');
  return path.join(distRoot, `${normalized}.html`);
};

async function writeRoute(route: string, html: string) {
  const target = outputPathForRoute(route);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html, 'utf8');
}

async function buildSsrBundles() {
  await build({
    root: projectRoot,
    configFile: path.join(projectRoot, 'vite.config.ts'),
    build: {
      ssr: path.join(projectRoot, 'src', 'entry-server.tsx'),
      outDir: path.join(ssrRoot, 'root'),
      emptyOutDir: true,
      minify: false,
    },
  });
  await build({
    root: path.join(projectRoot, 'apps', 'corporate-site'),
    configFile: path.join(projectRoot, 'apps', 'corporate-site', 'vite.config.ts'),
    base: '/website/',
    build: {
      ssr: path.join(projectRoot, 'apps', 'corporate-site', 'src', 'entry-server.tsx'),
      outDir: path.join(ssrRoot, 'corporate'),
      emptyOutDir: true,
      minify: false,
    },
  });
  await build({
    root: path.join(projectRoot, 'apps', 'e-learning'),
    configFile: path.join(projectRoot, 'apps', 'e-learning', 'vite.config.ts'),
    base: '/e-learning/',
    build: {
      ssr: path.join(projectRoot, 'apps', 'e-learning', 'src', 'entry-server.tsx'),
      outDir: path.join(ssrRoot, 'e-learning'),
      emptyOutDir: true,
      minify: false,
    },
  });
}

const importRenderer = async <T>(directory: string): Promise<T> => {
  const module = await import(`${pathToFileURL(path.join(directory, 'entry-server.js')).href}?v=${Date.now()}`);
  return module.render as T;
};

async function mapConcurrent<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index]);
    }
  });
  await Promise.all(runners);
}

async function mapConcurrentResults<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

const durationLabel = (minutes: number | null | undefined) => {
  if (!minutes || minutes <= 0) return undefined;
  if (minutes % 60 === 0) return `${minutes / 60} ${minutes === 60 ? 'Hour' : 'Hours'}`;
  return `${minutes} Minutes`;
};

async function loadPublishedProgrammes(): Promise<BaseProgramme[]> {
  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT ccv.*,
        c.seo_indexable, c.seo_title, c.seo_description,
        ARRAY(SELECT item.objective FROM catalogue.course_objectives item WHERE item.course_id = c.course_id ORDER BY item.display_order) AS seo_objectives,
        ARRAY(SELECT item.audience FROM catalogue.course_audiences item WHERE item.course_id = c.course_id ORDER BY item.display_order) AS seo_audiences,
        ARRAY(SELECT item.prerequisite FROM catalogue.course_prerequisites item WHERE item.course_id = c.course_id ORDER BY item.display_order) AS seo_prerequisites,
        COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id', module.module_code,
            'title', module.title,
            'description', module.description,
            'learningPathTitle', module.learning_path_title,
            'learningPathDescription', module.learning_path_description,
            'durationMinutes', module.duration_minutes,
            'appliedExerciseTitle', module.applied_exercise_title,
            'appliedExerciseContent', module.applied_exercise_content,
            'learningOutcomes', ARRAY(SELECT outcome.outcome FROM catalogue.module_learning_outcomes outcome WHERE outcome.module_id = module.id AND outcome.outcome_type = 'learning_objective' ORDER BY outcome.display_order),
            'concepts', ARRAY(SELECT outcome.outcome FROM catalogue.module_learning_outcomes outcome WHERE outcome.module_id = module.id AND outcome.outcome_type IN ('concept', 'topic') ORDER BY outcome.display_order),
            'practicalActivities', ARRAY(SELECT outcome.outcome FROM catalogue.module_learning_outcomes outcome WHERE outcome.module_id = module.id AND outcome.outcome_type IN ('practical_activity', 'lab') ORDER BY outcome.display_order)
          ) ORDER BY module.display_order)
          FROM catalogue.course_modules module
          WHERE module.course_id = c.course_id
        ), '[]'::jsonb) AS seo_modules,
        COALESCE((SELECT jsonb_agg(to_jsonb(item) - 'id' - 'course_id' - 'display_order' ORDER BY item.display_order) FROM catalogue.course_scenarios item WHERE item.course_id = c.course_id), '[]'::jsonb) AS seo_scenarios,
        COALESCE((SELECT jsonb_agg(to_jsonb(item) - 'id' - 'course_id' - 'display_order' ORDER BY item.display_order) FROM catalogue.certification_exams item WHERE item.course_id = c.course_id), '[]'::jsonb) AS seo_exams,
        COALESCE((SELECT jsonb_agg(to_jsonb(item) - 'id' - 'course_id' - 'display_order' ORDER BY item.display_order) FROM catalogue.certification_objectives item WHERE item.course_id = c.course_id), '[]'::jsonb) AS seo_certification_objectives,
        COALESCE((SELECT jsonb_agg(to_jsonb(item) - 'id' - 'course_id' - 'display_order' ORDER BY item.display_order) FROM catalogue.certification_requirements item WHERE item.course_id = c.course_id), '[]'::jsonb) AS seo_certification_requirements,
        COALESCE((SELECT jsonb_agg(to_jsonb(item) - 'id' - 'course_id' - 'display_order' ORDER BY item.display_order) FROM catalogue.certification_training_resources item WHERE item.course_id = c.course_id), '[]'::jsonb) AS seo_training_resources,
        COALESCE((SELECT jsonb_agg(to_jsonb(item) - 'id' - 'course_id' - 'display_order' ORDER BY item.display_order) FROM catalogue.certification_lifecycle_items item WHERE item.course_id = c.course_id), '[]'::jsonb) AS seo_lifecycle
      FROM catalogue.course_catalogue_view ccv
      JOIN catalogue.courses c ON c.course_id = ccv.course_id
      WHERE c.status = 'published'
      ORDER BY c.course_id
    `);

    return result.rows.map((row: Record<string, any>): BaseProgramme => {
      const publicCategory = row.category_code === 'tools-technology'
        ? 'ai-tools'
        : row.category_code === 'technical-training'
          ? 'tools-technology'
          : row.category_code;
      const programme: BaseProgramme & Record<string, unknown> = {
        id: row.course_id,
        title: row.title,
        category: publicCategory,
        level: row.level_code,
        duration: durationLabel(row.duration_minutes),
        format: row.format || undefined,
        seoIndexable: row.seo_indexable === true,
        seoTitle: row.seo_title || undefined,
        seoDescription: row.seo_description || undefined,
        details: {
          summary: row.summary || undefined,
          objective: row.objective || row.seo_objectives.join('\n'),
          objectives: row.seo_objectives,
          audience: row.seo_audiences,
          prerequisitesList: row.seo_prerequisites,
          delivery: row.delivery || undefined,
          approach: row.approach || undefined,
          format: row.format || undefined,
          toolsCovered: row.tools_covered || [],
          modules: row.seo_modules.map((module: Record<string, any>) => ({
            id: module.id,
            title: module.title,
            description: module.description || undefined,
            learningPathTitle: module.learningPathTitle || undefined,
            learningPathDescription: module.learningPathDescription || undefined,
            duration: durationLabel(module.durationMinutes),
            learningOutcomes: module.learningOutcomes || [],
            concepts: module.concepts || [],
            practicalActivities: module.practicalActivities || [],
            ...(module.appliedExerciseTitle ? { appliedExercise: { title: module.appliedExerciseTitle, content: module.appliedExerciseContent } } : {}),
          })),
          scenarios: row.seo_scenarios.map((item: Record<string, any>) => ({
            title: item.title,
            workflow: item.workflow || undefined,
            description: item.content,
            content: [item.workflow, item.content].filter(Boolean).join('\n\n'),
          })),
        },
      };

      if (row.category_code === 'tools-technology') Object.assign(programme, {
        categoryBadge: 'Tool or Technology', toolLogoUrl: row.tool_logo_url || '', toolName: row.tool_name,
        vendor: row.vendor, skillArea: row.skill_area || undefined, technologyCategory: row.technology_categories || [],
      });
      if (row.category_code === 'technical-training') Object.assign(programme, {
        categoryBadge: 'Tool or Technology', toolLogoUrl: '', toolName: row.primary_technology,
        vendor: row.technical_vendor || 'Various', skillArea: row.technical_domain,
        technologyCategory: row.technology_categories || [], sourceCourseId: row.source_course_id,
      });
      if (row.category_code === 'role-based') Object.assign(programme, {
        categoryBadge: 'Role-Based Programme', imageUrl: row.image_url || '', relatedSkills: row.related_skills || [],
        industry: row.industry || undefined, department: row.department || undefined,
        functionName: row.function_name || undefined, roleTitle: row.role_title || undefined,
      });
      if (row.category_code === 'certifications') {
        Object.assign(programme, {
          categoryBadge: 'Certification Programme', provider: row.certification_provider,
          providerCourseCode: row.course_code_public === false ? undefined : row.certification_code,
          examCode: row.certification_exam_code || undefined, courseUrl: row.certification_url || undefined,
          productTechnologies: row.product_technologies || [], roles: row.certification_roles || [],
          recordKind: row.certification_record_kind || 'training-course', credentialType: row.credential_type || undefined,
          credentialClassification: row.credential_classification || undefined, credentialStatus: row.credential_status || undefined,
          credentialLevel: row.credential_level || undefined, examDuration: row.exam_duration_text || undefined,
          validityRenewal: row.validity_renewal || undefined,
        });
        programme.details = {
          ...programme.details,
          provider: row.certification_provider,
          providerCourseCode: row.course_code_public === false ? undefined : row.certification_code,
          examCode: row.certification_exam_code || undefined,
          courseUrl: row.certification_url || undefined,
          productTechnologies: row.product_technologies || [],
          roles: row.certification_roles || [],
          subjects: row.certification_subjects || [],
          languageCodes: row.language_codes || [],
          certificationInformation: row.certification_information || undefined,
          recordKind: row.certification_record_kind || 'training-course',
          credentialType: row.credential_type || undefined,
          credentialClassification: row.credential_classification || undefined,
          credentialStatus: row.credential_status || undefined,
          credentialLevel: row.credential_level || undefined,
          categoryTrack: row.certification_category_track || undefined,
          examFormatDelivery: row.exam_format_delivery || undefined,
          examDuration: row.exam_duration_text || undefined,
          timeLimit: row.time_limit_text || undefined,
          price: row.price_text || undefined,
          retakeFee: row.retake_fee_text || undefined,
          validityRenewal: row.validity_renewal || undefined,
          requiredExamPathway: row.required_exam_pathway || undefined,
          exams: row.seo_exams.map((item: Record<string, any>) => ({
            examCode: item.exam_code || undefined, examName: item.exam_name || undefined,
            status: item.exam_status || undefined, requirementType: item.requirement_type || undefined,
            duration: item.duration_text || durationLabel(item.duration_minutes), deliveryFormat: item.delivery_format || undefined,
            deliveryProvider: item.delivery_provider || undefined, proctored: item.proctored || undefined,
            languages: item.languages || [], price: item.price || undefined, currency: item.currency || undefined,
            passingScore: item.passing_score || undefined, url: item.exam_url || undefined, notes: item.notes || undefined,
          })),
          certificationObjectives: row.seo_certification_objectives.map((item: Record<string, any>) => ({
            groupTitle: item.group_title || undefined, objective: item.objective, weight: item.weight || undefined,
            level: item.objective_level || undefined, code: item.objective_code || undefined,
          })),
          certificationRequirements: row.seo_certification_requirements.map((item: Record<string, any>) => ({
            type: item.requirement_type || undefined, group: item.requirement_group || undefined,
            requirement: item.requirement, url: item.requirement_url || undefined,
            qualifier: item.qualifier || undefined, notes: item.notes || undefined,
          })),
          trainingResources: row.seo_training_resources.map((item: Record<string, any>) => ({
            type: item.resource_type || undefined, title: item.title, url: item.resource_url || undefined,
            duration: item.duration_text || undefined, itemCount: item.item_count || undefined,
            relationship: item.relationship || undefined, notes: item.notes || undefined,
          })),
          lifecycle: row.seo_lifecycle.map((item: Record<string, any>) => ({
            recordType: item.record_type || undefined, status: item.status || undefined,
            validityRenewal: item.validity_renewal || undefined, retirementTransition: item.retirement_transition || undefined,
            details: item.details || undefined, scenario: item.scenario || undefined, option: item.option_text || undefined,
            action: item.action_text || undefined, outcome: item.outcome || undefined,
          })),
        };
      }
      return programme as BaseProgramme;
    });
  } finally {
    await closePool();
  }
}

async function loadManagedInsights() {
  const pool = getPool();
  try {
    const importedInsightSlugs = new Set(insightsArticles.map((article) => article.id));
    const articles = (await listPublicBlogs(pool, { limit: 500 }) as Array<{ id: string }>)
      .filter((article) => !importedInsightSlugs.has(article.id));
    const records = await mapConcurrentResults(articles, 4, async (article) => {
      const result = await getPublicBlog(pool, article.id);
      if (!result || 'redirect' in result) return null;
      return result;
    });
    return records.filter((record): record is Exclude<typeof record, null> => record !== null);
  } finally {
    await closePool();
  }
}

await buildSsrBundles();

const [renderRoot, renderCorporate, renderELearning] = await Promise.all([
  importRenderer<RootRenderer>(path.join(ssrRoot, 'root')),
  importRenderer<SimpleRenderer>(path.join(ssrRoot, 'corporate')),
  importRenderer<SimpleRenderer>(path.join(ssrRoot, 'e-learning')),
]);

const appShellPath = path.join(distRoot, 'app-shell.html');
const rootTemplate = await readFile(appShellPath, 'utf8')
  .catch(() => readFile(path.join(distRoot, 'index.html'), 'utf8'));

const publishedProgrammes = await loadPublishedProgrammes();
const managedInsights = await loadManagedInsights();
const indexableProgrammes = publishedProgrammes.filter((programme) => programme.seoIndexable);
const peopleProcessForLinks = peopleProcessProgrammes.map((programme) => ({
  id: programme.id,
  title: programme.title,
  category: programme.subType === 'Process' ? 'process-based' : 'people-behavioural',
}));
const programmeDirectory = [
  ...indexableProgrammes.map((programme) => ({ id: programme.id, title: programme.title, category: programme.category })),
  ...peopleProcessForLinks,
].sort((left, right) => left.id.localeCompare(right.id));
const programmeLinksByCategory = new Map<string, Array<{ id: string; title: string }>>();
for (const programme of programmeDirectory) {
  const links = programmeLinksByCategory.get(programme.category) ?? [];
  links.push({ id: programme.id, title: programme.title });
  programmeLinksByCategory.set(programme.category, links);
}
const cataloguePages = Array.from(
  { length: Math.ceil(programmeDirectory.length / CATALOGUE_DIRECTORY_PAGE_SIZE) },
  (_, index) => programmeDirectory
    .slice(index * CATALOGUE_DIRECTORY_PAGE_SIZE, (index + 1) * CATALOGUE_DIRECTORY_PAGE_SIZE)
    .map(({ id, title }) => ({ id, title })),
);
const catalogueTotalPages = cataloguePages.length;

await mapConcurrent(indexableRoutes, 8, async (route) => {
  const category = route.path.startsWith('/catalogue/') ? route.path.slice('/catalogue/'.length) : null;
  const programmeLinks = route.path === '/catalogue'
    ? cataloguePages[0]
    : category
      ? (programmeLinksByCategory.get(category) ?? []).slice(0, 24)
      : undefined;
  const initialData: AppInitialData | undefined = programmeLinks?.length
    ? {
        programmeLinks,
        programmeLinksPath: route.path,
        ...(route.path === '/catalogue' ? { catalogueTotalPages } : {}),
      }
    : undefined;
  const markup = await renderRoot(route.path, initialData);
  await writeRoute(route.path, injectDocument(rootTemplate, markup, resolveSeoDocument(route.path), initialData));
});

const paginatedCataloguePages = cataloguePages.slice(1).map((programmeLinks, index) => ({
  page: index + 2,
  programmeLinks,
}));

await mapConcurrent(paginatedCataloguePages, 8, async ({ page, programmeLinks }) => {
  const route = catalogueDirectoryPath(page);
  const initialData: AppInitialData = {
    programmeLinks,
    programmeLinksPath: route,
    catalogueTotalPages,
  };
  const markup = await renderRoot(route, initialData);
  await writeRoute(route, injectDocument(rootTemplate, markup, resolveSeoDocument(route), initialData));
});

await mapConcurrent(publishedProgrammes, 12, async (programme) => {
    const route = `/programmes/${programme.id}`;
    const relatedProgrammes = (programmeLinksByCategory.get(programme.category) ?? [])
      .filter((related) => related.id !== programme.id)
      .slice(0, 8);
    const initialData: AppInitialData = {
      programme,
      programmePath: route,
      programmeLinks: relatedProgrammes,
      programmeLinksPath: route,
    };
    const markup = await renderRoot(route, initialData);
    await writeRoute(route, injectDocument(rootTemplate, markup, resolveSeoDocument(route, { selectedProgramme: programme }), initialData));
});

await mapConcurrent(peopleProcessProgrammes, 8, async (sourceProgramme) => {
  const category = sourceProgramme.subType === 'Process' ? 'process-based' : 'people-behavioural';
  const programme: PeopleProcessProgramme = {
    ...sourceProgramme,
    category,
    badge: category === 'process-based' ? 'Process Based' : 'People & Behavioural',
    seoIndexable: true,
  };
  const route = `/programmes/${programme.id}`;
  const relatedProgrammes = (programmeLinksByCategory.get(category) ?? [])
    .filter((related) => related.id !== programme.id)
    .slice(0, 8);
  const initialData: AppInitialData = {
    programme,
    programmePath: route,
    programmeLinks: relatedProgrammes,
    programmeLinksPath: route,
  };
  const markup = await renderRoot(route, initialData);
  await writeRoute(route, injectDocument(rootTemplate, markup, resolveSeoDocument(route, { selectedProgramme: programme }), initialData));
});

await mapConcurrent(insightsArticles, 8, async (article) => {
  const route = `/insights/${article.id}`;
  const contentPath = path.join(projectRoot, 'public', 'insights-content', `${article.id}.json`);
  const insightContent = JSON.parse(await readFile(contentPath, 'utf8'));
  const initialData: AppInitialData = { insightContent, insightSlug: article.id };
  const markup = await renderRoot(route, initialData);
  await writeRoute(route, injectDocument(rootTemplate, markup, resolveSeoDocument(route), initialData));
});

const importedInsightSlugs = new Set(insightsArticles.map((article) => article.id));
const managedInsightRecords = managedInsights.filter(({ article }) => !importedInsightSlugs.has(article.id));
await mapConcurrent(managedInsightRecords, 8, async ({ article, contentHtml, referenceTable }) => {
  const route = `/insights/${article.id}`;
  const insightContent: ImportedArticleContent = { content: '', tables: referenceTable || '', contentHtml };
  const initialData: AppInitialData = { insightArticle: article, insightContent, insightSlug: article.id };
  const markup = await renderRoot(route, initialData);
  await writeRoute(route, injectDocument(rootTemplate, markup, resolveSeoDocument(route, { insightArticle: article }), initialData));
});

await mapConcurrent(careerJobs, 4, async (job) => {
  const route = `/careers/${job.slug}`;
  const markup = await renderRoot(route);
  await writeRoute(route, injectDocument(rootTemplate, markup, resolveSeoDocument(route)));
});

const corporateTemplatePath = path.join(distRoot, 'website', 'index.html');
const eLearningTemplatePath = path.join(distRoot, 'e-learning', 'index.html');
const [corporateTemplate, eLearningTemplate] = await Promise.all([
  readFile(corporateTemplatePath, 'utf8'),
  readFile(eLearningTemplatePath, 'utf8'),
]);
await Promise.all([
  renderCorporate().then((markup) => writeFile(corporateTemplatePath, injectDocument(corporateTemplate, markup), 'utf8')),
  renderELearning().then((markup) => writeFile(eLearningTemplatePath, injectDocument(eLearningTemplate, markup), 'utf8')),
]);

// Preserve a named copy of the client shell for the restricted admin route only.
await writeFile(appShellPath, rootTemplate, 'utf8');
// Vercel gives a physical /index.html precedence over rewrites. Publish the
// fully rendered corporate page at the root so / is the real Home page even
// before JavaScript runs, while /app-shell remains available to /adminzz.
await cp(corporateTemplatePath, path.join(distRoot, 'index.html'));

console.log(`Prerendered ${indexableRoutes.length} primary routes, ${catalogueTotalPages} catalogue directory pages, programme pages, ${insightsArticles.length + managedInsightRecords.length} insights and ${careerJobs.length} career details.`);
