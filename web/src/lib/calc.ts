import type { FinancingKind, Property } from "@/data/types";

/**
 * Deal maths, transcribed from the investor's own spreadsheet ("מחשבון עסקה",
 * Google Drive) — the Flip tab, the BRRRR tab and the buy‑and‑hold tab. Every
 * formula here reproduces that sheet's totals; scripts/calc.test.ts pins them.
 *
 * Pure functions over plain numbers, no React and no runtime imports, so the
 * same file runs under plain Node for the tests. Only `import type` from "@/".
 */

// ── inputs ──────────────────────────────────────────────────────────────────

/** The sheet's itemized closing list, in its order. All USD. */
export interface ClosingItems {
  titleInsurance: number;
  closingProtectionLetter: number;
  endorsements: number;
  settlement: number;
  recording: number;
  transferTax: number;
  adminFee: number;
  schoolTaxProration: number;
  inspection: number;
  docPrep: number;
  courier: number;
  bringdown: number;
  buyerBrokerFee: number;
}

export const closingItemLabels: Record<keyof ClosingItems, string> = {
  titleInsurance: "ביטוח טייטל",
  closingProtectionLetter: "מכתב הגנת סגירה",
  endorsements: "תוספות לביטוח טייטל",
  settlement: "עמלות נוטריון / סגירה",
  recording: "אגרות רישום",
  transferTax: "מס העברה",
  adminFee: "דמי ניהול",
  schoolTaxProration: "מס בית ספר יחסי",
  inspection: "בדיקת נכס",
  docPrep: "הכנת מסמכים",
  courier: "דמי שליחות",
  bringdown: "דמי עדכון רישום",
  buyerBrokerFee: "עמלת מתווך קונה",
};

export const closingItemKeys = Object.keys(closingItemLabels) as (keyof ClosingItems)[];

/** Closing costs are estimated as a share of price, or itemized line by line. */
export type ClosingCosts =
  | { mode: "percent"; pct: number }
  | { mode: "itemized"; items: ClosingItems };

export interface PurchaseLoan {
  kind: FinancingKind;
  /** Share of the purchase price the lender funds. */
  ltvPct: number;
  ratePct: number;
  /** Amortization, for conventional / DSCR. Hard money is interest‑only. */
  termYears: number;
}

export interface RehabLoan {
  /** Share of the rehab (incl. contingency) the lender funds — hard money, interest‑only. */
  financedPct: number;
  ratePct: number;
}

export interface Refinance {
  /** Share of ARV the new loan covers. */
  ltvPct: number;
  ratePct: number;
  termYears: number;
  /** Refinance closing costs as a share of the new loan (sheet: 2%). */
  closingPct: number;
  /** Months a lender wants the property seasoned before a cash‑out. */
  seasoningMonths: number;
}

/**
 * Everything forward‑looking about a deal. Lives on Property.assumptions and is
 * what the calculator edits. Facts about the property (price, ARV, rehab
 * budget, closing actually paid) are not in here — see DealInputs.
 */
export interface DealAssumptions {
  /** בלת"מ — the sheet suggests 10–15%. */
  contingencyPct: number;
  /** Carry period for the flip and the rehab loan alike. */
  rehabMonths: number;
  closing: ClosingCosts;
  purchaseLoan: PurchaseLoan;
  rehabLoan: RehabLoan;
  /** Origination points, applied to total loans (the sheet's convention). */
  pointsPct: number;
  /** Carrying costs. Taxes and insurance are annual and feed OpEx too. */
  holding: {
    propertyTaxYr: number;
    insuranceYr: number;
    utilitiesMo: number;
    yardSnowMo: number;
  };
  sale: { agentPct: number; otherPct: number };
  income: { monthlyRent: number; vacancyPct: number };
  /** Management, maintenance and CapEx as shares of rent; HOA in dollars. */
  opex: { managementPct: number; hoaMo: number; maintenancePct: number; capexPct: number };
  /** Undefined means buy‑and‑hold: no cash‑out, CoC on all the cash in. */
  refinance?: Refinance;
  /** Reserves held at purchase, in months of OpEx + debt service (sheet: 3). */
  reservesMonths: number;
}

export interface DealInputs extends DealAssumptions {
  purchasePrice: number;
  arv: number;
  rehabBudget: number;
  /** Closing actually paid. Once a deal has closed this wins over the estimate. */
  closingActual?: number;
}

// ── primitives ──────────────────────────────────────────────────────────────

export const RULE_70 = 0.7;

/** Standard amortized monthly payment. */
export function amortizedPayment(principal: number, ratePct: number, termYears: number): number {
  if (principal <= 0 || termYears <= 0) return 0;
  const i = ratePct / 100 / 12;
  const n = termYears * 12;
  if (i === 0) return principal / n;
  return (principal * i) / (1 - Math.pow(1 + i, -n));
}

