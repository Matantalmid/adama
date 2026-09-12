"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { PropertyTabs } from "@/components/property/PropertyTabs";
import { Num } from "@/components/ui/Num";
import { Tag } from "@/components/ui/Tag";
import { activePropertyId, expenseLedger } from "@/data/portfolio";
import type { Property } from "@/data/types";
import {
  assumptionsOf,
  compareScenarios,
  defaultAssumptions,
  inputsFromProperty,
  type DealInputs,
} from "@/lib/calc";
import { stageLabels, strategyLabels } from "@/lib/labels";
import { actions } from "@/store";
import { useExpenses, useProperties, useProperty } from "@/store/hooks";

import { ArvCircles } from "./ArvCircles";
import { DealInputsForm } from "./DealInputsForm";
import { ScenarioMatrix } from "./ScenarioMatrix";
import styles from "./Calculator.module.css";

/**
 * BRRRR against Fix & Flip for one property, on the investor's own formulas.
 * Mounted two ways: `/calculators` with a property picker, and as a property
 * page tab at `/properties/[id]/calculator`. Edits are a local draft until
 * "שמור לנכס" writes them to the store, from where the property page and the
 * dashboard read the same numbers.
 */
export function CalculatorScreen({ propertyId }: { propertyId?: string }) {
  const properties = useProperties();
  const [picked, setPicked] = useState(activePropertyId);
  const id = propertyId ?? picked;
  const property = useProperty(id);
  const expenses = useExpenses(id);

  if (!property) return null;

  const expenseCount =
    property.id === expenseLedger.propertyId ? expenseLedger.totalCount : expenses.length;

  return (
    <div className={styles.page}>
      {propertyId ? (
        <>
          <nav className={`text-muted ${styles.breadcrumb}`} aria-label="מיקום">
            <Link href="/properties">נכסים</Link>
            <span className={styles.separator} aria-hidden="true">›</span>
            <Link href={`/properties/${property.id}`}>
              <Num>{property.address}</Num>
            </Link>
            <span className={styles.separator} aria-hidden="true">›</span>
            <span style={{ color: "var(--color-text)" }}>BRRRR / Flip</span>
          </nav>
          <PropertyTabs propertyId={property.id} active="calculator" expenseCount={expenseCount} />
        </>
      ) : (
        <div className={styles.picker}>
          <label htmlFor="calc-property" className="text-muted" style={{ fontSize: 12 }}>
            נכס
          </label>
          <select
            id="calc-property"
            className={`input ${styles.select}`}
            dir="ltr"
            value={id}
            onChange={(event) => setPicked(event.target.value)}
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address} — {p.city}, {p.state}
              </option>
            ))}
          </select>
        </div>
      )}

      <CalculatorBody key={property.id} property={property} />
    </div>
  );
}

function CalculatorBody({ property }: { property: Property }) {
  const saved = useMemo(() => inputsFromProperty(property), [property]);
  const [inputs, setInputs] = useState<DealInputs>(saved);
  const comparison = useMemo(() => compareScenarios(inputs), [inputs]);
  const dirty = useMemo(() => JSON.stringify(inputs) !== JSON.stringify(saved), [inputs, saved]);
  const stage = stageLabels[property.stage];

  function save() {
    actions.saveDealInputs(property.id, inputs);
  }
  function discard() {
    setInputs(saved);
  }
  function sheetDefaults() {
    setInputs({ ...inputs, ...defaultAssumptions(property), closing: inputs.closing });
  }

  return (
    <>
      <header className={styles.header}>
        <div>
          <div className={styles.tags}>
            <Tag tone={stage.tone}>{stage.label}</Tag>
            {property.strategy !== "UNDECIDED" ? (
              <Tag tone="neutral">{strategyLabels[property.strategy]}</Tag>
            ) : null}
          </div>
          <h1 className={styles.title}>{property.address}</h1>
          <p className={`text-muted ${styles.subtitle}`}>
            מחשבון BRRRR מול Fix &amp; Flip · הנוסחאות מ&quot;מחשבון עסקה&quot;
          </p>
        </div>
        <div className={styles.actions}>
          <button type="button" className="btn btn-secondary" onClick={sheetDefaults}>
            ברירות המחדל של הגיליון
          </button>
          {dirty ? (
            <button type="button" className="btn btn-secondary" onClick={discard}>
              בטל שינויים
            </button>
          ) : null}
          <button type="button" className="btn btn-primary" onClick={save} disabled={!dirty}>
            שמור לנכס
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.inputs}>
          <details className={styles.inputsDisclosure} open>
            <summary className={styles.inputsSummary}>עריכת הנחות</summary>
            <DealInputsForm inputs={inputs} onChange={setInputs} />
          </details>
        </aside>

        <div className={styles.results}>
          <ArvCircles
            inputs={inputs}
            comparison={comparison}
            compCount={property.compCount}
            sqft={property.sqft}
          />
          <ScenarioMatrix comparison={comparison} strategy={property.strategy} />
        </div>
      </div>

      {dirty ? (
        <div className={styles.saveBar}>
          <span>יש שינויים שלא נשמרו</span>
          <button type="button" className="btn btn-primary" onClick={save}>
            שמור לנכס
          </button>
        </div>
      ) : null}
    </>
  );
}

// Keep the helper referenced for the store's assumptions shape.
export type { DealInputs };
void assumptionsOf;
