"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  A2uiSurface,
  MarkdownContext,
  type ReactCatalogComponent,
} from "@a2ui/react";
import { renderMarkdown } from "@a2ui/markdown-it";
import {
  MessageProcessor,
  basicCatalog,
  injectBasicCatalogStyles,
  setMarkdownRenderer,
  type ActionPayload,
  type SurfaceModel,
} from "@a2ui/web_core/v1_0";
import {
  buildA2uiSurfaceThemeStyle,
  resolveA2uiSurfaceAccent,
} from "@/lib/a2ui/theme";

let a2uiWebInitialized = false;

function ensureA2uiWebInitialized() {
  if (a2uiWebInitialized || typeof window === "undefined") return;
  injectBasicCatalogStyles();
  setMarkdownRenderer(renderMarkdown);
  a2uiWebInitialized = true;
}

class A2uiSurfaceErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: unknown) {
    console.warn("[A2UI Surface ErrorBoundary]", err);
  }
  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export interface A2UIMessageSurfaceProps {
  messages: Record<string, unknown>[];
  disabled?: boolean;
  onAction?: (action: ActionPayload) => void;
}

function readSurfaceAccent(
  surface: SurfaceModel<ReactCatalogComponent>,
  fallbackCorpus: string
): string {
  try {
    const themeObj = (surface as unknown as { theme?: { primaryColor?: unknown } }).theme;
    if (typeof themeObj?.primaryColor === "string" && themeObj.primaryColor.trim()) {
      return resolveA2uiSurfaceAccent(themeObj.primaryColor, fallbackCorpus);
    }
    const raw = surface.dataModel.get("/theme/accent");
    return resolveA2uiSurfaceAccent(raw, fallbackCorpus);
  } catch {
    return resolveA2uiSurfaceAccent(undefined, fallbackCorpus);
  }
}

/**
 * Native Google A2UI v1.0 React surface renderer using the official Basic Catalog.
 * Syncs with light/dark theme via `.a2ui-light` / `.a2ui-dark`, supports progressive
 * streaming updates and surface deletions cleanly, and applies topic-matched accents.
 */
export function A2UIMessageSurface({
  messages,
  disabled = false,
  onAction,
}: A2UIMessageSurfaceProps) {
  const { resolvedTheme } = useTheme();
  const processorRef = useRef<MessageProcessor<ReactCatalogComponent> | null>(
    null
  );
  const subsRef = useRef<Array<{ unsubscribe: () => void }>>([]);
  const processedCountRef = useRef<number>(0);
  const firstMsgRef = useRef<Record<string, unknown> | null>(null);
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const [surfaces, setSurfaces] = useState<
    SurfaceModel<ReactCatalogComponent>[]
  >([]);

  const fallbackCorpus = useMemo(() => {
    try {
      return JSON.stringify(messages).slice(0, 4000);
    } catch {
      return "";
    }
  }, [messages]);

  const disposeProcessor = () => {
    for (const sub of subsRef.current) {
      sub.unsubscribe();
    }
    subsRef.current = [];
    processorRef.current?.dispose();
    processorRef.current = null;
    processedCountRef.current = 0;
    firstMsgRef.current = null;
  };

  const initProcessor = () => {
    disposeProcessor();
    ensureA2uiWebInitialized();
    const processor = new MessageProcessor<ReactCatalogComponent>(
      [basicCatalog],
      (action: ActionPayload) => {
        if (disabledRef.current) return;
        onActionRef.current?.(action);
      },
      {
        version: "1.0",
        reportErrorsOnly: true,
        errorHandler: (err) => {
          console.warn("[A2UI Renderer]", err);
        },
      }
    );
    const sync = () => {
      setSurfaces(Array.from(processor.getSurfaces().values()));
    };
    subsRef.current = [
      processor.onSurfaceCreated(sync),
      processor.onSurfaceDeleted(sync),
    ];
    processorRef.current = processor;
    return processor;
  };

  useEffect(() => {
    initProcessor();
    return () => {
      disposeProcessor();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let processor = processorRef.current;
    if (!processor) return;

    if (messages.length === 0) {
      if (processedCountRef.current > 0) {
        initProcessor();
        setSurfaces([]);
      }
      return;
    }

    // If messages were replaced with a different sequence or shrunk, cleanly reset processor
    const streamReset =
      messages.length < processedCountRef.current ||
      (firstMsgRef.current !== null && messages[0] !== firstMsgRef.current);

    if (streamReset) {
      processor = initProcessor();
    }

    const pending = messages.slice(processedCountRef.current);
    if (pending.length === 0) return;

    const errors = processor.processMessagesWithErrors(pending);
    if (errors.length > 0) {
      console.warn("[A2UI] Some messages had validation warnings:", errors);
    }
    firstMsgRef.current = messages[0] ?? null;
    processedCountRef.current = messages.length;
    setSurfaces(Array.from(processor.getSurfaces().values()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  if (surfaces.length === 0) {
    return null;
  }

  const themeClass = resolvedTheme === "dark" ? "a2ui-dark" : "a2ui-light";

  return (
    <A2uiSurfaceErrorBoundary>
      <MarkdownContext.Provider value={renderMarkdown}>
        <div
          className={`a2ui-surface-host ${themeClass} w-full min-w-0 space-y-3 ${
            disabled ? "pointer-events-none opacity-80" : ""
          }`}
          data-a2ui-surface="true"
        >
          {surfaces.map((surface) => {
            const accent = readSurfaceAccent(surface, fallbackCorpus);
            const themeStyle = buildA2uiSurfaceThemeStyle(accent);
            return (
              <div
                key={surface.id}
                data-a2ui-accent={accent}
                style={themeStyle}
                className="w-full min-w-0"
              >
                <A2uiSurface surface={surface} />
              </div>
            );
          })}
        </div>
      </MarkdownContext.Provider>
    </A2uiSurfaceErrorBoundary>
  );
}
