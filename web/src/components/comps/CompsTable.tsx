"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { InfoTip } from "@/components/ui/InfoTip";
import { Num } from "@/components/ui/Num";
import type { Comparable, CompCondition, CompsAnalysis, CompStatus } from "@/data/types";
import {
  averagePricePerSqft,
  compPricePerSqft,
  compsInAverage,
  emptyComp,
  medianSalePrice,
  pricedComps,
} from "@/lib/comps";
import { money, pricePerSqft, shortDate } from "@/lib/format";
import {
  compStatusLabels,
  conditionLabels,
  conditionOrder,
  garageLabels,
} from "@/lib/labels";
import { compsGlossary } from "@/lib/glossary";

import styles from "./Comps.module.css";

/**
 * The comparable sales, editable in place.
 *
 * The sheet's tabs carry fifteen columns. Eight of them decide whether a comp
 * is comparable at all and stay in the table; the rest — lot, parking, garage,
 * year, DOM, distance, status — open per row, so the table is readable at the
 * width the app is designed for. The pattern is the properties table's:
 * one table above 899px, a list of cards below it.
 */

const statuses: CompStatus[] = ["sold", "pending", "active"];

export function CompsTable({
  analysis,
  onChange,
}: {
  analysis: CompsAnalysis;
  onChange: (next: CompsAnalysis) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);

  const comps = analysis.comps;
  const setComps = (next: Comparable[]) => onChange({ ...analysis, comps: next });
  const patch = (id: string, part: Partial<Comparable>) =>
    setComps(comps.map((c) => (c.id === id ? { ...c, ...part } : c)));
  const remove = (id: string) => setComps(comps.filter((c) => c.id !== id));
  const add = () => {
    const comp = emptyComp(`c-${Date.now()}`);
    setComps([...comps, comp]);
    setOpen(comp.id);
  };

  const average = averagePricePerSqft(analysis);
  const median = medianSalePrice(analysis);
  const priced = pricedComps(analysis).length;
  const counted = compsInAverage(analysis).length;

  return (
    <>
      <section className={`card ${styles.tableCard}`}>
        <div className={styles.scroll}>
          <table className="table" style={{ fontSize: 13.5 }}>
            <thead>
              <tr>
                <th style={{ width: 300 }}>כתובת</th>
                <th style={{ width: 76 }}>שינה/רחצה</th>
                <th style={{ width: 92, textAlign: "left" }}>
                  <Num>SqFt</Num>
                </th>
                <th style={{ width: 116, textAlign: "left" }}>מחיר מכירה</th>
                <th style={{ width: 96, textAlign: "left" }}>
                  <Num>$/SqFt</Num>
                </th>
                <th style={{ width: 84 }}>תאריך</th>
                <th style={{ width: 140 }}>מצב</th>
                <th style={{ width: 70 }}>
                  <span className={styles.medianLabel}>
                    בממוצע
                    <InfoTip
                      id="th-included-tip"
                      text={compsGlossary.compExcluded}
                      label="בממוצע"
                      align="end"
                    />
                  </span>
                </th>
                <th style={{ width: 96 }} />
              </tr>
            </thead>
            <tbody>
              {comps.length === 0 ? (
                <tr>
                  <td colSpan={9} className={`text-muted ${styles.empty}`}>
                    אין עדיין קומפס. &quot;+ קומפ&quot; מוסיף שורה ריקה.
                  </td>
                </tr>
              ) : null}
              {comps.map((comp) => {
                const rate = compPricePerSqft(comp);
                const out = comp.excluded === true;
                const expanded = open === comp.id;
                return [
                  <tr key={comp.id} className={out ? styles.rowOut : undefined}>
                    <td>
                      <input
                        className={`${styles.cellInput} ${styles.cellAddress}`}
                        aria-label="כתובת הקומפ"
                        placeholder="Street, City, ST"
                        value={comp.address}
                        onChange={(e) => patch(comp.id, { address: e.target.value })}
                      />
                    </td>
                    <td>
                      <UnitCell comp={comp} onPatch={patch} />
                    </td>
                    <td>
                      <NumCell
                        label="שטח מבנה"
                        value={comp.sqft}
                        onChange={(v) => patch(comp.id, { sqft: v })}
                      />
                    </td>
                    <td>
                      <NumCell
                        label="מחיר מכירה"
                        value={comp.salePrice}
                        onChange={(v) => patch(comp.id, { salePrice: v })}
                      />
                    </td>
                    <td className="num">
                      {rate === null ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <Num>{pricePerSqft(rate, 2)}</Num>
                      )}
                    </td>
                    <td>
                      <input
                        className={`${styles.cellInput} ${styles.cellNum}`}
                        aria-label="תאריך מכירה"
                        type="date"
                        value={comp.saleDate ?? ""}
                        onChange={(e) => patch(comp.id, { saleDate: e.target.value || undefined })}
                      />
                    </td>
                    <td>
                      <ConditionCell comp={comp} onPatch={patch} />
                    </td>
                    <td className={styles.include}>
                      <input
                        type="checkbox"
                        checked={!out}
                        aria-label={`${comp.address || "קומפ"} — כלול בממוצע`}
                        onChange={(e) => patch(comp.id, { excluded: !e.target.checked })}
                      />
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.detailToggle}
                          aria-expanded={expanded}
                          onClick={() => setOpen(expanded ? null : comp.id)}
                        >
                          {expanded ? "פחות" : "עוד"}
                        </button>
                        <button
                          type="button"
                          className={styles.remove}
                          aria-label={`הסר ${comp.address || "קומפ"}`}
                          onClick={() => remove(comp.id)}
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>,
                  expanded ? (
                    <tr key={`${comp.id}-detail`} className={styles.detailRow}>
                      <td colSpan={9}>
                        <Detail comp={comp} onPatch={patch} />
                      </td>
                    </tr>
                  ) : null,
                ];
              })}
            </tbody>
            {priced > 0 ? (
              <tfoot>
                <tr className={styles.footRow}>
                  <td colSpan={4} style={{ textAlign: "right" }}>
                    <span className="text-muted">חציון מחירי קומפס</span>{" "}
                    <Num>{money(median)}</Num>
                  </td>
                  <td className="num">
                    <Num>{pricePerSqft(average, 2)}</Num>
                  </td>
                  <td colSpan={4} className="text-muted" style={{ fontWeight: 400 }}>
                    ממוצע <Num>{counted}</Num> מתוך <Num>{priced}</Num> מתומחרים
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>

        <div className={styles.tableActions}>
          <button type="button" className={`btn btn-secondary ${styles.addComp}`} onClick={add}>
            <Icon name="plus" size={13} />
            קומפ
          </button>
          <span className="text-muted" style={{ fontSize: 12 }}>
            &quot;עוד&quot; פותח מגרש, חניה, גראז&apos;, שנה, <Num>DOM</Num> ומרחק.
          </span>
        </div>
      </section>

      <div className={styles.mobileList}>
        {comps.map((comp) => (
          <MobileComp key={comp.id} comp={comp} onPatch={patch} onRemove={remove} />
        ))}
        <button type="button" className={`btn btn-secondary ${styles.addComp}`} onClick={add}>
          <Icon name="plus" size={13} />
          קומפ
        </button>
      </div>
    </>
  );
}

