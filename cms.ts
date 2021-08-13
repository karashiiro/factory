import { parse } from "csv";

export type Copy = CopyRow[];

export interface CopyRow {
  path: string;
  postDate: string;
  title: string;
  synopsis: string;
  url: string;
}

function getDocumentId(url: string): string {
  const matchGroups = url.match(
    /docs\.google\.com\/document\/d\/(?<documentId>\w*)/g,
  )
    ?.groups;

  if (matchGroups == null || matchGroups["documentId"] == null) {
    throw "No document ID found in the input string";
  }

  return matchGroups["documentId"];
}

function getDocumentExportPath(documentId: string): string {
  return `https://docs.google.com/document/d/${documentId}/export?format=html`;
}

export async function getCopy(csvPath: string): Promise<Copy> {
  const res = await fetch(csvPath);
  if (!res.ok) {
    throw `Failed to fetch copy (${res.status}): ${res.statusText}`;
  }

  const csvData = await res.text();
  return await parse(csvData, {
    skipFirstRow: true,
    parse: (input) => {
      const row = input as CopyRow;
      return {
        path: row.path,
        postDate: row.postDate,
        title: row.title,
        synopsis: row.synopsis,
        url: row.url,
      };
    },
  }) as Copy;
}

export async function getDocument(documentPath: string): Promise<string> {
  const documentId = getDocumentId(documentPath);
  const htmlPath = getDocumentExportPath(documentId);

  const res = await fetch(htmlPath);
  if (!res.ok) {
    throw `Failed to fetch copy (${res.status}): ${res.statusText}`;
  }

  const htmlData = await res.text();

  return htmlData;
}
