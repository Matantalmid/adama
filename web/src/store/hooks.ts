"use client";

import { useMemo, useSyncExternalStore } from "react";

import type { Expense, Property } from "@/data/types";

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

export function useExpenses(propertyId: string): Expense[] {
  const { expenses } = useStoreState();
  return useMemo(() => expenses.filter((e) => e.propertyId === propertyId), [expenses, propertyId]);
}
