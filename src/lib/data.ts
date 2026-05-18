import carbonPrices from "../../data/carbon_prices.json";
import idxCarbonMonthly from "../../data/idxcarbon_monthly.json";
import regulatoryTimeline from "../../data/regulatory_timeline.json";
import cbamConfig from "../../data/cbam_config.json";
import type { CarbonPrice, IDXCarbonMonthly, RegulatoryEvent, CBAMConfig } from "@/types";

export function getCarbonPrices(): CarbonPrice[] {
    return carbonPrices as CarbonPrice[];
}

export function getLatestPriceByJurisdiction(): Record<string, CarbonPrice> {
    const prices = getCarbonPrices();
    return prices.reduce((acc, price) => {
        const existing = acc[price.jurisdiction];
        if (!existing || price.year > existing.year) {
            acc[price.jurisdiction] = price;
        }
        return acc;
    }, {} as Record<string, CarbonPrice>);
}

export function getIDXCarbonMonthly(): IDXCarbonMonthly[] {
    return idxCarbonMonthly as IDXCarbonMonthly[];
}

export function getRegulatoryTimeline(): RegulatoryEvent[] {
    return (regulatoryTimeline as RegulatoryEvent[]).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
}

export function getUpcomingEvents(): RegulatoryEvent[] {
    return getRegulatoryTimeline().filter(e => e.status === "upcoming");
}

export function getCBAMConfig(): CBAMConfig {
    return cbamConfig as CBAMConfig;
}