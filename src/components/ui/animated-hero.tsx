"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/layout/LanguageContext";
import { Sparkles, Calendar, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function Hero() {
  const { language, t } = useLanguage();
  const [currentDate, setCurrentDate] = useState("");
  const [userEmail, setUserEmail] = useState("cfo@indosteel.co.id");

  useEffect(() => {
    // Defer state updates to prevent synchronous setState in effect trigger
    const timer = setTimeout(() => {
      const options: Intl.DateTimeFormatOptions = { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      };
      const locale = language === "id" ? "id-ID" : "en-US";
      setCurrentDate(new Date().toLocaleDateString(locale, options));

      // Get signed in email if available
      const savedEmail = sessionStorage.getItem("user_email");
      if (savedEmail) {
        setUserEmail(savedEmail);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [language]);

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#1a1a1a] p-6 md:p-8">
        {/* Glow orbs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#0CF2A0] opacity-[0.05] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-[#0CF2A0] opacity-[0.03] blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#0CF2A0]/20 bg-[#0CF2A0]/5 px-2.5 py-0.5 text-xs font-semibold text-[#0CF2A0]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0CF2A0] animate-pulse" />
              {language === "id" ? "Sesi Demo Aktif" : "Active Demo Session"}
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {language === "id" ? "Selamat datang kembali, CFO" : "Welcome back, CFO"}
            </h1>
            
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <span className="font-semibold text-slate-300">{userEmail}</span>
              <span className="text-slate-600">•</span>
              <span>IndoSteel Group</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Current Date Display */}
            <div className="flex items-center gap-2 rounded-xl bg-[#111111]/60 border border-white/5 px-4 py-2.5 text-xs text-slate-400">
              <Calendar className="h-3.5 w-3.5 text-[#0CF2A0] flex-shrink-0" />
              <span className="whitespace-nowrap">{currentDate}</span>
            </div>

            {/* Quick action button to direct to AI Analyst */}
            <a
              href="#ai-analysis"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0CF2A0] hover:bg-[#0CF2A0]/90 px-4 py-2.5 text-xs font-bold text-[#111111] shadow-lg shadow-[#0CF2A0]/10 hover:shadow-[#0CF2A0]/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t("dashboard.runAnalysisBtn")}
            </a>
          </div>
        </div>

        {/* Quick Links Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 border-t border-white/5 pt-6">
          <Link href="/calculator" className="group rounded-xl border border-white/5 bg-[#111111]/40 hover:bg-[#111111]/80 p-4 transition-all duration-200 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">{t("nav.calculator")}</p>
              <p className="text-sm font-semibold text-white group-hover:text-[#0CF2A0] transition-colors">
                {language === "id" ? "Hitung Paparan CBAM" : "Quantify CBAM Liability"}
              </p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-[#0CF2A0] transition-colors flex-shrink-0" />
          </Link>

          <Link href="/strategy" className="group rounded-xl border border-white/5 bg-[#111111]/40 hover:bg-[#111111]/80 p-4 transition-all duration-200 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">{t("nav.strategy")}</p>
              <p className="text-sm font-semibold text-white group-hover:text-[#0CF2A0] transition-colors">
                {language === "id" ? "Model Strategi CAPEX" : "Optimize CAPEX/OPEX"}
              </p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-[#0CF2A0] transition-colors flex-shrink-0" />
          </Link>

          <Link href="/timeline" className="group rounded-xl border border-white/5 bg-[#111111]/40 hover:bg-[#111111]/80 p-4 transition-all duration-200 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">{t("nav.timeline")}</p>
              <p className="text-sm font-semibold text-white group-hover:text-[#0CF2A0] transition-colors">
                {language === "id" ? "Cek Deadline Regulasi" : "Monitor Policy Deadlines"}
              </p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-[#0CF2A0] transition-colors flex-shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}
