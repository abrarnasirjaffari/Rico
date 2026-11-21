import { COMPONENT_SPEC_MAP, RICOUI_LIBRARY_SPEC } from "./spec";
import { resolveOfficialUrl } from "./url-resolver";
import type {
  RicoUIActionChain,
  RicoUIActionStep,
  RicoUIEvaluatedNode,
  RicoUIExpr,
  RicoUIMutationDescriptor,
  RicoUIParseError,
  RicoUIParseResult,
  RicoUIQueryDescriptor,
  RicoUIStatement,
} from "./types";

interface Token {
  type:
    | "ident"
    | "state"
    | "at_ident"
    | "number"
    | "string"
    | "punct"
    | "op"
    | "eof";
  value: string;
  pos: number;
}

const KNOWN_COMPONENT_NAMES = new Set(
  RICOUI_LIBRARY_SPEC.components.map((c) => c.name)
);

/**
 * Detects whether text contains RicoUI statements or fenced `ricoui` blocks,
 * and splits out lead prose, RicoUI source, and trailing prose.
 */
export function extractRicoUIBlocks(rawInput: string): {
  hasRicoUI: boolean;
  leadText: string;
  programText: string;
  trailText: string;
  incompleteFence: boolean;
} {
  if (!rawInput || !rawInput.trim()) {
    return {
      hasRicoUI: false,
      leadText: "",
      programText: "",
      trailText: "",
      incompleteFence: false,
    };
  }

  // 1. Check marker envelope: ]]>ricoui:content ... ]]>ricoui:end
  const markerStart = rawInput.indexOf("]]>ricoui:content");
  if (markerStart >= 0) {
    const leadText = rawInput.slice(0, markerStart).trim();
    const afterStart = rawInput.slice(markerStart);
    const newlineIdx = afterStart.indexOf("\n");
    const bodyStart = newlineIdx >= 0 ? markerStart + newlineIdx + 1 : rawInput.length;
    const endMarker = rawInput.indexOf("]]>ricoui:end", bodyStart);
    const contextMarker = rawInput.indexOf("]]>ricoui:context", bodyStart);
    const cutIdx =
      contextMarker >= 0 && (endMarker < 0 || contextMarker < endMarker)
        ? contextMarker
        : endMarker;
    if (cutIdx >= 0) {
      const programText = rawInput.slice(bodyStart, cutIdx).trim();
      const afterEndIdx =
        endMarker >= 0 ? endMarker + "]]>ricoui:end".length : cutIdx;
      const trailText = rawInput.slice(afterEndIdx).trim();
      return {
        hasRicoUI: true,
        leadText,
        programText,
        trailText,
        incompleteFence: false,
      };
    }
    return {
      hasRicoUI: true,
      leadText,
      programText: rawInput.slice(bodyStart).trim(),
      trailText: "",
      incompleteFence: true,
    };
  }

  // 2. Check fenced ```ricoui ... ``` block (including unclosed streaming fence)
  const fenceRegex = /```ricoui\s*\r?\n([\s\S]*?)(?:```|$)/i;
  const fenceMatch = fenceRegex.exec(rawInput);
  if (fenceMatch) {
    const start = fenceMatch.index;
    const fullLen = fenceMatch[0].length;
    const closed = fenceMatch[0].endsWith("```");
    return {
      hasRicoUI: true,
      leadText: rawInput.slice(0, start).trim(),
      programText: fenceMatch[1].trim(),
      trailText: closed ? rawInput.slice(start + fullLen).trim() : "",
      incompleteFence: !closed,
    };
  }

  // 3. Detect inline RicoUI statement lines (e.g. `root = Stack([...])` or `$cash = 1000`)
  const lines = rawInput.split(/\r?\n/);
  const stmtLineRegex =
    /^\s*(?:\$[A-Za-z_][A-Za-z0-9_]*|[A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:[A-Z][A-Za-z0-9_]*\s*\(|Query\s*\(|Mutation\s*\(|\[|\{|"|-?\d|\$|@)/;

  let firstStmtIdx = -1;
  let lastStmtIdx = -1;
  let bracketDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (bracketDepth > 0) {
      bracketDepth += countUnquotedDelta(line);
      lastStmtIdx = i;
      continue;
    }

    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("# ") === false && trimmed.startsWith("#") && firstStmtIdx >= 0
    ) {
      if (firstStmtIdx >= 0) lastStmtIdx = i;
      continue;
    }

    if (stmtLineRegex.test(line)) {
      if (firstStmtIdx < 0) firstStmtIdx = i;
      lastStmtIdx = i;
      bracketDepth = Math.max(0, bracketDepth + countUnquotedDelta(line));
    }
  }

  if (firstStmtIdx >= 0) {
    const leadText = lines.slice(0, firstStmtIdx).join("\n").trim();
    const programText = lines.slice(firstStmtIdx, lastStmtIdx + 1).join("\n").trim();
    const trailText = lines.slice(lastStmtIdx + 1).join("\n").trim();
    // Confirm at least `root =` or a known RicoUI component call exists
    const looksValid =
      /\broot\s*=/.test(programText) ||
      Array.from(KNOWN_COMPONENT_NAMES).some((name) =>
        new RegExp(`\\b${name}\\s*\\(`).test(programText)
      );
    if (looksValid) {
      return {
        hasRicoUI: true,
        leadText,
        programText,
        trailText,
        incompleteFence: bracketDepth > 0,
      };
    }
  }

  return {
    hasRicoUI: false,
    leadText: rawInput,
    programText: "",
    trailText: "",
    incompleteFence: false,
  };
}

function countUnquotedDelta(line: string): number {
  let quote: '"' | "'" | null = null;
  let delta = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === "\\" && i + 1 < line.length) {
        i++;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === "(" || ch === "[" || ch === "{") {
      delta++;
    } else if (ch === ")" || ch === "]" || ch === "}") {
      delta--;
    } else if (ch === "/" && line[i + 1] === "/") {
      break;
    }
  }
  return delta;
}

/**
 * Closes open strings and open brackets/parens/braces so partial streamed chunks parse cleanly.
 */
export function closePartialStreamSource(src: string): {
  closed: string;
  wasIncomplete: boolean;
} {
  let quote: '"' | "'" | null = null;
  const stack: string[] = [];

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === "\\" && i + 1 < src.length) {
        i++;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === "(") {
      stack.push(")");
    } else if (ch === "[") {
      stack.push("]");
    } else if (ch === "{") {
      stack.push("}");
    } else if (ch === ")" || ch === "]" || ch === "}") {
      if (stack.length > 0 && stack[stack.length - 1] === ch) {
        stack.pop();
      }
    } else if (ch === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i++;
    }
  }

  let closed = src;
  const wasIncomplete = quote !== null || stack.length > 0;
  if (quote) closed += quote;
  // Strip trailing comma or colon before closing brackets
  closed = closed.replace(/[,:\s]+$/, "");
  while (stack.length > 0) {
    closed += stack.pop();
  }
  return { closed, wasIncomplete };
}

