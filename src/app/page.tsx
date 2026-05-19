import type { Metadata } from "next";
import { getUpcomingEvents, getLatestPriceByJurisdiction, getIDXCarbonMonthly } from "@/lib/data";
import AlertBanner from "@/components/dashboard/AlertBanner";
import PriceBarChart from "@/components/dashboard/PriceBarChart";
import IDXLineChart from "@/components/dashboard/IDXLineChart";
import AIAnalystPanel from "@/components/ai/AIAnalystPanel";

export const metadata: Metadata = {
  title: "Carbon Climatch — Carbon Intelligence Platform for Indonesian CFOs",
  description:
    "Real-time carbon market intelligence: IDXCarbon prices, regulatory compliance alerts, CBAM exposure, and AI-powered analysis for Indonesian corporate finance leaders.",
};

// Jurisdictions to feature in the price comparison chart
const FEATURED_JURISDICTIONS = ["Indonesia", "EU27+", "Singapore", "Korea, Rep."];

const DISPLAY_NAMES: Record<string, string> = {
  Indonesia: "Indonesia",
  "EU27+": "EU ETS",
  Singapore: "Singapore",
  "Korea, Rep.": "South Korea",
};

export default function DashboardPage() {
  // Fetch server-side data
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
  const idxPriceUSD = latestIDX ? (latestIDX.avg_price_idr / 16000).toFixed(2) : "—";
  
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
    <div className="min-h-screen bg-[#0b1120] text-white font-sans">
      <main className="mx-auto max-w-7xl px-6 pb-24">

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section id="overview" className="pt-16 pb-12">
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 via-[#0f1e38] to-[#0b1120] px-8 py-12 md:px-14 md:py-16">
            {/* Glow orb */}
            <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-emerald-500 opacity-[0.06] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500 opacity-[0.04] blur-3xl" />

            <div className="relative z-10 max-w-3xl">
              {/* Eyebrow */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Carbon Intelligence Platform
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-white mb-4">
                Navigate Indonesia&apos;s Carbon<br />
                <span className="text-emerald-400">Compliance Landscape</span>
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-2xl">
                Real-time carbon market intelligence for Indonesian CFOs. Track IDXCarbon prices,
                benchmark against global markets, quantify CBAM liability, and get AI-powered
                regulatory analysis — all in one platform.
              </p>

              <div className="flex flex-wrap gap-3">
                <a
                  href="#ai-analysis"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 transition-all duration-200 px-6 py-3 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Get AI Analysis
                </a>
                <a
                  href="#market"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-200 px-6 py-3 text-sm font-semibold text-white"
                >
                  View Market Data
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Feature pills */}
            <div className="relative z-10 mt-10 flex flex-wrap gap-2">
              {[
                { icon: "📊", label: "IDXCarbon Live Prices" },
                { icon: "🌍", label: "CBAM Liability Calculator" },
                { icon: "⚖️", label: "Regulatory Timeline" },
                { icon: "🤖", label: "Gemini AI Analysis" },
              ].map((f) => (
                <span
                  key={f.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-slate-400"
                >
                  <span>{f.icon}</span>
                  {f.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── KPI CARDS ─────────────────────────────────────────── */}
        <section className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* IDXCarbon Latest */}
          <div className="rounded-xl border border-white/5 bg-slate-900/60 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">IDXCarbon (latest)</p>
            <p className="text-2xl font-bold text-white">
              ${idxPriceUSD}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Rp {latestIDX?.avg_price_idr.toLocaleString("id-ID") ?? "—"}
            </p>
            {idxChange !== null && (
              <p className={`text-xs mt-2 font-semibold ${Number(idxChange) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {Number(idxChange) >= 0 ? "▲" : "▼"} {Math.abs(Number(idxChange))}% 3M Avg Trend
              </p>
            )}
          </div>

          {/* EU ETS Price */}
          <div className="rounded-xl border border-white/5 bg-slate-900/60 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">EU ETS Price</p>
            <p className="text-2xl font-bold text-blue-400">
              ${euPrice?.price_usd.toFixed(2) ?? "—"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">per tCO₂e · {euPrice?.year ?? ""}</p>
            <p className="text-xs mt-2 text-amber-400 font-semibold">⚠ CBAM Reference</p>
          </div>

          {/* Indonesia Carbon Price */}
          <div className="rounded-xl border border-white/5 bg-slate-900/60 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Indonesia ETS</p>
            <p className="text-2xl font-bold text-emerald-400">
              ${indoPrice?.price_usd.toFixed(2) ?? "—"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">per tCO₂e · {indoPrice?.year ?? ""}</p>
            <p className="text-xs text-slate-400 italic mt-1.5">
              Low due to early-stage market liquidity. Proposed carbon tax floor: ~Rp 30,000/tCO2e
            </p>
            <p className="text-xs mt-2 text-emerald-400 font-semibold">✓ NEK ETS Phase 2</p>
          </div>

          {/* CBAM Gap */}
          <div className="rounded-xl border border-white/5 bg-slate-900/60 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">CBAM Gap</p>
            <p className="text-2xl font-bold text-red-400">
              {euPrice && indoPrice
                ? `$${(euPrice.price_usd - indoPrice.price_usd).toFixed(2)}`
                : "—"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">EU ETS − Indonesia ETS</p>
            <p className="text-xs mt-2 text-red-400 font-semibold">⬆ Net CBAM exposure</p>
          </div>
        </section>

        {/* ── REGULATORY ALERTS ─────────────────────────────────── */}
        <section id="regulatory" className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Upcoming Regulatory Events</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {upcomingEvents.length} upcoming event{upcomingEvents.length !== 1 ? "s" : ""} requiring action
              </p>
            </div>
            <a
              href="#regulatory"
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              Full Timeline →
            </a>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-slate-900/40 py-10 text-center">
              <p className="text-slate-500 text-sm">No upcoming events</p>
            </div>
          ) : (
            <AlertBanner events={upcomingEvents} />
          )}
        </section>

        {/* ── MARKET CHARTS ─────────────────────────────────────── */}
        <section id="market" className="mb-10">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Carbon Market Overview</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest carbon price benchmarks and IDXCarbon 12-month trend
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Price Comparison Bar Chart */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6">
              <div className="mb-5">
                <h3 className="font-semibold text-white text-sm">Carbon Price Comparison</h3>
                <p className="text-xs text-slate-500 mt-0.5">USD / tCO₂e — latest available year</p>
              </div>

              {/* Color legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
                {priceChartData.map((d) => {
                  const colorMap: Record<string, string> = {
                    Indonesia: "bg-emerald-500",
                    "EU27+": "bg-blue-500",
                    Singapore: "bg-violet-400",
                    "Korea, Rep.": "bg-amber-500",
                  };
                  return (
                    <div key={d.jurisdiction} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${colorMap[d.jurisdiction] ?? "bg-slate-500"}`} />
                      <span className="text-xs text-slate-400">
                        {DISPLAY_NAMES[d.jurisdiction] ?? d.jurisdiction}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">${d.price_usd.toFixed(0)}</span>
                    </div>
                  );
                })}
              </div>

              <PriceBarChart data={priceChartData} />
            </div>

            {/* IDXCarbon Monthly Line Chart */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6">
              <div className="mb-5">
                <h3 className="font-semibold text-white text-sm">IDXCarbon Monthly Price</h3>
                <p className="text-xs text-slate-500 mt-0.5">12-month trend · IDR converted to USD (Rp 16,000/$)</p>
              </div>

              {/* Volume sparkline summary */}
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500">Avg. Price (USD)</p>
                  <p className="text-sm font-bold text-emerald-400">
                    ${(idxMonthly.reduce((s, d) => s + d.avg_price_idr, 0) / idxMonthly.length / 16000).toFixed(2)}
                  </p>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div>
                  <p className="text-xs text-slate-500">Total Volume</p>
                  <p className="text-sm font-bold text-white">
                    {idxMonthly.reduce((s, d) => s + d.volume_tco2e, 0).toLocaleString()} tCO₂e
                  </p>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div>
                  <p className="text-xs text-slate-500">Months</p>
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
            triggerLabel="Generate Market Intelligence Summary"
          />
        </section>

      </main>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#080e1a] py-8 mt-10">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © 2026 Carbon Climatch · Carbon intelligence for Indonesian enterprises
          </p>
          <p>
            Data sources: IDXCarbon, World Bank Carbon Pricing Dashboard, ICAP · Updated May 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
