import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartAgent — AI Investment Research Agent",
  description: "Analyze stock profiles, financial health metrics, recent news sentiment, and SEC risks with multi-agent orchestration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

