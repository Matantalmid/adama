"use client";

import { NumberField } from "@/components/calculator/NumberField";
import { Icon } from "@/components/ui/Icon";
import { InfoTip } from "@/components/ui/InfoTip";
import { Num } from "@/components/ui/Num";
import type { CompCondition, CompsAnalysis, GarageKind, Property } from "@/data/types";
import { averagePricePerSqft } from "@/lib/comps";
import { pricePerSqft, safeUrl, sqft as sqftLabel, unitMix } from "@/lib/format";
import { compsGlossary } from "@/lib/glossary";
import { conditionLabels, conditionOrder, garageLabels } from "@/lib/labels";

import styles from "./Comps.module.css";

/**
 * The sheet's "כרטיס נכס המטרה לבדיקה" — what the comps are being compared to.
 *
 * The house's own facts come off the property, so there is one copy of them.
 * What lives here is what only exists at comps stage: the asking price, the
 * early rehab estimate, and the finish level the comps should be matched to.
 */

const garages = Object.keys(garageLabels) as GarageKind[];

export function SubjectCard({
  property,
  analysis,
  onChange,
}: {
  property: Property;
  analysis: CompsAnalysis;
  onChange: (next: CompsAnalysis) => void;
}) {
  const patch = (part: Partial<CompsAnalysis>) => onChange({ ...analysis, ...part });
  const average = averagePricePerSqft(analysis);
  const units = unitMix(property);

  return (
    <section className={`card ${styles.subjectCard}`} aria-label="נכס המטרה">
      <h2 className={styles.subjectTitle}>נכס המטרה</h2>

      <p className={`text-muted ${styles.facts}`}>
        {units ? <span className={styles.factPair}>{units} חדרים</span> : null}
        <span className={styles.factPair}>
          <Num>{sqftLabel(property.sqft)}</Num>
        </span>
        {property.yearBuilt ? (
          <span className={styles.factPair}>
            נבנה <Num>{property.yearBuilt}</Num>
          </span>
        ) : null}
      </p>

      <div className={styles.subjectFields}>
        <NumberField
          id="s-asking"
          label="מחיר מבוקש נוכחי"
          unit="$"
          info={compsGlossary.askingPrice}
          value={analysis.askingPrice}
          onChange={(v) => patch({ askingPrice: v })}
        />
        <NumberField
          id="s-rehab"
          label="תקציב שיפוץ מוערך"
          unit="$"
          info={compsGlossary.rehabEstimate}
          value={analysis.rehabEstimate}
          onChange={(v) => patch({ rehabEstimate: v })}
        />
        <NumberField
          id="s-lot"
          label="שטח מגרש"
          unit="sqft"
          info={compsGlossary.lotSqft}
          value={analysis.lotSqft ?? 0}
          onChange={(v) => patch({ lotSqft: v || undefined })}
        />

        {/* Four finish levels with names this long do not fit a segmented
            control in a 320px column, so both use the same <select> the comps
            table does — one control for one kind of choice. */}
        <Choice
          id="s-garage"
          label="חניה / גראז'"
          info={compsGlossary.garage}
          value={analysis.garage ?? "none"}
          options={garages.map((value) => ({ value, label: garageLabels[value] }))}
          onChange={(garage) => patch({ garage: garage as GarageKind })}
        />

        <Choice
          id="s-condition"
          label="רמת גימור מתוכננת"
          info={compsGlossary.plannedCondition}
          value={analysis.plannedCondition ?? "full"}
          options={conditionOrder.map((value) => ({ value, label: conditionLabels[value] }))}
          onChange={(condition) => patch({ plannedCondition: condition as CompCondition })}
        />

        <div className="field">
          <div className={styles.labelRow}>
            <label htmlFor="s-zillow">
              קישור למודעה (<Num>Zillow</Num>)
            </label>
            <InfoTip id="s-zillow-tip" text={compsGlossary.zillowUrl} label="קישור למודעה" />
          </div>
          <div className={styles.linkRow}>
            <input
              id="s-zillow"
              aria-describedby="s-zillow-tip"
              className={`input ${styles.urlInput}`}
              dir="auto"
              placeholder="https://www.zillow.com/homedetails/..."
              value={analysis.zillowUrl ?? ""}
              onChange={(event) => patch({ zillowUrl: event.target.value || undefined })}
            />
            <SubjectListing url={analysis.zillowUrl} />
          </div>
        </div>

        <div className={styles.overrideRow}>
          <NumberField
            id="s-rate"
            label="מחיר לרגל רבוע"
            unit="$"
            hint={`ממוצע הקומפס: ${pricePerSqft(average, 2)}`}
            info={compsGlossary.pricePerSqftOverride}
            value={analysis.pricePerSqftOverride ?? average}
            onChange={(v) => patch({ pricePerSqftOverride: v })}
          />
          {analysis.pricePerSqftOverride != null ? (
            <button
              type="button"
              className={`btn btn-secondary ${styles.resetOverride}`}
              onClick={() => patch({ pricePerSqftOverride: undefined })}
            >
              לממוצע
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** The subject's own listing, once it is a usable address. */
function SubjectListing({ url }: { url?: string }) {
  const href = safeUrl(url);
  if (!href) return null;
  return (
    <a
      className={styles.listing}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={href}
    >
      <Icon name="external-link" size={11} />
      <Num>Zillow</Num>
    </a>
  );
}

/** A labelled dropdown with the same "?" every field on this screen carries. */
function Choice({
  id,
  label,
  info,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  info: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <div className={styles.labelRow}>
        <label htmlFor={id}>{label}</label>
        <InfoTip id={`${id}-tip`} text={info} label={label} />
      </div>
      <select
        id={id}
        aria-describedby={`${id}-tip`}
        className={`input ${styles.select}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
