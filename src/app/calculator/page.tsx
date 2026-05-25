"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { calculateCBAMPortfolio } from "@/lib/calculations";
import { getCBAMConfig, getIDXCarbonMonthly } from "@/lib/data";
import type { CBAMPortfolioItem, CBAMPortfolioResult } from "@/types";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import CBAMPortfolioCharts from "@/components/dashboard/CBAMPortfolioCharts";
import { useLanguage } from "@/components/layout/LanguageContext";

const USD_TO_IDR = 16000;

export default function CalculatorPage() {
  const { language, t } = useLanguage();

  function formatUsd(value: number): string {
    return value.toLocaleString(language === "id" ? "id-ID" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }

  function formatIdr(value: number): string {
    return `IDR ${value.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
  }

  const { applicableSectors, defaultEuPriceUsd, defaultIdxPriceUsd, latestIdx } = useMemo(() => {
    const config = getCBAMConfig();
    const applicableSectors = config.sectors.filter((s) => s.cbam_applicable);
    const sortedIDX = [...getIDXCarbonMonthly()].sort((a, b) => a.month.localeCompare(b.month));
    const latestIdx = sortedIDX[sortedIDX.length - 1];
    const defaultIdxPriceUsd = latestIdx ? latestIdx.avg_price_idr / USD_TO_IDR : 2.0; // Fallback to ~$2 carbon tax floor

    return {
      applicableSectors,
      defaultEuPriceUsd: config.eu_ets_price_usd,
      defaultIdxPriceUsd,
      latestIdx,
    };
  }, []);

  // State management
  const [portfolioItems, setPortfolioItems] = useState<CBAMPortfolioItem[]>([
    { id: "1", sectorId: applicableSectors[0]?.id ?? "", export_volume_tons: 5000 },
  ]);
  const [euEtsPrice, setEuEtsPrice] = useState(defaultEuPriceUsd.toString());
  const [indonesiaPrice, setIndonesiaPrice] = useState(defaultIdxPriceUsd.toFixed(2));
  
  const [result, setResult] = useState<CBAMPortfolioResult | null>(null);
  const [validationError, setValidationError] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  // Handle adding a new product line
  const handleAddItem = () => {
    setPortfolioItems([
      ...portfolioItems,
      {
        id: Date.now().toString(),
        sectorId: applicableSectors[0]?.id ?? "",
        export_volume_tons: 1000,
      },
    ]);
  };

  // Handle removing a product line
  const handleRemoveItem = (id: string) => {
    // Keep at least one item
    if (portfolioItems.length === 1) {
      setValidationError(t("calculator.validationAtLeastOne"));
      return;
    }
    setPortfolioItems(portfolioItems.filter((item) => item.id !== id));
    setValidationError("");
  };

  // Handle modifying field values
  const handleUpdateItem = (id: string, field: "sectorId" | "export_volume_tons", value: string | number) => {
    setPortfolioItems(
      portfolioItems.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [field]: field === "export_volume_tons" ? Number(value) : value,
          };
        }
        return item;
      })
    );
  };

  // Fetch AI risk advisory
  const fetchAnalysis = async (calcResult: CBAMPortfolioResult, euPriceUsd: number, indoPriceUsd: number) => {
    setAnalysisLoading(true);
    setAnalysisError("");
    setAnalysis("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "cbam_result",
          data: {
            ...calcResult,
            eu_ets_price_usd: euPriceUsd,
            indonesia_carbon_price_usd: indoPriceUsd,
          },
          language,
        }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const { analysis: text } = await response.json();
      setAnalysis(text);
    } catch {
      setAnalysisError(
        t("dashboard.errorGeneratingAnalysis")
      );
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Run calculation
  const handleCalculate = () => {
    setValidationError("");
    setResult(null);
    setAnalysis("");
    setAnalysisError("");

    // Validate global prices
    const euPriceNum = Number(euEtsPrice);
    const indoPriceNum = Number(indonesiaPrice);

    if (Number.isNaN(euPriceNum) || euPriceNum < 0) {
      setValidationError(t("calculator.validationEuPrice"));
      return;
    }

    if (Number.isNaN(indoPriceNum) || indoPriceNum < 0) {
      setValidationError(t("calculator.validationIndoPrice"));
      return;
    }

    // Validate sectors and volumes
    for (const item of portfolioItems) {
      if (!item.sectorId) {
        setValidationError(t("calculator.validationSelectSector"));
        return;
      }
      if (Number.isNaN(item.export_volume_tons) || item.export_volume_tons <= 0) {
        setValidationError(t("calculator.validationPositiveVolume"));
        // Focus the first invalid input for keyboard accessibility
        const el = document.getElementById(`vol-${item.id}`);
        el?.focus();
        return;
      }
    }

    const portfolioResult = calculateCBAMPortfolio(
      portfolioItems,
      applicableSectors,
      euPriceNum,
      indoPriceNum
    );

    // Save to localStorage for Action Hub integration
    localStorage.setItem("climatch_emissions", portfolioResult.total_emissions_tco2.toString());
    localStorage.setItem("climatch_liability", portfolioResult.total_net_liability_usd.toString());
    localStorage.setItem("climatch_liability_idr", (portfolioResult.total_net_liability_usd * USD_TO_IDR).toString());
    localStorage.setItem("climatch_carbon_price_idr", (indoPriceNum * USD_TO_IDR).toFixed(0));

    setResult(portfolioResult);
    fetchAnalysis(portfolioResult, euPriceNum, indoPriceNum);
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white font-sans">
      <main className="mx-auto max-w-6xl px-6 py-12 space-y-10">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 text-balance">
            {t("calculator.title")}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed text-pretty max-w-3xl">
            {t("calculator.subtitle")}
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Global Assumptions */}
          <div className="lg:col-span-1 rounded-xl border border-white/5 bg-[#1a1a1a] p-6 space-y-4 h-fit">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 border-b border-white/5 pb-2">
              {t("calculator.globalParameters")}
            </h2>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="eu-price" className="block text-xs font-medium text-slate-300">
                  {t("calculator.euEtsPriceLabel")}
                </label>
                <button
                  type="button"
                  onClick={() => setEuEtsPrice(defaultEuPriceUsd.toString())}
                  className="text-[10px] text-[#0CF2A0] hover:underline cursor-pointer"
                >
                  {language === "id" ? "Atur Ulang" : "Reset to Default"}
                </button>
              </div>
              <input
                id="eu-price"
                type="number"
                step="any"
                min="0"
                value={euEtsPrice}
                onChange={(e) => setEuEtsPrice(e.target.value)}
                aria-describedby="eu-price-desc"
                className="w-full rounded-lg border border-white/5 bg-[#2a2a2a] px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0CF2A0]/50"
              />
              <span id="eu-price-desc" className="text-[10px] text-slate-500 mt-1 block">
                {language === "id" ? "Referensi tolok ukur resmi EU ETS." : "Official EU ETS benchmark reference."}
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="indo-price" className="block text-xs font-medium text-slate-300">
                  {t("calculator.indoPriceLabel")}
                </label>
                <button
                  type="button"
                  onClick={() => setIndonesiaPrice(defaultIdxPriceUsd.toFixed(2))}
                  className="text-[10px] text-[#0CF2A0] hover:underline cursor-pointer"
                >
                  {language === "id" ? "Atur Ulang" : "Reset to Default"}
                </button>
              </div>
              <input
                id="indo-price"
                type="number"
                step="any"
                min="0"
                value={indonesiaPrice}
                onChange={(e) => setIndonesiaPrice(e.target.value)}
                aria-describedby="indo-price-desc"
                className="w-full rounded-lg border border-white/5 bg-[#2a2a2a] px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0CF2A0]/50"
              />
              <span id="indo-price-desc" className="text-[10px] text-slate-500 mt-1 block">
                {t("calculator.idxReferenceLabel")}: ~${defaultIdxPriceUsd.toFixed(2)}/tCO₂e
                {latestIdx && ` (Rp ${latestIdx.avg_price_idr.toLocaleString("id-ID")}/t)`}
              </span>
            </div>

            <div className="rounded-lg bg-[#2a2a2a]/40 p-3 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-white">{t("calculator.carbonCreditDeduction")}</p>
              <p>
                {language === "id"
                  ? "Regulasi CBAM mengizinkan pengurangan harga karbon domestik yang dibayarkan di negara pengekspor. Pajak karbon atau ETS NEK Indonesia yang dibayar akan mengurangi total liabilitas UE Anda."
                  : "CBAM regulations permit the deduction of domestic carbon prices paid in the exporting country. Indonesia's NEK ETS or carbon tax paid will offset your total EU liability."}
              </p>
            </div>
          </div>

          {/* Portfolio Table Editor */}
          <div className="lg:col-span-2 rounded-xl border border-white/5 bg-[#1a1a1a] p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                {t("calculator.productLines")}
              </h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#0CF2A0]/35 bg-[#0CF2A0]/10 px-3 py-1.5 text-xs font-semibold text-[#0CF2A0] hover:bg-[#0CF2A0]/20 transition-all cursor-pointer"
              >
                {t("calculator.addProductLine")}
              </button>
            </div>

            <div className="space-y-4">
              {portfolioItems.map((item) => (
                <div 
                  key={item.id} 
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-4 rounded-lg bg-[#2a2a2a]/40 border border-white/5"
                >
                  {/* Sector Selection */}
                  <div className="sm:col-span-6">
                    <label htmlFor={`sec-${item.id}`} className="block text-[11px] font-medium text-slate-400 mb-1">
                      {t("calculator.sectorLabel")}
                    </label>
                    <select
                      id={`sec-${item.id}`}
                      value={item.sectorId}
                      onChange={(e) => handleUpdateItem(item.id, "sectorId", e.target.value)}
                      className="w-full rounded-lg border border-white/5 bg-[#2a2a2a] px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0CF2A0]/50"
                    >
                      {applicableSectors.map((sector) => (
                        <option key={sector.id} value={sector.id}>
                          {sector.name} ({sector.emission_factor_tco2_per_ton.toFixed(3)} tCO₂/t)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Volume Input */}
                  <div className="sm:col-span-4">
                    <label htmlFor={`vol-${item.id}`} className="block text-[11px] font-medium text-slate-400 mb-1">
                      {t("calculator.exportVolumeLabel")}
                    </label>
                    <input
                      id={`vol-${item.id}`}
                      type="number"
                      min="0.1"
                      step="any"
                      value={item.export_volume_tons || ""}
                      onChange={(e) => handleUpdateItem(item.id, "export_volume_tons", e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full rounded-lg border border-white/5 bg-[#2a2a2a] px-3 py-2 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0CF2A0]/50"
                    />
                  </div>

                  {/* Actions */}
                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={portfolioItems.length === 1}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1 rounded-lg border border-red-500/20 hover:border-red-500/40 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      {language === "id" ? "Hapus" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {validationError && (
              <p className="text-red-400 text-xs font-medium" role="alert">
                ⚠️ {validationError}
              </p>
            )}

            <button
              type="button"
              onClick={handleCalculate}
              className="w-full rounded-lg bg-[#0CF2A0] hover:bg-[#0CF2A0]/90 transition-colors py-3 text-sm font-bold text-[#111111] shadow-lg shadow-[#0CF2A0]/25 hover:shadow-[#0CF2A0]/35 cursor-pointer"
            >
              {t("calculator.runCalculation")}
            </button>
          </div>
        </div>

        {/* Calculation Output Results */}
        {result && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* KPI Cards Grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
              
              <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  {t("calculator.totalExportVolume")}
                </p>
                <p className="text-lg font-bold text-white">
                  {result.total_export_volume_tons.toLocaleString(language === "id" ? "id-ID" : "en-US", { maximumFractionDigits: 0 })}
                  <span className="text-xs font-normal text-slate-400 ml-1">{t("common.tons")}</span>
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  {t("calculator.totalEmissions")}
                </p>
                <p className="text-lg font-bold text-white">
                  {result.total_emissions_tco2.toLocaleString(language === "id" ? "id-ID" : "en-US", { maximumFractionDigits: 0 })}
                  <span className="text-xs font-normal text-slate-400 ml-1">{t("common.tco2e")}</span>
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  {t("calculator.grossCbamLiability")}
                </p>
                <p className="text-lg font-bold text-amber-400">
                  {formatUsd(result.total_cbam_liability_usd)}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {formatIdr(result.total_cbam_liability_idr)}
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  {t("calculator.carbonCreditDeduction")}
                </p>
                <p className="text-lg font-bold text-[#0CF2A0]">
                  {formatUsd(result.total_indonesia_carbon_credit_usd)}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {formatIdr(result.total_indonesia_carbon_credit_usd * USD_TO_IDR)}
                </p>
              </div>

              <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4 col-span-2 md:col-span-1">
                <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1">
                  {t("calculator.netCbamLiability")}
                </p>
                <p className="text-lg font-bold text-red-400 font-sans">
                  {formatUsd(result.total_net_liability_usd)}
                </p>
                <p className="text-[10px] text-red-500/70 mt-0.5 font-medium">
                  {formatIdr(result.total_net_liability_idr)}
                </p>
              </div>
            </div>

            {/* Visual Analytics */}
            <CBAMPortfolioCharts portfolioResult={result} />

            {/* End-to-End Integration Action Card */}
            <div className="rounded-xl border border-[#0CF2A0]/30 bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg shadow-[#0CF2A0]/5">
              <div className="space-y-1.5 max-w-2xl">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-[#0CF2A0]/15 text-[#0CF2A0] px-2 py-0.5 rounded-full border border-[#0CF2A0]/20">
                  {language === "id" ? "Rekomendasi Aksi Korporasi" : "Corporate Compliance Action"}
                </span>
                <h3 className="text-lg font-bold text-white leading-tight">
                  {language === "id" ? "Beralih Dari Kalkulasi Ke Aksi Nyata" : "Take Action on Your Carbon Exposure"}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed text-pretty">
                  {language === "id" 
                    ? `Anda memiliki sisa kesenjangan karbon sebesar ${result.total_emissions_tco2.toLocaleString()} tCO₂e dengan estimasi liabilitas bersih sebesar ${formatUsd(result.total_net_liability_usd)} (${formatIdr(result.total_net_liability_usd * USD_TO_IDR)}). Segera netralkan eksposur Anda dengan membeli kredit karbon atau mendanai efisiensi energi.`
                    : `You have a remaining carbon gap of ${result.total_emissions_tco2.toLocaleString()} tCO₂e with a net liability of ${formatUsd(result.total_net_liability_usd)} (${formatIdr(result.total_net_liability_usd * USD_TO_IDR)}). Instantly offset this liability by purchasing carbon credits or financing energy efficiency projects.`
                  }
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Link 
                  href={`/strategy?source=calculator`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#0CF2A0]/30 bg-[#0CF2A0]/5 hover:bg-[#0CF2A0]/15 px-5 py-3 text-xs font-bold text-[#0CF2A0] shadow-md transition-all hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
                >
                  <span>{language === "id" ? "Optimasi Strategi Pajak & CAPEX" : "Optimize Tax & CAPEX Strategy"}</span>
                  <span className="text-sm">⚙️</span>
                </Link>
                <Link 
                  href={`/action-hub?source=calculator&gap=${result.total_emissions_tco2}&liability=${result.total_net_liability_usd}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0CF2A0] hover:bg-[#0CF2A0]/95 px-5 py-3 text-xs font-bold text-[#111111] shadow-md shadow-[#0CF2A0]/10 transition-all hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
                >
                  <span>{language === "id" ? "Pusat Aksi Karbon" : "Go to Action Hub"}</span>
                  <span className="text-sm">→</span>
                </Link>
              </div>
            </div>

            {/* AI Advisor Panel */}
            <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <span className="text-[#0CF2A0] text-lg">🤖</span>
                <h3 className="text-white font-semibold text-sm">{t("calculator.aiPanelTitle")}</h3>
              </div>

              {analysisLoading && (
                <div className="flex items-center gap-3 text-slate-400 text-sm py-4">
                  <div className="w-5 h-5 border-2 border-[#0CF2A0] border-t-transparent rounded-full animate-spin" />
                  {t("calculator.aiGenerating")}
                </div>
              )}

              {analysisError && (
                <p className="text-red-400 text-sm font-medium">{analysisError}</p>
              )}

              {analysis && !analysisLoading && (
                <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                  <MarkdownRenderer content={analysis} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
