import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PostHogProvider } from "@/components/telemetry/PostHogProvider";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";

export const metadata: Metadata = {
  title: "Rico — Autonomous Financial & Agentic Commerce Agent",
  description:
    "Autonomous financial operations, collaborative documents, spreadsheets, live browser verification, and guarded commerce",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-[Inter,system-ui,sans-serif] antialiased bg-[var(--rico-bg-base)] text-[var(--rico-text-strong)] min-h-screen m-0">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange={true}
        >
          <PostHogProvider>
            <AuthProvider>
              {children}
              <AuthModal />
            </AuthProvider>
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
