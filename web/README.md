# אדמה — Adama

Property-management app for a US real-estate investor running BRRRR and
Fix & Flip deals. Hebrew interface, right-to-left, with financial terms kept in
English (ARV, Cap Rate, DSCR, Cash-on-Cash).

Built from the Claude Design handoff in `../project/Nechasim Mockups.dc.html`.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run typecheck
npm test           # pins lib/calc.ts to the investor's spreadsheet
```

Next.js 16 (App Router) + React 19 + TypeScript. No CSS framework — the Organic
design system is plain CSS, exactly as it was designed.

## What is implemented

Round 1 of the design covered three screens, each with two desktop approaches
and a phone layout; the **a** variants were chosen, with the phone artboards
implemented as breakpoints of the same screens. Round 2 added the calculator
the brief centred on, built on the investor's own spreadsheet, and a store so
the screens can change things.

| Screen | Route | From |
| --- | --- | --- |
| Portfolio dashboard | `/` | mockup 1a desktop, 1c phone |
| Properties list | `/properties` | the dashboard's "כל הנכסים" destination |
| Property overview | `/properties/[id]` | 2a desktop, 2c phone |
| Project expenses | `/properties/[id]/expenses` | 3a desktop, phone list |
| **BRRRR vs Fix & Flip calculator** | `/calculators`, `/properties/[id]/calculator` | 2b's matrix and circles; formulas from the spreadsheet |
| **Deal defaults** | `/defaults` | the values every new deal starts from |
| New expense — scanned or manual | phone camera button; "+ הוצאה" on the ledger | 3c |

Not yet built, because they were not designed: property comparison (six axes
including a map), the ARV/comps finder, and the add‑property form. Their routes
(`/compare`, `/arv`, `/more`, `/properties/new`) say so rather than leaving the
navigation pointing at dead links. Still inert on the built screens: the
dashboard's period segment, "ייצא CSV", the ledger's view segment, search,
"מסמכים", "עוד".

## The calculator and where its formulas come from

`src/lib/calc.ts` is a transcription of the investor's Google Sheet
"מחשבון עסקה" — its Flip tab, BRRRR tab and buy‑and‑hold tab — into pure
functions over a `DealInputs` record: amortized and interest‑only payments,
percentage or itemized closing costs, contingency, carry over the rehab
period, cost of sale, reserves, total cash needed, cash‑out refinance, NOI,
cash‑on‑cash, cap rate, DSCR and the 1% rule. `scripts/calc.test.ts` pins the
module to the sheet's own totals (`npm test`, plain `node --test`; Node strips
the types itself).

The sheet has six tabs — מחשבון פליפ · מחשבון רנטל · 188 Kendall Ave ·
415 Shcool N st · 123 Olancha Ave · 534 Clifton Ave — and the module covers all
three shapes they take: a flip, a BRRRR with a cash‑out refinance, and a
buy‑and‑hold. Origination is per loan and can be a percentage or a flat amount;
a rehab loan is either interest‑only over the rehab period (hard money) or
amortized alongside the purchase note; and the itemized closing list takes
extra lines a single deal needs, the way the sheet's tabs do.

One place the module deliberately shows more than the sheet: the sheet leaves
rehab‑period interest out of "cash needed". The matrix has a row for it,
marked as such, so the investor can decide.

### Every parameter explains itself

`src/lib/glossary.ts` is the sheet's own **הערות** column, transcribed across
all six tabs. Every field in the form and every row of the comparison matrix
carries a "?" that shows its explanation on hover, on keyboard focus, and on
tap — and the same text reaches screen readers through the field's
`aria-describedby`, so it is announced with the field rather than as a stray
tooltip.

### How it is arranged, and why

Correct numbers are not the same as readable ones, so the screen is ordered
around the question being asked. The results come **first in the DOM** — which
in RTL is the right-hand, first-read column, and which puts the answer ahead of
the thirty-odd fields for the tab order and the screen reader as much as for
the eye. The form is the narrow column beside them.

The nineteen comparison rows are grouped — **התוצאה · המזומן · מדדי השכרה ·
עלויות ולוח זמנים** — and the four rows in the first group, the ones that decide
the deal, are set a size up. Rows that do not apply to a strategy show a dash at
about a fifth of the ink and take neither the winner tint nor its weight, so the
highlighted column reads as numbers rather than as a painted rectangle.

Two figures carry a threshold the investor's world actually defines, and only
those two are ever marked: **cash flow** when it is negative, and **DSCR** below
the 1.2 the glossary names banks want (below 1.0 says so more plainly). A mark
is dark terracotta *and* a warning triangle *and* a short label — never colour
alone — and a healthy number gets nothing at all, which is what keeps the two
marks visible. Those thresholds live in `ScenarioMatrix.tsx`, not in `calc.ts`:
computing a number and judging it are different jobs.

Cash-on-Cash also shows the annual dollars beneath the percentage; the figure
was already computed and simply had nowhere to appear.

The form's eight groups are disclosures that start **closed**, each summarised
by a digest of the values inside it (`$115,000 · ARV $330,000`), so the
assumptions can be read without being opened and any number of them can be open
at once. `<legend>` needs a `<fieldset>`, so this trades that grouping semantic
for a native keyboard-operable disclosure; every field keeps its own label,
`aria-describedby` and "?".

### Defaults, and what a single deal overrides

`/defaults` holds one `DealAssumptions` template: the title company's standard
fees, the lender's usual terms, the vacancy and maintenance ratios, the cost of
sale. Every new deal starts from it and "אפס לברירת מחדל" in the calculator
returns to it. The closing kit ships with the Pittsburgh figures that repeat
identically on three of the six tabs ($6,919.40). A deal overrides any of it
without touching the template, and can add closing lines of its own.

### Actuals on the property, projections in `assumptions`

What has happened is a fact on `Property` — price paid, closing paid, rehab
spent, a rented unit's real rent and debt service — and wins over any
assumption where both exist. Everything forward‑looking lives in
`Property.assumptions` (a `DealAssumptions` block: loan terms, carry, OpEx
ratios, refinance terms, cost of sale) and is what the calculator edits.
Nothing projected is stored: the property page's outcome cards and the
dashboard's "רווח צפוי" column call the same functions the calculator does,
so a save in the calculator changes both.

### 188 Kendall Ave

The investor's own deal, seeded from its tab: Pittsburgh PA 15202, 4/2,
1,800 sqft, built 1915, ten comps. A buy‑and‑hold at $115,000 with a $120,000
rehab against a $330,000 ARV — 20% down on a 30‑year note, no refinance,
origination entered as flat dollars. `scripts/calc.test.ts` pins the calculator
to the tab: NOI $1,510 · P&I $612 · cash flow $898 · CoC 7.00% · cap 15.76% ·
DSCR 2.47 · reserves $3,930 · cash needed $153,854.

### Elm Ave under the investor's model

The seed for 4412 Elm Ave is anchored to what the mockups fix as fact —
$65,600 drawn at close (80% of price), $96,000 of hard money in total, 10.5%
and 2 points, a 7‑month rehab, a 75% LTV refinance — with the sheet's defaults
for everything else (8% vacancy, 10% management, 5% maintenance, 5% CapEx,
3 months of reserves, 8% cost of sale).

Under those defaults the mockups' outcome figures do not hold. The design
assumed $257/month of operating cost with no vacancy or management; the
sheet's OpEx on $1,450 of rent is roughly $480. So instead of "+$318/month,
CoC 39%, $9,800 left in the deal", the model says: cash flow around −$70,
DSCR 0.92, about $6,900 left in — a thin BRRRR — against a flip that nets
about $16,600 for a 42% return on cash. **By the investor's own model this
property is a marginal hold and a strong flip**, the opposite of the mockup's
"BRRRR ✓" column. The calculator shows that rather than tuning the inputs to
reproduce the mockup; the assumptions are one tap away if the investor
disagrees with a default.

## State

`src/store/` is a small localStorage store: one immutable state object,
seeded from `data/portfolio.ts`, read through `useSyncExternalStore` with the
seed as the server snapshot — so server HTML and the hydration pass match and
stored values arrive a frame later. Pages are thin; screens are client
components that take an id and read the store. Actions: `addExpense`,
`setExpenseCategory`, `raiseCategoryBudget`, `saveDealInputs`, `resetToSeed`.
A categorised amount moves the category's spend and the property's rehab
spend together, keeping the seed's invariant that the categories sum to the
rehab spent. A version mismatch reseeds — bump `STORE_VERSION` when the shape
of `assumptions` changes.

One consequence worth knowing before you write a screen: because the seed is
what React renders during hydration and the stored state arrives a beat later,
a draft seeded once with `useState` would freeze the seed and silently discard
what was saved. `useDraft` in `store/hooks.ts` adopts the store's value when it
changes, unless the user has already typed — use it for anything editable.

## How it is organised

```
src/
  app/               routes; each page is a thin shell around a screen component
  components/
    layout/          top bar (desktop), tab bar (phone), shared page shell
    dashboard/       dashboard + list screens, properties table, phone cards
    property/        overview, tabs, budget-vs-actual, BRRRR timeline
    expenses/        ledger with filters, new-expense sheet, category chips
    calculator/      assumptions form, scenario matrix, ARV circles, defaults screen
    ui/              Num, Tag, Meter, Segmented, Icon, PhotoFrame, RichText, InfoTip
  data/              types + seed data from the mockups
  lib/               calc.ts (the spreadsheet), glossary.ts (its notes), deal.ts, format, labels
  store/             localStorage store and hooks
  styles/organic.css the design system, copied verbatim from the handoff
