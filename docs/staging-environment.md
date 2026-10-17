# Staging environment

TechnoEdge staging is a persistent Vercel custom environment for full pre-production QA. It uses the production build and API paths, but it must use separate data, authentication, storage, admin credentials, and optional email credentials.

## Environment map

| Environment | Vercel target | URL | Data | Search indexing | Scheduled publishing |
| --- | --- | --- | --- | --- | --- |
| Production | `production` | `https://www.technoedgels.com` | Production Supabase/PostgreSQL | Enabled per page | Every five minutes |
| Staging | `staging` | `https://training-catalogue-staging.vercel.app` | Dedicated staging Supabase/PostgreSQL | Blocked in HTML and response headers | Disabled |
| Preview | `preview` | Vercel-generated | No database access unless explicitly isolated | Blocked | Disabled |
| Local | `development` | Local ports | Developer-selected | Built output is blocked | Disabled |

The Vercel target `staging` and its stable Vercel-owned alias were created for project `technoedge-website`. No GoDaddy or public TechnoEdge DNS record is required. Vercel Authentication protects the staging deployment first; after a team member signs in, Routing Middleware applies the separate `STAGING_BASIC_AUTH_USER` and `STAGING_BASIC_AUTH_PASSWORD` gate.

The deployed staging backend is Supabase project `rsvdqkvibgvkoefsslbu` (`TechnoEdge Staging`) with the `technoedge-media-staging` bucket. It contains the full schema and a sanitized 1,174-course catalogue imported from repository source files. It does not contain production enquiries, sessions, audit records, comments, or email-delivery data.

## One-time provisioning

1. Create a separate Supabase project or PostgreSQL database for staging. Do not reuse the production connection string.
2. Create a staging Supabase Auth owner, service-role key, publishable key, and a separate storage bucket.
3. Add the variables listed in [`config/staging.env.example`](../config/staging.env.example) to the Vercel `staging` target. Store credentials as Sensitive values.
4. Generate a long, unique `STAGING_BASIC_AUTH_PASSWORD`; do not reuse an admin or Vercel password.
5. Keep `NON_PRODUCTION_DATA_ISOLATION_CONFIRMED=false` until the database, Supabase project, storage bucket, admin user, cron secret, Basic Auth credentials, and any Resend recipient have all been checked as non-production.
6. Change `NON_PRODUCTION_DATA_ISOLATION_CONFIRMED` to `true` only after that review.
7. Link the Supabase CLI and apply each not-yet-applied repository migration with the linked project's Management API:

   ```powershell
   npx supabase link --project-ref rsvdqkvibgvkoefsslbu
   npx supabase db query --linked --file database/migrations/<migration>.sql
   ```

8. Load a sanitized catalogue/content snapshot. Do not copy production enquiries, comments, sessions, audit records, email deliveries, or secret material.

Example commands for adding values:

```powershell
vercel env add DATABASE_URL staging --sensitive
vercel env add SUPABASE_SERVICE_ROLE_KEY staging --sensitive
vercel env add APP_ENV staging --value staging --no-sensitive --yes
```

## Build and deploy

Deploy the complete monorepo to the custom environment:

```powershell
npm run staging:deploy
```

The remote deployment is the authoritative validation because Vercel does not return Sensitive values when environment variables are pulled locally. It runs all SEO/content audits, builds the catalogue app, e-learning app, corporate site, API, and prerendered routes, then applies the non-production search protections.

## QA gate

Before releasing to production, verify:

- `/api/health` reports `status: ok` and the staging database.
- Catalogue search, filters, programme pages, corporate pages, e-learning, careers, insights, and Training ROI all render correctly.
- Enquiry and contact-action submissions appear only in staging.
- `/adminzz/login`, editing, media upload, comments, scheduling, and audit logs use the staging Supabase project.
- Response headers contain `X-Robots-Tag: noindex, nofollow, noarchive`.
- `/robots.txt` contains `Disallow: /`.
- Users must pass Vercel team authentication; requests that reach the app without the separate QA credentials receive a Basic Auth challenge.
- No live customer notification is sent. Enable Resend only with a controlled staging recipient.
- No IndexNow command is run from staging.

## Release and rollback

Release by merging the reviewed code to `main` so Vercel performs a fresh Production build with Production variables. Do not promote a staging deployment directly to Production because its generated HTML and runtime configuration are intentionally environment-specific.

Rollback staging by redeploying the previous known-good staging deployment. Rollback Production independently through the Vercel Production deployment history.

## Safety behavior

`server/database.mjs` refuses non-production database access unless `NON_PRODUCTION_DATA_ISOLATION_CONFIRMED=true`. This deliberately blocks the existing generic Preview environment from using the database variable it currently shares with Production. Production behavior is unchanged.

Local staging checks and builds use `.vercel/.env.staging.local`, clear every application credential inherited from the shell, and then load only that staging file. Vercel replaces Sensitive values with placeholders when pulling; populate those ignored local entries from the approved secret manager before using the local commands. The remote `npm run staging:deploy` command does not depend on a pulled secret file.

`vercel.mjs` declares the publication cron; Vercel invokes configured crons only for Production deployments. Runtime middleware adds an `X-Robots-Tag` header to every non-production route. The post-build step also replaces every generated HTML robots directive and writes a deny-all `robots.txt`, providing protection even outside Vercel.

`middleware.js` fails closed on the staging target: missing Basic Auth configuration returns `503`, invalid credentials return `401`, and Production bypasses the staging gate entirely.
