"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { PropertyTabs } from "@/components/property/PropertyTabs";
import { Num } from "@/components/ui/Num";
import { Tag } from "@/components/ui/Tag";
import { MissingProperty } from "@/components/layout/MissingProperty";
import { activePropertyId, expenseLedger } from "@/data/portfolio";
import type { CompsAnalysis, Property } from "@/data/types";
import { stageLabels, strategyLabels } from "@/lib/labels";
import { actions } from "@/store";
import {
  useDraft,
  useExpenses,
  useProperties,
  useProperty,
  useResolvedPropertyId,
} from "@/store/hooks";

import { ArvSummary } from "./ArvSummary";
import { CompsTable } from "./CompsTable";
import { SpreadStrip } from "./SpreadStrip";
import { SubjectCard } from "./SubjectCard";
import styles from "./Comps.module.css";

/**
 * The investor's " Comps & ARV Calculator" sheet as a screen: the subject
 * property, the comparable sales under it, and the ARV they add up to.
 *
 * Mounted two ways, as the deal calculator is: `/arv` with a property picker
 * and `/properties/[id]/arv` as a property tab. Edits are a local draft until
 * "שמור לנכס" writes them, and nothing here touches the property's own ARV —
 * the deal calculator keeps the figure it was given.
 */

/** What a property with no workup yet starts from. */
function blankAnalysis(property: Property): CompsAnalysis {
  return {
    askingPrice: property.purchasePrice,
    rehabEstimate: property.rehabBudget,
    plannedCondition: "full",
    comps: [],
  };
}

export function CompsScreen({ propertyId }: { propertyId?: string }) {
  const properties = useProperties();
  const [picked, setPicked] = useState(activePropertyId);
  // The picked property can be deleted from another screen, and the <select>
  // that would let you choose another lives below this guard — so resolve to
  // one that still exists rather than rendering an empty page.
  const resolved = useResolvedPropertyId(picked);
  const id = propertyId ?? resolved ?? "";
  const property = useProperty(id);
  const expenses = useExpenses(id);

  if (!property) return <MissingProperty empty={!propertyId} />;

  const expenseCount =
    property.id === expenseLedger.propertyId ? expenseLedger.totalCount : expenses.length;

  return (
    <div className={styles.page}>
      {propertyId ? (
        <>
          <nav className={`text-muted ${styles.breadcrumb}`} aria-label="מיקום">
            <Link href="/properties">נכסים</Link>
            <span className={styles.separator} aria-hidden="true">
              ›
            </span>
            <Link href={`/properties/${property.id}`}>
              <Num>{property.address}</Num>
            </Link>
            <span className={styles.separator} aria-hidden="true">
              ›
            </span>
            <span style={{ color: "var(--color-text)" }}>Comps &amp; ARV</span>
          </nav>
          <PropertyTabs propertyId={property.id} active="arv" expenseCount={expenseCount} />
        </>
      ) : (
        <div className={styles.picker}>
          <label htmlFor="comps-property" className="text-muted" style={{ fontSize: 12 }}>
            נכס
          </label>
          <select
            id="comps-property"
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

      <CompsBody key={property.id} property={property} />
    </div>
  );
}

function CompsBody({ property }: { property: Property }) {
  const saved = useMemo(
    () => property.compsAnalysis ?? blankAnalysis(property),
    [property],
  );
  const [analysis, setAnalysis] = useDraft<CompsAnalysis>(saved);
  const dirty = useMemo(
    () => JSON.stringify(analysis) !== JSON.stringify(saved),
    [analysis, saved],
  );
  const stage = stageLabels[property.stage];

  function save() {
    actions.saveComps(property.id, analysis);
  }

  /** The strip's dots and the table's checkboxes do the same thing. */
  function toggleComp(id: string, excluded: boolean) {
    setAnalysis({
      ...analysis,
      comps: analysis.comps.map((c) => (c.id === id ? { ...c, excluded } : c)),
    });
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
            קומפס ו‑<Num>ARV</Num> · הנוסחאות מ&quot;<Num>Comps &amp; ARV Calculator</Num>&quot;
          </p>
        </div>
        <div className={styles.actions}>
          <Link href={`/properties/${property.id}/calculator`} className="btn btn-secondary">
            מחשבון העסקה
          </Link>
          {dirty ? (
            <button type="button" className="btn btn-secondary" onClick={() => setAnalysis(saved)}>
              בטל שינויים
            </button>
          ) : null}
          <button type="button" className="btn btn-primary" onClick={save} disabled={!dirty}>
            שמור לנכס
          </button>
        </div>
      </header>

      {/* Results first, as the calculator does: in RTL that is the right-hand
          column, so the ARV is read before the inputs behind it. */}
      <div className={styles.layout}>
        <div className={styles.results}>
          <ArvSummary analysis={analysis} sqft={property.sqft} propertyArv={property.arv} />
          <SpreadStrip analysis={analysis} onToggle={toggleComp} />
        </div>

        <aside className={styles.subject}>
          <SubjectCard property={property} analysis={analysis} onChange={setAnalysis} />
        </aside>

        <div className={styles.tableWrap}>
          <CompsTable
            analysis={analysis}
            subject={{
              beds: property.beds,
              baths: property.baths,
              condition: analysis.plannedCondition,
            }}
            onChange={setAnalysis}
          />
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
