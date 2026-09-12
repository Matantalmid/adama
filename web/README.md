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
```

Next.js 16 (App Router) + React 19 + TypeScript. No CSS framework — the Organic
design system is plain CSS, exactly as it was designed.

## What is implemented

Round 1 of the design covered three screens, each with two desktop approaches
and a phone layout. The **a** variants were chosen, with the phone artboards
implemented as breakpoints of the same screens rather than separate components.

| Screen | Route | From mockup |
| --- | --- | --- |
| Portfolio dashboard | `/` | 1a desktop, 1c phone |
| Properties list | `/properties` | the dashboard's "כל הנכסים" destination |
| Property overview | `/properties/[id]` | 2a desktop, 2c phone |
| Project expenses | `/properties/[id]/expenses` | 3a desktop, phone list |
| Receipt capture | modal, from the phone tab bar's camera | 3c |

Not implemented, because they were not designed — the transcript defers them to
the next round, pending the user's own calculation spreadsheet: the BRRRR and
Fix & Flip calculators, property comparison, and ARV/comps. Their routes exist
(`/calculators`, `/compare`, `/arv`, `/more`, `/properties/new`) and say so,
rather than leaving the navigation in the mockups pointing at dead links.

The **b** variants — the BRRRR pipeline dashboard (1b), the deal sheet (2b) and
the phase timeline (3b) — are not built. They are alternative treatments of the
same data, so the data layer already supports them.

## How it is organised

```
src/
  app/               routes; each page is a thin shell around a screen component
  components/
    layout/          top bar (desktop), tab bar (phone), shared page shell
    dashboard/       portfolio KPIs, properties table, phone property cards
    property/        overview, budget-vs-actual, BRRRR timeline
    expenses/        expense ledger with filters, receipt capture sheet
    ui/              Num, Tag, Meter, Segmented, Icon, PhotoFrame, RichText
  data/              types + seed data from the mockups
  lib/               deal maths, formatting, label vocabulary
  styles/organic.css the design system, copied verbatim from the handoff
```

### Two conventions worth knowing

**Every number is wrapped.** `<Num>` isolates Latin and numeric runs from the
surrounding Hebrew so the bidirectional algorithm leaves them alone — without
it, `4412 Elm Ave` renders as `Elm Ave 4412` and `+$318` loses its sign. Copy
in the data files marks its Latin runs with braces (`"{$5,150} מול {$4,800}"`)
and renders through `<RichText>`; a regex cannot tell that `18.9` is a Hebrew
date that belongs in the RTL flow while `$1,350` is not.

**Figures are derived, not stored.** `lib/deal.ts` computes all-in cost, the
70%-rule MAO, refinance proceeds, cash flow, cash-on-cash and flip ROI from the
inputs in `data/portfolio.ts`. Every figure shown in the mockups reproduces
exactly. Only quantities with no derivation are stored as authored data: a
lender's payoff, a listing price, a realised sale, and the cost-of-sale
assumption behind the flip profit.

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
3. **Expense filter counts** describe the whole 42-row ledger, as the mockups
   and the page header do, while the table shows the eight seeded rows.

Two smaller notes: the design system's `.seg-opt` and `.nav-brand` use physical
CSS properties that flip wrong in RTL, corrected in `app/globals.css` so
`styles/organic.css` stays a faithful copy; and Caprasimo and Figtree have no
Hebrew glyphs, so Secular One and Assistant carry the Hebrew while Latin runs
stay in the original faces — the arrangement the mockups were designed around.

## Data

`src/data/portfolio.ts` holds six sample properties, one property's rehab
budget broken into seven categories, eight expenses and the portfolio summary —
all from the mockups. Nothing persists; the app is stateless by design, so the
screens can be judged before a data model is committed to.
