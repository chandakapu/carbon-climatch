import type { CBAMCalculationResult, CBAMSector, CBAMPortfolioItem, CBAMPortfolioResult } from "@/types";

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

export function calculateCBAMPortfolio(
    items: CBAMPortfolioItem[],
    sectors: CBAMSector[],
    euEtsPriceUsd: number,
    indonesiaCarbonPriceUsd: number
): CBAMPortfolioResult {
    const computedItems = items.flatMap((item) => {
        const sector = sectors.find((s) => s.id === item.sectorId);
        if (!sector) return [];

        const exposure = calculateCBAMExposure(
            sector,
            item.export_volume_tons,
            euEtsPriceUsd,
            indonesiaCarbonPriceUsd
        );

        return [{
            ...exposure,
            id: item.id,
            sectorId: item.sectorId,
        }];
    });

    const totalVolume = computedItems.reduce((sum, item) => sum + item.export_volume_tons, 0);
    const totalEmissions = computedItems.reduce((sum, item) => sum + item.total_emissions_tco2, 0);
    const totalGrossLiabilityUsd = computedItems.reduce((sum, item) => sum + item.cbam_liability_usd, 0);
    const totalIndonesiaCreditUsd = computedItems.reduce((sum, item) => sum + item.indonesia_carbon_credit_usd, 0);
    const totalNetLiabilityUsd = computedItems.reduce((sum, item) => sum + item.net_liability_usd, 0);

    return {
        items: computedItems,
        total_export_volume_tons: totalVolume,
        total_emissions_tco2: totalEmissions,
        total_cbam_liability_usd: totalGrossLiabilityUsd,
        total_cbam_liability_idr: totalGrossLiabilityUsd * USD_TO_IDR,
        total_indonesia_carbon_credit_usd: totalIndonesiaCreditUsd,
        total_net_liability_usd: totalNetLiabilityUsd,
        total_net_liability_idr: totalNetLiabilityUsd * USD_TO_IDR,
    };
}