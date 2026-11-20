"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useCreateBlockNote as useCreateRicoDoc } from "@blocknote/react";
import { BlockNoteView as RicoDocSurface } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
  Download,
  FilePlus2,
  Sparkles,
  Upload,
  CheckCircle2,
} from "lucide-react";
import {
  DEFAULT_DOC_MARKDOWN,
  DEFAULT_DOC_TITLE,
  WorkspaceActionEvent,
  WorkspaceDocSnapshot,
} from "@/lib/rico-workspace/types";

const DOC_STORAGE_KEY = "rico_split_doc_v2";

interface RicoDocProps {
  initialTitle?: string;
  initialMarkdown?: string;
  pendingAction?: WorkspaceActionEvent | null;
  onActionHandled?: (id: string) => void;
  onSnapshotChange?: (snapshot: WorkspaceDocSnapshot) => void;
  onAskAgentWithSelection?: (selectedText: string) => void;
}

export default function RicoDoc({
  initialTitle = DEFAULT_DOC_TITLE,
  initialMarkdown = DEFAULT_DOC_MARKDOWN,
  pendingAction,
  onActionHandled,
  onSnapshotChange,
  onAskAgentWithSelection,
}: RicoDocProps) {
  const [title, setTitle] = useState<string>(initialTitle);
  const [selectedText, setSelectedText] = useState<string>("");
  const [wordCount, setWordCount] = useState<number>(0);
  const [agentBadge, setAgentBadge] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hydratedRef = useRef(false);
  const lastHandledActionIdRef = useRef<string | null>(null);

  const editor = useCreateRicoDoc();

  const emitSnapshot = useCallback(
    (nextTitle: string, nextSelection?: string) => {
      try {
        const md = editor.blocksToMarkdownLossy(editor.document);
        const words = md
          .trim()
          .split(/\s+/)
          .filter(Boolean).length;
        setWordCount(words);

        const snap: WorkspaceDocSnapshot = {
          title: nextTitle,
          markdown: md,
          selectedText: nextSelection !== undefined ? nextSelection : selectedText,
          blockCount: editor.document.length,
          updatedAt: Date.now(),
        };
        onSnapshotChange?.(snap);

        try {
          window.localStorage.setItem(
            DOC_STORAGE_KEY,
            JSON.stringify({ title: nextTitle, markdown: md })
          );
        } catch {
          // Ignore storage quota errors
        }
      } catch {
        // Editor still mounting
      }
    },
    [editor, onSnapshotChange, selectedText]
  );

  // Hydrate initial RICO-DOC content once
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    let startTitle = initialTitle;
    let startMd = initialMarkdown;

    try {
      const raw = window.localStorage.getItem(DOC_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { title?: string; markdown?: string };
        if (parsed.title) startTitle = parsed.title;
        if (parsed.markdown && parsed.markdown.trim().length > 0) {
          startMd = parsed.markdown;
        }
      }
    } catch {
      // Fallback to defaults
    }

    setTitle(startTitle);
    try {
      const blocks = editor.tryParseMarkdownToBlocks(startMd);
      if (blocks.length > 0) {
        editor.replaceBlocks(editor.document, blocks);
      }
    } catch {
      // Keep default empty block
    }
    emitSnapshot(startTitle, "");
  }, [editor, emitSnapshot, initialMarkdown, initialTitle]);

  // Apply live Rico agent edits to RICO-DOC
  useEffect(() => {
    if (!pendingAction || pendingAction.target !== "doc") return;
    if (lastHandledActionIdRef.current === pendingAction.id) return;
    lastHandledActionIdRef.current = pendingAction.id;

    let nextTitle = title;
    if (pendingAction.title && pendingAction.title.trim()) {
      nextTitle = pendingAction.title.trim();
      setTitle(nextTitle);
    }

    if (
      pendingAction.op !== "doc_open" &&
      typeof pendingAction.markdown === "string"
    ) {
      try {
        const parsedBlocks = editor.tryParseMarkdownToBlocks(
          pendingAction.markdown
        );
        if (parsedBlocks.length > 0) {
          if (pendingAction.op === "doc_append" && editor.document.length > 0) {
            const lastBlock = editor.document[editor.document.length - 1];
            editor.insertBlocks(parsedBlocks, lastBlock, "after");
          } else {
            editor.replaceBlocks(editor.document, parsedBlocks);
          }
        }
      } catch (err) {
        console.warn("Failed to apply agent markdown to RICO-DOC:", err);
      }
    }

    setAgentBadge(pendingAction.summary || "Updated by Rico");
    const timer = window.setTimeout(() => setAgentBadge(null), 4500);
    emitSnapshot(nextTitle);
    onActionHandled?.(pendingAction.id);

    return () => window.clearTimeout(timer);
  }, [editor, emitSnapshot, onActionHandled, pendingAction, title]);

  const handleEditorChange = () => {
    let sel = "";
    try {
      sel = editor.getSelectedText().trim();
    } catch {
      sel = "";
    }
    setSelectedText(sel);
    emitSnapshot(title, sel);
  };

  const handleSelectionCheck = () => {
    try {
      const sel = editor.getSelectedText().trim();
      if (sel !== selectedText) {
        setSelectedText(sel);
        emitSnapshot(title, sel);
      }
    } catch {
      // Ignore
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setTitle(next);
    emitSnapshot(next);
  };

  const handleExportMarkdown = () => {
    const md = editor.blocksToMarkdownLossy(editor.document);
    const safeName =
      (title || "document")
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, "-")
        .replace(/^-|-$/g, "") || "document";
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const baseName = file.name.replace(/\.(md|markdown|txt)$/i, "");
      if (baseName) setTitle(baseName);
      const blocks = editor.tryParseMarkdownToBlocks(text);
      if (blocks.length > 0) {
        editor.replaceBlocks(editor.document, blocks);
      }
      emitSnapshot(baseName || title, "");
    } catch (err) {
      console.warn("Could not import document:", err);
    } finally {
      e.target.value = "";
    }
  };

  const handleNewDoc = () => {
    const freshTitle = DEFAULT_DOC_TITLE;
    setTitle(freshTitle);
    editor.replaceBlocks(editor.document, [{ type: "paragraph", content: "" }]);
    setSelectedText("");
    emitSnapshot(freshTitle, "");
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#FCFCFC] text-[#1E1B1B] overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        onChange={handleImportFile}
        className="hidden"
        tabIndex={-1}
      />

      {/* RICO-DOC Toolbar */}
      <div className="h-10 px-3.5 bg-[#FCFCFC] border-b border-[#E6E4E3] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <label htmlFor="rico-doc-title-input" className="sr-only">
            Document title
          </label>
          <input
            id="rico-doc-title-input"
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Document title"
            className="min-w-0 flex-1 max-w-[240px] h-7 px-2 rounded-md bg-transparent hover:bg-[#F1EFEF] focus:bg-white border border-transparent focus:border-[#D6D3D1] text-[13px] font-medium text-[#1E1B1B] placeholder:text-[#8A8585] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/30 transition-colors"
          />

          <span className="hidden sm:inline text-[11px] font-mono tabular-nums text-[#8A8585] shrink-0">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>

          {agentBadge && (
            <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-800 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" aria-hidden="true" />
              <span className="truncate max-w-[140px]">{agentBadge}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedText && onAskAgentWithSelection && (
            <button
              type="button"
              onClick={() => onAskAgentWithSelection(selectedText)}
              title="Reference selected text in Rico chat"
              className="h-7 px-2.5 rounded-md bg-[#034CFF]/10 hover:bg-[#034CFF]/15 text-[#034CFF] text-[11.5px] font-medium inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
            >
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              <span>Ask Rico</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleNewDoc}
            title="New blank document"
            aria-label="New blank document"
            className="h-7 px-2 rounded-md text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF] text-[11.5px] font-medium inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
          >
            <FilePlus2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">New</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Import Markdown or text file"
            aria-label="Import Markdown or text file"
            className="h-7 px-2 rounded-md text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF] text-[11.5px] font-medium inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Import</span>
          </button>

          <button
            type="button"
            onClick={handleExportMarkdown}
            title="Export as Markdown (.md)"
            aria-label="Export as Markdown"
            className="h-7 px-2 rounded-md text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF] text-[11.5px] font-medium inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Export</span>
          </button>
        </div>
      </div>

      {/* RICO-DOC Canvas */}
      <div
        onMouseUp={handleSelectionCheck}
        onKeyUp={handleSelectionCheck}
        className="rico-doc-canvas flex-1 min-h-0 overflow-y-auto bg-white rico-scroller"
      >
        <div className="max-w-3xl mx-auto py-5 min-h-full">
          <RicoDocSurface
            editor={editor}
            theme="light"
            onChange={handleEditorChange}
            onSelectionChange={handleSelectionCheck}
          />
        </div>
      </div>
    </div>
  );
}
