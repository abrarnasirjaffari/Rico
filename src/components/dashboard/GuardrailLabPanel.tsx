"use client";

import React, { useState, useEffect } from "react";
import { Play, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";

interface ScenarioItem {
  id: string;
  name: string;
  description: string;
  expectedStatus?: string;
  adversarialInput?: {
    serviceName?: string;
    attemptedAmount?: number;
    budgetCeiling?: number;
  };
}

interface ScenarioRunResult {
  actualStatus: string;
  ruleTriggered: string;
  reason: string;
  latencyMs: number;
}

export function GuardrailLabPanel() {
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [results, setResults] = useState<Record<string, ScenarioRunResult>>({});
  const [loading, setLoading] = useState(true);

  const fetchScenarios = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/guardrails/scenarios");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.scenarios)) {
          setScenarios(data.scenarios);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleSimulate = async (scenario: ScenarioItem) => {
    setRunningId(scenario.id);
    try {
      const res = await fetch("/api/guardrails/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: scenario.id }),
      });

      const data = await res.json();
      if (res.ok && data.result) {
        setResults((prev) => ({
          ...prev,
          [scenario.id]: {
            actualStatus: data.result.actualStatus || "BLOCKED",
            ruleTriggered: data.result.ruleTriggered || "GUARDRAIL",
            reason: data.result.reason || "Intercepted before payment execution.",
            latencyMs: data.result.latencyMs ?? 1,
          },
        }));
      }
    } catch {
      // ignore
    } finally {
      setRunningId(null);
    }
  };

  const handleRunAll = async () => {
    setRunningAll(true);
    try {
      const res = await fetch("/api/guardrails/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runAll: true }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.report?.results)) {
        const next: Record<string, ScenarioRunResult> = {};
        for (const r of data.report.results) {
          if (r.scenarioId) {
            next[r.scenarioId] = {
              actualStatus: r.actualStatus || "BLOCKED",
              ruleTriggered: r.ruleTriggered || "GUARDRAIL",
              reason: r.reason || "Verified",
              latencyMs: r.latencyMs ?? 1,
            };
          }
        }
        setResults(next);
      }
    } catch {
      // ignore
    } finally {
      setRunningAll(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F5F8FC] text-[#0F172A]">
      <div className="max-w-4xl mx-auto px-6 py-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#0F172A]">
              Guardrail Simulator
            </h2>
            <p className="text-xs text-[#52637A] mt-1 tabular-nums">
              {scenarios.length} adversarial scenarios testing caps, spikes, and replay locks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchScenarios}
              title="Reload scenarios"
              aria-label="Reload scenarios"
              className="h-9 w-9 rounded-lg border border-[#DCE7F3] bg-white hover:bg-[#FAFBFD] text-[#52637A] hover:text-[#0F172A] flex items-center justify-center transition-colors duration-150"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={handleRunAll}
              disabled={runningAll || scenarios.length === 0}
              className="h-9 px-3.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium flex items-center gap-1.5 transition-colors duration-150 disabled:opacity-50"
            >
              {runningAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>Run all scenarios</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {scenarios.map((scen) => {
            const res = results[scen.id];
            const attempted = Number(scen.adversarialInput?.attemptedAmount ?? 0);
            const ceiling = Number(scen.adversarialInput?.budgetCeiling ?? 0);
            return (
              <div
                key={scen.id}
                className="p-5 rounded-xl border border-[#DCE7F3] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-[#0F172A]">
                      {scen.name}
                    </h3>
                    {scen.expectedStatus && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] bg-[#F2F6FC] text-[#52637A] font-mono shrink-0">
                        {scen.expectedStatus}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#52637A] leading-relaxed m-0">
                    {scen.description}
                  </p>

                  {ceiling > 0 && (
                    <div className="p-3 rounded-lg bg-[#FAFBFD] border border-[#E8EFF7] flex items-center justify-between font-mono text-xs tabular-nums">
                      <div>
                        <span className="text-[#7B8BA1] block text-[11px] font-sans">
                          Attempted
                        </span>
                        <span className="font-semibold text-[#0F172A]">
                          ${attempted.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#7B8BA1] block text-[11px] font-sans">
                          Rule cap
                        </span>
                        <span className="font-medium text-[#52637A]">
                          ${ceiling.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {res && (
                    <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-medium text-emerald-800">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{res.actualStatus}</span>
                        </span>
                        <span className="font-mono text-[11px] tabular-nums text-emerald-700">
                          {res.latencyMs}ms
                        </span>
                      </div>
                      <p className="text-[#334155] m-0 leading-relaxed">
                        {res.reason}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#EDF3FA] flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSimulate(scen)}
                    disabled={runningId === scen.id}
                    className="h-8 px-3.5 rounded-lg border border-[#DCE7F3] bg-white hover:bg-[#FAFBFD] text-[#0F172A] font-medium text-xs flex items-center gap-1.5 transition-colors duration-150 disabled:opacity-50"
                  >
                    {runningId === scen.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    <span>Run</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
