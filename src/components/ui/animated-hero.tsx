"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageContext";

function Hero() {
  const { language, t } = useLanguage();
  const [titleNumber, setTitleNumber] = useState(0);

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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 via-[#0f1e38] to-[#0b1120] px-6 py-12 md:px-14 md:py-16">
        {/* Glow orbs */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-emerald-500 opacity-[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500 opacity-[0.04] blur-3xl" />

        <div className="relative z-10 flex gap-8 items-center justify-center flex-col text-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t("hero.platformBadge")}
            </div>
          </div>
          <div className="flex gap-4 flex-col items-center">
            <h1 className="text-4xl md:text-6xl max-w-3xl tracking-tighter text-center font-extrabold leading-tight text-white">
              {language === "id" ? (
                <>
                  <span>Navigasi </span>
                  <span className="relative flex w-full justify-center overflow-hidden text-center h-[52px] md:h-[72px] text-emerald-400">
                    {titles.map((title, index) => (
                      <motion.span
                        key={index}
                        className="absolute font-extrabold"
                        initial={{ opacity: 0, y: "-100" }}
                        transition={{ type: "spring", stiffness: 50 }}
                        animate={
                          titleNumber === index
                            ? {
                                y: 0,
                                opacity: 1,
                              }
                            : {
                                y: titleNumber > index ? -150 : 150,
                                opacity: 0,
                              }
                        }
                      >
                        {title}
                      </motion.span>
                    ))}
                  </span>
                  <span className="block mt-1">Indonesia</span>
                </>
              ) : (
                <>
                  <span>Navigate Indonesia&apos;s </span>
                  <span className="relative flex w-full justify-center overflow-hidden text-center h-[52px] md:h-[72px] text-emerald-400">
                    {titles.map((title, index) => (
                      <motion.span
                        key={index}
                        className="absolute font-extrabold"
                        initial={{ opacity: 0, y: "-100" }}
                        transition={{ type: "spring", stiffness: 50 }}
                        animate={
                          titleNumber === index
                            ? {
                                y: 0,
                                opacity: 1,
                              }
                            : {
                                y: titleNumber > index ? -150 : 150,
                                opacity: 0,
                              }
                        }
                      >
                        {title}
                      </motion.span>
                    ))}
                  </span>
                </>
              )}
            </h1>

            <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-2xl text-center text-pretty">
              {t("hero.description")}
            </p>
          </div>

          <div className="flex flex-row flex-wrap justify-center gap-3">
            <a
              href="#ai-analysis"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 transition-all duration-200 px-6 py-3 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              {t("hero.getAiAnalysis")}
            </a>
            <a
              href="#market"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-200 px-6 py-3 text-sm font-semibold text-white cursor-pointer"
            >
              {t("hero.viewMarketData")}
              <MoveRight className="h-4 w-4" />
            </a>
          </div>

          {/* Feature pills */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[
              { icon: "📊", label: t("hero.pills.livePrices") },
              { icon: "🌍", label: t("hero.pills.calculator") },
              { icon: "⚖️", label: t("hero.pills.timeline") },
              { icon: "🤖", label: t("hero.pills.aiAnalysis") },
            ].map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-slate-400"
              >
                <span>{f.icon}</span>
                {f.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
