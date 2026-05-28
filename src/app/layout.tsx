import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import AriaSync from "@/components/ui/AriaSync";
import { LanguageProvider } from "@/components/layout/LanguageContext";
import { ExchangeRateProvider } from "@/components/layout/ExchangeRateContext";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Carbon Climatch — Carbon Intelligence Platform for Indonesian CFOs",
  description:
    "Real-time carbon market intelligence: IDXCarbon prices, regulatory compliance alerts, CBAM exposure assessment, and AI-powered analysis for Indonesian corporate finance leaders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased bg-[#111111]">
        <LanguageProvider>
          <ExchangeRateProvider>
            <AriaSync />
            <Navbar />
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </ExchangeRateProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

