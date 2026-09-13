"use client";

import { useState } from "react";

import { InfoTip } from "@/components/ui/InfoTip";
import { Num } from "@/components/ui/Num";
import type { Comparable, CompsAnalysis } from "@/data/types";
import {
  averagePricePerSqft,
  compPricePerSqft,
  compsInAverage,
  effectivePricePerSqft,
  hasOverride,
  medianPricePerSqft,
} from "@/lib/comps";
import { money, pricePerSqft, sqft as sqftLabel } from "@/lib/format";
import { compsGlossary } from "@/lib/glossary";

import styles from "./Comps.module.css";

/**
 * Where the comps sit on the $/SqFt axis.
 *
 * The average alone hides a wide spread — 188 Kendall Ave's comps run from
 * $151 to $228 — so this shows every comp as a dot against the rate the ARV is
 * actually taken at. It is the **emphasis** form: one rate in the accent, the
 * comps in de-emphasis gray, so nothing rests on telling two hues apart.
 *
 * Marks, not text, carry the colour; a comp left out of the average is hollow
 * rather than a different shade; and only the two extremes are labelled on the
 * axis — a number beside every dot is noise. Whatever the pointer is on is
 * named in one line underneath, so no tooltip can overflow the card's edge.
 * The comps table below is the accessible reading of the same data.
 */

/** How much of the track to leave past the outermost mark. */
const PAD = 0.08;

