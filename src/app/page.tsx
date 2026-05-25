"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { 
  motion, 
  AnimatePresence,
  type Transition,
  type VariantLabels,
  type Target,
  type TargetAndTransition,
} from "framer-motion";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnimationControls = any;
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/layout/LanguageContext";
import { 
  ArrowRight, 
  TrendingUp, 
  Calculator, 
  Zap, 
  FileText, 
  Check
} from "lucide-react";

// --- ROTATING TEXT REF & PROPS ---
interface RotatingTextRef {
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
}

interface RotatingTextProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof motion.span>,
    "children" | "transition" | "initial" | "animate" | "exit"
  > {
  texts: string[];
  transition?: Transition;
  initial?: boolean | Target | VariantLabels;
  animate?: boolean | VariantLabels | AnimationControls | TargetAndTransition;
  exit?: Target | VariantLabels;
  animatePresenceMode?: "sync" | "wait";
  animatePresenceInitial?: boolean;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center" | "random" | number;
  loop?: boolean;
  auto?: boolean;
  splitBy?: "characters" | "words" | "lines" | string;
  onNext?: (index: number) => void;
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
}

const RotatingText = forwardRef<RotatingTextRef, RotatingTextProps>(
  (
    {
      texts,
      transition = { type: "spring", damping: 25, stiffness: 300 },
      initial = { y: "100%", opacity: 0 },
      animate = { y: 0, opacity: 1 },
      exit = { y: "-120%", opacity: 0 },
      animatePresenceMode = "wait",
      animatePresenceInitial = false,
      rotationInterval = 2200,
      staggerDuration = 0.01,
      staggerFrom = "last",
      loop = true,
      auto = true,
      splitBy = "characters",
      onNext,
      mainClassName,
      splitLevelClassName,
      elementLevelClassName,
      ...rest
    },
    ref
  ) => {
    const [currentTextIndex, setCurrentTextIndex] = useState<number>(0);

    const splitIntoCharacters = (text: string): string[] => {
      if (typeof Intl !== "undefined" && Intl.Segmenter) {
        try {
          const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
          return Array.from(segmenter.segment(text), (segment) => segment.segment);
        } catch (error) {
          console.error("Intl.Segmenter failed, falling back to simple split:", error);
          return text.split("");
        }
      }
      return text.split("");
    };

    const elements = useMemo(() => {
      const currentText: string = texts[currentTextIndex] ?? "";
      if (splitBy === "characters") {
        const words = currentText.split(/(\s+)/);
        let charCount = 0;
        return words
          .filter((part) => part.length > 0)
          .map((part) => {
            const isSpace = /^\s+$/.test(part);
            const chars = isSpace ? [part] : splitIntoCharacters(part);
            const startIndex = charCount;
            charCount += chars.length;
            return { characters: chars, isSpace: isSpace, startIndex: startIndex };
          });
      }
      if (splitBy === "words") {
        return currentText
          .split(/(\s+)/)
          .filter((word) => word.length > 0)
          .map((word, i) => ({
            characters: [word],
            isSpace: /^\s+$/.test(word),
            startIndex: i,
          }));
      }
      if (splitBy === "lines") {
        return currentText.split("\n").map((line, i) => ({
          characters: [line],
          isSpace: false,
          startIndex: i,
        }));
      }
      return currentText.split(splitBy).map((part, i) => ({
        characters: [part],
        isSpace: false,
        startIndex: i,
      }));
    }, [texts, currentTextIndex, splitBy]);

    const totalElements = useMemo(() => elements.reduce((sum, el) => sum + el.characters.length, 0), [elements]);

    const getStaggerDelay = useCallback(
      (index: number, total: number): number => {
        if (total <= 1 || !staggerDuration) return 0;
        const stagger = staggerDuration;
        switch (staggerFrom) {
          case "first":
            return index * stagger;
          case "last":
            return (total - 1 - index) * stagger;
          case "center":
            const center = (total - 1) / 2;
            return Math.abs(center - index) * stagger;
          case "random":
            return Math.random() * (total - 1) * stagger;
          default:
            if (typeof staggerFrom === "number") {
              const fromIndex = Math.max(0, Math.min(staggerFrom, total - 1));
              return Math.abs(fromIndex - index) * stagger;
            }
            return index * stagger;
        }
      },
      [staggerFrom, staggerDuration]
    );

    const handleIndexChange = useCallback(
      (newIndex: number) => {
        setCurrentTextIndex(newIndex);
        onNext?.(newIndex);
      },
      [onNext]
    );

    const next = useCallback(() => {
      const nextIndex = currentTextIndex === texts.length - 1 ? (loop ? 0 : currentTextIndex) : currentTextIndex + 1;
      if (nextIndex !== currentTextIndex) handleIndexChange(nextIndex);
    }, [currentTextIndex, texts.length, loop, handleIndexChange]);

    const previous = useCallback(() => {
      const prevIndex = currentTextIndex === 0 ? (loop ? texts.length - 1 : currentTextIndex) : currentTextIndex - 1;
      if (prevIndex !== currentTextIndex) handleIndexChange(prevIndex);
    }, [currentTextIndex, texts.length, loop, handleIndexChange]);

    const jumpTo = useCallback(
      (index: number) => {
        const validIndex = Math.max(0, Math.min(index, texts.length - 1));
        if (validIndex !== currentTextIndex) handleIndexChange(validIndex);
      },
      [texts.length, currentTextIndex, handleIndexChange]
    );

    const reset = useCallback(() => {
      if (currentTextIndex !== 0) handleIndexChange(0);
    }, [currentTextIndex, handleIndexChange]);

    useImperativeHandle(ref, () => ({ next, previous, jumpTo, reset }), [next, previous, jumpTo, reset]);

    useEffect(() => {
      if (!auto || texts.length <= 1) return;
      const intervalId = setInterval(next, rotationInterval);
      return () => clearInterval(intervalId);
    }, [next, rotationInterval, auto, texts.length]);

    function cn(...classes: (string | undefined | null | boolean)[]): string {
      return classes.filter(Boolean).join(" ");
    }

    return (
      <motion.span
        className={cn("inline-flex flex-wrap whitespace-pre-wrap relative align-bottom pb-[6px]", mainClassName)}
        {...rest}
        layout
      >
        <span className="sr-only">{texts[currentTextIndex]}</span>
        <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
          <motion.div
            key={currentTextIndex}
            className={cn(
              "inline-flex flex-wrap relative",
              splitBy === "lines" ? "flex-col items-start w-full" : "flex-row items-baseline"
            )}
            layout
            aria-hidden="true"
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {elements.map((elementObj, elementIndex) => (
              <span
                key={elementIndex}
                className={cn("inline-flex", splitBy === "lines" ? "w-full" : "", splitLevelClassName)}
                style={{ whiteSpace: "pre" }}
              >
                {elementObj.characters.map((char, charIndex) => {
                  const globalIndex = elementObj.startIndex + charIndex;
                  return (
                    <motion.span
                      key={`${char}-${charIndex}`}
                      initial={initial}
                      animate={animate}
                      exit={exit}
                      transition={{
                        ...transition,
                        delay: getStaggerDelay(globalIndex, totalElements),
                      }}
                      className={cn("inline-block leading-none tracking-tight", elementLevelClassName)}
                    >
                      {char === " " ? "\u00A0" : char}
                    </motion.span>
                  );
                })}
              </span>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.span>
    );
  }
);
RotatingText.displayName = "RotatingText";

// --- SHINY TEXT ---
const ShinyText: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => (
  <span className={`relative overflow-hidden inline-block ${className}`}>
    {text}
    <span
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.4), transparent)",
        animation: "shine 2.5s infinite linear",
        opacity: 0.7,
        pointerEvents: "none",
      }}
    />
    <style>{`
      @keyframes shine {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `}</style>
  </span>
);

