"use client";

import { useState, useEffect, useId } from "react";
import { useLanguage } from "@/components/layout/LanguageContext";
import { calculateGreenTechReturns, calculateGreenLoanAmortization } from "@/lib/actionCalculations";
import type { GreenTechResult, GreenLoanResult } from "@/lib/actionCalculations";
import { generateComplianceCertificate } from "@/lib/pdfExport";
import Link from "next/link";
import { 
  Leaf, 
  Cpu, 
  DollarSign, 
  ChevronRight, 
  CheckCircle, 
  HelpCircle, 
  Zap, 
  TrendingUp, 
  FileText,
  Calendar,
  Building,
  Award
} from "lucide-react";

const USD_TO_IDR = 16000;
const DEFAULT_CARBON_PRICE_IDR = 76862;

// Custom Section component matching design system
function Section({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
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

// Helpers for formatted values
function formatIdr(v: number) {
  return `IDR ${v.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
}
function formatUsd(v: number) {
  return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function ActionHubPage() {
  const { language, t } = useLanguage();

  // Profile
  const [companyName, setCompanyName] = useState("IndoSteel Corporation");

  // Corporate compliance numbers (loaded from localStorage or defaults)
  const [initialEmissions, setInitialEmissions] = useState(50000); // tCO2e/year
  const [initialGap, setInitialGap] = useState(50000); // tCO2e/year
  const [initialLiability, setInitialLiability] = useState(240000); // USD (net exposure)
  const [strategyCapex, setStrategyCapex] = useState(5000000000); // IDR CAPEX recommended
  const [recommendedStrat, setRecommendedStrat] = useState("A");

  // User offsets / reductions (tracked in state)
  const [offsetsSecured, setOffsetsSecured] = useState(0); // tCO2e
  const [techReductions, setTechReductions] = useState(0); // tCO2e
  const [totalCostSpent, setTotalCostSpent] = useState(0); // IDR
  const [activeTech, setActiveTech] = useState<string[]>([]);
  const [activeLoans, setActiveLoans] = useState<{ bank: string; amount: number; term: number }[]>([]);

  // Transaction history
  const [transactions, setTransactions] = useState<{ id: string; type: string; details: string; costIdr: number }[]>([]);

  // Page UI State
  const [activeTab, setActiveTab] = useState<"credits" | "tech" | "finance">("credits");
  
  // Modals state
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [selectedCreditProj, setSelectedCreditProj] = useState<any>(null);
  const [creditQuantity, setCreditQuantity] = useState("5000");

  const [techModalOpen, setTechModalOpen] = useState(false);
  const [selectedTech, setSelectedTech] = useState<any>(null);
  const [techCapacity, setTechCapacity] = useState("1000"); // kWp or Units
  const [techSimulation, setTechSimulation] = useState<GreenTechResult | null>(null);

  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [loanAmount, setLoanAmount] = useState("4000000000");
  const [loanTerm, setLoanTerm] = useState("5");
  const [loanInterest, setLoanInterest] = useState("8.0");
  const [loanDownPmt, setLoanDownPmt] = useState("20");
  const [loanSimulation, setLoanSimulation] = useState<GreenLoanResult | null>(null);

  // Load calculations from session
  useEffect(() => {
    const sesEmissions = localStorage.getItem("climatch_emissions");
    const sesGap = localStorage.getItem("climatch_emissions_gap");
    const sesLiability = localStorage.getItem("climatch_liability");
    const sesRecommended = localStorage.getItem("climatch_recommended_strategy");
    const sesCapex = localStorage.getItem("climatch_strategy_capex");

    if (sesEmissions) setInitialEmissions(Number(sesEmissions));
    if (sesGap) {
      setInitialGap(Number(sesGap));
    } else if (sesEmissions) {
      setInitialGap(Number(sesEmissions));
    }

    if (sesLiability) {
      setInitialLiability(Number(sesLiability));
    } else if (sesEmissions) {
      // default: emissions * $65 (EU ETS price)
      setInitialLiability(Number(sesEmissions) * 65);
    }

    if (sesRecommended) setRecommendedStrat(sesRecommended);
    if (sesCapex) setStrategyCapex(Number(sesCapex));

    // Parse URL params for direct tab deep-linking
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab") || params.get("source");
    if (tabParam === "strategy") {
      setActiveTab("finance");
      const paramCapex = params.get("capex");
      if (paramCapex) setLoanAmount(paramCapex);
    } else if (tabParam === "calculator") {
      setActiveTab("credits");
      const paramGap = params.get("gap");
      if (paramGap) setCreditQuantity(Math.ceil(Number(paramGap)).toString());
    }
  }, []);

  // Compute scorecard values
  const remainingGap = Math.max(0, initialGap - offsetsSecured - techReductions);
  // Net remaining liability
  const remainingLiabilityUsd = (remainingGap * (initialLiability / initialGap));
  const remainingLiabilityIdr = remainingLiabilityUsd * USD_TO_IDR;

  // Carbon Offsets projects list
  const creditProjects = [
    {
      id: "rimba-raya",
      name: "Rimba Raya Biodiversity Reserve",
      location: "Central Kalimantan",
      type: "REDD+ Peatland Conservation",
      registry: "SRN-PPI & Verra",
      vintage: "2022",
      priceIdr: 76862, // matching proposed tax rate/spot price
      efficiency: "High permanence, community benefits",
      icon: "🌳"
    },
    {
      id: "lahendong",
      name: "Lahendong Geothermal Project",
      location: "North Sulawesi",
      type: "Renewable Energy Credits",
      registry: "SRN-PPI (IDXCarbon)",
      vintage: "2023",
      priceIdr: 60000,
      efficiency: "Direct fossil-fuel replacement displacement",
      icon: "🌋"
    },
    {
      id: "kehati-bamboo",
      name: "Kehati Bamboo Restoration",
      location: "East Nusa Tenggara",
      type: "Afforestation & Soil Sequestration",
      registry: "SRN-PPI",
      vintage: "2021",
      priceIdr: 90000,
      efficiency: "Biodiversity corridor, local farmers partnership",
      icon: "🎋"
    },
    {
      id: "idxcarbon-c1",
      name: "IDXCarbon Spot Contract (IDX-C1)",
      location: "National Carbon Registry",
      type: "Standard Spot Exchange Contract",
      registry: "OJK / SRN-PPI",
      vintage: "2022-2023",
      priceIdr: 76862,
      efficiency: "Exchange tradeable, liquid standard",
      icon: "📊"
    }
  ];

  // Clean Tech projects list
  const greenTechs = [
    {
      id: "solar-pv",
      name: "Rooftop Solar PV Installation",
      provider: "SUN Energy / Xurya EPC",
      costPerUnitIdr: 1200000, // per kWp (1.2m IDR)
      emissionsPerUnit: 1.1, // tCO2e/year saved per kWp
      energySavingsPerUnit: 1500000, // IDR saved in electric bills per kWp/year
      unitLabel: "kWp Capacity",
      description: "Install grid-connected rooftop solar to permanently cut baseline PLN grid electricity usage.",
      icon: "☀️"
    },
    {
      id: "biomass-boiler",
      name: "Biomass Steam Boiler Conversion",
      provider: "Rimba Green Energy",
      costPerUnitIdr: 100000000, // per ton/hr boiler steam capacity (100m IDR)
      emissionsPerUnit: 150.0, // tCO2e/year saved per unit (replaces coal boiler)
      energySavingsPerUnit: 90000000, // IDR saved in coal/gas cost per unit/year
      unitLabel: "Tons/Hr Capacity",
      description: "Convert existing coal boilers to agricultural waste biomass burners (palm kernel, woodchips).",
      icon: "🔥"
    },
    {
      id: "ev-fleet",
      name: "Electric Logistics Fleet Integration",
      provider: "Electrum EV / ALVA Fleet",
      costPerUnitIdr: 30000000, // per electric delivery bike/van unit (30m IDR)
      emissionsPerUnit: 2.5, // tCO2e/year saved per vehicle
      energySavingsPerUnit: 12000000, // IDR saved in fuel/maintenance per vehicle/year
      unitLabel: "EV Units",
      description: "Replace petrol-based courier/transport bikes with electric transport fleets and charging docks.",
      icon: "🛵"
    }
  ];

  // Green Financing banks list
  const banks = [
    {
      id: "mandiri",
      name: "Bank Mandiri Green Loan",
      headline: "Kredit Hijau Korporasi Mandiri",
      baseRate: 8.2,
      maxTermYears: 10,
      minDownPayment: 20,
      description: "Preferred interest rates for projects listed in green taxonomy (renewable energy, energy efficiency).",
      icon: "🏛️"
    },
    {
      id: "bri",
      name: "BRI Sustainability Bond Financing",
      headline: "Pembiayaan Hijau Lestari BRI",
      baseRate: 8.5,
      maxTermYears: 8,
      minDownPayment: 15,
      description: "Specialized facilities targeted at ESG/SME industrial upgrades with simple regulatory compliance auditing.",
      icon: "🟢"
    },
    {
      id: "bca",
      name: "BCA Solar PV Financing Scheme",
      headline: "Kredit Energi Bersih BCA",
      baseRate: 7.8,
      maxTermYears: 5,
      minDownPayment: 25,
      description: "Optimized for rooftop solar installers with streamlined credit approvals and zero assessment fees.",
      icon: "🔵"
    }
  ];

  // Handlers
  const handleOpenCreditModal = (proj: any) => {
    setSelectedCreditProj(proj);
    setCreditModalOpen(true);
  };

  const handleExecuteCredits = () => {
    if (!selectedCreditProj) return;
    const qty = Number(creditQuantity);
    if (!qty || qty <= 0) return;

    const cost = qty * selectedCreditProj.priceIdr;
    const fee = cost * 0.002;
    const total = cost + fee;

    setOffsetsSecured(prev => prev + qty);
    setTotalCostSpent(prev => prev + total);
    setTransactions(prev => [
      {
        id: Date.now().toString(),
        type: language === "id" ? "Beli Kredit" : "Buy Credits",
        details: `${selectedCreditProj.name} (${qty.toLocaleString()} tCO2e)`,
        costIdr: total
      },
      ...prev
    ]);

    setCreditModalOpen(false);
  };

  const handleOpenTechModal = (tech: any) => {
    setSelectedTech(tech);
    setTechModalOpen(true);
    simulateTech(tech, techCapacity);
  };

  const simulateTech = (tech: any, capStr: string) => {
    const cap = Number(capStr) || 0;
    const returns = calculateGreenTechReturns({
      capexIdr: cap * tech.costPerUnitIdr,
      emissionsReducedTco2: cap * tech.emissionsPerUnit,
      carbonPriceIdr: DEFAULT_CARBON_PRICE_IDR,
      annualEnergySavingsIdr: cap * tech.energySavingsPerUnit,
      corporateTaxRatePct: 22, // default corporate tax
      horizonYears: 5 // 5 year horizon
    });
    setTechSimulation(returns);
  };

  const handleExecuteTech = () => {
    if (!selectedTech || !techSimulation) return;
    const cap = Number(techCapacity);
    if (!cap || cap <= 0) return;

    const totalCapex = cap * selectedTech.costPerUnitIdr;
    const carbonSaved = cap * selectedTech.emissionsPerUnit;

    setTechReductions(prev => prev + carbonSaved);
    setTotalCostSpent(prev => prev + totalCapex);
    setActiveTech(prev => [...prev, `${selectedTech.name} (${cap.toLocaleString()} ${selectedTech.unitLabel})`]);
    setTransactions(prev => [
      {
        id: Date.now().toString(),
        type: language === "id" ? "Pasang Teknologi" : "Install Tech",
        details: `${selectedTech.name} (${cap.toLocaleString()} ${selectedTech.unitLabel})`,
        costIdr: totalCapex
      },
      ...prev
    ]);

    // Prefill loan amount to let user finance this CAPEX
    setLoanAmount(totalCapex.toString());

    setTechModalOpen(false);
  };

  const handleOpenLoanModal = (bank: any) => {
    setSelectedBank(bank);
    setLoanModalOpen(true);
    setLoanInterest(bank.baseRate.toString());
    setLoanTerm("5");
    setLoanDownPmt(bank.minDownPayment.toString());
    simulateLoan(bank, loanAmount, "5", bank.baseRate.toString(), bank.minDownPayment.toString());
  };

  const simulateLoan = (bank: any, amtStr: string, termStr: string, rateStr: string, dpStr: string) => {
    const amt = Number(amtStr) || 0;
    const term = Number(termStr) || 5;
    const rate = Number(rateStr) || 8.0;
    const dp = Number(dpStr) || 20;

    const principal = amt * (1 - dp / 100);

    const amortization = calculateGreenLoanAmortization({
      principalIdr: principal,
      annualInterestRatePct: rate,
      termYears: term,
      corporateTaxRatePct: 22
    });

    setLoanSimulation(amortization);
  };

  const handleExecuteLoan = () => {
    if (!selectedBank || !loanSimulation) return;
    const amt = Number(loanAmount);
    if (!amt || amt <= 0) return;

    setActiveLoans(prev => [
      ...prev,
      {
        bank: selectedBank.name,
        amount: amt,
        term: Number(loanTerm)
      }
    ]);

    setTransactions(prev => [
      {
        id: Date.now().toString(),
        type: language === "id" ? "Kontrak Pinjaman" : "Loan Contract",
        details: `${selectedBank.name} - ${formatIdr(amt)} (${loanTerm} yrs)`,
        costIdr: -amt * (Number(loanDownPmt) / 100) // Cash outflow is only downpayment!
      },
      ...prev
    ]);

    setLoanModalOpen(false);
  };

  const handleReset = () => {
    setOffsetsSecured(0);
    setTechReductions(0);
    setTotalCostSpent(0);
    setActiveTech([]);
    setActiveLoans([]);
    setTransactions([]);
  };

  const handleDownloadCertificate = () => {
    generateComplianceCertificate(
      companyName,
      initialEmissions,
      offsetsSecured,
      techReductions,
      language
    );
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white font-sans">
      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2 text-balance">
              {language === "id" ? t("actionHub.title") : t("actionHub.title")}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-3xl text-pretty">
              {language === "id" ? t("actionHub.subtitle") : t("actionHub.subtitle")}
            </p>
          </div>

          <div className="w-full md:w-auto bg-[#1a1a1a] border border-white/5 rounded-xl p-4 space-y-2">
            <label htmlFor="company-name" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {language === "id" ? "Nama Entitas CFO" : "CFO Entity Profile Name"}
            </label>
            <div className="flex gap-2">
              <input
                id="company-name"
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="rounded-lg border border-white/5 bg-[#2a2a2a] px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#0CF2A0]"
              />
              <button 
                type="button" 
                onClick={handleReset}
                className="rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/25 px-3 py-1.5 text-xs text-red-400 font-semibold cursor-pointer transition-colors"
              >
                {language === "id" ? "Reset Sesi" : "Reset Session"}
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main action tabs (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Tabs Trigger */}
            <div className="flex border-b border-white/5 bg-[#1a1a1a] rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("credits")}
                className={`flex-1 py-3 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2 ${
                  activeTab === "credits" 
                    ? "bg-[#0CF2A0] text-[#111111]" 
                    : "text-slate-400 hover:text-white hover:bg-[#2a2a2a]"
                }`}
              >
                <Leaf className="h-4 w-4" />
                <span>{language === "id" ? t("actionHub.tabs.credits") : t("actionHub.tabs.credits")}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tech")}
                className={`flex-1 py-3 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2 ${
                  activeTab === "tech" 
                    ? "bg-[#0CF2A0] text-[#111111]" 
                    : "text-slate-400 hover:text-white hover:bg-[#2a2a2a]"
                }`}
              >
                <Cpu className="h-4 w-4" />
                <span>{language === "id" ? t("actionHub.tabs.tech") : t("actionHub.tabs.tech")}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("finance")}
                className={`flex-1 py-3 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2 ${
                  activeTab === "finance" 
                    ? "bg-[#0CF2A0] text-[#111111]" 
                    : "text-slate-400 hover:text-white hover:bg-[#2a2a2a]"
                }`}
              >
                <DollarSign className="h-4 w-4" />
                <span>{language === "id" ? t("actionHub.tabs.finance") : t("actionHub.tabs.finance")}</span>
              </button>
            </div>

            {/* TAB CONTENTS */}
            
            {/* 1. Carbon Credits Tab */}
            {activeTab === "credits" && (
              <div className="space-y-6">
                <div className="p-4 bg-[#1a1a1a]/50 border border-white/5 rounded-xl">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {language === "id" ? t("actionHub.creditsTab.description") : t("actionHub.creditsTab.description")}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {creditProjects.map(proj => (
                    <div key={proj.id} className="rounded-xl border border-white/5 bg-[#1a1a1a] p-5 space-y-4 hover:border-[#0CF2A0]/25 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{proj.icon}</span>
                          <div>
                            <h3 className="text-sm font-bold text-white leading-tight">{proj.name}</h3>
                            <p className="text-[10px] text-slate-500">{proj.location}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 text-xs border-t border-b border-white/5 py-3">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{language === "id" ? t("actionHub.creditsTab.projectType") : t("actionHub.creditsTab.projectType")}</p>
                          <p className="font-semibold text-slate-300 mt-0.5">{proj.type}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{language === "id" ? t("actionHub.creditsTab.registry") : t("actionHub.creditsTab.registry")}</p>
                          <p className="font-semibold text-slate-300 mt-0.5">{proj.registry}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{language === "id" ? t("actionHub.creditsTab.vintage") : t("actionHub.creditsTab.vintage")}</p>
                          <p className="font-semibold text-slate-300 mt-0.5">{proj.vintage}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{language === "id" ? t("actionHub.creditsTab.price") : t("actionHub.creditsTab.price")}</p>
                          <p className="font-bold text-[#0CF2A0] mt-0.5">{formatIdr(proj.priceIdr)}/t</p>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 italic leading-relaxed">
                        ✨ {proj.efficiency}
                      </p>

                      <button
                        type="button"
                        onClick={() => handleOpenCreditModal(proj)}
                        className="w-full rounded-lg bg-[#0CF2A0]/10 hover:bg-[#0CF2A0] border border-[#0CF2A0]/30 hover:border-transparent text-xs font-bold text-[#0CF2A0] hover:text-[#111111] py-2.5 transition-all cursor-pointer text-center"
                      >
                        {language === "id" ? t("actionHub.creditsTab.buyBtn") : t("actionHub.creditsTab.buyBtn")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Green Tech Tab */}
            {activeTab === "tech" && (
              <div className="space-y-6">
                <div className="p-4 bg-[#1a1a1a]/50 border border-white/5 rounded-xl">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {language === "id" ? t("actionHub.techTab.description") : t("actionHub.techTab.description")}
                  </p>
                </div>

                <div className="space-y-4">
                  {greenTechs.map(tech => {
                    const activeInstalled = activeTech.some(t => t.includes(tech.name));
                    return (
                      <div key={tech.id} className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6 space-y-4 hover:border-[#0CF2A0]/25 transition-all">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-4">
                          <div className="flex items-center gap-4">
                            <span className="text-3xl p-2 bg-[#2a2a2a] rounded-xl">{tech.icon}</span>
                            <div>
                              <h3 className="text-base font-bold text-white">{tech.name}</h3>
                              <p className="text-xs text-slate-400">Partner: {tech.provider}</p>
                            </div>
                          </div>
                          {activeInstalled && (
                            <span className="self-start sm:self-auto rounded-full bg-[#0CF2A0]/15 border border-[#0CF2A0]/30 text-[#00CF2A0] px-3 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle className="h-3 w-3" />
                              {language === "id" ? "Aktif Terpasang" : "Active Deployment"}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {tech.description}
                        </p>

                        <div className="grid grid-cols-3 gap-4 text-xs bg-[#2a2a2a]/30 rounded-lg p-3">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Est. Unit Cost</p>
                            <p className="font-bold text-white mt-0.5">{formatIdr(tech.costPerUnitIdr)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{language === "id" ? t("actionHub.techTab.reduction") : t("actionHub.techTab.reduction")}</p>
                            <p className="font-bold text-[#0CF2A0] mt-0.5">{tech.emissionsPerUnit.toFixed(1)} tCO2e / Unit</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">PLN Cost Saving</p>
                            <p className="font-bold text-blue-400 mt-0.5">{formatIdr(tech.energySavingsPerUnit)} / Unit</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenTechModal(tech)}
                          className="w-full sm:w-auto rounded-lg bg-[#0CF2A0] hover:bg-[#0CF2A0]/90 text-xs font-bold text-[#111111] px-6 py-2.5 transition-all cursor-pointer"
                        >
                          {language === "id" ? t("actionHub.techTab.installBtn") : t("actionHub.techTab.installBtn")}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Green Financing Tab */}
            {activeTab === "finance" && (
              <div className="space-y-6">
                <div className="p-4 bg-[#1a1a1a]/50 border border-white/5 rounded-xl">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {language === "id" ? t("actionHub.financeTab.description") : t("actionHub.financeTab.description")}
                  </p>
                </div>

                <div className="space-y-4">
                  {banks.map(bank => {
                    const activeLoan = activeLoans.find(l => l.bank === bank.name);
                    return (
                      <div key={bank.id} className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6 space-y-4 hover:border-[#0CF2A0]/25 transition-all">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{bank.icon}</span>
                            <div>
                              <h3 className="text-base font-bold text-white leading-tight">{bank.name}</h3>
                              <p className="text-xs text-[#0CF2A0] font-mono mt-0.5">{bank.headline}</p>
                            </div>
                          </div>
                          {activeLoan && (
                            <span className="self-start sm:self-auto rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle className="h-3 w-3" />
                              {language === "id" ? "Kontrak Aktif" : "Contract Active"}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">
                          {bank.description}
                        </p>

                        <div className="grid grid-cols-3 gap-4 text-xs bg-[#2a2a2a]/30 rounded-lg p-3">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{language === "id" ? t("actionHub.financeTab.rate") : t("actionHub.financeTab.rate")}</p>
                            <p className="font-bold text-white mt-0.5">{bank.baseRate}% Effective</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{language === "id" ? t("actionHub.financeTab.term") : t("actionHub.financeTab.term")}</p>
                            <p className="font-bold text-white mt-0.5">Up to {bank.maxTermYears} Years</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Down Payment</p>
                            <p className="font-bold text-white mt-0.5">Min. {bank.minDownPayment}%</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenLoanModal(bank)}
                          className="w-full sm:w-auto rounded-lg bg-[#0CF2A0] hover:bg-[#0CF2A0]/90 text-xs font-bold text-[#111111] px-6 py-2.5 transition-all cursor-pointer"
                        >
                          {language === "id" ? t("actionHub.financeTab.applyBtn") : t("actionHub.financeTab.applyBtn")}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Simulated Transaction Ledger */}
            {transactions.length > 0 && (
              <Section title={language === "id" ? "📜 Log Transaksi Aksi Karbon" : "📜 Carbon Action Ledger"}>
                <div className="space-y-2 pt-2 max-h-48 overflow-y-auto pr-2">
                  {transactions.map(t => (
                    <div key={t.id} className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-[#2a2a2a]/40 border border-white/5">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-[#0CF2A0] uppercase tracking-wider">{t.type}</span>
                        <p className="text-white font-medium">{t.details}</p>
                      </div>
                      <span className={`font-mono font-semibold ${t.costIdr >= 0 ? "text-red-400" : "text-[#0CF2A0]"}`}>
                        {t.costIdr >= 0 ? "+" : ""} {formatIdr(t.costIdr)}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

          </div>

          {/* Sidebar compliance scorecard (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Dynamic Scorecard Card */}
            <div className={`rounded-2xl border bg-[#1a1a1a] p-6 space-y-6 relative overflow-hidden ${
              remainingGap === 0 ? "border-[#0CF2A0] shadow-lg shadow-[#0CF2A0]/10" : "border-white/5"
            }`}>
              {/* Neutrality Glitter background */}
              {remainingGap === 0 && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#0CF2A0]/5 to-transparent pointer-events-none" />
              )}

              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className={`h-5 w-5 ${remainingGap === 0 ? "text-[#0CF2A0] animate-pulse" : "text-slate-500"}`} />
                  {language === "id" ? t("actionHub.scorecard.title") : t("actionHub.scorecard.title")}
                </h2>
                <p className="text-xs text-slate-500">
                  {companyName}
                </p>
              </div>

              {/* KPI stats list */}
              <div className="space-y-3.5 border-t border-b border-white/5 py-4 text-xs">
                
                {/* 1. Initial Gap */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{language === "id" ? t("actionHub.scorecard.initialExposure") : t("actionHub.scorecard.initialExposure")}:</span>
                  <span className="font-bold text-white">{initialGap.toLocaleString()} tCO2e</span>
                </div>

                {/* 2. Offsets Secured */}
                <div className="flex justify-between items-center text-[#0CF2A0]">
                  <span className="text-slate-400">{language === "id" ? t("actionHub.scorecard.offsetsSecured") : t("actionHub.scorecard.offsetsSecured")}:</span>
                  <span className="font-bold">- {offsetsSecured.toLocaleString()} tCO2e</span>
                </div>

                {/* 3. Tech Reductions */}
                <div className="flex justify-between items-center text-blue-400">
                  <span className="text-slate-400">{language === "id" ? t("actionHub.scorecard.techReductions") : t("actionHub.scorecard.techReductions")}:</span>
                  <span className="font-bold">- {techReductions.toLocaleString()} tCO2e</span>
                </div>

                {/* 4. Total Net Remaining Gap */}
                <div className="flex justify-between items-center pt-2 border-t border-dashed border-white/10 text-sm">
                  <span className="font-semibold text-white">{language === "id" ? t("actionHub.scorecard.remainingExposure") : t("actionHub.scorecard.remainingExposure")}:</span>
                  <span className={`font-bold font-sans ${remainingGap === 0 ? "text-[#0CF2A0]" : "text-red-400"}`}>
                    {remainingGap.toLocaleString()} tCO2e
                  </span>
                </div>

                {/* 5. Remaining Exposure Financial Value */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">{language === "id" ? "Sisa Liabilitas Pajak" : "Est. Remaining Carbon Tax"}:</span>
                  <span className="font-mono text-slate-400">
                    {remainingGap === 0 ? "$0" : `${formatUsd(remainingLiabilityUsd)} (${formatIdr(remainingLiabilityIdr)})`}
                  </span>
                </div>
              </div>

              {/* Status Alert Banner */}
              {remainingGap === 0 ? (
                <div className="rounded-xl bg-[#0CF2A0]/10 border border-[#0CF2A0]/30 p-4 text-center space-y-2 animate-in zoom-in duration-300">
                  <span className="text-2xl">🏆</span>
                  <h3 className="text-[#0CF2A0] font-bold text-sm">
                    {language === "id" ? t("actionHub.scorecard.targetMet") : t("actionHub.scorecard.targetMet")}
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-normal text-pretty">
                    {language === "id" 
                      ? "Seluruh eksposur emisi karbon Anda telah berhasil dinetralisir. Entitas Anda tersertifikasi patuh regulasi."
                      : "All carbon emission exposures have been neutralized. Your entity is fully compliant with carbon pricing norms."
                    }
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3.5 text-center text-[10px] text-amber-400 leading-normal">
                  ⚠️ {language === "id" 
                    ? `Kurangi emisi karbon Anda sebanyak ${remainingGap.toLocaleString()} tCO₂e lagi untuk mengajukan sertifikasi.` 
                    : `Reduce your carbon gap by another ${remainingGap.toLocaleString()} tCO₂e to unlock your neutrality certification.`
                  }
                </div>
              )}

              {/* Generate Certificate PDF Button */}
              <button
                type="button"
                onClick={handleDownloadCertificate}
                disabled={remainingGap > 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0CF2A0] hover:bg-[#0CF2A0]/90 disabled:bg-[#2a2a2a] text-xs font-bold text-[#111111] disabled:text-slate-500 py-3.5 transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
              >
                <FileText className="h-4 w-4" />
                <span>{language === "id" ? t("actionHub.scorecard.downloadCert") : t("actionHub.scorecard.downloadCert")}</span>
              </button>
            </div>

            {/* Strategy Optimizer Recommendation Context Card */}
            {(recommendedStrat === "B" || recommendedStrat === "C") && (initialEmissions > initialGap) && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-950/10 p-5 space-y-3.5 animate-fadeIn">
                <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                  {language === "id" ? "Rencana Strategis Diimpor" : "Strategic Plan Imported"}
                </span>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">
                    {language === "id" 
                      ? `Strategi ${recommendedStrat} — Investasi CAPEX Terencana`
                      : `Strategy ${recommendedStrat} — Planned CAPEX Investment`
                    }
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {language === "id"
                      ? `Kalkulator memuat pengurangan emisi terencana sebesar ${(((initialEmissions - initialGap) / initialEmissions) * 100).toFixed(0)}% dari investasi CAPEX senilai ${formatIdr(strategyCapex)}.`
                      : `The calculator reflects a planned emissions reduction of ${(((initialEmissions - initialGap) / initialEmissions) * 100).toFixed(0)}% stemming from your ${formatIdr(strategyCapex)} CAPEX technology upgrade.`
                    }
                  </p>
                </div>
                <div className="text-[11px] text-slate-300 border-t border-white/5 pt-2.5 space-y-1.5 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{language === "id" ? "Emisi Awal:" : "Baseline Emissions:"}</span>
                    <span className="font-semibold text-white">{initialEmissions.toLocaleString()} tCO₂e</span>
                  </div>
                  <div className="flex justify-between text-blue-400">
                    <span className="text-slate-500">{language === "id" ? "Reduksi CAPEX:" : "CAPEX Reduction:"}</span>
                    <span className="font-semibold">- {(initialEmissions - initialGap).toLocaleString()} tCO₂e</span>
                  </div>
                  <div className="flex justify-between text-amber-400">
                    <span className="text-slate-500">{language === "id" ? "Kesenjangan Bersih:" : "Net Remaining Gap:"}</span>
                    <span className="font-semibold">{initialGap.toLocaleString()} tCO₂e</span>
                  </div>
                </div>
              </div>
            )}

            {/* Active Assets Info Box */}
            <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
                {language === "id" ? "Aset Kepatuhan Aktif" : "Active Compliance Assets"}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-slate-500">{language === "id" ? "Teknologi Terpasang" : "Deployed Technologies"}</p>
                  {activeTech.length === 0 ? (
                    <p className="text-xs text-slate-500 mt-1 italic">{language === "id" ? "Belum ada aset terpasang" : "No active clean tech deployments"}</p>
                  ) : (
                    <ul className="text-xs text-slate-300 space-y-1.5 mt-2.5">
                      {activeTech.map((t, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="border-t border-white/5 pt-3">
                  <p className="text-[10px] text-slate-500">{language === "id" ? "Pembiayaan Hijau Aktif" : "Active Green Financing"}</p>
                  {activeLoans.length === 0 ? (
                    <p className="text-xs text-slate-500 mt-1 italic">{language === "id" ? "Belum ada kontrak pinjaman" : "No active credit agreements"}</p>
                  ) : (
                    <ul className="text-xs text-slate-300 space-y-1.5 mt-2.5">
                      {activeLoans.map((l, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#0CF2A0]" />
                          <span>{l.bank} ({formatIdr(l.amount)})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ── MODAL 1: BUY CARBON CREDITS ── */}
        {creditModalOpen && selectedCreditProj && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/5 bg-[#1a1a1a] p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-base font-bold text-white">
                  {language === "id" ? t("actionHub.creditsTab.modalTitle") : t("actionHub.creditsTab.modalTitle")}
                </h3>
                <button type="button" onClick={() => setCreditModalOpen(false)} className="text-slate-400 hover:text-white text-sm cursor-pointer font-bold">✕</button>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#2a2a2a]/40 rounded-xl">
                <span className="text-2xl">{selectedCreditProj.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-white">{selectedCreditProj.name}</h4>
                  <p className="text-[10px] text-slate-400">{selectedCreditProj.type}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="credit-qty" className="block text-xs font-medium text-slate-300 mb-1.5">
                    {language === "id" ? t("actionHub.creditsTab.quantityLabel") : t("actionHub.creditsTab.quantityLabel")}
                  </label>
                  <div className="relative">
                    <input
                      id="credit-qty"
                      type="number"
                      value={creditQuantity}
                      onChange={e => setCreditQuantity(e.target.value)}
                      className="w-full rounded-lg border border-white/5 bg-[#2a2a2a] px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0CF2A0]/50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">tCO2e</span>
                  </div>
                </div>

                {/* Calculation slip */}
                <div className="rounded-lg bg-[#2a2a2a]/60 p-4 text-xs space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>{language === "id" ? t("actionHub.creditsTab.estCost") : t("actionHub.creditsTab.estCost")}:</span>
                    <span className="font-mono text-white">
                      {formatIdr(Number(creditQuantity) * selectedCreditProj.priceIdr)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-b border-white/5 pb-2">
                    <span>{language === "id" ? t("actionHub.creditsTab.fees") : t("actionHub.creditsTab.fees")}:</span>
                    <span className="font-mono text-white">
                      {formatIdr(Number(creditQuantity) * selectedCreditProj.priceIdr * 0.002)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#0CF2A0] pt-1">
                    <span>{language === "id" ? t("actionHub.creditsTab.total") : t("actionHub.creditsTab.total")}:</span>
                    <span className="font-mono">
                      {formatIdr(Number(creditQuantity) * selectedCreditProj.priceIdr * 1.002)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCreditModalOpen(false)}
                  className="flex-1 rounded-lg border border-white/10 bg-transparent hover:bg-white/5 py-2.5 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCredits}
                  className="flex-1 rounded-lg bg-[#0CF2A0] hover:bg-[#0CF2A0]/90 py-2.5 text-xs font-bold text-[#111111] cursor-pointer"
                >
                  {language === "id" ? t("actionHub.creditsTab.executeBtn") : t("actionHub.creditsTab.executeBtn")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL 2: REQUEST GREEN TECH QUOTE ── */}
        {techModalOpen && selectedTech && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl border border-white/5 bg-[#1a1a1a] p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-base font-bold text-white">
                  {language === "id" ? t("actionHub.techTab.modalTitle") : t("actionHub.techTab.modalTitle")}
                </h3>
                <button type="button" onClick={() => setTechModalOpen(false)} className="text-slate-400 hover:text-white text-sm cursor-pointer font-bold">✕</button>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#2a2a2a]/40 rounded-xl">
                <span className="text-2xl p-1.5 bg-[#2a2a2a] rounded-lg">{selectedTech.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-white">{selectedTech.name}</h4>
                  <p className="text-[10px] text-slate-400">EPC Provider: {selectedTech.provider}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Inputs */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="tech-cap" className="block text-xs font-medium text-slate-300 mb-1.5">
                      {language === "id" ? t("actionHub.techTab.capacityLabel") : t("actionHub.techTab.capacityLabel")}
                    </label>
                    <div className="relative">
                      <input
                        id="tech-cap"
                        type="number"
                        value={techCapacity}
                        onChange={e => {
                          setTechCapacity(e.target.value);
                          simulateTech(selectedTech, e.target.value);
                        }}
                        className="w-full rounded-lg border border-white/5 bg-[#2a2a2a] px-4 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0CF2A0]/50"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">{selectedTech.unitLabel.split(" ")[0]}</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-[#2a2a2a]/40 p-3.5 space-y-2 text-xs border border-white/5">
                    <div className="flex justify-between text-slate-400">
                      <span>Total CAPEX:</span>
                      <span className="font-bold text-white font-mono">{formatIdr(Number(techCapacity) * selectedTech.costPerUnitIdr)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>{language === "id" ? t("actionHub.techTab.reduction") : t("actionHub.techTab.reduction")}:</span>
                      <span className="font-bold text-[#0CF2A0] font-mono">{(Number(techCapacity) * selectedTech.emissionsPerUnit).toLocaleString()} tCO2e / yr</span>
                    </div>
                  </div>
                </div>

                {/* Simulation Output */}
                <div className="bg-[#2a2a2a]/60 rounded-xl p-4 space-y-3.5 border border-white/5 text-xs">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{language === "id" ? "Simulasi Pengembalian Investasi" : "Simulated Financial ROI"}</h4>
                  
                  {techSimulation && (
                    <div className="space-y-2.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tax Savings:</span>
                        <span className="font-semibold text-white font-mono">{formatIdr(techSimulation.annualCarbonTaxSavings)}/yr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Energy Utility Savings:</span>
                        <span className="font-semibold text-white font-mono">{formatIdr(techSimulation.annualEnergySavings)}/yr</span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-2 font-semibold">
                        <span className="text-slate-300">Net Cash Flow:</span>
                        <span className="text-blue-400 font-mono">{formatIdr(techSimulation.netAnnualSavingsAfterTax)}/yr</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold pt-1 text-[#0CF2A0]">
                        <span>{language === "id" ? t("actionHub.techTab.payback") : t("actionHub.techTab.payback")}:</span>
                        <span>{techSimulation.paybackYears} {language === "id" ? "Tahun" : "Years"}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Project NPV: {formatIdr(techSimulation.npv)}</span>
                        <span>IRR: {techSimulation.irr}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setTechModalOpen(false)}
                  className="flex-1 rounded-lg border border-white/10 bg-transparent hover:bg-white/5 py-2.5 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleExecuteTech}
                  className="flex-1 rounded-lg bg-[#0CF2A0] hover:bg-[#0CF2A0]/90 py-2.5 text-xs font-bold text-[#111111] cursor-pointer"
                >
                  {language === "id" ? t("actionHub.techTab.executeBtn") : t("actionHub.techTab.executeBtn")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL 3: SIMULATE BANK LOAN ── */}
        {loanModalOpen && selectedBank && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-white/5 bg-[#1a1a1a] p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-base font-bold text-white">
                  {language === "id" ? t("actionHub.financeTab.modalTitle") : t("actionHub.financeTab.modalTitle")}
                </h3>
                <button type="button" onClick={() => setLoanModalOpen(false)} className="text-slate-400 hover:text-white text-sm cursor-pointer font-bold">✕</button>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#2a2a2a]/40 rounded-xl">
                <span className="text-2xl">{selectedBank.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-white">{selectedBank.name}</h4>
                  <p className="text-[10px] text-[#0CF2A0]">{selectedBank.headline}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Inputs Box */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="loan-amt" className="block text-xs font-medium text-slate-300 mb-1">
                      {language === "id" ? t("actionHub.financeTab.loanAmount") : t("actionHub.financeTab.loanAmount")}
                    </label>
                    <input
                      id="loan-amt"
                      type="number"
                      value={loanAmount}
                      onChange={e => {
                        setLoanAmount(e.target.value);
                        simulateLoan(selectedBank, e.target.value, loanTerm, loanInterest, loanDownPmt);
                      }}
                      className="w-full rounded-lg border border-white/5 bg-[#2a2a2a] px-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#0CF2A0]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor="loan-interest" className="block text-[10px] font-medium text-slate-400 mb-1">
                        {language === "id" ? t("actionHub.financeTab.interestLabel") : t("actionHub.financeTab.interestLabel")}
                      </label>
                      <input
                        id="loan-interest"
                        type="number"
                        step="0.1"
                        value={loanInterest}
                        onChange={e => {
                          setLoanInterest(e.target.value);
                          simulateLoan(selectedBank, loanAmount, loanTerm, e.target.value, loanDownPmt);
                        }}
                        className="w-full rounded-lg border border-white/5 bg-[#2a2a2a] px-2 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#0CF2A0]"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="loan-term" className="block text-[10px] font-medium text-slate-400 mb-1">
                        {language === "id" ? t("actionHub.financeTab.termLabel") : t("actionHub.financeTab.termLabel")}
                      </label>
                      <select
                        id="loan-term"
                        value={loanTerm}
                        onChange={e => {
                          setLoanTerm(e.target.value);
                          simulateLoan(selectedBank, loanAmount, e.target.value, loanInterest, loanDownPmt);
                        }}
                        className="w-full rounded-lg border border-white/5 bg-[#2a2a2a] px-2 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#0CF2A0]"
                      >
                        {[3, 5, 7, 10].map(yr => (
                          <option key={yr} value={yr}>{yr} Yrs</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="loan-dp" className="block text-[10px] font-medium text-slate-400 mb-1">
                        {language === "id" ? t("actionHub.financeTab.downPaymentLabel") : t("actionHub.financeTab.downPaymentLabel")}
                      </label>
                      <input
                        id="loan-dp"
                        type="number"
                        value={loanDownPmt}
                        onChange={e => {
                          setLoanDownPmt(e.target.value);
                          simulateLoan(selectedBank, loanAmount, loanTerm, loanInterest, e.target.value);
                        }}
                        className="w-full rounded-lg border border-white/5 bg-[#2a2a2a] px-2 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#0CF2A0]"
                      />
                    </div>
                  </div>

                  {loanSimulation && (
                    <div className="bg-[#2a2a2a]/40 rounded-xl p-4 border border-white/5 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{language === "id" ? t("actionHub.financeTab.monthlyPmt") : t("actionHub.financeTab.monthlyPmt")}:</span>
                        <span className="font-bold text-[#0CF2A0] font-mono">{formatIdr(loanSimulation.monthlyPayment)} / month</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Interest:</span>
                        <span className="font-semibold text-white font-mono">{formatIdr(loanSimulation.totalInterestPaid)}</span>
                      </div>
                      <div className="flex justify-between text-blue-400 font-semibold border-t border-white/5 pt-2">
                        <span>{language === "id" ? t("actionHub.financeTab.taxShield") : t("actionHub.financeTab.taxShield")}:</span>
                        <span className="font-mono">{formatIdr(loanSimulation.totalTaxShield)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Amortization Table Box */}
                <div className="bg-[#2a2a2a]/60 rounded-xl p-4 border border-white/5 text-xs overflow-hidden flex flex-col max-h-[300px]">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">{language === "id" ? "Jadwal Amortisasi Pinjaman" : "Amortization Table"}</h4>
                  
                  {loanSimulation && (
                    <div className="overflow-y-auto flex-grow pr-1 space-y-1">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-[10px] text-slate-500">
                            <th className="py-1">Yr</th>
                            <th className="py-1">Repayment</th>
                            <th className="py-1">Interest</th>
                            <th className="py-1">Tax Shield</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loanSimulation.schedule.map(sch => (
                            <tr key={sch.year} className="border-b border-white/5 text-[11px] hover:bg-white/5">
                              <td className="py-1.5 font-bold">{sch.year}</td>
                              <td className="py-1.5 font-mono">{formatIdr(sch.totalRepayment)}</td>
                              <td className="py-1.5 font-mono text-red-400">{formatIdr(sch.interestPaid)}</td>
                              <td className="py-1.5 font-mono text-blue-400">{formatIdr(sch.taxShield)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

              <div className="flex gap-3 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setLoanModalOpen(false)}
                  className="flex-1 rounded-lg border border-white/10 bg-transparent hover:bg-white/5 py-2.5 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleExecuteLoan}
                  className="flex-1 rounded-lg bg-[#0CF2A0] hover:bg-[#0CF2A0]/90 py-2.5 text-xs font-bold text-[#111111] cursor-pointer"
                >
                  {language === "id" ? t("actionHub.financeTab.executeBtn") : t("actionHub.financeTab.executeBtn")}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