/**
 * Splits a RicoUI program into logical multi-line statements.
 */
function splitStatements(program: string): Array<{ line: number; text: string }> {
  const rawLines = program.split(/\r?\n/);
  const result: Array<{ line: number; text: string }> = [];
  let current = "";
  let startLine = 1;
  let depth = 0;
  let inQuote: '"' | "'" | null = null;

  for (let idx = 0; idx < rawLines.length; idx++) {
    const lineNo = idx + 1;
    const raw = rawLines[idx];

    if (depth === 0 && !inQuote) {
      const trimmed = raw.trim();
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#")) {
        continue;
      }
      startLine = lineNo;
      current = raw;
    } else {
      current += "\n" + raw;
    }

    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (inQuote) {
        if (ch === "\\" && i + 1 < raw.length) {
          i++;
          continue;
        }
        if (ch === inQuote) inQuote = null;
        continue;
      }
      if (ch === '"' || ch === "'") {
        inQuote = ch;
      } else if (ch === "(" || ch === "[" || ch === "{") {
        depth++;
      } else if (ch === ")" || ch === "]" || ch === "}") {
        depth = Math.max(0, depth - 1);
      } else if (ch === "/" && raw[i + 1] === "/") {
        break;
      }
    }

    if (depth === 0 && !inQuote && current.trim()) {
      result.push({ line: startLine, text: current.trim() });
      current = "";
    }
  }

  if (current.trim()) {
    const { closed } = closePartialStreamSource(current.trim());
    result.push({ line: startLine, text: closed });
  }

  return result;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === "/" && input[i + 1] === "/") {
      while (i < input.length && input[i] !== "\n") i++;
      continue;
    }
    if ("()[]{}:,?".includes(ch)) {
      tokens.push({ type: "punct", value: ch, pos: i });
      i++;
      continue;
    }
    const twoChar = input.slice(i, i + 2);
    if (["==", "!=", "<=", ">=", "&&", "||"].includes(twoChar)) {
      tokens.push({ type: "op", value: twoChar, pos: i });
      i += 2;
      continue;
    }
    if ("+-*/%<>!=".includes(ch)) {
      tokens.push({ type: "op", value: ch, pos: i });
      i++;
      continue;
    }
    if (ch === ".") {
      tokens.push({ type: "punct", value: ".", pos: i });
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      const start = i;
      i++;
      let val = "";
      while (i < input.length && input[i] !== quote) {
        if (input[i] === "\\" && i + 1 < input.length) {
          const next = input[i + 1];
          if (next === "n") val += "\n";
          else if (next === "t") val += "\t";
          else val += next;
          i += 2;
        } else {
          val += input[i];
          i++;
        }
      }
      if (input[i] === quote) i++;
      tokens.push({ type: "string", value: val, pos: start });
      continue;
    }
    if (/\d/.test(ch)) {
      const start = i;
      while (i < input.length && /[\d._]/.test(input[i])) i++;
      tokens.push({
        type: "number",
        value: input.slice(start, i).replace(/_/g, ""),
        pos: start,
      });
      continue;
    }
    if (ch === "$" && /[A-Za-z_]/.test(input[i + 1] || "")) {
      const start = i;
      i++;
      while (i < input.length && /[A-Za-z0-9_]/.test(input[i])) i++;
      tokens.push({ type: "state", value: input.slice(start + 1, i), pos: start });
      continue;
    }
    if (ch === "@" && /[A-Za-z_]/.test(input[i + 1] || "")) {
      const start = i;
      i++;
      while (i < input.length && /[A-Za-z0-9_]/.test(input[i])) i++;
      tokens.push({ type: "at_ident", value: input.slice(start + 1, i), pos: start });
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      const start = i;
      while (i < input.length && /[A-Za-z0-9_]/.test(input[i])) i++;
      tokens.push({ type: "ident", value: input.slice(start, i), pos: start });
      continue;
    }
    // Skip unexpected character gracefully
    i++;
  }

  tokens.push({ type: "eof", value: "", pos: input.length });
  return tokens;
}

class ExprParser {
  private tokens: Token[];
  private idx = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public peek(offset = 0): Token {
    return this.tokens[Math.min(this.idx + offset, this.tokens.length - 1)];
  }

  public next(): Token {
    const tok = this.tokens[this.idx];
    if (this.idx < this.tokens.length - 1) this.idx++;
    return tok;
  }

  public matchPunct(val: string): boolean {
    if (this.peek().type === "punct" && this.peek().value === val) {
      this.next();
      return true;
    }
    return false;
  }

  public matchOp(val: string): boolean {
    if (this.peek().type === "op" && this.peek().value === val) {
      this.next();
      return true;
    }
    return false;
  }

  public parseExpression(): RicoUIExpr {
    return this.parseTernary();
  }

  private parseTernary(): RicoUIExpr {
    const test = this.parseOr();
    if (this.matchPunct("?")) {
      const consequent = this.parseExpression();
      this.matchPunct(":");
      const alternate = this.parseExpression();
      return { type: "ternary", test, consequent, alternate };
    }
    return test;
  }

  private parseOr(): RicoUIExpr {
    let left = this.parseAnd();
    while (this.matchOp("||")) {
      left = { type: "binary", op: "||", left, right: this.parseAnd() };
    }
    return left;
  }

  private parseAnd(): RicoUIExpr {
    let left = this.parseEquality();
    while (this.matchOp("&&")) {
      left = { type: "binary", op: "&&", left, right: this.parseEquality() };
    }
    return left;
  }

