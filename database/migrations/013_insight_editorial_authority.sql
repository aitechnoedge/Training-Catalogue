BEGIN;

ALTER TABLE content.blog_posts
  ADD COLUMN IF NOT EXISTS author_profile_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reviewer_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reviewer_profile_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS source_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_assistance_disclosure text NOT NULL DEFAULT '';

-- Existing articles predate the editorial gate. They remain publicly available,
-- but need a fresh editorial review before search engines can index them again.
UPDATE content.blog_posts
SET indexable = false,
    updated_at = now()
WHERE indexable = true
  AND (
    trim(author_profile_url) = ''
    OR trim(reviewer_name) = ''
    OR trim(reviewer_profile_url) = ''
    OR reviewed_at IS NULL
    OR cardinality(source_urls) < 2
  );

COMMENT ON COLUMN content.blog_posts.author_profile_url IS
  'Verified HTTPS profile used for public attribution and Article structured data.';
COMMENT ON COLUMN content.blog_posts.reviewer_name IS
  'Named subject-matter reviewer required before an article can be indexable.';
COMMENT ON COLUMN content.blog_posts.source_urls IS
  'Editorially approved HTTPS evidence links rendered visibly on the article.';
COMMENT ON COLUMN content.blog_posts.reviewed_at IS
  'Date of the latest material editorial review; not updated for cosmetic edits.';
COMMENT ON COLUMN content.blog_posts.ai_assistance_disclosure IS
  'Optional public disclosure when AI materially assisted the content workflow.';

INSERT INTO catalogue.schema_migrations (version)
VALUES ('013_insight_editorial_authority')
ON CONFLICT (version) DO NOTHING;

COMMIT;
