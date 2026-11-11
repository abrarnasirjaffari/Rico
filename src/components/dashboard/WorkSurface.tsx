"use client";

import React, { useState } from "react";
import { Plus, CheckCircle2, AlertCircle } from "lucide-react";
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

type TabGroupKey = "rules" | "connectors" | "browser" | "automations";

const TAB_GROUPS: Record<
  TabGroupKey,
  {
    title: string;
    tabs: Array<{ id: WorkSurfaceTab; label: string }>;
  }
> = {
  rules: {
    title: "Spending Rules & Ledger",
    tabs: [
      { id: "mandates", label: "Rules" },
      { id: "transactions", label: "Transactions" },
      { id: "audit", label: "Activity" },
    ],
  },
  connectors: {
    title: "Connectors & Skills",
    tabs: [
      { id: "mcp-connect", label: "MCP Connectors" },
      { id: "skills", label: "Skills" },
    ],
  },
  browser: {
    title: "Browser & Sentinel",
    tabs: [
      { id: "viewport", label: "Live Browser" },
      { id: "sentinel", label: "Price Sentinel" },
    ],
  },
  automations: {
    title: "Automations",
    tabs: [
      { id: "savings", label: "Savings & Credits" },
      { id: "invoices", label: "Invoice OCR" },
      { id: "watchdog", label: "Contract Watchdog" },
      { id: "guardrails", label: "Guardrail Simulator" },
    ],
  },
};

function groupForTab(tab: WorkSurfaceTab): TabGroupKey {
  if (tab === "mandates" || tab === "transactions" || tab === "audit") {
    return "rules";
  }
  if (tab === "mcp-connect" || tab === "skills") {
    return "connectors";
  }
  if (tab === "viewport" || tab === "sentinel") {
    return "browser";
  }
  return "automations";
}

interface WorkSurfaceProps {
  mandates: Mandate[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
  onTriggerMandate: (id: string) => void;
  onViewReceipt: (receipt: ReceiptData) => void;
  onCreateMandateClick: () => void;
  onDeployPlanMandate?: (
    service: string,
    price: number,
    planName: string
  ) => void;
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
  const [internalTab, setInternalTab] = useState<WorkSurfaceTab>("mandates");

  const currentTab = controlledTab || internalTab;
  const setTab = (tab: WorkSurfaceTab) => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  };

  const activeGroupKey = groupForTab(currentTab);
  const activeGroup = TAB_GROUPS[activeGroupKey];

  const totalDisbursed = transactions
    .filter((t) => t.status === "COMPLETED")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const activeRulesCount = mandates.filter((m) => m.status === "ACTIVE").length;

  return (
    <div className="h-full flex flex-col bg-[#F5F8FC] text-[#0F172A] overflow-hidden">
      {/* Clean Contextual Sub-Navigation Bar (Underline Tabs, Zero Clutter) */}
      <div className="h-12 px-5 border-b border-[#E2ECF6] bg-white/80 backdrop-blur-xs flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-5 overflow-x-auto no-scrollbar h-full">
          {activeGroup.tabs.map((t) => {
            const isSelected = currentTab === t.id;
            const countSuffix =
              t.id === "mandates"
                ? ` (${mandates.length})`
                : t.id === "transactions"
                ? ` (${transactions.length})`
                : "";
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`h-full inline-flex items-center text-xs font-medium border-b-2 transition-colors duration-150 whitespace-nowrap focus-visible:outline-none ${
                  isSelected
                    ? "border-[#0F172A] text-[#0F172A]"
                    : "border-transparent text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <span>
                  {t.label}
                  {countSuffix}
                </span>
                {t.id === "viewport" && approvalRequest && (
                  <span className="ml-2 w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {activeGroupKey === "rules" && (
            <div className="hidden md:flex items-center gap-3 text-xs text-[#52637A] font-mono tabular-nums">
              <span>{activeRulesCount} active</span>
              <span className="text-[#CBD5E1]">·</span>
              <span>${totalDisbursed.toFixed(2)} captured</span>
            </div>
          )}

          {activeGroupKey === "rules" && (
            <button
              type="button"
              onClick={onCreateMandateClick}
              className="h-8 px-3 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium flex items-center gap-1.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New rule</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {currentTab === "viewport" && (
          <div className="h-full p-4">
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
          </div>
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
          <div className="h-full max-w-5xl mx-auto px-6 py-6 flex flex-col">
            <div className="flex-1 rounded-xl border border-[#DCE7F3] bg-white p-3 overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
              <AgGridMandatesTable
                mandates={mandates}
                onTriggerMandate={onTriggerMandate}
                isDarkMode={false}
              />
            </div>
          </div>
        )}

        {currentTab === "transactions" && (
          <div className="h-full max-w-5xl mx-auto px-6 py-6 flex flex-col">
            <div className="flex-1 rounded-xl border border-[#DCE7F3] bg-white p-3 overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
              <AgGridTransactionsTable
                transactions={transactions}
                onViewReceipt={onViewReceipt}
                isDarkMode={false}
              />
            </div>
          </div>
        )}

        {currentTab === "audit" && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-7 space-y-2.5">
              <div className="rounded-xl border border-[#DCE7F3] bg-white divide-y divide-[#EDF3FA] shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 flex items-start justify-between gap-4 text-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {log.severity === "danger" || log.severity === "warning" ? (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#0F172A]">
                            {log.service}
                          </span>
                          <span className="text-[11px] font-mono text-[#7B8BA1]">
                            {log.eventType}
                          </span>
                        </div>
                        <p className="text-[#52637A] mt-0.5 leading-relaxed m-0">
                          {log.details}
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#7B8BA1] font-mono tabular-nums whitespace-nowrap">
                      {log.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
