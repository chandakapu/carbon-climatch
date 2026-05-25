"use client";

import { useState, useRef, useId } from "react";
import Link from "next/link";
import { calculateAllStrategies } from "@/lib/strategyCalculations";
import type { StrategyInputs, StrategyResults } from "@/types";
import AIAnalystPanel from "@/components/ai/AIAnalystPanel";
import FormalReportCharts from "@/components/strategy/FormalReportCharts";
import type { FormalReportChartsRef } from "@/components/strategy/FormalReportCharts";
import { generateFormalReport } from "@/lib/pdfExport";
import { getCBAMConfig, getIDXCarbonMonthly } from "@/lib/data";
import { useLanguage } from "@/components/layout/LanguageContext";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    LineChart, Line, ReferenceLine,
    PieChart, Pie, Cell,
    ResponsiveContainer,
} from "recharts";

const USD_TO_IDR = 16000;

/* ── Collapsible Section ─────────────────────────────────────── */
function Section({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
    const [open, setOpen] = useState(defaultOpen ?? true);
    const contentId = useId();
    return (
        <div className="rounded-xl border border-white/5 bg-[#1a1a1a] overflow-hidden">
            <button type="button" onClick={() => setOpen(!open)}
                aria-expanded={open}
                aria-controls={contentId}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#2a2a2a]/50 transition-colors cursor-pointer">
                <span className="text-sm font-semibold text-white">{title}</span>
                <svg className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
            </button>
            {open && <div id={contentId} className="px-5 pb-5 space-y-4 border-t border-white/5">{children}</div>}
        </div>
    );
}

/* ── Reusable Input Components ───────────────────────────────── */
function NumInput({ 
    id, 
    label, 
    value, 
    onChange, 
    suffix,
    required = true,
    min = "0.0001"
}: { 
    id: string; 
    label: string; 
    value: string; 
    onChange: (v: string) => void; 
    suffix?: string;
    required?: boolean;
    min?: string;
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-xs font-medium text-slate-300 mb-1.5">{label}</label>
            <div className="relative">
                <input 
                    id={id} 
                    type="number" 
                    required={required} 
                    min={min} 
                    step="any" 
                    value={value} 
                    onChange={e => onChange(e.target.value)}
                    aria-describedby={`${id}-error`}
                    className="w-full rounded-lg border border-white/5 bg-[#2a2a2a] px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0CF2A0]/50" 
                />
                {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">{suffix}</span>}
            </div>
            <span id={`${id}-error`} className="error-msg-inline hidden text-red-400 text-xs mt-1.5 font-medium">
                ❌ Please enter a valid number.
            </span>
        </div>
    );
}

function SliderInput({ id, label, value, onChange, min = 0, max = 100 }: { id: string; label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
    return (
        <div>
            <label htmlFor={id} className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                <span>{label}</span><span className="text-[#0CF2A0] font-mono">{value}%</span>
            </label>
            <input id={id} type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
                className="w-full accent-[#0CF2A0] h-2 rounded-full bg-[#2a2a2a] cursor-pointer" />
        </div>
    );
}

function SelectInput({ id, label, value, options, onChange }: { id: string; label: string; value: string | number; options: (string | number)[]; onChange: (v: string) => void }) {
    return (
        <div>
            <label htmlFor={id} className="block text-xs font-medium text-slate-300 mb-1.5">{label}</label>
            <select id={id} value={value} onChange={e => onChange(e.target.value)}
                className="w-full rounded-lg border border-white/5 bg-[#2a2a2a] px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0CF2A0]/50">
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

/* ── Chart Colors ────────────────────────────────────────────── */
const COLORS = { credit: "#0CF2A0", capex: "#3b82f6", maint: "#64748b", shield: "#f59e0b" };
const DONUT_COLORS = ["#0CF2A0", "#3b82f6", "#f59e0b"];
const LINE_COLORS = { A: "#ef4444", B: "#3b82f6", C: "#a855f7" };

/* ══════════════════════════════════════════════════════════════ */
export default function StrategyPage() {
    const { language, t } = useLanguage();

    function formatIdr(v: number) {
        return `IDR ${v.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
    }
    function formatUsdSmall(v: number) {
        return `~USD ${(v / USD_TO_IDR).toLocaleString(language === "id" ? "id-ID" : "en-US", { maximumFractionDigits: 0 })}`;
    }



    const config = getCBAMConfig();
    const applicableSectors = config.sectors.filter((s) => s.cbam_applicable);
    const sortedIDX = [...getIDXCarbonMonthly()].sort((a, b) => a.month.localeCompare(b.month));
    const latestIdx = sortedIDX[sortedIDX.length - 1];
    const defaultIdxPriceIdr = latestIdx ? latestIdx.avg_price_idr : 76862;
    const defaultEuPriceIdr = config.eu_ets_price_usd * USD_TO_IDR;

    // Estimator Helpers state
    const [showEstimator, setShowEstimator] = useState(false);
    const [estimatorSectorId, setEstimatorSectorId] = useState(applicableSectors[0]?.id ?? "steel");
    const [estimatorVolume, setEstimatorVolume] = useState("");

    // Section 1
    const [annualEmissions, setAnnualEmissions] = useState("50000");
    const [carbonPriceIdr, setCarbonPriceIdr] = useState(defaultIdxPriceIdr.toString());
    const [escalation, setEscalation] = useState(8);
    const [horizon, setHorizon] = useState("5");

    // Tech presets for reduction
    const techPresets = [
        { id: "custom", name: language === "id" ? "Kustom (Gunakan Slider)" : "Custom (Use Slider)", value: 70 },
        { id: "efficiency", name: language === "id" ? "Peningkatan Efisiensi Energi Dasar" : "Basic Energy Efficiency Upgrades", value: 15 },
        { id: "fuel_switch", name: language === "id" ? "Peralihan Bahan Bakar (Batubara ke Gas)" : "Fuel Switch (Coal to Gas)", value: 30 },
        { id: "biomass", name: language === "id" ? "Biomassa & Pemulihan Panas Limbah" : "Biomass & Waste Heat Recovery", value: 50 },
        { id: "decarbonization", name: language === "id" ? "Dekarbonisasi Mendalam (EAF/Energi Bersih)" : "Deep Decarbonization (EAF/Clean Energy)", value: 75 },
    ];
    const [selectedTechPreset, setSelectedTechPreset] = useState("custom");

    // Section 2
    const [capexAmount, setCapexAmount] = useState("5000000000");
    const [emissionReduction, setEmissionReduction] = useState(70);
    const [downPayment, setDownPayment] = useState(30);
    const [interestRate, setInterestRate] = useState("9");
    const [loanTerm, setLoanTerm] = useState("5");
    const [maintenancePct, setMaintenancePct] = useState("2");
    const [depMethod, setDepMethod] = useState<"Straight-line" | "Declining Balance">("Straight-line");
    const [depLife, setDepLife] = useState("10");

    // Section 3
    const [mixedAllocation, setMixedAllocation] = useState(50);
    const [taxRate, setTaxRate] = useState("22");

    // Results
    const [results, setResults] = useState<StrategyResults | null>(null);
    const [lastInputs, setLastInputs] = useState<StrategyInputs | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState("");
    const chartsRef = useRef<FormalReportChartsRef>(null);

    const handleApplyEstimation = () => {
        const sector = applicableSectors.find(s => s.id === estimatorSectorId);
        const volume = Number(estimatorVolume);
        if (sector && volume > 0) {
            const estimatedVal = Math.round(volume * sector.emission_factor_tco2_per_ton);
            setAnnualEmissions(estimatedVal.toString());
            setShowEstimator(false);
        }
    };

    const handleTechPresetChange = (presetId: string) => {
        setSelectedTechPreset(presetId);
        const preset = techPresets.find(p => p.id === presetId);
        if (preset && preset.id !== "custom") {
            setEmissionReduction(preset.value);
        }
    };

    const handleCalculate = () => {
        setError("");
        const e = Number(annualEmissions), p = Number(carbonPriceIdr), c = Number(capexAmount);
        if (!e || e <= 0) { 
            setError(language === "id" ? "Masukkan nilai emisi tahunan bernilai positif." : "Enter a positive annual emissions value."); 
            document.getElementById("annual-emissions")?.focus();
            return; 
        }
        if (!p || p <= 0) { 
            setError(language === "id" ? "Masukkan harga karbon yang valid." : "Enter a valid carbon price."); 
            document.getElementById("carbon-price")?.focus();
            return; 
        }
        if (!c || c <= 0) { 
            setError(language === "id" ? "Masukkan nominal CAPEX yang valid." : "Enter a valid CAPEX amount."); 
            document.getElementById("capex-amount")?.focus();
            return; 
        }

        const inputs: StrategyInputs = {
            annual_emissions: e, carbon_price_idr: p,
            carbon_price_escalation_pct: escalation, planning_horizon_years: Number(horizon),
            capex_amount_idr: c, emission_reduction_pct: emissionReduction,
            down_payment_pct: downPayment, interest_rate_pct: Number(interestRate),
            loan_term_years: Number(loanTerm), maintenance_pct: Number(maintenancePct),
            depreciation_method: depMethod, depreciation_life_years: Number(depLife),
            mixed_capex_allocation_pct: mixedAllocation, corporate_tax_rate_pct: Number(taxRate),
        };
        const strategyResults = calculateAllStrategies(inputs);

        // Save to localStorage for Action Hub integration
        localStorage.setItem("climatch_emissions", e.toString());
        localStorage.setItem("climatch_strategy_capex", c.toString());
        localStorage.setItem("climatch_recommended_strategy", strategyResults.recommended);
        
        let initialGap = e;
        if (strategyResults.recommended === "B") {
            initialGap = e * (1 - emissionReduction / 100);
        } else if (strategyResults.recommended === "C") {
            initialGap = e * (1 - (mixedAllocation / 100) * (emissionReduction / 100));
        }
        localStorage.setItem("climatch_emissions_gap", initialGap.toString());
        const initialLiabilityUsd = (initialGap * p) / USD_TO_IDR;
        localStorage.setItem("climatch_liability", initialLiabilityUsd.toString());
        localStorage.setItem("climatch_liability_idr", (initialGap * p).toString());

        setLastInputs(inputs);
        setResults(strategyResults);
    };

    const handleExportPdf = async () => {
        if (!lastInputs || !results) return;
        setIsExporting(true);
        try {
            // Make hidden charts visible briefly for capture
            const chartImages = chartsRef.current
                ? await chartsRef.current.captureCharts()
                : { barChart: null, lineChart: null };

            await generateFormalReport(lastInputs, results, aiAnalysis, chartImages);
        } finally {
            setIsExporting(false);
        }
    };

    // Prepare chart data
    const barData = results ? results.strategy_a.yearly.map((_, i) => ({
        year: i + 1,
        A_credits: results.strategy_a.yearly[i].credit_cost,
        B_credits: results.strategy_b.yearly[i].credit_cost,
        B_capex: results.strategy_b.yearly[i].capex_repayment,
        B_maint: results.strategy_b.yearly[i].maintenance,
        B_shield: -results.strategy_b.yearly[i].tax_shield,
        C_credits: results.strategy_c.yearly[i].credit_cost,
        C_capex: results.strategy_c.yearly[i].capex_repayment,
        C_maint: results.strategy_c.yearly[i].maintenance,
        C_shield: -results.strategy_c.yearly[i].tax_shield,
    })) : [];

    const lineData = results ? results.strategy_a.cumulative.map((_, i) => ({
        year: i + 1,
        [language === "id" ? "Strategi A" : "Strategy A"]: results.strategy_a.cumulative[i],
        [language === "id" ? "Strategi B" : "Strategy B"]: results.strategy_b.cumulative[i],
        [language === "id" ? "Strategi C" : "Strategy C"]: results.strategy_c.cumulative[i],
    })) : [];

    const donutData = results ? (() => {
        const cTotal = results.strategy_c.yearly.reduce((s, y) => s + y.credit_cost, 0);
        const capTotal = results.strategy_c.yearly.reduce((s, y) => s + y.capex_repayment + y.maintenance, 0);
        const taxTotal = results.strategy_c.yearly.reduce((s, y) => s + y.tax_shield, 0);
        return [
            { name: language === "id" ? "Kredit Karbon" : "Carbon Credits", value: cTotal },
            { name: language === "id" ? "Investasi CAPEX" : "CAPEX Investment", value: capTotal },
            { name: language === "id" ? "Penghematan Pajak" : "Tax Savings", value: taxTotal },
        ];
    })() : [];

    const strategies = results ? [
        { key: "A", label: language === "id" ? "Strategi A — OPEX" : "Strategy A — OPEX", color: "text-[#0CF2A0]", border: "border-[#0CF2A0]/30", result: results.strategy_a },
        { key: "B", label: language === "id" ? "Strategi B — CAPEX" : "Strategy B — CAPEX", color: "text-blue-400", border: "border-blue-500/30", result: results.strategy_b },
        { key: "C", label: language === "id" ? "Strategi C — Campuran" : "Strategy C — Mixed", color: "text-purple-400", border: "border-purple-500/30", result: results.strategy_c },
    ] : [];

    return (
        <div className="min-h-screen bg-[#111111] text-white font-sans">
            <main className="mx-auto max-w-5xl px-6 py-12">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2 text-balance">{t("strategy.title")}</h1>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-2xl text-pretty">
                        {t("strategy.subtitle")}
                    </p>
                </div>

                {/* Input Sections */}
                <div className="space-y-4 mb-8">
                    <Section title={language === "id" ? "📊 Konteks Emisi & Pasar" : "📊 Emission & Market Context"} defaultOpen>
                        <div className="grid gap-4 sm:grid-cols-2 pt-4">
                            <div>
                                <NumInput id="annual-emissions" label={t("strategy.emissionsLabel")} value={annualEmissions} onChange={setAnnualEmissions} suffix="tCO2e" />
                                <button
                                    type="button"
                                    onClick={() => setShowEstimator(!showEstimator)}
                                    className="mt-2 text-xs text-[#0CF2A0] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    {language === "id" ? "🔍 Estimasi dari volume produksi" : "🔍 Estimate from production volume"}
                                </button>
                                {showEstimator && (
                                    <div className="mt-3 p-3 rounded-lg border border-white/5 bg-[#2a2a2a]/60 space-y-3">
                                        <p className="text-[11px] text-slate-400 font-medium">
                                            {language === "id" ? "Pilih sektor industri Anda dan masukkan volume produksi tahunan (ton) untuk menghitung emisi:" : "Select your industry sector and enter annual production volume (tons) to compute emissions:"}
                                        </p>
                                        <div className="space-y-2">
                                            <label htmlFor="est-sector" className="block text-[10px] text-slate-400 font-medium">{language === "id" ? "Sektor" : "Sector"}</label>
                                            <select
                                                id="est-sector"
                                                value={estimatorSectorId}
                                                onChange={(e) => setEstimatorSectorId(e.target.value)}
                                                className="w-full rounded border border-white/5 bg-[#1a1a1a] px-2 py-1.5 text-xs text-white focus:outline-none"
                                            >
                                                {applicableSectors.map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name} ({s.emission_factor_tco2_per_ton} tCO2/t)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="est-volume" className="block text-[10px] text-slate-400 font-medium">{language === "id" ? "Volume Produksi (ton)" : "Production Volume (tons)"}</label>
                                            <input
                                                id="est-volume"
                                                type="number"
                                                value={estimatorVolume}
                                                onChange={(e) => setEstimatorVolume(e.target.value)}
                                                className="w-full rounded border border-white/5 bg-[#1a1a1a] px-2 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                                                placeholder="e.g. 5000"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleApplyEstimation}
                                            className="w-full rounded bg-[#0CF2A0] hover:bg-[#0CF2A0]/90 text-xs font-bold text-[#111111] py-1.5 cursor-pointer"
                                        >
                                            {language === "id" ? "Terapkan Estimasi" : "Apply Estimate"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <NumInput id="carbon-price" label={t("strategy.opexLabel")} value={carbonPriceIdr} onChange={setCarbonPriceIdr} suffix="IDR" />
                                <div className="mt-2 flex flex-col gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setCarbonPriceIdr(defaultIdxPriceIdr.toFixed(0))}
                                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 text-left cursor-pointer"
                                    >
                                        📍 {language === "id" ? "Gunakan harga IDXCarbon terkini:" : "Use latest IDXCarbon price:"} <span className="text-[#0CF2A0] font-mono">Rp {defaultIdxPriceIdr.toLocaleString("id-ID")}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCarbonPriceIdr(defaultEuPriceIdr.toFixed(0))}
                                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 text-left cursor-pointer"
                                    >
                                        📍 {language === "id" ? "Gunakan harga EU ETS setara Rupiah:" : "Use equivalent EU ETS price:"} <span className="text-[#0CF2A0] font-mono">Rp {defaultEuPriceIdr.toLocaleString("id-ID")}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <SliderInput id="escalation" label={t("strategy.escalationLabel")} value={escalation} onChange={setEscalation} max={20} />
                        <SelectInput id="horizon" label={t("strategy.horizonLabel")} value={horizon} options={[1, 3, 5, 10]} onChange={setHorizon} />
                    </Section>

                    <Section title={language === "id" ? "🏭 Rincian Investasi CAPEX" : "🏭 CAPEX Investment Details"} defaultOpen>
                        <div className="grid gap-4 sm:grid-cols-2 pt-4">
                            <NumInput id="capex-amount" label={t("strategy.capexLabel")} value={capexAmount} onChange={setCapexAmount} suffix="IDR" />
                            <NumInput id="interest-rate" label={language === "id" ? "Suku Bunga (%)" : "Interest Rate (%)"} value={interestRate} onChange={setInterestRate} suffix="%" min="0" />
                        </div>
                        <div className="space-y-3">
                            <label htmlFor="tech-preset" className="block text-xs font-medium text-slate-300">
                                {language === "id" ? "Pilih Preset Teknologi Hijau (Untuk Mengisi Pengurangan Emisi)" : "Select Green Tech Preset (To Auto-fill Emission Reduction)"}
                            </label>
                            <select
                                id="tech-preset"
                                value={selectedTechPreset}
                                onChange={(e) => handleTechPresetChange(e.target.value)}
                                className="w-full rounded-lg border border-white/5 bg-[#2a2a2a] px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0CF2A0]/50"
                            >
                                {techPresets.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} {p.id !== "custom" ? `(${p.value}%)` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {selectedTechPreset === "custom" ? (
                            <SliderInput id="emission-reduction" label={t("strategy.reductionLabel")} value={emissionReduction} onChange={setEmissionReduction} />
                        ) : (
                            <div className="flex justify-between items-center text-xs font-medium text-slate-300 py-2.5 px-4 rounded-lg bg-[#2a2a2a]/40 border border-white/5">
                                <span>{t("strategy.reductionLabel")}</span>
                                <span className="text-[#0CF2A0] font-mono font-bold">{emissionReduction}% ({language === "id" ? "Ditetapkan oleh Preset" : "Preset Applied"})</span>
                            </div>
                        )}
                        <SliderInput id="down-payment" label={language === "id" ? "Uang Muka" : "Down Payment"} value={downPayment} onChange={setDownPayment} />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <SelectInput id="loan-term" label={language === "id" ? "Jangka Waktu Pinjaman (tahun)" : "Loan Term (years)"} value={loanTerm} options={[3, 5, 7, 10]} onChange={setLoanTerm} />
                            <NumInput id="maintenance" label={language === "id" ? "Pemeliharaan Tahunan (% dari CAPEX)" : "Annual Maintenance (% of CAPEX)"} value={maintenancePct} onChange={setMaintenancePct} suffix="%" min="0" />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <SelectInput id="dep-method" label={language === "id" ? "Metode Penyusutan" : "Depreciation Method"} value={depMethod} options={["Straight-line", "Declining Balance"]} onChange={v => setDepMethod(v as "Straight-line" | "Declining Balance")} />
                            <SelectInput id="dep-life" label={language === "id" ? "Masa Penyusutan (tahun)" : "Depreciation Life (years)"} value={depLife} options={[5, 8, 10, 15]} onChange={setDepLife} />
                        </div>
                    </Section>

                    <Section title={language === "id" ? "🔀 Strategi Campuran & Pajak" : "🔀 Mixed Strategy & Tax"} defaultOpen>
                        <div className="pt-4">
                            <SliderInput id="mixed-alloc" label={language === "id" ? "Alokasi CAPEX dalam Strategi Campuran" : "CAPEX Allocation in Mixed Strategy"} value={mixedAllocation} onChange={setMixedAllocation} />
                        </div>
                        <NumInput id="tax-rate" label={language === "id" ? "Tarif Pajak Perusahaan (%)" : "Corporate Tax Rate (%)"} value={taxRate} onChange={setTaxRate} suffix="%" min="0" />
                    </Section>
                </div>

                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                <button type="button" onClick={handleCalculate}
                    className="w-full rounded-lg bg-[#0CF2A0] hover:bg-[#0CF2A0]/90 transition-colors px-4 py-3.5 text-sm font-bold text-[#111111] mb-10 cursor-pointer">
                    {t("strategy.runOptimization")}
                </button>

                {/* ── Results Dashboard ───────────────────────────────── */}
                {results && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white text-balance">{language === "id" ? "Hasil Analisis" : "Analysis Results"}</h2>
                            <button
                                onClick={handleExportPdf}
                                disabled={isExporting}
                                className="flex items-center gap-2 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-white/5 px-4 py-2 text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {isExporting ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                        {language === "id" ? "Mengekspor..." : "Exporting..."}
                                    </>
                                ) : (
                                    <>
                                        <span>📄</span>
                                        {language === "id" ? "Ekspor Laporan PDF" : "Export PDF Report"}
                                    </>
                                )}
                            </button>
                        </div>
                        {/* 1. Summary Cards */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            {strategies.map(s => (
                                <div key={s.key} className={`rounded-xl border ${s.border} bg-[#1a1a1a] p-5 relative`}>
                                    {results.recommended === s.key && (
                                        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-[#0CF2A0]/20 text-[#0CF2A0] px-2 py-0.5 rounded-full border border-[#0CF2A0]/30">
                                            {language === "id" ? "Direkomendasikan" : "Recommended"}
                                        </span>
                                    )}
                                    <p className={`text-xs font-semibold uppercase tracking-wider ${s.color} mb-3`}>{s.label}</p>
                                    <p className="text-xl font-bold text-white">{formatIdr(s.result.total_cost)}</p>
                                    <p className="text-xs text-slate-400 mt-1">{formatUsdSmall(s.result.total_cost)}</p>
                                    <p className="text-xs text-slate-500 mt-2">
                                        {language === "id" 
                                            ? `Total biaya ${Number(horizon)} tahun`
                                            : `${Number(horizon)}-year total cost`}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* 2. Stacked Bar Chart */}
                        <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
                            <h2 className="text-lg font-semibold text-white mb-1 text-balance">{language === "id" ? "Rincian Biaya Tahunan" : "Annual Cost Breakdown"}</h2>
                            <p className="text-xs text-slate-400 mb-4 text-pretty">
                                {language === "id" ? "Komponen bertumpuk per strategi per tahun" : "Stacked components per strategy per year"}
                            </p>
                            <ResponsiveContainer width="100%" height={360}>
                                <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 12 }} label={{ value: language === "id" ? "Tahun" : "Year", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 11 }} />
                                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={v => `${(v / 1e9).toFixed(1)}B`} />
                                    <Tooltip content={({ active, payload, label }) => {
                                        if (!active || !payload?.length) return null;
                                        return (
                                            <div className="rounded-lg bg-[#2a2a2a] border border-white/5 p-3 text-xs shadow-xl">
                                                <p className="text-white font-medium mb-1">{language === "id" ? "Tahun" : "Year"} {label}</p>
                                                {payload.map((p, i) => (
                                                    <p key={i} style={{ color: p.color }}>{p.name}: {formatIdr(Number(p.value))}</p>
                                                ))}
                                            </div>
                                        );
                                    }} />
                                    <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                                    <Bar dataKey="A_credits" name={language === "id" ? "A: Kredit" : "A: Credits"} fill={COLORS.credit} stackId="a" />
                                    <Bar dataKey="B_credits" name={language === "id" ? "B: Kredit" : "B: Credits"} fill={COLORS.credit} stackId="b" opacity={0.6} />
                                    <Bar dataKey="B_capex" name={language === "id" ? "B: Pelunasan" : "B: Repayment"} fill={COLORS.capex} stackId="b" />
                                    <Bar dataKey="B_maint" name={language === "id" ? "B: Pemeliharaan" : "B: Maintenance"} fill={COLORS.maint} stackId="b" />
                                    <Bar dataKey="B_shield" name={language === "id" ? "B: Perlindungan Pajak" : "B: Tax Shield"} fill={COLORS.shield} stackId="b" />
                                    <Bar dataKey="C_credits" name={language === "id" ? "C: Kredit" : "C: Credits"} fill={COLORS.credit} stackId="c" opacity={0.4} />
                                    <Bar dataKey="C_capex" name={language === "id" ? "C: Pelunasan" : "C: Repayment"} fill={COLORS.capex} stackId="c" opacity={0.6} />
                                    <Bar dataKey="C_maint" name={language === "id" ? "C: Pemeliharaan" : "C: Maintenance"} fill={COLORS.maint} stackId="c" opacity={0.6} />
                                    <Bar dataKey="C_shield" name={language === "id" ? "C: Perlindungan Pajak" : "C: Tax Shield"} fill={COLORS.shield} stackId="c" opacity={0.6} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* 3. Break-even Line Chart */}
                        <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
                            <h2 className="text-lg font-semibold text-white mb-1 text-balance">{language === "id" ? "Biaya Kumulatif & Balik Modal" : "Cumulative Cost & Break-even"}</h2>
                            <p className="text-xs text-slate-400 mb-4">
                                {results.break_even_year
                                    ? (language === "id" 
                                        ? `CAPEX balik modal vs OPEX pada Tahun ${results.break_even_year}` 
                                        : `CAPEX breaks even vs OPEX at Year ${results.break_even_year}`)
                                    : (language === "id"
                                        ? "CAPEX tidak mencapai balik modal dalam cakrawala perencanaan"
                                        : "CAPEX does not break even within the planning horizon")}
                            </p>
                            <ResponsiveContainer width="100%" height={320}>
                                <LineChart data={lineData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 12 }} label={{ value: language === "id" ? "Tahun" : "Year", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 11 }} />
                                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={v => `${(v / 1e9).toFixed(1)}B`} />
                                    <Tooltip formatter={(v) => formatIdr(Number(v))} contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#fff" }} />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                    <Line type="monotone" dataKey={language === "id" ? "Strategi A" : "Strategy A"} stroke={LINE_COLORS.A} strokeWidth={2} dot={{ r: 3 }} />
                                    <Line type="monotone" dataKey={language === "id" ? "Strategi B" : "Strategy B"} stroke={LINE_COLORS.B} strokeWidth={2} dot={{ r: 3 }} />
                                    <Line type="monotone" dataKey={language === "id" ? "Strategi C" : "Strategy C"} stroke={LINE_COLORS.C} strokeWidth={2} dot={{ r: 3 }} />
                                    {results.break_even_year && (
                                        <ReferenceLine x={results.break_even_year} stroke="#f59e0b" strokeDasharray="6 4" strokeWidth={2}
                                            label={{ 
                                                value: language === "id" 
                                                    ? `Balik Modal (Th ${results.break_even_year})` 
                                                    : `Break-even (Yr ${results.break_even_year})`, 
                                                position: "top", 
                                                fill: "#f59e0b", 
                                                fontSize: 11 
                                            }} />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* 4. Budget Allocation Donut */}
                        <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
                            <h2 className="text-lg font-semibold text-white mb-1 text-balance">
                                {language === "id" ? "Strategi Campuran — Alokasi Anggaran" : "Mixed Strategy — Budget Allocation"}
                            </h2>
                            <p className="text-xs text-slate-400 mb-4 text-pretty">
                                {language === "id" 
                                    ? "Bagaimana biaya didistribusikan dalam pendekatan campuran" 
                                    : "How costs are distributed in the blended approach"}
                            </p>
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <ResponsiveContainer width={260} height={260}>
                                    <PieChart>
                                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={65} outerRadius={110}
                                            paddingAngle={3} dataKey="value" nameKey="name"
                                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                            labelLine={{ stroke: "#64748b" }}>
                                            {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                                        </Pie>
                                        <Tooltip formatter={(v) => formatIdr(Number(v))} contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, fontSize: 12 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-2">
                                    {donutData.map((d, i) => (
                                        <div key={d.name} className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[i] }} />
                                            <span className="text-xs text-slate-300">{d.name}:</span>
                                            <span className="text-xs text-white font-medium">{formatIdr(d.value)}</span>
                                            <span className="text-xs text-slate-500">{formatUsdSmall(d.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* End-to-End Integration Action Card */}
                        <div className="rounded-xl border border-[#0CF2A0]/30 bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg shadow-[#0CF2A0]/5">
                            <div className="space-y-1.5 max-w-2xl">
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-[#0CF2A0]/15 text-[#0CF2A0] px-2 py-0.5 rounded-full border border-[#0CF2A0]/20">
                                    {language === "id" ? "Implementasi Strategi Keuangan" : "Financial Strategy Execution"}
                                </span>
                                <h3 className="text-lg font-bold text-white leading-tight">
                                    {language === "id" ? "Eksekusi Strategi Kepatuhan Karbon Anda" : "Execute Your Compliance Strategy"}
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed text-pretty">
                                    {language === "id"
                                        ? `Berdasarkan optimasi, rekomendasi terbaik Anda adalah Strategi ${results.recommended}. Ajukan pembiayaan hijau untuk CAPEX ${formatIdr(Number(capexAmount))} (${formatUsdSmall(Number(capexAmount))}) atau beli offset karbon domestik secara langsung di Pusat Aksi Karbon.`
                                        : `Based on the optimizer, your best path is Strategy ${results.recommended}. Fund the required CAPEX of ${formatIdr(Number(capexAmount))} (${formatUsdSmall(Number(capexAmount))}) using green loans or purchase domestic offsets in the Action Hub.`
                                    }
                                </p>
                            </div>
                            <Link 
                                href={`/action-hub?source=strategy&recommended=${results.recommended}&capex=${capexAmount}&gap=${annualEmissions}`}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0CF2A0] hover:bg-[#0CF2A0]/95 px-5 py-3 text-xs font-bold text-[#111111] shadow-md shadow-[#0CF2A0]/10 transition-all hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
                            >
                                <span>{language === "id" ? "Pusat Aksi Karbon" : "Go to Action Hub"}</span>
                                <span className="text-sm">→</span>
                            </Link>
                        </div>

                        {/* 5. AI Analysis */}
                        <AIAnalystPanel
                            requestType="strategy_optimizer"
                            triggerLabel={language === "id" ? "Hasilkan Analisis Strategi AI" : "Get AI Strategy Analysis"}
                            data={{
                                strategy_a_total: results.strategy_a.total_cost,
                                strategy_b_total: results.strategy_b.total_cost,
                                strategy_c_total: results.strategy_c.total_cost,
                                break_even_year: results.break_even_year,
                                recommended_strategy: `Strategy ${results.recommended}`,
                                horizon_years: Number(horizon),
                                carbon_price_escalation_pct: escalation,
                                emission_reduction_pct: emissionReduction,
                            }}
                            onAnalysisComplete={setAiAnalysis}
                        />

                        {/* Hidden formal charts for PDF capture */}
                        <FormalReportCharts
                            ref={chartsRef}
                            results={results}
                        />

                        {/* Disclaimer */}
                        <p className="text-center text-xs text-slate-500 border-t border-slate-800 pt-6">
                            {language === "id"
                                ? "Kalkulator ini menggunakan model keuangan yang disederhanakan untuk tujuan perencanaan. Konsultasikan dengan penasihat keuangan untuk keputusan investasi."
                                : "This calculator uses simplified financial models for planning purposes. Consult a financial advisor for investment decisions."}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
