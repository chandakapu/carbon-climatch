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