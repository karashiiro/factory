import { ARTICLES_PER_PAGE, DEPLOYMENT_PATH_PREFIX, PAGES_PATH_PREFIX } from "./app_config.ts";
import { Copy, CopyRow } from "./cms.ts";

export function getPageUrl(pageNumber: number, deploying: boolean=false) {
  return (deploying ? DEPLOYMENT_PATH_PREFIX : "") + PAGES_PATH_PREFIX + "/" + pageNumber;
}

export function getPageCount(articleCount: number): number {
  return Math.ceil(articleCount / ARTICLES_PER_PAGE);
}

export function getArticlesOnPage(copy: Copy, pageNumber: number): CopyRow[] {
  const startIndex = ARTICLES_PER_PAGE * (pageNumber - 1);
  const endIndex = Math.min(startIndex + ARTICLES_PER_PAGE, copy.length);
  return copy.slice(startIndex, endIndex);
}

export function getPaginationInfo(
  pageNumber: number,
  articleCount: number,
  deploying: boolean=false,
): any {
  const prevPageNumber = pageNumber - 1 > 0 ? pageNumber - 1 : null;
  const nextPageNumber = pageNumber + 1 > getPageCount(articleCount)
    ? null
    : pageNumber + 1;
  const lastPageNumber = getPageCount(articleCount);

  const prevPageEnabled = pageNumber !== 1;
  const nextPageEnabled = nextPageNumber != null;

  return {
    first: {
      pageNumber: 1,
      enabled: true,
      url: getPageUrl(1, deploying),
    },
    prev: {
      pageNumber: prevPageNumber,
      enabled: prevPageEnabled,
      url: !prevPageEnabled
        ? "javascript:void(0);"
        : getPageUrl(prevPageNumber!, deploying),
    },
    curr: {
      pageNumber,
      enabled: true,
      url: "javascript:void(0);",
    },
    next: {
      pageNumber: nextPageNumber,
      enabled: nextPageEnabled,
      url: !nextPageEnabled ? "javascript:void(0);"
      : getPageUrl(nextPageNumber!, deploying),
    },
    last: {
      pageNumber: lastPageNumber,
      enabled: true,
      url: getPageUrl(lastPageNumber!, deploying),
    },
  };
}