scripts/calc.test.ts the spreadsheet's totals as tests
preview/             esbuild bundle of the same app with hash routing, for the review artifact
```

### Two conventions worth knowing

**Every number is wrapped.** `<Num>` isolates Latin and numeric runs from the
surrounding Hebrew so the bidirectional algorithm leaves them alone — without
it, `4412 Elm Ave` renders as `Elm Ave 4412` and `+$318` loses its sign. Copy
in the data files marks its Latin runs with braces (`"{$5,150} מול {$4,800}"`)
and renders through `<RichText>`; a regex cannot tell that `18.9` is a Hebrew
date that belongs in the RTL flow while `$1,350` is not.

**Figures are derived, not stored.** `lib/calc.ts` and `lib/deal.ts` compute
every projected figure from the property's facts and its `assumptions`; see
"Actuals on the property, projections in `assumptions`" above.

## Deliberate divergences from the mockups

Three places where the prototype could not be copied literally:

1. **The receipt-capture warning** (3c) reads "חשמל יעמוד על $5,150 מתוך
   $4,800 — חריגה של $350" — the category's standing *before* the receipt being
   filed. Since the sentence is a projection, the implementation projects:
   category spend plus this receipt. A budget tool that under-reports an
   overrun is worse than no warning.
2. **Category colour** is driven by a `complete` flag rather than by spend.
   The roof is sage green in the mockups at 95% of budget because the trade is
   finished, not because of the number; leaving it to the numbers would have
   turned every under-budget category green.
3. **The ledger header** says "42 הוצאות · 38 קבלות · 4 ללא קטגוריה" — the
   whole ledger, as the mockup states it — while only eight rows are seeded.
   The filter chips beside the table count the rows that are actually there,
   because they filter them.

Two smaller notes: the design system's `.seg-opt` and `.nav-brand` use physical
CSS properties that flip wrong in RTL, corrected in `app/globals.css` so
`styles/organic.css` stays a faithful copy; and Caprasimo and Figtree have no
Hebrew glyphs, so Secular One and Assistant carry the Hebrew while Latin runs
stay in the original faces — the arrangement the mockups were designed around.

## Data

`src/data/portfolio.ts` holds six sample properties with their assumptions,
one property's rehab budget broken into seven categories, eight of the
ledger's 42 expenses, and the portfolio summary. It is the seed the store
starts from; edits live in the browser's localStorage until a backend exists.