/** Interest‑only cost of carrying a loan for a number of months. */
export function interestOnly(principal: number, ratePct: number, months: number): number {
  return (principal * (ratePct / 100) * months) / 12;
}

export function closingItemsTotal(items: ClosingItems): number {
  return closingItemKeys.reduce((sum, key) => sum + (items[key] || 0), 0);
}

export function closingEstimate(closing: ClosingCosts, purchasePrice: number): number {
  return closing.mode === "percent"
    ? purchasePrice * (closing.pct / 100)
    : closingItemsTotal(closing.items);
}

/** Closing costs for the deal: what was paid if known, the estimate otherwise. */
export function closingCostsTotal(i: DealInputs): number {
  return i.closingActual ?? closingEstimate(i.closing, i.purchasePrice);
}

export function contingencyAmount(i: DealInputs): number {
  return i.rehabBudget * (i.contingencyPct / 100);
}

/** Rehab budget plus contingency — what the sheet finances and subtracts. */
export function rehabTotal(i: DealInputs): number {
  return i.rehabBudget + contingencyAmount(i);
}

/** The 70% rule: ARV × 0.7 − rehab (incl. contingency). Rounded — 165,000 × 0.7 is 115,499.99… in floating point. */
export function maxAllowableOffer(i: DealInputs): number {
  return Math.round(i.arv * RULE_70 - rehabTotal(i));
}

export interface LoanBreakdown {
  purchaseLoan: number;
  rehabLoan: number;
  totalLoans: number;
  points: number;
}

export function loanBreakdown(i: DealInputs): LoanBreakdown {
  const purchaseLoan =
    i.purchaseLoan.kind === "cash" ? 0 : i.purchasePrice * (i.purchaseLoan.ltvPct / 100);
  const rehabLoan = rehabTotal(i) * (i.rehabLoan.financedPct / 100);
  const totalLoans = purchaseLoan + rehabLoan;
  return { purchaseLoan, rehabLoan, totalLoans, points: totalLoans * (i.pointsPct / 100) };
}

/** Carrying costs other than interest, over the rehab period. */
export function holdingOther(i: DealInputs, months = i.rehabMonths): number {
  const { propertyTaxYr, insuranceYr, utilitiesMo, yardSnowMo } = i.holding;
  return ((propertyTaxYr + insuranceYr) / 12) * months + (utilitiesMo + yardSnowMo) * months;
}

/** Interest paid over the rehab period, each loan at its own rate. Hard money is interest‑only. */
export function rehabPeriodInterest(i: DealInputs): number {
  const { purchaseLoan, rehabLoan } = loanBreakdown(i);
  return (
    interestOnly(purchaseLoan, i.purchaseLoan.ratePct, i.rehabMonths) +
    interestOnly(rehabLoan, i.rehabLoan.ratePct, i.rehabMonths)
  );
}

export function grossOperatingIncome(i: DealInputs): number {
  return i.income.monthlyRent * (1 - i.income.vacancyPct / 100);
}

/** Monthly operating expenses — taxes and insurance come from the holding block, so they are entered once. */
export function operatingExpenses(i: DealInputs): number {
  const rent = i.income.monthlyRent;
  const { managementPct, hoaMo, maintenancePct, capexPct } = i.opex;
  return (
    rent * (managementPct / 100) +
    i.holding.propertyTaxYr / 12 +
    i.holding.insuranceYr / 12 +
    hoaMo +
    rent * (maintenancePct / 100) +
    rent * (capexPct / 100)
  );
}

export function netOperatingIncome(i: DealInputs): number {
  return grossOperatingIncome(i) - operatingExpenses(i);
}

/** What the purchase loan costs per month while held: nothing for cash, interest for hard money, P&I otherwise. */
export function purchaseLoanPayment(i: DealInputs): number {
  const { purchaseLoan } = loanBreakdown(i);
  switch (i.purchaseLoan.kind) {
    case "cash":
      return 0;
    case "hard-money":
      return interestOnly(purchaseLoan, i.purchaseLoan.ratePct, 1);
    default:
      return amortizedPayment(purchaseLoan, i.purchaseLoan.ratePct, i.purchaseLoan.termYears);
  }
}

// ── scenarios ───────────────────────────────────────────────────────────────

export interface FlipResult extends LoanBreakdown {
  closing: number;
  rehabTotal: number;
  /** Cash in at purchase: unfinanced price plus unfinanced rehab. */
  equity: number;
  rehabInterest: number;
  holdingOther: number;
  /** Interest plus the other carrying costs. */
  holding: number;
  selling: number;
  /** Equity + points + closing + holding — the sheet's "סך השקעה". */
  totalInvestment: number;
  netProfit: number;
  /** Profit over cash invested (levered). Null when nothing was invested. */
  roiPct: number | null;
  mao: number;
  holdMonths: number;
  /** Price + closing + rehab + carry, before financing — the figure the property header shows. */
  allInExFinancing: number;
  taxNote: string;
}

