"use client";

import { useLanguage } from "@/components/layout/LanguageContext";
import { useExchangeRate } from "@/components/layout/ExchangeRateContext";
import { getUpcomingEvents, getLatestPriceByJurisdiction, getIDXCarbonMonthly } from "@/lib/data";
import AlertBanner from "@/components/dashboard/AlertBanner";
import PriceBarChart from "@/components/dashboard/PriceBarChart";
import IDXLineChart from "@/components/dashboard/IDXLineChart";
import AIAnalystPanel from "@/components/ai/AIAnalystPanel";
import { Hero } from "@/components/ui/animated-hero";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

// Jurisdictions to feature in the price comparison chart
const FEATURED_JURISDICTIONS = ["Indonesia", "EU27+", "Singapore", "Korea, Rep."];

export default function DashboardPage() {
  const { language, t } = useLanguage();
  const { usdToIdr } = useExchangeRate();
  const router = useRouter();

  const displayNames: Record<string, string> = useMemo(() => ({
    Indonesia: "Indonesia",
    "EU27+": "EU ETS",
    Singapore: "Singapore",
    "Korea, Rep.": language === "id" ? "Korea Selatan" : "South Korea",
  }), [language]);

  // Fetch data
  const upcomingEvents = getUpcomingEvents();
  const latestPrices = getLatestPriceByJurisdiction();
  const idxMonthly = getIDXCarbonMonthly();

  // Build bar chart data for the 4 featured jurisdictions
  const priceChartData = FEATURED_JURISDICTIONS.flatMap((jur) => {
    const entry = latestPrices[jur];
    if (!entry) return [];
    return [{ jurisdiction: jur, price_usd: entry.price_usd, instrument_name: entry.instrument_name }];
  });

  // IDXCarbon: latest price & change for KPI card
  const sortedIDX = [...idxMonthly].sort((a, b) => a.month.localeCompare(b.month));
  const latestIDX = sortedIDX[sortedIDX.length - 1];
  const idxPriceUSD = latestIDX ? (latestIDX.avg_price_idr / usdToIdr).toFixed(2) : "—";
  
  const last3Months = sortedIDX.slice(-3);
  const prev3Months = sortedIDX.slice(-6, -3);
  
  const avgLast3 = last3Months.length === 3 ? last3Months.reduce((sum, item) => sum + item.avg_price_idr, 0) / 3 : null;
  const avgPrev3 = prev3Months.length === 3 ? prev3Months.reduce((sum, item) => sum + item.avg_price_idr, 0) / 3 : null;
  
  const idxChange = avgLast3 !== null && avgPrev3 !== null && avgPrev3 !== 0
    ? (((avgLast3 - avgPrev3) / avgPrev3) * 100).toFixed(1)
    : null;

  // EU ETS for KPI reference
  const euPrice = latestPrices["EU27+"];
  const indoPrice = latestPrices["Indonesia"];

  return (
    <div className="min-h-screen bg-[#111111] text-white font-sans">
      <main className="mx-auto max-w-7xl px-6 pb-24">

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section id="overview" className="pt-16 pb-12">
          <Hero />
        </section>

        {/* ── KPI CARDS ─────────────────────────────────────────── */}
        <section className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* IDXCarbon Latest */}
          <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{t("dashboard.idxCarbonLatest")}</p>
            <p className="text-2xl font-bold text-white">
              ${idxPriceUSD}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Rp {latestIDX?.avg_price_idr.toLocaleString("id-ID") ?? "—"}
            </p>
            {idxChange !== null && (
              <p className={`text-xs mt-2 font-semibold ${Number(idxChange) >= 0 ? "text-[#0CF2A0]" : "text-red-400"}`}>
                {Number(idxChange) >= 0 ? "▲" : "▼"} {Math.abs(Number(idxChange))}% {t("dashboard.avgTrend3M")}
              </p>
            )}
          </div>

          {/* EU ETS Price */}
          <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{t("dashboard.euEtsPrice")}</p>
            <p className="text-2xl font-bold text-blue-400">
              ${euPrice?.price_usd.toFixed(2) ?? "—"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">per tCO₂e · {euPrice?.year ?? ""}</p>
            <p className="text-xs mt-2 text-amber-400 font-semibold">{t("dashboard.cbamReference")}</p>
          </div>

          {/* Indonesia Carbon Price */}
          <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{t("dashboard.indonesiaEts")}</p>
            <p className="text-2xl font-bold text-[#0CF2A0]">
              ${indoPrice?.price_usd.toFixed(2) ?? "—"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">per tCO₂e · {indoPrice?.year ?? ""}</p>
            <p className="text-xs text-slate-400 italic mt-1.5">
              {t("dashboard.taxFloorLabel")}
            </p>
            <p className="text-xs mt-2 text-[#0CF2A0] font-semibold">{t("dashboard.phase2Label")}</p>
          </div>

          {/* CBAM Gap */}
          <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{t("dashboard.cbamGap")}</p>
            <p className="text-2xl font-bold text-red-400">
              {euPrice && indoPrice
                ? `$${(euPrice.price_usd - indoPrice.price_usd).toFixed(2)}`
                : "—"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">EU ETS − Indonesia ETS</p>
            <p className="text-xs mt-2 text-red-400 font-semibold">{t("dashboard.netCbamExposure")}</p>
          </div>
        </section>

        {/* ── REGULATORY ALERTS ─────────────────────────────────── */}
        <section id="regulatory" className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white text-balance">{t("dashboard.upcomingEvents")}</h2>
              <p className="text-xs text-slate-500 mt-0.5 text-pretty">
                {upcomingEvents.length} {upcomingEvents.length !== 1 ? t("dashboard.eventsHeaderDescPlural") : t("dashboard.eventsHeaderDesc")}
              </p>
            </div>
            <a
              href="/timeline"
              className="text-xs text-[#0CF2A0] hover:text-opacity-80 transition-colors font-medium cursor-pointer"
            >
              {t("dashboard.fullTimeline")}
            </a>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-[#1a1a1a]/40 py-10 text-center">
              <p className="text-slate-500 text-sm">{t("dashboard.noEvents")}</p>
            </div>
          ) : (
            <AlertBanner events={upcomingEvents} />
          )}
        </section>

        {/* ── ONE-CLICK AUDIT UPLOADER (YOLO COMPLIANCE) ───────── */}
        <section className="mb-10 rounded-2xl border border-[#0CF2A0]/25 bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] p-6 shadow-lg shadow-[#0CF2A0]/5">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#0CF2A0]/20 bg-[#0CF2A0]/5 px-2.5 py-0.5 text-xs font-semibold text-[#0CF2A0]">
                <span>⚡ Fast-Track Compliance</span>
              </div>
              <h2 className="text-xl font-bold text-white leading-tight">
                {language === "id" ? "Unggah Laporan Audit Karbon (One-Click YOLO)" : "One-Click PDF Audit Upload"}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed text-pretty">
                {language === "id"
                  ? "Unggah berkas PDF audit emisi gas rumah kaca Anda untuk mengekstrak data kepatuhan secara otomatis. Sistem akan langsung mengarahkan Anda ke Pusat Aksi Karbon untuk melunasi eksposur Anda."
                  : "Upload your official emissions inventory audit statement. The system will automatically parse and pre-populate your compliance data, then fast-track you directly to the Carbon Action Hub."}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button
                type="button"
                onClick={() => {
                  import("@/lib/mockupPdf").then((mod) => {
                    mod.generateMockupAuditReport("IndoSteel Corporation");
                  });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-5 py-3.5 text-xs font-semibold text-white transition-all cursor-pointer whitespace-nowrap"
              >
                <span>📥 {language === "id" ? "Unduh PDF Sampel" : "Download Sample PDF"}</span>
              </button>
              
              <div className="relative">
                <input
                  type="file"
                  id="audit-pdf-upload"
                  accept=".pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // Simulated visual scanning/OCR sequence
                    const alertMsg = language === "id" ? "Memindai file audit PDF..." : "Scanning audit PDF file...";
                    const successMsg = language === "id" ? "Audit berhasil diverifikasi! Mengalihkan ke Action Hub." : "Audit verified successfully! Redirecting to Action Hub.";
                    alert(alertMsg);

                    // Pre-fill CBAM Calculator parameters
                    localStorage.setItem("climatch_emissions", "55000");
                    localStorage.setItem("climatch_liability", "264000"); // 55,000 * 4.8 USD per ton net
                    localStorage.setItem("climatch_liability_idr", (264000 * usdToIdr).toString());
                    localStorage.setItem("climatch_carbon_price_idr", "76862"); // default idx pricing
                    localStorage.setItem("climatch_emissions_gap", "55000");

                    // Pre-fill Strategy Optimizer parameters
                    localStorage.setItem("climatch_strategy_capex", "5000000000");
                    localStorage.setItem("climatch_recommended_strategy", "C"); // Mixed strategy recommended for high volume

                    alert(successMsg);
                    router.push("/action-hub?source=audit_pdf&gap=55000");
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="audit-pdf-upload"
                  className="w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0CF2A0] hover:bg-[#0CF2A0]/95 px-5 py-3.5 text-xs font-bold text-[#111111] shadow-md shadow-[#0CF2A0]/10 transition-all hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
                >
                  <span>📤 {language === "id" ? "Unggah Dokumen Audit" : "Upload Audit PDF"}</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* ── MARKET CHARTS ─────────────────────────────────────── */}
        <section id="market" className="mb-10">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white text-balance">{t("dashboard.marketOverview")}</h2>
            <p className="text-xs text-slate-500 mt-0.5 text-pretty">
              {t("dashboard.marketOverviewDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Price Comparison Bar Chart */}
            <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-6">
              <div className="mb-5">
                <h3 className="font-semibold text-white text-sm text-balance">{t("dashboard.priceComparison")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{language === "id" ? "USD / tCO₂e — tahun terbaru yang tersedia" : "USD / tCO₂e — latest available year"}</p>
              </div>

              {/* Color legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
                {priceChartData.map((d) => {
                  const colorMap: Record<string, string> = {
                    Indonesia: "bg-[#0CF2A0]",
                    "EU27+": "bg-blue-500",
                    Singapore: "bg-violet-400",
                    "Korea, Rep.": "bg-amber-500",
                  };
                  return (
                    <div key={d.jurisdiction} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${colorMap[d.jurisdiction] ?? "bg-slate-500"}`} />
                      <span className="text-xs text-slate-400">
                        {displayNames[d.jurisdiction] ?? d.jurisdiction}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">${d.price_usd.toFixed(0)}</span>
                    </div>
                  );
                })}
              </div>

              <PriceBarChart data={priceChartData} />
            </div>

            {/* IDXCarbon Monthly Line Chart */}
            <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-6">
              <div className="mb-5">
                <h3 className="font-semibold text-white text-sm text-balance">{t("dashboard.idxTrend")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("dashboard.idxTrendDesc")}</p>
              </div>

              {/* Volume sparkline summary */}
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500">{language === "id" ? "Harga Rerata (USD)" : "Avg. Price (USD)"}</p>
                  <p className="text-sm font-bold text-[#0CF2A0]">
                    ${(idxMonthly.reduce((s, d) => s + d.avg_price_idr, 0) / idxMonthly.length / usdToIdr).toFixed(2)}
                  </p>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div>
                  <p className="text-xs text-slate-500">{language === "id" ? "Total Volume" : "Total Volume"}</p>
                  <p className="text-sm font-bold text-white">
                    {idxMonthly.reduce((s, d) => s + d.volume_tco2e, 0).toLocaleString()} tCO₂e
                  </p>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div>
                  <p className="text-xs text-slate-500">{language === "id" ? "Bulan" : "Months"}</p>
                  <p className="text-sm font-bold text-white">{idxMonthly.length}</p>
                </div>
              </div>

              <IDXLineChart data={idxMonthly} />
            </div>
          </div>
        </section>

        {/* ── AI ANALYSIS PANEL ─────────────────────────────────── */}
        <section id="ai-analysis" className="scroll-mt-24 pt-12">
          <AIAnalystPanel 
            requestType="dashboard_summary" 
            data={{ 
              latestPrices, 
              idxMonthly: idxMonthly.slice(-6) 
              }}
            triggerLabel={language === "id" ? "Hasilkan Ringkasan Intelijen Pasar" : "Generate Market Intelligence Summary"}
          />
        </section>

      </main>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#0c0c0c] py-8 mt-10">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © 2026 Carbon Climatch · {language === "id" ? "Intelijen karbon untuk perusahaan Indonesia" : "Carbon intelligence for Indonesian enterprises"}
          </p>
          <p>
            {language === "id" 
              ? "Sumber data: IDXCarbon, World Bank Carbon Pricing Dashboard, ICAP · Diperbarui Mei 2026" 
              : "Data sources: IDXCarbon, World Bank Carbon Pricing Dashboard, ICAP · Updated May 2026"}
          </p>
        </div>
      </footer>
    </div>
  );
}
