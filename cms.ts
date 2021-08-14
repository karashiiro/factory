import { parse } from "csv";

export type Copy = CopyRow[];

export interface CopyRow {
  fileName: string;
  postDate: Date;
  title: string;
  synopsis: string;
  url: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
}

export interface CopyRowRaw {
  fileName: string;
  postDate: string;
  title: string;
  synopsis: string;
  url: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
}

function getDocumentId(url: string): string {
  const matchGroups = /docs\.google\.com\/document\/d\/(?<documentId>[^$\/?]*)/m
    .exec(url)
    ?.groups;

  const documentId = matchGroups?.documentId;

  if (documentId == null) {
    throw "No document ID found in the input string";
  }

  return documentId;
}

function getDocumentExportPath(documentId: string): string {
  return `https://docs.google.com/document/d/${documentId}/export?format=html`;
}

function parseDate(dateRaw: string): Date {
  const matchGroups = /(?<month>\d+)\/(?<date>\d+)\/(?<year>\d+)/m.exec(dateRaw)
    ?.groups;

  const month = parseInt(matchGroups?.month ?? "");
  const date = parseInt(matchGroups?.date ?? "");
  const year = parseInt(matchGroups?.year ?? "");

  if (
    isNaN(month) || isNaN(date) || isNaN(year) || month <= 0 || month > 12 ||
    date <= 0 || date > 31 || (month === 2 && date > 29)
  ) {
    throw `Cannot parse invalid date`;
  }

  return new Date(year, month, date);
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
      const row = input as CopyRowRaw;
      return {
        fileName: row.fileName,
        postDate: parseDate(row.postDate),
        title: row.title,
        synopsis: row.synopsis,
        url: row.url,
        thumbnailUrl: row.thumbnailUrl,
        thumbnailAlt: row.thumbnailAlt,
      } as CopyRow;
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