  private parseEquality(): RicoUIExpr {
    let left = this.parseComparison();
    while (this.peek().type === "op" && (this.peek().value === "==" || this.peek().value === "!=")) {
      const op = this.next().value as "==" | "!=";
      left = { type: "binary", op, left, right: this.parseComparison() };
    }
    return left;
  }

  private parseComparison(): RicoUIExpr {
    let left = this.parseAdditive();
    while (
      this.peek().type === "op" &&
      ["<", "<=", ">", ">="].includes(this.peek().value)
    ) {
      const op = this.next().value as "<" | "<=" | ">" | ">=";
      left = { type: "binary", op, left, right: this.parseAdditive() };
    }
    return left;
  }

  private parseAdditive(): RicoUIExpr {
    let left = this.parseMultiplicative();
    while (
      this.peek().type === "op" &&
      (this.peek().value === "+" || this.peek().value === "-")
    ) {
      const op = this.next().value as "+" | "-";
      left = { type: "binary", op, left, right: this.parseMultiplicative() };
    }
    return left;
  }

  private parseMultiplicative(): RicoUIExpr {
    let left = this.parseUnary();
    while (
      this.peek().type === "op" &&
      (this.peek().value === "*" || this.peek().value === "/" || this.peek().value === "%")
    ) {
      const op = this.next().value as "*" | "/" | "%";
      left = { type: "binary", op, left, right: this.parseUnary() };
    }
    return left;
  }

