import { configure, renderFile } from "eta";
import { copy, emptyDir } from "fs";
import { getCopy } from "./cms.ts";
import { encodeToBytes } from "./encoding.ts";
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
  DEPLOYMENT_PATH_PREFIX,
  PAGES_PATH_PREFIX,
} from "./app_config.ts";
import { loadDocument } from "./document.ts";

// Eta configuration
configure({ views: "./templates/" });

// Create dist
await emptyDir("dist");
await emptyDir("dist/css");
try {
  await Deno.remove("dist/webfonts", { recursive: true });
} catch {}

// Copy vendored files to dist
await copy("www/css/reset.css", "dist/css/reset.css");
await copy("www/css/fontawesome.css", "dist/css/fontawesome.css");
await copy("www/css/fontawesome-brands.css", "dist/css/fontawesome-brands.css");
await copy("www/css/fontawesome-solid.css", "dist/css/fontawesome-solid.css");
await copy("www/webfonts", "dist/webfonts");

// Render Sass minified stylesheets
await sass("--no-source-map", "--style=compressed", "scss:dist/css").execute();

// Create directories for pages
await emptyDir(`dist${ARTICLE_PATH_PREFIX}`);
await emptyDir(`dist${PAGES_PATH_PREFIX}`);

// Render home pages
const copySpreadsheet = await getCopy(COPY_CSV_URL);
copySpreadsheet.sort((a, b) => b.postDate.valueOf() - a.postDate.valueOf());

const pageCount = getPageCount(copySpreadsheet.length);
for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
  await emptyDir(`dist${PAGES_PATH_PREFIX}/${pageNumber}`);

  const pageName = `dist${PAGES_PATH_PREFIX}/${pageNumber}/index.html`;
  console.log("Rendering", pageName);

  const page = await renderFile("./index", {
    articles: getArticlesOnPage(copySpreadsheet, pageNumber),
    deploymentPathPrefix: DEPLOYMENT_PATH_PREFIX,
    articlePathPrefix: ARTICLE_PATH_PREFIX,
    pagesPathPrefix: PAGES_PATH_PREFIX,
    pages: getPaginationInfo(pageNumber, copySpreadsheet.length, true),
    getPageUrl,
  });

  if (pageNumber === 1) {
    await Deno.writeFile("dist/index.html", encodeToBytes(page as string));
  }

  await Deno.writeFile(pageName, encodeToBytes(page as string));
}

// Render article pages
for (const documentInfo of copySpreadsheet) {
  const pageName = `dist${ARTICLE_PATH_PREFIX}/${documentInfo.fileName}`;
  console.log("Rendering", pageName);

  const { documentInnerHtml, stylesheetFileName } = await loadDocument(
    documentInfo,
    {
      compressStylesheet: true,
      pathBase: "dist/css",
    },
  );

  const page = await renderFile("./article", {
    documentInnerHtml,
    extraStyleLinks:
      `<link rel="stylesheet" href="${DEPLOYMENT_PATH_PREFIX}/css/${stylesheetFileName}">`,
  });

  await Deno.writeFile(pageName, encodeToBytes(page as string));
}
