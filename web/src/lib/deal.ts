import type { Property, RehabCategory } from "@/data/types";

/** The 70% rule the mockups state up front: MAO = ARV × 0.7 − rehab. */
export const RULE_70 = 0.7;

export function maxAllowableOffer(p: Property): number {
  return Math.round(p.arv * RULE_70 - p.rehabBudget);
}

/** Positive when the purchase price came in over the 70% rule's ceiling. */
export function overMao(p: Property): number {
  return p.purchasePrice - maxAllowableOffer(p);
}

/**
 * Rehab cost to carry in a forecast: what has been spent, or the budget,
 * whichever is higher — an overrun does not un-spend itself.
 */
export function rehabForecast(p: Property): number {
  return Math.max(p.rehabSpent, p.rehabBudget);
}

/**
 * Projected all-in, excluding financing costs — the figure the portfolio table
 * and the property header both show. A deal that has not closed yet has
 * committed nothing beyond its price.
 */
export function allInProjected(p: Property): number {
  if (p.stage === "under-contract") return p.purchasePrice;
  return p.purchasePrice + p.closingCosts + rehabForecast(p) + p.holdingCosts;
}

/** All-in including points and interest — the deal sheet's bottom line. */
export function allInWithFinancing(p: Property): number {
  return allInProjected(p) + p.loanCosts;
}

/**
 * A renovation that is still running. A property listed for sale is included:
 * the work is finished only when it stops drawing on the rehab budget, and
 * mockup 1b files both the in-rehab and the listed property under "שיפוץ".
 */
export function isRenovating(p: Property): boolean {
  return p.stage === "rehab" || p.stage === "listed";
}

export function rehabProgressPct(p: Property): number {
  if (p.rehabBudget === 0) return 0;
  return (p.rehabSpent / p.rehabBudget) * 100;
}

export function rehabRemaining(p: Property): number {
  return p.rehabBudget - p.rehabSpent;
}

/** Loan size a cash-out refinance would support at the target LTV. */
export function refinanceLoan(p: Property): number | null {
  if (!p.refinanceLtvPct) return null;
  return Math.round(p.arv * (p.refinanceLtvPct / 100));
}

/** Cash released at refinance, net of everything already in the deal. */
export function cashOut(p: Property): number | null {
  const loan = refinanceLoan(p);
  if (loan === null) return null;
  return loan - allInProjected(p);
}

export function monthlyCashFlow(p: Property): number | null {
  if (p.monthlyRent === undefined) return null;
  return p.monthlyRent - (p.monthlyDebtService ?? 0) - (p.monthlyOpex ?? 0);
}

/** Cash-on-cash: a year of cash flow against the cash still in the deal. */
export function cashOnCashPct(p: Property): number | null {
  const cf = monthlyCashFlow(p);
  if (cf === null || !p.cashLeftInDeal) return null;
  return ((cf * 12) / p.cashLeftInDeal) * 100;
}

/** Return on the flip, measured against everything put into the property. */
export function flipRoiPct(p: Property): number | null {
  if (p.flipNetProfit === undefined) return null;
  return (p.flipNetProfit / allInProjected(p)) * 100;
}

export function isOverBudget(c: RehabCategory): boolean {
  return c.spent > c.budget;
}

export type CategoryState = "over" | "done" | "accent";

/** Over budget, finished, or still running — the only distinction the bars make. */
export function categoryState(c: RehabCategory): CategoryState {
  if (isOverBudget(c)) return "over";
  if (c.complete) return "done";
  return "accent";
}

/** Bar fill for a category, capped at full — overruns read as colour, not width. */
export function categoryFillPct(c: RehabCategory): number {
  if (c.budget === 0) return 0;
  return Math.min(c.spent / c.budget, 1) * 100;
}
