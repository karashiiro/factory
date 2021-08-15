import { dirname, fromFileUrl } from "path";
import { Drash } from "drash";
import { Tengine } from "tengine";
import { configure, renderFile } from "eta";
import { getCopy } from "./cms.ts";
import {
  getArticlesOnPage,
  getPageCount,
  getPageUrl,
  getPaginationInfo,
} from "./pagination.ts";
import { sass } from "./sass.ts";
import {
  ARTICLE_PATH_PREFIX,
  COPY_CSV_URL,
  PAGES_PATH_PREFIX,
} from "./app_config.ts";
import { loadDocument } from "./document.ts";

async function RerenderCSSMiddleware(
  req: Drash.Http.Request,
): Promise<void> {
  if (req.url_path.startsWith("/css")) {
    await sass("scss:www/css").execute();
  }
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

    const articles = getArticlesOnPage(copy, pageNumber);

    // Check if the page number is past the end
    if (pageNumber > Math.max(1, getPageCount(copy.length))) {
      this.response.status_code = 404;
      this.response.body = "Not Found";
      return this.response;
    }

    this.response.headers.set("Content-Type", "text/html");
    this.response.body = await this.response.render(
      "./index",
      {
        articles,
        articlePathPrefix: ARTICLE_PATH_PREFIX,
        pagesPathPrefix: PAGES_PATH_PREFIX,
        pages: getPaginationInfo(pageNumber, copy.length),
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

      // Pull down the article
      const { documentInnerHtml, stylesheetFileName } = await loadDocument(
        documentInfo,
      );

      this.response.headers.set("Content-Type", "text/html");
      this.response.body = await this.response.render(
        "./article",
        {
          documentInnerHtml,
          extraStyleLinks:
            `<link rel="stylesheet" href="/css/${stylesheetFileName}">`,
        },
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
const pathMap: { [key: string]: string } = { "/scss": "/scss" };
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
