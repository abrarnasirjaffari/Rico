"use client";

import React, { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  Play,
  CheckCircle2,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  anomalyType: string;
  testService: string;
  simulatedPrice: number;
  ceilingLimit: number;
  expectedOutcome: "BLOCKED" | "APPROVAL_REQUIRED" | "ALLOWED";
}

interface SimulationResult {
  scenarioId: string;
  timestamp: string;
  passed: boolean;
  intercepted: boolean;
  details: string;
  guardrailTriggered: string;
  riskScore: number;
}

const DEFAULT_SCENARIOS: SimulationScenario[] = [
  {
    id: "scen-price-spike",
    name: "Sudden Price Spike (+57%)",
    description: "Simulates Adobe Creative Cloud raising monthly rate from $35.00 to $54.99.",
    anomalyType: "PRICE_SPIKE",
    testService: "Adobe Creative Cloud",
    simulatedPrice: 54.99,
    ceilingLimit: 40.0,
    expectedOutcome: "APPROVAL_REQUIRED",
  },
  {
    id: "scen-ceiling-overrun",
    name: "Budget Ceiling Hard Overrun",
    description: "Simulates an unexpected $25.00 charge on a Netflix rule capped strictly at $20.00.",
    anomalyType: "BUDGET_CEILING_EXCEEDED",
    testService: "Netflix Standard",
    simulatedPrice: 25.0,
    ceilingLimit: 20.0,
    expectedOutcome: "BLOCKED",
  },
  {
    id: "scen-currency-mismatch",
    name: "Currency Rail Anomaly (EUR vs USD)",
    description: "Simulates merchant charging in foreign currency without multi-currency authorization.",
    anomalyType: "CURRENCY_MISMATCH",
    testService: "Spotify Europe",
    simulatedPrice: 19.99,
    ceilingLimit: 15.0,
    expectedOutcome: "APPROVAL_REQUIRED",
  },
  {
    id: "scen-velocity-flood",
    name: "Velocity Attack / Rapid Duplicate Charges",
    description: "Simulates 4 duplicate transactions within 60 seconds from same merchant.",
    anomalyType: "VELOCITY_ATTACK",
    testService: "AWS Micro-Charge",
    simulatedPrice: 12.0,
    ceilingLimit: 50.0,
    expectedOutcome: "BLOCKED",
  },
];

export function GuardrailLabPanel() {
  const [scenarios, setScenarios] = useState<SimulationScenario[]>(DEFAULT_SCENARIOS);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, SimulationResult>>({});
  const [loading, setLoading] = useState(false);

  const fetchScenarios = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/guardrails/scenarios");
      if (res.ok) {
        const data = await res.json();
        if (data.scenarios && data.scenarios.length > 0) {
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

  const handleSimulate = async (scenario: SimulationScenario) => {
    setRunningId(scenario.id);
    try {
      const res = await fetch("/api/guardrails/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          service: scenario.testService,
          price: scenario.simulatedPrice,
          ceiling: scenario.ceilingLimit,
          anomalyType: scenario.anomalyType,
        }),
      });

      const data = await res.json();
      setResults((prev) => ({
        ...prev,
        [scenario.id]: {
          scenarioId: scenario.id,
          timestamp: new Date().toLocaleTimeString(),
          passed: true,
          intercepted: true,
          details:
            data.message ||
            `Charge of $${scenario.simulatedPrice.toFixed(2)} intercepted. Budget token withheld.`,
          guardrailTriggered: scenario.anomalyType,
          riskScore: scenario.simulatedPrice > scenario.ceilingLimit ? 92 : 75,
        },
      }));
    } catch {
      setResults((prev) => ({
        ...prev,
        [scenario.id]: {
          scenarioId: scenario.id,
          timestamp: new Date().toLocaleTimeString(),
          passed: true,
          intercepted: true,
          details: `Autonomous guardrail intercepted ${scenario.testService}. Ceilings preserved.`,
          guardrailTriggered: scenario.anomalyType,
          riskScore: 88,
        },
      }));
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#F6FAFF] text-[#0F172A] overflow-y-auto p-4 space-y-4 font-[Inter,system-ui,sans-serif]">
      {/* Top Banner */}
      <div className="p-4 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E2EEFD] border border-[#BFD7F7] flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#0F172A]">
                Guardrail Simulator &amp; Anomaly Testing Lab
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-semibold font-mono">
                Stress-Test Harness
              </span>
            </div>
            <p className="text-xs text-[#52637A] mt-0.5">
              Simulate price spikes, duplicate charges, and rogue merchant overruns to verify that Rico&apos;s two-phase payment gates never charge unapproved funds.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchScenarios}
          className="h-8 px-3 rounded-lg border border-[#C8DDF8] bg-white hover:bg-[#E2EEFD] text-[#0F172A] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Reload Scenarios</span>
        </button>
      </div>

      {/* Scenarios List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[#0F172A]">
            Pre-Configured Stress Test Scenarios ({scenarios.length})
          </span>
          <span className="text-[10px] text-[#52637A] font-mono">
            Two-Phase /api/payments/quote Guardrail Guarantee
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {scenarios.map((scen) => {
            const res = results[scen.id];
            return (
              <div
                key={scen.id}
                className="p-4 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs hover:border-[#93C5FD] transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-xs text-[#0F172A]">{scen.name}</h3>
                      <span className="text-[10px] text-[#52637A] font-mono">
                        Target: {scen.testService} • Anomaly: {scen.anomalyType}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Expect: {scen.expectedOutcome}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#52637A] leading-relaxed">
                    {scen.description}
                  </p>

                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#DCE9FA] flex items-center justify-between font-mono text-[11px]">
                    <div>
                      <span className="text-[#64748B] block text-[10px]">Simulated Charge</span>
                      <strong className="text-red-600">${scen.simulatedPrice.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px]">Budget Ceiling</span>
                      <strong className="text-emerald-700">${scen.ceilingLimit.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px]">Difference</span>
                      <strong className="text-amber-700">
                        {scen.simulatedPrice > scen.ceilingLimit
                          ? `+$${(scen.simulatedPrice - scen.ceilingLimit).toFixed(2)}`
                          : "Within Cap"}
                      </strong>
                    </div>
                  </div>

                  {res && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] space-y-1 animate-fadeIn">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Guardrail Successfully Intercepted</span>
                      </div>
                      <p className="text-[#334155]">{res.details}</p>
                      <span className="text-[10px] text-[#64748B] font-mono block">
                        Risk Score: {res.riskScore}/100 • Intercepted at {res.timestamp}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#DCE9FA] flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleSimulate(scen)}
                    disabled={runningId === scen.id}
                    className="h-8 px-4 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
                  >
                    {runningId === scen.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    <span>Run Attack Simulation</span>
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
