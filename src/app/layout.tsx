import type { Metadata } from "next";
import "@/styles/globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "ApplyDesk — Personal Application Command Center",
  description: "Personal job-application automation, tailoring, tracking, and outreach command center.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--ink)] antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