// --- INTERACTIVE GRID DOTS ---
interface Dot {
  x: number;
  y: number;
  baseColor: string;
  targetOpacity: number;
  currentOpacity: number;
  opacitySpeed: number;
  baseRadius: number;
  currentRadius: number;
}

const DOT_SPACING = 30;
const BASE_OPACITY_MIN = 0.15;
const BASE_OPACITY_MAX = 0.25;
const BASE_RADIUS = 1.2;
const INTERACTION_RADIUS = 180;
const INTERACTION_RADIUS_SQ = INTERACTION_RADIUS * INTERACTION_RADIUS;
const OPACITY_BOOST = 0.65;
const RADIUS_BOOST = 2.0;
const GRID_CELL_SIZE = Math.max(60, Math.floor(INTERACTION_RADIUS / 1.5));

export default function LandingPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const dotsRef = useRef<Dot[]>([]);
  const gridRef = useRef<Record<string, number[]>>({});
  const canvasSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const mousePositionRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

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

  const handleMouseMove = useCallback((event: globalThis.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      mousePositionRef.current = { x: null, y: null };
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    mousePositionRef.current = { x: canvasX, y: canvasY };
  }, []);

  const createDots = useCallback(() => {
    const { width, height } = canvasSizeRef.current;
    if (width === 0 || height === 0) return;

    const newDots: Dot[] = [];
    const newGrid: Record<string, number[]> = {};
    const cols = Math.ceil(width / DOT_SPACING);
    const rows = Math.ceil(height / DOT_SPACING);

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * DOT_SPACING + DOT_SPACING / 2;
        const y = j * DOT_SPACING + DOT_SPACING / 2;
        const cellX = Math.floor(x / GRID_CELL_SIZE);
        const cellY = Math.floor(y / GRID_CELL_SIZE);
        const cellKey = `${cellX}_${cellY}`;

        if (!newGrid[cellKey]) {
          newGrid[cellKey] = [];
        }

        const dotIndex = newDots.length;
        newGrid[cellKey].push(dotIndex);

        const baseOpacity = Math.random() * (BASE_OPACITY_MAX - BASE_OPACITY_MIN) + BASE_OPACITY_MIN;
        newDots.push({
          x,
          y,
          // Emerald-500 matching the design palette
          baseColor: `rgba(16, 185, 129, ${BASE_OPACITY_MAX})`,
          targetOpacity: baseOpacity,
          currentOpacity: baseOpacity,
          opacitySpeed: Math.random() * 0.004 + 0.001,
          baseRadius: BASE_RADIUS,
          currentRadius: BASE_RADIUS,
        });
      }
    }
    dotsRef.current = newDots;
    gridRef.current = newGrid;
  }, []);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    const width = container ? container.clientWidth : window.innerWidth;
    const height = container ? container.clientHeight : window.innerHeight;

    if (
      canvas.width !== width ||
      canvas.height !== height ||
      canvasSizeRef.current.width !== width ||
      canvasSizeRef.current.height !== height
    ) {
      canvas.width = width;
      canvas.height = height;
      canvasSizeRef.current = { width, height };
      createDots();
    }
  }, [createDots]);

  useEffect(() => {
    handleResize();
    const handleMouseLeave = () => {
      mousePositionRef.current = { x: null, y: null };
    };

    const animateDots = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const dots = dotsRef.current;
      const grid = gridRef.current;
      const { width, height } = canvasSizeRef.current;
      const { x: mouseX, y: mouseY } = mousePositionRef.current;

      if (!ctx || !dots || !grid || width === 0 || height === 0) {
        animationFrameId.current = requestAnimationFrame(animateDots);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const activeDotIndices = new Set<number>();
      if (mouseX !== null && mouseY !== null) {
        const mouseCellX = Math.floor(mouseX / GRID_CELL_SIZE);
        const mouseCellY = Math.floor(mouseY / GRID_CELL_SIZE);
        const searchRadius = Math.ceil(INTERACTION_RADIUS / GRID_CELL_SIZE);
        for (let i = -searchRadius; i <= searchRadius; i++) {
          for (let j = -searchRadius; j <= searchRadius; j++) {
            const checkCellX = mouseCellX + i;
            const checkCellY = mouseCellY + j;
            const cellKey = `${checkCellX}_${checkCellY}`;
            if (grid[cellKey]) {
              grid[cellKey].forEach((dotIndex) => activeDotIndices.add(dotIndex));
            }
          }
        }
      }

      dots.forEach((dot, index) => {
        dot.currentOpacity += dot.opacitySpeed;
        if (dot.currentOpacity >= dot.targetOpacity || dot.currentOpacity <= BASE_OPACITY_MIN) {
          dot.opacitySpeed = -dot.opacitySpeed;
          dot.currentOpacity = Math.max(BASE_OPACITY_MIN, Math.min(dot.currentOpacity, BASE_OPACITY_MAX));
          dot.targetOpacity = Math.random() * (BASE_OPACITY_MAX - BASE_OPACITY_MIN) + BASE_OPACITY_MIN;
        }

        let interactionFactor = 0;
        dot.currentRadius = dot.baseRadius;

        if (mouseX !== null && mouseY !== null && activeDotIndices.has(index)) {
          const dx = dot.x - mouseX;
          const dy = dot.y - mouseY;
          const distSq = dx * dx + dy * dy;

          if (distSq < INTERACTION_RADIUS_SQ) {
            const distance = Math.sqrt(distSq);
            interactionFactor = Math.max(0, 1 - distance / INTERACTION_RADIUS);
            interactionFactor = interactionFactor * interactionFactor; // smooth easing
          }
        }

        const finalOpacity = Math.min(0.9, dot.currentOpacity + interactionFactor * OPACITY_BOOST);
        dot.currentRadius = dot.baseRadius + interactionFactor * RADIUS_BOOST;

        ctx.beginPath();
        ctx.fillStyle = `rgba(16, 185, 129, ${finalOpacity.toFixed(3)})`;
        ctx.arc(dot.x, dot.y, dot.currentRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId.current = requestAnimationFrame(animateDots);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", handleResize);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);

    animationFrameId.current = requestAnimationFrame(animateDots);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [handleResize, handleMouseMove]);

  const handleEnterDashboard = () => {
    sessionStorage.setItem("logged_in", "true");
    sessionStorage.setItem("user_email", "cfo@indosteel.co.id");
    window.dispatchEvent(new Event("auth_change"));
    router.push("/dashboard");
  };

  const carbonTestimonials = [
    {
      avatarSrc: "https://randomuser.me/api/portraits/women/32.jpg",
      name: "Sarah Chen",
      handle: "CFO, IndoSteel Group",
      text: language === "id"
        ? "Fitur perhitungan liabilitas CBAM menghemat waktu kami berminggu-minggu dalam penyusunan prakiraan manual. Sangat penting bagi keuangan industri."
        : "The CBAM liability calculation features saved us weeks of manual forecasting. Indispensable for industrial finance."
    },
    {
      avatarSrc: "https://randomuser.me/api/portraits/men/44.jpg",
      name: "Marcus Wijaya",
      handle: "Head of Sustainability, Berbak Power",
      text: language === "id"
        ? "Solusi elegan untuk memantau tren harga IDXCarbon dan mengoptimalkan strategi CAPEX pengurangan emisi."
        : "An elegant solution to monitor IDXCarbon price trends and optimize emission reduction CAPEX strategies."
    },
    {
      avatarSrc: "https://randomuser.me/api/portraits/men/82.jpg",
      name: "David Halim",
      handle: "Treasurer, Semen Nusantara",
      text: language === "id"
        ? "Analis AI Gemini menghasilkan laporan paparan karbon siap saji untuk rapat direksi dalam hitungan detik. Sangat membantu."
        : "The Gemini AI analyst delivers boardroom-ready carbon exposure reports in seconds. Extremely helpful."
    },
  ];

  return (
    <div className="relative bg-[#0b1120] text-slate-300 min-h-screen flex flex-col overflow-x-hidden">
      
      {/* ── INTERACTIVE HERO SECTION ──────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-16 px-6">
        {/* Interactive Canvas dots */}
        <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-70" />
        <div 
          className="absolute inset-0 z-1 pointer-events-none" 
          style={{
            background: "linear-gradient(to bottom, transparent 0%, #0b1120 95%), radial-gradient(ellipse at center, transparent 30%, #0b1120 95%)"
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center gap-6">
          {/* Announcement Shiny Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-2"
          >
            <ShinyText 
              text={language === "id" ? "Pengumuman: Mendukung Regulasi Pajak Karbon Baru 2026" : "Announcing: PR 110/2025 Compliance Alignment"} 
              className="bg-[#10b981]/10 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer hover:border-emerald-500/50 transition-colors" 
            />
          </motion.div>

          {/* Core Animating Header */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl"
          >
            {t("hero.titlePrefix")}
            <span className="block sm:inline-block h-[1.25em] overflow-hidden align-bottom">
              <RotatingText
                texts={titles}
                mainClassName="text-emerald-400 mx-1.5"
                staggerFrom="last"
                initial={{ y: "-100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "110%", opacity: 0 }}
                staggerDuration={0.01}
                transition={{ type: "spring", damping: 18, stiffness: 220 }}
                rotationInterval={2400}
                splitBy="characters"
                auto={true}
                loop={true}
              />
            </span>
          </motion.h1>

          {/* Subtext description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-base sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
          >
            {t("hero.description")}
          </motion.p>

          {/* Call to Actions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center gap-4 mt-4"
          >
            <button
              onClick={handleEnterDashboard}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-7 py-4 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <span>{language === "id" ? "Buka Dasbor Demo" : "Go to Demo Dashboard"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-7 py-4 text-sm font-semibold text-white transition-all cursor-pointer"
            >
              {language === "id" ? "Pelajari Fitur" : "Explore Features"}
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES SECTION ────────────────────────────────────── */}
      <section id="features" className="py-24 bg-slate-950/40 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase text-emerald-400 font-bold tracking-widest">
              {language === "id" ? "Kemampuan Platform" : "Core Capabilities"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {language === "id" ? "Mengelola Kepatuhan Karbon dengan Presisi" : "Quantify Carbon Risks with Precision"}
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              {language === "id" 
                ? "Dirancang khusus untuk CFO, manajer keuangan, dan kepala keberlanjutan sektor industri manufaktur di Indonesia."
                : "Tailor-made for Indonesian corporate finance leaders, sustainability heads, and industrial exporters."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1: IDXCarbon Pricing */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 space-y-4 hover:border-emerald-500/20 transition-all duration-300">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {language === "id" ? "Harga IDXCarbon Bulanan" : "IDXCarbon Pricing Hub"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === "id"
                  ? "Akses data perdagangan bursa karbon Indonesia terbaru dan bandingkan harga domestik secara langsung dengan EU ETS."
                  : "Track domestic Indonesia carbon exchange pricing, monthly volumes, and compare indices directly with EU ETS."}
              </p>
            </div>

            {/* Feature 2: CBAM Calculator */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 space-y-4 hover:border-emerald-500/20 transition-all duration-300">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Calculator className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {language === "id" ? "Kalkulator Paparan CBAM" : "CBAM Liability Calculator"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === "id"
                  ? "Hitung gross liability ekspor baja, semen, pupuk ke Uni Eropa dan kurangi otomatis dengan pajak karbon Indonesia (Pasal 9)."
                  : "Quantify embedded emissions tariffs for EU exports and auto-offset using paid Indonesian carbon tax credits (Article 9)."}
              </p>
            </div>

            {/* Feature 3: Strategy Optimizer */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 space-y-4 hover:border-emerald-500/20 transition-all duration-300">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {language === "id" ? "Pengoptimal CAPEX/OPEX" : "CAPEX Compliance Optimizer"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === "id"
                  ? "Bandingkan skenario CAPEX efisiensi energi vs OPEX beli kredit karbon. Temukan break-even tahun keberapa investasi hijau Anda."
                  : "Compare energy efficiency investments vs purchasing credits. Calculate double-declining depreciation and break-even years."}
              </p>
            </div>

            {/* Feature 4: Gemini AI CFO Analyst */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 space-y-4 hover:border-emerald-500/20 transition-all duration-300">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {language === "id" ? "Laporan CFO AI Gemini" : "Gemini AI Corporate Analyst"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === "id"
                  ? "Hasilkan rangkuman risiko keuangan berformat PDF siap-saji untuk rapat komisaris didukung analitik Gemini 3.5 Flash."
                  : "Generate boardroom-ready executive summaries and financial risk reports directly in PDF with Gemini AI integrations."}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS SECTION ────────────────────────────────── */}
      <section id="testimonials" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase text-emerald-400 font-bold tracking-widest">Testimonials</span>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {language === "id" ? "Dipercaya oleh CFO Indonesia" : "Boardroom Endorsed"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {carbonTestimonials.map((t, idx) => (
              <div key={idx} className="rounded-2xl border border-white/5 bg-slate-900/60 p-6 space-y-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <img src={t.avatarSrc} className="h-10 w-10 object-cover rounded-full border border-white/10" alt={t.name} />
                  <div>
                    <h4 className="text-sm font-semibold text-white">{t.name}</h4>
                    <p className="text-xs text-slate-400">{t.handle}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING SECTION ──────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-slate-950/40 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase text-emerald-400 font-bold tracking-widest">
              {language === "id" ? "Skema Layanan" : "Flexible Tiers"}
            </span>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {language === "id" ? "Pilihan Paket Fleksibel" : "Pricing Tailored to Exporters"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Free Sandbox */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Free Sandbox</h3>
                <p className="text-xs text-slate-400">
                  {language === "id" ? "Untuk edukasi dan eksplorasi awal regulasi" : "Ideal for exploration of global frameworks"}
                </p>
                <div className="text-2xl font-bold text-white pt-2">Rp 0</div>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 flex-grow">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{language === "id" ? "Akses Dasbor IDXCarbon" : "Access to IDXCarbon prices"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{language === "id" ? "Simulasi Kalkulator CBAM Dasar" : "Basic CBAM calculations"}</span>
                </li>
              </ul>
              <button
                onClick={handleEnterDashboard}
                className="w-full rounded-xl bg-white/5 border border-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors cursor-pointer text-center"
              >
                {language === "id" ? "Coba Sekarang" : "Start Demo"}
              </button>
            </div>

            {/* Enterprise Pro */}
            <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/60 p-6 flex flex-col justify-between space-y-6 relative">
              <div className="absolute -top-3 right-6 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold text-black uppercase tracking-wider">
                Popular
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Enterprise Pro</h3>
                <p className="text-xs text-slate-400">
                  {language === "id" ? "Untuk korporasi eksportir aktif" : "For companies exporting to the EU and globally"}
                </p>
                <div className="text-2xl font-bold text-emerald-400 pt-2">
                  Rp 12 jt <span className="text-xs text-slate-400 font-normal">/ bln</span>
                </div>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 flex-grow">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{language === "id" ? "Kalkulator CBAM Lengkap + Pasal 9" : "Full CBAM Portfolio assessment"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{language === "id" ? "Analisis AI Gemini CFO Tanpa Batas" : "Unlimited Gemini AI CFO Analyst"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{language === "id" ? "Pemodelan CAPEX + Ekspor Laporan PDF" : "CAPEX scenario modeling & PDF exports"}</span>
                </li>
              </ul>
              <button
                onClick={handleEnterDashboard}
                className="w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-black hover:bg-emerald-400 transition-colors cursor-pointer text-center shadow-md shadow-emerald-500/10"
              >
                {language === "id" ? "Langganan Sekarang" : "Subscribe Now"}
              </button>
            </div>

            {/* Custom Advisory */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Custom Advisory</h3>
                <p className="text-xs text-slate-400">
                  {language === "id" ? "Integrasi ERP dan konsultasi kustom" : "ERP integrations and customized compliance"}
                </p>
                <div className="text-2xl font-bold text-white pt-2">Contact Us</div>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 flex-grow">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{language === "id" ? "Semua fitur Enterprise Pro" : "All Enterprise Pro features"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{language === "id" ? "Integrasi API Sistem ERP Korporasi" : "Custom ERP integrations (SAP, Oracle)"}</span>
                </li>
              </ul>
              <button
                onClick={handleEnterDashboard}
                className="w-full rounded-xl bg-white/5 border border-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors cursor-pointer text-center"
              >
                {language === "id" ? "Hubungi Penjualan" : "Contact Sales"}
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 bg-slate-950 text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} Carbon Climatch. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
