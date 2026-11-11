"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Search,
  AlertCircle,
  RefreshCw,
  X,
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

interface AppStorePanelProps {
  onRefreshData?: () => void;
  onDeployPlanMandate?: (service: string, price: number, planName: string) => void;
}

export function AppStorePanel({ onRefreshData }: AppStorePanelProps) {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [inspectSkill, setInspectSkill] = useState<SkillItem | null>(null);
  const [skillFullContent, setSkillFullContent] = useState<string>("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMarkdown, setImportMarkdown] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const [testPrompt, setTestPrompt] = useState("");
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [testingSkill, setTestingSkill] = useState(false);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      const skillsRes = await fetch("/api/skills");
      if (skillsRes.ok) {
        const skillsData = await skillsRes.json();
        setSkills(skillsData.skills || []);
      }
      onRefreshData?.();
    } catch (err) {
      console.warn("Failed to fetch skills:", err);
    } finally {
      setLoading(false);
    }
  }, [onRefreshData]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

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

  const handleOpenInspect = async (skill: SkillItem) => {
    setInspectSkill(skill);
    setSkillFullContent("Loading skill definition...");
    try {
      const res = await fetch(`/api/skills/${skill.metadata.id}`);
      if (res.ok) {
        const data = await res.json();
        setSkillFullContent(
          data.skill?.rawContent || data.skill?.instructions || ""
        );
      } else {
        setSkillFullContent("Failed to load skill details.");
      }
    } catch {
      setSkillFullContent("Error loading skill content.");
    }
  };

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
      fetchSkills();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setImportError(msg);
    } finally {
      setImportLoading(false);
    }
  };

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

      return matchesSearch && matchesCat;
    });
  }, [skills, searchQuery, selectedCategory]);

  return (
    <div className="h-full overflow-y-auto bg-[#F5F8FC] text-[#0F172A]">
      <div className="max-w-4xl mx-auto px-6 py-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#0F172A]">
              Skills
            </h2>
            <p className="text-xs text-[#52637A] mt-1 tabular-nums">
              {skills.filter((s) => s.enabled).length} of {skills.length} modular{" "}
              <code className="font-mono text-[11px]">SKILL.md</code> instructions enabled
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchSkills}
              title="Refresh skills"
              aria-label="Refresh skills"
              className="h-9 w-9 rounded-lg border border-[#DCE7F3] bg-white hover:bg-[#FAFBFD] text-[#52637A] hover:text-[#0F172A] flex items-center justify-center transition-colors duration-150"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="h-9 px-3.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium flex items-center gap-1.5 transition-colors duration-150"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import SKILL.md</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="search"
              placeholder="Filter skills or triggers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 text-xs rounded-lg border border-[#DCE7F3] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] outline-none"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#EDF3FA] border border-[#DCE7F3] p-1 rounded-lg self-start">
            {["all", "startup", "student", "tax", "finance"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`h-7 px-2.5 text-xs rounded-md capitalize font-medium transition-colors duration-150 ${
                  selectedCategory === cat
                    ? "bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                    : "text-[#52637A] hover:text-[#0F172A]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Trigger Matcher */}
        <form
          onSubmit={handleTestMatch}
          className="rounded-xl border border-[#DCE7F3] bg-white p-3.5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Test prompt matching (e.g. 'Claim PostHog startup credits')"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              className="flex-1 h-9 px-3 text-xs rounded-lg border border-[#E2ECF6] bg-[#FAFBFD] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] outline-none"
            />
            <button
              type="submit"
              disabled={testingSkill || !testPrompt.trim()}
              className="h-9 px-3.5 rounded-lg border border-[#DCE7F3] bg-white hover:bg-[#F5F8FC] text-[#0F172A] text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 transition-colors duration-150 shrink-0"
            >
              <Play className="w-3 h-3" />
              <span>Test match</span>
            </button>
          </div>

          {testResult && (
            <div className="pt-2.5 border-t border-[#EDF3FA] flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#7B8BA1]">Matched:</span>
              {Array.isArray(testResult.matches) && testResult.matches.length > 0 ? (
                (
                  testResult.matches as Array<{
                    name: string;
                    score: number;
                  }>
                ).map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-[#F2F6FC] border border-[#DCE7F3] text-[#0F172A] font-medium tabular-nums"
                  >
                    {m.name} ({Math.round(m.score * 100)}%)
                  </span>
                ))
              ) : (
                <span className="text-[#52637A]">No triggers matched.</span>
              )}
            </div>
          )}
        </form>

        {/* Skills List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredSkills.map((skill) => (
            <div
              key={skill.metadata.id}
              className={`p-4 rounded-xl border bg-white flex flex-col justify-between transition-colors duration-150 ${
                skill.enabled
                  ? "border-[#DCE7F3] hover:border-[#BFD3EA]"
                  : "border-[#E8EFF7] opacity-65"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#0F172A]">
                      {skill.metadata.name}
                    </h3>
                    <span className="text-[11px] text-[#7B8BA1] font-mono">
                      v{skill.metadata.version || "1.0.0"} · {skill.metadata.category}
                    </span>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={skill.enabled}
                    aria-label={`Toggle ${skill.metadata.name}`}
                    onClick={() =>
                      handleToggleSkill(skill.metadata.id, skill.enabled)
                    }
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 ${
                      skill.enabled ? "bg-[#0F172A]" : "bg-[#CBD5E1]"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-150 ${
                        skill.enabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-[#52637A] mt-2.5 line-clamp-2 leading-relaxed">
                  {skill.metadata.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {skill.metadata.triggers.slice(0, 3).map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-[#F5F8FC] text-[11px] text-[#52637A] font-mono border border-[#E6EEF8]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EDF3FA] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#7B8BA1] tabular-nums">
                  {skill.rulesCount} rules · {skill.examplesCount} examples
                </span>

                <button
                  type="button"
                  onClick={() => handleOpenInspect(skill)}
                  className="text-xs font-medium text-[#0F172A] hover:text-[#2563EB] flex items-center gap-0.5 transition-colors duration-150"
                >
                  <span>Inspect</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredSkills.length === 0 && (
          <div className="py-12 text-center text-[#52637A] text-xs">
            No skills matched your filter.
          </div>
        )}
      </div>

      {/* Inspect Skill Modal */}
      {inspectSkill && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/25 backdrop-blur-[2px] flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#DCE7F3] rounded-2xl w-full max-w-2xl max-h-[82vh] flex flex-col shadow-[0_16px_48px_rgba(15,23,42,0.12)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#EDF3FA] flex items-center justify-between shrink-0">
              <h3 className="text-sm font-semibold text-[#0F172A]">
                {inspectSkill.metadata.name}
              </h3>
              <button
                type="button"
                onClick={() => setInspectSkill(null)}
                aria-label="Close"
                className="p-1 rounded-md text-[#7B8BA1] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 font-mono text-xs text-[#0F172A] bg-[#FAFBFD] select-text whitespace-pre-wrap leading-relaxed">
              {skillFullContent}
            </div>
          </div>
        </div>
      )}

      {/* Import SKILL.md Modal */}
      {isImportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/25 backdrop-blur-[2px] flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#DCE7F3] rounded-2xl w-full max-w-xl max-h-[82vh] flex flex-col shadow-[0_16px_48px_rgba(15,23,42,0.12)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#EDF3FA] flex items-center justify-between shrink-0">
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Import SKILL.md
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                aria-label="Close"
                className="p-1 rounded-md text-[#7B8BA1] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleImportSkill}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="p-5 flex-1 overflow-y-auto space-y-3 text-xs">
                <label
                  htmlFor="skill-markdown-input"
                  className="text-[#52637A] block"
                >
                  Paste YAML frontmatter and markdown instructions:
                </label>

                <textarea
                  id="skill-markdown-input"
                  value={importMarkdown}
                  onChange={(e) => setImportMarkdown(e.target.value)}
                  placeholder={`---\nid: renewal-auditor\nname: Contract Renewal Auditor\ndescription: Flags upcoming renewals before notice deadlines.\ncategory: finance\ntriggers:\n  - contract renewal\n---`}
                  rows={11}
                  spellCheck={false}
                  className="w-full p-3 font-mono text-xs rounded-xl border border-[#DCE7F3] bg-[#FAFBFD] text-[#0F172A] outline-none focus:border-[#2563EB]"
                  required
                />

                {importError && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}
              </div>

              <div className="px-5 py-3.5 border-t border-[#EDF3FA] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="h-9 px-3.5 rounded-lg border border-[#DCE7F3] text-xs font-medium text-[#52637A] bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importLoading || !importMarkdown.trim()}
                  className="h-9 px-4 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
                >
                  {importLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save skill</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
