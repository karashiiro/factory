import { dirname, fromFileUrl } from "path";
import { DOMParser } from "deno-dom";
import { Drash } from "drash";
import { Tengine } from "tengine";
import { configure, renderFile } from "eta";
import { getCopy, getDocument } from "./cms.ts";
import {
  ARTICLE_PATH_PREFIX,
  ARTICLES_PER_PAGE,
  COPY_CSV_URL,
  PAGES_PATH_PREFIX,
} from "./app_config.ts";

async function RerenderCSSMiddleware(
  req: Drash.Http.Request,
): Promise<void> {
  if (req.url_path.startsWith("/css")) {
    const renderProcess = Deno.run({
      cmd: ["sass", "scss:www/css"],
    });
    await renderProcess.status();
  }
}

function getPageUrl(pageNumber: number) {
  return PAGES_PATH_PREFIX + "/" + pageNumber;
}

function getPageCount(pages: number): number {
  return Math.ceil(pages / ARTICLES_PER_PAGE);
}

class HomeResource extends Drash.Http.Resource {
  static paths = ["/", `${PAGES_PATH_PREFIX}/:pageNumber`];
  public async GET() {
    // Get the requested page number
    let pageNumber: number;
    let pageNumberRequested = this.request.getPathParam("pageNumber");
    if (pageNumberRequested == null) {
      pageNumber = 1;
    } else if (!isNaN(parseInt(pageNumberRequested))) {
      pageNumber = parseInt(pageNumberRequested);
    } else { // Bad page number
      this.response.redirect(302, "/");
      return this.response;
    }

    // Export the copy
    const copy = await getCopy(COPY_CSV_URL);
    if (copy == null) {
      this.response.status_code = 404;
      this.response.body = "Not Found";
      return this.response;
    }

    // Sort in timestamp-descending order
    copy.sort((a, b) => b.postDate.valueOf() - a.postDate.valueOf());

    const startIndex = ARTICLES_PER_PAGE * (pageNumber - 1);
    const endIndex = Math.min(startIndex + ARTICLES_PER_PAGE, copy.length);
    const articles = copy.slice(startIndex, endIndex);

    // Check if the page number is past the end
    if (pageNumber > Math.max(1, getPageCount(copy.length))) {
      this.response.status_code = 404;
      this.response.body = "Not Found";
      return this.response;
    }

    // Pagination things
    const prevPageNumber = pageNumber - 1 > 0 ? pageNumber - 1 : null;
    const nextPageNumber = pageNumber + 1 > getPageCount(copy.length)
      ? null
      : pageNumber + 1;
    const lastPageNumber = getPageCount(copy.length);

    const prevPageEnabled = pageNumber !== 1;
    const nextPageEnabled = nextPageNumber != null;

    this.response.headers.set("Content-Type", "text/html");
    this.response.body = await this.response.render(
      "./index",
      {
        articles,
        articlePathPrefix: ARTICLE_PATH_PREFIX,
        pagesPathPrefix: PAGES_PATH_PREFIX,
        pages: {
          first: {
            pageNumber: 1,
            enabled: true,
            url: getPageUrl(1),
          },
          prev: {
            pageNumber: prevPageNumber,
            enabled: prevPageEnabled,
            url: !prevPageEnabled
              ? "javascript:void(0);"
              : getPageUrl(prevPageNumber!),
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
            : getPageUrl(nextPageNumber!),
          },
          last: {
            pageNumber: lastPageNumber,
            enabled: true,
            url: getPageUrl(lastPageNumber!),
          },
        },
        getPageUrl,
      },
    );
    return this.response;
  }
}

class ArticleResource extends Drash.Http.Resource {
  static paths = [`${ARTICLE_PATH_PREFIX}/:fileName`];
  public async GET() {
    try {
      const fileName = this.request.getPathParam("fileName");

      // Export the copy
      const copy = await getCopy(COPY_CSV_URL);
      const documentInfo = copy.find((r) => r.fileName === fileName);
      if (documentInfo == null) {
        this.response.status_code = 404;
        this.response.body = "Not Found";
        return this.response;
      }

      // Export document and pull out article body
      const documentHtml = await getDocument(documentInfo.url);
      const dom = new DOMParser().parseFromString(documentHtml, "text/html");
      const documentInnerHtml = dom?.querySelector("body")?.innerHTML;
      if (documentInnerHtml == null) {
        this.response.status_code = 500;
        this.response.body = "Internal Server Error";
        return this.response;
      }

      this.response.headers.set("Content-Type", "text/html");
      this.response.body = await this.response.render(
        "./article",
        { documentInnerHtml },
      );
      return this.response;
    } catch (err) {
      console.error("Error:", err);
      throw err;
    }
  }
}

// Eta configuration
configure({ views: "./templates/" });

// Map static paths. We can't just map the entire www folder as a static directory because
// we need to reserve the "/" route for our generated index page.
const pathMap: { [key: string]: string } = {};
for await (const item of Deno.readDir("www")) {
  pathMap[`/${item.name}`] = `/www/${item.name}`;
}

console.log("Using path map:", pathMap);

const server = new Drash.Http.Server({
  directory: dirname(fromFileUrl(import.meta.url)),
  logger: new Drash.CoreLoggers.ConsoleLogger({
    enabled: true,
    level: "debug",
  }),
  middleware: {
    before_request: [RerenderCSSMiddleware],
    after_resource: [Tengine({
      render: async (...args: unknown[]): Promise<string> => {
        return await renderFile(
          args[0] as string,
          args[1] as any,
        ) as string;
      },
    })],
  },
  resources: [HomeResource, ArticleResource],
  static_paths: pathMap,
});

server.run({
  hostname: "localhost",
  port: 3788,
});

console.log(`Server running at http://${server.hostname}:${server.port}/`);
