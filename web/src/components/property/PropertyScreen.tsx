"use client";

import Link from "next/link";

import { Icon } from "@/components/ui/Icon";
import { Meter } from "@/components/ui/Meter";
import { Num } from "@/components/ui/Num";
import { PhotoFrame } from "@/components/ui/PhotoFrame";
import { RichText } from "@/components/ui/RichText";
import { Tag } from "@/components/ui/Tag";
import { MissingProperty } from "@/components/layout/MissingProperty";
import type { Property } from "@/data/types";
import { expenseLedger } from "@/data/portfolio";
import { compareScenarios, inputsFromProperty } from "@/lib/calc";
import {
  allInProjected,
  isOverBudget,
  maxAllowableOffer,
  monthlyCashFlow,
  overMao,
  rehabProgressPct,
} from "@/lib/deal";
import { money, moneySigned, percent, ratio, sqft } from "@/lib/format";
import { financingLabels, stageLabels, strategyLabels } from "@/lib/labels";
import { useExpenses, useProperty } from "@/store/hooks";

import { BudgetVsActual } from "./BudgetVsActual";
import { DeleteProperty } from "./DeleteProperty";
import { PropertyTabs } from "./PropertyTabs";
import { Timeline } from "./Timeline";
import styles from "./Property.module.css";

/**
 * Property overview — mockup 2a on desktop, 2c on a phone. The same content
 * either way: what it cost, what it is worth, how the renovation is tracking,
 * and whether holding beats selling.
 */
export function PropertyScreen({ propertyId }: { propertyId: string }) {
  const property = useProperty(propertyId);
  const expenses = useExpenses(propertyId);
  if (!property) return <MissingProperty />;
  return <PropertyBody property={property} expenseCount={expenses.length} />;
}

