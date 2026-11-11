"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";
import { Mandate } from "./types";

interface CreateMandateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (mandate: Omit<Mandate, "id" | "lastScrapedPrice">) => void;
  initialData?: {
    service?: string;
    budgetCeiling?: string;
    recurrence?: string;
    category?: string;
  };
}

export function CreateMandateDialog({
  isOpen,
  onClose,
  onCreate,
  initialData,
}: CreateMandateDialogProps) {
  const [service, setService] = useState(initialData?.service || "");
  const [budgetCeiling, setBudgetCeiling] = useState(
    initialData?.budgetCeiling || "20.00"
  );
  const [recurrence, setRecurrence] = useState(
    initialData?.recurrence || "Monthly on the 5th"
  );
  const [category, setCategory] = useState(
    initialData?.category || "Subscription"
  );

  React.useEffect(() => {
    if (initialData) {
      if (initialData.service) setService(initialData.service);
      if (initialData.budgetCeiling) setBudgetCeiling(initialData.budgetCeiling);
      if (initialData.recurrence) setRecurrence(initialData.recurrence);
      if (initialData.category) setCategory(initialData.category);
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!service.trim()) return;

    onCreate({
      service,
      budgetCeiling: parseFloat(budgetCeiling) || 20.0,
      recurrence,
      nextRun: "Nov 5, 2026",
      status: "ACTIVE",
      category,
      currency: "USD",
    });

    setService("");
    onClose();
  };

  const lower = service.toLowerCase();
  const perkHint = lower.includes("posthog")
    ? "PostHog for Startups offers up to $50,000 in eligible credits."
    : lower.includes("spotify")
    ? "Student plans reduce Spotify Premium by 50% ($5.99/mo)."
    : lower.includes("notion")
    ? "Notion for Startups offers $1,000–$6,000 in workspace credits."
    : lower.includes("adobe")
    ? "Academic plans reduce Adobe Creative Cloud by 64% ($19.99/mo)."
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border border-[#DCE7F3] text-[#0F172A] rounded-2xl shadow-[0_12px_36px_rgba(15,23,42,0.1)] z-[100]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold tracking-tight text-[#0F172A]">
              New spending rule
            </DialogTitle>
            <DialogDescription className="text-xs text-[#52637A]">
              Set a budget cap and billing schedule for Rico to verify before paying.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-4 text-xs">
            <div>
              <label
                htmlFor="mandate-service-input"
                className="block text-[#0F172A] font-medium mb-1.5"
              >
                Service *
              </label>
              <Input
                id="mandate-service-input"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="Netflix, Spotify, AWS, PostHog..."
                className="h-9 bg-white border-[#DCE7F3] text-xs text-[#0F172A] placeholder-[#94A3B8] focus-visible:ring-[#2563EB]/30"
                required
              />
              {perkHint && (
                <p className="text-[11px] text-emerald-700 mt-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>{perkHint}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="mandate-cap-input"
                  className="block text-[#0F172A] font-medium mb-1.5"
                >
                  Budget cap (USD) *
                </label>
                <Input
                  id="mandate-cap-input"
                  type="text"
                  inputMode="decimal"
                  value={budgetCeiling}
                  onChange={(e) => setBudgetCeiling(e.target.value)}
                  className="h-9 bg-white border-[#DCE7F3] text-xs font-mono tabular-nums text-[#0F172A] focus-visible:ring-[#2563EB]/30"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="mandate-category-input"
                  className="block text-[#0F172A] font-medium mb-1.5"
                >
                  Category
                </label>
                <Input
                  id="mandate-category-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Cloud, Media, Tools"
                  className="h-9 bg-white border-[#DCE7F3] text-xs text-[#0F172A] focus-visible:ring-[#2563EB]/30"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="mandate-schedule-input"
                className="block text-[#0F172A] font-medium mb-1.5"
              >
                Schedule *
              </label>
              <Input
                id="mandate-schedule-input"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                placeholder="Monthly on the 5th"
                className="h-9 bg-white border-[#DCE7F3] text-xs text-[#0F172A] focus-visible:ring-[#2563EB]/30"
                required
              />
            </div>
          </div>

          <DialogFooter className="border-t border-[#EDF3FA] pt-3.5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3.5 rounded-lg border border-[#DCE7F3] bg-white text-[#52637A] hover:text-[#0F172A] hover:bg-[#F5F8FC] text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            >
              Save rule
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
