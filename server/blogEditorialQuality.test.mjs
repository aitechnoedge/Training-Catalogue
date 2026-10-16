import assert from 'node:assert/strict';
import test from 'node:test';
import { validateBlogInput } from './blogRepository.mjs';

const substantiveContent = [
  '<h2>Enterprise context</h2>',
  `<p>${Array.from({ length: 300 }, () => 'evidence').join(' ')}</p>`,
  '<h2>Delivery approach</h2>',
  `<p>${Array.from({ length: 300 }, () => 'application').join(' ')}</p>`,
  '<h2>Decision framework</h2>',
  `<p>${Array.from({ length: 300 }, () => 'outcome').join(' ')}</p>`,
].join('');

const approvedArticle = {
  title: 'How enterprise teams establish practical AI readiness',
  slug: 'enterprise-ai-readiness',
  category: 'AI & Automation',
  status: 'published',
  contentHtml: substantiveContent,
  excerpt: 'A practical framework for enterprise leaders to assess AI capability, governance, delivery readiness, and measurable business outcomes.',
  authorName: 'Asha Menon',
  authorProfileUrl: 'https://www.technoedgels.com/authors/asha-menon',
  reviewerName: 'Ravi Shah',
  reviewerProfileUrl: 'https://www.technoedgels.com/authors/ravi-shah',
  reviewedAt: '2026-10-01T09:00:00.000Z',
  sourceUrls: [
    'https://www.nist.gov/itl/ai-risk-management-framework',
    'https://www.oecd.org/en/topics/sub-issues/artificial-intelligence.html',
  ],
  featuredImageUrl: 'https://www.technoedgels.com/assets/ai-readiness.jpg',
  featuredImageAlt: 'Enterprise team reviewing an AI readiness plan',
  indexable: true,
};

test('accepts a reviewed evidence-led article for search indexing', () => {
  const article = validateBlogInput(approvedArticle);
  assert.equal(article.indexable, true);
  assert.equal(article.readTimeMinutes, 5);
  assert.equal(article.sourceUrls.length, 2);
  assert.equal(article.authorProfileUrl, 'https://www.technoedgels.com/authors/asha-menon');
});

test('rejects an indexable article without verified editorial authority', () => {
  assert.throws(
    () => validateBlogInput({ ...approvedArticle, authorName: 'TechnoEdge Editorial Team', reviewerName: '', sourceUrls: [] }),
    /verified individual author.*subject-matter reviewer.*at least two approved HTTPS sources/i,
  );
});

test('permits legacy drafts to remain available for editorial remediation', () => {
  const article = validateBlogInput({
    title: 'Legacy article awaiting review',
    category: 'Technology',
    status: 'draft',
    contentHtml: '<p>Short legacy content.</p>',
    excerpt: 'Short legacy excerpt',
    authorName: 'TechnoEdge Editorial Team',
    indexable: false,
  });
  assert.equal(article.indexable, false);
  assert.equal(article.readTimeMinutes, 1);
});

test('requires HTTPS for every public evidence source', () => {
  assert.throws(
    () => validateBlogInput({ ...approvedArticle, sourceUrls: ['http://example.com/source', approvedArticle.sourceUrls[1]] }),
    /sources must use HTTPS/i,
  );
});
