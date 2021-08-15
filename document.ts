import { DOMParser } from "deno-dom";
import { CopyRow, getDocument } from "./cms.ts";
import { sass } from "./sass.ts";

export interface Document {
  documentInnerHtml: string | undefined;
  stylesheetFileName: string;
}

export async function loadDocument(
  documentInfo: CopyRow,
  options?: { compressStylesheet?: boolean; pathBase?: string },
): Promise<Document> {
  // Export document and pull out article body
  const documentHtml = await getDocument(documentInfo.url);
  const dom = new DOMParser().parseFromString(documentHtml, "text/html");
  const documentInnerHtml = dom?.querySelector("body")?.innerHTML;

  // Rerender custom styles to a static file
  const styles = dom?.querySelector("style")?.innerText;
  const stylesheetFileName = `${
    documentInfo.fileName.substr(0, documentInfo.fileName.lastIndexOf("."))
  }.css`;
  if (styles != null) {
    const params = ["--stdin", "--no-source-map"];
    if (options?.compressStylesheet) {
      params.push("--style=compressed");
    }

    const cmd = sass(
      ...params,
      `${options?.pathBase ?? "www/css"}/${stylesheetFileName}`,
    );

    await cmd.writeStdin(`.gdocs{${styles}}`);
    await cmd.execute();
  }

  return {
    documentInnerHtml,
    stylesheetFileName,
  };
}