function PropertyBody({ property, expenseCount: seededCount }: { property: Property; expenseCount: number }) {
  const stage = stageLabels[property.stage];
  const mao = maxAllowableOffer(property);
  const over = overMao(property);
  // Projections for both strategies from the property's stored assumptions —
  // the same numbers the calculator shows, so saving there changes this page.
  const { flip, brrrr } = compareScenarios(inputsFromProperty(property));
  const cashFlow = monthlyCashFlow(property) ?? brrrr.monthlyCashFlow;
  // The ledger header describes the full 42‑row ledger; only 8 rows are seeded.
  const expenseCount =
    property.id === expenseLedger.propertyId ? expenseLedger.totalCount : seededCount;

  return (
    <div className={styles.page}>
      {/* ── mobile top bar (2c) ── */}
      <div className={styles.mobileBar}>
        <Link href="/" className="btn btn-icon btn-secondary" aria-label="חזרה">
          <Icon name="chevron-right" size={16} />
        </Link>
        <span className={styles.mobileBarTitle}>נכס</span>
        <DeleteProperty
          property={property}
          redirectTo="/properties"
          className="btn btn-icon btn-secondary"
          label="מחק נכס"
        >
          <Icon name="trash" size={16} />
        </DeleteProperty>
      </div>

      <div className={styles.crumbRow}>
        <nav className={`text-muted ${styles.breadcrumb}`} aria-label="מיקום">
          <Link href="/properties">נכסים</Link>
          <span className={styles.separator} aria-hidden="true">
            ›
          </span>
          <Num>{property.address}</Num>
        </nav>

        <div className={styles.headerActions}>
          <DeleteProperty property={property} redirectTo="/properties">
            <Icon name="trash" size={14} />
            מחק נכס
          </DeleteProperty>
        </div>
      </div>

      {/* ── hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroPhoto}>
          <PhotoFrame caption={`תמונת חזית — ${property.address}`} radius={32} />
        </div>

        <div className={styles.heroBody}>
          <div className={styles.tags}>
            <Tag tone={stage.tone}>{property.note ?? stage.label}</Tag>
            {property.strategy !== "UNDECIDED" ? (
              <Tag tone="neutral">{strategyLabels[property.strategy]}</Tag>
            ) : null}
            <Tag tone="neutral">
              <Num>{financingDescription(property)}</Num>
            </Tag>
          </div>

          <h1 className={styles.title}>{property.address}</h1>

          <p className={`text-muted ${styles.subtitle}`}>
            <RichText>{describeProperty(property)}</RichText>
          </p>

          <div className={styles.stats}>
            <Stat label="מחיר קנייה" value={money(property.purchasePrice)} />
            <Stat label="תקציב שיפוץ" value={money(property.rehabBudget)} />
            <Stat label="All-in (צפוי)" value={money(allInProjected(property))} />
            <Stat
              label={<Num>{property.compCount ? `ARV · ${property.compCount} comps` : "ARV"}</Num>}
              value={money(property.arv)}
              variant="arv"
            />
            <Stat
              label={<Num>70% rule · MAO</Num>}
              value={money(mao)}
              variant="mao"
              note={
                over > 0 ? (
                  <>
                    קנית מעל ב-<Num>{money(over)}</Num>
                  </>
                ) : (
                  <>
                    מתחת ל-<Num>MAO</Num> ✓
                  </>
                )
              }
            />
          </div>

          {/* ── mobile tiles (2c) ── */}
          <div className={styles.mobileTiles}>
            <Stat label="ARV" value={money(property.arv)} variant="arv" />
            <Stat label="All-in צפוי" value={money(allInProjected(property))} />
            <Stat
              label={property.strategy === "FLIP" ? "רווח צפוי" : "רווח BRRRR"}
              value={
                property.strategy === "FLIP"
                  ? money(Math.round(flip.netProfit))
                  : `${moneySigned(Math.round(cashFlow))}/חודש`
              }
              variant="profit"
            />
            <Stat label={<Num>MAO 70%</Num>} value={money(mao)} variant="mao" />
          </div>
        </div>
      </div>

      <PropertyTabs propertyId={property.id} active="overview" expenseCount={expenseCount} />

      {/* ── body ──
          The full category breakdown is a desktop panel; the phone gets the
          compact rehab card below and taps through to the expenses screen. */}
      <div className={styles.body}>
        {property.rehabCategories ? (
          <div className={styles.desktopOnly}>
            <BudgetVsActual property={property} />
          </div>
        ) : (
          <section className="card" style={{ padding: "20px 24px" }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>תקציב מול ביצוע</h2>
            <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>
              השיפוץ בנכס זה טרם פורק לקטגוריות.
            </p>
          </section>
        )}

        <div className={styles.column}>
          {property.timeline ? <Timeline milestones={property.timeline} /> : null}

          <div className={styles.outcomes}>
            <section className={`card ${styles.outcome} ${styles.outcomeWinner}`}>
              <div className="card-kicker" style={{ color: "var(--color-accent-2-800)" }}>
                BRRRR
              </div>
              <Num className={`stat ${styles.outcomeValue}`}>
                {money(Math.round(brrrr.cashLeftInDeal))}
              </Num>
              <p className={styles.outcomeNote}>
                מזומן שנשאר בעסקה ·{" "}
                <Num>{`${moneySigned(Math.round(brrrr.monthlyCashFlow))}/חודש`}</Num>
                {brrrr.cashOnCashPct !== null ? (
                  <>
                    {" · "}
                    <Num>CoC {percent(brrrr.cashOnCashPct)}</Num>
                  </>
                ) : null}
              </p>
            </section>

            <section className={`card ${styles.outcome}`}>
              <div className="card-kicker">Fix &amp; Flip</div>
              <Num className={`stat ${styles.outcomeValue}`}>
                {money(Math.round(flip.netProfit))}
              </Num>
              <p className={`text-muted ${styles.outcomeNote}`}>
                רווח נקי
                {flip.roiPct !== null ? (
                  <>
                    {" · "}
                    <Num>ROI {percent(flip.roiPct, 1)}</Num>
                  </>
                ) : null}
                {` · החזקה ${flip.holdMonths} חודשים`}
              </p>
            </section>
          </div>

          <Link href={`/properties/${property.id}/calculator`} className={styles.compareLink}>
            השוואה מלאה BRRRR מול Flip ›
          </Link>
        </div>
      </div>

      {/* ── mobile rehab summary + actions (2c) ── */}
      <MobileRehabCard property={property} />
    </div>
  );
}

function MobileRehabCard({ property }: { property: Property }) {
  const categories = property.rehabCategories;
  if (!categories) return null;

  const pct = rehabProgressPct(property);

  return (
    <div className={styles.mobileOnly}>
      <section className="card" style={{ padding: "14px 16px", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <b style={{ fontSize: 14 }}>שיפוץ</b>
          <Num style={{ fontSize: 12 }}>
            <b>{money(property.rehabSpent)}</b>{" "}
            <span className="text-muted">/ {money(property.rehabBudget)}</span>
          </Num>
        </div>
        <Meter
          value={pct}
          height={10}
          tone={pct > 100 ? "over" : "accent"}
          label={`שיפוץ: ${ratio(property.rehabSpent, property.rehabBudget)}`}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {categories.filter(isOverBudget).map((c) => (
            <Tag key={c.id} tone="accent">
              {c.name} <Num>{moneySigned(c.spent - c.budget)}</Num>
            </Tag>
          ))}
          {categories
            .filter((c) => c.spent >= c.budget && !isOverBudget(c))
            .map((c) => (
              <Tag key={c.id} tone="accent-2">
                {c.name} ✓
              </Tag>
            ))}
          {categories
            .filter((c) => c.spent === 0)
            .map((c) => (
              <Tag key={c.id} tone="neutral">
                {c.name} — טרם
              </Tag>
            ))}
        </div>
      </section>

      <div className={styles.mobileActions}>
        <Link href={`/properties/${property.id}/expenses`} className="btn btn-primary">
          <Icon name="camera" size={14} />
          צלם קבלה
        </Link>
        <Link href={`/properties/${property.id}/calculator`} className="btn btn-secondary">
          BRRRR / Flip
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  variant,
}: {
  label: React.ReactNode;
  value: string;
  note?: React.ReactNode;
  variant?: "arv" | "mao" | "profit";
}) {
  const variantClass =
    variant === "arv" ? styles.statArv : variant === "mao" ? styles.statMao : "";

  return (
    <div className={`${styles.stat} ${variantClass}`}>
      <div className={variant ? styles.statLabel : `text-muted ${styles.statLabel}`}>{label}</div>
      <Num
        className={styles.statValue}
        style={
          variant === "mao"
            ? { color: "var(--color-accent-800)" }
            : variant === "profit"
              ? { color: "var(--color-accent-2-700)" }
              : undefined
        }
      >
        {value}
      </Num>
      {note ? <div className={styles.statNote}>{note}</div> : null}
    </div>
  );
}

/**
 * The subtitle line, with its Latin runs braced for <RichText>. The city and
 * the square footage have to stay left-to-right; "3 חד'" and "נבנה 1924" are
 * Hebrew and belong in the surrounding flow.
 */
function describeProperty(property: Property): string {
  const parts: string[] = [
    `{${property.city}, ${property.state}${property.zip ? ` ${property.zip}` : ""}}`,
    property.isDuplex ? "דופלקס" : "בית פרטי",
  ];
  if (!property.isDuplex && property.beds !== undefined) {
    parts.push(`${property.beds} חד'`);
  }
  if (!property.isDuplex && property.baths !== undefined) {
    parts.push(`${property.baths} אמבט`);
  }
  parts.push(`{${sqft(property.sqft)}}`);
  if (property.yearBuilt) parts.push(`נבנה ${property.yearBuilt}`);
  return parts.join(" · ");
}


function financingDescription(property: Property): string {
  const { kind, ratePct, points } = property.financing;
  const label = financingLabels[kind];
  const detail = [
    ratePct !== undefined ? `${ratePct}%` : null,
    points !== undefined ? `${points} pts` : null,
  ].filter(Boolean);
  return detail.length > 0 ? `${label} · ${detail.join(" · ")}` : label;
}
