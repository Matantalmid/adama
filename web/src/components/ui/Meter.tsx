import { percent } from "@/lib/format";

/**
 * Budget-vs-actual bar. The fill is capped at 100% and an overrun is shown by
 * colour instead of by width — a bar that ran past its track reads as a layout
 * bug, not as a signal.
 */
export function Meter({
  value,
  tone = "accent",
  height = 8,
  label,
}: {
  /** 0–100. Values above 100 fill the track and take the "over" colour. */
  value: number;
  tone?: "accent" | "over" | "done";
  height?: number;
  /** Accessible description, e.g. "חשמל: 5,150 מתוך 4,800". */
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(value, 100));
  const toneClass = tone === "over" ? " meter-over" : tone === "done" ? " meter-done" : "";

  return (
    <div
      className={`meter${toneClass}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      aria-valuetext={label ?? percent(value)}
    >
      <span style={{ width: `${clamped}%` }} />
    </div>
  );
}
