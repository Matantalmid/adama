import type { ReactNode } from "react";

export type TagTone = "accent" | "accent-2" | "neutral" | "outline";

const toneClass: Record<TagTone, string> = {
  accent: "tag-accent",
  "accent-2": "tag-accent-2",
  neutral: "tag-neutral",
  outline: "tag-outline",
};

export function Tag({
  tone = "neutral",
  children,
  className,
  ...rest
}: {
  tone?: TagTone;
  children: ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={["tag", toneClass[tone], className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </span>
  );
}
