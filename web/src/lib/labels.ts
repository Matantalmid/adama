import type { CompCondition, CompStatus, GarageKind, PropertyStage, Strategy } from "@/data/types";

type TagTone = "accent" | "accent-2" | "neutral" | "outline";

export const stageLabels: Record<PropertyStage, { label: string; tone: TagTone }> = {
  "under-contract": { label: "בחוזה", tone: "neutral" },
  rehab: { label: "בשיפוץ", tone: "accent" },
  listed: { label: "רשום למכירה", tone: "neutral" },
  rented: { label: "מושכר", tone: "accent-2" },
  refinance: { label: "ריפיננס", tone: "outline" },
  sold: { label: "נמכר", tone: "accent-2" },
};

/** Full form for tables and headers. */
export const strategyLabels: Record<Strategy, string> = {
  BRRRR: "BRRRR",
  FLIP: "Fix & Flip",
  UNDECIDED: "—",
};

/** Short form for the places a tag has to stay narrow. */
export const strategyShortLabels: Record<Strategy, string> = {
  BRRRR: "BRRRR",
  FLIP: "Flip",
  UNDECIDED: "—",
};

export const financingLabels = {
  "hard-money": "Hard money",
  conventional: "משכנתא קונבנציונלית",
  dscr: "DSCR",
  cash: "מזומן בלבד",
} as const;

/** The comps sheet's own four finish levels, in the order it lists them. */
export const conditionLabels: Record<CompCondition, string> = {
  turnkey: "משופץ קומפלט",
  top: "משופץ יוקרתי",
  full: "משופץ מלא",
  partial: "משופץ חלקי",
};

export const conditionOrder: CompCondition[] = ["turnkey", "top", "full", "partial"];

export const compStatusLabels: Record<CompStatus, string> = {
  sold: "נמכר",
  pending: "בתהליך",
  active: "בשוק",
};

export const garageLabels: Record<GarageKind, string> = {
  none: "ללא גראז'",
  one: "גראז' ל-1 רכב",
  two: "גראז' ל-2 רכבים",
};
