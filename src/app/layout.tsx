import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClientProviders } from "@/components/client/ClientProviders.client";
import { assertDataModeMatches } from "@/core/config/assertDataMode";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WOD Planner",
  description: "Manual WOD analysis and recovery-aware workout recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Refuses a configuration where BACKEND_URL and NEXT_PUBLIC_DATA_MODE
  // disagree. The guard existed but nothing called it, which is the same
  // failure it is meant to prevent: written, and not connected to anything.
  assertDataModeMatches();

  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
