import type {
  AttentionItem,
  Expense,
  PortfolioSummary,
  Property,
} from "./types";

/**
 * Seed data lifted from the Claude Design mockups (Nechasim Mockups.dc.html) —
 * six properties across Cleveland, Memphis, Indianapolis and Birmingham.
 *
 * Where the mockups show a figure that follows from others it is derived at
 * render time (lib/deal.ts) rather than stored, so the screens stay internally
 * consistent when a number is edited here. Figures with no derivation — a
 * lender's quote, a listing price, a realised sale — are stored as authored.
 */

const elmRehabCategories = [
  { id: "roof", name: "גג", budget: 6_500, spent: 6_200, complete: true },
  { id: "electric", name: "חשמל", budget: 4_800, spent: 5_150 },
  { id: "plumbing", name: "אינסטלציה", budget: 5_200, spent: 3_900 },
  { id: "kitchen", name: "מטבח", budget: 9_000, spent: 7_600 },
  { id: "flooring", name: "רצפות", budget: 4_500, spent: 2_100 },
  { id: "paint", name: "צבע", budget: 3_000, spent: 0 },
  { id: "misc", name: "שונות", budget: 5_000, spent: 4_450 },
];

export const properties: Property[] = [
  {
    id: "elm-ave",
    shortName: "Elm Ave",
    address: "4412 Elm Ave",
    city: "Cleveland",
    state: "OH",
    zip: "44113",
    strategy: "BRRRR",
    stage: "rehab",
    beds: 3,
    baths: 1,
    sqft: 1_240,
    yearBuilt: 1924,

    purchasePrice: 82_000,
    closingCosts: 2_900,
    rehabBudget: 38_000,
    rehabSpent: 29_400,
    holdingCosts: 4_500,
    loanCosts: 5_180,

    arv: 165_000,
    compCount: 5,

    financing: { kind: "hard-money", ratePct: 10.5, points: 2, ltcPct: 80, amount: 96_000 },

    // Post-refinance: a 30-year DSCR note on the $123,750 cash-out, plus taxes,
    // insurance and reserves. Nets the +$318/month the mockups show.
    monthlyRent: 1_450,
    monthlyDebtService: 875,
    monthlyOpex: 257,

    note: "בשיפוץ · שבוע 6",
    refinanceLtvPct: 75,
    projectedProfit: 37_600,

    // Outcomes that rest on assumptions the design states as results rather
    // than inputs (the lender's final payoff, a ~6.7% cost of sale).
    cashLeftInDeal: 9_800,
    flipNetProfit: 21_300,
    flipHoldMonths: 5,
    brrrrMonthsToCash: 13,

    rehabCategories: elmRehabCategories,
    timeline: [
      {
        id: "buy",
        title: "קנייה",
        when: "12.3.2026",
        detail: "סגירה, {Hard money $65,600}",
        state: "done",
      },
      {
        id: "rehab",
        title: "שיפוץ",
        when: "{20.3 → ~15.10}",
        detail: "שבוע 6 מתוך 8 · {77%} מהתקציב",
        state: "active",
      },
      {
        id: "rent",
        title: "השכרה",
        when: "יעד נובמבר",
        detail: 'שכ"ד צפוי {$1,450}',
        state: "upcoming",
      },
      {
        id: "refi",
        title: "ריפיננס",
        when: "6 חודשי seasoning",
        detail: "{DSCR} 30 שנה · {75% LTV}",
        state: "upcoming",
      },
    ],
  },
  {
    id: "faxon-ave",
    shortName: "Faxon Ave",
    address: "1808 Faxon Ave",
    city: "Memphis",
    state: "TN",
    strategy: "FLIP",
    stage: "listed",
    isDuplex: true,
    sqft: 1_900,

    purchasePrice: 119_000,
    closingCosts: 3_400,
    rehabBudget: 52_000,
    rehabSpent: 54_800,
    holdingCosts: 4_700,
    loanCosts: 0,

    arv: 235_000,

    financing: { kind: "hard-money", ratePct: 10.5, points: 2 },

    listPrice: 239_900,
    projectedProfit: 34_200,
  },
  {
    id: "olney-st",
    shortName: "Olney St",
    address: "2231 N Olney St",
    city: "Indianapolis",
    state: "IN",
    strategy: "BRRRR",
    stage: "rented",
    beds: 3,
    baths: 2,
    sqft: 1_410,

    purchasePrice: 72_000,
    closingCosts: 2_400,
    rehabBudget: 31_000,
    rehabSpent: 31_000,
    holdingCosts: 3_800,
    loanCosts: 0,

    arv: 158_000,

    financing: { kind: "dscr", ratePct: 7.6, ltcPct: 75 },

    monthlyRent: 1_350,
    monthlyDebtService: 812,
    monthlyOpex: 220,

    note: "חוזה מתחדש ב-1.10",
  },
  {
    id: "w-41st",
    shortName: "3305 W 41st",
    address: "3305 W 41st St",
    city: "Cleveland",
    state: "OH",
    strategy: "BRRRR",
    stage: "refinance",
    isDuplex: true,
    sqft: 2_100,

    purchasePrice: 96_000,
    closingCosts: 3_100,
    rehabBudget: 40_000,
    rehabSpent: 40_000,
    holdingCosts: 4_700,
    loanCosts: 0,

    arv: 198_000,

    financing: { kind: "dscr", ratePct: 7.6, ltcPct: 75 },

    note: "שמאי · חמישי 18.9",
    refinanceLtvPct: 75,
  },
  {
    id: "47th-st",
    shortName: "916 47th St N",
    address: "916 47th St N",
    city: "Birmingham",
    state: "AL",
    strategy: "FLIP",
    stage: "sold",
    beds: 2,
    baths: 1,
    sqft: 980,

    purchasePrice: 64_000,
    closingCosts: 2_200,
    rehabBudget: 28_000,
    rehabSpent: 28_000,
    holdingCosts: 4_600,
    loanCosts: 0,

    arv: 142_000,

    financing: { kind: "hard-money", ratePct: 10.5, points: 2 },

    soldOn: "6.2026",
    realisedProfit: 31_200,
    realisedRoiPct: 22,
    holdMonths: 4.5,
  },
  {
    id: "ridge-rd",
    shortName: "5107 Ridge Rd",
    address: "5107 Ridge Rd",
    city: "Cleveland",
    state: "OH",
    strategy: "UNDECIDED",
    stage: "under-contract",
    beds: 3,
    baths: 1,
    sqft: 1_120,

    purchasePrice: 71_000,
    closingCosts: 0,
    rehabBudget: 26_800,
    rehabSpent: 0,
    holdingCosts: 0,
    loanCosts: 0,

    arv: 149_000,

    financing: { kind: "cash" },
  },
];

