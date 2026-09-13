"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";

import { activePropertyId } from "@/data/portfolio";
import type { Expense, Property } from "@/data/types";
import type { DealAssumptions } from "@/lib/calc";

import { getServerState, getState, subscribe, type StoreState } from "./index";

/**
 * Read the store from React. `useStoreState` returns the whole state object,
 * which is stable between writes — never derive a fresh array inside the
 * snapshot itself, or useSyncExternalStore will loop. Filtering happens in
 * useMemo over the stable slice.
 */
export function useStoreState(): StoreState {
  return useSyncExternalStore(subscribe, getState, getServerState);
}

export function useProperties(): Property[] {
  return useStoreState().properties;
}

export function useProperty(id: string): Property | undefined {
  const { properties } = useStoreState();
  return properties.find((p) => p.id === id);
}

export function useDefaults(): DealAssumptions {
  return useStoreState().defaults;
}

export function useExpenses(propertyId: string): Expense[] {
  const { expenses } = useStoreState();
  return useMemo(() => expenses.filter((e) => e.propertyId === propertyId), [expenses, propertyId]);
}

/**
 * An editable copy of something in the store.
 *
 * The store deliberately hands React the seed during hydration and the stored
 * state a beat later (see store.ts), so a draft seeded once with `useState`
 * would freeze the seed and quietly discard what was saved. This adopts the
 * store's value whenever it changes — unless the user has already typed, in
 * which case their edits win.
 */
export function useDraft<T>(source: T): [T, (next: T) => void] {
  const [draft, setDraft] = useState(source);
  const seen = useRef(source);

  if (seen.current !== source) {
    // Untouched drafts follow the store; edited ones are left alone.
    if (draft === seen.current) setDraft(source);
    seen.current = source;
  }

  return [draft, setDraft];
}

/**
 * The property the app falls back to when no particular one is named — the
 * phone's expenses tab, the camera sheet, the two calculator pickers.
 *
 * `activePropertyId` is a constant in the seed, and the seed's properties can
 * now be deleted, so it cannot be trusted on its own: this returns it while it
 * exists and the first property still in the store otherwise.
 */
export function useActivePropertyId(): string | undefined {
  const { properties } = useStoreState();
  return properties.some((p) => p.id === activePropertyId)
    ? activePropertyId
    : properties[0]?.id;
}

/**
 * Resolve an id that may no longer be there. Used by the screens that let you
 * pick a property: if the picked one has gone, fall back rather than render a
 * blank page with no way out.
 */
export function useResolvedPropertyId(picked: string): string | undefined {
  const { properties } = useStoreState();
  if (properties.some((p) => p.id === picked)) return picked;
  return properties.some((p) => p.id === activePropertyId) ? activePropertyId : properties[0]?.id;
}
