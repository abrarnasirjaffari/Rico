"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Boxes,
  Cpu,
  Plug,
  Plus,
  Search,
  AlertCircle,
  FileText,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  X,
  Code,
  Check,
  ChevronRight,
  Play,
} from "lucide-react";

interface SkillItem {
  metadata: {
    id: string;
    name: string;
    description: string;
    version?: string;
    author?: string;
    category: string;
    triggers: string[];
    toolsRequired?: string[];
    mcpServers?: string[];
    persona?: string;
    tags?: string[];
  };
  enabled: boolean;
  rulesCount: number;
  examplesCount: number;
  hasFilePath?: boolean;
}

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
  }>;
}

interface AppStorePanelProps {
  onRefreshData?: () => void;
  onDeployPlanMandate?: (service: string, price: number, planName: string) => void;
}

export function AppStorePanel({ onRefreshData }: AppStorePanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"skills" | "mcp">("skills");
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [mcpServers, setMcpServers] = useState<MCPServerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPersona, setSelectedPersona] = useState<string>("all");

  // Inspection & Dialog States
  const [inspectSkill, setInspectSkill] = useState<SkillItem | null>(null);
  const [skillFullContent, setSkillFullContent] = useState<string>("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMarkdown, setImportMarkdown] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Skill Testing State
  const [testPrompt, setTestPrompt] = useState("");
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [testingSkill, setTestingSkill] = useState(false);

  // Add Custom MCP State
  const [isAddMcpOpen, setIsAddMcpOpen] = useState(false);
  const [mcpSubmitting, setMcpSubmitting] = useState(false);
  const [mcpForm, setMcpForm] = useState({
    name: "",
    endpointUrl: "",
    transport: "HTTP",
    category: "finance",
  });

  // Fetch Skills and MCP Servers
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [skillsRes, mcpRes] = await Promise.all([
        fetch("/api/skills"),
        fetch("/api/mcp/registry"),
      ]);

      if (skillsRes.ok) {
        const skillsData = await skillsRes.json();
        setSkills(skillsData.skills || []);
      }

      if (mcpRes.ok) {
        const mcpData = await mcpRes.json();
        setMcpServers(mcpData.servers || []);
      }

      onRefreshData?.();
    } catch (err) {
      console.warn("Failed to fetch App Store data:", err);
    } finally {
      setLoading(false);
    }
  }, [onRefreshData]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Toggle Skill Active State
  const handleToggleSkill = async (id: string, currentEnabled: boolean) => {
    const nextState = !currentEnabled;
    setSkills((prev) =>
      prev.map((s) =>
        s.metadata.id === id ? { ...s, enabled: nextState } : s
      )
    );

    try {
      const res = await fetch(`/api/skills/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextState }),
      });
      if (!res.ok) {
        setSkills((prev) =>
          prev.map((s) =>
            s.metadata.id === id ? { ...s, enabled: currentEnabled } : s
          )
        );
      }
    } catch {
      setSkills((prev) =>
        prev.map((s) =>
          s.metadata.id === id ? { ...s, enabled: currentEnabled } : s
        )
      );
    }
  };

  // Inspect Skill Details
  const handleOpenInspect = async (skill: SkillItem) => {
    setInspectSkill(skill);
    setSkillFullContent("Loading full markdown definition...");
    try {
      const res = await fetch(`/api/skills/${skill.metadata.id}`);
      if (res.ok) {
        const data = await res.json();
        setSkillFullContent(data.skill?.rawContent || data.skill?.instructions || "");
      } else {
        setSkillFullContent("Failed to load skill details.");
      }
    } catch {
      setSkillFullContent("Error loading skill content.");
    }
  };

  // Test Skill Matching
  const handleTestMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPrompt.trim()) return;
    setTestingSkill(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/skills/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: testPrompt }),
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTestingSkill(false);
    }
  };

  // Import Custom Skill
  const handleImportSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importMarkdown.trim()) return;
    setImportLoading(true);
    setImportError(null);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: importMarkdown }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setImportError(data.error || "Failed to parse skill markdown");
        return;
      }
      setIsImportModalOpen(false);
      setImportMarkdown("");
      fetchAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setImportError(msg);
    } finally {
      setImportLoading(false);
    }
  };

  // Connect Custom MCP Server
  const handleAddMcp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mcpForm.name.trim() || !mcpForm.endpointUrl.trim()) return;
    setMcpSubmitting(true);
    try {
      const res = await fetch("/api/mcp/registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mcpForm),
      });
      if (res.ok) {
        setIsAddMcpOpen(false);
        setMcpForm({ name: "", endpointUrl: "", transport: "HTTP", category: "finance" });
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMcpSubmitting(false);
    }
  };

  // Filtered Skills
  const filteredSkills = useMemo(() => {
    return skills.filter((s) => {
      const matchesSearch =
        s.metadata.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.metadata.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.metadata.triggers.some((t) =>
          t.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCat =
        selectedCategory === "all" || s.metadata.category === selectedCategory;

      const matchesPersona =
        selectedPersona === "all" ||
        s.metadata.persona === "all" ||
        s.metadata.persona === selectedPersona;

      return matchesSearch && matchesCat && matchesPersona;
    });
  }, [skills, searchQuery, selectedCategory, selectedPersona]);

  return (
    <div className="h-full flex flex-col bg-[#F6FAFF] text-[#0F172A] overflow-hidden font-[Inter,system-ui,sans-serif]">
      {/* Top Banner */}
      <div className="p-4 border-b border-[#C8DDF8] bg-white flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-[#0F172A]">
              Rico Skills &amp; Extensibility Hub
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 font-semibold">
              Universal SKILL.md Engine
            </span>
          </div>
          <p className="text-xs text-[#52637A] mt-0.5">
            Hot-load domain skills and trigger custom financial reasoning rules directly from user chat prompts.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="bg-[#E2EEFD] p-0.5 rounded-lg border border-[#C8DDF8] flex items-center">
            <button
              type="button"
              onClick={() => setActiveSubTab("skills")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeSubTab === "skills"
                  ? "bg-white text-[#0F172A] shadow-2xs"
                  : "text-[#52637A] hover:text-[#0F172A]"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Skills ({skills.filter((s) => s.enabled).length}/{skills.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("mcp")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeSubTab === "mcp"
                  ? "bg-white text-[#0F172A] shadow-2xs"
                  : "text-[#52637A] hover:text-[#0F172A]"
              }`}
            >
              <Plug className="w-3.5 h-3.5" />
              <span>MCP Servers ({mcpServers.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchAllData}
            title="Refresh Registry"
            className="p-1.5 rounded-lg border border-[#C8DDF8] bg-white hover:bg-[#E2EEFD] text-[#52637A] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          {activeSubTab === "skills" ? (
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="h-8 px-3 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import SKILL.md</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddMcpOpen(true)}
              className="h-8 px-3 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect MCP</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeSubTab === "skills" ? (
          <>
            {/* Filter Bar & Search */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#C8DDF8] shadow-2xs">
              <div className="relative w-full lg:w-72">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search skills, triggers, tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#C7DCF6] bg-[#F8FAFC] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#52637A] font-medium flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3" />
                    Category:
                  </span>
                  <div className="flex items-center gap-1">
                    {["all", "startup", "student", "tax", "finance"].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2 py-0.5 text-[11px] rounded-md capitalize font-medium transition-colors ${
                          selectedCategory === cat
                            ? "bg-[#2563EB] text-white shadow-2xs"
                            : "bg-[#E2EEFD] text-[#334155] hover:bg-[#D4E6FC]"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#52637A] font-medium">Persona:</span>
                  <div className="flex items-center gap-1">
                    {["all", "founder", "student", "freelancer"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSelectedPersona(p)}
                        className={`px-2 py-0.5 text-[11px] rounded-md capitalize font-medium transition-colors ${
                          selectedPersona === p
                            ? "bg-[#0F172A] text-white"
                            : "bg-[#E2EEFD] text-[#334155] hover:bg-[#D4E6FC]"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Prompt Match Simulator */}
            <div className="p-3 bg-white rounded-xl border border-[#C8DDF8] shadow-2xs">
              <form onSubmit={handleTestMatch} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Test trigger detection (e.g. 'Can I claim PostHog startup credits or 50% Spotify discount?')"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#C7DCF6] bg-[#F8FAFC] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-blue-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={testingSkill || !testPrompt.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors shrink-0 shadow-2xs"
                >
                  <Play className={`w-3 h-3 ${testingSkill ? "animate-spin" : ""}`} />
                  <span>Test Trigger</span>
                </button>
              </form>

              {testResult && (
                <div className="mt-2.5 pt-2.5 border-t border-[#DCE9FA] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[#52637A] text-[11px]">Match Result:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-bold">
                      {String((testResult.matches as unknown[])?.length || 0)} Skill(s) Matched
                    </span>
                  </div>
                  {Array.isArray(testResult.matches) && testResult.matches.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {(testResult.matches as Array<{ name: string; score: number; matchedTriggers: string[] }>).map(
                        (m, idx) => (
                          <div
                            key={idx}
                            className="px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#C8DDF8] text-[11px] flex items-center gap-2"
                          >
                            <span className="font-semibold text-[#0F172A]">{m.name}</span>
                            <span className="text-emerald-700 font-mono text-[10px] font-bold">
                              {Math.round(m.score * 100)}% match
                            </span>
                            <span className="text-[#64748B] text-[10px]">
                              ({m.matchedTriggers.join(", ")})
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredSkills.map((skill) => (
                <div
                  key={skill.metadata.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between shadow-2xs ${
                    skill.enabled
                      ? "border-[#C8DDF8] bg-white hover:border-[#93C5FD]"
                      : "border-[#DCE9FA] bg-white/60 opacity-60"
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            skill.metadata.category === "startup"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : skill.metadata.category === "student"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : skill.metadata.category === "tax"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {skill.metadata.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-[#0F172A] line-clamp-1">
                            {skill.metadata.name}
                          </h3>
                          <span className="text-[10px] text-[#52637A] font-mono">
                            v{skill.metadata.version || "1.0.0"} • {skill.metadata.category}
                          </span>
                        </div>
                      </div>

                      {/* Enable/Disable Switch */}
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleSkill(skill.metadata.id, skill.enabled)
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          skill.enabled ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                        title={skill.enabled ? "Disable skill" : "Enable skill"}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            skill.enabled ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#52637A] mt-2.5 line-clamp-2 leading-relaxed">
                      {skill.metadata.description}
                    </p>

                    {/* Triggers Tags */}
                    <div className="mt-3">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#52637A] block mb-1">
                        Activation Triggers:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {skill.metadata.triggers.slice(0, 4).map((t, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[10px] text-[#334155] font-mono border border-slate-200"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Meta & Actions */}
                  <div className="mt-4 pt-3 border-t border-[#DCE9FA] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[10px] text-[#52637A] font-mono">
                      <span>{skill.rulesCount} Rules</span>
                      <span>•</span>
                      <span>{skill.examplesCount} Examples</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenInspect(skill)}
                      className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      <span>View SKILL.md</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredSkills.length === 0 && (
              <div className="py-12 text-center text-[#52637A] text-xs">
                No skills matched your search or category filter.
              </div>
            )}
          </>
        ) : (
          /* MCP Connectors View */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {mcpServers.map((server) => (
                <div
                  key={server.id}
                  className="p-4 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#E2EEFD] border border-[#BFD7F7] flex items-center justify-center font-bold text-xs text-blue-700">
                          <Cpu className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-bold text-[#0F172A]">
                              {server.name}
                            </h3>
                            {server.id === "paypal-mcp" && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold font-mono">
                                Primary
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#52637A] font-mono">
                            {server.transport} • {server.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-700">
                          Connected
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 p-2 rounded-lg bg-[#F8FAFC] border border-[#DCE9FA] text-[11px] font-mono text-[#52637A] truncate">
                      {server.endpointUrl}
                    </div>

                    {/* Tools Preview */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold text-[#52637A] mb-1.5">
                        <span>Discovered Tools:</span>
                        <span className="font-mono text-[#0F172A] font-bold">
                          {server.tools?.length || server.toolCount || 0} tools
                        </span>
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {server.tools?.map((tool, idx) => (
                          <div
                            key={idx}
                            className="px-2 py-1 rounded bg-[#F1F5F9] border border-[#E2E8F0] text-[11px] flex items-center justify-between"
                          >
                            <span className="font-mono text-[#1E293B]">
                              {tool.name}
                            </span>
                            {tool.isFinancial && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold">
                                Payment Gate
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#DCE9FA] flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono text-[#52637A]">
                      Ping: ~{server.latencyMs || 24}ms
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Auth: OAuth2 / Token
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inspect Skill Modal */}
      {inspectSkill && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#BFD7F7] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
            <div className="p-4 border-b border-[#D6E8FD] flex items-center justify-between bg-[#F4F9FF] shrink-0">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-[#0F172A]">
                  {inspectSkill.metadata.name} (SKILL.md)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectSkill(null)}
                className="p-1 rounded-md text-[#52637A] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-[#0F172A] bg-[#0F172A] text-white select-text whitespace-pre-wrap leading-relaxed">
              {skillFullContent}
            </div>

            <div className="p-3 border-t border-[#D6E8FD] bg-[#F4F9FF] flex items-center justify-between shrink-0 text-xs">
              <span className="text-[#52637A] text-[11px] font-mono">
                ID: {inspectSkill.metadata.id}
              </span>
              <button
                type="button"
                onClick={() => setInspectSkill(null)}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#BFD7F7] text-[#0F172A] font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import SKILL.md Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#BFD7F7] rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
            <div className="p-4 border-b border-[#D6E8FD] flex items-center justify-between bg-[#F4F9FF] shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-[#0F172A]">
                  Import Custom Financial Skill (SKILL.md)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-md text-[#52637A] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportSkill} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs">
                <p className="text-[#52637A]">
                  Paste any valid YAML frontmatter + markdown <code className="px-1 py-0.5 rounded bg-slate-100 font-mono">SKILL.md</code>.
                </p>

                <textarea
                  value={importMarkdown}
                  onChange={(e) => setImportMarkdown(e.target.value)}
                  placeholder={`---
id: custom-contract-renegotiator
name: Contract Renewal & Price Auditor
description: Renegotiates enterprise SaaS renewals before 60-day auto-renew windows.
category: finance
persona: founder
triggers:
  - contract renewal
  - vendor renewal
---`}
                  rows={12}
                  className="w-full p-3 font-mono text-xs rounded-xl border border-[#C7DCF6] bg-[#F8FAFC] text-[#0F172A] outline-none focus:border-blue-500"
                  required
                />

                {importError && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-[#D6E8FD] bg-[#F4F9FF] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#BFD7F7] text-xs text-[#52637A] bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importLoading || !importMarkdown.trim()}
                  className="px-4 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-2xs"
                >
                  {importLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Skill</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connect Custom MCP Server Modal */}
      {isAddMcpOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#BFD7F7] rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-4 border-b border-[#D6E8FD] flex items-center justify-between bg-[#F4F9FF]">
              <div className="flex items-center gap-2">
                <Plug className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-[#0F172A]">
                  Connect Custom MCP Server
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMcpOpen(false)}
                className="p-1 rounded-md text-[#52637A] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMcp} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-[#52637A] block mb-1">
                  Server Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stripe Bridge MCP"
                  value={mcpForm.name}
                  onChange={(e) => setMcpForm({ ...mcpForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#C7DCF6] bg-white text-[#0F172A] outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#52637A] block mb-1">
                  Endpoint URL (SSE / HTTP)
                </label>
                <input
                  type="url"
                  placeholder="https://mcp.yourdomain.com/sse"
                  value={mcpForm.endpointUrl}
                  onChange={(e) => setMcpForm({ ...mcpForm, endpointUrl: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#C7DCF6] bg-white text-[#0F172A] outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#D6E8FD]">
                <button
                  type="button"
                  onClick={() => setIsAddMcpOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#BFD7F7] text-xs text-[#52637A] bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mcpSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  {mcpSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Register Server</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
