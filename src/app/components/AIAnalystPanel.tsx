"use client";
import { useState } from "react";

interface AIAnalystPanelProps {
    requestType: "dashboard_summary" | "cbam_result" | "regulation_explainer";
    data: Record<string, unknown>;
    triggerLabel?: string;
}

export default function AIAnalystPanel({
    requestType,
    data,
    triggerLabel = "Get AI Analysis"
}: AIAnalystPanelProps) {
    const [analysis, setAnalysis] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const handleAnalyze = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: requestType, data }),
            });

            if (!response.ok) throw new Error("Analysis failed");

            const result = await response.json();
            setAnalysis(result.analysis);
        } catch {
            setError("Could not generate analysis. Check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800 border border-slate-600 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-green-400 text-lg">🤖</span>
                <h3 className="text-white font-medium">AI Carbon Analyst</h3>
                <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">
                    Powered by Gemini
                </span>
            </div>

            {!analysis && !loading && (
                <button
                    onClick={handleAnalyze}
                    className="bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                    {triggerLabel}
                </button>
            )}

            {loading && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                    Analyzing regulatory data...
                </div>
            )}

            {error && (
                <p className="text-red-400 text-sm">{error}</p>
            )}

            {analysis && (
                <div>
                    <p className="text-slate-200 text-sm leading-relaxed">{analysis}</p>
                    <button
                        onClick={handleAnalyze}
                        className="mt-3 text-xs text-slate-400 hover:text-slate-300 underline"
                    >
                        Regenerate
                    </button>
                </div>
            )}
        </div>
    );
}