"use client";

import React from "react";
import type { StrategyInputs, StrategyResults } from "@/types";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    LineChart, Line, ReferenceLine,
    ResponsiveContainer,
} from "recharts";

interface StrategyReportProps {
    inputs: StrategyInputs;
    results: StrategyResults;
    aiAnalysis: string;
}

const USD_TO_IDR = 16000;
const COLORS = { credit: "#10b981", capex: "#3b82f6", maint: "#64748b", shield: "#f59e0b" };
const LINE_COLORS = { A: "#ef4444", B: "#3b82f6", C: "#a855f7" };

function formatIdr(v: number) {
    return `IDR ${v.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
}

export default function StrategyReport({ inputs, results, aiAnalysis }: StrategyReportProps) {
    const barData = results.strategy_a.yearly.map((_, i) => ({
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
    }));

    const lineData = results.strategy_a.cumulative.map((_, i) => ({
        year: i + 1,
        "Strategy A": results.strategy_a.cumulative[i],
        "Strategy B": results.strategy_b.cumulative[i],
        "Strategy C": results.strategy_c.cumulative[i],
    }));

    return (
        <div className="bg-[#0b1120] text-white p-10 w-[800px] font-sans" style={{ position: "absolute", left: "-9999px", top: 0 }}>
            {/* PAGE 1 */}
            <div id="report-page-1" className="min-h-[1100px] flex flex-col">
                <div className="flex justify-between items-start border-b border-slate-700 pb-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Carbon Strategy Compliance Report</h1>
                        <p className="text-slate-400 mt-1">Generated for: Indonesian Strategic Finance Team</p>
                    </div>
                    <div className="text-right">
                        <p className="text-emerald-500 font-bold text-xl">carbon-climatch</p>
                        <p className="text-slate-500 text-xs mt-1">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-6">
                        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Key Assumptions</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-slate-400">Annual Emissions:</span> <span>{inputs.annual_emissions.toLocaleString()} tCO2e</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Carbon Price:</span> <span>{formatIdr(inputs.carbon_price_idr)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Price Escalation:</span> <span>{inputs.carbon_price_escalation_pct}% / year</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Planning Horizon:</span> <span>{inputs.planning_horizon_years} Years</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">CAPEX Investment:</span> <span>{formatIdr(inputs.capex_amount_idr)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Emission Reduction:</span> <span>{inputs.emission_reduction_pct}%</span></div>
                        </div>
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                        <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">Recommended Strategy</h2>
                        <div className="mb-4">
                            <p className="text-xs text-emerald-500/70 font-medium">OPTIMAL PATHWAY</p>
                            <p className="text-2xl font-bold text-white">Strategy {results.recommended}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-slate-400">Total Cost Over Horizon:</p>
                            <p className="text-xl font-bold text-white">
                                {formatIdr(results[`strategy_${results.recommended.toLowerCase() as "a"|"b"|"c"}`].total_cost)}
                            </p>
                            <p className="text-xs text-slate-500">~USD {(results[`strategy_${results.recommended.toLowerCase() as "a"|"b"|"c"}`].total_cost / USD_TO_IDR).toLocaleString()} equivalent</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/40 border border-slate-600 rounded-xl p-8 flex-grow">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-2xl">🤖</span>
                        <h3 className="text-xl font-semibold text-white">Executive AI Analysis</h3>
                    </div>
                    <p className="text-slate-200 leading-relaxed text-lg italic">
                        "{aiAnalysis}"
                    </p>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
                    CONFIDENTIAL - For Internal Use Only. This report is generated by carbon-climatch and contains estimates based on market assumptions.
                </div>
            </div>

            {/* PAGE 2 */}
            <div id="report-page-2" className="min-h-[1100px] flex flex-col pt-10">
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-2">Annual Cost Breakdown</h2>
                    <p className="text-slate-400 text-sm mb-6">Comparative breakdown of costs (Credits vs. Investment vs. Tax Shield) over the planning horizon.</p>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="year" tick={{ fill: "#94a3b8" }} />
                                <YAxis tick={{ fill: "#94a3b8" }} tickFormatter={v => `${(v / 1e9).toFixed(1)}B`} />
                                <Legend />
                                <Bar dataKey="A_credits" name="A: Credits" fill={COLORS.credit} stackId="a" />
                                <Bar dataKey="B_capex" name="B: Repayment" fill={COLORS.capex} stackId="b" />
                                <Bar dataKey="B_credits" name="B: Credits" fill={COLORS.credit} stackId="b" opacity={0.5} />
                                <Bar dataKey="C_capex" name="C: Repayment" fill={COLORS.capex} stackId="c" opacity={0.6} />
                                <Bar dataKey="C_credits" name="C: Credits" fill={COLORS.credit} stackId="c" opacity={0.3} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-2">Cumulative Cost & Break-even Analysis</h2>
                    <p className="text-slate-400 text-sm mb-6">Total financial exposure over time, identifying the point where green investment outperforms simple credit purchasing.</p>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="year" tick={{ fill: "#94a3b8" }} />
                                <YAxis tick={{ fill: "#94a3b8" }} tickFormatter={v => `${(v / 1e9).toFixed(1)}B`} />
                                <Legend />
                                <Line type="monotone" dataKey="Strategy A" stroke={LINE_COLORS.A} strokeWidth={3} dot={{ r: 5 }} />
                                <Line type="monotone" dataKey="Strategy B" stroke={LINE_COLORS.B} strokeWidth={3} dot={{ r: 5 }} />
                                <Line type="monotone" dataKey="Strategy C" stroke={LINE_COLORS.C} strokeWidth={3} dot={{ r: 5 }} />
                                {results.break_even_year && (
                                    <ReferenceLine x={results.break_even_year} stroke="#f59e0b" strokeDasharray="6 4" strokeWidth={2}
                                        label={{ value: `Break-even`, position: "top", fill: "#f59e0b", fontSize: 12 }} />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
                    Page 2 of 2 - Strategic Planning Horizon Analysis
                </div>
            </div>
        </div>
    );
}
