"use client";
import { useState } from "react";
import MarkdownRenderer from "../ui/MarkdownRenderer";
import { useLanguage } from "@/components/layout/LanguageContext";

interface AIAnalystPanelProps {
    requestType: "dashboard_summary" | "cbam_result" | "regulation_explainer" | "strategy_optimizer";
    data: Record<string, unknown>;
    triggerLabel?: string;
    onAnalysisComplete?: (analysis: string) => void;
}

export default function AIAnalystPanel({
    requestType,
    data,
    triggerLabel,
    onAnalysisComplete
}: AIAnalystPanelProps) {
    const [analysis, setAnalysis] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const { language, t } = useLanguage();

    const currentTriggerLabel = triggerLabel || t("dashboard.runAnalysisBtn");

    const handleAnalyze = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: requestType, data, language }),
            });

            if (!response.ok) throw new Error("Analysis failed");

            const result = await response.json();
            setAnalysis(result.analysis);
            if (onAnalysisComplete) {
                onAnalysisComplete(result.analysis);
            }
        } catch {
            setError(t("dashboard.errorGeneratingAnalysis"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-[#0CF2A0] text-lg">🤖</span>
                <h3 className="text-white font-medium">{t("dashboard.aiPanelTitle")}</h3>
                <span className="text-xs text-slate-400 bg-[#2a2a2a] px-2 py-0.5 rounded-full">
                    Powered by Gemini
                </span>
            </div>

            {!analysis && !loading && (
                <button
                    onClick={handleAnalyze}
                    className="bg-[#0CF2A0] hover:bg-[#0CF2A0]/90 text-[#111111] text-sm font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-[#0CF2A0]/10 hover:shadow-[#0CF2A0]/20 cursor-pointer"
                >
                    {currentTriggerLabel}
                </button>
            )}

            {loading && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <div className="w-4 h-4 border-2 border-[#0CF2A0] border-t-transparent rounded-full animate-spin" />
                    {language === "id" ? "Menganalisis data regulasi..." : "Analyzing regulatory data..."}
                </div>
            )}

            {error && (
                <p className="text-red-400 text-sm">{error}</p>
            )}

            {analysis && (
                <div>
                    <MarkdownRenderer content={analysis} />
                    <button
                        onClick={handleAnalyze}
                        className="mt-3 text-xs text-[#0CF2A0] hover:underline cursor-pointer"
                    >
                        {language === "id" ? "Hasilkan Ulang" : "Regenerate"}
                    </button>
                </div>
            )}
        </div>
    );
}