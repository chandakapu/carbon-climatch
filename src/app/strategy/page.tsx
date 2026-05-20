"use client";

import { useState } from "react";
import { calculateAllStrategies } from "@/lib/strategyCalculations";
import type { StrategyInputs, StrategyResults } from "@/types";
import AIAnalystPanel from "@/components/ai/AIAnalystPanel";
import StrategyReport from "@/components/strategy/StrategyReport";
import { generateMultiPagePdf } from "@/lib/pdfExport";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    LineChart, Line, ReferenceLine,
    PieChart, Pie, Cell,
    ResponsiveContainer,
} from "recharts";

const USD_TO_IDR = 16000;

function formatIdr(v: number) {
    return `IDR ${v.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
}
function formatUsdSmall(v: number) {
    return `~USD ${(v / USD_TO_IDR).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

/* ── Collapsible Section ─────────────────────────────────────── */
function Section({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
    const [open, setOpen] = useState(defaultOpen ?? true);
    return (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden">
            <button type="button" onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800/40 transition-colors">
                <span className="text-sm font-semibold text-white">{title}</span>
                <svg className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
            </button>
            {open && <div className="px-5 pb-5 space-y-4 border-t border-white/5">{children}</div>}
        </div>
    );
}

/* ── Reusable Input Components ───────────────────────────────── */
function NumInput({ id, label, value, onChange, suffix }: { id: string; label: string; value: string; onChange: (v: string) => void; suffix?: string }) {
    return (
        <div>
            <label htmlFor={id} className="block text-xs font-medium text-slate-300 mb-1.5">{label}</label>
            <div className="relative">
                <input id={id} type="number" min="0" step="any" value={value} onChange={e => onChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">{suffix}</span>}
            </div>
        </div>
    );
}

function SliderInput({ id, label, value, onChange, min = 0, max = 100 }: { id: string; label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
    return (
        <div>
            <label htmlFor={id} className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                <span>{label}</span><span className="text-emerald-400 font-mono">{value}%</span>
            </label>
            <input id={id} type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 rounded-full bg-slate-700 cursor-pointer" />
        </div>
    );
}

function SelectInput({ id, label, value, options, onChange }: { id: string; label: string; value: string | number; options: (string | number)[]; onChange: (v: string) => void }) {
    return (
        <div>
            <label htmlFor={id} className="block text-xs font-medium text-slate-300 mb-1.5">{label}</label>
            <select id={id} value={value} onChange={e => onChange(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

/* ── Chart Colors ────────────────────────────────────────────── */
const COLORS = { credit: "#10b981", capex: "#3b82f6", maint: "#64748b", shield: "#f59e0b" };
const DONUT_COLORS = ["#10b981", "#3b82f6", "#f59e0b"];
const LINE_COLORS = { A: "#ef4444", B: "#3b82f6", C: "#a855f7" };

/* ── Custom Tooltip for BarChart ─────────────────────────────── */
function BarTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg bg-slate-800 border border-slate-600 p-3 text-xs shadow-xl">
            <p className="text-white font-medium mb-1">Year {label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>{p.name}: {formatIdr(p.value)}</p>
            ))}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════ */
export default function StrategyPage() {
    // Section 1
    const [annualEmissions, setAnnualEmissions] = useState("50000");
    const [carbonPriceIdr, setCarbonPriceIdr] = useState("76862");
    const [escalation, setEscalation] = useState(8);
    const [horizon, setHorizon] = useState("5");

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

    const handleCalculate = () => {
        setError("");
        const e = Number(annualEmissions), p = Number(carbonPriceIdr), c = Number(capexAmount);
        if (!e || e <= 0) { setError("Enter a positive annual emissions value."); return; }
        if (!p || p <= 0) { setError("Enter a valid carbon price."); return; }
        if (!c || c <= 0) { setError("Enter a valid CAPEX amount."); return; }

        const inputs: StrategyInputs = {
            annual_emissions: e, carbon_price_idr: p,
            carbon_price_escalation_pct: escalation, planning_horizon_years: Number(horizon),
            capex_amount_idr: c, emission_reduction_pct: emissionReduction,
            down_payment_pct: downPayment, interest_rate_pct: Number(interestRate),
            loan_term_years: Number(loanTerm), maintenance_pct: Number(maintenancePct),
            depreciation_method: depMethod, depreciation_life_years: Number(depLife),
            mixed_capex_allocation_pct: mixedAllocation, corporate_tax_rate_pct: Number(taxRate),
        };
        setLastInputs(inputs);
        setResults(calculateAllStrategies(inputs));
    };

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            await generateMultiPagePdf(["report-page-1", "report-page-2"], "Carbon-Strategy-Report.pdf");
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
        "Strategy A": results.strategy_a.cumulative[i],
        "Strategy B": results.strategy_b.cumulative[i],
        "Strategy C": results.strategy_c.cumulative[i],
    })) : [];

    const donutData = results ? (() => {
        const cTotal = results.strategy_c.yearly.reduce((s, y) => s + y.credit_cost, 0);
        const capTotal = results.strategy_c.yearly.reduce((s, y) => s + y.capex_repayment + y.maintenance, 0);
        const taxTotal = results.strategy_c.yearly.reduce((s, y) => s + y.tax_shield, 0);
        return [
            { name: "Carbon Credits", value: cTotal },
            { name: "CAPEX Investment", value: capTotal },
            { name: "Tax Savings", value: taxTotal },
        ];
    })() : [];

    const strategies = results ? [
        { key: "A", label: "Strategy A — OPEX", color: "text-emerald-400", border: "border-emerald-500/30", result: results.strategy_a },
        { key: "B", label: "Strategy B — CAPEX", color: "text-blue-400", border: "border-blue-500/30", result: results.strategy_b },
        { key: "C", label: "Strategy C — Mixed", color: "text-purple-400", border: "border-purple-500/30", result: results.strategy_c },
    ] : [];

    return (
        <div className="min-h-screen bg-[#0b1120] text-white font-sans">
            <main className="mx-auto max-w-5xl px-6 py-12">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Carbon Strategy Optimizer</h1>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                        Compare OPEX (buy credits), CAPEX (green investment), and Mixed strategies
                        across your planning horizon to find the optimal carbon compliance path.
                    </p>
                </div>

                {/* Input Sections */}
                <div className="space-y-4 mb-8">
                    <Section title="📊 Emission & Market Context" defaultOpen>
                        <div className="grid gap-4 sm:grid-cols-2 pt-4">
                            <NumInput id="annual-emissions" label="Annual Emissions (tCO2e/year)" value={annualEmissions} onChange={setAnnualEmissions} suffix="tCO2e" />
                            <NumInput id="carbon-price" label="Carbon Price (IDR/tCO2e)" value={carbonPriceIdr} onChange={setCarbonPriceIdr} suffix="IDR" />
                        </div>
                        <SliderInput id="escalation" label="Carbon Price Escalation" value={escalation} onChange={setEscalation} max={20} />
                        <SelectInput id="horizon" label="Planning Horizon (years)" value={horizon} options={[1, 3, 5, 10]} onChange={setHorizon} />
                    </Section>

                    <Section title="🏭 CAPEX Investment Details" defaultOpen>
                        <div className="grid gap-4 sm:grid-cols-2 pt-4">
                            <NumInput id="capex-amount" label="CAPEX Amount (IDR)" value={capexAmount} onChange={setCapexAmount} suffix="IDR" />
                            <NumInput id="interest-rate" label="Interest Rate (%)" value={interestRate} onChange={setInterestRate} suffix="%" />
                        </div>
                        <SliderInput id="emission-reduction" label="Emission Reduction from CAPEX" value={emissionReduction} onChange={setEmissionReduction} />
                        <SliderInput id="down-payment" label="Down Payment" value={downPayment} onChange={setDownPayment} />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <SelectInput id="loan-term" label="Loan Term (years)" value={loanTerm} options={[3, 5, 7, 10]} onChange={setLoanTerm} />
                            <NumInput id="maintenance" label="Annual Maintenance (% of CAPEX)" value={maintenancePct} onChange={setMaintenancePct} suffix="%" />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <SelectInput id="dep-method" label="Depreciation Method" value={depMethod} options={["Straight-line", "Declining Balance"]} onChange={v => setDepMethod(v as "Straight-line" | "Declining Balance")} />
                            <SelectInput id="dep-life" label="Depreciation Life (years)" value={depLife} options={[5, 8, 10, 15]} onChange={setDepLife} />
                        </div>
                    </Section>

                    <Section title="🔀 Mixed Strategy & Tax" defaultOpen>
                        <div className="pt-4">
                            <SliderInput id="mixed-alloc" label="CAPEX Allocation in Mixed Strategy" value={mixedAllocation} onChange={setMixedAllocation} />
                        </div>
                        <NumInput id="tax-rate" label="Corporate Tax Rate (%)" value={taxRate} onChange={setTaxRate} suffix="%" />
                    </Section>
                </div>

                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                <button type="button" onClick={handleCalculate}
                    className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 transition-colors px-4 py-3.5 text-sm font-bold text-black mb-10">
                    Calculate Strategies
                </button>

                {/* ── Results Dashboard ───────────────────────────────── */}
                {results && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Analysis Results</h2>
                            <button
                                onClick={handleExportPdf}
                                disabled={isExporting}
                                className="flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 text-xs font-semibold text-white transition-all disabled:opacity-50"
                            >
                                {isExporting ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <span>📄</span>
                                        Export PDF Report
                                    </>
                                )}
                            </button>
                        </div>
                        {/* 1. Summary Cards */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            {strategies.map(s => (
                                <div key={s.key} className={`rounded-xl border ${s.border} bg-slate-900/80 p-5 relative`}>
                                    {results.recommended === s.key && (
                                        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                            Recommended
                                        </span>
                                    )}
                                    <p className={`text-xs font-semibold uppercase tracking-wider ${s.color} mb-3`}>{s.label}</p>
                                    <p className="text-xl font-bold text-white">{formatIdr(s.result.total_cost)}</p>
                                    <p className="text-xs text-slate-400 mt-1">{formatUsdSmall(s.result.total_cost)}</p>
                                    <p className="text-xs text-slate-500 mt-2">{Number(horizon)}-year total cost</p>
                                </div>
                            ))}
                        </div>

                        {/* 2. Stacked Bar Chart */}
                        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
                            <h2 className="text-lg font-semibold text-white mb-1">Annual Cost Breakdown</h2>
                            <p className="text-xs text-slate-400 mb-4">Stacked components per strategy per year</p>
                            <ResponsiveContainer width="100%" height={360}>
                                <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 12 }} label={{ value: "Year", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 11 }} />
                                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={v => `${(v / 1e9).toFixed(1)}B`} />
                                    <Tooltip content={<BarTooltipContent />} />
                                    <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                                    <Bar dataKey="A_credits" name="A: Credits" fill={COLORS.credit} stackId="a" />
                                    <Bar dataKey="B_credits" name="B: Credits" fill={COLORS.credit} stackId="b" opacity={0.6} />
                                    <Bar dataKey="B_capex" name="B: Repayment" fill={COLORS.capex} stackId="b" />
                                    <Bar dataKey="B_maint" name="B: Maintenance" fill={COLORS.maint} stackId="b" />
                                    <Bar dataKey="B_shield" name="B: Tax Shield" fill={COLORS.shield} stackId="b" />
                                    <Bar dataKey="C_credits" name="C: Credits" fill={COLORS.credit} stackId="c" opacity={0.4} />
                                    <Bar dataKey="C_capex" name="C: Repayment" fill={COLORS.capex} stackId="c" opacity={0.6} />
                                    <Bar dataKey="C_maint" name="C: Maintenance" fill={COLORS.maint} stackId="c" opacity={0.6} />
                                    <Bar dataKey="C_shield" name="C: Tax Shield" fill={COLORS.shield} stackId="c" opacity={0.6} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* 3. Break-even Line Chart */}
                        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
                            <h2 className="text-lg font-semibold text-white mb-1">Cumulative Cost & Break-even</h2>
                            <p className="text-xs text-slate-400 mb-4">
                                {results.break_even_year
                                    ? `CAPEX breaks even vs OPEX at Year ${results.break_even_year}`
                                    : "CAPEX does not break even within the planning horizon"}
                            </p>
                            <ResponsiveContainer width="100%" height={320}>
                                <LineChart data={lineData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 12 }} label={{ value: "Year", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 11 }} />
                                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={v => `${(v / 1e9).toFixed(1)}B`} />
                                    <Tooltip formatter={(v) => formatIdr(Number(v))} contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#fff" }} />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                    <Line type="monotone" dataKey="Strategy A" stroke={LINE_COLORS.A} strokeWidth={2} dot={{ r: 3 }} />
                                    <Line type="monotone" dataKey="Strategy B" stroke={LINE_COLORS.B} strokeWidth={2} dot={{ r: 3 }} />
                                    <Line type="monotone" dataKey="Strategy C" stroke={LINE_COLORS.C} strokeWidth={2} dot={{ r: 3 }} />
                                    {results.break_even_year && (
                                        <ReferenceLine x={results.break_even_year} stroke="#f59e0b" strokeDasharray="6 4" strokeWidth={2}
                                            label={{ value: `Break-even (Yr ${results.break_even_year})`, position: "top", fill: "#f59e0b", fontSize: 11 }} />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* 4. Budget Allocation Donut */}
                        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
                            <h2 className="text-lg font-semibold text-white mb-1">Mixed Strategy — Budget Allocation</h2>
                            <p className="text-xs text-slate-400 mb-4">How costs are distributed in the blended approach</p>
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <ResponsiveContainer width={260} height={260}>
                                    <PieChart>
                                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={65} outerRadius={110}
                                            paddingAngle={3} dataKey="value" nameKey="name"
                                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                            labelLine={{ stroke: "#64748b" }}>
                                            {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                                        </Pie>
                                        <Tooltip formatter={(v) => formatIdr(Number(v))} contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
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

                        {/* 5. AI Analysis */}
                        <AIAnalystPanel
                            requestType="strategy_optimizer"
                            triggerLabel="Get AI Strategy Analysis"
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

                        {/* Hidden Report for PDF Capture */}
                        {lastInputs && (
                            <StrategyReport
                                inputs={lastInputs}
                                results={results}
                                aiAnalysis={aiAnalysis}
                            />
                        )}

                        {/* Disclaimer */}
                        <p className="text-center text-xs text-slate-500 border-t border-slate-800 pt-6">
                            This calculator uses simplified financial models for planning purposes.
                            Consult a financial advisor for investment decisions.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
