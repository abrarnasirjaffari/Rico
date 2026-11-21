/**
 * RicoUI — Native Streaming Generative UI & Live Dashboard Runtime for Rico
 * Self-contained, zero external runtime dependencies.
 */

export type RicoUIPropKind =
  | "string"
  | "number"
  | "boolean"
  | "enum"
  | "array"
  | "object"
  | "node"
  | "nodes"
  | "binding"
  | "action"
  | "any";

export interface RicoUIPropDescriptor {
  name: string;
  kind: RicoUIPropKind;
  required?: boolean;
  description?: string;
  enumValues?: string[];
  defaultValue?: unknown;
}

export interface RicoUIComponentSpec {
  name: string;
  description: string;
  props: RicoUIPropDescriptor[];
  category?: "layout" | "data" | "control" | "finops";
}

export interface RicoUIFunctionSpec {
  name: string;
  description: string;
  params: string[];
}

export interface RicoUIActionSpec {
  name: string;
  description: string;
  params: string[];
}

export interface RicoUILibrarySpec {
  id: string;
  version: string;
  root: string;
  components: RicoUIComponentSpec[];
  functions: RicoUIFunctionSpec[];
  actions: RicoUIActionSpec[];
}

export type RicoUIExpr =
  | { type: "literal"; value: string | number | boolean | null }
  | { type: "ref"; name: string }
  | { type: "state"; name: string }
  | { type: "array"; items: RicoUIExpr[] }
  | { type: "object"; entries: Array<{ key: string; value: RicoUIExpr }> }
  | {
      type: "component";
      name: string;
      args: RicoUIExpr[];
      namedArgs?: Array<{ key: string; value: RicoUIExpr }>;
    }
  | {
      type: "call";
      name: string;
      args: RicoUIExpr[];
      namedArgs?: Array<{ key: string; value: RicoUIExpr }>;
    }
  | { type: "member"; target: RicoUIExpr; property: string }
  | { type: "index"; target: RicoUIExpr; index: RicoUIExpr }
  | {
      type: "binary";
      op:
        | "+"
        | "-"
        | "*"
        | "/"
        | "%"
        | "=="
        | "!="
        | "<"
        | "<="
        | ">"
        | ">="
        | "&&"
        | "||";
      left: RicoUIExpr;
      right: RicoUIExpr;
    }
  | { type: "unary"; op: "!" | "-"; argument: RicoUIExpr }
  | {
      type: "ternary";
      test: RicoUIExpr;
      consequent: RicoUIExpr;
      alternate: RicoUIExpr;
    };

export type RicoUIStatement =
  | {
      kind: "assign";
      id: string;
      expr: RicoUIExpr;
      line: number;
    }
  | {
      kind: "state_init";
      name: string;
      expr: RicoUIExpr;
      line: number;
    }
  | {
      kind: "query";
      id: string;
      tool: string;
      argsExpr: RicoUIExpr;
      defaultsExpr: RicoUIExpr;
      refreshSeconds?: number;
      line: number;
    }
  | {
      kind: "mutation";
      id: string;
      tool: string;
      argsExpr: RicoUIExpr;
      line: number;
    };

export interface RicoUIParseError {
  code:
    | "syntax-error"
    | "unknown-component"
    | "missing-required"
    | "type-mismatch"
    | "unknown-function"
    | "no-root"
    | "runtime-error";
  statementId?: string;
  component?: string;
  line?: number;
  message: string;
  hint?: string;
}

export interface RicoUIEvaluatedNode {
  kind: "element";
  id?: string;
  component: string;
  props: Record<string, unknown>;
  bindings: Record<string, string>;
}

export interface RicoUIActionStep {
  kind: "action_step";
  name: string;
  args: unknown[];
  rawArgs: RicoUIExpr[];
}

export interface RicoUIActionChain {
  kind: "action_chain";
  steps: RicoUIActionStep[];
}

export interface RicoUIQueryDescriptor {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  defaults: unknown;
  refreshSeconds?: number;
}

export interface RicoUIMutationDescriptor {
  id: string;
  tool: string;
  args: Record<string, unknown>;
}

export interface RicoUIParseResult {
  hasRicoUI: boolean;
  leadText: string;
  trailText: string;
  rawProgram: string;
  statements: RicoUIStatement[];
  root: RicoUIEvaluatedNode | null;
  initialState: Record<string, unknown>;
  queries: RicoUIQueryDescriptor[];
  mutations: RicoUIMutationDescriptor[];
  meta: {
    incomplete: boolean;
    unresolved: string[];
    orphaned: string[];
    errors: RicoUIParseError[];
  };
}

export type RicoUIActionType =
  | "continue_conversation"
  | "open_url"
  | "open_workspace"
  | "stage_mandate"
  | "create_mandate_direct"
  | "trigger_mandate_quote"
  | "open_dashboard"
  | "copy_text";

export interface RicoUIActionEvent {
  type: RicoUIActionType;
  humanFriendlyMessage: string;
  params?: Record<string, unknown>;
  formState?: Record<string, unknown>;
}

export type RicoUIToolHandler = (
  args: Record<string, unknown>,
  signal?: AbortSignal
) => Promise<unknown>;

export type RicoUIToolProvider = Record<string, RicoUIToolHandler>;

export interface RicoUIDataTool<TContext = { ownerId: string }> {
  name: string;
  description: string;
  parametersSchema: Record<string, unknown>;
  sampleOutput: Record<string, unknown>;
  execute: (
    args: Record<string, unknown>,
    context: TContext,
    options?: { signal?: AbortSignal }
  ) => Promise<Record<string, unknown>>;
}

export interface RicoUIDashboardRecord {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  program: string;
  pinned: boolean;
  refreshSeconds?: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface RicoUIInterpreterQueryCall {
  id: string;
  tool: string;
  args?: Record<string, unknown>;
}

export interface RicoUIInterpreterRequest {
  dashboardId?: string;
  queries: RicoUIInterpreterQueryCall[];
}

export interface RicoUIInterpreterResponse {
  results: Record<string, unknown>;
  errors?: Record<string, string>;
  executedAt: string;
}
