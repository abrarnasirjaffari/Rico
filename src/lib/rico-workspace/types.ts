export type SplitSurfaceTool = "browser" | "doc" | "excel";

export interface WorkspaceDocSnapshot {
  title: string;
  markdown: string;
  selectedText?: string;
  blockCount: number;
  updatedAt: number;
}

export interface WorkspaceExcelSnapshot {
  title: string;
  activeSheet: string;
  selectionRange?: string;
  cellSummary: string;
  nonEmptyCount: number;
  updatedAt: number;
}

export interface SplitWorkspaceSnapshot {
  isOpen: boolean;
  activeTool: SplitSurfaceTool | null;
  doc: WorkspaceDocSnapshot;
  excel: WorkspaceExcelSnapshot;
}

export interface WorkspaceExcelCellInput {
  a1: string;
  value: string | number;
  bold?: boolean;
}

export interface WorkspaceActionEvent {
  id: string;
  target: SplitSurfaceTool;
  op:
    | "doc_open"
    | "doc_replace"
    | "doc_append"
    | "excel_open"
    | "excel_set_cells"
    | "excel_set_table"
    | "excel_clear"
    | "browser_focus";
  title?: string;
  markdown?: string;
  sheetName?: string;
  startCell?: string;
  headers?: string[];
  rows?: Array<Array<string | number>>;
  cells?: WorkspaceExcelCellInput[];
  summary?: string;
}

export function colIndexToLetter(col: number): string {
  let n = col + 1;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) % 26);
  }
  return letters;
}

export function letterToColIndex(letters: string): number {
  const clean = letters.trim().toUpperCase();
  let col = 0;
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    if (code < 65 || code > 90) continue;
    col = col * 26 + (code - 64);
  }
  return Math.max(0, col - 1);
}

export function rowColToA1(row: number, col: number): string {
  return `${colIndexToLetter(col)}${row + 1}`;
}

export function a1ToRowCol(a1: string): { row: number; col: number } | null {
  const match = /^([A-Za-z]+)(\d+)$/.exec(a1.trim());
  if (!match) return null;
  const col = letterToColIndex(match[1]);
  const row = Math.max(0, parseInt(match[2], 10) - 1);
  return { row, col };
}

export const DEFAULT_DOC_TITLE = "Untitled";

export const DEFAULT_DOC_MARKDOWN = "";

export const DEFAULT_EXCEL_TITLE = "Untitled sheet";
