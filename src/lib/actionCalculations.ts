/**
 * Action calculations for the carbon-climatch Action Hub.
 * Contains financial models for green technology investments and bank green financing.
 */

export interface GreenTechInputs {
  capexIdr: number;
  emissionsReducedTco2: number;
  carbonPriceIdr: number;
  annualEnergySavingsIdr: number; // PLN electricity cost savings
  corporateTaxRatePct: number;
  horizonYears: number;
  discountRatePct?: number; // defaults to 8%
}

export interface GreenTechResult {
  annualCarbonTaxSavings: number;
  annualEnergySavings: number;
  totalAnnualGrossSavings: number;
  netAnnualSavingsAfterTax: number;
  paybackYears: number;
  npv: number;
  irr: number;
}

export interface GreenLoanInputs {
  principalIdr: number;
  annualInterestRatePct: number;
  termYears: number;
  corporateTaxRatePct: number;
}

export interface YearlyAmortization {
  year: number;
  openingBalance: number;
  totalRepayment: number;
  principalRepayment: number;
  interestPaid: number;
  taxShield: number; // Interest * taxRate
  closingBalance: number;
}

export interface GreenLoanResult {
  monthlyPayment: number;
  totalInterestPaid: number;
  totalTaxShield: number;
  schedule: YearlyAmortization[];
}

/**
 * Calculates financial returns for a green technology investment.
 */
export function calculateGreenTechReturns(inputs: GreenTechInputs): GreenTechResult {
  const {
    capexIdr,
    emissionsReducedTco2,
    carbonPriceIdr,
    annualEnergySavingsIdr,
    corporateTaxRatePct,
    horizonYears,
    discountRatePct = 8
  } = inputs;

  const taxRate = corporateTaxRatePct / 100;
  const discountRate = discountRatePct / 100;

  // Annual gross savings
  const annualCarbonTaxSavings = emissionsReducedTco2 * carbonPriceIdr;
  const annualEnergySavings = annualEnergySavingsIdr;
  const totalAnnualGrossSavings = annualCarbonTaxSavings + annualEnergySavings;

  // Under Indonesian tax law, energy cost savings are taxable income (or rather, reduction in deductible expenses),
  // but carbon tax savings directly reduce a liability, and we can write off depreciation.
  // For simplicity and CFO boardroom appeal:
  // Net cash inflow = Gross Savings * (1 - Tax Rate) + Depreciation * Tax Rate (Straight-line)
  const annualDepreciation = capexIdr / horizonYears;
  const depreciationTaxShield = annualDepreciation * taxRate;
  
  // Net cash flow per year
  const netAnnualSavingsAfterTax = totalAnnualGrossSavings * (1 - taxRate) + depreciationTaxShield;

  // Simple Payback Period
  const paybackYears = netAnnualSavingsAfterTax > 0 ? capexIdr / netAnnualSavingsAfterTax : Infinity;

  // Net Present Value (NPV)
  let npv = -capexIdr;
  for (let year = 1; year <= horizonYears; year++) {
    npv += netAnnualSavingsAfterTax / Math.pow(1 + discountRate, year);
  }

  // Internal Rate of Return (IRR) - numerical approximation via secant method
  let irr = 0.12; // Initial guess: 12%
  const tolerance = 0.0001;
  const maxIterations = 100;
  
  function getNpvAtRate(rate: number): number {
    let currentNpv = -capexIdr;
    for (let year = 1; year <= horizonYears; year++) {
      currentNpv += netAnnualSavingsAfterTax / Math.pow(1 + rate, year);
    }
    return currentNpv;
  }

  let rate0 = 0.01;
  let rate1 = 0.50;
  let npv0 = getNpvAtRate(rate0);
  let npv1 = getNpvAtRate(rate1);

  for (let i = 0; i < maxIterations; i++) {
    if (Math.abs(npv1 - npv0) < tolerance) {
      irr = rate1;
      break;
    }
    const rateNext = rate1 - npv1 * (rate1 - rate0) / (npv1 - npv0);
    if (Math.abs(rateNext - rate1) < tolerance) {
      irr = rateNext;
      break;
    }
    rate0 = rate1;
    npv0 = npv1;
    rate1 = rateNext;
    npv1 = getNpvAtRate(rate1);
  }

  // Cap IRR to realistic values or return 0 if cashflows don't support it
  if (isNaN(irr) || irr < -0.99 || irr > 5) {
    irr = 0;
  }

  return {
    annualCarbonTaxSavings,
    annualEnergySavings,
    totalAnnualGrossSavings,
    netAnnualSavingsAfterTax,
    paybackYears: parseFloat(paybackYears.toFixed(2)),
    npv: Math.round(npv),
    irr: parseFloat((irr * 100).toFixed(2))
  };
}

/**
 * Calculates debt amortization schedule and tax benefits for a green financing loan.
 */
export function calculateGreenLoanAmortization(inputs: GreenLoanInputs): GreenLoanResult {
  const { principalIdr, annualInterestRatePct, termYears, corporateTaxRatePct } = inputs;
  
  const r = (annualInterestRatePct / 100) / 12; // Monthly rate
  const n = termYears * 12; // Total monthly payments
  const taxRate = corporateTaxRatePct / 100;

  // Standard amortized payment formula: PMT = P * r * (1+r)^n / ((1+r)^n - 1)
  let monthlyPayment = 0;
  if (r > 0) {
    monthlyPayment = (principalIdr * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  } else {
    monthlyPayment = principalIdr / n;
  }

  let totalInterestPaid = 0;
  let totalTaxShield = 0;
  const schedule: YearlyAmortization[] = [];

  let balance = principalIdr;

  for (let year = 1; year <= termYears; year++) {
    const openingBalance = balance;
    let yearInterest = 0;
    let yearPrincipal = 0;
    let yearRepayment = 0;

    // Accumulate 12 months for the yearly breakdown
    for (let month = 1; month <= 12; month++) {
      const interest = balance * r;
      const principal = monthlyPayment - interest;
      
      yearInterest += interest;
      yearPrincipal += principal;
      yearRepayment += monthlyPayment;
      balance -= principal;
    }

    // Adjust for minor floating point errors in final year
    if (year === termYears && balance !== 0) {
      yearPrincipal += balance;
      yearRepayment += balance;
      balance = 0;
    }

    const taxShield = yearInterest * taxRate;
    totalInterestPaid += yearInterest;
    totalTaxShield += taxShield;

    schedule.push({
      year,
      openingBalance: Math.round(openingBalance),
      totalRepayment: Math.round(yearRepayment),
      principalRepayment: Math.round(yearPrincipal),
      interestPaid: Math.round(yearInterest),
      taxShield: Math.round(taxShield),
      closingBalance: Math.round(Math.max(0, balance))
    });
  }

  return {
    monthlyPayment: Math.round(monthlyPayment),
    totalInterestPaid: Math.round(totalInterestPaid),
    totalTaxShield: Math.round(totalTaxShield),
    schedule
  };
}
