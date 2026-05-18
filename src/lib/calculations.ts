import type { CBAMCalculationResult, CBAMSector } from "@/types";

const USD_TO_IDR = 16000; // Update periodically or fetch live

export function calculateCBAMExposure(
    sector: CBAMSector,
    exportVolumeTons: number,
    euEtsPriceUsd: number,
    indonesiaCarbonPriceUsd: number
): CBAMCalculationResult {
    const totalEmissions = exportVolumeTons * sector.emission_factor_tco2_per_ton;
    const grossCBAMUsd = totalEmissions * euEtsPriceUsd;

    // CBAM deducts any carbon price already paid in country of origin
    const indonesiaCredit = totalEmissions * indonesiaCarbonPriceUsd;
    const netLiabilityUsd = Math.max(0, grossCBAMUsd - indonesiaCredit);

    return {
        sector: sector.name,
        export_volume_tons: exportVolumeTons,
        total_emissions_tco2: totalEmissions,
        cbam_liability_usd: grossCBAMUsd,
        cbam_liability_idr: grossCBAMUsd * USD_TO_IDR,
        indonesia_carbon_credit_usd: indonesiaCredit,
        net_liability_usd: netLiabilityUsd,
    };
}