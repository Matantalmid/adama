import Link from "next/link";

import styles from "./ComingSoon.module.css";

/**
 * A property's routes are generated from the seed, not from the store, so
 * `/properties/<id>` still resolves after the property has been deleted on
 * this device. Without this the screen renders nothing inside full chrome,
 * which reads as a broken page rather than a deliberate one.
 */
export function MissingProperty({ empty }: { empty?: boolean }) {
  return (
    <div className={styles.page}>
      <div className={`card ${styles.card}`}>
        <h1 style={{ margin: 0, fontSize: 26 }}>{empty ? "אין נכסים" : "הנכס נמחק"}</h1>
        <p className="text-muted" style={{ margin: 0 }}>
          {empty
            ? "כל הנכסים נמחקו מהמכשיר הזה. \"אפס הכל\" מחזיר את נתוני הדוגמה."
            : "הנכס הזה כבר לא קיים במכשיר הזה. \"אפס הכל\" מחזיר את נתוני הדוגמה."}
        </p>
        <Link href="/properties" className="btn btn-primary">
          לרשימת הנכסים
        </Link>
      </div>
    </div>
  );
}