  private parseUnary(): RicoUIExpr {
    if (this.peek().type === "op" && (this.peek().value === "!" || this.peek().value === "-")) {
      const op = this.next().value as "!" | "-";
      return { type: "unary", op, argument: this.parseUnary() };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): RicoUIExpr {
    let expr = this.parsePrimary();
    while (true) {
      if (this.matchPunct(".")) {
        const propTok = this.next();
        expr = { type: "member", target: expr, property: propTok.value };
      } else if (this.matchPunct("[")) {
        const indexExpr = this.parseExpression();
        this.matchPunct("]");
        expr = { type: "index", target: expr, index: indexExpr };
      } else {
        break;
      }
    }
    return expr;
  }

  private parseCallArgs(): {
    args: RicoUIExpr[];
    namedArgs: Array<{ key: string; value: RicoUIExpr }>;
  } {
    const args: RicoUIExpr[] = [];
    const namedArgs: Array<{ key: string; value: RicoUIExpr }> = [];
    while (
      this.peek().type !== "eof" &&
      !(this.peek().type === "punct" && this.peek().value === ")")
    ) {
      if (
        this.peek().type === "ident" &&
        this.peek(1).type === "op" &&
        this.peek(1).value === "="
      ) {
        const key = this.next().value;
        this.next(); // consume '='
        const value = this.parseExpression();
        namedArgs.push({ key, value });
      } else {
        args.push(this.parseExpression());
      }
      this.matchPunct(",");
    }
    this.matchPunct(")");
    return { args, namedArgs };
  }

  private parseArgList(endPunct: string): RicoUIExpr[] {
    const args: RicoUIExpr[] = [];
    while (
      this.peek().type !== "eof" &&
      !(this.peek().type === "punct" && this.peek().value === endPunct)
    ) {
      args.push(this.parseExpression());
      this.matchPunct(",");
    }
    this.matchPunct(endPunct);
    return args;
  }

  private parsePrimary(): RicoUIExpr {
    const tok = this.peek();

    if (tok.type === "string") {
      this.next();
      return { type: "literal", value: tok.value };
    }
    if (tok.type === "number") {
      this.next();
      const num = Number(tok.value);
      return { type: "literal", value: Number.isFinite(num) ? num : 0 };
    }
    if (tok.type === "state") {
      this.next();
      return { type: "state", name: tok.value };
    }
    if (tok.type === "at_ident") {
      this.next();
      let args: RicoUIExpr[] = [];
      let namedArgs: Array<{ key: string; value: RicoUIExpr }> = [];
      if (this.matchPunct("(")) {
        const parsedArgs = this.parseCallArgs();
        args = parsedArgs.args;
        namedArgs = parsedArgs.namedArgs;
      }
      return {
        type: "call",
        name: tok.value,
        args,
        ...(namedArgs.length > 0 ? { namedArgs } : {}),
      };
    }
    if (tok.type === "ident") {
      this.next();
      if (tok.value === "true") return { type: "literal", value: true };
      if (tok.value === "false") return { type: "literal", value: false };
      if (tok.value === "null" || tok.value === "undefined") {
        return { type: "literal", value: null };
      }

      if (this.matchPunct("(")) {
        const parsedArgs = this.parseCallArgs();
        return {
          type: "component",
          name: tok.value,
          args: parsedArgs.args,
          ...(parsedArgs.namedArgs.length > 0 ? { namedArgs: parsedArgs.namedArgs } : {}),
        };
      }
      return { type: "ref", name: tok.value };
    }
    if (this.matchPunct("[")) {
      const items = this.parseArgList("]");
      return { type: "array", items };
    }
    if (this.matchPunct("{")) {
      const entries: Array<{ key: string; value: RicoUIExpr }> = [];
      while (
        this.peek().type !== "eof" &&
        !(this.peek().type === "punct" && this.peek().value === "}")
      ) {
        const keyTok = this.next();
        const key = keyTok.value;
        if (this.matchPunct(":")) {
          const value = this.parseExpression();
          entries.push({ key, value });
        } else {
          entries.push({ key, value: { type: "ref", name: key } });
        }
        this.matchPunct(",");
      }
      this.matchPunct("}");
      return { type: "object", entries };
    }
    if (this.matchPunct("(")) {
      const inner = this.parseExpression();
      this.matchPunct(")");
      return inner;
    }

    this.next();
    return { type: "literal", value: null };
  }
}

function parseSingleStatement(
  stmtText: string,
  line: number,
  errors: RicoUIParseError[]
): RicoUIStatement | null {
  const tokens = tokenize(stmtText);
  if (tokens.length < 3) return null;

  const lhs = tokens[0];
  const eq = tokens[1];
  if (eq.type !== "op" || eq.value !== "=") {
    errors.push({
      code: "syntax-error",
      line,
      message: `Expected '=' assignment on line ${line}.`,
    });
    return null;
  }

  const parser = new ExprParser(tokens.slice(2));
  const rhs = parser.parseExpression();

  if (lhs.type === "state") {
    return {
      kind: "state_init",
      name: lhs.value,
      expr: rhs,
      line,
    };
  }

  if (lhs.type === "ident") {
    if (rhs.type === "component" && rhs.name === "Query") {
      const toolExpr = rhs.args[0];
      const toolName =
        toolExpr && toolExpr.type === "literal" && typeof toolExpr.value === "string"
          ? toolExpr.value
          : "";
      const argsExpr = rhs.args[1] ?? { type: "object", entries: [] };
      const defaultsExpr = rhs.args[2] ?? { type: "object", entries: [] };
      const refreshExpr = rhs.args[3];
      const refreshSeconds =
        refreshExpr && refreshExpr.type === "literal" && typeof refreshExpr.value === "number"
          ? refreshExpr.value
          : undefined;
      return {
        kind: "query",
        id: lhs.value,
        tool: toolName,
        argsExpr,
        defaultsExpr,
        refreshSeconds,
        line,
      };
    }

    if (rhs.type === "component" && rhs.name === "Mutation") {
      const toolExpr = rhs.args[0];
      const toolName =
        toolExpr && toolExpr.type === "literal" && typeof toolExpr.value === "string"
          ? toolExpr.value
          : "";
      const argsExpr = rhs.args[1] ?? { type: "object", entries: [] };
      return {
        kind: "mutation",
        id: lhs.value,
        tool: toolName,
        argsExpr,
        line,
      };
    }

    return {
      kind: "assign",
      id: lhs.value,
      expr: rhs,
      line,
    };
  }

  return null;
}

function evalBuiltinFunction(name: string, args: unknown[]): unknown {
  const toNum = (v: unknown): number => {
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    if (typeof v === "string") {
      const n = Number(v.replace(/[$,%\s]/g, ""));
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  switch (name) {
    case "Count": {
      const list = args[0];
      return Array.isArray(list) ? list.length : 0;
    }
    case "Sum": {
      const list = args[0];
      const field = typeof args[1] === "string" ? args[1] : undefined;
      if (!Array.isArray(list)) return 0;
      return list.reduce<number>((sum, item) => {
        if (field && item && typeof item === "object") {
          return sum + toNum((item as Record<string, unknown>)[field]);
        }
        return sum + toNum(item);
      }, 0);
    }
    case "Avg": {
      const list = args[0];
      if (!Array.isArray(list) || list.length === 0) return 0;
      const sum = evalBuiltinFunction("Sum", args) as number;
      return sum / list.length;
    }
    case "Min": {
      const list = args[0];
      if (!Array.isArray(list) || list.length === 0) return 0;
      return Math.min(...list.map(toNum));
    }
    case "Max": {
      const list = args[0];
      if (!Array.isArray(list) || list.length === 0) return 0;
      return Math.max(...list.map(toNum));
    }
    case "Round": {
      const val = toNum(args[0]);
      const dec = args[1] !== undefined ? Math.max(0, Math.min(6, Math.floor(toNum(args[1])))) : 0;
      const factor = Math.pow(10, dec);
      return Math.round(val * factor) / factor;
    }
    case "Floor":
      return Math.floor(toNum(args[0]));
    case "Ceil":
      return Math.ceil(toNum(args[0]));
    case "Abs":
      return Math.abs(toNum(args[0]));
    case "Mul":
      return toNum(args[0]) * toNum(args[1]);
    case "Div": {
      const b = toNum(args[1]);
      return b === 0 ? 0 : toNum(args[0]) / b;
    }
    case "Percent": {
      const part = toNum(args[0]);
      const total = toNum(args[1]);
      if (total === 0) return "0%";
      return `${Math.round((part / total) * 100)}%`;
    }
    case "Currency": {
      const amount = toNum(args[0]);
      const currency = typeof args[1] === "string" && args[1] ? args[1] : "USD";
      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
      } catch {
        return `$${amount.toFixed(2)}`;
      }
    }
    case "Filter": {
      const list = args[0];
      const field = String(args[1] ?? "");
      const op = String(args[2] ?? "==");
      const target = args[3];
      if (!Array.isArray(list)) return [];
      if (target === "ALL" || target === "" || target === null || target === undefined) {
        return list;
      }
      return list.filter((item) => {
        if (!item || typeof item !== "object") return false;
        const val = (item as Record<string, unknown>)[field];
        switch (op) {
          case "==":
            return String(val).toLowerCase() === String(target).toLowerCase();
          case "!=":
            return String(val).toLowerCase() !== String(target).toLowerCase();
          case ">":
            return toNum(val) > toNum(target);
          case ">=":
            return toNum(val) >= toNum(target);
          case "<":
            return toNum(val) < toNum(target);
          case "<=":
            return toNum(val) <= toNum(target);
          case "contains":
            return String(val ?? "")
              .toLowerCase()
              .includes(String(target).toLowerCase());
          default:
            return true;
        }
      });
    }
    case "Sort": {
      const list = args[0];
      const field = String(args[1] ?? "");
      const dir = String(args[2] ?? "asc").toLowerCase() === "desc" ? -1 : 1;
      if (!Array.isArray(list)) return [];
      return [...list].sort((a, b) => {
        const av = a && typeof a === "object" ? (a as Record<string, unknown>)[field] : a;
        const bv = b && typeof b === "object" ? (b as Record<string, unknown>)[field] : b;
        if (typeof av === "number" && typeof bv === "number") {
          return (av - bv) * dir;
        }
        return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
      });
    }
    default:
      return null;
  }
}

const ACTION_NAMES = new Set(RICOUI_LIBRARY_SPEC.actions.map((a) => a.name));

export interface ParseRicoUIOptions {
  isStreaming?: boolean;
  stateOverrides?: Record<string, unknown>;
  queryData?: Record<string, unknown>;
}

/**
 * Parses and evaluates a RicoUI response into an interactive component tree.
 */
export function parseRicoUI(
  rawResponse: string,
  options: ParseRicoUIOptions = {}
): RicoUIParseResult {
  const extracted = extractRicoUIBlocks(rawResponse);
  if (!extracted.hasRicoUI) {
    return {
      hasRicoUI: false,
      leadText: rawResponse,
      trailText: "",
      rawProgram: "",
      statements: [],
      root: null,
      initialState: {},
      queries: [],
      mutations: [],
      meta: {
        incomplete: false,
        unresolved: [],
        orphaned: [],
        errors: [],
      },
    };
  }

  const { closed, wasIncomplete } = closePartialStreamSource(extracted.programText);
  const errors: RicoUIParseError[] = [];
  const rawStmts = splitStatements(closed);
  const statements: RicoUIStatement[] = [];

  for (const s of rawStmts) {
    const parsed = parseSingleStatement(s.text, s.line, errors);
    if (parsed) statements.push(parsed);
  }

  const assignMap = new Map<string, { expr: RicoUIExpr; line: number }>();
  const initialState: Record<string, unknown> = {};
  const queries: RicoUIQueryDescriptor[] = [];
  const mutations: RicoUIMutationDescriptor[] = [];
  const queryValueMap = new Map<string, unknown>();

  // First pass: register state defaults & assign statements (later duplicate wins)
  for (const st of statements) {
    if (st.kind === "assign") {
      // `name = null` deletes statement in incremental edit mode
      if (st.expr.type === "literal" && st.expr.value === null) {
        assignMap.delete(st.id);
      } else {
        assignMap.set(st.id, { expr: st.expr, line: st.line });
      }
    }
  }

  const activeState: Record<string, unknown> = {};
  const unresolvedSet = new Set<string>();
  const reachedIds = new Set<string>();
  const visiting = new Set<string>();

  const evalExpr = (expr: RicoUIExpr, localScope?: Record<string, unknown>): unknown => {
    switch (expr.type) {
      case "literal":
        return expr.value;
      case "state":
        return expr.name in activeState ? activeState[expr.name] : null;
      case "ref": {
        if (localScope && expr.name in localScope) {
          return localScope[expr.name];
        }
        if (queryValueMap.has(expr.name)) {
          reachedIds.add(expr.name);
          return queryValueMap.get(expr.name);
        }
        const target = assignMap.get(expr.name);
        if (!target) {
          unresolvedSet.add(expr.name);
          return undefined;
        }
        if (visiting.has(expr.name)) return undefined;
        visiting.add(expr.name);
        reachedIds.add(expr.name);
        const val = evalExpr(target.expr, localScope);
        visiting.delete(expr.name);
        if (val && typeof val === "object" && (val as RicoUIEvaluatedNode).kind === "element") {
          return { ...(val as RicoUIEvaluatedNode), id: expr.name };
        }
        return val;
      }
      case "array": {
        const out: unknown[] = [];
        for (const item of expr.items) {
          const v = evalExpr(item, localScope);
          if (v !== undefined) out.push(v);
        }
        return out;
      }
      case "object": {
        const obj: Record<string, unknown> = {};
        for (const entry of expr.entries) {
          const v = evalExpr(entry.value, localScope);
          if (v !== undefined) obj[entry.key] = v;
        }
        return obj;
      }
      case "member": {
        const base = evalExpr(expr.target, localScope);
        if (base === null || base === undefined) return null;
        if (Array.isArray(base)) {
          if (expr.property === "length") return base.length;
          return base.map((el) =>
            el && typeof el === "object"
              ? (el as Record<string, unknown>)[expr.property]
              : null
          );
        }
        if (typeof base === "object") {
          return (base as Record<string, unknown>)[expr.property] ?? null;
        }
        return null;
      }
      case "index": {
        const base = evalExpr(expr.target, localScope);
        const idx = evalExpr(expr.index, localScope);
        if (Array.isArray(base) && typeof idx === "number") {
          return base[idx] ?? null;
        }
        if (base && typeof base === "object" && typeof idx === "string") {
          return (base as Record<string, unknown>)[idx] ?? null;
        }
        return null;
      }
      case "unary": {
        const v = evalExpr(expr.argument, localScope);
        if (expr.op === "!") return !v;
        return -Number(v || 0);
      }
      case "binary": {
        const l = evalExpr(expr.left, localScope);
        const r = evalExpr(expr.right, localScope);
        switch (expr.op) {
          case "+":
            if (typeof l === "string" || typeof r === "string") {
              return `${l ?? ""}${r ?? ""}`;
            }
            return Number(l || 0) + Number(r || 0);
          case "-":
            return Number(l || 0) - Number(r || 0);
          case "*":
            return Number(l || 0) * Number(r || 0);
          case "/":
            return Number(r || 0) === 0 ? 0 : Number(l || 0) / Number(r || 0);
          case "%":
            return Number(r || 0) === 0 ? 0 : Number(l || 0) % Number(r || 0);
          case "==":
            return l === r;
          case "!=":
            return l !== r;
          case "<":
            return Number(l || 0) < Number(r || 0);
          case "<=":
            return Number(l || 0) <= Number(r || 0);
          case ">":
            return Number(l || 0) > Number(r || 0);
          case ">=":
            return Number(l || 0) >= Number(r || 0);
          case "&&":
            return Boolean(l) && Boolean(r);
          case "||":
            return Boolean(l) || Boolean(r);
        }
        return null;
      }
      case "ternary": {
        const cond = evalExpr(expr.test, localScope);
        return cond
          ? evalExpr(expr.consequent, localScope)
          : evalExpr(expr.alternate, localScope);
      }
      case "call": {
        if (expr.name === "Each") {
          const listVal = evalExpr(expr.args[0], localScope);
          const varNameExpr = expr.args[1];
          const templateExpr = expr.args[2];
          const varName =
            varNameExpr && varNameExpr.type === "literal" && typeof varNameExpr.value === "string"
              ? varNameExpr.value
              : "item";
          if (!Array.isArray(listVal) || !templateExpr) return [];
          return listVal
            .map((item) => evalExpr(templateExpr, { ...localScope, [varName]: item }))
            .filter((x) => x !== undefined && x !== null);
        }

        if (ACTION_NAMES.has(expr.name)) {
          const evaluatedArgs = expr.args.map((a) =>
            a.type === "state" ? `$${a.name}` : evalExpr(a, localScope)
          );
          const step: RicoUIActionStep = {
            kind: "action_step",
            name: expr.name,
            args: evaluatedArgs,
            rawArgs: expr.args,
          };
          return step;
        }

        const fnArgs = expr.args.map((a) => evalExpr(a, localScope));
        const res = evalBuiltinFunction(expr.name, fnArgs);
        if (
          res === null &&
          !RICOUI_LIBRARY_SPEC.functions.some((f) => f.name === expr.name)
        ) {
          errors.push({
            code: "unknown-function",
            message: `Unknown @${expr.name} function.`,
          });
        }
        return res;
      }
      case "component": {
        if (expr.name === "Action") {
          const stepsArg = evalExpr(expr.args[0], localScope);
          const steps = Array.isArray(stepsArg)
            ? (stepsArg.filter(
                (s): s is RicoUIActionStep =>
                  Boolean(s && typeof s === "object" && (s as RicoUIActionStep).kind === "action_step")
              ))
            : [];
          const chain: RicoUIActionChain = { kind: "action_chain", steps };
          return chain;
        }

        const spec = COMPONENT_SPEC_MAP.get(expr.name);
        if (!spec) {
          errors.push({
            code: "unknown-component",
            component: expr.name,
            message: `Unknown RicoUI component '${expr.name}'.`,
          });
          return undefined;
        }

        const props: Record<string, unknown> = {};
        const bindings: Record<string, string> = {};
        const namedMap = new Map<string, RicoUIExpr>(
          (expr.namedArgs ?? []).map((na) => [na.key, na.value])
        );

        for (let i = 0; i < spec.props.length; i++) {
          const pDesc = spec.props[i];
          const argExpr = expr.args[i] ?? namedMap.get(pDesc.name);

          if (!argExpr) {
            if (pDesc.defaultValue !== undefined) {
              props[pDesc.name] = pDesc.defaultValue;
            } else if (pDesc.required && !options.isStreaming) {
              errors.push({
                code: "missing-required",
                component: expr.name,
                message: `Missing required prop '${pDesc.name}' on ${expr.name}.`,
              });
            }
            continue;
          }

          if (pDesc.kind === "binding" && argExpr.type === "state") {
            bindings[pDesc.name] = argExpr.name;
            props[pDesc.name] =
              argExpr.name in activeState ? activeState[argExpr.name] : null;
            continue;
          }

          const val = evalExpr(argExpr, localScope);
          if (val === null || val === undefined) {
            if (pDesc.defaultValue !== undefined) {
              props[pDesc.name] = pDesc.defaultValue;
            }
          } else {
            props[pDesc.name] = val;
          }
        }

        const node: RicoUIEvaluatedNode = {
          kind: "element",
          component: expr.name,
          props,
          bindings,
        };
        return node;
      }
    }
  };

  // Evaluate initial $state declarations
  for (const st of statements) {
    if (st.kind === "state_init") {
      const defVal = evalExpr(st.expr);
      initialState[st.name] = defVal;
      activeState[st.name] =
        options.stateOverrides && st.name in options.stateOverrides
          ? options.stateOverrides[st.name]
          : defVal;
    }
  }
  if (options.stateOverrides) {
    for (const [k, v] of Object.entries(options.stateOverrides)) {
      activeState[k] = v;
    }
  }

  // Evaluate Query & Mutation descriptors
  for (const st of statements) {
    if (st.kind === "query") {
      const evaluatedArgs = evalExpr(st.argsExpr);
      const argsObj =
        evaluatedArgs && typeof evaluatedArgs === "object" && !Array.isArray(evaluatedArgs)
          ? (evaluatedArgs as Record<string, unknown>)
          : {};
      const defaultsVal = evalExpr(st.defaultsExpr);
      queries.push({
        id: st.id,
        tool: st.tool,
        args: argsObj,
        defaults: defaultsVal,
        refreshSeconds: st.refreshSeconds,
      });
      const resolvedData =
        options.queryData && st.id in options.queryData
          ? options.queryData[st.id]
          : defaultsVal;
      queryValueMap.set(st.id, resolvedData);
    } else if (st.kind === "mutation") {
      const evaluatedArgs = evalExpr(st.argsExpr);
      const argsObj =
        evaluatedArgs && typeof evaluatedArgs === "object" && !Array.isArray(evaluatedArgs)
          ? (evaluatedArgs as Record<string, unknown>)
          : {};
      mutations.push({
        id: st.id,
        tool: st.tool,
        args: argsObj,
      });
    }
  }

  // Resolve entry root
  let rootNode: RicoUIEvaluatedNode | null = null;
  let rootId: string | null = null;

  if (assignMap.has("root")) {
    rootId = "root";
  } else {
    for (const [id, entry] of Array.from(assignMap.entries())) {
      if (entry.expr.type === "component" && KNOWN_COMPONENT_NAMES.has(entry.expr.name)) {
        rootId = id;
        break;
      }
    }
  }

  if (rootId) {
    reachedIds.add(rootId);
    const evaluated = evalExpr(assignMap.get(rootId)!.expr);
    if (
      evaluated &&
      typeof evaluated === "object" &&
      (evaluated as RicoUIEvaluatedNode).kind === "element"
    ) {
      rootNode = { ...(evaluated as RicoUIEvaluatedNode), id: rootId };
    }
  } else if (!options.isStreaming) {
    errors.push({
      code: "no-root",
      message: "No root component entry found in RicoUI program.",
    });
  }

  const orphaned: string[] = [];
  for (const id of Array.from(assignMap.keys())) {
    if (!reachedIds.has(id)) orphaned.push(id);
  }

  return {
    hasRicoUI: true,
    leadText: extracted.leadText,
    trailText: extracted.trailText,
    rawProgram: extracted.programText,
    statements,
    root: rootNode,
    initialState,
    queries,
    mutations,
    meta: {
      incomplete: Boolean(options.isStreaming || wasIncomplete || extracted.incompleteFence),
      unresolved: Array.from(unresolvedSet),
      orphaned,
      errors,
    },
  };
}

/**
 * Merges an incremental patch into an existing RicoUI program:
 * - Replaces statements by name
 * - Deletes statements set to `name = null`
 * - Appends new statements
 */
export function mergeRicoUIStatements(
  currentProgram: string,
  patchText: string
): string {
  const extractedCurrent = extractRicoUIBlocks(currentProgram);
  const baseSrc = extractedCurrent.hasRicoUI ? extractedCurrent.programText : currentProgram;
  const extractedPatch = extractRicoUIBlocks(patchText);
  const patchSrc = extractedPatch.hasRicoUI ? extractedPatch.programText : patchText;

  const baseStmts = splitStatements(baseSrc);
  const patchStmts = splitStatements(patchSrc);

  const map = new Map<string, string>();
  const order: string[] = [];

  const extractKey = (stmtLine: string): { key: string; isDelete: boolean } | null => {
    const m = /^(\$?[A-Za-z_][A-Za-z0-9_]*)\s*=\s*([\s\S]*)$/.exec(stmtLine.trim());
    if (!m) return null;
    return {
      key: m[1],
      isDelete: m[2].trim() === "null",
    };
  };

  for (const s of baseStmts) {
    const info = extractKey(s.text);
    if (!info) continue;
    if (!map.has(info.key)) order.push(info.key);
    map.set(info.key, s.text);
  }

  for (const p of patchStmts) {
    const info = extractKey(p.text);
    if (!info) continue;
    if (info.isDelete) {
      map.delete(info.key);
    } else {
      if (!map.has(info.key)) order.push(info.key);
      map.set(info.key, p.text);
    }
  }

  return order
    .filter((k) => map.has(k))
    .map((k) => map.get(k)!)
    .join("\n");
}

/**
 * Local self-healing repair pass (zero cloud dependency):
 * Fixes missing `root = Stack([...])` wrappers and closes stray brackets.
 */
export function repairRicoUIProgram(rawProgram: string): string {
  const { closed } = closePartialStreamSource(rawProgram.trim());
  if (!closed) return "";
  const parsed = parseRicoUI(closed, { isStreaming: false });
  const hasExplicitRoot = parsed.statements.some(
    (s) => s.kind === "assign" && s.id === "root"
  );
  if (hasExplicitRoot && parsed.root) return closed;

  // If component assignments exist without `root = ...`, synthesize root = Stack([...])
  const componentIds = parsed.statements
    .filter(
      (s): s is Extract<RicoUIStatement, { kind: "assign" }> =>
        s.kind === "assign" &&
        s.expr.type === "component" &&
        KNOWN_COMPONENT_NAMES.has(s.expr.name)
    )
    .map((s) => s.id);

  if (componentIds.length > 0) {
    return `root = Stack([${componentIds.join(", ")}])\n${closed}`;
  }

  return closed;
}

/**
 * Safely strips markdown asterisks in plain text while leaving `ricoui` blocks untouched.
 */
export function stripStarsPreservingRicoUI(text: string): string {
  if (!text) return "";
  const cleanPlain = (chunk: string) =>
    chunk
      .replace(/^(\s*)\*+(\s*)/gm, "$1- $2")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/^(\s*)\*+\s*/gm, "$1")
      .replace(/\s*\*+\s*$/gm, "")
      .replace(/^\*+/, "")
      .replace(/\*+$/, "");

  const extracted = extractRicoUIBlocks(text);
  if (!extracted.hasRicoUI) {
    return cleanPlain(text);
  }

  const parts: string[] = [];
  if (extracted.leadText) parts.push(cleanPlain(extracted.leadText));
  parts.push("```ricoui\n" + extracted.programText + "\n```");
  if (extracted.trailText) parts.push(cleanPlain(extracted.trailText));
  return parts.join("\n\n");
}

/**
 * Produces clean human-readable copy text from a RicoUI message (without raw DSL code).
 */
export function extractReadableSummaryFromRicoUI(rawResponse: string): string {
  const parsed = parseRicoUI(rawResponse);
  if (!parsed.hasRicoUI || !parsed.root) {
    return stripStarsPreservingRicoUI(rawResponse);
  }

  const lines: string[] = [];
  if (parsed.leadText) lines.push(parsed.leadText);

  const collectNodeText = (node: RicoUIEvaluatedNode) => {
    const p = node.props;
    if (node.component === "Metric") {
      lines.push(
        `- ${String(p.label ?? "")}: ${String(p.value ?? "")}${
          p.sublabel ? ` (${String(p.sublabel)})` : ""
        }`
      );
    } else if (node.component === "Callout") {
      lines.push(`${String(p.title ?? "")}: ${String(p.body ?? "")}`);
    } else if (node.component === "TextBlock") {
      lines.push(String(p.text ?? ""));
    } else if (node.component === "MandateBuilderCard") {
      lines.push(
        `Spending Rule Configurator: ${String(p.service ?? "")} — Cap $${Number(
          p.suggestedCeiling ?? 0
        ).toFixed(2)} (${String(p.defaultRecurrence ?? "")})`
      );
    } else if (node.component === "PaymentGuardrailCard") {
      lines.push(
        `${String(p.service ?? "")}: Verified $${Number(p.verifiedPrice ?? 0).toFixed(
          2
        )} vs $${Number(p.budgetCeiling ?? 0).toFixed(2)} cap (${String(p.status ?? "")})`
      );
    } else if (node.component === "DashboardPreviewCard") {
      lines.push(
        `Live Dashboard: ${String(p.title ?? "")}${
          p.description ? ` — ${String(p.description)}` : ""
        }`
      );
    } else if (node.component === "CreditMatchCard" && Array.isArray(p.programs)) {
      lines.push(`${String(p.title ?? "Eligible Programs")} (${String(p.totalValueLabel ?? "")}):`);
      for (const prog of p.programs) {
        if (prog && typeof prog === "object") {
          const rec = prog as Record<string, unknown>;
          lines.push(
            `- ${String(rec.name ?? "")}${rec.value ? ` (${String(rec.value)})` : ""}: ${String(
              rec.detail ?? ""
            )}`
          );
        }
      }
    } else if (node.component === "ProgramCatalogCard" && Array.isArray(p.items)) {
      lines.push(`${String(p.title ?? "Programs")}:`);
      for (const it of p.items) {
        if (it && typeof it === "object") {
          const rec = it as Record<string, unknown>;
          lines.push(
            `- ${String(rec.name ?? "")}${rec.value ? ` [${String(rec.value)}]` : ""}: ${String(
              rec.summary ?? ""
            )}`
          );
        }
      }
    } else if (node.component === "Accordion" && Array.isArray(p.items)) {
      for (const it of p.items) {
        if (it && typeof it === "object") {
          const rec = it as Record<string, unknown>;
          lines.push(`- ${String(rec.title ?? "")}: ${String(rec.detail ?? "")}`);
        }
      }
    } else if (node.component === "Steps" && Array.isArray(p.items)) {
      p.items.forEach((it, idx) => {
        if (it && typeof it === "object") {
          const rec = it as Record<string, unknown>;
          lines.push(
            `${idx + 1}. ${String(rec.title ?? "")}${
              rec.detail ? ` — ${String(rec.detail)}` : ""
            }`
          );
        } else {
          lines.push(`${idx + 1}. ${String(it)}`);
        }
      });
    }

    for (const val of Object.values(p)) {
      if (Array.isArray(val)) {
        for (const item of val) {
          if (
            item &&
            typeof item === "object" &&
            (item as RicoUIEvaluatedNode).kind === "element"
          ) {
            collectNodeText(item as RicoUIEvaluatedNode);
          }
        }
      }
    }
  };

  collectNodeText(parsed.root);
  if (parsed.trailText) lines.push(parsed.trailText);
  return lines.filter(Boolean).join("\n");
}

function inferItemCategory(name: string, detail: string): string {
  const combined = `${name} ${detail}`.toLowerCase();
  if (/\b(combinator|\byc\b|techstars|500 global|accelerator|incubator|seed|venture|sequoia|speedrun)\b/.test(combined)) {
    return "Accelerators";
  }
  if (/\b(aws|cloud|google cloud|gcp|azure|microsoft|nvidia|gpu|compute|openai|hosting|vercel)\b/.test(combined)) {
    return "Cloud & AI";
  }
  if (/\b(posthog|analytics|notion|slack|zendesk|retool|github|copilot|devtools|workspace|productivity)\b/.test(combined)) {
    return "SaaS & DevTools";
  }
  if (/\b(stripe|paypal|payment|card|waiver|tax|deduction|irs|billing)\b/.test(combined)) {
    return "Payments & Tax";
  }
  return "Highlights";
}

function extractHighlightBadge(name: string, detail: string): string {
  const combined = `${name} ${detail}`;
  const moneyMatch = combined.match(/\$[0-9][0-9,.]*(?:\s*(?:k|K|m|M|million|thousand|\+|\/mo|\/yr))?/);
  if (moneyMatch) return moneyMatch[0].trim();
  const pctMatch = combined.match(/\b\d{1,3}%\s*(?:off|discount|equity|deductible|free)?/i);
  if (pctMatch) return pctMatch[0].trim();
  const mosMatch = combined.match(/\b\d{1,2}\s*(?:months?|mos|weeks?|yrs?|years?)\b/i);
  if (mosMatch) return mosMatch[0].trim();
  return "";
}

/**
 * Local zero-dependency prose-to-RicoUI compiler:
 * Converts plain bulleted/numbered lists or multi-paragraph text walls from a model
 * into structured interactive RicoUI cards, tabs, tables, and contextual follow-up actions.
 */
export function convertPlainProseToRicoUI(
  rawText: string,
  userMessage = ""
): string | null {
  if (!rawText || !rawText.trim()) return null;
  if (extractRicoUIBlocks(rawText).hasRicoUI) return null;

  const cleaned = stripStarsPreservingRicoUI(rawText).trim();
  const rawLines = cleaned.split(/\r?\n/);

  const introLines: string[] = [];
  const rawBullets: string[] = [];
  let seenFirstBullet = false;

  const bulletStartRe = /^\s*(?:[-•–]|\d+[.)])\s+(.+)$/;

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = bulletStartRe.exec(trimmed);
    if (match) {
      seenFirstBullet = true;
      rawBullets.push(match[1].trim());
    } else if (!seenFirstBullet) {
      introLines.push(trimmed);
    } else if (rawBullets.length > 0 && /^\s{2,}/.test(line)) {
      rawBullets[rawBullets.length - 1] += " " + trimmed;
    }
  }

  const conciseLead = (() => {
    const firstIntro = introLines[0] || "";
    if (!firstIntro) return "Structured breakdown and interactive comparison:";
    const firstSentence = firstIntro.split(/(?<=[.!?])\s+/)[0] || firstIntro;
    return firstSentence.length > 140
      ? firstSentence.slice(0, 137).trimEnd() + "..."
      : firstSentence;
  })();

  const topicClean = userMessage.replace(/[?!.]+$/, "").trim();

  // Only compile when the model dumped a long list of 4+ bullet/numbered items;
  // leave short 1-3 point answers and conversational replies as natural prose.
  if (rawBullets.length >= 4) {
    const structured = rawBullets.map((b, idx) => {
      const splitMatch = /^([^:—–-]{2,64})\s*(?::|—|–|\s-\s)\s*(.+)$/.exec(b);
      const name = splitMatch ? splitMatch[1].trim() : `Item ${idx + 1}`;
      const summary = splitMatch ? splitMatch[2].trim() : b;
      const category = inferItemCategory(name, summary);
      const value = extractHighlightBadge(name, summary);
      const url = resolveOfficialUrl(name);
      return {
        name,
        category,
        value: value || "",
        summary,
        ...(url ? { url } : {}),
      };
    });

    const titleLabel =
      topicClean && topicClean.length <= 56
        ? topicClean.charAt(0).toUpperCase() + topicClean.slice(1)
        : "Overview";

    const tableRows = structured.map((s) => ({
      program: s.name,
      category: s.category,
      highlight: s.value || "—",
      summary:
        s.summary.length > 90 ? s.summary.slice(0, 87).trimEnd() + "..." : s.summary,
    }));

    return [
      conciseLead,
      "",
      "```ricoui",
      "root = Stack([views])",
      'views = Tabs([tabCards, tabTable], "cards")',
      'tabCards = TabItem("cards", "Directory", [catalog])',
      `catalog = ProgramCatalogCard(${JSON.stringify(titleLabel)}, ${JSON.stringify(structured)}, "Search or filter by category", "${structured.length} items")`,
      'tabTable = TabItem("table", "Table", [tbl])',
      `tbl = DataTable([{ key: "program", label: "Name" }, { key: "category", label: "Category" }, { key: "highlight", label: "Highlight", align: "right" }, { key: "summary", label: "Summary" }], ${JSON.stringify(tableRows)}, ${JSON.stringify(titleLabel)}, true)`,
      "```",
    ].join("\n");
  }

  return null;
}
