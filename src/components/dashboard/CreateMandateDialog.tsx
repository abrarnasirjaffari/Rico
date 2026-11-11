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
  const [budgetCeiling, setBudgetCeiling] = useState(initialData?.budgetCeiling || "20.00");
  const [recurrence, setRecurrence] = useState(initialData?.recurrence || "Monthly on the 5th");
  const [category, setCategory] = useState(initialData?.category || "Subscription");

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#F6FAFF] border border-[#BFD7F7] text-[#0F172A] shadow-xl z-[100] font-[Inter,system-ui,sans-serif]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0F172A]">
              New Spending Rule
            </DialogTitle>
            <DialogDescription className="text-xs text-[#52637A]">
              Set a spending limit and execution schedule
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3 text-xs">
            <div>
              <label className="block text-[#0F172A] font-semibold mb-1">
                Service Name
              </label>
              <Input
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="e.g. Netflix, Spotify, AWS, GitHub, PostHog, Notion"
                className="bg-white border-[#C7DCF6] text-xs text-[#0F172A] placeholder-[#94A3B8] focus-visible:ring-blue-500"
                required
              />
              {service.toLowerCase().includes("posthog") && (
                <p className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center gap-1">
                  💡 <strong>Startup Perk:</strong> PostHog offers $50,000 in free credits!
                </p>
              )}
              {service.toLowerCase().includes("spotify") && (
                <p className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center gap-1">
                  🎓 <strong>Student Perk:</strong> Spotify is 50% off ($5.99/mo + free Hulu)!
                </p>
              )}
              {service.toLowerCase().includes("notion") && (
                <p className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center gap-1">
                  💡 <strong>Startup Perk:</strong> Notion provides $1,000 - $6,000 in credits!
                </p>
              )}
              {service.toLowerCase().includes("adobe") && (
                <p className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center gap-1">
                  🎓 <strong>Student Perk:</strong> Adobe is 64% off ($19.99/mo student rate)!
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#0F172A] font-semibold mb-1">
                  Budget Cap ($ USD)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={budgetCeiling}
                  onChange={(e) => setBudgetCeiling(e.target.value)}
                  className="bg-white border-[#C7DCF6] text-xs text-[#0F172A] focus-visible:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[#0F172A] font-semibold mb-1">
                  Category
                </label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Entertainment, Cloud"
                  className="bg-white border-[#C7DCF6] text-xs text-[#0F172A] focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#0F172A] font-semibold mb-1">
                Recurrence Schedule
              </label>
              <Input
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                placeholder="e.g. Monthly on the 1st"
                className="bg-white border-[#C7DCF6] text-xs text-[#0F172A] focus-visible:ring-blue-500"
                required
              />
            </div>
          </div>

          <DialogFooter className="border-t border-[#D6E8FD] pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 rounded-lg border border-[#BFD7F7] bg-white text-[#52637A] hover:bg-[#E2EEFD] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-8 px-3.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold shadow-2xs"
            >
              Save Spending Rule
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
