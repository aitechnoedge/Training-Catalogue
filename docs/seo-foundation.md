# TechnoEdge SEO foundation

## Canonical URL policy

- Production origin: `https://www.technoedgels.com`
- Homepage: `/`
- The former application path `/website/` permanently redirects to `/`.
- Programme canonical URLs use the current uppercase catalogue ID, for example `/programmes/TT0001`.
- Catalogue filters and search parameters canonicalize to `/catalogue` and are not sitemap URLs.
- Crawlable programme-directory pagination uses `/catalogue/page/2` and later pages. Each directory page is prerendered, self-canonical and included in the page sitemap; `/catalogue/page/1` is not used.
- Admin, API, aliases, placeholders, error pages and redirecting URLs are not included in sitemaps.

## Generated crawler files

`npm run generate:seo` queries the published catalogue and writes:

- `public/robots.txt`
- `public/sitemap.xml`
- `public/sitemap-pages.xml`
- `public/sitemap-programmes.xml`
- `public/sitemap-insights.xml`
- `public/sitemap-careers.xml`

The programme sitemap uses published `RB`, `TT`, `TC` and `CER` records from PostgreSQL plus the twelve checked-in `PP` programmes. `DATABASE_URL` is required so a partial catalogue sitemap cannot be deployed accidentally. The insight sitemap and `public/insights.xml` RSS feed use the same indexability policy, so noindex or draft articles never enter either discovery file.

The root `npm run build` command refreshes the sitemap before compilation and runs `npm run verify:seo` against the final `dist` output afterward.

## Indexability policy

The sitemap contains the homepage, catalogue, crawlable catalogue-directory pages, e-learning, approved landing pages, insights index, careers index and programme detail pages that are both published and explicitly SEO-approved. Directory pages contain up to 48 direct programme links so catalogue discovery does not depend on JavaScript filters.

Insight detail pages receive `noindex, follow` until they pass the editorial authority gate. This is deliberately separate from publication: `published` makes an article available to readers, while `indexable` makes it eligible for organic discovery, RSS and the insight sitemap.

An indexable managed insight requires a named individual author and HTTPS profile, a named subject-matter reviewer and HTTPS profile, a material review date, at least two approved HTTPS sources, an 800-word body, three H2 sections, a complete 80–160 character excerpt and descriptive featured-image alt text. The public page renders the reviewer, review date and sources, while its `BlogPosting` schema exposes matching authorship, reviewer and citation data. Migration `013_insight_editorial_authority.sql` turns off indexing for legacy articles that lack these fields; editors must explicitly complete and approve them before re-enabling indexing.

Career roles use the same publication discipline. A role may appear on the careers page while it is `noindex`; it becomes indexable, enters `sitemap-careers.xml`, and receives `JobPosting` markup only when the employer has confirmed the full role description, responsibilities, requirements, application instructions, location, posting date and future closing date. The career quality report prevents a role from accidentally becoming indexable without this time-sensitive hiring information.

## Operational guides

- Use `docs/seo-release-workflow.md` to remediate, approve and release held programme pages.
- Use `docs/seo-launch-handoff.md` for production configuration, cutover, submissions, monitoring and rollback.

## Rendering and status behavior

Indexable routes are prerendered with their H1, page body, metadata, canonical, structured data and internal links in the initial response. Unknown routes use the generated `404` document and production routing rules rather than returning the shared application shell with a successful status.

## Performance guardrails

The catalogue’s initial client entry is capped at 450 KB before compression and its initial stylesheet at 190 KB. Non-critical support, enquiry and consent interfaces load after initial rendering (or immediately when an enquiry interaction requires them), while crawlable page content remains in the prerendered document. `npm run verify:seo` enforces these asset budgets alongside canonical, sitemap and initial-HTML checks. Lighthouse CI remains the field-like release check for Core Web Vitals and accessibility.

The corporate training gallery serves a generated 1,200 px WebP variant to supporting browsers, keeps the original photograph only as a compatibility fallback, and declares intrinsic image dimensions to minimize layout movement. `npm run assets:optimize:corporate` regenerates these variants; it runs during `prebuild` so a production build cannot use stale gallery output.
