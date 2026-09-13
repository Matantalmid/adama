"use client";

import Link from "next/link";

import { DeleteProperty } from "@/components/property/DeleteProperty";
import { Icon } from "@/components/ui/Icon";
import { Meter } from "@/components/ui/Meter";
import { Num } from "@/components/ui/Num";
import { Tag } from "@/components/ui/Tag";
import type { Property } from "@/data/types";
import { monthlyCashFlow, rehabProgressPct } from "@/lib/deal";
import { money, moneyCompact, moneySigned, percent } from "@/lib/format";
import { stageLabels, strategyShortLabels } from "@/lib/labels";

import styles from "./MobilePropertyCard.module.css";

/**
 * A property as it appears in the phone list (mockup 1c) — the address, where
 * it stands, and the one number that matters at this stage: rehab progress
 * while renovating, cash flow once rented, the appointment while refinancing.
 *
 * The whole card was one <Link>, which left nowhere to put a second control —
 * a button inside an anchor is not valid and does not behave. The link now
 * stretches over the card instead, so the card is still tappable everywhere
 * and the delete button sits above it.
 */
export function MobilePropertyCard({ property }: { property: Property }) {
  const stage = stageLabels[property.stage];
  const cashFlow = monthlyCashFlow(property);

  return (
    <article className={`card ${styles.card}`}>
      <div className={styles.head}>
        <Link href={`/properties/${property.id}`} className={styles.stretch}>
          <strong>
            <Num>{property.address}</Num>
          </strong>
        </Link>
        <Tag tone={stage.tone}>{stage.label}</Tag>
        <DeleteProperty
          property={property}
          className={`btn btn-icon btn-secondary ${styles.cardDelete}`}
          label={`מחק ${property.address}`}
        >
          <Icon name="trash" size={14} />
        </DeleteProperty>
      </div>

      <div className={`text-muted ${styles.meta}`}>
        <Num>{property.city}</Num>
        {property.strategy !== "UNDECIDED" ? (
          <>
            {" · "}
            <Num>{strategyShortLabels[property.strategy]}</Num>
          </>
        ) : null}
        {property.stage === "rehab" ? (
          <>
            {" · ARV "}
            <Num>{moneyCompact(property.arv)}</Num>
          </>
        ) : null}
        {property.stage === "listed" && property.listPrice ? (
          <>
            {" · רשום "}
            <Num>{moneyCompact(property.listPrice)}</Num>
          </>
        ) : null}
        {property.stage === "rented" && cashFlow !== null ? (
          <>
            {" · "}
            <Num className={styles.cashFlow}>{moneySigned(cashFlow)}</Num> לחודש
          </>
        ) : null}
        {property.stage === "refinance" && property.note
          ? ` · ${property.note.replace("שמאי · ", "שמאי ")}`
          : null}
        {/* A deal that has not closed has only one number worth showing. */}
        {property.stage === "under-contract" ? (
          <>
            {" · מחיר "}
            <Num>{moneyCompact(property.purchasePrice)}</Num>
          </>
        ) : null}
      </div>

      {property.stage === "rehab" || property.stage === "listed" ? (
        <div className={styles.progress}>
          <Meter
            value={rehabProgressPct(property)}
            tone={rehabProgressPct(property) > 100 ? "over" : "accent"}
            label={`שיפוץ: ${money(property.rehabSpent)} מתוך ${money(property.rehabBudget)}`}
          />
          {property.stage === "rehab" ? (
            <Num className={styles.progressLabel}>
              {`${moneyCompact(property.rehabSpent)} / ${moneyCompact(property.rehabBudget)}`}
            </Num>
          ) : (
            <Num className={`${styles.progressLabel} ${styles.over}`}>
              {percent(rehabProgressPct(property))}
            </Num>
          )}
        </div>
      ) : null}
    </article>
  );
}
