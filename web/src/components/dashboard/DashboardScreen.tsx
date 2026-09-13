"use client";

import Link from "next/link";

import { MobilePropertyCard } from "@/components/dashboard/MobilePropertyCard";
import { PropertiesTable } from "@/components/dashboard/PropertiesTable";
import { Icon } from "@/components/ui/Icon";
import { Num } from "@/components/ui/Num";
import { RichText } from "@/components/ui/RichText";
import { Segmented } from "@/components/ui/Segmented";
import { Tag } from "@/components/ui/Tag";
import { attentionItems, portfolio } from "@/data/portfolio";
import { isRenovating } from "@/lib/deal";
import { money, moneyCompact, moneySigned, percent } from "@/lib/format";
import { useProperties } from "@/store/hooks";

import styles from "./Dashboard.module.css";

const ranges = [
  { value: "month", label: "החודש" },
  { value: "quarter", label: "רבעון" },
  { value: "year", label: "שנה" },
] as const;

/** Mockup 1a on desktop, 1c on a phone. Reads the property list from the store. */
export function DashboardScreen() {
  const properties = useProperties();
  const inRehab = properties.filter(isRenovating).length;
  const refinancing = properties.filter((p) => p.stage === "refinance").length;

  return (
    <div className={styles.page}>
        {/* ── header ── */}
        <div className={styles.header}>
          <div>
            <h1>בוקר טוב, יואב</h1>
            <p className={`text-muted ${styles.headerMeta}`}>
              {properties.length} נכסים · {inRehab} בשיפוץ · {refinancing} בריפיננס · ספטמבר 2026
            </p>
          </div>
          <Segmented options={ranges} defaultValue="month" ariaLabel="טווח זמן" />
        </div>

        <div className={styles.mobileHeader}>
          <div>
            <h1>בוקר טוב, יואב</h1>
            <div className="text-muted" style={{ fontSize: 13 }}>
              {properties.length} נכסים · {inRehab} בשיפוץ
            </div>
          </div>
          <span className={styles.avatar} aria-hidden="true">
            י
          </span>
        </div>

        {/* ── portfolio KPIs ── */}
        <div className={styles.kpis}>
          <Kpi label="שווי תיק · ARV" value={portfolio.arvLabel}>
            <Tag tone="accent-2">
              <Num>{`+${percent(portfolio.arvDeltaPct, 1)}`}</Num>
            </Tag>
            מול רבעון קודם
          </Kpi>

          <Kpi label="הון עצמי · Equity" value={portfolio.equityLabel}>
            <span>
              <Num>{`LTV`}</Num> ממוצע <Num>{percent(portfolio.averageLtvPct)}</Num>
            </span>
          </Kpi>

          <Kpi
            label="תזרים חודשי · Cash Flow"
            value={moneySigned(portfolio.monthlyCashFlow)}
            valueColor="var(--color-accent-2-700)"
          >
            {portfolio.rentedCount} נכסים מושכרים
          </Kpi>

          <Kpi
            label="הוצאות החודש"
            value={money(portfolio.monthExpenses)}
            valueColor="var(--color-accent-800)"
            accent
          >
            <Tag tone="accent">{portfolio.uncategorisedReceipts} קבלות ללא קטגוריה</Tag>
          </Kpi>
        </div>

        {/* ── mobile KPI rail (1c) ── */}
        <div className={styles.kpiRail}>
          <div className={`card ${styles.railCard}`}>
            <div className="card-kicker">ARV תיק</div>
            <Num className={`stat ${styles.railValue}`}>{portfolio.arvLabel}</Num>
            <div className="card-meta">
              <Num>{`+${percent(portfolio.arvDeltaPct, 1)}`}</Num>
            </div>
          </div>
          <div className={`card ${styles.railCard}`}>
            <div className="card-kicker">Cash Flow</div>
            <Num
              className={`stat ${styles.railValue}`}
              style={{ color: "var(--color-accent-2-700)" }}
            >
              {moneySigned(portfolio.monthlyCashFlow)}
            </Num>
            <div className="card-meta">לחודש</div>
          </div>
          <div className={`card ${styles.railCard} ${styles.kpiAccent}`}>
            <div className="card-kicker">הוצאות</div>
            <Num className={`stat ${styles.railValue}`}>
              {moneyCompact(portfolio.monthExpenses)}
            </Num>
          </div>
        </div>

        {/* ── mobile alert (1c) ── */}
        <Link href="/properties/elm-ave/expenses" className={styles.mobileAlert}>
          <Icon name="alert-triangle" size={18} />
          <span className={styles.mobileAlertText}>
            <b>חשמל חורג</b> ב-<Num>Elm Ave</Num> · <Num>+$350</Num>
          </span>
          <Icon name="chevron-left" size={14} />
        </Link>

        {/* ── properties ── */}
        <div className={styles.body}>
          <section className={`card ${styles.tableCard}`}>
            <div className={styles.tableHead}>
              <h2>הנכסים שלי</h2>
              <Link href="/properties" style={{ fontSize: 13 }}>
                כל הנכסים
              </Link>
            </div>
            <PropertiesTable properties={properties} />
          </section>

          <div className={styles.side}>
            <section className={`card ${styles.sideCard}`}>
              <div className={styles.sideTitle}>
                <Icon name="bell" size={16} style={{ color: "var(--color-accent)" }} />
                <h2>דורש תשומת לב</h2>
              </div>
              <ul className={styles.attentionList}>
                {attentionItems.map((item) => {
                  const property = item.propertyId
                    ? properties.find((p) => p.id === item.propertyId)
                    : undefined;
                  return (
                    <li key={item.id} className={styles.attentionItem}>
                      <span
                        className={item.urgent ? `${styles.dot} ${styles.dotUrgent}` : styles.dot}
                        aria-hidden="true"
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {item.title}
                          {property ? (
                            <>
                              {" — "}
                              <Num>{property.shortName}</Num>
                            </>
                          ) : null}
                        </div>
                        <div className="text-muted">
                          <RichText>{item.detail}</RichText>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className={`card ${styles.flipCard}`}>
              <div className="card-kicker" style={{ color: "var(--color-accent-2-800)" }}>
                Fix &amp; Flip · 2026
              </div>
              <Num className={`stat ${styles.flipValue}`}>{money(portfolio.flipProfitYtd)}</Num>
              <p className={styles.flipNote}>
                רווח ממומש + צפוי משתי עסקות · <Num>ROI</Num> ממוצע{" "}
                <Num>{percent(portfolio.flipAverageRoiPct, 1)}</Num>
              </p>
            </section>
          </div>
        </div>

        {/* ── mobile property list (1c) ── */}
        <section className={styles.mobileList}>
          <div className={styles.mobileListHead}>
            <h2>נכסים</h2>
            <Link href="/properties" style={{ fontSize: 13 }}>
              הכל
            </Link>
          </div>
          {properties
            .filter((p) => p.stage !== "sold")
            .map((property) => (
              <MobilePropertyCard key={property.id} property={property} />
            ))}
        </section>
      </div>
  );
}

function Kpi({
  label,
  value,
  valueColor,
  accent,
  children,
}: {
  label: string;
  value: string;
  valueColor?: string;
  accent?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`card ${styles.kpi}${accent ? ` ${styles.kpiAccent}` : ""}`}>
      <div className="card-kicker">{label}</div>
      <Num className={`stat ${styles.kpiValue}`} style={{ color: valueColor }}>
        {value}
      </Num>
      <div className="card-meta">{children}</div>
    </div>
  );
}
