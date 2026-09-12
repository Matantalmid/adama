import { Fragment } from "react";

import { Num } from "./Num";

/**
 * Renders a Hebrew string that has Latin or numeric runs braced in it —
 * "חמישי 18.9 · {$1,350} לחודש" — wrapping each braced run in <Num> so it
 * stays left-to-right.
 *
 * Copy in the data files marks these runs explicitly rather than having a
 * regex guess at them: "18.9" is a Hebrew date and belongs in the RTL flow,
 * while "$1,350" does not, and nothing in the characters themselves says which
 * is which.
 */
export function RichText({ children }: { children: string }) {
  const parts = children.split(/\{([^}]*)\}/g);

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <Num key={index}>{part}</Num>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
