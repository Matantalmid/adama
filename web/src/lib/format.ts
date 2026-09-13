/**
 * Formatting for a Hebrew UI that keeps its money, measurements and addresses
 * in English. Every helper returns a string meant to sit inside <Num>, which
 * isolates it from the surrounding right-to-left text.
 */

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const plain = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** $127,400 */
export function money(value: number): string {
  return usd.format(value);
}

/** $1,284.50 — for ledger rows, where the cents matter. */
export function moneyExact(value: number): string {
  return usdCents.format(value);
}

/** +$1,204 / −$812 — signed, for cash-flow figures. */
export function moneySigned(value: number): string {
  const sign = value < 0 ? "−" : "+";
  return `${sign}${usd.format(Math.abs(value))}`;
}

/** $165K / $1.02M — the compact form the KPI tiles use. */
export function moneyCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  }
  if (abs >= 1_000) {
    // One decimal, but never a trailing ".0" — $239.9K and $38K, not $38.0K.
    return `${sign}$${Number((abs / 1_000).toFixed(1))}K`;
  }
  return `${sign}$${abs}`;
}

/** 77% — whole percentages unless a fraction is meaningful. */
export function percent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

/** $183/sqft, or $192.60/sqft when the cents are the point. */
export function pricePerSqft(value: number, digits = 0): string {
  return `$${value.toFixed(digits)}/sqft`;
}

/** 1,240 sqft */
export function sqft(value: number): string {
  return `${plain.format(value)} sqft`;
}

/** 6,200 / 6,500 — the budget-vs-actual pair, kept on one line. */
export function ratio(spent: number, budget: number): string {
  return `${plain.format(spent)} / ${plain.format(budget)}`;
}

/** 10.9 — the Hebrew short date form the mockups use (day.month). */
export function shortDate(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${Number(day)}.${Number(month)}`;
}

/** "3/1" beds/baths, or "דופלקס". */
export function unitMix({
  beds,
  baths,
  isDuplex,
}: {
  beds?: number;
  baths?: number;
  isDuplex?: boolean;
}): string {
  if (isDuplex) return "דופלקס";
  if (beds === undefined || baths === undefined) return "";
  return `${beds}/${baths}`;
}
