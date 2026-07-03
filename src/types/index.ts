export interface Paper {
  id: string;
  arxivId: string;
  title: string;
  authors: string[];
  year: number;
  date: string;
  abstract: string;
  doi: string;
  categories: string[];
  collection: string;
  tags: string[];
  journal: string;
  url: string;
  pdfUrl: string;
}

export interface Collection {
  id: string;
  name: string;
  parentId: string | null;
}

export type SortField = "title" | "author" | "year" | "date";
export type SortDirection = "asc" | "desc";
export type RightPaneTab = "info" | "abstract" | "tags" | "related" | "pdf";
export type MobileView = "collections" | "items" | "detail";
