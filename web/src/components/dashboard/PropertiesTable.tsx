import Link from "next/link";

import { Meter } from "@/components/ui/Meter";
import { Num } from "@/components/ui/Num";
import { Tag } from "@/components/ui/Tag";
import type { Property } from "@/data/types";
import {
  allInProjected,
  cashOut,
  maxAllowableOffer,
  monthlyCashFlow,
  rehabProgressPct,
} from "@/lib/deal";
import { compareScenarios, inputsFromProperty } from "@/lib/calc";
import { money, moneySigned, percent, sqft, unitMix } from "@/lib/format";
import { stageLabels, strategyLabels } from "@/lib/labels";

import styles from "./PropertiesTable.module.css";

/**
 * The portfolio table from mockup 1a: one row per property, with rehab spend
 * shown as a bar so an overrun is visible without reading the numbers.
 */
export function PropertiesTable({ properties }: { properties: Property[] }) {
  return (
    <div className={styles.scroll}>
      <table className="table" style={{ fontSize: 13.5 }}>
        <thead>
          <tr>
            <th>נכס</th>
            <th>אסטרטגיה</th>
            <th>סטטוס</th>
            <th>All-in</th>
            <th>ARV</th>
            <th style={{ width: 170 }}>תקציב שיפוץ</th>
            <th>רווח צפוי</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => (
            <tr key={property.id}>
              <td>
                <Link href={`/properties/${property.id}`} className={styles.address}>
                  <Num>{property.address}</Num>
                </Link>
                <div className="text-muted" style={{ fontSize: 11.5 }}>
                  <Num>{`${property.city}, ${property.state}`}</Num>
                  {" · "}
                  {unitMix(property)} · <Num>{sqft(property.sqft)}</Num>
                </div>
              </td>
              <td className={styles.strategy}>{strategyLabels[property.strategy]}</td>
              <td>
                <Tag tone={stageLabels[property.stage].tone}>
                  {stageLabels[property.stage].label}
                </Tag>
              </td>
              <td className="num">{money(allInProjected(property))}</td>
              <td className="num">{money(property.arv)}</td>
              <td>
                <RehabCell property={property} />
              </td>
              <td>
                <ProfitCell property={property} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RehabCell({ property }: { property: Property }) {
  // Only a live renovation earns a progress bar; the other stages have a
  // one-word answer and the bar would be noise.
  switch (property.stage) {
    case "under-contract":
      return <Muted>טרם התחיל</Muted>;
    case "sold":
      return <Muted>—</Muted>;
    case "rented":
    case "refinance":
      return <Muted>הושלם</Muted>;
  }

  const pct = rehabProgressPct(property);
  const over = pct > 100;

  return (
    <div className={styles.rehab}>
      <Meter
        value={pct}
        tone={over ? "over" : "accent"}
        label={`שיפוץ: ${money(property.rehabSpent)} מתוך ${money(property.rehabBudget)}`}
      />
      <Num className={over ? styles.rehabOver : "text-muted"}>{percent(pct)}</Num>
    </div>
  );
}

function ProfitCell({ property }: { property: Property }) {
  if (property.realisedProfit !== undefined) {
    return <Num className={styles.profit}>{`${money(property.realisedProfit)} ✓`}</Num>;
  }

  const cashFlow = monthlyCashFlow(property);
  if (property.stage === "rented" && cashFlow !== null) {
    // One isolated run, not two: splitting it strands the "+" on the wrong
    // side of the slash once the bidi algorithm reorders the line.
    return <Num className={styles.profit}>{`${moneySigned(cashFlow)}/חודש`}</Num>;
  }

  // A refinancing property's "profit" is the cash the new loan releases.
  const released = cashOut(property);
  if (property.stage === "refinance" && released !== null) {
    return <Num className={styles.profit}>{`${money(released)} cash-out`}</Num>;
  }

  // In‑flight deals show the projection for their declared strategy: a flip
  // its net profit, a BRRRR its post‑refinance monthly cash flow.
  if (property.strategy === "FLIP") {
    const { flip } = compareScenarios(inputsFromProperty(property));
    return <Num className={styles.profit}>{money(Math.round(flip.netProfit))}</Num>;
  }
  if (property.strategy === "BRRRR") {
    const { brrrr } = compareScenarios(inputsFromProperty(property));
    return (
      <Num className={styles.profit}>{`${moneySigned(Math.round(brrrr.monthlyCashFlow))}/חודש`}</Num>
    );
  }

  // Nothing modelled yet — the only question that matters on a deal this
  // early is whether the price clears the 70% rule.
  const clearsRule = property.purchasePrice <= maxAllowableOffer(property);
  return (
    <Muted>
      <Num>{`70% rule ${clearsRule ? "✓" : "✗"}`}</Num>
    </Muted>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-muted" style={{ fontSize: 12 }}>
      {children}
    </span>
  );
}
