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

export function getEUETSCAGR(): number {
    const prices = getCarbonPrices().filter(p => p.instrument === "ETS_EU" || p.instrument_name === "EU ETS");
    if (prices.length < 2) return 8;
    const sorted = [...prices].sort((a, b) => a.year - b.year);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const years = last.year - first.year;
    if (years <= 0) return 8;
    const cagr = Math.pow(last.price_usd / first.price_usd, 1 / years) - 1;
    return Math.round(cagr * 100);
}

export function getIDXCarbonCAGR(): number {
    const data = getIDXCarbonMonthly();
    if (data.length < 2) return 8;
    const sorted = [...data].sort((a, b) => a.month.localeCompare(b.month));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const parseMonth = (m: string) => {
        const [year, month] = m.split("-").map(Number);
        return year + (month - 1) / 12;
    };
    const years = parseMonth(last.month) - parseMonth(first.month);
    if (years <= 0) return 8;
    const cagr = Math.pow(last.avg_price_idr / first.avg_price_idr, 1 / years) - 1;
    return Math.round(cagr * 100);
}