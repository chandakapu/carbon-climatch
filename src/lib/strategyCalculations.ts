import type {
    StrategyInputs,
    StrategyResult,
    StrategyResults,
    YearlyBreakdown,
} from "@/types";

// ── Helpers ───────────────────────────────────────────────────────

/**
 * PMT formula — calculates fixed monthly payment for an amortised loan.
 * Returns the ANNUAL total (monthly payment × 12).
 */
export function pmt(principal: number, annualRate: number, termYears: number): number {
    if (principal <= 0) return 0;
    if (annualRate <= 0) return principal / termYears; // interest-free
    const monthlyRate = annualRate / 100 / 12;
    const months = termYears * 12;
    const factor = Math.pow(1 + monthlyRate, months);
    const monthlyPayment = (principal * monthlyRate * factor) / (factor - 1);
    return monthlyPayment * 12;
}

// ── Strategy A — OPEX (Credits Only) ─────────────────────────────

export function calculateOPEX(inputs: StrategyInputs): StrategyResult {
    const { annual_emissions, carbon_price_idr, carbon_price_escalation_pct, planning_horizon_years } = inputs;
    const escalation = carbon_price_escalation_pct / 100;

    const yearly: YearlyBreakdown[] = [];
    const cumulative: number[] = [];
    let runningTotal = 0;

    for (let y = 1; y <= planning_horizon_years; y++) {
        const creditCost = annual_emissions * carbon_price_idr * Math.pow(1 + escalation, y);
        const entry: YearlyBreakdown = {
            year: y,
            credit_cost: creditCost,
            capex_repayment: 0,
            maintenance: 0,
            tax_shield: 0,
            net_cost: creditCost,
        };
        yearly.push(entry);
        runningTotal += creditCost;
        cumulative.push(runningTotal);
    }

    return {
        name: "Strategy A — OPEX (Credits)",
        yearly,
        cumulative,
        total_cost: runningTotal,
    };
}

// ── Strategy B — CAPEX (Green Investment) ─────────────────────────

export function calculateCAPEX(
    inputs: StrategyInputs,
    opexCumulative?: number[]
): StrategyResult {
    const {
        annual_emissions,
        carbon_price_idr,
        carbon_price_escalation_pct,
        planning_horizon_years,
        capex_amount_idr,
        emission_reduction_pct,
        down_payment_pct,
        interest_rate_pct,
        loan_term_years,
        maintenance_pct,
        depreciation_method,
        depreciation_life_years,
        corporate_tax_rate_pct,
    } = inputs;

    const escalation = carbon_price_escalation_pct / 100;
    const taxRate = corporate_tax_rate_pct / 100;
    const emissionReduction = emission_reduction_pct / 100;
    const downPayment = capex_amount_idr * (down_payment_pct / 100);
    const financedAmount = capex_amount_idr - downPayment;
    const annualRepayment = pmt(financedAmount, interest_rate_pct, loan_term_years);
    const annualMaintenance = capex_amount_idr * (maintenance_pct / 100);

    const yearly: YearlyBreakdown[] = [];
    const cumulative: number[] = [];
    let runningTotal = downPayment; // Year 0: down payment
    let bookValue = capex_amount_idr;
    let breakEvenYear: number | null = null;

    for (let y = 1; y <= planning_horizon_years; y++) {
        // Depreciation
        let depreciation: number;
        if (depreciation_method === "Straight-line") {
            depreciation = y <= depreciation_life_years ? capex_amount_idr / depreciation_life_years : 0;
        } else {
            // Declining balance (double-declining)
            const rate = 2 / depreciation_life_years;
            depreciation = y <= depreciation_life_years ? bookValue * rate : 0;
            bookValue = Math.max(0, bookValue - depreciation);
        }

        // Simplified annual interest (on full financed amount — simplified per spec)
        const interestThisYear = y <= loan_term_years ? financedAmount * (interest_rate_pct / 100) : 0;

        // Tax shield
        const taxShield = (depreciation + interestThisYear) * taxRate;

        // Residual emissions still need credits
        const residualEmissions = Math.max(0, annual_emissions - annual_emissions * emissionReduction);
        const creditsCost = residualEmissions * carbon_price_idr * Math.pow(1 + escalation, y);

        // Repayment only during loan term
        const repaymentThisYear = y <= loan_term_years ? annualRepayment : 0;

        const netCost = repaymentThisYear + annualMaintenance + creditsCost - taxShield;

        yearly.push({
            year: y,
            credit_cost: creditsCost,
            capex_repayment: repaymentThisYear,
            maintenance: annualMaintenance,
            tax_shield: taxShield,
            net_cost: netCost,
        });

        runningTotal += netCost;
        cumulative.push(runningTotal);

        // Check break-even against OPEX
        if (opexCumulative && breakEvenYear === null && y <= opexCumulative.length) {
            if (runningTotal < opexCumulative[y - 1]) {
                breakEvenYear = y;
            }
        }
    }

    const result: StrategyResult & { break_even_year: number | null } = {
        name: "Strategy B — CAPEX (Green Investment)",
        yearly,
        cumulative,
        total_cost: runningTotal,
        break_even_year: breakEvenYear,
    };

    return result;
}

