"use client";

import React from "react";
import { Mandate, Transaction, AuditLog } from "@/components/dashboard/types";
import { ReceiptDialog, ReceiptData } from "@/components/dashboard/ReceiptDialog";
import { ApprovalDialog, ApprovalRequest } from "@/components/dashboard/ApprovalDialog";
import { CreateMandateDialog } from "@/components/dashboard/CreateMandateDialog";
import { QuickCommandLauncher } from "@/components/dashboard/QuickCommandLauncher";
import { ChatMessage, BrowserActionItem } from "@/lib/chat/use-payagent-chat";
import { RicoFrame13Canvas } from "./RicoFrame13Canvas";
import type {
  SplitWorkspaceSnapshot,
  WorkspaceActionEvent,
} from "@/lib/workspace/types";

interface RicoCleanHomeProps {
  mandates: Mandate[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
  messages: ChatMessage[];
  chatInput: string;
  onChatInputChange: (val: string) => void;
  onSendMessage: (val: string) => void;
  onClearChat: () => void;
  isChatLoading: boolean;
  activeBrowserAction?: BrowserActionItem | null;
  browserOpenSignal?: number;
  onTriggerMandate: (id: string) => void;
  onViewReceipt: (receipt: ReceiptData) => void;
  onCreateMandateClick: () => void;
  isCreateOpen: boolean;
  setIsCreateOpen: (open: boolean) => void;
  mandateInitialData?: {
    service?: string;
    budgetCeiling?: string;
    recurrence?: string;
    category?: string;
  };
  strictMode: boolean;
  onToggleStrictMode: () => void;
  approvalRequest: ApprovalRequest | null;
  onApproveApproval: (fundingSource?: "PAYPAL" | "BACKUP_CARD") => void;
  onRejectApproval: () => void;
  selectedReceipt: ReceiptData | null;
  setSelectedReceipt: (receipt: ReceiptData | null) => void;
  onDeployPlanMandate: (service: string, price: number, planName: string) => void;
  onCreateMandateSubmit: (mandate: Omit<Mandate, "id" | "lastScrapedPrice">) => void;
  isCommandOpen?: boolean;
  setIsCommandOpen?: (open: boolean) => void;
  onRefreshData?: () => void;
  pendingWorkspaceAction?: WorkspaceActionEvent | null;
  onWorkspaceActionHandled?: (id: string) => void;
  onWorkspaceSnapshotChange?: (
    patch: Partial<SplitWorkspaceSnapshot>
  ) => void;
}

export function RicoCleanHome({
  mandates,
  transactions,
  auditLogs,
  messages,
  chatInput,
  onChatInputChange,
  onSendMessage,
  onClearChat,
  isChatLoading,
  activeBrowserAction,
  browserOpenSignal,
  onTriggerMandate,
  onViewReceipt,
  onCreateMandateClick,
  isCreateOpen,
  setIsCreateOpen,
  mandateInitialData,
  strictMode,
  onToggleStrictMode,
  approvalRequest,
  onApproveApproval,
  onRejectApproval,
  selectedReceipt,
  setSelectedReceipt,
  onDeployPlanMandate,
  onCreateMandateSubmit,
  isCommandOpen = false,
  setIsCommandOpen,
  onRefreshData,
  pendingWorkspaceAction,
  onWorkspaceActionHandled,
  onWorkspaceSnapshotChange,
}: RicoCleanHomeProps) {
  const [localCommandOpen, setLocalCommandOpen] = React.useState(false);
  const [settingsOpenSignal, setSettingsOpenSignal] = React.useState(0);
  const commandOpen = setIsCommandOpen ? isCommandOpen : localCommandOpen;
  const handleSetCommandOpen = setIsCommandOpen ?? setLocalCommandOpen;

  return (
    <>
      <RicoFrame13Canvas
        mandates={mandates}
        transactions={transactions}
        auditLogs={auditLogs}
        messages={messages}
        chatInput={chatInput}
        onChatInputChange={onChatInputChange}
        onSendMessage={onSendMessage}
        onClearChat={onClearChat}
        isChatLoading={isChatLoading}
        activeBrowserAction={activeBrowserAction}
        browserOpenSignal={browserOpenSignal}
        onTriggerMandate={onTriggerMandate}
        onViewReceipt={onViewReceipt}
        onCreateMandateClick={onCreateMandateClick}
        strictMode={strictMode}
        onToggleStrictMode={onToggleStrictMode}
        approvalRequest={approvalRequest}
        onApproveApproval={onApproveApproval}
        onRejectApproval={onRejectApproval}
        onDeployPlanMandate={onDeployPlanMandate}
        onOpenCommandPalette={() => handleSetCommandOpen(true)}
        settingsOpenSignal={settingsOpenSignal}
        onRefreshData={onRefreshData}
        pendingWorkspaceAction={pendingWorkspaceAction}
        onWorkspaceActionHandled={onWorkspaceActionHandled}
        onWorkspaceSnapshotChange={onWorkspaceSnapshotChange}
      />

      <ReceiptDialog
        receipt={selectedReceipt}
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
      />

      <ApprovalDialog
        request={approvalRequest}
        isOpen={Boolean(approvalRequest)}
        onApprove={onApproveApproval}
        onReject={onRejectApproval}
      />

      <CreateMandateDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={onCreateMandateSubmit}
        initialData={mandateInitialData}
      />

      <QuickCommandLauncher
        isOpen={commandOpen}
        onClose={() => handleSetCommandOpen(false)}
        mandates={mandates}
        transactions={transactions}
        auditLogs={auditLogs}
        messages={messages}
        onSendMessage={onSendMessage}
        onOpenCreateMandate={() => {
          handleSetCommandOpen(false);
          onCreateMandateClick();
        }}
        onOpenSettings={() => {
          handleSetCommandOpen(false);
          setSettingsOpenSignal((n) => n + 1);
        }}
        onViewReceipt={onViewReceipt}
        onToggleStrictMode={onToggleStrictMode}
        strictMode={strictMode}
      />
    </>
  );
}
