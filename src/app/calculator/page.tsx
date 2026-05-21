"use client";

import { useMemo, useState } from "react";
import { calculateCBAMExposure } from "@/lib/calculations";
import { getCBAMConfig, getIDXCarbonMonthly } from "@/lib/data";
import type { CBAMCalculationResult } from "@/types";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

const USD_TO_IDR = 16000;

function formatUsd(value: number): string {
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    });
}

function formatIdr(value: number): string {
    return `IDR ${value.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
}

export default function CalculatorPage() {
    const { applicableSectors, euEtsPriceUsd, idxPriceUsd, latestIdx } = useMemo(() => {
        const config = getCBAMConfig();
        const applicableSectors = config.sectors.filter((s) => s.cbam_applicable);
        const sortedIDX = [...getIDXCarbonMonthly()].sort((a, b) => a.month.localeCompare(b.month));
        const latestIdx = sortedIDX[sortedIDX.length - 1];
        const idxPriceUsd = latestIdx ? latestIdx.avg_price_idr / USD_TO_IDR : 0;

        return {
            applicableSectors,
            euEtsPriceUsd: config.eu_ets_price_usd,
            idxPriceUsd,
            latestIdx,
        };
    }, []);

    const [sectorId, setSectorId] = useState(applicableSectors[0]?.id ?? "");
    const [exportVolume, setExportVolume] = useState("");
    const [result, setResult] = useState<CBAMCalculationResult | null>(null);
    const [validationError, setValidationError] = useState("");
    const [analysis, setAnalysis] = useState("");
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState("");

    const fetchAnalysis = async (calcResult: CBAMCalculationResult) => {
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
                        net_liability_idr: calcResult.net_liability_usd * USD_TO_IDR,
                        eu_ets_price_usd: euEtsPriceUsd,
                        indonesia_carbon_price_usd: idxPriceUsd,
                    },
                }),
            });

            if (!response.ok) throw new Error("Analysis failed");

            const { analysis: text } = await response.json();
            setAnalysis(text);
        } catch {
            setAnalysisError(
                "Could not generate analysis. Check your connection and try again."
            );
        } finally {
            setAnalysisLoading(false);
        }
    };

    const handleCalculate = () => {
        setValidationError("");
        setResult(null);
        setAnalysis("");
        setAnalysisError("");

        const sector = applicableSectors.find((s) => s.id === sectorId);
        if (!sector) {
            setValidationError("Please select a valid sector.");
            return;
        }

        const volume = Number(exportVolume);
        if (!exportVolume.trim() || Number.isNaN(volume) || volume <= 0) {
            setValidationError("Enter a positive annual export volume in tons.");
            return;
        }

        const calcResult = calculateCBAMExposure(
            sector,
            volume,
            euEtsPriceUsd,
            idxPriceUsd
        );
        setResult(calcResult);
        fetchAnalysis(calcResult);
    };

    const netLiabilityIdr = result ? result.net_liability_usd * USD_TO_IDR : 0;
    const indonesiaCreditIdr = result ? result.indonesia_carbon_credit_usd * USD_TO_IDR : 0;

    return (
        <div className="min-h-screen bg-[#0b1120] text-white font-sans">
            <main className="mx-auto max-w-3xl px-6 py-12">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                        CBAM Exposure Calculator
                    </h1>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Estimate your EU Carbon Border Adjustment Mechanism liability based on
                        sector emission factors, export volume, and current carbon prices.
                    </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6 space-y-5">
                    <div>
                        <label
                            htmlFor="sector"
                            className="block text-sm font-medium text-slate-300 mb-2"
                        >
                            Select your sector
                        </label>
                        <select
                            id="sector"
                            value={sectorId}
                            onChange={(e) => setSectorId(e.target.value)}
                            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        >
                            {applicableSectors.map((sector) => (
                                <option key={sector.id} value={sector.id}>
                                    {sector.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="export-volume"
                            className="block text-sm font-medium text-slate-300 mb-2"
                        >
                            Annual export volume to EU (tons)
                        </label>
                        <input
                            id="export-volume"
                            type="number"
                            min="0"
                            step="any"
                            value={exportVolume}
                            onChange={(e) => setExportVolume(e.target.value)}
                            placeholder="e.g. 10000"
                            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>

                    {validationError && (
                        <p className="text-red-400 text-sm">{validationError}</p>
                    )}

                    <button
                        type="button"
                        onClick={handleCalculate}
                        className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 transition-colors px-4 py-3 text-sm font-bold text-black"
                    >
                        Calculate exposure
                    </button>
                </div>

                {result && (
                    <div className="mt-8 rounded-xl border border-white/10 bg-slate-900/80 p-6 space-y-5">
                        <h2 className="text-lg font-semibold text-white">Results</h2>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-lg bg-slate-800/60 p-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                                    Total estimated emissions
                                </p>
                                <p className="text-xl font-bold text-white">
                                    {result.total_emissions_tco2.toLocaleString("en-US", {
                                        maximumFractionDigits: 2,
                                    })}{" "}
                                    <span className="text-sm font-normal text-slate-400">tCO2e</span>
                                </p>
                            </div>

                            <div className="rounded-lg bg-slate-800/60 p-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                                    Gross CBAM liability
                                </p>
                                <p className="text-xl font-bold text-amber-400">
                                    {formatUsd(result.cbam_liability_usd)}
                                </p>
                                <p className="text-sm text-slate-400 mt-0.5">
                                    {formatIdr(result.cbam_liability_idr)}
                                </p>
                            </div>

                            <div className="rounded-lg bg-slate-800/60 p-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                                    Indonesia carbon credit deduction
                                </p>
                                <p className="text-xl font-bold text-emerald-400">
                                    {formatUsd(result.indonesia_carbon_credit_usd)}
                                </p>
                                <p className="text-sm text-slate-400 mt-0.5">
                                    {formatIdr(indonesiaCreditIdr)}
                                </p>
                            </div>

                            <div className="rounded-lg bg-slate-800/60 p-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                                    Net CBAM liability
                                </p>
                                <p className="text-xl font-bold text-red-400">
                                    {formatUsd(result.net_liability_usd)}
                                </p>
                                <p className="text-sm text-slate-400 mt-0.5">
                                    {formatIdr(netLiabilityIdr)}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500">
                            Prices used: EU ETS {formatUsd(euEtsPriceUsd)}/tCO2e · IDXCarbon{" "}
                            {latestIdx
                                ? `${latestIdx.month} (${formatIdr(latestIdx.avg_price_idr)}/tCO2e, ~${idxPriceUsd.toFixed(2)} USD)`
                                : "N/A"}
                        </p>

                        <div className="border-t border-slate-700 pt-5">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-emerald-400 text-lg">🤖</span>
                                <h3 className="text-white font-medium text-sm">AI Analyst Summary</h3>
                            </div>

                            {analysisLoading && (
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                    Generating plain-language summary...
                                </div>
                            )}

                            {analysisError && (
                                <p className="text-red-400 text-sm">{analysisError}</p>
                            )}

                            {analysis && !analysisLoading && (
                                <MarkdownRenderer content={analysis} />
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
