export interface CarbonPrice {
    jurisdiction: string;
    instrument: string;
    instrument_name: string;
    year: number;
    price_usd: number;
    coverage_pct: number;
}

export interface IDXCarbonMonthly {
    month: string; // "YYYY-MM"
    avg_price_idr: number;
    volume_tco2e: number;
    transactions: number;
}

export interface RegulatoryEvent {
    id: string;
    title: string;
    date: string;
    type: "domestic" | "international";
    status: "active" | "upcoming" | "past" | "planned";
    description: string;
    affected_sectors: string[];
    source_url: string;
}

export interface CBAMSector {
    id: string;
    name: string;
    emission_factor_tco2_per_ton: number;
    cbam_applicable: boolean;
}

export interface CBAMConfig {
    eu_ets_price_usd: number;
    sectors: CBAMSector[];
}

export interface CBAMCalculationResult {
    sector: string;
    export_volume_tons: number;
    total_emissions_tco2: number;
    cbam_liability_usd: number;
    cbam_liability_idr: number;
    indonesia_carbon_credit_usd: number;
    net_liability_usd: number;
}

// ── Strategy Optimizer Types ──────────────────────────────────────

export interface StrategyInputs {
    // Section 1 — Emission & Market Context
    annual_emissions: number;            // tCO2e/year
    carbon_price_idr: number;            // IDR per tCO2e
    carbon_price_escalation_pct: number; // 0–20
    planning_horizon_years: number;      // 1, 3, 5, or 10

    // Section 2 — CAPEX Investment Details
    capex_amount_idr: number;
    emission_reduction_pct: number;      // 0–100
    down_payment_pct: number;            // 0–100
    interest_rate_pct: number;
    loan_term_years: number;             // 3, 5, 7, or 10
    maintenance_pct: number;
    depreciation_method: "Straight-line" | "Declining Balance";
    depreciation_life_years: number;     // 5, 8, 10, or 15

    // Section 3 — Mixed Strategy & Tax
    mixed_capex_allocation_pct: number;  // 0–100
    corporate_tax_rate_pct: number;
}

export interface YearlyBreakdown {
    year: number;
    credit_cost: number;
    capex_repayment: number;
    maintenance: number;
    tax_shield: number;
    net_cost: number;
}

export interface StrategyResult {
    name: string;
    yearly: YearlyBreakdown[];
    cumulative: number[];
    total_cost: number;
}

export interface StrategyResults {
    strategy_a: StrategyResult; // OPEX
    strategy_b: StrategyResult; // CAPEX
    strategy_c: StrategyResult; // Mixed
    break_even_year: number | null;
    recommended: "A" | "B" | "C";
    optimal_mixed_allocation_pct: number;
}

// ── Multi-Sector CBAM Calculator Types ────────────────────────────

export interface CBAMPortfolioItem {
    id: string; // Unique row ID
    sectorId: string; // Selected sector ID
    export_volume_tons: number;
}

export interface CBAMPortfolioResult {
    items: (CBAMCalculationResult & { id: string; sectorId: string })[];
    total_export_volume_tons: number;
    total_emissions_tco2: number;
    total_cbam_liability_usd: number;
    total_cbam_liability_idr: number;
    total_indonesia_carbon_credit_usd: number;
    total_net_liability_usd: number;
    total_net_liability_idr: number;
}

// ── Action Hub Types ──────────────────────────────────────────

export interface CreditProject {
  id: string;
  name: string;
  location: string;
  type: string;
  registry: string;
  vintage: string;
  priceIdr: number;
  efficiency: string;
  icon: string;
}

export interface GreenTech {
  id: string;
  name: string;
  provider: string;
  costPerUnitIdr: number;
  emissionsPerUnit: number;
  energySavingsPerUnit: number;
  unitLabel: string;
  description: string;
  icon: string;
}

export interface Bank {
  id: string;
  name: string;
  headline: string;
  baseRate: number;
  maxTermYears: number;
  minDownPayment: number;
  description: string;
  icon: string;
}

export interface ActionTransaction {
  id: string;
  type: string;
  details: string;
  costIdr: number;
}

export interface LoanRecord {
  bank: string;
  amount: number;
  term: number;
}

// ── YOLO Optimizer AI Response Types ──────────────────────────

export interface YoloOptimizerCreditItem {
  id: string;
  quantity: number;
}

export interface YoloOptimizerTechItem {
  id: string;
  capacity: number;
}

export interface YoloOptimizerResult {
  credits?: YoloOptimizerCreditItem[];
  tech?: YoloOptimizerTechItem[];
}