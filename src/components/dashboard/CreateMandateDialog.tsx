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
  const [formError, setFormError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setFormError(null);
      if (initialData) {
        if (initialData.service !== undefined) setService(initialData.service);
        if (initialData.budgetCeiling !== undefined) {
          setBudgetCeiling(initialData.budgetCeiling);
        }
        if (initialData.recurrence !== undefined) {
          setRecurrence(initialData.recurrence);
        }
        if (initialData.category !== undefined) setCategory(initialData.category);
      }
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedService = service.trim();
    if (!trimmedService) {
      setFormError("Enter a vendor or service name.");
      return;
    }

    const parsedCap = Number.parseFloat(budgetCeiling);
    if (!Number.isFinite(parsedCap) || parsedCap <= 0) {
      setFormError("Enter a valid USD budget cap greater than $0.00.");
      return;
    }

    if (!recurrence.trim()) {
      setFormError("Enter a billing schedule.");
      return;
    }

    setFormError(null);
    onCreate({
      service: trimmedService,
      budgetCeiling: parsedCap,
      recurrence: recurrence.trim(),
      nextRun: "Nov 5, 2026",
      status: "ACTIVE",
      category: category.trim() || "Subscription",
      currency: "USD",
    });

    setService("");
    onClose();
  };

  const lower = service.toLowerCase();
  const programNote = lower.includes("posthog")
    ? "Eligible for PostHog startup credits (up to $50,000)."
    : lower.includes("spotify")
    ? "Academic plans lower Spotify Premium to $5.99/mo."
    : lower.includes("notion")
    ? "Eligible for Notion startup workspace credits ($1,000–$6,000)."
    : lower.includes("adobe")
    ? "Academic plans lower Adobe Creative Cloud to $19.99/mo."
    : null;

  const inputClass =
    "w-full h-9 px-3 rounded-lg border border-[var(--rico-border-base)] bg-[var(--rico-surface-elevated)] text-[13px] text-[var(--rico-text-strong)] placeholder:text-[var(--rico-text-muted)] transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35 focus-visible:border-[var(--rico-accent)]";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[var(--rico-surface-elevated)] border border-[var(--rico-border-weak)] text-[var(--rico-text-strong)] rounded-xl shadow-[0_12px_32px_rgba(30,27,27,0.12)] z-[100]">
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold tracking-[-0.015em] text-[var(--rico-text-strong)]">
              New spending rule
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[var(--rico-text-base)]">
              Set a maximum cap and billing schedule. Rico verifies the live price before preparing any charge.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label
                htmlFor="mandate-service-input"
                className="block text-[13px] font-medium text-[var(--rico-text-strong)] mb-1"
              >
                Vendor
              </label>
              <input
                id="mandate-service-input"
                type="text"
                autoComplete="organization"
                value={service}
                onChange={(e) => {
                  setService(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="Netflix, Spotify, AWS, PostHog..."
                className={inputClass}
                required
              />
              {programNote && (
                <p className="m-0 mt-1.5 text-[12px] text-[var(--rico-text-base)]">
                  {programNote}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="mandate-cap-input"
                  className="block text-[13px] font-medium text-[var(--rico-text-strong)] mb-1"
                >
                  Budget cap (USD)
                </label>
                <input
                  id="mandate-cap-input"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={budgetCeiling}
                  onChange={(e) => {
                    setBudgetCeiling(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className={`${inputClass} font-mono tabular-nums`}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="mandate-category-input"
                  className="block text-[13px] font-medium text-[var(--rico-text-strong)] mb-1"
                >
                  Category
                </label>
                <input
                  id="mandate-category-input"
                  type="text"
                  autoComplete="off"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Cloud, Media, Tools"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="mandate-schedule-input"
                className="block text-[13px] font-medium text-[var(--rico-text-strong)] mb-1"
              >
                Schedule
              </label>
              <input
                id="mandate-schedule-input"
                type="text"
                autoComplete="off"
                value={recurrence}
                onChange={(e) => {
                  setRecurrence(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="Monthly on the 5th"
                className={inputClass}
                required
              />
            </div>

            {formError && (
              <p role="alert" className="m-0 text-[12.5px] font-medium text-red-700">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter className="border-t border-[var(--rico-border-weak)] pt-3.5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] sm:min-h-0 sm:h-9 px-3.5 rounded-lg border border-[var(--rico-border-base)] bg-[var(--rico-surface-elevated)] hover:bg-[var(--rico-bg-base)] text-[13px] font-medium text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)] transition-colors duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/35"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[40px] sm:min-h-0 sm:h-9 px-4 rounded-lg bg-[var(--rico-primary-bg)] text-[var(--rico-primary-fg)] hover:opacity-90 active:translate-y-px text-[13px] font-medium transition-opacity duration-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/40"
            >
              Save rule
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
