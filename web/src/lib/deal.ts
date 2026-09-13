import type { Property, RehabCategory } from "@/data/types";
import { holdingOther, inputsFromProperty, maxAllowableOffer as calcMao } from "@/lib/calc";

/**
 * Portfolio‑level derivations the dashboard and property header use. Scenario
 * maths (flip profit, cash‑out refinance, cash flow, CoC) lives in calc.ts,
 * transcribed from the investor's spreadsheet; this file only knows how to
 * read a property's facts and assumptions into those functions.
 */

/** The 70% rule on the property's ARV and rehab budget (plus contingency). */
export function maxAllowableOffer(p: Property): number {
  return calcMao(inputsFromProperty(p));
}

/** Positive when the purchase price came in over the 70% rule's ceiling. */
export function overMao(p: Property): number {
  return p.purchasePrice - maxAllowableOffer(p);
}

/**
 * Rehab cost to carry in a forecast: what has been spent, or the budget,
 * whichever is higher — an overrun does not un‑spend itself.
 */
export function rehabForecast(p: Property): number {
  return Math.max(p.rehabSpent, p.rehabBudget);
}

/**
 * Projected all‑in before financing costs — price, closing, rehab and the
 * carry over the rehab period. The figure the portfolio table and the
 * property header show. A deal that has not closed has committed nothing
 * beyond its price.
 */
export function allInProjected(p: Property): number {
  if (p.stage === "under-contract") return p.purchasePrice;
  return p.purchasePrice + p.closingCosts + rehabForecast(p) + holdingOther(inputsFromProperty(p));
}

export function rehabProgressPct(p: Property): number {
  if (p.rehabBudget === 0) return 0;
  return (p.rehabSpent / p.rehabBudget) * 100;
}

export function rehabRemaining(p: Property): number {
  return p.rehabBudget - p.rehabSpent;
}

/**
 * A renovation that is still running. A property listed for sale is included:
 * the work is finished only when it stops drawing on the rehab budget, and
 * mockup 1b files both the in‑rehab and the listed property under "שיפוץ".
 */
export function isRenovating(p: Property): boolean {
  return p.stage === "rehab" || p.stage === "listed";
}

/** Loan size a cash‑out refinance would support at the assumed LTV. */
export function refinanceLoan(p: Property): number | null {
  const refi = p.assumptions.refinance;
  if (!refi) return null;
  return Math.round(p.arv * (refi.ltvPct / 100));
}

/**
 * Cash a refinance releases over everything already in the deal — the
 * dashboard's view of a property at the refinance stage. (calc.ts measures
 * cash‑out against loan payoffs instead, the spreadsheet's convention.)
 */
export function cashOut(p: Property): number | null {
  const loan = refinanceLoan(p);
  if (loan === null) return null;
  return loan - allInProjected(p);
}

/** Actual monthly cash flow, for properties that are rented. */
export function monthlyCashFlow(p: Property): number | null {
  if (p.monthlyRent === undefined || p.monthlyDebtService === undefined) return null;
  return p.monthlyRent - p.monthlyDebtService - (p.monthlyOpex ?? 0);
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
