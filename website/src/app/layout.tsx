import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RICO — An autonomous financial agent, reimagined for you and your payments.",
  description:
    "Autonomous price verification and smart guardrails. Free and open source.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#09090B] text-[#F4F4F6] antialiased selection:bg-white/20 selection:text-white">
        {children}
      </body>
    </html>
  );
}
