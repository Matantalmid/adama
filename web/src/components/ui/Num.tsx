import type { ReactNode } from "react";

/**
 * Wraps a Latin run — money, a percentage, a street address — so the bidi
 * algorithm leaves it alone inside Hebrew text. Without the isolation
 * "4412 Elm Ave" renders as "Elm Ave 4412" and "+$1,204" loses its sign.
 *
 * Every number on every screen goes through this.
 */
export function Num({
  children,
  className,
  ...rest
}: {
  children: ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={className ? `num ${className}` : "num"} {...rest}>
      {children}
    </span>
  );
}