type Patch = (id: string, part: Partial<Comparable>) => void;

const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/**
 * A number that may legitimately be absent: empty means "not recorded".
 * Shows thousands separators while idle — a comps table is read far more often
 * than it is typed — and the raw digits while it is being edited.
 */
function NumCell({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  const [editing, setEditing] = useState(false);
  const shown =
    value === undefined || value === 0 ? "" : editing ? String(value) : grouped.format(value);
  return (
    <input
      className={`${styles.cellInput} ${styles.cellNum}`}
      aria-label={label}
      inputMode="decimal"
      dir="ltr"
      placeholder="—"
      value={shown}
      onFocus={(event) => {
        setEditing(true);
        event.target.select();
      }}
      onBlur={() => setEditing(false)}
      onChange={(event) => {
        const raw = event.target.value.replace(/[^\d.]/g, "");
        if (raw === "") return onChange(undefined);
        const parsed = Number(raw);
        onChange(Number.isNaN(parsed) ? undefined : parsed);
      }}
    />
  );
}

function UnitCell({ comp, onPatch }: { comp: Comparable; onPatch: Patch }) {
  return (
    <span className={styles.unitCell}>
      <input
        className={`${styles.cellInput} ${styles.cellNum}`}
        style={{ width: 30 }}
        aria-label="חדרי שינה"
        inputMode="numeric"
        placeholder="—"
        value={comp.beds ?? ""}
        onChange={(e) => onPatch(comp.id, { beds: numberOrUndefined(e.target.value) })}
      />
      <span className="text-muted">/</span>
      <input
        className={`${styles.cellInput} ${styles.cellNum}`}
        style={{ width: 30 }}
        aria-label="חדרי רחצה"
        inputMode="numeric"
        placeholder="—"
        value={comp.baths ?? ""}
        onChange={(e) => onPatch(comp.id, { baths: numberOrUndefined(e.target.value) })}
      />
    </span>
  );
}

function ConditionCell({ comp, onPatch }: { comp: Comparable; onPatch: Patch }) {
  return (
    <select
      className={styles.cellSelect}
      aria-label="רמת שיפוץ"
      value={comp.condition ?? ""}
      onChange={(e) =>
        onPatch(comp.id, { condition: (e.target.value || undefined) as CompCondition | undefined })
      }
    >
      <option value="">—</option>
      {conditionOrder.map((key) => (
        <option key={key} value={key}>
          {conditionLabels[key]}
        </option>
      ))}
    </select>
  );
}

/** The seven fields that do not decide comparability at a glance. */
function Detail({ comp, onPatch }: { comp: Comparable; onPatch: Patch }) {
  return (
    <dl className={styles.detailGrid}>
      <span className={styles.detailPair}>
        <dt>מגרש</dt>
        <dd>
          <NumCell
            label="שטח מגרש"
            value={comp.lotSqft}
            onChange={(v) => onPatch(comp.id, { lotSqft: v })}
          />
        </dd>
      </span>
      <span className={styles.detailPair}>
        <dt>חניה</dt>
        <dd>
          <NumCell
            label="מקומות חניה"
            value={comp.parking}
            onChange={(v) => onPatch(comp.id, { parking: v })}
          />
        </dd>
      </span>
      <span className={styles.detailPair}>
        <dt>גראז&apos;</dt>
        <dd>
          <select
            className={styles.cellSelect}
            aria-label="סוג גראז'"
            value={comp.garage ?? ""}
            onChange={(e) =>
              onPatch(comp.id, {
                garage: (e.target.value || undefined) as Comparable["garage"],
              })
            }
          >
            <option value="">—</option>
            {(Object.keys(garageLabels) as (keyof typeof garageLabels)[]).map((key) => (
              <option key={key} value={key}>
                {garageLabels[key]}
              </option>
            ))}
          </select>
        </dd>
      </span>
      <span className={styles.detailPair}>
        <dt>שנת בנייה</dt>
        <dd>
          <NumCell
            label="שנת בנייה"
            value={comp.yearBuilt}
            onChange={(v) => onPatch(comp.id, { yearBuilt: v })}
          />
        </dd>
      </span>
      <span className={styles.detailPair}>
        <dt>
          <Num>DOM</Num>
        </dt>
        <dd>
          <NumCell
            label="ימים בשוק"
            value={comp.domDays}
            onChange={(v) => onPatch(comp.id, { domDays: v })}
          />
        </dd>
      </span>
      <span className={styles.detailPair}>
        <dt>מרחק</dt>
        <dd>
          <NumCell
            label="מרחק במיילים"
            value={comp.distanceMi}
            onChange={(v) => onPatch(comp.id, { distanceMi: v })}
          />
        </dd>
      </span>
      <span className={styles.detailPair}>
        <dt>סטטוס</dt>
        <dd>
          <select
            className={styles.cellSelect}
            aria-label="סטטוס העסקה"
            value={comp.status}
            onChange={(e) => onPatch(comp.id, { status: e.target.value as CompStatus })}
          >
            {statuses.map((key) => (
              <option key={key} value={key}>
                {compStatusLabels[key]}
              </option>
            ))}
          </select>
        </dd>
      </span>
    </dl>
  );
}

/** One comp on a phone: the same fields, stacked. */
function MobileComp({
  comp,
  onPatch,
  onRemove,
}: {
  comp: Comparable;
  onPatch: Patch;
  onRemove: (id: string) => void;
}) {
  const rate = compPricePerSqft(comp);
  const out = comp.excluded === true;
  return (
    <article className={`card ${styles.compCard}`}>
      <div className={styles.compHead}>
        <input
          className={`${styles.cellInput} ${styles.cellAddress}`}
          aria-label="כתובת הקומפ"
          placeholder="Street, City, ST"
          value={comp.address}
          onChange={(e) => onPatch(comp.id, { address: e.target.value })}
        />
        <Num style={{ fontWeight: 700 }}>{rate === null ? "—" : pricePerSqft(rate, 2)}</Num>
      </div>
      <div className={`text-muted ${styles.compMeta}`}>
        <span className={styles.detailPair}>
          מחיר{" "}
          <NumCell
            label="מחיר מכירה"
            value={comp.salePrice}
            onChange={(v) => onPatch(comp.id, { salePrice: v })}
          />
        </span>
        <span className={styles.detailPair}>
          <Num>SqFt</Num>{" "}
          <NumCell label="שטח מבנה" value={comp.sqft} onChange={(v) => onPatch(comp.id, { sqft: v })} />
        </span>
        <span className={styles.detailPair}>
          {comp.beds ?? "—"}/{comp.baths ?? "—"} חדרים
        </span>
        {comp.saleDate ? (
          <span className={styles.detailPair}>
            נמכר <Num>{shortDate(comp.saleDate)}</Num>
          </span>
        ) : null}
        {comp.condition ? <span>{conditionLabels[comp.condition]}</span> : null}
      </div>
      <div className={styles.compFoot}>
        <label className={styles.compToggle}>
          <input
            type="checkbox"
            checked={!out}
            onChange={(e) => onPatch(comp.id, { excluded: !e.target.checked })}
          />
          כלול בממוצע
        </label>
        <button
          type="button"
          className={styles.remove}
          aria-label={`הסר ${comp.address || "קומפ"}`}
          onClick={() => onRemove(comp.id)}
        >
          ×
        </button>
      </div>
    </article>
  );
}

function numberOrUndefined(raw: string): number | undefined {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (cleaned === "") return undefined;
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? undefined : parsed;
}
