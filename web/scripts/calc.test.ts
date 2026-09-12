import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  amortizedPayment,
  emptyClosingItems,
  evaluateBrrrr,
  evaluateFlip,
  type DealInputs,
} from "../src/lib/calc.ts";
import { getProperty } from "../src/data/portfolio.ts";
import { inputsFromProperty } from "../src/lib/calc.ts";

/**
 * Pins calc.ts to the investor's spreadsheet ("מחשבון עסקה", Google Drive).
 * Expected figures are the sheet's own totals, read off its cells.
 */

const near = (actual: number | null, expected: number, tolerance = 1) => {
  assert.ok(actual !== null, `expected ${expected}, got null`);
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${expected} ±${tolerance}, got ${actual}`,
  );
};

describe("amortized payment (sheet P&I cells)", () => {
  it("matches the sheet's three P&I figures", () => {
    near(amortizedPayment(96_675, 7, 30), 643, 0.6);
    near(amortizedPayment(198_000, 7, 30), 1_317, 0.6);
    near(amortizedPayment(150_000, 7, 30), 997.95, 0.01);
  });
});

describe("Flip tab — מחשבון פליפ, first deal", () => {
  const inputs: DealInputs = {
    purchasePrice: 128_900,
    arv: 320_000,
    rehabBudget: 120_000,
    contingencyPct: 0,
    rehabMonths: 5,
    closing: {
      mode: "itemized",
      items: {
        ...emptyClosingItems,
        titleInsurance: 1_000,
        closingProtectionLetter: 125,
        endorsements: 150,
        settlement: 50,
        recording: 334,
        transferTax: 1_050,
        adminFee: 495,
        schoolTaxProration: 2_000,
        inspection: 450,
      },
    },
    purchaseLoan: { kind: "hard-money", ltvPct: 0, ratePct: 12, termYears: 30 },
    rehabLoan: { financedPct: 100, ratePct: 12 },
    pointsPct: 2,
    holding: { propertyTaxYr: 2_000, insuranceYr: 1_200, utilitiesMo: 200, yardSnowMo: 100 },
    sale: { agentPct: 6, otherPct: 2 },
    income: { monthlyRent: 0, vacancyPct: 0 },
    opex: { managementPct: 0, hoaMo: 0, maintenancePct: 0, capexPct: 0 },
    reservesMonths: 3,
  };
  const r = evaluateFlip(inputs);

  it("loans, points, closing, equity", () => {
    near(r.totalLoans, 120_000);
    near(r.points, 2_400);
    near(r.closing, 5_654);
    near(r.equity, 128_900);
  });
  it("interest, holding, selling", () => {
    near(r.rehabInterest, 6_000);
    near(r.holding, 8_833);
    near(r.selling, 25_600);
  });
  it("investment, profit, ROI, MAO", () => {
    near(r.totalInvestment, 145_787);
    near(r.netProfit, 28_613);
    near(r.roiPct, 19.63, 0.01);
    assert.equal(r.mao, 104_000);
  });
});

describe("BRRRR tab — מחשבון עסקה, rental with refinance", () => {
  const inputs: DealInputs = {
    purchasePrice: 128_900,
    arv: 330_000,
    rehabBudget: 72_000,
    contingencyPct: 0,
    rehabMonths: 6,
    closing: {
      mode: "itemized",
      items: {
        ...emptyClosingItems,
        titleInsurance: 1_472.4,
        closingProtectionLetter: 125,
        settlement: 220,
        recording: 400,
        transferTax: 1_937,
        adminFee: 495,
        inspection: 450,
        docPrep: 195,
        courier: 50,
        bringdown: 25,
        buyerBrokerFee: 1_550,
      },
    },
    purchaseLoan: { kind: "dscr", ltvPct: 75, ratePct: 7, termYears: 30 },
    rehabLoan: { financedPct: 0, ratePct: 12 },
    pointsPct: 2,
    // The sheet enters taxes 340/mo and insurance 110/mo; here they are annual.
    holding: { propertyTaxYr: 4_080, insuranceYr: 1_320, utilitiesMo: 0, yardSnowMo: 0 },
    sale: { agentPct: 6, otherPct: 2 },
    income: { monthlyRent: 2_500, vacancyPct: 8 },
    // The sheet's maintenance cell is 200 on 2,500 rent — 8%, whatever its note says.
    opex: { managementPct: 10, hoaMo: 0, maintenancePct: 8, capexPct: 0 },
    refinance: { ltvPct: 60, ratePct: 7, termYears: 30, closingPct: 2, seasoningMonths: 6 },
    reservesMonths: 3,
  };
  const r = evaluateBrrrr(inputs);

  it("purchase loan, payment, points, closing", () => {
    near(r.purchaseLoan, 96_675);
    near(r.purchasePayment, 643, 0.6);
    near(r.points, 1_934);
    near(r.closing, 6_919, 0.5);
  });
  it("income, opex, NOI, reserves, cash needed", () => {
    near(r.goi, 2_300);
    near(r.opex, 900);
    near(r.noi, 1_400);
    near(r.reserves, 4_630);
    near(r.totalCashNeeded, 117_707);
  });
  it("refinance: new loan, payment, closing, cash‑out, cash left", () => {
    assert.ok(r.refinance);
    near(r.refinance.newLoan, 198_000);
    near(r.refinance.newPayment, 1_317, 0.6);
    near(r.refinance.refiClosing, 3_960);
    near(r.refinance.cashOut, 97_365);
    near(r.cashLeftInDeal, 20_342);
  });
  it("cash flow, CoC, cap rate, DSCR, 1% rule", () => {
    near(r.monthlyCashFlow, 83, 0.6);
    near(r.cashOnCashPct, 4.88, 0.01);
    near(r.capRatePct, 13.03, 0.01);
    near(r.dscr, 1.06, 0.01);
    near(r.onePercentRulePct, 1.2, 0.01);
  });
});

describe("Elm Ave seed — anchors the mockups fix", () => {
  const property = getProperty("elm-ave");
  assert.ok(property);
  const inputs = inputsFromProperty(property);
  const flip = evaluateFlip(inputs);
  const brrrr = evaluateBrrrr(inputs);

  it("MAO $77,500 and $96,000 of hard money ($65,600 at close)", () => {
    assert.equal(flip.mao, 77_500);
    near(flip.purchaseLoan, 65_600);
    near(flip.totalLoans, 96_000);
  });
  it("refinance at 75% LTV: $123,750, ~$874/mo, $41,250 equity, 13 months to cash", () => {
    assert.ok(brrrr.refinance);
    near(brrrr.refinance.newLoan, 123_750);
    near(brrrr.refinance.newPayment, 874, 1);
    near(brrrr.refinance.equityAfterRefi, 41_250);
    assert.equal(brrrr.refinance.monthsToCash, 13);
  });
  it("all‑in before financing is $127,401 (holding from monthlies over 7 months)", () => {
    near(flip.allInExFinancing, 127_401);
  });
});