export function SpreadStrip({
  analysis,
  onToggle,
}: {
  analysis: CompsAnalysis;
  /** Clicking a dot sets that comp in or out of the average. */
  onToggle: (id: string, excluded: boolean) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const plotted = analysis.comps.filter((c) => compPricePerSqft(c) !== null);
  const rates = plotted.map((c) => compPricePerSqft(c) as number);
  const inAverage = compsInAverage(analysis);
  const average = effectivePricePerSqft(analysis);
  const median = medianPricePerSqft(analysis);

  if (plotted.length === 0) {
    return (
      <figure className={`card ${styles.strip}`}>
        <figcaption className={styles.stripHead}>
          <span className={styles.stripTitle}>
            פיזור <Num>$/SqFt</Num>
            <InfoTip id="strip-tip" text={compsGlossary.spread} label="פיזור המחיר לרגל רבוע" />
          </span>
        </figcaption>
        <p className={`text-muted ${styles.stripEmpty}`}>
          אין עדיין קומפ עם מחיר מכירה ושטח — הוסף אחד בטבלה ותראה אותו כאן.
        </p>
      </figure>
    );
  }

  // The domain holds every mark, so an override outside the comps' range is
  // still on the track rather than clipped off its end.
  const marks = [...rates, average, median].filter((v) => v > 0);
  const low = Math.min(...marks);
  const high = Math.max(...marks);
  const span = high - low || 1;
  const at = (value: number) => `${(PAD + ((value - low) / span) * (1 - 2 * PAD)) * 100}%`;

  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const averagePos = (average - low) / span;

  // A label centred under a mark near the edge would run off the track.
  const averageAlign =
    averagePos < 0.14 ? styles.avgLabelStart : averagePos > 0.86 ? styles.avgLabelEnd : "";

  // The median's label sits below the axis and the average's above it, so the
  // two can coincide — as they do on the Olancha tab — without colliding. It
  // is dropped only when it would land on top of an end label.
  const medianPos = (median - low) / span;
  const showMedianLabel = median > 0 && medianPos > 0.12 && medianPos < 0.88;

  const focus = hovered ? plotted.find((c) => c.id === hovered) : undefined;

  return (
    <figure className={`card ${styles.strip}`}>
      <figcaption className={styles.stripHead}>
        <span className={styles.stripTitle}>
          פיזור <Num>$/SqFt</Num> בקומפס
          <InfoTip id="strip-tip" text={compsGlossary.spread} label="פיזור המחיר לרגל רבוע" />
        </span>
        <span className="text-muted">
          <Num>{plotted.length}</Num> מתומחרים · <Num>{inAverage.length}</Num> בממוצע
        </span>
      </figcaption>

      <div className={styles.track}>
        <div className={styles.axis} />

        {median > 0 ? (
          <>
            <div className={styles.medianMark} style={{ left: at(median) }} />
            {showMedianLabel ? (
              <span className={styles.medianLabelMark} style={{ left: at(median) }}>
                חציון {pricePerSqft(median, 2)}
              </span>
            ) : null}
          </>
        ) : null}

        {/* Only the extremes are labelled — a number beside every dot is noise.
            They grow inward from their own dots so neither can run off. */}
        <span className={`${styles.end} ${styles.endMin}`} style={{ left: at(minRate) }}>
          {pricePerSqft(minRate, 2)}
        </span>
        <span className={`${styles.end} ${styles.endMax}`} style={{ left: at(maxRate) }}>
          {pricePerSqft(maxRate, 2)}
        </span>

        {plotted.map((comp) => {
          const rate = compPricePerSqft(comp) as number;
          const out = comp.excluded === true;
          return (
            <button
              key={comp.id}
              type="button"
              className={`${styles.dot} ${out ? styles.dotOut : ""}`}
              style={{ left: at(rate) }}
              onMouseEnter={() => setHovered(comp.id)}
              onMouseLeave={() => setHovered((id) => (id === comp.id ? null : id))}
              onFocus={() => setHovered(comp.id)}
              onBlur={() => setHovered((id) => (id === comp.id ? null : id))}
              onClick={() => onToggle(comp.id, !out)}
              aria-label={`${comp.address} — ${pricePerSqft(rate, 2)}. ${
                out ? "מחוץ לממוצע, לחץ כדי להחזיר" : "בממוצע, לחץ כדי להוציא"
              }`}
            />
          );
        })}

        {average > 0 ? (
          <>
            <div className={styles.avgMark} style={{ left: at(average) }} />
            <span className={`${styles.avgLabel} ${averageAlign}`} style={{ left: at(average) }}>
              {hasOverride(analysis) ? "שלך " : "ממוצע "}
              {pricePerSqft(average, 2)}
            </span>
          </>
        ) : null}
      </div>

      <p className={`text-muted ${styles.readout}`}>
        {focus ? <FocusLine comp={focus} /> : <Idle analysis={analysis} maxRate={maxRate} />}
      </p>
    </figure>
  );
}

/** What one comp is, while the pointer is on it. */
function FocusLine({ comp }: { comp: Comparable }) {
  const rate = compPricePerSqft(comp) as number;
  return (
    <>
      <span className={styles.readoutName}>
        <Num>{comp.address}</Num>
      </span>{" "}
      · <Num>{money(comp.salePrice ?? 0)}</Num> · <Num>{sqftLabel(comp.sqft)}</Num> ·{" "}
      <Num>{pricePerSqft(rate, 2)}</Num>
      {comp.excluded ? " · מחוץ לממוצע" : null}
    </>
  );
}

/** What the strip says when nothing is under the pointer. */
function Idle({ analysis, maxRate }: { analysis: CompsAnalysis; maxRate: number }) {
  const average = averagePricePerSqft(analysis);
  const median = medianPricePerSqft(analysis);
  const wide = average > 0 && Math.abs(median - average) / average > 0.05;
  return (
    <>
      הקומפס נעים עד <Num>{pricePerSqft(maxRate, 2)}</Num>. ממוצע{" "}
      <Num>{pricePerSqft(average, 2)}</Num>, חציון <Num>{pricePerSqft(median, 2)}</Num>
      {wide ? " — הפער ביניהם אומר שיש חריג שמושך את הממוצע." : "."} לחיצה על נקודה מוציאה את
      הקומפ מהממוצע או מחזירה אותו.
    </>
  );
}
