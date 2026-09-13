import type { DealAssumptions } from "@/lib/calc";

export type Strategy = "BRRRR" | "FLIP" | "UNDECIDED";

/** Where a property sits in the BRRRR/Flip pipeline. */
export type PropertyStage =
  | "under-contract" // בחוזה
  | "rehab" // בשיפוץ
  | "listed" // רשום למכירה
  | "rented" // מושכר
  | "refinance" // ריפיננס
  | "sold"; // נמכר

export type FinancingKind = "hard-money" | "conventional" | "dscr" | "cash";

export interface Financing {
  kind: FinancingKind;
  /** Annual rate, e.g. 10.5 for hard money at 10.5%. */
  ratePct?: number;
  /** Origination points. */
  points?: number;
  /** Loan-to-cost the lender funded, e.g. 80. */
  ltcPct?: number;
  /** Principal drawn at close. */
  amount?: number;
}

export interface RehabCategory {
  id: string;
  /** Hebrew label as it appears in the UI. */
  name: string;
  budget: number;
  spent: number;
  /**
   * The trade is finished, whatever the spend says. A category that came in
   * under budget is not the same as one still in progress, and only the
   * finished ones take the "done" colour.
   */
  complete?: boolean;
}

/** Where a comparable sale stands. The sheet only ever records "Sold". */
export type CompStatus = "sold" | "pending" | "active";

/**
 * How finished a house is — the sheet's own four levels, used both for a comp
 * and for the finish level planned for the subject property.
 */
export type CompCondition = "turnkey" | "top" | "full" | "partial";

export type GarageKind = "none" | "one" | "two";

/** One comparable sale, as the "Comps & ARV Calculator" sheet records it. */
export interface Comparable {
  id: string;
  status: CompStatus;
  /** Street address — LTR, never translated. */
  address: string;
  distanceMi?: number;
  beds?: number;
  baths?: number;
  sqft: number;
  lotSqft?: number;
  parking?: number;
  garage?: GarageKind;
  yearBuilt?: number;
  salePrice?: number;
  /** ISO date of the sale. */
  saleDate?: string;
  /** Days on market. */
  domDays?: number;
  condition?: CompCondition;
  /**
   * Kept out of the $/SqFt average — a comp too far from the subject to price
   * it. It still counts toward the median sale price, the way the sheet does.
   */
  excluded?: boolean;
}

/**
 * The comps workup behind a property's ARV: the subject card the sheet heads
 * each tab with, and the comparable sales under it.
 *
 * Deliberately separate from the deal calculator. The two sheets disagree on
 * purpose — the comps tab carries the asking price and an early rehab estimate,
 * the deal tab carries what was actually negotiated — so this owns those two
 * and reads the house's facts (address, beds, baths, SqFt, year) off `Property`.
 */
export interface CompsAnalysis {
  /** מחיר מבוקש נוכחי — what the seller is asking, not what will be paid. */
  askingPrice: number;
  /** תקציב שיפוץ מוערך — the estimate at comps stage, before underwriting. */
  rehabEstimate: number;
  lotSqft?: number;
  garage?: GarageKind;
  /** רמת גימור מתוכננת — which comps the subject should be priced against. */
  plannedCondition?: CompCondition;
  /** The investor's own $/SqFt, when they disagree with the comps' average. */
  pricePerSqftOverride?: number;
  comps: Comparable[];
}

export interface Property {
  id: string;
  /** Street address — always rendered LTR, never translated. */
  address: string;
  /** How the address is referred to in running text ("Elm Ave"). */
  shortName: string;
  city: string;
  state: string;
  zip?: string;
  strategy: Strategy;
  stage: PropertyStage;

  /** "3/2" for 3 bed / 2 bath, or a duplex marker. */
  beds?: number;
  baths?: number;
  isDuplex?: boolean;
  sqft: number;
  yearBuilt?: number;

  purchasePrice: number;
  /** Closing costs actually paid at purchase (0 while still under contract). */
  closingCosts: number;
  rehabBudget: number;
  rehabSpent: number;

  arv: number;
  /** How many comparable sales back the ARV. */
  compCount?: number;
  /** The comps workup behind the ARV — the "Comps & ARV Calculator" sheet. */
  compsAnalysis?: CompsAnalysis;

  /**
   * Summary of the purchase financing, for tags and the dashboard. Mirrored
   * from `assumptions.purchaseLoan` by lib/calc.applyInputsToProperty; nothing
   * else writes it.
   */
  financing: Financing;

  /**
   * Everything forward‑looking about the deal — loan terms, carry, OpEx
   * ratios, refinance, cost of sale. Edited in the calculator; every projected
   * figure on every screen derives from it (lib/calc.ts). Facts about the
   * property live on the fields above and win over these where both exist.
   */
  assumptions: DealAssumptions;

  /** Monthly rent — actual once rented; a projection lives in assumptions.income. */
  monthlyRent?: number;
  /** Actual debt service and operating costs, for rented properties only. */
  monthlyDebtService?: number;
  monthlyOpex?: number;

  /** Free-form status line shown in the pipeline and attention list. */
  note?: string;

  rehabCategories?: RehabCategory[];
  timeline?: Milestone[];

  /**
   * Outcomes that happened — a listing, a realised sale. Projections are never
   * stored; they come from lib/calc.ts.
   */
  listPrice?: number;
  soldFor?: number;
  soldOn?: string;
  realisedProfit?: number;
  realisedRoiPct?: number;
  holdMonths?: number;
}

export type MilestoneState = "done" | "active" | "upcoming";

export interface Milestone {
  id: string;
  title: string;
  when: string;
  detail: string;
  state: MilestoneState;
}

export type PaymentMethod = string;

export interface Expense {
  id: string;
  propertyId: string;
  /** ISO date; the UI renders it as d.M in Hebrew short form. */
  date: string;
  description: string;
  vendor: string;
  /** Matches a RehabCategory id, or null when the receipt is still unsorted. */
  categoryId: string | null;
  payment: PaymentMethod;
  amount: number;
  hasReceipt: boolean;
  /** Which renovation phase the expense belongs to (3b grouping). */
  phaseId?: string;
}

export interface AttentionItem {
  id: string;
  title: string;
  detail: string;
  /** Accent dots are time-sensitive; neutral dots are housekeeping. */
  urgent: boolean;
  propertyId?: string;
}

export interface PortfolioSummary {
  arv: number;
  arvLabel: string;
  arvDeltaPct: number;
  equity: number;
  equityLabel: string;
  averageLtvPct: number;
  monthlyCashFlow: number;
  rentedCount: number;
  monthExpenses: number;
  monthBudgetUsedPct: number;
  uncategorisedReceipts: number;
  flipProfitYtd: number;
  flipAverageRoiPct: number;
}