/** The sheet's Flip tab. */
export function evaluateFlip(i: DealInputs): FlipResult {
  const loans = loanBreakdown(i);
  const closing = closingCostsTotal(i);
  const rt = rehabTotal(i);
  const equity = i.purchasePrice - loans.purchaseLoan + (rt - loans.rehabLoan);
  const rehabInterest = rehabPeriodInterest(i);
  const other = holdingOther(i);
  const holding = rehabInterest + other;
  const selling = i.arv * ((i.sale.agentPct + i.sale.otherPct) / 100);
  const totalInvestment = equity + loans.points + closing + holding;
  const netProfit = i.arv - selling - i.purchasePrice - rt - loans.points - closing - holding;

  return {
    ...loans,
    closing,
    rehabTotal: rt,
    equity,
    rehabInterest,
    holdingOther: other,
    holding,
    selling,
    totalInvestment,
    netProfit,
    roiPct: totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : null,
    mao: maxAllowableOffer(i),
    holdMonths: i.rehabMonths,
    allInExFinancing: i.purchasePrice + closing + rt + other,
    taxNote: i.rehabMonths >= 12 ? "רווח הון · ארוך טווח" : "רגיל · קצר טווח",
  };
}

export interface RefinanceResult {
  newLoan: number;
  newPayment: number;
  refiClosing: number;
  /** New loan less loan payoffs less refi closing. Can be negative. */
  cashOut: number;
  equityAfterRefi: number;
  monthsToCash: number;
}

export interface BrrrrResult extends LoanBreakdown {
  closing: number;
  rehabTotal: number;
  purchasePayment: number;
  /**
   * Interest over the rehab period. The sheet leaves this out of "cash needed";
   * it is exposed here so the screen can show it and the user can decide.
   */
  rehabInterest: number;
  reserves: number;
  /** Unfinanced price + unfinanced rehab + closing + points + reserves. */
  totalCashNeeded: number;
  goi: number;
  opex: number;
  noi: number;
  refinance: RefinanceResult | null;
  /** Cash needed less cash‑out; all of cash needed for buy‑and‑hold. */
  cashLeftInDeal: number;
  debtService: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  /** Annual cash flow over cash left. Null when no cash is left in (infinite). */
  cashOnCashPct: number | null;
  capRatePct: number;
  dscr: number | null;
  onePercentRulePct: number;
  taxNote: string;
}

/** The sheet's BRRRR tab; without `refinance` it is the buy‑and‑hold tab. */
export function evaluateBrrrr(i: DealInputs): BrrrrResult {
  const loans = loanBreakdown(i);
  const closing = closingCostsTotal(i);
  const rt = rehabTotal(i);
  const purchasePayment = purchaseLoanPayment(i);
  const opex = operatingExpenses(i);
  const goi = grossOperatingIncome(i);
  const noi = goi - opex;
  const reserves = i.reservesMonths * (opex + purchasePayment);
  const totalCashNeeded =
    i.purchasePrice - loans.purchaseLoan + (rt - loans.rehabLoan) + closing + loans.points + reserves;

  let refinance: RefinanceResult | null = null;
  if (i.refinance) {
    const r = i.refinance;
    const newLoan = i.arv * (r.ltvPct / 100);
    const refiClosing = newLoan * (r.closingPct / 100);
    refinance = {
      newLoan,
      newPayment: amortizedPayment(newLoan, r.ratePct, r.termYears),
      refiClosing,
      cashOut: newLoan - loans.purchaseLoan - loans.rehabLoan - refiClosing,
      equityAfterRefi: i.arv - newLoan,
      monthsToCash: i.rehabMonths + r.seasoningMonths,
    };
  }

  const cashLeftInDeal = refinance ? totalCashNeeded - refinance.cashOut : totalCashNeeded;
  const debtService = refinance ? refinance.newPayment : purchasePayment;
  const monthlyCashFlow = noi - debtService;
  const annualCashFlow = monthlyCashFlow * 12;

  return {
    ...loans,
    closing,
    rehabTotal: rt,
    purchasePayment,
    rehabInterest: rehabPeriodInterest(i),
    reserves,
    totalCashNeeded,
    goi,
    opex,
    noi,
    refinance,
    cashLeftInDeal,
    debtService,
    monthlyCashFlow,
    annualCashFlow,
    cashOnCashPct: cashLeftInDeal > 0 ? (annualCashFlow / cashLeftInDeal) * 100 : null,
    capRatePct: i.purchasePrice > 0 ? ((noi * 12) / i.purchasePrice) * 100 : 0,
    dscr: debtService > 0 ? noi / debtService : null,
    onePercentRulePct: (i.income.monthlyRent / (i.purchasePrice + rt + closing)) * 100,
    taxNote: refinance ? "רווח הון נדחה" : "הכנסה שוטפת",
  };
}

