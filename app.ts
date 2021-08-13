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
  if (req.url_path.startsWith("css")) {
    const renderProcess = Deno.run({
      cmd: ["sass", "scss:www/css"],
    });
    await renderProcess.status();
  }
}

class HomeResource extends Drash.Http.Resource {
  static paths = ["/", `${PAGES_PATH_PREFIX}/:pageNumber`];
  public async GET() {
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

    const copy = await getCopy(COPY_CSV_URL);
    if (copy == null) {
      this.response.status_code = 404;
      this.response.body = "Not Found";
      return this.response;
    }

    const startIndex = ARTICLES_PER_PAGE * pageNumber;
    const endIndex = Math.min(startIndex + ARTICLES_PER_PAGE, copy.length - 1);
    const articles = copy.slice(startIndex, endIndex);

    this.response.headers.set("Content-Type", "text/html");
    this.response.body = await this.response.render(
      "./index",
      {
        articles,
        pageNumber,
        nextPageNumber: pageNumber > (copy.length / ARTICLES_PER_PAGE)
          ? null
          : pageNumber + 1,
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
  static_paths: {
    "/css": "/www/css",
  },
});

server.run({
  hostname: "localhost",
  port: 3788,
});

console.log(`Server running at http://${server.hostname}:${server.port}/`);
