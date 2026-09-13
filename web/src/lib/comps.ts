import { RULE_70 } from "./calc.ts";

import type { Comparable, CompCondition, CompsAnalysis } from "@/data/types";

/**
 * The investor's "Comps & ARV Calculator" sheet, as functions.
 *
 * The sheet's chain is short: each comp's price per square foot is its sale
 * price over its size; the average of those — **rounded to one decimal** — is
 * the rate the subject is priced at; that rate times the subject's size is the
 * ARV; and the 70% rule turns the ARV into a maximum offer.
 *
 * The one-decimal rounding is not cosmetic. 188 Kendall Ave averages
 * 192.5795 → 192.6 → ×1,800 = $346,680, and 123 Olancha Ave averages
 * 138.5267 → 138.5 → ×3,000 = $415,500. Both land exactly; rounding the ARV
 * instead lands neither. `scripts/comps.test.ts` pins both tabs.
 *
 * Only `import type` from `@/`, so plain Node can run this file.
 */

/** The share of the ARV the 70% rule leaves for profit and for being wrong. */
export const BUFFER_30 = 1 - RULE_70;

/** A comp's price per square foot, or null when it has no price or no size. */
export function compPricePerSqft(c: Comparable): number | null {
  if (!c.salePrice || !c.sqft) return null;
  return c.salePrice / c.sqft;
}

/** Every comp with a sale price — what the median sale price is taken over. */
export function pricedComps(a: CompsAnalysis): Comparable[] {
  return a.comps.filter((c) => c.salePrice != null && c.salePrice > 0);
}

/**
 * The comps that price the subject. A comp the investor has set aside stays in
 * the list and in the median, but out of the rate — the sheet does the same by
 * leaving its $/SqFt cell empty.
 */
export function compsInAverage(a: CompsAnalysis): Comparable[] {
  return a.comps.filter((c) => !c.excluded && compPricePerSqft(c) !== null);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((x, y) => x - y);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** The sheet's "מחיר ממוצע לרגל רבוע" — the mean, to one decimal. */
export function averagePricePerSqft(a: CompsAnalysis): number {
  const rates = compsInAverage(a).map((c) => compPricePerSqft(c) as number);
  if (rates.length === 0) return 0;
  const mean = rates.reduce((sum, r) => sum + r, 0) / rates.length;
  return Math.round(mean * 10) / 10;
}

/** "חציון מחיר ל-SqFt בקומפס" — over the same comps as the average. */
export function medianPricePerSqft(a: CompsAnalysis): number {
  return median(compsInAverage(a).map((c) => compPricePerSqft(c) as number));
}

/** "חציון מחירי קומפס" — over every priced comp, set-aside ones included. */
export function medianSalePrice(a: CompsAnalysis): number {
  return median(pricedComps(a).map((c) => c.salePrice as number));
}

/** The rate the ARV is actually taken at: the investor's, or the comps'. */
export function effectivePricePerSqft(a: CompsAnalysis): number {
  return a.pricePerSqftOverride ?? averagePricePerSqft(a);
}

/** True when the investor has typed a rate of their own over the comps'. */
export function hasOverride(a: CompsAnalysis): boolean {
  return a.pricePerSqftOverride != null;
}

/** שווי משוער לאחר שיפוץ — the subject's size at the comps' rate. */
export function compsArv(a: CompsAnalysis, sqft: number): number {
  return Math.round(sqft * effectivePricePerSqft(a));
}

/**
 * The 70% rule on the comps' ARV, less the rehab **estimate** — the flat figure
 * the comps tab carries, with no contingency on top. `lib/calc.ts` asks a
 * different question of a deal that has been underwritten, and subtracts rehab
 * plus contingency there.
 */
export function compsMao(a: CompsAnalysis, sqft: number): number {
  return Math.round(compsArv(a, sqft) * RULE_70 - a.rehabEstimate);
}

/** "רווח ובטיחות פוטנציאלי" — the 30% of the ARV the rule holds back. */
export function profitBuffer(a: CompsAnalysis, sqft: number): number {
  return Math.round(compsArv(a, sqft) * BUFFER_30);
}

/** The asking price against the maximum offer: positive means over. */
export function overMao(a: CompsAnalysis, sqft: number): number {
  return a.askingPrice - compsMao(a, sqft);
}

/** What a comp is being compared against — the property being priced. */
export interface SubjectFacts {
  beds?: number;
  baths?: number;
  /** The finish level the subject is planned for, not its state today. */
  condition?: CompCondition;
}

/**
 * Where this comp differs from the property being priced.
 *
 * Only the three the investor reads first. Size, lot and year are left alone:
 * no two houses share a square footage, so flagging every difference there
 * would paint the whole table and say nothing.
 *
 * A field missing on either side is **not** a mismatch — you cannot differ
 * from something nobody recorded.
 */
export function compMismatches(
  comp: Comparable,
  subject: SubjectFacts,
): { beds: boolean; baths: boolean; condition: boolean } {
  const differs = <T,>(a: T | undefined, b: T | undefined) =>
    a !== undefined && b !== undefined && a !== b;
  return {
    beds: differs(comp.beds, subject.beds),
    baths: differs(comp.baths, subject.baths),
    condition: differs(comp.condition, subject.condition),
  };
}

/** An empty comp row, for the table's "+ קומפ". */
export function emptyComp(id: string): Comparable {
  return { id, status: "sold", address: "", sqft: 0 };
}
