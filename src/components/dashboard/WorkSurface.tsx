"use client";

import React, { useState } from "react";
import {
  CreditCard,
  ShieldCheck,
  TrendingDown,
  Plus,
  Activity,
  CheckCircle2,
  AlertCircle,
  Monitor,
  Bot,
  Sparkles,
  Boxes,
  Plug,
  FileSpreadsheet,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { Mandate, Transaction, AuditLog } from "./types";
import { ReceiptData } from "./ReceiptDialog";
import { AgGridMandatesTable } from "./AgGridMandatesTable";
import { AgGridTransactionsTable } from "./AgGridTransactionsTable";
import { LiveBrowserViewport } from "./LiveBrowserViewport";
import { PriceSentinelPanel } from "./PriceSentinelPanel";
import { PersonaSavingsPanel } from "./PersonaSavingsPanel";
import { AppStorePanel } from "./AppStorePanel";
import { McpConnectPanel } from "./McpConnectPanel";
import { InvoiceOcrPanel } from "./InvoiceOcrPanel";
import { ContractWatchdogPanel } from "./ContractWatchdogPanel";
import { GuardrailLabPanel } from "./GuardrailLabPanel";
import { ApprovalRequest } from "./ApprovalDialog";

export type WorkSurfaceTab =
  | "viewport"
  | "mcp-connect"
  | "skills"
  | "savings"
  | "sentinel"
  | "invoices"
  | "watchdog"
  | "guardrails"
  | "mandates"
  | "transactions"
  | "audit";

interface WorkSurfaceProps {
  mandates: Mandate[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
  onTriggerMandate: (id: string) => void;
  onViewReceipt: (receipt: ReceiptData) => void;
  onCreateMandateClick: () => void;
  onDeployPlanMandate?: (service: string, price: number, planName: string) => void;
  approvalRequest?: ApprovalRequest | null;
  onApproveApproval?: (fundingSource?: "PAYPAL" | "BACKUP_CARD") => void;
  onRejectApproval?: () => void;
  onRefreshData?: () => void;
  activeTab?: WorkSurfaceTab;
  onTabChange?: (tab: WorkSurfaceTab) => void;
}

export function WorkSurface({
  mandates,
  transactions,
  auditLogs,
  onTriggerMandate,
  onViewReceipt,
  onCreateMandateClick,
  onDeployPlanMandate,
  approvalRequest,
  onApproveApproval,
  onRejectApproval,
  onRefreshData,
  activeTab: controlledTab,
  onTabChange,
}: WorkSurfaceProps) {
  const [internalTab, setInternalTab] = useState<WorkSurfaceTab>("viewport");

  const currentTab = controlledTab || internalTab;
  const setTab = (tab: WorkSurfaceTab) => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  };

  const totalDisbursed = transactions
    .filter((t) => t.status === "COMPLETED")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const blockedCount = auditLogs.filter(
    (l) => l.eventType === "GUARDRAIL_BLOCKED"
  ).length;

  return (
    <div className="h-full flex flex-col bg-[#F6FAFF] text-[#0F172A] overflow-hidden font-[Inter,system-ui,sans-serif]">
      {/* Top Tab Bar & Actions in Frame 13 Sky-Blue Theme */}
      <div className="h-11 px-3 border-b border-[#C8DDF8] bg-white/90 backdrop-blur-xs flex items-center justify-between select-none shrink-0 overflow-x-auto gap-2">
        <div className="flex items-center space-x-1 shrink-0 overflow-x-auto no-scrollbar">
          {/* Live Viewport */}
          <button
            type="button"
            onClick={() => setTab("viewport")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              currentTab === "viewport"
                ? "bg-[#2563EB] text-white shadow-2xs"
                : "bg-[#E2EEFD] text-[#334155] hover:bg-[#D4E6FC] border border-[#C8DDF8]"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Live Viewport</span>
            {approvalRequest ? (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[9px] font-bold font-mono animate-pulse">
                Needs You
              </span>
            ) : (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </button>

          {/* MCP Connect */}
          <button
            type="button"
            onClick={() => setTab("mcp-connect")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              currentTab === "mcp-connect"
                ? "bg-[#2563EB] text-white shadow-2xs"
                : "bg-[#E2EEFD] text-[#334155] hover:bg-[#D4E6FC] border border-[#C8DDF8]"
            }`}
          >
            <Plug className="w-3.5 h-3.5" />
            <span>MCP Connect</span>
            <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 text-[9px] font-mono font-bold">
              SSE
            </span>
          </button>

          {/* Skills & App Store */}
          <button
            type="button"
            onClick={() => setTab("skills")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              currentTab === "skills"
                ? "bg-[#2563EB] text-white shadow-2xs"
                : "bg-[#E2EEFD] text-[#334155] hover:bg-[#D4E6FC] border border-[#C8DDF8]"
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Skills Hub</span>
          </button>

          {/* Price Sentinel */}
          <button
            type="button"
            onClick={() => setTab("sentinel")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              currentTab === "sentinel"
                ? "bg-[#2563EB] text-white shadow-2xs"
                : "bg-[#E2EEFD] text-[#334155] hover:bg-[#D4E6FC] border border-[#C8DDF8]"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Price Sentinel</span>
            <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-700 text-[9px] font-mono font-bold">
              24/7
            </span>
          </button>

          {/* Savings & Credits */}
          <button
            type="button"
            onClick={() => setTab("savings")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              currentTab === "savings"
                ? "bg-[#2563EB] text-white shadow-2xs"
                : "bg-[#E2EEFD] text-[#334155] hover:bg-[#D4E6FC] border border-[#C8DDF8]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Savings</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold">
              $50k+
            </span>
          </button>

          {/* Invoice OCR */}
          <button
            type="button"
            onClick={() => setTab("invoices")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              currentTab === "invoices"
                ? "bg-[#2563EB] text-white shadow-2xs"
                : "bg-[#E2EEFD] text-[#334155] hover:bg-[#D4E6FC] border border-[#C8DDF8]"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Invoice OCR</span>
          </button>

          {/* Contract Watchdog */}
          <button
            type="button"
            onClick={() => setTab("watchdog")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              currentTab === "watchdog"
                ? "bg-[#2563EB] text-white shadow-2xs"
                : "bg-[#E2EEFD] text-[#334155] hover:bg-[#D4E6FC] border border-[#C8DDF8]"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Watchdog</span>
          </button>

          {/* Guardrail Lab */}
          <button
            type="button"
            onClick={() => setTab("guardrails")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              currentTab === "guardrails"
                ? "bg-[#2563EB] text-white shadow-2xs"
                : "bg-[#E2EEFD] text-[#334155] hover:bg-[#D4E6FC] border border-[#C8DDF8]"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Guardrail Lab</span>
          </button>

          {/* Spending Rules */}
          <button
            type="button"
            onClick={() => setTab("mandates")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              currentTab === "mandates"
                ? "bg-[#2563EB] text-white shadow-2xs"
                : "bg-[#E2EEFD] text-[#334155] hover:bg-[#D4E6FC] border border-[#C8DDF8]"
            }`}
          >
            <span>Rules ({mandates.length})</span>
          </button>

          {/* Transactions */}
          <button
            type="button"
            onClick={() => setTab("transactions")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              currentTab === "transactions"
                ? "bg-[#2563EB] text-white shadow-2xs"
                : "bg-[#E2EEFD] text-[#334155] hover:bg-[#D4E6FC] border border-[#C8DDF8]"
            }`}
          >
            <span>Ledger ({transactions.length})</span>
          </button>

          {/* Activity Log */}
          <button
            type="button"
            onClick={() => setTab("audit")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              currentTab === "audit"
                ? "bg-[#2563EB] text-white shadow-2xs"
                : "bg-[#E2EEFD] text-[#334155] hover:bg-[#D4E6FC] border border-[#C8DDF8]"
            }`}
          >
            <span>Activity</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onCreateMandateClick}
            className="h-7 px-2.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Rule</span>
          </button>
        </div>
      </div>

      {/* Frame 13 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 p-3 border-b border-[#C8DDF8] bg-white/60 shrink-0 text-xs">
        <div className="p-2.5 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs">
          <div className="flex items-center justify-between text-[#52637A] text-[11px] mb-0.5">
            <span>Spending Rules</span>
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-[#0F172A]">
            {mandates.filter((m) => m.status === "ACTIVE").length} Active
          </div>
          <span className="text-[10px] text-emerald-700 font-mono font-medium">100% Autonomous</span>
        </div>

        <div className="p-2.5 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs">
          <div className="flex items-center justify-between text-[#52637A] text-[11px] mb-0.5">
            <span>Total Captured</span>
            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700">
            ${totalDisbursed.toFixed(2)}
          </div>
          <span className="text-[10px] text-[#52637A]">PayPal MCP Sandbox</span>
        </div>

        <div className="p-2.5 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs">
          <div className="flex items-center justify-between text-[#52637A] text-[11px] mb-0.5">
            <span>Safety Intercepts</span>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-amber-700">
            {blockedCount} Held
          </div>
          <span className="text-[10px] text-[#52637A]">Ceilings enforced</span>
        </div>

        <div className="p-2.5 rounded-xl border border-[#C8DDF8] bg-white shadow-2xs">
          <div className="flex items-center justify-between text-[#52637A] text-[11px] mb-0.5">
            <span>Reasoning Speed</span>
            <Activity className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-purple-700">
            1.18s avg
          </div>
          <span className="text-[10px] text-[#52637A]">Gemini 3.8 Flash</span>
        </div>
      </div>

      {/* Main Tab Content View */}
      <div className="flex-1 overflow-hidden p-3 bg-[#F6FAFF]">
        {currentTab === "viewport" && (
          <LiveBrowserViewport
            onPlanSelected={(service, price, planName) => {
              if (onDeployPlanMandate) {
                onDeployPlanMandate(service, price, planName);
              }
            }}
            approvalRequest={approvalRequest}
            onApproveApproval={onApproveApproval}
            onRejectApproval={onRejectApproval}
          />
        )}

        {currentTab === "mcp-connect" && <McpConnectPanel />}

        {currentTab === "skills" && (
          <AppStorePanel
            onRefreshData={onRefreshData}
            onDeployPlanMandate={onDeployPlanMandate}
          />
        )}

        {currentTab === "sentinel" && (
          <PriceSentinelPanel
            mandates={mandates}
            onRefreshData={onRefreshData}
          />
        )}

        {currentTab === "savings" && (
          <PersonaSavingsPanel
            onDeployPlanMandate={onDeployPlanMandate}
            onRefreshData={onRefreshData}
          />
        )}

        {currentTab === "invoices" && <InvoiceOcrPanel />}

        {currentTab === "watchdog" && <ContractWatchdogPanel />}

        {currentTab === "guardrails" && <GuardrailLabPanel />}

        {currentTab === "mandates" && (
          <div className="h-full flex flex-col space-y-2">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-xs font-bold text-[#0F172A]">
                  Active Recurring Spending Rules (AG Grid)
                </h3>
                <p className="text-[11px] text-[#52637A]">
                  Autonomous financial limits verified against live merchant checkout viewports.
                </p>
              </div>
            </div>
            <div className="flex-1 rounded-xl border border-[#C8DDF8] bg-white overflow-hidden shadow-2xs">
              <AgGridMandatesTable
                mandates={mandates}
                onTriggerMandate={onTriggerMandate}
                isDarkMode={false}
              />
            </div>
          </div>
        )}

        {currentTab === "transactions" && (
          <div className="h-full flex flex-col space-y-2">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-xs font-bold text-[#0F172A]">
                  Captured Transactions Ledger (PayPal Sandbox MCP)
                </h3>
                <p className="text-[11px] text-[#52637A]">
                  Cryptographic authorization proofs and receipt records stored with zero telemetry leakage.
                </p>
              </div>
            </div>
            <div className="flex-1 rounded-xl border border-[#C8DDF8] bg-white overflow-hidden shadow-2xs">
              <AgGridTransactionsTable
                transactions={transactions}
                onViewReceipt={onViewReceipt}
                isDarkMode={false}
              />
            </div>
          </div>
        )}

        {currentTab === "audit" && (
          <div className="h-full overflow-y-auto space-y-2 pr-1">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl border border-[#C8DDF8] bg-white flex items-start justify-between gap-3 text-xs shadow-2xs"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg border border-[#DCE9FA] bg-[#F8FAFC] flex items-center justify-center shrink-0 mt-0.5">
                    {log.severity === "danger" || log.severity === "warning" ? (
                      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#0F172A]">{log.service}</span>
                      <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-slate-100 text-slate-700 border border-slate-200">
                        {log.eventType}
                      </span>
                    </div>
                    <p className="text-[#334155] mt-1 leading-relaxed text-[11px]">
                      {log.details}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-[#64748B] font-mono whitespace-nowrap">
                  {log.timestamp}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
