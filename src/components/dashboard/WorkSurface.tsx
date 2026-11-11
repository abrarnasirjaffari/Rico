"use client";

import React, { useState } from "react";
import { Plus, CheckCircle2, AlertCircle, Globe } from "lucide-react";
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

type TopSectionId = "browser" | "rules" | "ledger" | "connectors" | "automations";

const TOP_SECTIONS: Array<{
  id: TopSectionId;
  label: string;
  defaultTab: WorkSurfaceTab;
  subTabs?: Array<{ id: WorkSurfaceTab; label: string }>;
}> = [
  { id: "browser", label: "Browser", defaultTab: "viewport" },
  { id: "rules", label: "Rules", defaultTab: "mandates" },
  {
    id: "ledger",
    label: "Ledger",
    defaultTab: "transactions",
    subTabs: [
      { id: "transactions", label: "Transactions" },
      { id: "audit", label: "Activity log" },
    ],
  },
  {
    id: "connectors",
    label: "Connectors",
    defaultTab: "mcp-connect",
    subTabs: [
      { id: "mcp-connect", label: "MCP Servers" },
      { id: "skills", label: "Skills" },
    ],
  },
  {
    id: "automations",
    label: "Automations",
    defaultTab: "savings",
    subTabs: [
      { id: "savings", label: "Savings & credits" },
      { id: "sentinel", label: "Price sentinel" },
      { id: "invoices", label: "Invoice OCR" },
      { id: "watchdog", label: "Watchdog" },
      { id: "guardrails", label: "Guardrail lab" },
    ],
  },
];

