"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  Loader2,
  LogIn,
  LogOut,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

export interface ModelOption {
  id: string;
  label: string;
}

export interface LanguageOption {
  readonly code: string;
  readonly short: string;
  readonly label: string;
}

export interface RicoUserProfile {
  firstName: string;
  lastName: string;
  email: string;
  roleTitle: string;
  avatarUrl: string;
}

export const DEFAULT_RICO_PROFILE: RicoUserProfile = {
  firstName: "",
  lastName: "",
  email: "",
  roleTitle: "",
  avatarUrl: "",
};

const PRESET_AVATARS = [
  "/avatar-1.png",
  "/avatar-2.png",
  "/avatar-3.png",
  "/avatar-4.png",
];

type SettingsSectionId = "profile" | "preferences" | "account";

export interface RicoEnterpriseSettingsProps {
  onClose: () => void;
  profile: RicoUserProfile;
  onSaveProfile: (next: RicoUserProfile) => void;
  strictMode: boolean;
  onToggleStrictMode: () => void;
  language: string;
  languageOptions: readonly LanguageOption[];
  onSelectLanguage: (code: string) => void;
  selectedModel: ModelOption;
  modelOptions: readonly ModelOption[];
  onSelectModel: (model: ModelOption) => void;
}

function resizeImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Unsupported image format."));
      img.onload = () => {
        const size = 192;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function RicoEnterpriseSettings({
  onClose,
  profile,
  onSaveProfile,
  strictMode,
  onToggleStrictMode,
  language,
  languageOptions,
  onSelectLanguage,
  selectedModel,
  modelOptions,
  onSelectModel,
}: RicoEnterpriseSettingsProps) {
  const { user, isAuthenticated, openAuthPrompt, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsSectionId>("profile");
  const [firstName, setFirstName] = useState<string>(profile.firstName);
  const [lastName, setLastName] = useState<string>(profile.lastName);
  const [email, setEmail] = useState<string>(
    profile.email || user?.email || ""
  );
  const [roleTitle, setRoleTitle] = useState<string>(profile.roleTitle);
  const [avatarUrl, setAvatarUrl] = useState<string>(profile.avatarUrl);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [savedBanner, setSavedBanner] = useState<boolean>(false);

  const [currency, setCurrency] = useState<string>("USD");
  const [priceAlerts, setPriceAlerts] = useState<boolean>(true);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!email && user?.email) {
      setEmail(user.email);
    }
  }, [email, user?.email]);

  useEffect(() => {
    try {
      const savedCurrency = window.localStorage.getItem("rico_currency");
      if (savedCurrency && ["USD", "EUR", "GBP"].includes(savedCurrency)) {
        setCurrency(savedCurrency);
      }
      const savedAlerts = window.localStorage.getItem("rico_price_alerts");
      if (savedAlerts !== null) {
        setPriceAlerts(savedAlerts === "true");
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const hasUnsavedProfileChanges =
    firstName !== profile.firstName ||
    lastName !== profile.lastName ||
    email !== (profile.email || user?.email || "") ||
    roleTitle !== profile.roleTitle ||
    avatarUrl !== profile.avatarUrl;

  const validateEmailField = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return "Enter a valid email address (for example, name@company.com).";
    }
    return null;
  };

  const handlePhotoSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Choose a PNG, JPG, WebP, or GIF image file.");
      return;
    }
    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      const resizedUrl = await resizeImageFileToDataUrl(file);
      setAvatarUrl(resizedUrl);
      onSaveProfile({
        ...profile,
        avatarUrl: resizedUrl,
      });
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 2200);
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : "Could not load selected image."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSelectPresetAvatar = (presetUrl: string) => {
    setPhotoError(null);
    setAvatarUrl(presetUrl);
    onSaveProfile({
      ...profile,
      avatarUrl: presetUrl,
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2200);
  };

  const handleRemovePhoto = () => {
    setPhotoError(null);
    setAvatarUrl("");
    onSaveProfile({
      ...profile,
      avatarUrl: "",
    });
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmailField(email);
    if (err) {
      setEmailError(err);
      emailInputRef.current?.focus();
      return;
    }
    setEmailError(null);
    onSaveProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      roleTitle: roleTitle.trim(),
      avatarUrl,
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2200);
  };

  const initials =
    `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase() ||
    (email.trim() ? email.trim().charAt(0).toUpperCase() : "");

  const navItems: Array<{
    id: SettingsSectionId;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "profile",
      label: "Profile",
      icon: <User className="w-4 h-4 shrink-0 stroke-[1.9]" aria-hidden="true" />,
    },
    {
      id: "preferences",
      label: "Preferences",
      icon: (
        <SlidersHorizontal
          className="w-4 h-4 shrink-0 stroke-[1.9]"
          aria-hidden="true"
        />
      ),
    },
    {
      id: "account",
      label: "Payments & account",
      icon: (
        <ShieldCheck
          className="w-4 h-4 shrink-0 stroke-[1.9]"
          aria-hidden="true"
        />
      ),
    },
  ];

  const inputClass =
    "w-full h-10 px-3 rounded-lg border border-[#D6D3D1] bg-white text-[13.5px] text-[#1E1B1B] placeholder:text-[#8A8585] transition-colors duration-150 focus:outline-none focus:border-[#1E1B1B] focus-visible:ring-2 focus-visible:ring-[#034CFF]/25";

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[oklch(0.994_0_89.876)] text-[#1E1B1B]">
      {/* Hidden Photo Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelected}
        className="hidden"
        tabIndex={-1}
      />

      {/* Clean Header with Close (X) */}
      <header className="px-4 sm:px-6 pt-3.5 pb-3 border-b border-[#E6E4E3] flex items-center justify-between gap-3 shrink-0">
        <h1 className="m-0 text-[15px] font-semibold tracking-[-0.015em] text-[#1E1B1B]">
          Settings
        </h1>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Settings and return home"
          title="Back to home (Esc)"
          className="w-9 h-9 rounded-full bg-[oklch(0.097_0_0_/_0.05)] hover:bg-[oklch(0.097_0_0_/_0.1)] text-[oklch(0.097_0_0)] flex items-center justify-center shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          <X className="w-[18px] h-[18px] stroke-[2]" aria-hidden="true" />
        </button>
      </header>

      {/* Mobile Section Strip */}
      <div
        role="tablist"
        aria-label="Settings sections"
        className="md:hidden px-4 py-2 border-b border-[#E6E4E3] bg-[#F8F7F7] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0"
      >
        {navItems.map((item) => {
          const selected = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(item.id)}
              className={`h-8 px-3.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
                selected
                  ? "bg-[#1E1B1B] text-white"
                  : "bg-white border border-[#E6E4E3] text-[#5C5858] hover:text-[#1E1B1B]"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Two-Column Settings Layout */}
      <div className="flex-1 min-h-0 flex flex-row overflow-hidden">
        {/* Left Navigation (Desktop/Tablet) */}
        <nav
          aria-label="Settings categories"
          className="hidden md:flex w-52 shrink-0 border-r border-[#E6E4E3] bg-[#F8F7F7]/50 p-4 flex-col gap-1"
        >
          {navItems.map((item) => {
            const selected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={selected ? "page" : undefined}
                className={`w-full h-9 px-3 rounded-lg text-[13px] font-medium flex items-center gap-2.5 text-left transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
                  selected
                    ? "bg-white text-[#1E1B1B] border border-[#E6E4E3] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    : "text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#EFECEB]/70"
                }`}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content Column */}
        <div className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-8 py-6 rico-scroller">
          <div className="max-w-xl mx-auto space-y-6">
            {/* 1. PROFILE */}
            {activeTab === "profile" && (
              <>
                <div>
                  <h2 className="m-0 text-base font-semibold tracking-[-0.015em] text-[#1E1B1B]">
                    Profile
                  </h2>
                  <p className="m-0 mt-1 text-xs text-[#5C5858]">
                    Update your photo and personal details shown across RICO.
                  </p>
                </div>

                {/* Profile Photo Card */}
                <section className="rounded-xl border border-[#E6E4E3] bg-white p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-full border border-[#E6E4E3] bg-[#F1EFEF] overflow-hidden flex items-center justify-center shrink-0">
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarUrl}
                            alt="Profile photo"
                            className="w-full h-full object-cover"
                          />
                        ) : initials ? (
                          <span className="text-base font-semibold text-[#1E1B1B]">
                            {initials}
                          </span>
                        ) : (
                          <User
                            className="w-6 h-6 text-[#5C5858]"
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      <div>
                        <div className="text-[13.5px] font-medium text-[#1E1B1B]">
                          Profile photo
                        </div>
                        <p className="m-0 mt-0.5 text-xs text-[#5C5858]">
                          PNG, JPG, or WebP. Automatically cropped to fit.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={uploadingPhoto}
                        onClick={() => fileInputRef.current?.click()}
                        className="h-9 px-3.5 rounded-lg border border-[#D6D3D1] bg-white hover:bg-[#F8F7F7] text-xs font-medium text-[#1E1B1B] inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:opacity-60"
                      >
                        {uploadingPhoto ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span>{avatarUrl ? "Change photo" : "Upload photo"}</span>
                      </button>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          aria-label="Remove profile photo"
                          className="h-9 px-3 rounded-lg border border-[#E6E4E3] bg-white hover:bg-[#F8F7F7] text-xs font-medium text-[#5C5858] hover:text-[#1E1B1B] inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Default Avatars */}
                  <div className="pt-3 border-t border-[#F1EFEF] flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-xs text-[#5C5858]">
                      Or choose a default avatar
                    </span>
                    <div className="flex items-center gap-2">
                      {PRESET_AVATARS.map((src, i) => {
                        const selected = avatarUrl === src;
                        return (
                          <button
                            key={src}
                            type="button"
                            onClick={() => handleSelectPresetAvatar(src)}
                            aria-label={`Select default avatar ${i + 1}`}
                            aria-pressed={selected}
                            className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
                              selected
                                ? "border-[#1E1B1B] scale-105"
                                : "border-transparent hover:border-[#D6D3D1]"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt=""
                              aria-hidden="true"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {photoError && (
                    <p className="m-0 text-xs text-red-600" role="alert">
                      {photoError}
                    </p>
                  )}
                </section>

                {/* Personal Information Form */}
                <form
                  onSubmit={handleProfileSubmit}
                  className="rounded-xl border border-[#E6E4E3] bg-white p-5 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="rico-first-name"
                        className="block text-xs font-medium text-[#1E1B1B]"
                      >
                        First name
                      </label>
                      <input
                        id="rico-first-name"
                        type="text"
                        autoComplete="given-name"
                        spellCheck={false}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Abrar"
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="rico-last-name"
                        className="block text-xs font-medium text-[#1E1B1B]"
                      >
                        Last name
                      </label>
                      <input
                        id="rico-last-name"
                        type="text"
                        autoComplete="family-name"
                        spellCheck={false}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Jaffari"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="rico-profile-email"
                      className="block text-xs font-medium text-[#1E1B1B]"
                    >
                      Email address
                    </label>
                    <input
                      id="rico-profile-email"
                      ref={emailInputRef}
                      type="email"
                      autoComplete="email"
                      spellCheck={false}
                      value={email}
                      readOnly={Boolean(isAuthenticated && user?.email)}
                      onBlur={(e) =>
                        setEmailError(validateEmailField(e.target.value))
                      }
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      aria-invalid={Boolean(emailError)}
                      aria-describedby={
                        emailError ? "rico-profile-email-error" : undefined
                      }
                      placeholder="name@company.com"
                      className={`${inputClass} ${
                        isAuthenticated && user?.email
                          ? "bg-[#F8F7F7] text-[#5C5858]"
                          : ""
                      }`}
                    />
                    {emailError ? (
                      <p
                        id="rico-profile-email-error"
                        className="m-0 text-xs text-red-600"
                      >
                        {emailError}
                      </p>
                    ) : (
                      isAuthenticated &&
                      user?.email && (
                        <p className="m-0 text-[11.5px] text-[#8A8585]">
                          Managed by your signed-in account.
                        </p>
                      )
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="rico-role-title"
                      className="block text-xs font-medium text-[#1E1B1B]"
                    >
                      Role or company{" "}
                      <span className="font-normal text-[#8A8585]">
                        (optional)
                      </span>
                    </label>
                    <input
                      id="rico-role-title"
                      type="text"
                      autoComplete="organization-title"
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      placeholder="Founder · Acme Inc."
                      className={inputClass}
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    {savedBanner && (
                      <span className="text-xs font-medium text-emerald-700 inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                        <span>Changes saved</span>
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={!hasUnsavedProfileChanges}
                      className="h-9 px-4 rounded-lg bg-[#1E1B1B] hover:bg-[#332F2F] text-white text-xs font-medium transition-colors disabled:opacity-45 disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25"
                    >
                      Save changes
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* 2. PREFERENCES */}
            {activeTab === "preferences" && (
              <>
                <div>
                  <h2 className="m-0 text-base font-semibold tracking-[-0.015em] text-[#1E1B1B]">
                    Preferences
                  </h2>
                  <p className="m-0 mt-1 text-xs text-[#5C5858]">
                    Language, currency, and default assistant model.
                  </p>
                </div>

                <section className="rounded-xl border border-[#E6E4E3] bg-white divide-y divide-[#F1EFEF]">
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <label
                        htmlFor="rico-pref-lang"
                        className="text-[13.5px] font-medium text-[#1E1B1B] block"
                      >
                        Language
                      </label>
                      <p className="m-0 mt-0.5 text-xs text-[#5C5858]">
                        Display language across the workspace.
                      </p>
                    </div>
                    <select
                      id="rico-pref-lang"
                      value={language}
                      onChange={(e) => onSelectLanguage(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-[#D6D3D1] bg-[#FCFCFC] text-xs font-medium text-[#1E1B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
                    >
                      {languageOptions.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <label
                        htmlFor="rico-pref-currency"
                        className="text-[13.5px] font-medium text-[#1E1B1B] block"
                      >
                        Default currency
                      </label>
                      <p className="m-0 mt-0.5 text-xs text-[#5C5858]">
                        Used when displaying spending caps and receipts.
                      </p>
                    </div>
                    <select
                      id="rico-pref-currency"
                      value={currency}
                      onChange={(e) => {
                        setCurrency(e.target.value);
                        try {
                          window.localStorage.setItem(
                            "rico_currency",
                            e.target.value
                          );
                        } catch {
                          // Ignore storage errors
                        }
                      }}
                      className="h-9 px-3 rounded-lg border border-[#D6D3D1] bg-[#FCFCFC] text-xs font-mono font-medium text-[#1E1B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>

                  <div className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <label
                        htmlFor="rico-pref-model"
                        className="text-[13.5px] font-medium text-[#1E1B1B] block"
                      >
                        Default AI model
                      </label>
                      <p className="m-0 mt-0.5 text-xs text-[#5C5858]">
                        Model selected when starting a new chat.
                      </p>
                    </div>
                    <select
                      id="rico-pref-model"
                      value={selectedModel.id}
                      onChange={(e) => {
                        const found = modelOptions.find(
                          (m) => m.id === e.target.value
                        );
                        if (found) onSelectModel(found);
                      }}
                      className="h-9 px-3 rounded-lg border border-[#D6D3D1] bg-[#FCFCFC] text-xs font-medium text-[#1E1B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
                    >
                      {modelOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>
              </>
            )}

            {/* 3. PAYMENTS & ACCOUNT */}
            {activeTab === "account" && (
              <>
                <div>
                  <h2 className="m-0 text-base font-semibold tracking-[-0.015em] text-[#1E1B1B]">
                    Payments &amp; account
                  </h2>
                  <p className="m-0 mt-1 text-xs text-[#5C5858]">
                    Control payment confirmations, alerts, and account sign-in.
                  </p>
                </div>

                <section className="rounded-xl border border-[#E6E4E3] bg-white divide-y divide-[#F1EFEF]">
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-[13.5px] font-medium text-[#1E1B1B] block">
                        Ask before every payment
                      </span>
                      <p className="m-0 mt-0.5 text-xs text-[#5C5858]">
                        Require your approval before RICO completes any payment.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={strictMode}
                      aria-label="Ask before every payment"
                      onClick={onToggleStrictMode}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 focus-visible:ring-offset-2 ${
                        strictMode ? "bg-[#1E1B1B]" : "bg-[#D6D3D1]"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform duration-150 ${
                          strictMode ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-[13.5px] font-medium text-[#1E1B1B] block">
                        Price increase alerts
                      </span>
                      <p className="m-0 mt-0.5 text-xs text-[#5C5858]">
                        Notify me whenever a recurring subscription raises its
                        price.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={priceAlerts}
                      aria-label="Price increase alerts"
                      onClick={() => {
                        const next = !priceAlerts;
                        setPriceAlerts(next);
                        try {
                          window.localStorage.setItem(
                            "rico_price_alerts",
                            String(next)
                          );
                        } catch {
                          // Ignore storage errors
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 focus-visible:ring-offset-2 ${
                        priceAlerts ? "bg-[#1E1B1B]" : "bg-[#D6D3D1]"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform duration-150 ${
                          priceAlerts ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-[13.5px] font-medium text-[#1E1B1B] block">
                        Account session
                      </span>
                      <p className="m-0 mt-0.5 text-xs text-[#5C5858] truncate">
                        {isAuthenticated && user
                          ? `Signed in as ${user.email}`
                          : "Currently browsing as a local guest"}
                      </p>
                    </div>

                    {isAuthenticated ? (
                      <button
                        type="button"
                        disabled={loggingOut}
                        onClick={async () => {
                          setLoggingOut(true);
                          await logout();
                          window.location.reload();
                        }}
                        className="h-9 px-3.5 rounded-lg border border-[#D6D3D1] bg-white hover:bg-[#F8F7F7] text-xs font-medium text-[#1E1B1B] inline-flex items-center gap-1.5 shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:opacity-60"
                      >
                        {loggingOut ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span>Log out</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          openAuthPrompt();
                        }}
                        className="h-9 px-3.5 rounded-lg bg-[#1E1B1B] hover:bg-[#332F2F] text-white text-xs font-medium inline-flex items-center gap-1.5 shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25"
                      >
                        <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Sign in</span>
                      </button>
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
