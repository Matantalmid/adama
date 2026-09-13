import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  averagePricePerSqft,
  compPricePerSqft,
  compsArv,
  compsInAverage,
  compsMao,
  medianPricePerSqft,
  medianSalePrice,
  pricedComps,
  profitBuffer,
} from "../src/lib/comps.ts";
import { getProperty } from "../src/data/portfolio.ts";
import type { CompsAnalysis } from "../src/data/types.ts";

/**
 * Pins comps.ts to the investor's " Comps & ARV Calculator" sheet (Google
 * Drive). Expected figures are the two tabs' own header cells.
 */

const near = (actual: number, expected: number, tolerance = 0.5) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${expected} ±${tolerance}, got ${actual}`,
  );

function workup(id: string): { analysis: CompsAnalysis; sqft: number } {
  const property = getProperty(id);
  assert.ok(property, `no property ${id}`);
  assert.ok(property.compsAnalysis, `no comps workup on ${id}`);
  return { analysis: property.compsAnalysis, sqft: property.sqft };
}

describe("188 Kendall Ave tab — ten comps, one without a price", () => {
  const { analysis, sqft } = workup("kendall-ave");

  it("prices nine of the ten; 419 Jefferson has no sale price", () => {
    assert.equal(analysis.comps.length, 10);
    assert.equal(pricedComps(analysis).length, 9);
    assert.equal(compsInAverage(analysis).length, 9);
    assert.equal(compPricePerSqft(analysis.comps[0]), null);
  });

  it("each comp's $/SqFt is its price over its size", () => {
    // 33 S Harrison: $340,000 over 1,964 sqft.
    near(compPricePerSqft(analysis.comps[1]) as number, 173.12, 0.005);
    // 235 Grant: $285,000 over 1,250 sqft — the top of the range.
    near(compPricePerSqft(analysis.comps[5]) as number, 228.0, 0.005);
  });

  it("average $192.60 · ARV $346,680 · MAO $122,676", () => {
    assert.equal(averagePricePerSqft(analysis), 192.6);
    assert.equal(compsArv(analysis, sqft), 346_680);
    assert.equal(compsMao(analysis, sqft), 122_676);
  });

  it("medians $301,000 and $202.63, buffer $104,004", () => {
    assert.equal(medianSalePrice(analysis), 301_000);
    near(medianPricePerSqft(analysis), 202.63, 0.005);
    assert.equal(profitBuffer(analysis, sqft), 104_004);
  });
});

describe("123 Olancha Ave tab — a comp out of the average", () => {
  const { analysis, sqft } = workup("olancha-ave");

  it("9 Elton St is priced but set aside, so three comps make two rates", () => {
    assert.equal(pricedComps(analysis).length, 3);
    assert.equal(compsInAverage(analysis).length, 2);
  });

  it("average $138.50 · ARV $415,500 · MAO $170,850", () => {
    assert.equal(averagePricePerSqft(analysis), 138.5);
    assert.equal(compsArv(analysis, sqft), 415_500);
    assert.equal(compsMao(analysis, sqft), 170_850);
  });

  it("the set-aside comp still counts toward the median sale price", () => {
    // Median of $295,000, $328,000 and $293,000 — not of the two rated ones.
    assert.equal(medianSalePrice(analysis), 295_000);
    near(medianPricePerSqft(analysis), 138.53, 0.005);
    assert.equal(profitBuffer(analysis, sqft), 124_650);
  });
});

describe("the rounding the sheet does", () => {
  const { analysis, sqft } = workup("kendall-ave");

  it("rounds the rate to one decimal, not the ARV", () => {
    // The raw mean is 192.5795…; at full precision the ARV would be $346,643.
    const raw = compsInAverage(analysis)
      .map((c) => compPricePerSqft(c) as number)
      .reduce((sum, r, _, all) => sum + r / all.length, 0);
    near(raw, 192.5795, 0.0005);
    assert.notEqual(Math.round(sqft * raw), 346_680);
    assert.equal(compsArv(analysis, sqft), 346_680);
  });

  it("an override replaces the comps' rate", () => {
    const override: CompsAnalysis = { ...analysis, pricePerSqftOverride: 183 };
    assert.equal(compsArv(override, sqft), 329_400);
  });
});