export const propertiesById = new Map(properties.map((p) => [p.id, p]));

/**
 * The project the app defaults to — the one mid-renovation, which is where
 * receipts and budget questions land. The mockups treat 4412 Elm Ave this way
 * throughout.
 */
export const activePropertyId = "elm-ave";

export function getProperty(id: string): Property | undefined {
  return propertiesById.get(id);
}

/**
 * Portfolio headline figures. Stated by the mockups rather than summed from
 * the six properties above — they cover holdings and history the sample set
 * only partly represents, so summing would contradict the design.
 */
export const portfolio: PortfolioSummary = {
  arv: 1_020_000,
  arvLabel: "$1.02M",
  arvDeltaPct: 4.8,
  equity: 386_000,
  equityLabel: "$386K",
  averageLtvPct: 62,
  monthlyCashFlow: 1_204,
  rentedCount: 2,
  monthExpenses: 18_650,
  monthBudgetUsedPct: 62,
  uncategorisedReceipts: 4,
  flipProfitYtd: 65_400,
  flipAverageRoiPct: 19.4,
};

export const attentionItems: AttentionItem[] = [
  {
    id: "appraisal",
    title: "הערכת שמאי",
    detail: "חמישי 18.9 · הכן רשימת שיפוצים ותמונות",
    urgent: true,
    propertyId: "w-41st",
  },
  {
    id: "electric-overrun",
    title: "חשמל חורג מהתקציב",
    detail: "{$5,150} מול {$4,800} · לעדכן תקציב?",
    urgent: true,
    propertyId: "elm-ave",
  },
  {
    id: "uncategorised",
    title: "4 קבלות ללא קטגוריה",
    detail: "{Home Depot · Lowe's · Sherwin-Williams}",
    urgent: false,
  },
  {
    id: "october-rent",
    title: "שכירות אוקטובר",
    detail: "חוזה מתחדש ב-1.10 · {$1,350}",
    urgent: false,
    propertyId: "olney-st",
  },
];

