"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Workbook as RicoWorkbook,
  WorkbookInstance as RicoWorkbookInstance,
} from "@fortune-sheet/react";
import type { Sheet, CellWithRowAndCol } from "@fortune-sheet/core";
import "@fortune-sheet/react/dist/index.css";
import * as XLSX from "xlsx";
import {
  Download,
  FilePlus2,
  Upload,
} from "lucide-react";
import {
  a1ToRowCol,
  DEFAULT_EXCEL_TITLE,
  rowColToA1,
  WorkspaceActionEvent,
  WorkspaceExcelSnapshot,
} from "@/lib/rico-workspace/types";

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
  } else if (Array.isArray(sCelldata(active))) {
    for (const item of sCelldata(active)) {
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

function sCelldata(sheet: Sheet): CellWithRowAndCol[] {
  return Array.isArray(sheet.celldata) ? sheet.celldata : [];
}

interface RicoExcelProps {
  pendingAction?: WorkspaceActionEvent | null;
  onActionHandled?: (id: string) => void;
  onSnapshotChange?: (snapshot: WorkspaceExcelSnapshot) => void;
  onAskAgentWithRange?: (rangeLabel: string) => void;
}

export default function RicoExcel({
  pendingAction,
  onActionHandled,
  onSnapshotChange,
  onAskAgentWithRange,
}: RicoExcelProps) {
  const workbookRef = useRef<RicoWorkbookInstance | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastHandledActionIdRef = useRef<string | null>(null);

  const [workbookKey, setWorkbookKey] = useState<number>(1);
  const [mountRetryTick, setMountRetryTick] = useState<number>(0);
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

  useEffect(() => {
    publishSnapshot(sheetsState, title, selectionRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply live Rico agent edits into the RICO-Excel workbook
  useEffect(() => {
    if (!pendingAction || pendingAction.target !== "excel") return;
    if (lastHandledActionIdRef.current === pendingAction.id) return;

    const api = workbookRef.current;
    if (!api && pendingAction.op !== "excel_open" && mountRetryTick < 10) {
      const retryTimer = window.setTimeout(
        () => setMountRetryTick((t) => t + 1),
        60
      );
      return () => window.clearTimeout(retryTimer);
    }

    lastHandledActionIdRef.current = pendingAction.id;

    let nextTitle = title;
    if (pendingAction.title && pendingAction.title.trim()) {
      nextTitle = pendingAction.title.trim();
      setTitle(nextTitle);
    }

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
              api.setCellFormat(currentRow, origin.col + idx, "bg", "#EEF4FF");
              api.setCellFormat(currentRow, origin.col + idx, "fc", "#1E3A8A");
            });
            currentRow++;
          }
          if (pendingAction.rows) {
            pendingAction.rows.forEach((rArr) => {
              const isTotalRow =
                typeof rArr[0] === "string" &&
                /\b(total|avg|summary)\b/i.test(rArr[0]);
              rArr.forEach((cellVal, idx) => {
                writeSingle(currentRow, origin.col + idx, cellVal, isTotalRow);
                if (isTotalRow) {
                  api.setCellFormat(currentRow, origin.col + idx, "bg", "#ECFDF5");
                  api.setCellFormat(currentRow, origin.col + idx, "fc", "#065F46");
                }
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
        console.warn("Failed to apply agent edit to RICO-Excel:", err);
      }
    }

    setAgentBadge(pendingAction.summary || "Updated by Rico");
    const timer = window.setTimeout(() => setAgentBadge(null), 4500);
    onActionHandled?.(pendingAction.id);
    return () => window.clearTimeout(timer);
  }, [mountRetryTick, onActionHandled, pendingAction, publishSnapshot, title]);

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

  const applyExcelPreset = (
    presetTitle: string,
    headers: string[],
    rows: Array<Array<string | number>>
  ) => {
    const api = workbookRef.current;
    setTitle(presetTitle);
    if (!api) return;
    try {
      headers.forEach((h, idx) => {
        api.setCellValue(0, idx, h);
        api.setCellFormat(0, idx, "bl", 1);
        api.setCellFormat(0, idx, "bg", "#EEF4FF");
        api.setCellFormat(0, idx, "fc", "#1E3A8A");
      });
      rows.forEach((rArr, rIdx) => {
        const rowNum = rIdx + 1;
        const isTotal =
          typeof rArr[0] === "string" && /\b(total|avg)\b/i.test(rArr[0]);
        rArr.forEach((val, cIdx) => {
          if (typeof val === "string" && val.trim().startsWith("=")) {
            api.setCellValue(rowNum, cIdx, { f: val.trim() });
          } else {
            api.setCellValue(rowNum, cIdx, val);
          }
          if (isTotal) {
            api.setCellFormat(rowNum, cIdx, "bl", 1);
            api.setCellFormat(rowNum, cIdx, "bg", "#ECFDF5");
            api.setCellFormat(rowNum, cIdx, "fc", "#065F46");
          }
        });
      });
      api.calculateFormula();
      publishSnapshot(api.getAllSheets(), presetTitle, "A1");
    } catch (err) {
      console.warn("Could not apply Excel preset:", err);
    }
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

      {/* RICO-Excel Toolbar */}
      <div className="h-10 px-3.5 bg-white border-b border-[#E6E4E3] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
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
            className="min-w-0 flex-1 max-w-[210px] h-7 px-2 rounded-md bg-transparent hover:bg-[#F8F7F7] focus:bg-white border border-transparent focus:border-[#D6D3D1] text-[13px] font-semibold text-[#1E1B1B] placeholder:text-[#8A8585] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/30 transition-colors"
          />

          <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-mono font-semibold tabular-nums text-emerald-800 shrink-0">
            {selectionRange}
          </span>

          {agentBadge && (
            <span className="hidden xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-800 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 rico-live-dot" />
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
              className="h-7 px-2.5 rounded-md bg-[#034CFF] hover:bg-[#023ECC] text-white text-[11.5px] font-medium inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
            >
              <span>Ask Rico</span>
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
            className="h-7 px-2.5 rounded-md bg-[#059669] hover:bg-[#047857] text-white text-[11.5px] font-medium inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          >
            <Download className="w-3 h-3" aria-hidden="true" />
            <span className="hidden lg:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Interactive Live Formula Models Strip */}
      <div className="px-3.5 py-1.5 bg-[#F8F7F7] border-b border-[#E6E4E3] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[11px] font-medium text-[#8A8585] mr-1 shrink-0">
          Live Models:
        </span>
        <button
          type="button"
          onClick={() =>
            applyExcelPreset(
              "Subscription Budget Model",
              ["Service", "Verified", "Budget Cap", "Headroom", "Annualized"],
              [
                ["Netflix Standard HD", 15.49, 20, "=C2-B2", "=B2*12"],
                ["Spotify Premium", 11.99, 15, "=C3-B3", "=B3*12"],
                ["GitHub Copilot", 19.0, 25, "=C4-B4", "=B4*12"],
                ["Total", "=SUM(B2:B4)", "=SUM(C2:C4)", "=SUM(D2:D4)", "=SUM(E2:E4)"],
              ]
            )
          }
          className={`h-6 px-2.5 rounded-full border text-[11px] font-medium shrink-0 transition-colors ${
            title === "Subscription Budget Model"
              ? "bg-[#059669] text-white border-[#059669]"
              : "bg-white hover:bg-[#F1EFEF] border-[#E6E4E3] text-[#1E1B1B]"
          }`}
        >
          SaaS Budget (=SUM)
        </button>
        <button
          type="button"
          onClick={() =>
            applyExcelPreset(
              "6-Month Runway & Burn Model",
              ["Month", "Starting Cash", "MRR", "Ops & SaaS", "Net Burn", "Ending Cash"],
              [
                ["Month 1", 360000, 18000, 42000, "=D2-C2", "=B2-E2"],
                ["Month 2", "=F2", 21000, 42000, "=D3-C3", "=B3-E3"],
                ["Month 3", "=F3", 24500, 43500, "=D4-C4", "=B4-E4"],
                ["Month 4", "=F4", 28500, 43500, "=D5-C5", "=B5-E5"],
                ["6M Total / Avg", "", "=SUM(C2:C5)", "=SUM(D2:D5)", "=AVERAGE(E2:E5)", "=F5"],
              ]
            )
          }
          className={`h-6 px-2.5 rounded-full border text-[11px] font-medium shrink-0 transition-colors ${
            title === "6-Month Runway & Burn Model"
              ? "bg-[#059669] text-white border-[#059669]"
              : "bg-white hover:bg-[#F1EFEF] border-[#E6E4E3] text-[#1E1B1B]"
          }`}
        >
          6M Runway Model
        </button>
        <button
          type="button"
          onClick={() =>
            applyExcelPreset(
              "Vendor Annual Arbitrage Matrix",
              ["Vendor", "Monthly", "12x Monthly", "Annual Plan", "Annual Savings"],
              [
                ["GitHub Copilot", 19, "=B2*12", 190, "=C2-D2"],
                ["Spotify Student", 5.99, "=B3*12", 71.88, "=C3-D3"],
                ["Notion Plus", 12, "=B4*12", 120, "=C4-D4"],
                ["Total", "=SUM(B2:B4)", "=SUM(C2:C4)", "=SUM(D2:D4)", "=SUM(E2:E4)"],
              ]
            )
          }
          className={`h-6 px-2.5 rounded-full border text-[11px] font-medium shrink-0 transition-colors ${
            title === "Vendor Annual Arbitrage Matrix"
              ? "bg-[#059669] text-white border-[#059669]"
              : "bg-white hover:bg-[#F1EFEF] border-[#E6E4E3] text-[#1E1B1B]"
          }`}
        >
          Annual Savings Matrix
        </button>
      </div>

      {/* RICO-Excel Workbook Canvas */}
      <div
        onMouseUp={handlePointerCheckSelection}
        onKeyUp={handlePointerCheckSelection}
        className="flex-1 min-h-0 w-full relative overflow-hidden bg-white"
      >
        <RicoWorkbook
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
