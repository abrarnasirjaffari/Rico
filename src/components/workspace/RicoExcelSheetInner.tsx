"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Workbook, WorkbookInstance } from "@fortune-sheet/react";
import type { Sheet, CellWithRowAndCol } from "@fortune-sheet/core";
import "@fortune-sheet/react/dist/index.css";
import * as XLSX from "xlsx";
import {
  CheckCircle2,
  Download,
  FilePlus2,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  a1ToRowCol,
  DEFAULT_EXCEL_TITLE,
  rowColToA1,
  WorkspaceActionEvent,
  WorkspaceExcelSnapshot,
} from "@/lib/workspace/types";

const EXCEL_STORAGE_KEY = "rico_split_excel_v3";

function buildBlankSheet(): Sheet[] {
  return [
    {
      name: "Sheet 1",
      id: "sheet-1",
      status: 1,
      order: 0,
      row: 40,
      column: 14,
      celldata: [],
    },
  ];
}

function summarizeSheets(sheets: Sheet[]): {
  activeSheet: string;
  cellSummary: string;
  nonEmptyCount: number;
} {
  if (!sheets || sheets.length === 0) {
    return { activeSheet: "Sheet1", cellSummary: "(empty)", nonEmptyCount: 0 };
  }
  const active = sheets.find((s) => s.status === 1) || sheets[0];
  const entries: string[] = [];
  let count = 0;

  if (Array.isArray(active.data) && active.data.length > 0) {
    for (let r = 0; r < Math.min(active.data.length, 60); r++) {
      const rowArr = active.data[r];
      if (!rowArr) continue;
      for (let c = 0; c < Math.min(rowArr.length, 20); c++) {
        const cell = rowArr[c];
        if (!cell) continue;
        const val = cell.m ?? cell.v;
        const formula = cell.f;
        if (
          (val !== undefined && val !== null && String(val).trim() !== "") ||
          formula
        ) {
          count++;
          if (entries.length < 80) {
            const coord = rowColToA1(r, c);
            entries.push(
              formula
                ? `${coord}=${formula} (${val ?? ""})`
                : `${coord}: ${val}`
            );
          }
        }
      }
    }
  } else if (Array.isArray(active.celldata)) {
    for (const item of active.celldata) {
      if (!item?.v) continue;
      const val = item.v.m ?? item.v.v;
      const formula = item.v.f;
      if (
        (val !== undefined && val !== null && String(val).trim() !== "") ||
        formula
      ) {
        count++;
        if (entries.length < 80) {
          const coord = rowColToA1(item.r, item.c);
          entries.push(
            formula ? `${coord}=${formula} (${val ?? ""})` : `${coord}: ${val}`
          );
        }
      }
    }
  }

  return {
    activeSheet: active.name || "Sheet1",
    cellSummary: entries.length > 0 ? entries.join(" | ") : "(empty sheet)",
    nonEmptyCount: count,
  };
}

interface RicoExcelSheetInnerProps {
  pendingAction?: WorkspaceActionEvent | null;
  onActionHandled?: (id: string) => void;
  onSnapshotChange?: (snapshot: WorkspaceExcelSnapshot) => void;
  onAskAgentWithRange?: (rangeLabel: string) => void;
}