/** The eight most recent of 4412 Elm Ave's 42 expenses (screen 3a). */
export const expenses: Expense[] = [
  {
    id: "e-1",
    propertyId: "elm-ave",
    date: "2026-09-10",
    description: "חומרי חשמל — שקעים, כבלים",
    vendor: "Home Depot",
    categoryId: null,
    payment: "{Amex ····4021}",
    amount: 1_284.5,
    hasReceipt: true,
    phaseId: "mep",
  },
  {
    id: "e-2",
    propertyId: "elm-ave",
    date: "2026-09-09",
    description: "עבודת חשמלאי — פאנל חדש {200A}",
    vendor: "R. Alvarez Electric",
    categoryId: "electric",
    payment: "{Zelle}",
    amount: 2_400,
    hasReceipt: true,
    phaseId: "mep",
  },
  {
    id: "e-3",
    propertyId: "elm-ave",
    date: "2026-09-08",
    description: "ארונות מטבח — סט {10'}",
    vendor: "Lowe's",
    categoryId: "kitchen",
    payment: "{Amex ····4021}",
    amount: 3_120,
    hasReceipt: true,
    phaseId: "kitchen-floors",
  },
  {
    id: "e-4",
    propertyId: "elm-ave",
    date: "2026-09-05",
    description: "אינסטלציה — קווי {PEX}, ברזים",
    vendor: "Ferguson",
    categoryId: "plumbing",
    payment: "{Amex ····4021}",
    amount: 860,
    hasReceipt: true,
    phaseId: "mep",
  },
  {
    id: "e-5",
    propertyId: "elm-ave",
    date: "2026-09-04",
    description: "צבע פנים — 12 גלון",
    vendor: "Sherwin-Williams",
    categoryId: null,
    payment: "{Visa ····8810}",
    amount: 412.8,
    hasReceipt: false,
    phaseId: "paint",
  },
  {
    id: "e-6",
    propertyId: "elm-ave",
    date: "2026-09-02",
    description: "{LVP} רצפה — {620 sqft}",
    vendor: "Floor & Decor",
    categoryId: "flooring",
    payment: "{Amex ····4021}",
    amount: 2_100,
    hasReceipt: true,
    phaseId: "kitchen-floors",
  },
  {
    id: "e-7",
    propertyId: "elm-ave",
    date: "2026-08-28",
    description: "מכולת פסולת — {20 yd}",
    vendor: "Waste Mgmt",
    categoryId: "misc",
    payment: "{Visa ····8810}",
    amount: 495,
    hasReceipt: true,
    phaseId: "demo",
  },
  {
    id: "e-8",
    propertyId: "elm-ave",
    date: "2026-08-22",
    description: "גג — תשלום סופי",
    vendor: "Lakeview Roofing",
    categoryId: "roof",
    payment: "צ'ק {#1042}",
    amount: 3_100,
    hasReceipt: true,
    phaseId: "roof",
  },
];

/** Totals for the expense screen's header — the full 42-row ledger. */
export const expenseLedger = {
  propertyId: "elm-ave",
  totalCount: 42,
  receiptCount: 38,
  uncategorisedCount: 4,
  missingReceiptCount: 4,
};

export function expensesForProperty(propertyId: string): Expense[] {
  return expenses.filter((e) => e.propertyId === propertyId);
}
