import { expenses as seedExpenses, properties as seedProperties } from "@/data/portfolio";
import type { Expense, Property } from "@/data/types";
import { builtInAssumptions, type DealAssumptions } from "@/lib/calc";

/**
 * What the app persists. Everything the screens can change — properties with
 * their assumptions and rehab categories, and the expense ledger. Portfolio
 * summary, attention items and the ledger header totals are still static.
 */
export const STORE_VERSION = 3 as const;
export const STORAGE_KEY = "adama.store";

export interface StoreState {
  version: typeof STORE_VERSION;
  properties: Property[];
  expenses: Expense[];
  /** The assumptions every new deal starts from — the "ברירות מחדל" screen. */
  defaults: DealAssumptions;
}

/** A fresh copy of the seed, so edits never reach the module‑level arrays. */
export function seedState(): StoreState {
  return {
    version: STORE_VERSION,
    properties: structuredClone(seedProperties),
    expenses: structuredClone(seedExpenses),
    defaults: builtInAssumptions(),
  };
}

/**
 * Accept stored state only when it is the current shape. This is demo data,
 * so a version mismatch reseeds rather than migrates — bump STORE_VERSION
 * whenever `assumptions`, `compsAnalysis` or the seed changes shape.
 */
export function migrate(raw: unknown): StoreState | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<StoreState>;
  if (candidate.version !== STORE_VERSION) return null;
  if (!Array.isArray(candidate.properties) || !Array.isArray(candidate.expenses)) return null;
  if (!candidate.defaults) return null;
  return candidate as StoreState;
}
