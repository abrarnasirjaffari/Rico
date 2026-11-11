"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  RefreshCw,
  UserCheck,
  X,
} from "lucide-react";

interface TakeoverChallengeModalProps {
  challengeType: "CLOUDFLARE_TURNSTILE" | "TWO_FACTOR_SMS" | "RECAPTCHA";
  serviceName?: string;
  onSolved: () => void;
  onCancel: () => void;
}

export function TakeoverChallengeModal({
  challengeType,
  serviceName = "Merchant Checkout",
  onSolved,
  onCancel,
}: TakeoverChallengeModalProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [smsCode, setSmsCode] = useState("");
  const [smsError, setSmsError] = useState(false);

  const handleTurnstileClick = () => {
    if (isVerifying || isSuccess) return;
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSolved();
      }, 1200);
    }, 1000);
  };

  const handleSmsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (smsCode.trim() === "492026" || smsCode.length === 6) {
      setIsSuccess(true);
      setTimeout(() => {
        onSolved();
      }, 1200);
    } else {
      setSmsError(true);
    }
  };

  const handleAutofillSms = () => {
    setSmsCode("492026");
    setSmsError(false);
    setIsSuccess(true);
    setTimeout(() => {
      onSolved();
    }, 1200);
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 select-none font-[Inter,system-ui,sans-serif]">
      <div className="w-full max-w-md bg-white border border-[#BFD7F7] rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D6E8FD]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-700">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">
                Human Takeover Required
              </h3>
              <p className="text-[11px] text-[#52637A]">{serviceName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded text-[#64748B] hover:text-[#0F172A]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Challenge Body */}
        {challengeType === "CLOUDFLARE_TURNSTILE" || challengeType === "RECAPTCHA" ? (
          <div className="space-y-4 py-2">
            <p className="text-xs text-[#52637A]">
              The merchant website triggered an interactive security challenge. Complete it below so Rico can resume checkout:
            </p>

            <div
              onClick={handleTurnstileClick}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                isSuccess
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-[#F8FAFC] border-[#C8DDF8] hover:border-blue-400"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                    isSuccess
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-white border-[#C7DCF6]"
                  }`}
                >
                  {isVerifying ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : null}
                </div>
                <span className="text-xs font-semibold text-[#0F172A]">
                  {isSuccess
                    ? "Verification Successful!"
                    : isVerifying
                    ? "Verifying Human..."
                    : "Verify you are human (Click)"}
                </span>
              </div>

              <span className="text-[10px] text-[#64748B] font-mono">Cloudflare</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSmsSubmit} className="space-y-3.5 py-1 text-xs">
            <p className="text-[#52637A]">
              Merchant sent a 2FA confirmation code to your phone. Enter it below to authorize this session:
            </p>

            <div className="space-y-1">
              <input
                type="text"
                maxLength={6}
                value={smsCode}
                onChange={(e) => {
                  setSmsCode(e.target.value);
                  setSmsError(false);
                }}
                placeholder="492026"
                className="w-full h-10 text-center tracking-widest font-mono text-lg font-bold rounded-lg border border-[#C7DCF6] bg-[#F8FAFC] text-[#0F172A] outline-none focus:border-blue-500"
              />
              {smsError && (
                <span className="text-[11px] text-red-600">
                  Invalid code. Try clicking &ldquo;Autofill Demo Code&rdquo;.
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleAutofillSms}
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                Autofill Demo Code (492026)
              </button>

              <button
                type="submit"
                className="h-8 px-4 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold"
              >
                Submit Code
              </button>
            </div>
          </form>
        )}

        <div className="pt-2 border-t border-[#D6E8FD] flex items-center justify-between text-[11px] text-[#52637A]">
          <span>Human fallback active</span>
          <span className="text-blue-700 font-mono font-medium">Control returns to Rico</span>
        </div>
      </div>
    </div>
  );
}
