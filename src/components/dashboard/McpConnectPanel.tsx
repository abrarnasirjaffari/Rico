"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plug,
  RefreshCw,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  MessageSquare,
  FileText,
  GitBranch,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface MCPServerRecord {
  id: string;
  name: string;
  endpointUrl: string;
  transport: string;
  category: string;
  status: "CONNECTED" | "CONNECTING" | "DISCONNECTED" | "ERROR";
  toolCount?: number;
  latencyMs?: number;
  tools?: Array<{
    name: string;
    description: string;
    isFinancial?: boolean;
    inputSchema?: Record<string, unknown>;
  }>;
}

interface AdapterHealth {
  name: string;
  displayName?: string;
  status: string;
  toolsCount: number;
  tools?: string[];
  latencyMs?: number;
  lastCheckedAt?: string;
}

export function McpConnectPanel() {
  const [servers, setServers] = useState<MCPServerRecord[]>([]);
  const [adapters, setAdapters] = useState<AdapterHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedServerId, setExpandedServerId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Connect form state
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [connectForm, setConnectForm] = useState({
    name: "",
    endpointUrl: "",
    transport: "HTTP",
    authToken: "",
    category: "finance",
  });
  const [isConnecting, setIsConnecting] = useState(false);

  // Tool execution sandbox state
  const [showSandbox, setShowSandbox] = useState(false);
  const [selectedServer, setSelectedServer] = useState<string>("");
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [toolArgs, setToolArgs] = useState<string>("{}");
  const [toolExecuting, setToolExecuting] = useState(false);
  const [toolResult, setToolResult] = useState<unknown>(null);

  const fetchRegistryAndAdapters = useCallback(async () => {
    setLoading(true);
    try {
      const [regRes, adaptRes] = await Promise.all([
        fetch("/api/mcp/registry"),
        fetch("/api/mcp/adapters"),
      ]);

      if (regRes.ok) {
        const regData = await regRes.json();
        setServers(regData.servers || []);
        if (regData.servers?.length > 0) {
          setSelectedServer((curr) => curr || regData.servers[0].id);
          setSelectedTool((curr) => {
            if (curr) return curr;
            const first = regData.servers[0];
            return first?.tools?.[0]?.name || "";
          });
        }
      }

      if (adaptRes.ok) {
        const adaptData = await adaptRes.json();
        setAdapters(adaptData.adapters || []);
      }
    } catch {
      setActionMessage({
        type: "error",
        text: "Could not load MCP connectors.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistryAndAdapters();
  }, [fetchRegistryAndAdapters]);

  const handleRefreshServer = async (id: string) => {
    setRefreshingId(id);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/mcp/registry/${id}/refresh`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({
          type: "success",
          text: `Refreshed tools (${data.server?.latencyMs ?? 24}ms).`,
        });
        fetchRegistryAndAdapters();
      } else {
        setActionMessage({
          type: "error",
          text: data.error || "Refresh failed.",
        });
      }
    } catch {
      setActionMessage({ type: "error", text: "Network error during refresh." });
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDeleteServer = async (id: string) => {
    try {
      const res = await fetch(`/api/mcp/registry/${id}`, { method: "DELETE" });
      if (res.ok) {
        setActionMessage({
          type: "success",
          text: "Connector removed.",
        });
        fetchRegistryAndAdapters();
      }
    } catch {
      setActionMessage({ type: "error", text: "Could not remove connector." });
    }
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectForm.endpointUrl.trim()) return;
    setIsConnecting(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/mcp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(connectForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({
          type: "success",
          text: `Connected ${connectForm.name || "MCP server"}.`,
        });
        setIsConnectOpen(false);
        setConnectForm({
          name: "",
          endpointUrl: "",
          transport: "HTTP",
          authToken: "",
          category: "finance",
        });
        fetchRegistryAndAdapters();
      } else {
        setActionMessage({
          type: "error",
          text: data.error || "Connection failed. Verify the endpoint URL.",
        });
      }
    } catch {
      setActionMessage({
        type: "error",
        text: "Network error while connecting server.",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleExecuteTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool) return;
    setToolExecuting(true);
    setToolResult(null);

    let parsedArgs = {};
    try {
      parsedArgs = JSON.parse(toolArgs || "{}");
    } catch {
      setActionMessage({
        type: "error",
        text: "Arguments must be valid JSON.",
      });
      setToolExecuting(false);
      return;
    }

    try {
      const res = await fetch("/api/mcp/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serverId: selectedServer,
          toolName: selectedTool,
          arguments: parsedArgs,
        }),
      });
      const data = await res.json();
      setToolResult(data);
    } catch (err) {
      setToolResult({
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setToolExecuting(false);
    }
  };

  const currentServerObj = servers.find((s) => s.id === selectedServer);
  const totalTools = servers.reduce(
    (sum, s) => sum + (s.tools?.length || s.toolCount || 0),
    0
  );

  return (
    <div className="h-full overflow-y-auto bg-[#F5F8FC] text-[#0F172A]">
      <div className="max-w-4xl mx-auto px-6 py-7 space-y-8">
        {/* Clean Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#0F172A]">
              MCP Connectors
            </h2>
            <p className="text-xs text-[#52637A] mt-1">
              {servers.length} connected servers · {totalTools} tools bound to Rico
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSandbox((v) => !v)}
              className="h-9 px-3.5 rounded-lg border border-[#DCE7F3] bg-white hover:bg-[#FAFBFD] text-xs font-medium text-[#334155] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            >
              {showSandbox ? "Hide tool tester" : "Test a tool"}
            </button>

            <button
              type="button"
              onClick={fetchRegistryAndAdapters}
              title="Refresh servers"
              aria-label="Refresh servers"
              className="h-9 w-9 rounded-lg border border-[#DCE7F3] bg-white hover:bg-[#FAFBFD] text-[#52637A] hover:text-[#0F172A] flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsConnectOpen(true)}
              className="h-9 px-3.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium flex items-center gap-1.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add connector</span>
            </button>
          </div>
        </div>

        {actionMessage && (
          <div
            role="status"
            className={`px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 border ${
              actionMessage.type === "success"
                ? "bg-emerald-50/80 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Collapsible Tool Sandbox */}
        {showSandbox && (
          <div className="rounded-xl border border-[#DCE7F3] bg-white p-5 space-y-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A]">
                  Tool tester
                </h3>
                <p className="text-xs text-[#52637A] mt-0.5">
                  Invoke any discovered MCP tool directly with JSON parameters.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (selectedTool.includes("order")) {
                    setToolArgs(
                      JSON.stringify(
                        { currency: "USD", amount: 15.49, service: "Netflix" },
                        null,
                        2
                      )
                    );
                  } else {
                    setToolArgs(
                      JSON.stringify({ query: "pricing", limit: 5 }, null, 2)
                    );
                  }
                }}
                className="text-xs text-[#2563EB] hover:underline font-medium"
              >
                Insert sample JSON
              </button>
            </div>

            <form onSubmit={handleExecuteTool} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="mcp-target-server"
                    className="text-[#52637A] font-medium block mb-1.5"
                  >
                    Server
                  </label>
                  <select
                    id="mcp-target-server"
                    value={selectedServer}
                    onChange={(e) => {
                      setSelectedServer(e.target.value);
                      const found = servers.find((s) => s.id === e.target.value);
                      if (found?.tools?.length) {
                        setSelectedTool(found.tools[0].name);
                      }
                    }}
                    className="w-full h-9 px-3 rounded-lg border border-[#DCE7F3] bg-white text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  >
                    {servers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.transport})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="mcp-target-tool"
                    className="text-[#52637A] font-medium block mb-1.5"
                  >
                    Tool
                  </label>
                  <select
                    id="mcp-target-tool"
                    value={selectedTool}
                    onChange={(e) => setSelectedTool(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#DCE7F3] bg-white text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  >
                    {currentServerObj?.tools?.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="mcp-tool-args"
                  className="text-[#52637A] font-medium block mb-1.5"
                >
                  JSON arguments
                </label>
                <textarea
                  id="mcp-tool-args"
                  value={toolArgs}
                  onChange={(e) => setToolArgs(e.target.value)}
                  rows={3}
                  spellCheck={false}
                  className="w-full p-3 rounded-lg border border-[#DCE7F3] bg-[#FAFBFD] text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={toolExecuting || !selectedTool}
                  className="h-9 px-4 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white font-medium text-xs flex items-center gap-1.5 transition-colors duration-150 disabled:opacity-50"
                >
                  {toolExecuting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>Run tool</span>
                </button>
              </div>
            </form>

            {Boolean(toolResult) && (
              <pre className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2ECF6] text-[#0F172A] font-mono text-[11px] max-h-48 overflow-y-auto whitespace-pre-wrap select-text">
                {JSON.stringify(toolResult, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Connected Servers — Clean Claude-style List */}
        <section className="space-y-2.5">
          <h3 className="text-xs font-medium text-[#52637A] px-0.5">
            Connected servers
          </h3>

          <div className="rounded-xl border border-[#DCE7F3] bg-white divide-y divide-[#EDF3FA] shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
            {servers.map((server) => {
              const isExpanded = expandedServerId === server.id;
              const toolCount = server.tools?.length || server.toolCount || 0;
              return (
                <div key={server.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedServerId(isExpanded ? null : server.id)
                      }
                      className="flex items-center gap-3 min-w-0 text-left flex-1 focus-visible:outline-none"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#F2F6FC] border border-[#E2ECF6] flex items-center justify-center text-[#0F172A] font-semibold text-xs shrink-0">
                        {server.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#0F172A] truncate">
                            {server.name}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#52637A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Connected</span>
                          </span>
                        </div>
                        <div className="text-xs text-[#7B8BA1] font-mono truncate mt-0.5 tabular-nums">
                          {server.endpointUrl} · {toolCount} tools ·{" "}
                          {server.latencyMs || 24}ms
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRefreshServer(server.id)}
                        disabled={refreshingId === server.id}
                        title="Refresh tools"
                        aria-label={`Refresh ${server.name}`}
                        className="h-8 w-8 rounded-lg hover:bg-[#F2F6FC] text-[#52637A] hover:text-[#0F172A] flex items-center justify-center transition-colors duration-150"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            refreshingId === server.id ? "animate-spin" : ""
                          }`}
                        />
                      </button>

                      {server.id !== "paypal-mcp" && (
                        <button
                          type="button"
                          onClick={() => handleDeleteServer(server.id)}
                          title="Disconnect server"
                          aria-label={`Disconnect ${server.name}`}
                          className="h-8 w-8 rounded-lg hover:bg-red-50 text-[#52637A] hover:text-red-600 flex items-center justify-center transition-colors duration-150"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedServerId(isExpanded ? null : server.id)
                        }
                        aria-expanded={isExpanded}
                        aria-label="Toggle tools"
                        className="h-8 w-8 rounded-lg hover:bg-[#F2F6FC] text-[#7B8BA1] hover:text-[#0F172A] flex items-center justify-center transition-colors duration-150"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && server.tools && server.tools.length > 0 && (
                    <div className="mt-3.5 pt-3.5 border-t border-[#EDF3FA] flex flex-wrap gap-1.5 pl-12">
                      {server.tools.map((t, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedServer(server.id);
                            setSelectedTool(t.name);
                            setShowSandbox(true);
                          }}
                          title={t.description}
                          className="px-2.5 py-1 rounded-md text-xs font-mono bg-[#F5F8FC] hover:bg-[#EBF2FB] text-[#334155] border border-[#E2ECF6] transition-colors duration-150"
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Native Runtime Adapters */}
        <section className="space-y-2.5">
          <h3 className="text-xs font-medium text-[#52637A] px-0.5">
            Built-in integrations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {adapters.map((a, idx) => (
              <div
                key={a.name || idx}
                className="p-4 rounded-xl border border-[#DCE7F3] bg-white flex items-center justify-between gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#F2F6FC] border border-[#E2ECF6] flex items-center justify-center text-[#334155] shrink-0">
                    {a.name === "stripe" && <CreditCard className="w-4 h-4" />}
                    {a.name === "slack" && <MessageSquare className="w-4 h-4" />}
                    {a.name === "notion" && <FileText className="w-4 h-4" />}
                    {a.name === "github" && <GitBranch className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-xs text-[#0F172A] truncate">
                      {a.displayName || a.name}
                    </div>
                    <div className="text-[11px] text-[#7B8BA1] font-mono truncate mt-0.5">
                      {Array.isArray(a.tools) && a.tools.length > 0
                        ? a.tools.join(", ")
                        : `${a.toolsCount || 0} tools`}
                    </div>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 text-[11px] text-[#52637A] shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{a.status === "CONFIGURED_LIVE" ? "Live" : "Ready"}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Add Connector Modal */}
      {isConnectOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="connect-mcp-title"
          className="fixed inset-0 z-50 bg-slate-900/25 backdrop-blur-[2px] flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#DCE7F3] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.12)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plug className="w-4 h-4 text-[#0F172A]" />
                <h3
                  id="connect-mcp-title"
                  className="text-base font-semibold text-[#0F172A]"
                >
                  Add MCP connector
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConnectOpen(false)}
                aria-label="Close"
                className="text-[#7B8BA1] hover:text-[#0F172A] text-sm px-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConnectSubmit} className="space-y-3.5 text-xs">
              <div>
                <label
                  htmlFor="mcp-name-input"
                  className="text-[#0F172A] font-medium block mb-1.5"
                >
                  Name *
                </label>
                <input
                  id="mcp-name-input"
                  type="text"
                  required
                  placeholder="Stripe MCP"
                  value={connectForm.name}
                  onChange={(e) =>
                    setConnectForm({ ...connectForm, name: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-[#DCE7F3] bg-white text-xs text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label
                  htmlFor="mcp-url-input"
                  className="text-[#0F172A] font-medium block mb-1.5"
                >
                  Remote MCP server URL *
                </label>
                <input
                  id="mcp-url-input"
                  type="url"
                  required
                  spellCheck={false}
                  placeholder="https://mcp.example.com/sse"
                  value={connectForm.endpointUrl}
                  onChange={(e) =>
                    setConnectForm({
                      ...connectForm,
                      endpointUrl: e.target.value,
                    })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-[#DCE7F3] bg-white text-xs font-mono text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="mcp-transport-select"
                    className="text-[#0F172A] font-medium block mb-1.5"
                  >
                    Transport
                  </label>
                  <select
                    id="mcp-transport-select"
                    value={connectForm.transport}
                    onChange={(e) =>
                      setConnectForm({
                        ...connectForm,
                        transport: e.target.value,
                      })
                    }
                    className="w-full h-9 px-2.5 rounded-lg border border-[#DCE7F3] bg-white text-xs text-[#0F172A]"
                  >
                    <option value="HTTP">HTTP</option>
                    <option value="SSE">SSE</option>
                    <option value="STDIO">STDIO</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="mcp-category-select"
                    className="text-[#0F172A] font-medium block mb-1.5"
                  >
                    Category
                  </label>
                  <select
                    id="mcp-category-select"
                    value={connectForm.category}
                    onChange={(e) =>
                      setConnectForm({
                        ...connectForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full h-9 px-2.5 rounded-lg border border-[#DCE7F3] bg-white text-xs text-[#0F172A]"
                  >
                    <option value="finance">Finance</option>
                    <option value="devtools">DevTools</option>
                    <option value="productivity">Productivity</option>
                    <option value="communication">Communication</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="mcp-token-input"
                  className="text-[#0F172A] font-medium block mb-1.5"
                >
                  Auth token (optional)
                </label>
                <input
                  id="mcp-token-input"
                  type="password"
                  autoComplete="off"
                  placeholder="Bearer token"
                  value={connectForm.authToken}
                  onChange={(e) =>
                    setConnectForm({
                      ...connectForm,
                      authToken: e.target.value,
                    })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-[#DCE7F3] bg-white text-xs font-mono text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EDF3FA]">
                <button
                  type="button"
                  onClick={() => setIsConnectOpen(false)}
                  className="h-9 px-3.5 rounded-lg border border-[#DCE7F3] bg-white text-xs font-medium text-[#52637A] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="h-9 px-4 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium flex items-center gap-1.5"
                >
                  {isConnecting && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Connect</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
