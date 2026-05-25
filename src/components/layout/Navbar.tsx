"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/layout/LanguageContext";

export default function Navbar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();

  // Hide the navigation bar on the login/landing page
  if (pathname === "/") {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0b1120]/90 backdrop-blur-xl">
      <nav aria-label="Primary Navigation" className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30">
            <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
            </svg>
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-lg leading-none">carbon</span>
            <span className="font-bold tracking-tight text-emerald-400 text-lg leading-none">climatch</span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">{t("nav.dashboard")}</Link>
          <Link href="/calculator" className="text-slate-400 hover:text-white transition-colors">{t("nav.calculator")}</Link>
          <Link href="/strategy" className="text-slate-400 hover:text-white transition-colors">{t("nav.strategy")}</Link>
          <Link href="/timeline" className="text-slate-400 hover:text-white transition-colors">{t("nav.timeline")}</Link>
        </div>

        {/* Language switcher & CTA */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 rounded-lg bg-slate-950 border border-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                language === "en"
                  ? "bg-emerald-500 text-black shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("id")}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                language === "id"
                  ? "bg-emerald-500 text-black shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ID
            </button>
          </div>

          <Link
            href="/dashboard#ai-analysis"
            className="hidden md:flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 transition-colors px-4 py-2 text-sm font-semibold text-black"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            {t("nav.getAiAnalysis")}
          </Link>
        </div>
      </nav>
    </header>
  );
}

