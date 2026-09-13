import type { CompsAnalysis, Expense, Property } from "@/data/types";
import { applyInputsToProperty, type DealAssumptions, type DealInputs } from "@/lib/calc";

import { migrate, seedState, type StoreState } from "./schema";
import { clearStored, readStored, writeStored } from "./storage";

/**
 * A module‑level store: one immutable state object, replaced on every write.
 *
 * On the server, and during hydration on the client, the state is the seed
 * (`getServerState`). The first client read after that swaps in whatever
 * localStorage holds. React's useSyncExternalStore renders the server
 * snapshot while hydrating and then re‑renders with the client snapshot, so
 * the markup matches and stored values appear one frame later — the
 * documented path, with no provider and no `typeof window` in components.
 */

const serverState: StoreState = seedState();
let state: StoreState = serverState;
let hydrated = false;
const listeners = new Set<() => void>();

export function getServerState(): StoreState {
  return serverState;
}

export function getState(): StoreState {
  if (!hydrated && typeof window !== "undefined") {
    hydrated = true;
    const stored = migrate(readStored());
    if (stored) state = stored;
  }
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setState(update: (current: StoreState) => StoreState): void {
  state = update(getState());
  writeStored(state);
  for (const listener of listeners) listener();
}

// ── helpers ─────────────────────────────────────────────────────────────────

function updateProperty(
  properties: Property[],
  id: string,
  update: (p: Property) => Property,
): Property[] {
  return properties.map((p) => (p.id === id ? update(p) : p));
}

/**
 * Move an amount into (or out of, when negative) a rehab category. Category
 * spend and the property's rehabSpent move together — the seed's invariant is
 * Σ category.spent = rehabSpent, and uncategorised money counts nowhere until
 * it is filed. (Interim rule: only 8 of the ledger's 42 rows are seeded, so
 * spend cannot yet be derived from the expenses themselves.)
 */
function shiftCategorySpend(p: Property, categoryId: string, amount: number): Property {
  if (!p.rehabCategories) return p;
  return {
    ...p,
    rehabSpent: p.rehabSpent + amount,
    rehabCategories: p.rehabCategories.map((c) =>
      c.id === categoryId ? { ...c, spent: c.spent + amount } : c,
    ),
  };
}

// ── actions ─────────────────────────────────────────────────────────────────

export const actions = {
  addExpense(input: Omit<Expense, "id">): Expense {
    const expense: Expense = { ...input, id: `e-${Date.now()}` };
    setState((s) => ({
      ...s,
      expenses: [expense, ...s.expenses],
      properties: expense.categoryId
        ? updateProperty(s.properties, expense.propertyId, (p) =>
            shiftCategorySpend(p, expense.categoryId as string, expense.amount),
          )
        : s.properties,
    }));
    return expense;
  },

  setExpenseCategory(expenseId: string, categoryId: string | null): void {
    setState((s) => {
      const expense = s.expenses.find((e) => e.id === expenseId);
      if (!expense || expense.categoryId === categoryId) return s;
      let properties = s.properties;
      if (expense.categoryId) {
        const from = expense.categoryId;
        properties = updateProperty(properties, expense.propertyId, (p) =>
          shiftCategorySpend(p, from, -expense.amount),
        );
      }
      if (categoryId) {
        properties = updateProperty(properties, expense.propertyId, (p) =>
          shiftCategorySpend(p, categoryId, expense.amount),
        );
      }
      return {
        ...s,
        properties,
        expenses: s.expenses.map((e) => (e.id === expenseId ? { ...e, categoryId } : e)),
      };
    });
  },

  /** Lift a category's budget to what has been spent; the rehab budget moves by the same amount. */
  raiseCategoryBudget(propertyId: string, categoryId: string): void {
    setState((s) => ({
      ...s,
      properties: updateProperty(s.properties, propertyId, (p) => {
        const category = p.rehabCategories?.find((c) => c.id === categoryId);
        if (!category || category.spent <= category.budget) return p;
        const delta = category.spent - category.budget;
        return {
          ...p,
          rehabBudget: p.rehabBudget + delta,
          rehabCategories: p.rehabCategories!.map((c) =>
            c.id === categoryId ? { ...c, budget: c.spent } : c,
          ),
        };
      }),
    }));
  },

  /** Replace the template every new deal starts from. */
  saveDefaults(defaults: DealAssumptions): void {
    setState((s) => ({ ...s, defaults }));
  },

  saveDealInputs(propertyId: string, inputs: DealInputs): void {
    setState((s) => ({
      ...s,
      properties: updateProperty(s.properties, propertyId, (p) => applyInputsToProperty(p, inputs)),
    }));
  },

  /**
   * The comps workup behind a property's ARV. Deliberately does not touch
   * `property.arv` — the comps screen reports its own figure and the deal
   * calculator keeps the one it was given.
   */
  saveComps(propertyId: string, analysis: CompsAnalysis): void {
    setState((s) => ({
      ...s,
      properties: updateProperty(s.properties, propertyId, (p) => ({
        ...p,
        compsAnalysis: analysis,
        compCount: analysis.comps.length,
      })),
    }));
  },

  /**
   * Remove a property and the expenses filed against it. Nothing else prunes
   * orphans — `useExpenses` only filters by id — so leaving them behind would
   * keep them in storage for ever, invisible.
   *
   * Local only: the seed is still the source of truth, so `resetToSeed` or a
   * `STORE_VERSION` bump brings the property back.
   */
  deleteProperty(propertyId: string): void {
    setState((s) => ({
      ...s,
      properties: s.properties.filter((p) => p.id !== propertyId),
      expenses: s.expenses.filter((e) => e.propertyId !== propertyId),
    }));
  },

  resetToSeed(): void {
    clearStored();
    setState(() => seedState());
  },
};
