"use client";

import React, { forwardRef, useImperativeHandle, useRef } from "react";
import html2canvas from "html2canvas";
import type { StrategyResults } from "@/types";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    LineChart, Line, ReferenceLine,
    ResponsiveContainer,
} from "recharts";

/* ── Formal grayscale + navy accent palette ──────────────────── */
const NAVY = "#1a365d";
const GRAY_700 = "#374151";
const GRAY_500 = "#6b7280";
const GRAY_300 = "#d1d5db";
const CHART_COLORS = {
    credit: GRAY_700,
    capex: NAVY,
    maint: GRAY_500,
    shield: "#9ca3af",
};
const LINE_COLORS = { A: "#111827", B: NAVY, C: GRAY_500 };

interface FormalReportChartsProps {
    results: StrategyResults;
}

export interface FormalReportChartsRef {
    captureCharts: () => Promise<{ barChart: string | null; lineChart: string | null }>;
}

const FormalReportCharts = forwardRef<FormalReportChartsRef, FormalReportChartsProps>(
    function FormalReportCharts({ results }, ref) {
        const barRef = useRef<HTMLDivElement>(null);
        const lineRef = useRef<HTMLDivElement>(null);

        useImperativeHandle(ref, () => ({
            captureCharts: async () => {
                let barChart: string | null = null;
                let lineChart: string | null = null;

                if (barRef.current) {
                    const canvas = await html2canvas(barRef.current, {
                        scale: 2,
                        backgroundColor: "#ffffff",
                        logging: false,
                    });
                    barChart = canvas.toDataURL("image/png");
                }

                if (lineRef.current) {
                    const canvas = await html2canvas(lineRef.current, {
                        scale: 2,
                        backgroundColor: "#ffffff",
                        logging: false,
                    });
                    lineChart = canvas.toDataURL("image/png");
                }

                return { barChart, lineChart };
            },
        }));

        const barData = results.strategy_a.yearly.map((_, i) => ({
            year: i + 1,
            "A: Credits": results.strategy_a.yearly[i].credit_cost,
            "B: Credits": results.strategy_b.yearly[i].credit_cost,
            "B: Repayment": results.strategy_b.yearly[i].capex_repayment,
            "B: Maintenance": results.strategy_b.yearly[i].maintenance,
            "B: Tax Shield": -results.strategy_b.yearly[i].tax_shield,
            "C: Credits": results.strategy_c.yearly[i].credit_cost,
            "C: Repayment": results.strategy_c.yearly[i].capex_repayment,
            "C: Maintenance": results.strategy_c.yearly[i].maintenance,
            "C: Tax Shield": -results.strategy_c.yearly[i].tax_shield,
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
                    position: "fixed",
                    left: 0,
                    top: 0,
                    zIndex: -9999,
                    visibility: "hidden",
                    pointerEvents: "none",
                    opacity: 0,
                    backgroundColor: "#ffffff",
                }}
            >
                {/* Bar Chart — formal palette */}
                <div ref={barRef} style={{ width: 700, height: 350, padding: 16, backgroundColor: "#ffffff" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={GRAY_300} />
                            <XAxis
                                dataKey="year"
                                tick={{ fill: GRAY_700, fontSize: 12, fontFamily: "Times New Roman, serif" }}
                                label={{ value: "Year", position: "insideBottom", offset: -2, fill: GRAY_500, fontSize: 11 }}
                            />
                            <YAxis
                                tick={{ fill: GRAY_700, fontSize: 11, fontFamily: "Times New Roman, serif" }}
                                tickFormatter={v => `${(v / 1e9).toFixed(1)}B`}
                            />
                            <Legend wrapperStyle={{ fontSize: 10, fontFamily: "Times New Roman, serif", color: GRAY_700 }} />
                            <Bar dataKey="A: Credits" fill={CHART_COLORS.credit} stackId="a" />
                            <Bar dataKey="B: Credits" fill={CHART_COLORS.credit} stackId="b" opacity={0.5} />
                            <Bar dataKey="B: Repayment" fill={CHART_COLORS.capex} stackId="b" />
                            <Bar dataKey="B: Maintenance" fill={CHART_COLORS.maint} stackId="b" />
                            <Bar dataKey="B: Tax Shield" fill={CHART_COLORS.shield} stackId="b" />
                            <Bar dataKey="C: Credits" fill={CHART_COLORS.credit} stackId="c" opacity={0.3} />
                            <Bar dataKey="C: Repayment" fill={CHART_COLORS.capex} stackId="c" opacity={0.5} />
                            <Bar dataKey="C: Maintenance" fill={CHART_COLORS.maint} stackId="c" opacity={0.5} />
                            <Bar dataKey="C: Tax Shield" fill={CHART_COLORS.shield} stackId="c" opacity={0.5} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Line Chart — formal palette */}
                <div ref={lineRef} style={{ width: 700, height: 350, padding: 16, backgroundColor: "#ffffff" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lineData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={GRAY_300} />
                            <XAxis
                                dataKey="year"
                                tick={{ fill: GRAY_700, fontSize: 12, fontFamily: "Times New Roman, serif" }}
                                label={{ value: "Year", position: "insideBottom", offset: -2, fill: GRAY_500, fontSize: 11 }}
                            />
                            <YAxis
                                tick={{ fill: GRAY_700, fontSize: 11, fontFamily: "Times New Roman, serif" }}
                                tickFormatter={v => `${(v / 1e9).toFixed(1)}B`}
                            />
                            <Legend wrapperStyle={{ fontSize: 10, fontFamily: "Times New Roman, serif", color: GRAY_700 }} />
                            <Line type="monotone" dataKey="Strategy A" stroke={LINE_COLORS.A} strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="Strategy B" stroke={LINE_COLORS.B} strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="Strategy C" stroke={LINE_COLORS.C} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
                            {results.break_even_year && (
                                <ReferenceLine
                                    x={results.break_even_year}
                                    stroke={GRAY_700}
                                    strokeDasharray="6 4"
                                    strokeWidth={2}
                                    label={{ value: `Break-even (Yr ${results.break_even_year})`, position: "top", fill: GRAY_700, fontSize: 11 }}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }
);

export default FormalReportCharts;