// ── Strategy C — Mixed ────────────────────────────────────────────

export function calculateMixed(inputs: StrategyInputs): StrategyResult {
    const {
        annual_emissions,
        carbon_price_idr,
        carbon_price_escalation_pct,
        planning_horizon_years,
        capex_amount_idr,
        emission_reduction_pct,
        down_payment_pct,
        interest_rate_pct,
        loan_term_years,
        maintenance_pct,
        depreciation_method,
        depreciation_life_years,
        corporate_tax_rate_pct,
        mixed_capex_allocation_pct,
    } = inputs;

    const capexAllocation = mixed_capex_allocation_pct / 100;
    const escalation = carbon_price_escalation_pct / 100;
    const taxRate = corporate_tax_rate_pct / 100;

    // Scale CAPEX by allocation %
    const scaledCapex = capex_amount_idr * capexAllocation;
    const scaledReduction = (emission_reduction_pct / 100) * capexAllocation;
    const downPayment = scaledCapex * (down_payment_pct / 100);
    const financedAmount = scaledCapex - downPayment;
    const annualRepayment = pmt(financedAmount, interest_rate_pct, loan_term_years);
    const annualMaintenance = scaledCapex * (maintenance_pct / 100);

    const yearly: YearlyBreakdown[] = [];
    const cumulative: number[] = [];
    let runningTotal = downPayment;
    let bookValue = scaledCapex;

    for (let y = 1; y <= planning_horizon_years; y++) {
        // Depreciation on scaled capex
        let depreciation: number;
        if (depreciation_method === "Straight-line") {
            depreciation = y <= depreciation_life_years ? scaledCapex / depreciation_life_years : 0;
        } else {
            const rate = 2 / depreciation_life_years;
            depreciation = y <= depreciation_life_years ? bookValue * rate : 0;
            bookValue = Math.max(0, bookValue - depreciation);
        }

        const interestThisYear = y <= loan_term_years ? financedAmount * (interest_rate_pct / 100) : 0;
        const taxShield = (depreciation + interestThisYear) * taxRate;

        // Emissions gap = total - reduced by scaled CAPEX
        const reducedEmissions = annual_emissions * scaledReduction;
        const residualEmissions = Math.max(0, annual_emissions - reducedEmissions);
        const creditsCost = residualEmissions * carbon_price_idr * Math.pow(1 + escalation, y);

        const repaymentThisYear = y <= loan_term_years ? annualRepayment : 0;
        const netCost = repaymentThisYear + annualMaintenance + creditsCost - taxShield;

        yearly.push({
            year: y,
            credit_cost: creditsCost,
            capex_repayment: repaymentThisYear,
            maintenance: annualMaintenance,
            tax_shield: taxShield,
            net_cost: netCost,
        });

        runningTotal += netCost;
        cumulative.push(runningTotal);
    }

    return {
        name: "Strategy C — Mixed",
        yearly,
        cumulative,
        total_cost: runningTotal,
    };
}

// ── Orchestrator ──────────────────────────────────────────────────

export function calculateAllStrategies(inputs: StrategyInputs): StrategyResults {
    const strategy_a = calculateOPEX(inputs);
    const strategy_b = calculateCAPEX(inputs, strategy_a.cumulative);
    const strategy_c = calculateMixed(inputs);

    // Determine break-even year from strategy_b result
    const break_even_year = (strategy_b as StrategyResult & { break_even_year?: number | null }).break_even_year ?? null;

    // Recommend cheapest
    const totals = [
        { key: "A" as const, cost: strategy_a.total_cost },
        { key: "B" as const, cost: strategy_b.total_cost },
        { key: "C" as const, cost: strategy_c.total_cost },
    ];
    totals.sort((a, b) => a.cost - b.cost);
    const recommended = totals[0].key;

    return { strategy_a, strategy_b, strategy_c, break_even_year, recommended };
}
