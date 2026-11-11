"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { LivingRicoLogo } from "@/components/home/LivingRicoLogo";

type FieldName = "name" | "email" | "company" | "message";

interface FormValues {
  name: string;
  email: string;
  company: string;
  teamSize: string;
  message: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(field: FieldName, value: string): string | undefined {
  const trimmed = value.trim();
  switch (field) {
    case "name":
      return trimmed.length < 2 ? "Enter your full name." : undefined;
    case "email":
      return !EMAIL_PATTERN.test(trimmed)
        ? "Enter a valid work email (for example, alex@company.com)."
        : undefined;
    case "company":
      return trimmed.length < 2
        ? "Enter your company or organization name."
        : undefined;
    case "message":
      return trimmed.length < 8
        ? "Share a few details about how we can help."
        : undefined;
  }
}

export function EnterpriseContactSection() {
  const prefersReducedMotion = useReducedMotion();
  const [isScrolled, setIsScrolled] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 48);
  });

  const [values, setValues] = useState<FormValues>({
    name: "",
    email: "",
    company: "",
    teamSize: "10–50",
    message: "",
  });
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    email: string;
    inquiryId: string;
  } | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (
    field: keyof FormValues,
    value: string
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError(null);

    if (
      (field === "name" ||
        field === "email" ||
        field === "company" ||
        field === "message") &&
      touched[field]
    ) {
      const nextErr = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: nextErr }));
    }
  };

  const handleBlur = (field: FieldName) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const nextErr = validateField(field, values[field]);
    setErrors((prev) => ({ ...prev, [field]: nextErr }));
  };

  const focusFirstInvalid = (nextErrors: Partial<Record<FieldName, string>>) => {
    if (nextErrors.name) {
      nameRef.current?.focus();
    } else if (nextErrors.email) {
      emailRef.current?.focus();
    } else if (nextErrors.company) {
      companyRef.current?.focus();
    } else if (nextErrors.message) {
      messageRef.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const nextErrors: Partial<Record<FieldName, string>> = {
      name: validateField("name", values.name),
      email: validateField("email", values.email),
      company: validateField("company", values.company),
      message: validateField("message", values.message),
    };

    setTouched({
      name: true,
      email: true,
      company: true,
      message: true,
    });
    setErrors(nextErrors);

    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (hasErrors) {
      focusFirstInvalid(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/enterprise-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (data.fieldErrors) {
          setErrors(data.fieldErrors);
          focusFirstInvalid(data.fieldErrors);
        }
        setFormError(
          data.error ||
            "Could not send your message right now. Please try again."
        );
        return;
      }

      setSubmittedData({
        name: values.name.trim(),
        email: values.email.trim(),
        inquiryId: data.inquiryId ?? "ent_confirmed",
      });
    } catch {
      setFormError(
        "Network error while sending your inquiry. Please retry or email licensing@rico.app."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedData(null);
    setValues({
      name: "",
      email: "",
      company: "",
      teamSize: "10–50",
      message: "",
    });
    setTouched({});
    setErrors({});
    setFormError(null);
  };

  return (
    <section
      aria-labelledby="enterprise-contact-heading"
      className="box-border w-full shrink-0 overflow-hidden relative flex flex-col items-center pb-16 sm:pb-24"
    >
      {/* Full-bleed Sky Background matching Pricing Page */}
      <motion.div
        initial={{ scale: prefersReducedMotion ? 1 : 1.06 }}
        animate={
          prefersReducedMotion
            ? { scale: 1 }
            : { scale: [1.06, 1.0, 1.06] }
        }
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        className="box-border w-full h-full absolute inset-0 bg-[url('/assets/sky-day-1672.jpg')] bg-no-repeat bg-cover bg-center [z-index:0]"
      />

      {/* Pricing Sky Tint */}
      <div className="box-border w-full h-full absolute inset-0 [background-image:linear-gradient(180deg,_#0E26501F_0%,_#0C285C47_35%,_#1A3F7A4D_72%,_#09090B00_100%)] bg-no-repeat bg-[length:100%_100%] [z-index:1]" />

      {/* Ambient floating light orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden [z-index:1]"
      >
        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  x: [0, 40, -20, 0],
                  y: [0, -30, 20, 0],
                  opacity: [0.22, 0.42, 0.22],
                }
          }
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[22%] w-[360px] h-[360px] rounded-full bg-white/10 blur-[90px]"
        />
        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  x: [0, -50, 30, 0],
                  y: [0, 25, -25, 0],
                  opacity: [0.16, 0.36, 0.16],
                }
          }
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[24%] right-[18%] w-[420px] h-[420px] rounded-full bg-[#B4CFEE]/20 blur-[110px]"
        />
      </div>

      {/* Pricing Sky Bottom Veil */}
      <div className="box-border w-full h-[360px] absolute inset-x-0 bottom-0 [background-image:linear-gradient(180deg,_#09090B00_0%,_#09090B33_28%,_#09090B8C_61%,_#09090BE0_86%,_#09090B_100%)] bg-no-repeat bg-[length:100%_100%] [z-index:2]" />

      {/* Spacer for fixed header */}
      <div className="w-full h-[64px] shrink-0" />

      {/* Fixed Site Navigation (identical to Pricing Page) */}
      <motion.header
        initial={prefersReducedMotion ? false : { opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`box-border w-full fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
          isScrolled
            ? "bg-[#09090B]/75 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
            : "bg-transparent"
        }`}
      >
        <div className="w-full max-w-[1280px] mx-auto h-[64px] px-4 sm:px-6 lg:px-[40px] flex flex-row justify-between items-center">
          <LivingRicoLogo showStageBadge={true} />

          <nav
            aria-label="Primary"
            className="box-border hidden md:flex w-fit shrink-0 h-fit flex-row gap-[4px] justify-start items-center"
          >
            {[
              { label: "Docs", href: "/docs" },
              { label: "Workflows", href: "/workflows" },
              { label: "Pricing", href: "/pricing" },
              { label: "Roadmap", href: "/roadmap" },
              { label: "Changelog", href: "/changelog" },
              { label: "About", href: "/about" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="no-underline rounded-[999px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E2650]"
              >
                <motion.span
                  whileHover={
                    prefersReducedMotion
                      ? undefined
                      : { scale: 1.04, backgroundColor: "rgba(255,255,255,0.12)" }
                  }
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                  className="box-border w-fit shrink-0 h-fit flex flex-row gap-0 p-[6px_12px] justify-center items-center rounded-[999px] transition-colors cursor-pointer"
                >
                  <span className="text-[14px]/[normal] box-border text-[#FFFFFFD9] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.08px] text-left whitespace-nowrap">
                    {item.label}
                  </span>
                </motion.span>
              </Link>
            ))}
          </nav>

          <div className="box-border w-fit shrink-0 h-fit flex flex-row gap-[10px] justify-start items-center">
            <motion.a
              href="https://github.com/abrarnasirjaffari/Rico-Website"
              target="_blank"
              rel="noreferrer"
              whileHover={
                prefersReducedMotion
                  ? undefined
                  : { scale: 1.04, backgroundColor: "rgba(255,255,255,0.12)" }
              }
              whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
              className="box-border w-fit shrink-0 h-[40px] sm:h-[34px] flex flex-row gap-[7px] p-[0px_14px_0px_11px] justify-start items-center [outline:1px_solid_#FFFFFF66] [outline-offset:-0.5px] rounded-[999px] cursor-pointer no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E2650]"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
                className="box-border w-[15px] shrink-0 h-[15px] overflow-visible"
              >
                <path
                  d="M12 0.297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385 0.6 0.113 0.82-0.258 0.82-0.577 0-0.285-0.01-1.04-0.015-2.04-3.338 0.724-4.042-1.61-4.042-1.61-0.546-1.385-1.335-1.755-1.335-1.755-1.087-0.744 0.084-0.729 0.084-0.729 1.205 0.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495 0.998 0.108-0.776 0.417-1.305 0.76-1.605-2.665-0.3-5.466-1.332-5.466-5.93 0-1.31 0.465-2.38 1.235-3.22-0.135-0.303-0.54-1.523 0.105-3.176 0 0 1.005-0.322 3.3 1.23 0.96-0.267 1.98-0.399 3-0.405 1.02 0.006 2.04 0.138 3 0.405 2.28-1.552 3.285-1.23 3.285-1.23 0.645 1.653 0.24 2.873 0.12 3.176 0.765 0.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92 0.42 0.36 0.81 1.096 0.81 2.22 0 1.606-0.015 2.896-0.015 3.286 0 0.315 0.21 0.69 0.825 0.57 4.801-1.574 8.236-6.074 8.236-11.369 0-6.627-5.373-12-12-12"
                  fill="#FFFFFF"
                />
              </svg>
              <span className="text-[14px]/[normal] box-border text-[#FFFFFF] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.14px] text-left whitespace-nowrap">
                GitHub
              </span>
            </motion.a>
          </div>
        </div>
      </motion.header>

      {/* Enterprise Form Header */}
      <div className="box-border w-full max-w-[680px] px-4 pt-[56px] sm:pt-[76px] lg:pt-[88px] h-fit flex flex-col gap-[16px] justify-start items-center relative [z-index:4]">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href="/pricing"
            className="inline-flex min-h-[40px] items-center gap-2 px-4 py-1.5 rounded-[999px] bg-[#FFFFFF17] hover:bg-[#FFFFFF26] [outline:1px_solid_#FFFFFF40] [outline-offset:-0.5px] text-[13.5px]/[18px] text-[#FFFFFFF0] font-[Geist,system-ui,sans-serif] font-medium no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#173668]"
          >
            <ArrowLeft aria-hidden="true" className="w-3.5 h-3.5" />
            <span>Back to Pricing</span>
          </Link>
        </motion.div>

        <h1
          id="enterprise-contact-heading"
          className="m-0 flex flex-col items-center text-center"
        >
          <motion.span
            initial={
              prefersReducedMotion
                ? false
                : { opacity: 0, y: 20, filter: "blur(8px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="text-[38px]/[40px] sm:text-[52px]/[54px] lg:text-[60px]/[62px] text-[#FFFFFF] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-1.9px] sm:tracking-[-2.4px] lg:tracking-[-2.8px]"
          >
            RICO for
          </motion.span>
          <motion.span
            initial={
              prefersReducedMotion
                ? false
                : { opacity: 0, y: 20, filter: "blur(8px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="text-[38px]/[40px] sm:text-[52px]/[54px] lg:text-[60px]/[62px] text-[#FFFFFFD1] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-1.9px] sm:tracking-[-2.4px] lg:tracking-[-2.8px]"
          >
            Enterprise.
          </motion.span>
        </h1>

        <motion.p
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="m-0 text-[16px]/[25px] sm:text-[18px]/[28px] text-[#FFFFFFF0] font-[Geist,system-ui,sans-serif] font-normal text-center max-w-[500px]"
        >
          Tell us about your team, compliance requirements, or custom deployment.
          We respond within one business day.
        </motion.p>
      </div>

      {/* Compact Frosted Sky-Glass Enterprise Form Card */}
      <motion.div
        initial={
          prefersReducedMotion
            ? false
            : { opacity: 0, y: 32, scale: 0.97 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="box-border w-full max-w-[512px] px-4 mt-[36px] sm:mt-[44px] relative [z-index:5]"
      >
        <div className="box-border w-full [backdrop-filter:blur(14px)] flex flex-col p-[26px] sm:p-[32px] bg-[#203354AB] [outline:1px_solid_#FFFFFF80] [outline-offset:-0.5px] rounded-[20px] [box-shadow:0px_28px_70px_rgba(10,30,60,0.42)]">
          {submittedData ? (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-start gap-4 py-2"
            >
              <div className="w-11 h-11 rounded-full bg-[#FFFFFF1F] [outline:1px_solid_#FFFFFF59] flex items-center justify-center">
                <Check aria-hidden="true" className="w-5 h-5 text-white" />
              </div>

              <div className="flex flex-col gap-1.5">
                <h2 className="m-0 text-[22px]/[28px] text-[#FFFFFF] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.44px]">
                  Inquiry received
                </h2>
                <p className="m-0 text-[15px]/[23px] text-[#FFFFFFDB] font-[Geist,system-ui,sans-serif]">
                  Thanks, {submittedData.name}. Our enterprise team will reach out
                  to <span className="text-white font-medium">{submittedData.email}</span>{" "}
                  within one business day.
                </p>
              </div>

              <div className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FFFFFF14] [outline:1px_solid_#FFFFFF33] text-[13px]/[19px] text-[#FFFFFFDB] font-[Geist,system-ui,sans-serif]">
                Reference ID: <span className="font-mono text-white">{submittedData.inquiryId}</span>
              </div>

              <div className="w-full flex flex-col sm:flex-row gap-2.5 pt-2">
                <Link
                  href="/pricing"
                  className="flex-1 h-[46px] inline-flex items-center justify-center bg-[#FFFFFF] hover:bg-[#F2F6FF] text-[#0B1F36] font-[Geist,system-ui,sans-serif] font-medium text-[15px] tracking-[-0.18px] rounded-[999px] no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#203354]"
                >
                  Back to Pricing
                </Link>
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-[46px] px-5 inline-flex items-center justify-center bg-[#FFFFFF14] hover:bg-[#FFFFFF24] text-[#FFFFFF] [outline:1px_solid_#FFFFFF4D] font-[Geist,system-ui,sans-serif] font-medium text-[14.5px] rounded-[999px] cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#203354]"
                >
                  Send another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 pb-1 border-b border-[#FFFFFF2E]">
                <div className="text-[19px]/[26px] text-[#FFFFFF] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.38px]">
                  Contact Enterprise Sales
                </div>
                <div className="text-[14px]/[20px] text-[#FFFFFFCC] font-[Geist,system-ui,sans-serif]">
                  Dedicated browser clusters, multi-sig guardrails &amp; custom SLAs.
                </div>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="px-3.5 py-2.5 rounded-[12px] bg-[#7F1D1D]/55 [outline:1px_solid_#FCA5A580] text-[13.5px]/[20px] text-[#FEE2E2] font-[Geist,system-ui,sans-serif]"
                >
                  {formError}
                </div>
              )}

              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="enterprise-name"
                  className="text-[13.5px]/[18px] text-[#FFFFFFF2] font-[Geist,system-ui,sans-serif] font-medium"
                >
                  Full name <span aria-hidden="true" className="text-[#FFFFFFB3]">*</span>
                </label>
                <input
                  ref={nameRef}
                  id="enterprise-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  spellCheck={false}
                  placeholder="Alex Rivera"
                  value={values.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  onBlur={() => handleBlur("name")}
                  aria-invalid={errors.name ? "true" : undefined}
                  aria-describedby={errors.name ? "enterprise-name-error" : undefined}
                  className={`w-full h-[44px] px-3.5 rounded-[12px] bg-[#0B1930]/55 text-[15px] text-[#FFFFFF] placeholder:text-[#FFFFFF78] font-[Geist,system-ui,sans-serif] transition-colors [outline-offset:-0.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#203354] ${
                    errors.name
                      ? "[outline:1px_solid_#FCA5A5]"
                      : "[outline:1px_solid_#FFFFFF3D] hover:[outline-color:#FFFFFF66]"
                  }`}
                />
                {errors.name && (
                  <p
                    id="enterprise-name-error"
                    role="alert"
                    className="m-0 text-[12.5px]/[17px] text-[#FECACA] font-[Geist,system-ui,sans-serif]"
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Work Email */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="enterprise-email"
                  className="text-[13.5px]/[18px] text-[#FFFFFFF2] font-[Geist,system-ui,sans-serif] font-medium"
                >
                  Work email <span aria-hidden="true" className="text-[#FFFFFFB3]">*</span>
                </label>
                <input
                  ref={emailRef}
                  id="enterprise-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="alex@company.com"
                  value={values.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  aria-invalid={errors.email ? "true" : undefined}
                  aria-describedby={errors.email ? "enterprise-email-error" : undefined}
                  className={`w-full h-[44px] px-3.5 rounded-[12px] bg-[#0B1930]/55 text-[15px] text-[#FFFFFF] placeholder:text-[#FFFFFF78] font-[Geist,system-ui,sans-serif] transition-colors [outline-offset:-0.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#203354] ${
                    errors.email
                      ? "[outline:1px_solid_#FCA5A5]"
                      : "[outline:1px_solid_#FFFFFF3D] hover:[outline-color:#FFFFFF66]"
                  }`}
                />
                {errors.email && (
                  <p
                    id="enterprise-email-error"
                    role="alert"
                    className="m-0 text-[12.5px]/[17px] text-[#FECACA] font-[Geist,system-ui,sans-serif]"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Company & Team Size */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label
                    htmlFor="enterprise-company"
                    className="text-[13.5px]/[18px] text-[#FFFFFFF2] font-[Geist,system-ui,sans-serif] font-medium"
                  >
                    Company <span aria-hidden="true" className="text-[#FFFFFFB3]">*</span>
                  </label>
                  <input
                    ref={companyRef}
                    id="enterprise-company"
                    name="company"
                    type="text"
                    required
                    autoComplete="organization"
                    spellCheck={false}
                    placeholder="Acme Corp"
                    value={values.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                    onBlur={() => handleBlur("company")}
                    aria-invalid={errors.company ? "true" : undefined}
                    aria-describedby={
                      errors.company ? "enterprise-company-error" : undefined
                    }
                    className={`w-full h-[44px] px-3.5 rounded-[12px] bg-[#0B1930]/55 text-[15px] text-[#FFFFFF] placeholder:text-[#FFFFFF78] font-[Geist,system-ui,sans-serif] transition-colors [outline-offset:-0.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#203354] ${
                      errors.company
                        ? "[outline:1px_solid_#FCA5A5]"
                        : "[outline:1px_solid_#FFFFFF3D] hover:[outline-color:#FFFFFF66]"
                    }`}
                  />
                  {errors.company && (
                    <p
                      id="enterprise-company-error"
                      role="alert"
                      className="m-0 text-[12.5px]/[17px] text-[#FECACA] font-[Geist,system-ui,sans-serif]"
                    >
                      {errors.company}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="enterprise-team-size"
                    className="text-[13.5px]/[18px] text-[#FFFFFFF2] font-[Geist,system-ui,sans-serif] font-medium"
                  >
                    Team size
                  </label>
                  <select
                    id="enterprise-team-size"
                    name="teamSize"
                    value={values.teamSize}
                    onChange={(e) => handleChange("teamSize", e.target.value)}
                    className="w-full h-[44px] px-3 rounded-[12px] bg-[#0B1930]/75 text-[14.5px] text-[#FFFFFF] font-[Geist,system-ui,sans-serif] [outline:1px_solid_#FFFFFF3D] hover:[outline-color:#FFFFFF66] [outline-offset:-0.5px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#203354]"
                  >
                    <option value="1–10" className="bg-[#0F1B2E] text-white">
                      1–10
                    </option>
                    <option value="10–50" className="bg-[#0F1B2E] text-white">
                      10–50
                    </option>
                    <option value="51–200" className="bg-[#0F1B2E] text-white">
                      51–200
                    </option>
                    <option value="201–1,000" className="bg-[#0F1B2E] text-white">
                      201–1,000
                    </option>
                    <option value="1,000+" className="bg-[#0F1B2E] text-white">
                      1,000+
                    </option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="enterprise-message"
                  className="text-[13.5px]/[18px] text-[#FFFFFFF2] font-[Geist,system-ui,sans-serif] font-medium"
                >
                  How can we help?{" "}
                  <span aria-hidden="true" className="text-[#FFFFFFB3]">
                    *
                  </span>
                </label>
                <textarea
                  ref={messageRef}
                  id="enterprise-message"
                  name="message"
                  required
                  rows={3}
                  placeholder="Tell us about your payment workflows, compliance needs, or target volume..."
                  value={values.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  onBlur={() => handleBlur("message")}
                  aria-invalid={errors.message ? "true" : undefined}
                  aria-describedby={
                    errors.message ? "enterprise-message-error" : undefined
                  }
                  className={`w-full py-2.5 px-3.5 rounded-[12px] bg-[#0B1930]/55 text-[15px]/[22px] text-[#FFFFFF] placeholder:text-[#FFFFFF78] font-[Geist,system-ui,sans-serif] resize-y min-h-[88px] transition-colors [outline-offset:-0.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#203354] ${
                    errors.message
                      ? "[outline:1px_solid_#FCA5A5]"
                      : "[outline:1px_solid_#FFFFFF3D] hover:[outline-color:#FFFFFF66]"
                  }`}
                />
                {errors.message && (
                  <p
                    id="enterprise-message-error"
                    role="alert"
                    className="m-0 text-[12.5px]/[17px] text-[#FECACA] font-[Geist,system-ui,sans-serif]"
                  >
                    {errors.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-1.5">
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  whileHover={
                    prefersReducedMotion || isSubmitting
                      ? undefined
                      : {
                          scale: 1.015,
                          boxShadow: "0px 10px 30px rgba(255, 255, 255, 0.26)",
                        }
                  }
                  whileTap={
                    prefersReducedMotion || isSubmitting
                      ? undefined
                      : { scale: 0.985 }
                  }
                  className="w-full h-[46px] inline-flex items-center justify-center gap-2 bg-[#FFFFFF] hover:bg-[#F5F8FF] disabled:opacity-70 disabled:cursor-not-allowed text-[#0B1F36] font-[Geist,system-ui,sans-serif] font-medium text-[15.5px] tracking-[-0.186px] rounded-[999px] border-0 cursor-pointer select-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#203354]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        aria-hidden="true"
                        className="w-4 h-4 animate-spin text-[#0B1F36]"
                      />
                      <span>Sending inquiry...</span>
                    </>
                  ) : (
                    <span>Contact Enterprise</span>
                  )}
                </motion.button>
              </div>
            </form>
          )}
        </div>
      </motion.div>

      {/* Bottom Note matching Pricing Page Checkout Note */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55 }}
        className="mt-8 px-4 text-[14px]/[21px] box-border text-[#F4F4F685] font-[Geist,system-ui,sans-serif] font-normal text-center relative [z-index:5]"
      >
        SOC 2 Type II · Custom DPAs · Dedicated Headless Browser Clusters
        <br />
        Prefer direct email? Write to{" "}
        <a
          href="mailto:licensing@rico.app"
          className="text-[#F4F4F6CC] hover:text-white underline decoration-[#FFFFFF40] hover:decoration-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm"
        >
          licensing@rico.app
        </a>
        .
      </motion.div>
    </section>
  );
}
