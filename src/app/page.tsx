"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/layout/LanguageContext";
import { 
  ArrowRight, 
  TrendingUp, 
  Calculator, 
  Zap, 
  FileText, 
  Check
} from "lucide-react";
import RotatingText from "@/components/ui/RotatingText";
import ShinyText from "@/components/ui/ShinyText";
import InteractiveGridDots from "@/components/ui/InteractiveGridDots";

export default function LandingPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const titles = useMemo(
    () => [
      t("hero.titles.0"),
      t("hero.titles.1"),
      t("hero.titles.2"),
      t("hero.titles.3"),
      t("hero.titles.4"),
    ],
    [t]
  );

  const handleEnterDashboard = () => {
    sessionStorage.setItem("logged_in", "true");
    sessionStorage.setItem("user_email", "cfo@indosteel.co.id");
    window.dispatchEvent(new Event("auth_change"));
    router.push("/dashboard");
  };

  const carbonTestimonials = [
    {
      name: "Sarah Chen",
      handle: "CFO, IndoSteel Group",
      text: language === "id"
        ? "Fitur perhitungan liabilitas CBAM menghemat waktu kami berminggu-minggu dalam penyusunan prakiraan manual. Sangat penting bagi keuangan industri."
        : "The CBAM liability calculation features saved us weeks of manual forecasting. Indispensable for industrial finance."
    },
    {
      name: "Marcus Wijaya",
      handle: "Head of Sustainability, Berbak Power",
      text: language === "id"
        ? "Solusi elegan untuk memantau tren harga IDXCarbon dan mengoptimalkan strategi CAPEX pengurangan emisi."
        : "An elegant solution to monitor IDXCarbon price trends and optimize emission reduction CAPEX strategies."
    },
    {
      name: "David Halim",
      handle: "Treasurer, Semen Nusantara",
      text: language === "id"
        ? "Analis AI Gemini menghasilkan laporan paparan karbon siap saji untuk rapat direksi dalam hitungan detik. Sangat membantu."
        : "The Gemini AI analyst delivers boardroom-ready carbon exposure reports in seconds. Extremely helpful."
    },
  ];

  return (
    <div className="relative bg-[#111111] text-slate-300 min-h-screen flex flex-col overflow-x-hidden">
      
      {/* ── INTERACTIVE HERO SECTION ──────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-16 px-6">
        {/* Interactive Canvas dots */}
        <InteractiveGridDots />
        <div 
          className="absolute inset-0 z-1 pointer-events-none" 
          style={{
            background: "linear-gradient(to bottom, transparent 0%, #111111 95%), radial-gradient(ellipse at center, transparent 30%, #111111 95%)"
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center gap-6">
          {/* Announcement Shiny Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-2"
          >
            <ShinyText 
              text={language === "id" ? "Pengumuman: Mendukung Regulasi Pajak Karbon Baru 2026" : "Announcing: PR 110/2025 Compliance Alignment"} 
              className="bg-[#0CF2A0]/10 border border-[#0CF2A0]/30 text-[#0CF2A0] px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer hover:border-[#0CF2A0]/50 transition-colors" 
            />
          </motion.div>

          {/* Core Animating Header */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl"
          >
            {t("hero.titlePrefix")}
            <span className="block sm:inline-block h-[1.25em] overflow-hidden align-bottom">
              <RotatingText
                texts={titles}
                mainClassName="text-[#0CF2A0] mx-1.5"
                staggerFrom="last"
                initial={{ y: "-100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "110%", opacity: 0 }}
                staggerDuration={0.01}
                transition={{ type: "spring", damping: 18, stiffness: 220 }}
                rotationInterval={2400}
                splitBy="characters"
                auto={true}
                loop={true}
              />
            </span>
          </motion.h1>

          {/* Subtext description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-base sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
          >
            {t("hero.description")}
          </motion.p>

          {/* Call to Actions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center gap-4 mt-4"
          >
            <button
              onClick={handleEnterDashboard}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#0CF2A0] hover:bg-opacity-95 px-7 py-4 text-sm font-bold text-[#111111] shadow-lg shadow-[#0CF2A0]/10 transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <span>{language === "id" ? "Buka Dasbor Demo" : "Go to Demo Dashboard"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-7 py-4 text-sm font-semibold text-white transition-all cursor-pointer"
            >
              {language === "id" ? "Pelajari Fitur" : "Explore Features"}
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES SECTION ────────────────────────────────────── */}
      <section id="features" className="py-24 bg-[#1a1a1a]/30 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase text-[#0CF2A0] font-bold tracking-widest">
              {language === "id" ? "Kemampuan Platform" : "Core Capabilities"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {language === "id" ? "Mengelola Kepatuhan Karbon dengan Presisi" : "Quantify Carbon Risks with Precision"}
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              {language === "id" 
                ? "Dirancang khusus untuk CFO, manajer keuangan, dan kepala keberlanjutan sektor industri manufaktur di Indonesia."
                : "Tailor-made for Indonesian corporate finance leaders, sustainability heads, and industrial exporters."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1: IDXCarbon Pricing */}
            <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-6 space-y-4 hover:border-[#0CF2A0]/20 transition-all duration-300">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#0CF2A0]/10 border border-[#0CF2A0]/20 text-[#0CF2A0]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {language === "id" ? "Harga IDXCarbon Bulanan" : "IDXCarbon Pricing Hub"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === "id"
                  ? "Akses data perdagangan bursa karbon Indonesia terbaru dan bandingkan harga domestik secara langsung dengan EU ETS."
                  : "Track domestic Indonesia carbon exchange pricing, monthly volumes, and compare indices directly with EU ETS."}
              </p>
            </div>

            {/* Feature 2: CBAM Calculator */}
            <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-6 space-y-4 hover:border-[#0CF2A0]/20 transition-all duration-300">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#0CF2A0]/10 border border-[#0CF2A0]/20 text-[#0CF2A0]">
                <Calculator className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {language === "id" ? "Kalkulator Paparan CBAM" : "CBAM Liability Calculator"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === "id"
                  ? "Hitung gross liability ekspor baja, semen, pupuk ke Uni Eropa dan kurangi otomatis dengan pajak karbon Indonesia (Pasal 9)."
                  : "Quantify embedded emissions tariffs for EU exports and auto-offset using paid Indonesian carbon tax credits (Article 9)."}
              </p>
            </div>

            {/* Feature 3: Strategy Optimizer */}
            <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-6 space-y-4 hover:border-[#0CF2A0]/20 transition-all duration-300">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#0CF2A0]/10 border border-[#0CF2A0]/20 text-[#0CF2A0]">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {language === "id" ? "Pengoptimal CAPEX/OPEX" : "CAPEX Compliance Optimizer"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === "id"
                  ? "Bandingkan skenario CAPEX efisiensi energi vs OPEX beli kredit karbon. Temukan break-even tahun keberapa investasi hijau Anda."
                  : "Compare energy efficiency investments vs purchasing credits. Calculate double-declining depreciation and break-even years."}
              </p>
            </div>

            {/* Feature 4: Gemini AI CFO Analyst */}
            <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-6 space-y-4 hover:border-[#0CF2A0]/20 transition-all duration-300">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#0CF2A0]/10 border border-[#0CF2A0]/20 text-[#0CF2A0]">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {language === "id" ? "Laporan CFO AI Gemini" : "Gemini AI Corporate Analyst"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === "id"
                  ? "Hasilkan rangkuman risiko keuangan berformat PDF siap-saji untuk rapat komisaris didukung analitik Gemini 3.5 Flash."
                  : "Generate boardroom-ready executive summaries and financial risk reports directly in PDF with Gemini AI integrations."}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS SECTION ────────────────────────────────── */}
      <section id="testimonials" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase text-[#0CF2A0] font-bold tracking-widest">Testimonials</span>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {language === "id" ? "Dipercaya oleh CFO Indonesia" : "Boardroom Endorsed"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {carbonTestimonials.map((t, idx) => (
              <div key={idx} className="rounded-2xl border border-white/5 bg-[#1a1a1a]/80 p-6 space-y-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#0CF2A0]/10 border border-[#0CF2A0]/30 text-[#0CF2A0] text-xs font-bold flex-shrink-0">
                    {t.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{t.name}</h4>
                    <p className="text-xs text-slate-400">{t.handle}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING SECTION ──────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-[#1a1a1a]/30 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase text-[#0CF2A0] font-bold tracking-widest">
              {language === "id" ? "Skema Layanan" : "Flexible Tiers"}
            </span>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {language === "id" ? "Pilihan Paket Fleksibel" : "Pricing Tailored to Exporters"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Free Sandbox */}
            <div className="rounded-2xl border border-white/5 bg-[#1a1a1a]/40 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Free Sandbox</h3>
                <p className="text-xs text-slate-400">
                  {language === "id" ? "Untuk edukasi dan eksplorasi awal regulasi" : "Ideal for exploration of global frameworks"}
                </p>
                <div className="text-2xl font-bold text-white pt-2">Rp 0</div>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 flex-grow">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#0CF2A0] flex-shrink-0" />
                  <span>{language === "id" ? "Akses Dasbor IDXCarbon" : "Access to IDXCarbon prices"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#0CF2A0] flex-shrink-0" />
                  <span>{language === "id" ? "Simulasi Kalkulator CBAM Dasar" : "Basic CBAM calculations"}</span>
                </li>
              </ul>
              <button
                onClick={handleEnterDashboard}
                className="w-full rounded-xl bg-white/5 border border-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors cursor-pointer text-center"
              >
                {language === "id" ? "Coba Sekarang" : "Start Demo"}
              </button>
            </div>

            {/* Enterprise Pro */}
            <div className="rounded-2xl border border-[#0CF2A0]/30 bg-[#1a1a1a] p-6 flex flex-col justify-between space-y-6 relative">
              <div className="absolute -top-3 right-6 rounded-full bg-[#0CF2A0] px-3 py-1 text-[10px] font-bold text-[#111111] uppercase tracking-wider">
                Popular
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Enterprise Pro</h3>
                <p className="text-xs text-slate-400">
                  {language === "id" ? "Untuk korporasi eksportir aktif" : "For companies exporting to the EU and globally"}
                </p>
                <div className="text-2xl font-bold text-[#0CF2A0] pt-2">
                  Rp 12 jt <span className="text-xs text-slate-400 font-normal">/ bln</span>
                </div>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 flex-grow">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#0CF2A0] flex-shrink-0" />
                  <span>{language === "id" ? "Kalkulator CBAM Lengkap + Pasal 9" : "Full CBAM Portfolio assessment"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#0CF2A0] flex-shrink-0" />
                  <span>{language === "id" ? "Analisis AI Gemini CFO Tanpa Batas" : "Unlimited Gemini AI CFO Analyst"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#0CF2A0] flex-shrink-0" />
                  <span>{language === "id" ? "Pemodelan CAPEX + Ekspor Laporan PDF" : "CAPEX scenario modeling & PDF exports"}</span>
                </li>
              </ul>
              <button
                onClick={handleEnterDashboard}
                className="w-full rounded-xl bg-[#0CF2A0] py-2.5 text-xs font-bold text-[#111111] hover:bg-opacity-90 transition-colors cursor-pointer text-center shadow-md shadow-[#0CF2A0]/10"
              >
                {language === "id" ? "Langganan Sekarang" : "Subscribe Now"}
              </button>
            </div>

            {/* Custom Advisory */}
            <div className="rounded-2xl border border-white/5 bg-[#1a1a1a]/40 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Custom Advisory</h3>
                <p className="text-xs text-slate-400">
                  {language === "id" ? "Integrasi ERP dan konsultasi kustom" : "ERP integrations and customized compliance"}
                </p>
                <div className="text-2xl font-bold text-white pt-2">Contact Us</div>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 flex-grow">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#0CF2A0] flex-shrink-0" />
                  <span>{language === "id" ? "Semua fitur Enterprise Pro" : "All Enterprise Pro features"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#0CF2A0] flex-shrink-0" />
                  <span>{language === "id" ? "Integrasi API Sistem ERP Korporasi" : "Custom ERP integrations (SAP, Oracle)"}</span>
                </li>
              </ul>
              <button
                onClick={handleEnterDashboard}
                className="w-full rounded-xl bg-white/5 border border-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors cursor-pointer text-center"
              >
                {language === "id" ? "Hubungi Penjualan" : "Contact Sales"}
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 bg-slate-950 text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} Carbon Climatch. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#0CF2A0] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#0CF2A0] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#0CF2A0] transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
