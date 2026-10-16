import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CATALOGUE_DIRECTORY_PAGE_SIZE, catalogueDirectoryPath } from '../seo/cataloguePagination';

interface CatalogueDirectoryPageProps {
  page: number;
  totalPages: number;
  programmes: Array<{ id: string; title: string }>;
}

const pageWindow = (current: number, total: number) => {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  return [...pages].filter((page) => page >= 1 && page <= total).sort((left, right) => left - right);
};

export function CatalogueDirectoryPage({ page, totalPages, programmes }: CatalogueDirectoryPageProps) {
  const headingId = page === 1 ? 'catalogue-directory-heading' : 'catalogue-directory-page-heading';
  const pages = pageWindow(page, totalPages);

  return (
    <section className={`catalogue-directory${page > 1 ? ' catalogue-directory--standalone' : ''}`} aria-labelledby={headingId}>
      <div className="catalogue-directory__shell">
        {page > 1 && (
          <nav className="catalogue-directory__breadcrumbs" aria-label="Breadcrumbs">
            <ol>
              <li><a href="/">Home</a></li>
              <li><a href="/catalogue">Training catalogue</a></li>
              <li aria-current="page">Page {page}</li>
            </ol>
          </nav>
        )}

        <div className="catalogue-directory__heading">
          <p>Programme directory</p>
          {page === 1
            ? <h2 id={headingId}>Browse quality-approved programme pages</h2>
            : <h1 id={headingId}>Corporate training programmes — page {page}</h1>}
          <p>
            {page === 1
              ? 'These crawlable directory pages make the approved catalogue available without relying on JavaScript filters.'
              : `Explore quality-approved TechnoEdge programmes listed on directory page ${page} of ${totalPages}.`}
          </p>
        </div>

        <ol className="catalogue-directory__list" start={(page - 1) * CATALOGUE_DIRECTORY_PAGE_SIZE + 1}>
          {programmes.map((programme) => (
            <li key={programme.id}>
              <a href={`/programmes/${encodeURIComponent(programme.id)}`}>
                <span>{programme.id}</span>
                <strong>{programme.title}</strong>
                <ArrowRight aria-hidden="true" />
              </a>
            </li>
          ))}
        </ol>

        {totalPages > 1 && (
          <nav className="catalogue-directory__pagination" aria-label="Programme directory pages">
            {page > 1 && (
              <a rel="prev" href={catalogueDirectoryPath(page - 1)} aria-label={`Previous directory page, page ${page - 1}`}>
                <ArrowLeft aria-hidden="true" /> Previous
              </a>
            )}
            <div>
              {pages.map((pageNumber, index) => (
                <React.Fragment key={pageNumber}>
                  {index > 0 && pageNumber - pages[index - 1] > 1 && <span aria-hidden="true">…</span>}
                  <a
                    href={catalogueDirectoryPath(pageNumber)}
                    aria-current={pageNumber === page ? 'page' : undefined}
                    aria-label={`Directory page ${pageNumber}`}
                  >
                    {pageNumber}
                  </a>
                </React.Fragment>
              ))}
            </div>
            {page < totalPages && (
              <a rel="next" href={catalogueDirectoryPath(page + 1)} aria-label={`Next directory page, page ${page + 1}`}>
                Next <ArrowRight aria-hidden="true" />
              </a>
            )}
          </nav>
        )}
      </div>
    </section>
  );
}
