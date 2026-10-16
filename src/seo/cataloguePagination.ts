export const CATALOGUE_DIRECTORY_PAGE_SIZE = 48;

export const catalogueDirectoryPath = (page: number) => (
  page <= 1 ? '/catalogue' : `/catalogue/page/${page}`
);

export const catalogueDirectoryPage = (pathname: string) => {
  if (pathname === '/catalogue') return 1;
  const match = /^\/catalogue\/page\/([2-9]|[1-9]\d+)$/.exec(pathname);
  if (!match) return null;
  const page = Number.parseInt(match[1], 10);
  return Number.isSafeInteger(page) ? page : null;
};