function sectionForTab(tab: WorkSurfaceTab): TopSectionId {
  if (tab === "viewport") return "browser";
  if (tab === "mandates") return "rules";
  if (tab === "transactions" || tab === "audit") return "ledger";
  if (tab === "mcp-connect" || tab === "skills") return "connectors";
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
  isBrowserStreaming?: boolean;
  externalBrowserUrl?: string | null;
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
  isBrowserStreaming = false,
  externalBrowserUrl,
}: WorkSurfaceProps) {
  const [internalTab, setInternalTab] = useState<WorkSurfaceTab>("viewport");

  const currentTab = controlledTab || internalTab;
  const setTab = (tab: WorkSurfaceTab) => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  };

  const activeSectionId = sectionForTab(currentTab);
  const activeSection = TOP_SECTIONS.find((s) => s.id === activeSectionId)!;

  const totalDisbursed = transactions
    .filter((t) => t.status === "COMPLETED")
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="h-full flex flex-col bg-[#FCFCFC] text-[#1E1B1B] overflow-hidden">
      {/* OpenCode 44px Recessed Review/Browser Tab Strip (5 clean top-level tabs, zero clipping) */}
      <div className="h-11 bg-[#F8F7F7] border-b border-[#E6E4E3] flex items-center justify-between pr-3 shrink-0">
        <div className="flex items-center h-full overflow-x-auto no-scrollbar">
          {TOP_SECTIONS.map((sec) => {
            const isSelected = activeSectionId === sec.id;
            const badgeCount =
              sec.id === "rules"
                ? mandates.length
                : sec.id === "ledger"
                ? transactions.length
                : null;

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setTab(sec.defaultTab)}
                className={`h-full px-3.5 inline-flex items-center gap-1.5 text-[13px] font-medium border-r border-[#E6E4E3] transition-colors duration-100 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#034CFF]/40 ${
                  isSelected
                    ? "bg-[#FCFCFC] text-[#1E1B1B] relative after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-[1px] after:h-[2px] after:bg-[#FCFCFC]"
                    : "bg-[#F8F7F7] text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF]"
                }`}
              >
                {sec.id === "browser" && (
                  <span className="relative flex items-center justify-center">
                    <Globe
                      className={`w-3.5 h-3.5 ${
                        isBrowserStreaming
                          ? "text-[#034CFF]"
                          : isSelected
                          ? "text-[#1E1B1B]"
                          : "text-[#5C5858]"
                      }`}
                    />
                    {isBrowserStreaming && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#034CFF] animate-ping" />
                    )}
                  </span>
                )}

                <span>{sec.label}</span>

                {badgeCount !== null && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#EFECEB] text-[11px] font-mono tabular-nums text-[#5C5858]">
                    {badgeCount}
                  </span>
                )}

                {sec.id === "browser" && approvalRequest && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            );
          })}
        </div>

        {(activeSectionId === "rules" || activeSectionId === "ledger") && (
          <div className="flex items-center gap-2.5 pl-2 shrink-0">
            <span className="hidden xl:inline text-[11.5px] text-[#5C5858] font-mono tabular-nums">
              ${totalDisbursed.toFixed(2)} captured
            </span>
            <button
              type="button"
              onClick={onCreateMandateClick}
              className="h-7 px-2.5 rounded-md bg-[#1E1B1B] hover:bg-[#332F2F] text-white text-xs font-medium flex items-center gap-1 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New rule</span>
            </button>
          </div>
        )}
      </div>

      {/* Contextual Sub-Pill Bar when in Ledger / Connectors / Automations */}
      {activeSection.subTabs && (
        <div className="h-9 px-3.5 bg-[#FCFCFC] border-b border-[#E6E4E3] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {activeSection.subTabs.map((sub) => {
            const isSubSelected = currentTab === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setTab(sub.id)}
                className={`h-6 px-2.5 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
                  isSubSelected
                    ? "bg-[#1E1B1B] text-white"
                    : "text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F1EFEF]"
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Active Pane Content (Keep LiveBrowserViewport mounted so SSE stream never drops) */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <div
          className={
            currentTab === "viewport" ? "h-full w-full" : "hidden"
          }
        >
          <LiveBrowserViewport
            onPlanSelected={(service, price, planName) => {
              onDeployPlanMandate?.(service, price, planName);
            }}
            approvalRequest={approvalRequest}
            onApproveApproval={onApproveApproval}
            onRejectApproval={onRejectApproval}
            externalFocusUrl={externalBrowserUrl}
          />
        </div>

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
          <div className="h-full max-w-5xl mx-auto px-5 py-5 flex flex-col">
            <div className="flex-1 rounded-xl border border-[#E6E4E3] bg-white p-3 overflow-hidden">
              <AgGridMandatesTable
                mandates={mandates}
                onTriggerMandate={onTriggerMandate}
                isDarkMode={false}
              />
            </div>
          </div>
        )}

        {currentTab === "transactions" && (
          <div className="h-full max-w-5xl mx-auto px-5 py-5 flex flex-col">
            <div className="flex-1 rounded-xl border border-[#E6E4E3] bg-white p-3 overflow-hidden">
              <AgGridTransactionsTable
                transactions={transactions}
                onViewReceipt={onViewReceipt}
                isDarkMode={false}
              />
            </div>
          </div>
        )}

        {currentTab === "audit" && (
          <div className="h-full overflow-y-auto oc-scroller">
            <div className="max-w-4xl mx-auto px-5 py-6 space-y-2.5">
              {auditLogs.length === 0 ? (
                <div className="rounded-xl border border-[#E6E4E3] bg-white p-8 text-center text-xs text-[#5C5858]">
                  No activity recorded in this session yet.
                </div>
              ) : (
                <div className="rounded-xl border border-[#E6E4E3] bg-white divide-y divide-[#F1EFEF]">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 flex items-start justify-between gap-4 text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {log.severity === "danger" || log.severity === "warning" ? (
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#1E1B1B]">
                              {log.service}
                            </span>
                            <span className="text-[11px] font-mono text-[#8A8585]">
                              {log.eventType}
                            </span>
                          </div>
                          <p className="text-[#5C5858] mt-0.5 leading-relaxed m-0">
                            {log.details}
                          </p>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#8A8585] font-mono tabular-nums whitespace-nowrap">
                        {log.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
