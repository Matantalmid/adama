import { STORAGE_KEY } from "./schema";

/**
 * The only place that touches localStorage. Both directions are guarded:
 * storage can be absent (server), blocked (private mode), full, or hold
 * something unparseable — none of which should take the app down.
 */
export function readStored(): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeStored(value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Quota or privacy mode — the in‑memory state still works for this visit.
  }
}

export function clearStored(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do.
  }
}
