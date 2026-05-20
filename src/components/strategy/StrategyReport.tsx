"use client";

import React from "react";
import type { StrategyInputs, StrategyResults } from "@/types";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
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

/*
 * All colors are defined as inline hex/rgba styles instead of Tailwind classes.
 * Tailwind CSS v4 resolves class-based colors to oklch()/lab() functions, which
 * html2canvas cannot parse, producing blank PDF pages.
 */

// Design tokens — hex equivalents of the Tailwind palette used in the app
const C = {
    bg: "#0b1120",
    cardBg: "rgba(15,23,42,0.6)",    // slate-900/60
    cardBgAlt: "rgba(30,41,59,0.4)", // slate-800/40
    border: "#334155",               // slate-700
    borderLight: "rgba(255,255,255,0.1)",
    text: "#ffffff",
    textMuted: "#cbd5e1",            // slate-300
    textDim: "#94a3b8",              // slate-400
    textDimmer: "#64748b",           // slate-500
    emerald: "#10b981",
    emeraldDim: "rgba(16,185,129,0.1)",
    emeraldBorder: "rgba(16,185,129,0.3)",
    emeraldText: "#34d399",          // emerald-400
};

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
        <div
            style={{
                backgroundColor: C.bg,
                color: C.text,
                padding: 40,
                width: 800,
                fontFamily: "Inter, system-ui, sans-serif",
                position: "absolute",
                left: "-9999px",
                top: 0,
            }}
        >
            {/* PAGE 1 */}
            <div id="report-page-1" style={{ minHeight: 1100, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `1px solid ${C.border}`, paddingBottom: 24, marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.text, margin: 0 }}>Carbon Strategy Compliance Report</h1>
                        <p style={{ color: C.textDim, marginTop: 4, fontSize: 14 }}>Generated for: Indonesian Strategic Finance Team</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <p style={{ color: C.emerald, fontWeight: 700, fontSize: 20, margin: 0 }}>carbon-climatch</p>
                        <p style={{ color: C.textDimmer, fontSize: 11, marginTop: 4 }}>{new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 40 }}>
                    <div style={{ backgroundColor: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                        <h2 style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16, marginTop: 0 }}>Key Assumptions</h2>
                        <div style={{ fontSize: 14 }}>
                            {[
                                ["Annual Emissions:", `${inputs.annual_emissions.toLocaleString()} tCO2e`],
                                ["Carbon Price:", formatIdr(inputs.carbon_price_idr)],
                                ["Price Escalation:", `${inputs.carbon_price_escalation_pct}% / year`],
                                ["Planning Horizon:", `${inputs.planning_horizon_years} Years`],
                                ["CAPEX Investment:", formatIdr(inputs.capex_amount_idr)],
                                ["Emission Reduction:", `${inputs.emission_reduction_pct}%`],
                            ].map(([label, val]) => (
                                <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span style={{ color: C.textDim }}>{label}</span>
                                    <span style={{ color: C.text }}>{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ backgroundColor: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, borderRadius: 12, padding: 24 }}>
                        <h2 style={{ fontSize: 12, fontWeight: 600, color: C.emeraldText, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16, marginTop: 0 }}>Recommended Strategy</h2>
                        <div style={{ marginBottom: 16 }}>
                            <p style={{ fontSize: 11, color: "rgba(16,185,129,0.7)", fontWeight: 500, margin: 0 }}>OPTIMAL PATHWAY</p>
                            <p style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: "4px 0 0" }}>Strategy {results.recommended}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, color: C.textDim, margin: 0 }}>Total Cost Over Horizon:</p>
                            <p style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "4px 0 0" }}>
                                {formatIdr(results[`strategy_${results.recommended.toLowerCase() as "a"|"b"|"c"}`].total_cost)}
                            </p>
                            <p style={{ fontSize: 11, color: C.textDimmer, margin: "4px 0 0" }}>~USD {(results[`strategy_${results.recommended.toLowerCase() as "a"|"b"|"c"}`].total_cost / USD_TO_IDR).toLocaleString()} equivalent</p>
                        </div>
                    </div>
                </div>

                <div style={{ backgroundColor: C.cardBgAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, flexGrow: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                        <span style={{ fontSize: 24 }}>🤖</span>
                        <h3 style={{ fontSize: 20, fontWeight: 600, color: C.text, margin: 0 }}>Executive AI Analysis</h3>
                    </div>
                    <p style={{ color: C.textMuted, lineHeight: 1.7, fontSize: 16, fontStyle: "italic", margin: 0 }}>
                        &ldquo;{aiAnalysis || "Run AI analysis to populate this section."}&rdquo;
                    </p>
                </div>

                <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${C.border}`, textAlign: "center", fontSize: 11, color: C.textDimmer }}>
                    CONFIDENTIAL - For Internal Use Only. This report is generated by carbon-climatch and contains estimates based on market assumptions.
                </div>
            </div>

            {/* PAGE 2 */}
            <div id="report-page-2" style={{ minHeight: 1100, display: "flex", flexDirection: "column", paddingTop: 40 }}>
                <div style={{ marginBottom: 48 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 8, marginTop: 0 }}>Annual Cost Breakdown</h2>
                    <p style={{ color: C.textDim, fontSize: 14, marginBottom: 24 }}>Comparative breakdown of costs (Credits vs. Investment vs. Tax Shield) over the planning horizon.</p>
                    <div style={{ height: 350, width: "100%" }}>
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

                <div style={{ marginBottom: 48 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 8, marginTop: 0 }}>Cumulative Cost & Break-even Analysis</h2>
                    <p style={{ color: C.textDim, fontSize: 14, marginBottom: 24 }}>Total financial exposure over time, identifying the point where green investment outperforms simple credit purchasing.</p>
                    <div style={{ height: 350, width: "100%" }}>
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

                <div style={{ marginTop: "auto", paddingTop: 24, borderTop: `1px solid ${C.border}`, textAlign: "center", fontSize: 11, color: C.textDimmer }}>
                    Page 2 of 2 - Strategic Planning Horizon Analysis
                </div>
            </div>
        </div>
    );
}