export function evaluateHold(i: DealInputs): BrrrrResult {
  return evaluateBrrrr({ ...i, refinance: undefined });
}

export interface ScenarioComparison {
  flip: FlipResult;
  brrrr: BrrrrResult;
}

export function compareScenarios(i: DealInputs): ScenarioComparison {
  return { flip: evaluateFlip(i), brrrr: evaluateBrrrr(i) };
}

// ── property bridges ────────────────────────────────────────────────────────

export const emptyClosingItems: ClosingItems = {
  titleInsurance: 0,
  closingProtectionLetter: 0,
  endorsements: 0,
  settlement: 0,
  recording: 0,
  transferTax: 0,
  adminFee: 0,
  schoolTaxProration: 0,
  inspection: 0,
  docPrep: 0,
  courier: 0,
  bringdown: 0,
  buyerBrokerFee: 0,
};

/**
 * The sheet's own defaults, shaped to a property's financing. This is what a
 * new deal starts from and what "אפס לברירת מחדל" returns to.
 */
export function defaultAssumptions(p: Pick<Property, "financing" | "monthlyRent">): DealAssumptions {
  const { kind } = p.financing;
  const hardMoney = kind === "hard-money";
  const cash = kind === "cash";
  return {
    contingencyPct: 15,
    rehabMonths: 6,
    closing: { mode: "percent", pct: 3 },
    purchaseLoan: {
      kind,
      ltvPct: cash ? 0 : (p.financing.ltcPct ?? 75),
      ratePct: p.financing.ratePct ?? (hardMoney ? 12 : 7),
      termYears: 30,
    },
    rehabLoan: {
      financedPct: hardMoney ? 100 : 0,
      ratePct: hardMoney ? (p.financing.ratePct ?? 12) : 12,
    },
    pointsPct: p.financing.points ?? (hardMoney ? 2 : 0),
    holding: { propertyTaxYr: 1_800, insuranceYr: 1_200, utilitiesMo: 200, yardSnowMo: 100 },
    sale: { agentPct: 6, otherPct: 2 },
    income: { monthlyRent: p.monthlyRent ?? 0, vacancyPct: 8 },
    opex: { managementPct: 10, hoaMo: 0, maintenancePct: 5, capexPct: 5 },
    refinance: { ltvPct: 75, ratePct: 7.6, termYears: 30, closingPct: 2, seasoningMonths: 6 },
    reservesMonths: 3,
  };
}

const assumptionKeys: (keyof DealAssumptions)[] = [
  "contingencyPct",
  "rehabMonths",
  "closing",
  "purchaseLoan",
  "rehabLoan",
  "pointsPct",
  "holding",
  "sale",
  "income",
  "opex",
  "refinance",
  "reservesMonths",
];

/** Split a DealInputs back into the assumptions a property stores. */
export function assumptionsOf(i: DealInputs): DealAssumptions {
  const out = {} as Record<string, unknown>;
  for (const key of assumptionKeys) out[key] = i[key];
  return out as unknown as DealAssumptions;
}

/** Calculator inputs for a property: its facts plus its stored assumptions. */
export function inputsFromProperty(p: Property): DealInputs {
  return {
    ...p.assumptions,
    purchasePrice: p.purchasePrice,
    arv: p.arv,
    rehabBudget: p.rehabBudget,
    // A closed deal knows what it paid; a deal under contract only estimates.
    closingActual: p.stage === "under-contract" ? undefined : p.closingCosts,
  };
}

/**
 * Write calculator inputs back onto a property. The financing summary and the
 * rent are mirrored so tags and the dashboard keep reading them; nothing else
 * writes those fields.
 */
export function applyInputsToProperty(p: Property, i: DealInputs): Property {
  return {
    ...p,
    purchasePrice: i.purchasePrice,
    arv: i.arv,
    rehabBudget: i.rehabBudget,
    assumptions: assumptionsOf(i),
    financing: {
      kind: i.purchaseLoan.kind,
      ratePct: i.purchaseLoan.kind === "cash" ? undefined : i.purchaseLoan.ratePct,
      points: i.pointsPct > 0 ? i.pointsPct : undefined,
      ltcPct: i.purchaseLoan.kind === "cash" ? undefined : i.purchaseLoan.ltvPct,
      amount: i.purchaseLoan.kind === "cash" ? undefined : loanBreakdown(i).totalLoans,
    },
    monthlyRent: i.income.monthlyRent || undefined,
  };
}
