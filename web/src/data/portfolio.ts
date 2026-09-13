import { defaultAssumptions, defaultClosingItems, type DealAssumptions } from "../lib/calc.ts";
import type {
  AttentionItem,
  CompsAnalysis,
  Expense,
  Financing,
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

/**
 * Assumptions for a seed property: the sheet's defaults, shaped to its
 * financing, with the overrides each deal is known to carry.
 */
function assume(
  financing: Financing,
  monthlyRent: number,
  overrides: Partial<DealAssumptions>,
): DealAssumptions {
  return { ...defaultAssumptions({ financing, monthlyRent }), ...overrides };
}

const hardMoney: Financing = { kind: "hard-money", ratePct: 10.5, points: 2, ltcPct: 80 };
const dscr: Financing = { kind: "dscr", ratePct: 7.6, ltcPct: 75 };
const conventional: Financing = { kind: "conventional", ratePct: 7, ltcPct: 80 };
const cash: Financing = { kind: "cash" };


/**
 * The comps workups, transcribed from the investor's second sheet,
 * " Comps & ARV Calculator" (Google Drive, folder נדל"ן ארה"ב). One tab per
 * property; every figure the tabs derive is computed by `lib/comps.ts` and
 * pinned in `scripts/comps.test.ts`.
 */
const kendallComps: CompsAnalysis = {
  askingPrice: 135_000,
  rehabEstimate: 120_000,
  lotSqft: 7_500,
  garage: "none",
  plannedCondition: "turnkey",
  comps: [
    // The tab records this one without a sale price, so it prices nothing.
    {
      id: "k-jefferson",
      status: "sold",
      address: "419 Jefferson Ave, Pittsburgh, PA 15202",
      beds: 5,
      baths: 3,
      sqft: 1_834,
      lotSqft: 4_891,
      parking: 2,
      garage: "none",
      yearBuilt: 1889,
      saleDate: "2025-06-24",
      domDays: 24,
      condition: "top",
    },
    {
      id: "k-harrison-33",
      status: "sold",
      address: "33 S Harrison Ave, Pittsburgh, PA 15202",
      beds: 4,
      baths: 2,
      sqft: 1_964,
      lotSqft: 6_120,
      parking: 0,
      garage: "none",
      yearBuilt: 1915,
      salePrice: 340_000,
      saleDate: "2024-10-28",
      domDays: 29,
      condition: "top",
    },
    {
      id: "k-harrison-56",
      status: "sold",
      address: "56 S Harrison Ave, Pittsburgh, PA 15202",
      beds: 4,
      baths: 2,
      sqft: 1_918,
      lotSqft: 6_969,
      parking: 2,
      garage: "none",
      yearBuilt: 1915,
      salePrice: 290_000,
      saleDate: "2026-07-22",
      domDays: 28,
      condition: "full",
    },
    {
      id: "k-cliff",
      status: "sold",
      address: "615 Cliff Ave, Pittsburgh, PA 15202",
      beds: 4,
      baths: 4,
      sqft: 1_900,
      lotSqft: 5_301,
      parking: 2,
      garage: "two",
      yearBuilt: 1927,
      salePrice: 385_000,
      saleDate: "2025-09-18",
      domDays: 35,
      condition: "full",
    },
    {
      id: "k-keswick",
      status: "sold",
      address: "8 Keswick Ave, Pittsburgh, PA 15202",
      beds: 3,
      baths: 2,
      sqft: 1_821,
      lotSqft: 8_820,
      parking: 2,
      garage: "two",
      yearBuilt: 1930,
      salePrice: 280_000,
      saleDate: "2026-01-30",
      domDays: 60,
      condition: "partial",
    },
    {
      id: "k-grant",
      status: "sold",
      address: "235 Grant Ave, Bellevue, PA 15202",
      beds: 3,
      baths: 2,
      sqft: 1_250,
      lotSqft: 4_120,
      parking: 0,
      garage: "none",
      yearBuilt: 1915,
      salePrice: 285_000,
      saleDate: "2026-06-15",
      domDays: 45,
      condition: "partial",
    },
    {
      id: "k-irwin",
      status: "sold",
      address: "191 Irwin Ave, Pittsburgh, PA 15202",
      beds: 3,
      baths: 2,
      sqft: 1_472,
      lotSqft: 3_920,
      parking: 1,
      garage: "none",
      yearBuilt: 1930,
      salePrice: 301_000,
      saleDate: "2026-08-31",
      domDays: 55,
      condition: "full",
    },
    {
      id: "k-bryant",
      status: "sold",
      address: "92 S Bryant Ave, Pittsburgh, PA 15202",
      beds: 3,
      baths: 2,
      sqft: 1_650,
      lotSqft: 6_534,
      parking: 2,
      garage: "one",
      yearBuilt: 1924,
      salePrice: 310_000,
      saleDate: "2025-06-13",
      domDays: 23,
      condition: "full",
    },
    {
      id: "k-kendall-40",
      status: "sold",
      address: "40 Kendall Ave, Pittsburgh, PA 15202",
      beds: 3,
      baths: 3,
      sqft: 1_635,
      lotSqft: 4_547,
      parking: 2,
      garage: "one",
      yearBuilt: 1909,
      salePrice: 350_000,
      saleDate: "2024-12-17",
      domDays: 32,
      condition: "full",
    },
    {
      id: "k-laurel",
      status: "sold",
      address: "246 Laurel Ave, Pittsburgh, PA 15202",
      beds: 4,
      baths: 1,
      sqft: 1_300,
      lotSqft: 3_036,
      parking: 2,
      garage: "one",
      yearBuilt: 1930,
      salePrice: 283_500,
      saleDate: "2026-07-17",
      domDays: 42,
      condition: "full",
    },
  ],
};

const olanchaComps: CompsAnalysis = {
  askingPrice: 135_000,
  rehabEstimate: 120_000,
  lotSqft: 8_001,
  garage: "one",
  plannedCondition: "full",
  comps: [
    {
      id: "o-willock",
      status: "sold",
      address: "17 E Willock Rd, Pittsburgh, PA 15227",
      beds: 4,
      baths: 3,
      sqft: 1_960,
      lotSqft: 4_303,
      parking: 1,
      garage: "none",
      yearBuilt: 1950,
      salePrice: 295_000,
      saleDate: "2026-08-10",
      domDays: 50,
      condition: "turnkey",
    },
    {
      id: "o-brownsville",
      status: "sold",
      address: "4000 Brownsville Rd, Pittsburgh, PA 15227",
      beds: 4,
      baths: 3,
      sqft: 2_592,
      lotSqft: 19_166,
      parking: 2,
      garage: "two",
      yearBuilt: 1930,
      salePrice: 328_000,
      saleDate: "2026-05-18",
      domDays: 106,
      condition: "top",
    },
    {
      // The tab leaves this one's $/SqFt cell empty — it counts toward the
      // median sale price and not toward the rate. Here that is deliberate.
      id: "o-elton",
      status: "sold",
      address: "9 Elton St, Pittsburgh, PA 15227",
      beds: 3,
      baths: 2,
      sqft: 1_974,
      lotSqft: 7_910,
      parking: 2,
      garage: "one",
      yearBuilt: 1930,
      salePrice: 293_000,
      saleDate: "2026-08-28",
      domDays: 50,
      condition: "full",
      excluded: true,
    },
  ],
};

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

    arv: 165_000,
    compCount: 5,

    financing: { ...hardMoney, amount: 96_000 },
    monthlyRent: 1_450,

    // Anchored to the mockups where they state a fact: $65,600 drawn at
    // closing (80% of price), $96,000 of hard money in total (80% of price +
    // rehab), 10.5% and 2 points, a 7‑month rehab, a 75% LTV refinance. The
    // rest are the spreadsheet's own defaults (8% vacancy, 10% management,
    // 5% maintenance, 5% CapEx, 3 months of reserves, 8% cost of sale).
    //
    // Under those defaults the mockups' outcome figures do not hold — the
    // design assumed $257/month of OpEx with no vacancy or management. By the
    // investor's own model this deal is a thin BRRRR (cash flow in the tens of
    // dollars, DSCR ≈ 1.05) and a strong flip. The calculator shows that
    // rather than tuning the inputs to reproduce the mockup.
    assumptions: assume(hardMoney, 1_450, {
      contingencyPct: 0,
      rehabMonths: 7,
      purchaseLoan: {
        kind: "hard-money",
        ltvPct: 80,
        ratePct: 10.5,
        termYears: 30,
        points: { mode: "percent", pct: 2 },
      },
      rehabLoan: { financedPct: 80, ratePct: 10.5, points: { mode: "percent", pct: 2 } },
      holding: { propertyTaxYr: 1_800, insuranceYr: 1_080, utilitiesMo: 300, yardSnowMo: 103 },
    }),

    note: "בשיפוץ · שבוע 6",

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

    arv: 235_000,

    financing: hardMoney,

    // Duplex rent is an assumption — it is a flip; the BRRRR column exists to
    // show what holding it would have looked like.
    assumptions: assume(hardMoney, 1_900, {
      contingencyPct: 0,
      rehabMonths: 6,
      purchaseLoan: {
        kind: "hard-money",
        ltvPct: 80,
        ratePct: 10.5,
        termYears: 30,
        points: { mode: "percent", pct: 2 },
      },
      rehabLoan: { financedPct: 80, ratePct: 10.5, points: { mode: "percent", pct: 2 } },
      holding: { propertyTaxYr: 2_200, insuranceYr: 1_200, utilitiesMo: 400, yardSnowMo: 100 },
    }),

    listPrice: 239_900,
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

    arv: 158_000,

    financing: dscr,

    // Rented: these three are actuals from the ledger, not projections.
    monthlyRent: 1_350,
    monthlyDebtService: 812,
    monthlyOpex: 220,

    assumptions: assume(dscr, 1_350, {
      contingencyPct: 0,
      rehabMonths: 6,
      purchaseLoan: {
        kind: "dscr",
        ltvPct: 75,
        ratePct: 7.6,
        termYears: 30,
        points: { mode: "percent", pct: 0 },
      },
      rehabLoan: { financedPct: 0, ratePct: 12, points: { mode: "percent", pct: 0 } },
      holding: { propertyTaxYr: 1_800, insuranceYr: 1_000, utilitiesMo: 300, yardSnowMo: 100 },
    }),

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

    arv: 198_000,

    financing: dscr,

    assumptions: assume(dscr, 2_100, {
      contingencyPct: 0,
      rehabMonths: 6,
      purchaseLoan: {
        kind: "dscr",
        ltvPct: 75,
        ratePct: 7.6,
        termYears: 30,
        points: { mode: "percent", pct: 0 },
      },
      rehabLoan: { financedPct: 0, ratePct: 12, points: { mode: "percent", pct: 0 } },
      holding: { propertyTaxYr: 2_200, insuranceYr: 1_200, utilitiesMo: 400, yardSnowMo: 100 },
    }),

    note: "שמאי · חמישי 18.9",
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

    arv: 142_000,

    financing: hardMoney,

    assumptions: assume(hardMoney, 1_100, {
      contingencyPct: 0,
      rehabMonths: 4,
      purchaseLoan: {
        kind: "hard-money",
        ltvPct: 80,
        ratePct: 10.5,
        termYears: 30,
        points: { mode: "percent", pct: 2 },
      },
      rehabLoan: { financedPct: 80, ratePct: 10.5, points: { mode: "percent", pct: 2 } },
      holding: { propertyTaxYr: 2_000, insuranceYr: 1_000, utilitiesMo: 750, yardSnowMo: 150 },
    }),

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

    arv: 149_000,

    financing: cash,

    // Under contract, nothing decided: the sheet's defaults, cash purchase.
    // Contingency stays at 0 so the MAO the mockups show ($77,500) holds;
    // the calculator is where the investor adds it back.
    assumptions: assume(cash, 1_250, { contingencyPct: 0 }),
  },
  {
    id: "kendall-ave",
    shortName: "Kendall Ave",
    address: "188 Kendall Ave",
    city: "Pittsburgh",
    state: "PA",
    zip: "15202",
    strategy: "BRRRR",
    // Still being underwritten — "בחוזה" is the closest stage the app has for a
    // deal that is priced but not yet closed.
    stage: "under-contract",
    beds: 4,
    baths: 2,
    sqft: 1_800,
    yearBuilt: 1915,

    purchasePrice: 115_000,
    closingCosts: 0,
    rehabBudget: 120_000,
    rehabSpent: 0,

    arv: 330_000,
    compCount: 10,
    compsAnalysis: kendallComps,

    financing: { kind: "conventional", ratePct: 7, ltcPct: 80 },
    monthlyRent: 2_400,

    // The investor's own numbers, from the "188 Kendall Ave" tab of
    // "מחשבון עסקה": a buy‑and‑hold with no refinance, both loans on 30‑year
    // notes, origination entered as flat dollars. Reproduces the tab exactly —
    // NOI $1,510 · P&I $612 · cash flow $898 · CoC 7.00% · cap 15.76% ·
    // DSCR 2.47 · reserves $3,930 · cash needed $153,854 (scripts/calc.test.ts).
    assumptions: assume(conventional, 2_400, {
      contingencyPct: 0,
      rehabMonths: 6,
      closing: { mode: "itemized", items: { ...defaultClosingItems }, extras: [] },
      purchaseLoan: {
        kind: "conventional",
        ltvPct: 80,
        ratePct: 7,
        termYears: 30,
        points: { mode: "amount", amount: 2 },
      },
      rehabLoan: {
        financedPct: 0,
        ratePct: 7,
        termYears: 30,
        points: { mode: "amount", amount: 2 },
      },
      // The tab carries taxes at $28/month and insurance at $70/month.
      holding: { propertyTaxYr: 336, insuranceYr: 840, utilitiesMo: 200, yardSnowMo: 100 },
      income: { monthlyRent: 2_400, vacancyPct: 8 },
      // Maintenance is the tab's own $240 on $2,400 of rent — its note says 5%,
      // its number is 10%; the number wins.
      opex: { managementPct: 10, hoaMo: 0, maintenancePct: 10, capexPct: 5 },
      refinance: undefined,
    }),

    note: "בבדיקה · 10 comps",
  },
  {
    id: "olancha-ave",
    shortName: "Olancha Ave",
    address: "123 Olancha Ave",
    city: "Pittsburgh",
    state: "PA",
    zip: "15227",
    strategy: "FLIP",
    stage: "under-contract",
    beds: 4,
    baths: 3,
    sqft: 3_000,
    yearBuilt: 1920,

    purchasePrice: 120_000,
    closingCosts: 0,
    rehabBudget: 125_000,
    rehabSpent: 0,

    arv: 340_000,
    compCount: 3,
    compsAnalysis: olanchaComps,

    financing: { kind: "hard-money", ratePct: 10, points: 2, ltcPct: 65 },

    // The "123 Olancha Ave" tab of "מחשבון עסקה": a flip at $120,000 with a
    // $125,000 rehab and 15% contingency over eight months, 65% LTV at 10%
    // with two points, the rehab loan carrying 100% of rehab‑plus‑contingency
    // interest‑only, and the same Pittsburgh closing kit ($6,919.40). The tab
    // states total investment $71,338 · profit $19,712 · ROI 27.63% ·
    // MAO $94,250 (scripts/calc.test.ts).
    assumptions: assume({ kind: "hard-money", ratePct: 10, points: 2, ltcPct: 65 }, 0, {
      contingencyPct: 15,
      rehabMonths: 8,
      closing: { mode: "itemized", items: { ...defaultClosingItems }, extras: [] },
      purchaseLoan: {
        kind: "hard-money",
        ltvPct: 65,
        ratePct: 10,
        termYears: 30,
        points: { mode: "percent", pct: 2 },
      },
      rehabLoan: {
        financedPct: 100,
        ratePct: 10,
        points: { mode: "percent", pct: 2 },
      },
      // The tab carries no property tax and $1,200 a year of insurance.
      holding: { propertyTaxYr: 0, insuranceYr: 1_200, utilitiesMo: 200, yardSnowMo: 100 },
      sale: { agentPct: 6, otherPct: 2 },
      income: { monthlyRent: 0, vacancyPct: 8 },
      refinance: undefined,
    }),

    note: "פליפ · 3 comps",
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