export default function RicoExcelSheetInner({
  pendingAction,
  onActionHandled,
  onSnapshotChange,
  onAskAgentWithRange,
}: RicoExcelSheetInnerProps) {
  const workbookRef = useRef<WorkbookInstance | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastHandledActionIdRef = useRef<string | null>(null);

  const [workbookKey, setWorkbookKey] = useState<number>(1);
  const [title, setTitle] = useState<string>(DEFAULT_EXCEL_TITLE);
  const [selectionRange, setSelectionRange] = useState<string>("A1");
  const [agentBadge, setAgentBadge] = useState<string | null>(null);
  const [sheetsState, setSheetsState] = useState<Sheet[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem(EXCEL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as {
            title?: string;
            sheets?: Sheet[];
          };
          if (Array.isArray(parsed.sheets) && parsed.sheets.length > 0) {
            return parsed.sheets;
          }
        }
      } catch {
        // Fallback to blank sheet
      }
    }
    return buildBlankSheet();
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(EXCEL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { title?: string };
        if (parsed.title) setTitle(parsed.title);
      }
    } catch {
      // Ignore
    }
  }, []);

  const publishSnapshot = useCallback(
    (sheets: Sheet[], nextTitle: string, nextRange?: string) => {
      const summary = summarizeSheets(sheets);
      onSnapshotChange?.({
        title: nextTitle,
        activeSheet: summary.activeSheet,
        selectionRange: nextRange ?? selectionRange,
        cellSummary: summary.cellSummary,
        nonEmptyCount: summary.nonEmptyCount,
        updatedAt: Date.now(),
      });

      try {
        // Persist celldata cleanly so reload preserves edits
        const serializable: Sheet[] = sheets.map((s) => {
          const celldata =
            Array.isArray(s.data) && workbookRef.current
              ? workbookRef.current.dataToCelldata(s.data)
              : s.celldata || [];
          return {
            ...s,
            data: undefined,
            celldata,
          };
        });
        window.localStorage.setItem(
          EXCEL_STORAGE_KEY,
          JSON.stringify({ title: nextTitle, sheets: serializable })
        );
      } catch {
        // Ignore storage quota errors
      }
    },
    [onSnapshotChange, selectionRange]
  );

  // Initial snapshot broadcast
  useEffect(() => {
    publishSnapshot(sheetsState, title, selectionRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply live AI agent edits into the open FortuneSheet workbook
  useEffect(() => {
    if (!pendingAction || pendingAction.target !== "excel") return;
    if (lastHandledActionIdRef.current === pendingAction.id) return;
    lastHandledActionIdRef.current = pendingAction.id;

    let nextTitle = title;
    if (pendingAction.title && pendingAction.title.trim()) {
      nextTitle = pendingAction.title.trim();
      setTitle(nextTitle);
    }

    const api = workbookRef.current;
    if (api) {
      try {
        const writeSingle = (
          row: number,
          col: number,
          rawVal: string | number,
          bold?: boolean
        ) => {
          if (typeof rawVal === "string" && rawVal.trim().startsWith("=")) {
            api.setCellValue(row, col, { f: rawVal.trim() });
          } else {
            api.setCellValue(row, col, rawVal);
          }
          if (bold) {
            api.setCellFormat(row, col, "bl", 1);
          }
        };

        if (pendingAction.op === "excel_clear") {
          const blank: Sheet[] = [
            {
              name: pendingAction.sheetName || "Sheet1",
              id: `sheet-${Date.now()}`,
              status: 1,
              order: 0,
              row: 40,
              column: 14,
              celldata: [],
            },
          ];
          setSheetsState(blank);
          setWorkbookKey((k) => k + 1);
          publishSnapshot(blank, nextTitle, "A1");
        } else if (
          pendingAction.op === "excel_set_table" &&
          (pendingAction.headers || pendingAction.rows)
        ) {
          const origin = a1ToRowCol(pendingAction.startCell || "A1") || {
            row: 0,
            col: 0,
          };
          let currentRow = origin.row;
          if (pendingAction.headers && pendingAction.headers.length > 0) {
            pendingAction.headers.forEach((h, idx) => {
              writeSingle(currentRow, origin.col + idx, h, true);
              api.setCellFormat(currentRow, origin.col + idx, "bg", "#F8F7F7");
            });
            currentRow++;
          }
          if (pendingAction.rows) {
            pendingAction.rows.forEach((rArr) => {
              rArr.forEach((cellVal, idx) => {
                writeSingle(currentRow, origin.col + idx, cellVal);
              });
              currentRow++;
            });
          }
          api.calculateFormula();
          const all = api.getAllSheets();
          publishSnapshot(all, nextTitle);
        } else if (
          pendingAction.op === "excel_set_cells" &&
          Array.isArray(pendingAction.cells)
        ) {
          for (const cItem of pendingAction.cells) {
            const coord = a1ToRowCol(cItem.a1);
            if (!coord) continue;
            writeSingle(coord.row, coord.col, cItem.value, cItem.bold);
          }
          api.calculateFormula();
          const all = api.getAllSheets();
          publishSnapshot(all, nextTitle);
        }
      } catch (err) {
        console.warn("Failed to apply agent spreadsheet edit:", err);
      }
    }

    setAgentBadge(pendingAction.summary || "Updated by Rico");
    const timer = window.setTimeout(() => setAgentBadge(null), 4500);
    onActionHandled?.(pendingAction.id);
    return () => window.clearTimeout(timer);
  }, [onActionHandled, pendingAction, publishSnapshot, title]);

  const handleWorkbookChange = (nextSheets: Sheet[]) => {
    let coordsLabel = selectionRange;
    try {
      const coords = workbookRef.current?.getSelectionCoordinates();
      if (coords && coords.length > 0) {
        coordsLabel = coords.join(", ");
        setSelectionRange(coordsLabel);
      }
    } catch {
      // Ignore
    }
    publishSnapshot(nextSheets, title, coordsLabel);
  };

  const handlePointerCheckSelection = () => {
    try {
      const coords = workbookRef.current?.getSelectionCoordinates();
      if (coords && coords.length > 0) {
        const nextRange = coords.join(", ");
        if (nextRange !== selectionRange) {
          setSelectionRange(nextRange);
          const all = workbookRef.current?.getAllSheets() || sheetsState;
          publishSnapshot(all, title, nextRange);
        }
      }
    } catch {
      // Ignore
    }
  };

  const handleNewWorkbook = () => {
    const blank = buildBlankSheet();
    setTitle(DEFAULT_EXCEL_TITLE);
    setSheetsState(blank);
    setWorkbookKey((k) => k + 1);
    publishSnapshot(blank, DEFAULT_EXCEL_TITLE, "A1");
  };

  const handleImportXlsx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { cellFormula: true });
      const importedSheets: Sheet[] = wb.SheetNames.map((name, sIdx) => {
        const ws = wb.Sheets[name];
        const range = ws["!ref"]
          ? XLSX.utils.decode_range(ws["!ref"])
          : { s: { r: 0, c: 0 }, e: { r: 20, c: 10 } };
        const celldata: CellWithRowAndCol[] = [];

        for (let r = range.s.r; r <= Math.min(range.e.r, 200); r++) {
          for (let c = range.s.c; c <= Math.min(range.e.c, 30); c++) {
            const addr = XLSX.utils.encode_cell({ r, c });
            const raw = ws[addr];
            if (!raw) continue;
            celldata.push({
              r,
              c,
              v: {
                v: raw.v as string | number,
                m: raw.w ?? (raw.v !== undefined ? String(raw.v) : ""),
                f: raw.f ? `=${raw.f}` : undefined,
                bl: r === 0 ? 1 : undefined,
              },
            });
          }
        }

        return {
          name: name.slice(0, 31) || `Sheet${sIdx + 1}`,
          id: `sheet-imp-${Date.now()}-${sIdx}`,
          status: sIdx === 0 ? 1 : 0,
          order: sIdx,
          row: Math.max(40, range.e.r + 15),
          column: Math.max(14, range.e.c + 6),
          celldata,
        };
      });

      if (importedSheets.length > 0) {
        const cleanName = file.name.replace(/\.(xlsx|xls|csv)$/i, "");
        const nextTitle = cleanName || title;
        setTitle(nextTitle);
        setSheetsState(importedSheets);
        setWorkbookKey((k) => k + 1);
        publishSnapshot(importedSheets, nextTitle, "A1");
      }
    } catch (err) {
      console.warn("Could not import spreadsheet:", err);
    } finally {
      e.target.value = "";
    }
  };

  const handleExportXlsx = () => {
    const allSheets = workbookRef.current?.getAllSheets() || sheetsState;
    const wb = XLSX.utils.book_new();

    allSheets.forEach((s, idx) => {
      const matrix: Array<Array<string | number | null>> = [];
      if (Array.isArray(s.data) && s.data.length > 0) {
        s.data.forEach((rowArr) => {
          matrix.push(
            (rowArr || []).map((cell) => {
              if (!cell) return null;
              return (cell.v as string | number) ?? null;
            })
          );
        });
      } else if (Array.isArray(s.celldata)) {
        for (const item of s.celldata) {
          if (!item?.v) continue;
          if (!matrix[item.r]) matrix[item.r] = [];
          matrix[item.r][item.c] = (item.v.v as string | number) ?? null;
        }
      }

      const ws = XLSX.utils.aoa_to_sheet(matrix);
      // Preserve formulas on exported cells
      if (Array.isArray(s.data)) {
        s.data.forEach((rowArr, r) => {
          (rowArr || []).forEach((cell, c) => {
            if (cell?.f) {
              const addr = XLSX.utils.encode_cell({ r, c });
              ws[addr] = {
                ...(ws[addr] || { t: "n" }),
                f: cell.f.replace(/^=/, ""),
              };
            }
          });
        });
      }
      XLSX.utils.book_append_sheet(
        wb,
        ws,
        (s.name || `Sheet${idx + 1}`).slice(0, 31)
      );
    });

    const safeName =
      (title || "workbook")
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, "-")
        .replace(/^-|-$/g, "") || "workbook";
    XLSX.writeFile(wb, `${safeName}.xlsx`);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#FCFCFC] text-[#1E1B1B] overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleImportXlsx}
        className="hidden"
        tabIndex={-1}
      />

      {/* Workbook Sub-Toolbar */}
      <div className="h-10 px-3.5 bg-[#FCFCFC] border-b border-[#E6E4E3] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <label htmlFor="rico-excel-title-input" className="sr-only">
            Workbook title
          </label>
          <input
            id="rico-excel-title-input"
            type="text"
            value={title}
            onChange={(e) => {
              const next = e.target.value;
              setTitle(next);
              const all = workbookRef.current?.getAllSheets() || sheetsState;
              publishSnapshot(all, next);
            }}
            placeholder="Workbook title"
            className="min-w-0 flex-1 max-w-[210px] h-7 px-2 rounded-md bg-transparent hover:bg-[#F1EFEF] focus:bg-white border border-transparent focus:border-[#D6D3D1] text-[13px] font-medium text-[#1E1B1B] placeholder:text-[#8A8585] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/30 transition-colors"
          />

          <span className="px-1.5 py-0.5 rounded bg-[#F1EFEF] text-[11px] font-mono tabular-nums text-[#5C5858] shrink-0">
            {selectionRange}
          </span>

          {agentBadge && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-800 shrink-0">
              <CheckCircle2
                className="w-3 h-3 text-emerald-600"
                aria-hidden="true"
              />
              <span className="truncate max-w-[140px]">{agentBadge}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onAskAgentWithRange && selectionRange.includes(":") && (
            <button
              type="button"
              onClick={() => onAskAgentWithRange(selectionRange)}
              title={`Reference ${selectionRange} in chat`}
              className="h-7 px-2.5 rounded-md bg-[oklch(0.097_0_0_/_0.05)] hover:bg-[oklch(0.097_0_0_/_0.09)] text-[#1E1B1B] text-[11.5px] font-medium inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              <span>Ask</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleNewWorkbook}
            title="New blank sheet"
            aria-label="New blank sheet"
            className="h-7 px-2 rounded-md text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF] text-[11.5px] font-medium inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
          >
            <FilePlus2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden xl:inline">New</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Import .xlsx or .csv"
            aria-label="Import Excel or CSV file"
            className="h-7 px-2 rounded-md text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF] text-[11.5px] font-medium inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Import</span>
          </button>

          <button
            type="button"
            onClick={handleExportXlsx}
            title="Export as Excel (.xlsx)"
            aria-label="Export as Excel"
            className="h-7 px-2 rounded-md text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF] text-[11.5px] font-medium inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Export</span>
          </button>
        </div>
      </div>

      {/* FortuneSheet Full Excel Canvas */}
      <div
        onMouseUp={handlePointerCheckSelection}
        onKeyUp={handlePointerCheckSelection}
        className="flex-1 min-h-0 w-full relative overflow-hidden bg-white"
      >
        <Workbook
          key={workbookKey}
          ref={workbookRef}
          data={sheetsState}
          lang="en"
          onChange={handleWorkbookChange}
          showToolbar={true}
          showFormulaBar={true}
          showSheetTabs={true}
        />
      </div>
    </div>
  );
}
