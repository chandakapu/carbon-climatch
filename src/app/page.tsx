import type { Metadata } from "next";
import { getUpcomingEvents, getLatestPriceByJurisdiction, getIDXCarbonMonthly } from "@/lib/data";
import AlertBanner from "./components/AlertBanner";
import PriceBarChart from "./components/PriceBarChart";
import IDXLineChart from "./components/IDXLineChart";

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
  const prevIDX = sortedIDX[sortedIDX.length - 2];
  const idxPriceUSD = latestIDX ? (latestIDX.avg_price_idr / 16000).toFixed(2) : "—";
  const idxChange = latestIDX && prevIDX
    ? (((latestIDX.avg_price_idr - prevIDX.avg_price_idr) / prevIDX.avg_price_idr) * 100).toFixed(1)
    : null;

  // EU ETS for KPI reference
  const euPrice = latestPrices["EU27+"];
  const indoPrice = latestPrices["Indonesia"];

  return (
    <div className="min-h-screen bg-[#0b1120] text-white font-sans">
      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0b1120]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30">
              <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
              </svg>
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-lg leading-none">carbon</span>
              <span className="font-bold tracking-tight text-emerald-400 text-lg leading-none">climatch</span>
            </div>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#overview" className="text-slate-400 hover:text-white transition-colors">Overview</a>
            <a href="#market" className="text-slate-400 hover:text-white transition-colors">Market</a>
            <a href="#regulatory" className="text-slate-400 hover:text-white transition-colors">Regulatory</a>
            <a href="#ai-analysis" className="text-slate-400 hover:text-white transition-colors">AI Analysis</a>
          </div>

          {/* CTA */}
          <a
            href="#ai-analysis"
            className="hidden md:flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 transition-colors px-4 py-2 text-sm font-semibold text-black"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Get AI Analysis
          </a>
        </div>
      </nav>

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
                {Number(idxChange) >= 0 ? "▲" : "▼"} {Math.abs(Number(idxChange))}% MoM
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
        <section id="ai-analysis" className="scroll-mt-24">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-[#0a1f17] to-[#0b1120] p-8 md:p-12">
            {/* Glow */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-emerald-500 opacity-[0.07] blur-3xl" />

            <div className="relative z-10 max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Powered by Gemini
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                AI Carbon Analyst Panel
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6 text-sm md:text-base">
                Ask our Gemini-powered carbon intelligence analyst to assess your
                company&apos;s CBAM exposure, recommend carbon credit strategies,
                or explain the impact of upcoming regulations on your sector.
              </p>

              {/* Feature bullets */}
              <ul className="space-y-3 mb-8">
                {[
                  { icon: "📋", text: "Sector-specific CBAM liability estimation based on export data" },
                  { icon: "📉", text: "Carbon credit portfolio optimization recommendations" },
                  { icon: "📅", text: "Regulatory deadline briefings tailored to your industry" },
                  { icon: "🔍", text: "Benchmarking against regional carbon markets (EU, Singapore, Korea)" },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                    {item.text}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="flex flex-wrap gap-3">
                <a
                  href="/analyst"
                  id="launch-ai-analyst"
                  className="group inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 transition-all duration-200 px-7 py-3.5 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                >
                  <svg className="h-4 w-4 group-hover:rotate-12 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Launch AI Analyst
                </a>
                <a
                  href="/calculator"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-200 px-6 py-3.5 text-sm font-semibold text-white"
                >
                  CBAM Calculator →
                </a>
              </div>
            </div>

            {/* Decorative right panel — analyst card */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block">
              <div className="rounded-xl border border-white/8 bg-slate-900/80 backdrop-blur w-64 p-5 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Carbon Analyst AI</p>
                    <p className="text-[10px] text-emerald-400">● Online</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="rounded-lg bg-slate-800/80 px-3 py-2.5 text-xs text-slate-300 leading-relaxed">
                    Your steel sector faces an estimated{" "}
                    <span className="text-red-400 font-semibold">$2.4M CBAM liability</span>{" "}
                    in 2026. Here&apos;s how to reduce it…
                  </div>
                  <div className="flex justify-end">
                    <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-300">
                      What sectors are most exposed?
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-800/80 px-3 py-2.5 text-xs text-slate-300 leading-relaxed">
                    Steel, cement, and aluminum exporters to the EU face the highest CBAM burden…
                  </div>
                </div>
              </div>
            </div>
          </div>
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
