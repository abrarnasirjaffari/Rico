"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  Camera,
  Check,
  CirclePause,
  CreditCard,
  EyeOff,
  FileLock2,
  Fingerprint,
  GlobeLock,
  KeyRound,
  Laptop,
  Loader2,
  LogIn,
  LogOut,
  MailCheck,
  Monitor,
  Moon,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sun,
  Trash2,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth/AuthContext";

export type ModelProvider =
  | "rico"
  | "google"
  | "anthropic"
  | "openai"
  | "moonshot"
  | "deepseek"
  | "xai"
  | "qwen"
  | "zai"
  | "mistral"
  | "minimax";

export interface ModelOption {
  id: string;
  label: string;
  description?: string;
  provider?: ModelProvider;
  group?: string;
  badge?: string;
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

type SettingsSectionId = "profile" | "preferences" | "security" | "account";

interface StoredSecurityState {
  passkeys: Array<{ id: string; name: string }>;
  twoFactorEnabled: boolean;
  newDeviceOtp: boolean;
  linkedProviders: {
    google: boolean;
    github: boolean;
    microsoft: boolean;
  };
  zeroSecretVault: boolean;
  isolatedBrowserSandbox: boolean;
  redactPiiForAi: boolean;
  privateDataMode: boolean;
  otherDevicesRevoked: boolean;
  stepUpPayments: boolean;
  stepUpThreshold: "25" | "50" | "100" | "0";
  priceSpikeHold: boolean;
  priceSpikeLimit: "10" | "20" | "1";
  backupCardFailover: boolean;
  emergencyFreeze: boolean;
}

const DEFAULT_SECURITY_STATE: StoredSecurityState = {
  passkeys: [{ id: "pk-default", name: "This device passkey" }],
  twoFactorEnabled: false,
  newDeviceOtp: true,
  linkedProviders: {
    google: true,
    github: false,
    microsoft: false,
  },
  zeroSecretVault: true,
  isolatedBrowserSandbox: true,
  redactPiiForAi: true,
  privateDataMode: true,
  otherDevicesRevoked: false,
  stepUpPayments: true,
  stepUpThreshold: "50",
  priceSpikeHold: true,
  priceSpikeLimit: "20",
  backupCardFailover: true,
  emergencyFreeze: false,
};

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

function SettingsSwitch({
  checked,
  onToggle,
  ariaLabel,
  danger = false,
}: {
  checked: boolean;
  onToggle: () => void;
  ariaLabel: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/40 focus-visible:ring-offset-2 ${
        checked
          ? danger
            ? "bg-[#EF4444]"
            : "bg-[var(--rico-primary-bg)]"
          : "bg-[var(--rico-border-base)]"
      }`}
    >
      <span
        data-keep-white="true"
        className={`inline-block h-4 w-4 rounded-full transition-transform duration-150 ${
          checked
            ? danger
              ? "translate-x-6 bg-white"
              : "translate-x-6 bg-[var(--rico-primary-fg)]"
            : "translate-x-1 bg-white"
        }`}
      />
    </button>
  );
}

function BrandMark({
  brand,
  className = "w-4 h-4 object-contain shrink-0",
}: {
  brand: "google" | "github" | "microsoft" | "paypal" | "card";
  className?: string;
}) {
  switch (brand) {
    case "google":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M23 12.245c0-.905-.075-1.565-.236-2.25h-10.54v4.083h6.186c-.124 1.014-.797 2.542-2.294 3.569l-.021.136 3.332 2.53.23.022C21.779 18.417 23 15.593 23 12.245z"
            fill="#4285F4"
          />
          <path
            d="M12.225 23c3.03 0 5.574-.978 7.433-2.665l-3.542-2.688c-.948.648-2.22 1.1-3.891 1.1a6.745 6.745 0 01-6.386-4.572l-.132.011-3.465 2.628-.045.124C4.043 20.531 7.835 23 12.225 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.175A6.65 6.65 0 015.463 12c0-.758.138-1.491.361-2.175l-.006-.147-3.508-2.67-.115.054A10.831 10.831 0 001 12c0 1.772.436 3.447 1.197 4.938l3.642-2.763z"
            fill="#FBBC05"
          />
          <path
            d="M12.225 5.253c2.108 0 3.529.892 4.34 1.638l3.167-3.031C17.787 2.088 15.255 1 12.225 1 7.834 1 4.043 3.469 2.197 7.062l3.63 2.763a6.77 6.77 0 016.398-4.572z"
            fill="#EB4335"
          />
        </svg>
      );
    case "github":
      return (
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
          className={className}
        >
          <path
            fillRule="evenodd"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
          />
        </svg>
      );
    case "microsoft":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <rect x="2" y="2" width="9.2" height="9.2" rx="1" fill="#F25022" />
          <rect x="12.8" y="2" width="9.2" height="9.2" rx="1" fill="#7FBA00" />
          <rect x="2" y="12.8" width="9.2" height="9.2" rx="1" fill="#00A4EF" />
          <rect x="12.8" y="12.8" width="9.2" height="9.2" rx="1" fill="#FFB900" />
        </svg>
      );
    case "paypal":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M7.2 19.5H4.2L6.6 4.2h6.4c3.2 0 5.1 1.6 4.6 4.6-.4 3.2-2.7 4.9-6 4.9H8.3l-1.1 5.8Z"
            className="fill-[#003087] dark:fill-[#60A5FA]"
          />
          <path
            d="M10.3 21.5H7.7l1.9-11.9h5.6c2.8 0 4.3 1.4 4 4-.4 2.8-2.3 4.2-5.1 4.2h-2.9l-.9 3.7Z"
            className="fill-[#0079C1] dark:fill-[#38BDF8]"
            fillOpacity="0.92"
          />
        </svg>
      );
    case "card":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <circle cx="8.8" cy="12" r="6.2" fill="#EB001B" fillOpacity="0.92" />
          <circle cx="15.2" cy="12" r="6.2" fill="#F79E1B" fillOpacity="0.92" />
        </svg>
      );
  }
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
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState<boolean>(false);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  const currentThemeSelection = themeMounted ? theme || "light" : "light";
  const activeResolvedTheme = themeMounted
    ? resolvedTheme === "dark"
      ? "dark"
      : "light"
    : "light";

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

  const [security, setSecurity] = useState<StoredSecurityState>(
    DEFAULT_SECURITY_STATE
  );
  const [addingPasskey, setAddingPasskey] = useState<boolean>(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState<boolean>(false);
  const [totpCode, setTotpCode] = useState<string>("");
  const [totpError, setTotpError] = useState<string | null>(null);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

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
      const savedSecRaw = window.localStorage.getItem("rico_security_settings");
      if (savedSecRaw) {
        const parsed = JSON.parse(savedSecRaw) as Partial<StoredSecurityState>;
        setSecurity((prev) => ({
          ...prev,
          ...parsed,
          linkedProviders: {
            ...prev.linkedProviders,
            ...(parsed.linkedProviders || {}),
          },
          passkeys: Array.isArray(parsed.passkeys)
            ? parsed.passkeys
            : prev.passkeys,
        }));
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const flashSecurityNotice = (toastMessage: string) => {
    setSecurityNotice(toastMessage);
    setTimeout(() => setSecurityNotice(null), 2200);
  };

  const updateSecurity = (
    updater: (prev: StoredSecurityState) => StoredSecurityState,
    toastMessage?: string
  ) => {
    setSecurity((prev) => {
      const next = updater(prev);
      try {
        window.localStorage.setItem(
          "rico_security_settings",
          JSON.stringify(next)
        );
      } catch {
        // Ignore storage errors
      }
      return next;
    });
    if (toastMessage) {
      setSecurityNotice(toastMessage);
      setTimeout(() => setSecurityNotice(null), 2200);
    }
  };

  const handleRegisterPasskey = async () => {
    setAddingPasskey(true);
    try {
      await new Promise((r) => setTimeout(r, 250));
      updateSecurity(
        (prev) => ({
          ...prev,
          passkeys: [
            ...prev.passkeys,
            {
              id: `pk-${Date.now()}`,
              name: `Passkey #${prev.passkeys.length + 1}`,
            },
          ],
        }),
        "Passkey added"
      );
    } finally {
      setAddingPasskey(false);
    }
  };

  const handleConfirmTwoFactor = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = totpCode.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(cleaned)) {
      setTotpError("Enter a 6-digit code.");
      return;
    }
    setTotpError(null);
    setTotpCode("");
    setShowTwoFactorSetup(false);
    updateSecurity(
      (prev) => ({ ...prev, twoFactorEnabled: true }),
      "Authenticator enabled"
    );
  };

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
      icon: (
        <User className="w-[17px] h-[17px] shrink-0 stroke-[1.9]" aria-hidden="true" />
      ),
    },
    {
      id: "preferences",
      label: "Preferences",
      icon: (
        <SlidersHorizontal
          className="w-[17px] h-[17px] shrink-0 stroke-[1.9]"
          aria-hidden="true"
        />
      ),
    },
    {
      id: "security",
      label: "Security & privacy",
      icon: (
        <Fingerprint
          className="w-[17px] h-[17px] shrink-0 stroke-[1.9]"
          aria-hidden="true"
        />
      ),
    },
    {
      id: "account",
      label: "Payment security",
      icon: (
        <ShieldCheck
          className="w-[17px] h-[17px] shrink-0 stroke-[1.9]"
          aria-hidden="true"
        />
      ),
    },
  ];

  const inputClass =
    "w-full h-10 px-3.5 rounded-lg border border-[#D6D3D1] bg-white text-[14px] text-[#1E1B1B] placeholder:text-[#8A8585] transition-colors duration-150 focus:outline-none focus:border-[#1E1B1B] focus-visible:ring-2 focus-visible:ring-[#034CFF]/25";

  const rowIconClass =
    "w-[18px] h-[18px] text-[#5C5858] shrink-0 stroke-[1.85] mt-0.5";

  const rowTitleClass = "text-[14px] sm:text-[14.5px] font-medium text-[#1E1B1B]";
  const rowDescClass = "m-0 mt-0.5 text-[12.5px] sm:text-[13px] text-[#5C5858]";

  const currencySymbol =
    currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";

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

      {/* Unified Section Header */}
      <header className="min-h-[56px] px-4 sm:px-6 lg:px-8 py-3 border-b border-[#E6E4E3] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="m-0 text-[16px] sm:text-[17px] font-semibold tracking-[-0.015em] text-[#1E1B1B]">
            Settings
          </h1>
          {securityNotice && (
            <span
              role="status"
              className="hidden sm:inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#5C5858]"
            >
              <Check
                className="w-3.5 h-3.5 text-emerald-700 stroke-[2.2]"
                aria-hidden="true"
              />
              <span>{securityNotice}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div
            role="group"
            aria-label="Theme mode"
            className="inline-flex items-center p-0.5 rounded-lg bg-[var(--rico-bg-base)] border border-[var(--rico-border-weak)]"
          >
            <button
              type="button"
              aria-pressed={activeResolvedTheme === "light"}
              onClick={() => {
                setTheme("light");
                flashSecurityNotice("Light mode enabled");
              }}
              className={`h-7 px-2.5 rounded-md text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/40 ${
                activeResolvedTheme === "light"
                  ? "bg-[var(--rico-surface-elevated)] text-[var(--rico-text-strong)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                  : "text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)]"
              }`}
            >
              <Sun className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Light</span>
            </button>
            <button
              type="button"
              aria-pressed={activeResolvedTheme === "dark"}
              onClick={() => {
                setTheme("dark");
                flashSecurityNotice("Dark mode enabled");
              }}
              className={`h-7 px-2.5 rounded-md text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/40 ${
                activeResolvedTheme === "dark"
                  ? "bg-[var(--rico-surface-elevated)] text-[var(--rico-text-strong)] shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                  : "text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)]"
              }`}
            >
              <Moon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Dark</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Settings and return home"
            title="Back to home (Esc)"
            className="w-9 h-9 rounded-full bg-[var(--rico-surface-base)] hover:bg-[var(--rico-border-weak)] text-[var(--rico-text-strong)] flex items-center justify-center shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/40"
          >
            <X className="w-[18px] h-[18px] stroke-[2]" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile Section Strip */}
      <div
        role="tablist"
        aria-label="Settings sections"
        className="md:hidden px-4 py-2.5 border-b border-[#E6E4E3] bg-[#F8F7F7] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0"
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
              className={`h-9 px-3.5 rounded-full text-[13px] font-medium inline-flex items-center gap-2 whitespace-nowrap transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
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

      {/* Main Two-Column Responsive Layout */}
      <div className="flex-1 min-h-0 flex flex-row overflow-hidden">
        <nav
          aria-label="Settings categories"
          className="hidden md:flex w-56 lg:w-64 shrink-0 border-r border-[#E6E4E3] bg-[#F8F7F7]/60 p-4 lg:p-5 flex-col gap-1.5"
        >
          {navItems.map((item) => {
            const selected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={selected ? "page" : undefined}
                className={`w-full h-10 px-3.5 rounded-lg text-[13.5px] font-medium flex items-center gap-3 text-left transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
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

        {/* Content Column — Balanced Laptop Width */}
        <div className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8 rico-scroller">
          <div className="w-full max-w-3xl xl:max-w-4xl mx-auto space-y-6">
            {/* 1. PROFILE */}
            {activeTab === "profile" && (
              <>
                <div>
                  <h2 className="m-0 text-[18px] sm:text-[19px] font-semibold tracking-[-0.015em] text-[#1E1B1B]">
                    Profile
                  </h2>
                  <p className="m-0 mt-1 text-[13px] sm:text-[13.5px] text-[#5C5858]">
                    Photo and personal details.
                  </p>
                </div>

                <section className="rounded-xl border border-[#E6E4E3] bg-white p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-full border border-[#E6E4E3] bg-[#F1EFEF] overflow-hidden flex items-center justify-center shrink-0">
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
                        <div className={rowTitleClass}>Profile photo</div>
                        <p className={rowDescClass}>PNG, JPG, or WebP.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={uploadingPhoto}
                        onClick={() => fileInputRef.current?.click()}
                        className="h-9 px-3.5 rounded-lg border border-[#D6D3D1] bg-white hover:bg-[#F8F7F7] text-[13px] font-medium text-[#1E1B1B] inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:opacity-60"
                      >
                        {uploadingPhoto ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span>
                          {avatarUrl ? "Change photo" : "Upload photo"}
                        </span>
                      </button>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          aria-label="Remove profile photo"
                          className="h-9 px-3 rounded-lg border border-[#E6E4E3] bg-white hover:bg-[#F8F7F7] text-[13px] font-medium text-[#5C5858] hover:text-[#1E1B1B] inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#F1EFEF] flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-[13px] text-[#5C5858]">
                      Default avatars
                    </span>
                    <div className="flex items-center gap-2.5">
                      {PRESET_AVATARS.map((src, i) => {
                        const selected = avatarUrl === src;
                        return (
                          <button
                            key={src}
                            type="button"
                            onClick={() => handleSelectPresetAvatar(src)}
                            aria-label={`Select default avatar ${i + 1}`}
                            aria-pressed={selected}
                            className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
                              selected
                                ? "border-[var(--rico-primary-bg)] scale-105"
                                : "border-transparent hover:border-[var(--rico-border-base)]"
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
                    <p className="m-0 text-[13px] text-red-600" role="alert">
                      {photoError}
                    </p>
                  )}
                </section>

                <form
                  onSubmit={handleProfileSubmit}
                  className="rounded-xl border border-[#E6E4E3] bg-white p-5 sm:p-6 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="rico-first-name"
                        className="block text-[13px] font-medium text-[#1E1B1B]"
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
                        className="block text-[13px] font-medium text-[#1E1B1B]"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="rico-profile-email"
                        className="block text-[13px] font-medium text-[#1E1B1B]"
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
                      {emailError && (
                        <p
                          id="rico-profile-email-error"
                          className="m-0 text-xs text-red-600"
                        >
                          {emailError}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="rico-role-title"
                        className="block text-[13px] font-medium text-[#1E1B1B]"
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
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    {savedBanner && (
                      <span className="text-[13px] font-medium text-emerald-700 inline-flex items-center gap-1">
                        <Check
                          className="w-4 h-4 stroke-[2.5]"
                          aria-hidden="true"
                        />
                        <span>Saved</span>
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={!hasUnsavedProfileChanges}
                      className="h-9 px-4 rounded-lg bg-[#1E1B1B] hover:bg-[#332F2F] text-white text-[13px] font-medium transition-colors disabled:opacity-45 disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25"
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
                  <h2 className="m-0 text-[18px] sm:text-[19px] font-semibold tracking-[-0.015em] text-[#1E1B1B]">
                    Preferences
                  </h2>
                  <p className="m-0 mt-1 text-[13px] sm:text-[13.5px] text-[#5C5858]">
                    Appearance, language, currency, and default model.
                  </p>
                </div>

                <section className="rounded-xl border border-[#E6E4E3] bg-white divide-y divide-[#F1EFEF]">
                  <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className={`${rowTitleClass} block`}>
                        Appearance
                      </span>
                      <p className={rowDescClass}>
                        Switch between Light and Dark theme across the workspace.
                      </p>
                    </div>

                    <div
                      role="radiogroup"
                      aria-label="Appearance theme"
                      className="inline-flex items-center p-1 rounded-lg bg-[var(--rico-bg-base)] border border-[var(--rico-border-weak)]"
                    >
                      {(
                        [
                          {
                            id: "light",
                            label: "Light",
                            icon: <Sun className="w-3.5 h-3.5" aria-hidden="true" />,
                          },
                          {
                            id: "dark",
                            label: "Dark",
                            icon: <Moon className="w-3.5 h-3.5" aria-hidden="true" />,
                          },
                          {
                            id: "system",
                            label: "System",
                            icon: (
                              <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
                            ),
                          },
                        ] as const
                      ).map((opt) => {
                        const selected = currentThemeSelection === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => {
                              setTheme(opt.id);
                              flashSecurityNotice(
                                opt.id === "system"
                                  ? "Following system theme"
                                  : `${opt.label} mode enabled`
                              );
                            }}
                            className={`h-8 px-3 rounded-md text-[12.5px] font-medium inline-flex items-center gap-1.5 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rico-accent)]/40 ${
                              selected
                                ? "bg-[var(--rico-surface-elevated)] text-[var(--rico-text-strong)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                                : "text-[var(--rico-text-base)] hover:text-[var(--rico-text-strong)]"
                            }`}
                          >
                            {opt.icon}
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <label
                        htmlFor="rico-pref-lang"
                        className={`${rowTitleClass} block`}
                      >
                        Language
                      </label>
                      <p className={rowDescClass}>App display language.</p>
                    </div>
                    <select
                      id="rico-pref-lang"
                      value={language}
                      onChange={(e) => onSelectLanguage(e.target.value)}
                      className="h-9 px-3.5 rounded-lg border border-[#D6D3D1] bg-[#FCFCFC] text-[13px] font-medium text-[#1E1B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
                    >
                      {languageOptions.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <label
                        htmlFor="rico-pref-currency"
                        className={`${rowTitleClass} block`}
                      >
                        Default currency
                      </label>
                      <p className={rowDescClass}>
                        Used across caps and receipts.
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
                      className="h-9 px-3.5 rounded-lg border border-[#D6D3D1] bg-[#FCFCFC] text-[13px] font-mono font-medium text-[#1E1B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>

                  <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <label
                        htmlFor="rico-pref-model"
                        className={`${rowTitleClass} block`}
                      >
                        Default AI model
                      </label>
                      <p className={rowDescClass}>Selected for new chats.</p>
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
                      className="h-9 max-w-full sm:max-w-[280px] px-3.5 rounded-lg border border-[#D6D3D1] bg-[#FCFCFC] text-[13px] font-medium text-[#1E1B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
                    >
                      {Array.from(
                        new Set(modelOptions.map((o) => o.group || "Models"))
                      ).map((groupName) => (
                        <optgroup key={groupName} label={groupName}>
                          {modelOptions
                            .filter((o) => (o.group || "Models") === groupName)
                            .map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.description
                                  ? `${opt.label} — ${opt.description}`
                                  : opt.label}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </section>
              </>
            )}

            {/* 3. SECURITY & PRIVACY */}
            {activeTab === "security" && (
              <>
                <div>
                  <h2 className="m-0 text-[18px] sm:text-[19px] font-semibold tracking-[-0.015em] text-[#1E1B1B]">
                    Security &amp; privacy
                  </h2>
                  <p className="m-0 mt-1 text-[13px] sm:text-[13.5px] text-[#5C5858]">
                    Sign-in verification, workspace protection, and privacy.
                  </p>
                </div>

                {/* Auth & Verifications */}
                <section className="rounded-xl border border-[#E6E4E3] bg-white divide-y divide-[#F1EFEF]">
                  {/* Passkeys */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <Fingerprint
                          className={rowIconClass}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <span className={`${rowTitleClass} block`}>
                            Passkeys
                          </span>
                          <p className={rowDescClass}>
                            Sign in with Face ID or fingerprint.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={addingPasskey}
                        onClick={handleRegisterPasskey}
                        className="h-9 px-3.5 rounded-lg border border-[#D6D3D1] bg-white hover:bg-[#F8F7F7] text-[13px] font-medium text-[#1E1B1B] inline-flex items-center gap-1.5 shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 disabled:opacity-60"
                      >
                        {addingPasskey ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span>Add</span>
                      </button>
                    </div>

                    {security.passkeys.length > 0 && (
                      <div className="pl-7 flex flex-wrap gap-2">
                        {security.passkeys.map((pk) => (
                          <span
                            key={pk.id}
                            className="inline-flex items-center gap-2 pl-3 pr-2 py-1 rounded-md bg-[#F8F7F7] border border-[#E6E4E3] text-[12.5px] text-[#1E1B1B]"
                          >
                            <span>{pk.name}</span>
                            <button
                              type="button"
                              aria-label={`Remove ${pk.name}`}
                              onClick={() =>
                                updateSecurity(
                                  (prev) => ({
                                    ...prev,
                                    passkeys: prev.passkeys.filter(
                                      (item) => item.id !== pk.id
                                    ),
                                  }),
                                  "Passkey removed"
                                )
                              }
                              className="p-0.5 rounded text-[#8A8585] hover:text-[#1E1B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
                            >
                              <X className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Authenticator App */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <Smartphone
                          className={rowIconClass}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <span className={`${rowTitleClass} block`}>
                            Authenticator app (2FA)
                          </span>
                          <p className={rowDescClass}>
                            Verify login with a 6-digit code.
                          </p>
                        </div>
                      </div>

                      {security.twoFactorEnabled ? (
                        <button
                          type="button"
                          onClick={() =>
                            updateSecurity(
                              (prev) => ({
                                ...prev,
                                twoFactorEnabled: false,
                              }),
                              "Authenticator disabled"
                            )
                          }
                          className="h-9 px-3.5 rounded-lg border border-[#E6E4E3] bg-white hover:bg-[#F8F7F7] text-[13px] font-medium text-[#5C5858] hover:text-[#1E1B1B] shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
                        >
                          Turn off
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setShowTwoFactorSetup((v) => !v);
                            setTotpError(null);
                          }}
                          className="h-9 px-3.5 rounded-lg border border-[#D6D3D1] bg-white hover:bg-[#F8F7F7] text-[13px] font-medium text-[#1E1B1B] shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
                        >
                          {showTwoFactorSetup ? "Cancel" : "Enable"}
                        </button>
                      )}
                    </div>

                    {showTwoFactorSetup && !security.twoFactorEnabled && (
                      <form
                        onSubmit={handleConfirmTwoFactor}
                        className="ml-7 flex flex-wrap items-center gap-2"
                      >
                        <label htmlFor="rico-totp-code" className="sr-only">
                          6-digit authenticator code
                        </label>
                        <input
                          id="rico-totp-code"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={totpCode}
                          onChange={(e) => {
                            setTotpCode(e.target.value);
                            if (totpError) setTotpError(null);
                          }}
                          placeholder="6-digit code"
                          className="h-9 w-40 px-3 rounded-lg border border-[#D6D3D1] bg-[#FCFCFC] text-[13px] font-mono tabular-nums text-[#1E1B1B] placeholder:font-sans placeholder:text-[#8A8585] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/30"
                        />
                        <button
                          type="submit"
                          className="h-9 px-3.5 rounded-lg bg-[#1E1B1B] hover:bg-[#332F2F] text-white text-[13px] font-medium shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25"
                        >
                          Verify
                        </button>
                        {totpError && (
                          <span
                            className="text-[12.5px] text-red-600"
                            role="alert"
                          >
                            {totpError}
                          </span>
                        )}
                      </form>
                    )}
                  </div>

                  {/* New Device Email Code */}
                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <MailCheck className={rowIconClass} aria-hidden="true" />
                      <div className="min-w-0">
                        <span className={`${rowTitleClass} block`}>
                          New device verification
                        </span>
                        <p className={rowDescClass}>
                          Email a code on unrecognized browsers.
                        </p>
                      </div>
                    </div>
                    <SettingsSwitch
                      checked={security.newDeviceOtp}
                      ariaLabel="New device verification"
                      onToggle={() =>
                        updateSecurity((prev) => ({
                          ...prev,
                          newDeviceOtp: !prev.newDeviceOtp,
                        }))
                      }
                    />
                  </div>

                  {/* Connected Accounts */}
                  <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3.5">
                    <div className="min-w-0">
                      <span className={`${rowTitleClass} block`}>
                        Connected sign-in
                      </span>
                      <p className={rowDescClass}>
                        Link accounts for 1-click login.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {(
                        [
                          { key: "google", label: "Google", brand: "google" },
                          { key: "github", label: "GitHub", brand: "github" },
                          {
                            key: "microsoft",
                            label: "Microsoft",
                            brand: "microsoft",
                          },
                        ] as const
                      ).map((item) => {
                        const linked = security.linkedProviders[item.key];
                        return (
                          <button
                            key={item.key}
                            type="button"
                            aria-pressed={linked}
                            onClick={() =>
                              updateSecurity(
                                (prev) => ({
                                  ...prev,
                                  linkedProviders: {
                                    ...prev.linkedProviders,
                                    [item.key]: !linked,
                                  },
                                }),
                                linked
                                  ? `${item.label} disconnected`
                                  : `${item.label} connected`
                              )
                            }
                            className={`h-9 px-3 rounded-lg border text-[13px] font-medium inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40 ${
                              linked
                                ? "border-[#1E1B1B]/25 bg-[#F8F7F7] text-[#1E1B1B]"
                                : "border-[#E6E4E3] bg-white text-[#5C5858] hover:text-[#1E1B1B] hover:bg-[#F8F7F7]"
                            }`}
                          >
                            <BrandMark
                              brand={item.brand}
                              className="w-4 h-4 object-contain shrink-0"
                            />
                            <span>{item.label}</span>
                            {linked && (
                              <Check
                                className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* Rico Security & Privacy */}
                <section className="rounded-xl border border-[#E6E4E3] bg-white divide-y divide-[#F1EFEF]">
                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <KeyRound className={rowIconClass} aria-hidden="true" />
                      <div className="min-w-0">
                        <span className={`${rowTitleClass} block`}>
                          Server key vault
                        </span>
                        <p className={rowDescClass}>
                          Keep app tokens hidden from chat models.
                        </p>
                      </div>
                    </div>
                    <SettingsSwitch
                      checked={security.zeroSecretVault}
                      ariaLabel="Server key vault"
                      onToggle={() =>
                        updateSecurity((prev) => ({
                          ...prev,
                          zeroSecretVault: !prev.zeroSecretVault,
                        }))
                      }
                    />
                  </div>

                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <GlobeLock className={rowIconClass} aria-hidden="true" />
                      <div className="min-w-0">
                        <span className={`${rowTitleClass} block`}>
                          Clear browser data
                        </span>
                        <p className={rowDescClass}>
                          Wipe cookies after each price check.
                        </p>
                      </div>
                    </div>
                    <SettingsSwitch
                      checked={security.isolatedBrowserSandbox}
                      ariaLabel="Clear browser data"
                      onToggle={() =>
                        updateSecurity((prev) => ({
                          ...prev,
                          isolatedBrowserSandbox: !prev.isolatedBrowserSandbox,
                        }))
                      }
                    />
                  </div>

                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <EyeOff className={rowIconClass} aria-hidden="true" />
                      <div className="min-w-0">
                        <span className={`${rowTitleClass} block`}>
                          Mask sensitive details
                        </span>
                        <p className={rowDescClass}>
                          Hide card digits and addresses in prompts.
                        </p>
                      </div>
                    </div>
                    <SettingsSwitch
                      checked={security.redactPiiForAi}
                      ariaLabel="Mask sensitive details"
                      onToggle={() =>
                        updateSecurity((prev) => ({
                          ...prev,
                          redactPiiForAi: !prev.redactPiiForAi,
                        }))
                      }
                    />
                  </div>

                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <FileLock2 className={rowIconClass} aria-hidden="true" />
                      <div className="min-w-0">
                        <span className={`${rowTitleClass} block`}>
                          Private data mode
                        </span>
                        <p className={rowDescClass}>
                          Never share chats or receipts for training.
                        </p>
                      </div>
                    </div>
                    <SettingsSwitch
                      checked={security.privateDataMode}
                      ariaLabel="Private data mode"
                      onToggle={() =>
                        updateSecurity((prev) => ({
                          ...prev,
                          privateDataMode: !prev.privateDataMode,
                        }))
                      }
                    />
                  </div>

                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <Laptop className={rowIconClass} aria-hidden="true" />
                      <div className="min-w-0">
                        <span className={`${rowTitleClass} block`}>
                          Active sessions
                        </span>
                        <p className={rowDescClass}>
                          This browser · Active now
                        </p>
                      </div>
                    </div>

                    {!security.otherDevicesRevoked ? (
                      <button
                        type="button"
                        onClick={() =>
                          updateSecurity(
                            (prev) => ({
                              ...prev,
                              otherDevicesRevoked: true,
                            }),
                            "Other sessions signed out"
                          )
                        }
                        className="h-9 px-3.5 rounded-lg border border-[#E6E4E3] bg-white hover:bg-[#F8F7F7] text-[13px] font-medium text-[#5C5858] hover:text-[#1E1B1B] shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
                      >
                        Sign out others
                      </button>
                    ) : (
                      <span className="text-[13px] text-[#8A8585] shrink-0">
                        1 active device
                      </span>
                    )}
                  </div>
                </section>
              </>
            )}

            {/* 4. PAYMENT SECURITY */}
            {activeTab === "account" && (
              <>
                <div>
                  <h2 className="m-0 text-[18px] sm:text-[19px] font-semibold tracking-[-0.015em] text-[#1E1B1B]">
                    Payment security
                  </h2>
                  <p className="m-0 mt-1 text-[13px] sm:text-[13.5px] text-[#5C5858]">
                    Approvals, spending limits, payment rails, and account.
                  </p>
                </div>

                {/* Payment Verification & Limits */}
                <section className="rounded-xl border border-[#E6E4E3] bg-white divide-y divide-[#F1EFEF]">
                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <ShieldCheck
                        className={rowIconClass}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <span className={`${rowTitleClass} block`}>
                          Ask before every payment
                        </span>
                        <p className={rowDescClass}>
                          Confirm manually before any charge.
                        </p>
                      </div>
                    </div>
                    <SettingsSwitch
                      checked={strictMode}
                      ariaLabel="Ask before every payment"
                      onToggle={onToggleStrictMode}
                    />
                  </div>

                  <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <Fingerprint
                        className={rowIconClass}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <label
                          htmlFor="rico-step-up-threshold"
                          className={`${rowTitleClass} block`}
                        >
                          Face ID / code check
                        </label>
                        <p className={rowDescClass}>
                          Extra verification before larger charges.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-auto">
                      {security.stepUpPayments && (
                        <select
                          id="rico-step-up-threshold"
                          value={security.stepUpThreshold}
                          onChange={(e) =>
                            updateSecurity(
                              (prev) => ({
                                ...prev,
                                stepUpThreshold: e.target
                                  .value as StoredSecurityState["stepUpThreshold"],
                              }),
                              "Limit updated"
                            )
                          }
                          className="h-9 px-3 rounded-lg border border-[#D6D3D1] bg-[#FCFCFC] text-[13px] font-mono font-medium text-[#1E1B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
                        >
                          <option value="0">Always</option>
                          <option value="25">
                            Over {currencySymbol}25
                          </option>
                          <option value="50">
                            Over {currencySymbol}50
                          </option>
                          <option value="100">
                            Over {currencySymbol}100
                          </option>
                        </select>
                      )}
                      <SettingsSwitch
                        checked={security.stepUpPayments}
                        ariaLabel="Face ID or code check"
                        onToggle={() =>
                          updateSecurity((prev) => ({
                            ...prev,
                            stepUpPayments: !prev.stepUpPayments,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <TrendingUp className={rowIconClass} aria-hidden="true" />
                      <div className="min-w-0">
                        <label
                          htmlFor="rico-spike-limit"
                          className={`${rowTitleClass} block`}
                        >
                          Price-spike hold
                        </label>
                        <p className={rowDescClass}>
                          Hold renewal if subscription price rises.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-auto">
                      {security.priceSpikeHold && (
                        <select
                          id="rico-spike-limit"
                          value={security.priceSpikeLimit}
                          onChange={(e) =>
                            updateSecurity(
                              (prev) => ({
                                ...prev,
                                priceSpikeLimit: e.target
                                  .value as StoredSecurityState["priceSpikeLimit"],
                              }),
                              "Hold limit updated"
                            )
                          }
                          className="h-9 px-3 rounded-lg border border-[#D6D3D1] bg-[#FCFCFC] text-[13px] font-medium text-[#1E1B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034CFF]/40"
                        >
                          <option value="1">Any rise</option>
                          <option value="10">10%+</option>
                          <option value="20">20%+</option>
                        </select>
                      )}
                      <SettingsSwitch
                        checked={security.priceSpikeHold}
                        ariaLabel="Price-spike hold"
                        onToggle={() =>
                          updateSecurity((prev) => ({
                            ...prev,
                            priceSpikeHold: !prev.priceSpikeHold,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <Bell className={rowIconClass} aria-hidden="true" />
                      <div className="min-w-0">
                        <span className={`${rowTitleClass} block`}>
                          Price increase alerts
                        </span>
                        <p className={rowDescClass}>
                          Notify when a subscription changes price.
                        </p>
                      </div>
                    </div>
                    <SettingsSwitch
                      checked={priceAlerts}
                      ariaLabel="Price increase alerts"
                      onToggle={() => {
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
                    />
                  </div>

                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <CreditCard className={rowIconClass} aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={rowTitleClass}>
                            Backup card failover
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F8F7F7] border border-[#E6E4E3]">
                            <BrandMark
                              brand="paypal"
                              className="w-3.5 h-3.5 object-contain"
                            />
                            <span className="text-[11px] text-[#8A8585]">
                              →
                            </span>
                            <BrandMark
                              brand="card"
                              className="w-4 h-4 object-contain"
                            />
                          </span>
                        </div>
                        <p className={rowDescClass}>
                          Use backup card only if PayPal fails.
                        </p>
                      </div>
                    </div>
                    <SettingsSwitch
                      checked={security.backupCardFailover}
                      ariaLabel="Backup card failover"
                      onToggle={() =>
                        updateSecurity((prev) => ({
                          ...prev,
                          backupCardFailover: !prev.backupCardFailover,
                        }))
                      }
                    />
                  </div>
                </section>

                {/* Emergency & Session */}
                <section className="rounded-xl border border-[#E6E4E3] bg-white divide-y divide-[#F1EFEF]">
                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <CirclePause
                        className={rowIconClass}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <span className={`${rowTitleClass} block`}>
                          Pause all payments
                        </span>
                        <p className={rowDescClass}>
                          Stop all scheduled charges until turned off.
                        </p>
                      </div>
                    </div>
                    <SettingsSwitch
                      checked={security.emergencyFreeze}
                      danger
                      ariaLabel="Pause all payments"
                      onToggle={() =>
                        updateSecurity(
                          (prev) => ({
                            ...prev,
                            emergencyFreeze: !prev.emergencyFreeze,
                          }),
                          !security.emergencyFreeze
                            ? "Payments paused"
                            : "Payments resumed"
                        )
                      }
                    />
                  </div>

                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <User className={rowIconClass} aria-hidden="true" />
                      <div className="min-w-0">
                        <span className={`${rowTitleClass} block`}>
                          Account session
                        </span>
                        <p className={`${rowDescClass} truncate`}>
                          {isAuthenticated && user
                            ? `Signed in as ${user.email}`
                            : "Browsing as guest"}
                        </p>
                      </div>
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
                        className="h-9 px-4 rounded-lg border border-[#D6D3D1] bg-white hover:bg-[#F8F7F7] text-[13px] font-medium text-[#1E1B1B] inline-flex items-center gap-2 shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:opacity-60"
                      >
                        {loggingOut ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <LogOut className="w-4 h-4" aria-hidden="true" />
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
                        className="h-9 px-4 rounded-lg bg-[#1E1B1B] hover:bg-[#332F2F] text-white text-[13px] font-medium inline-flex items-center gap-2 shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25"
                      >
                        <LogIn className="w-4 h-4" aria-hidden="true" />
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
