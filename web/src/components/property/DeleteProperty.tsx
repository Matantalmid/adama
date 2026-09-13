"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Num } from "@/components/ui/Num";
import type { Property } from "@/data/types";
import { actions } from "@/store";
import { useExpenses } from "@/store/hooks";

/**
 * Deleting a property, from wherever it is reached — the property page's
 * header, the phone's "עוד פעולות", a row of the properties list. One dialog,
 * one action, so the question reads the same everywhere.
 *
 * The deletion is local: the seed is still the source of truth, so
 * "אפס הכל" or a store-version bump brings the property back.
 */

/**
 * The code that has to be typed before a property goes.
 *
 * This is a guard against a misclick, **not** a security control: it is a
 * constant in the client bundle and anyone who opens devtools can read it.
 * It makes the deletion deliberate, which is what it is for.
 */
export const DELETE_CONFIRMATION_CODE = "117812";

export function DeleteProperty({
  property,
  /** Where to go afterwards. Omit to stay put — the list, where the row goes. */
  redirectTo,
  children,
  className = "btn btn-secondary btn-danger",
  label,
}: {
  property: Property;
  redirectTo?: string;
  /** The trigger's contents — a word, an icon, or both. */
  children: ReactNode;
  className?: string;
  /** An accessible name, for a trigger that is an icon alone. */
  label?: string;
}) {
  const [asking, setAsking] = useState(false);
  const expenses = useExpenses(property.id);
  const router = useRouter();

  function remove() {
    actions.deleteProperty(property.id);
    setAsking(false);
    if (redirectTo) router.push(redirectTo);
  }

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={label}
        onClick={() => setAsking(true)}
      >
        {children}
      </button>

      {asking ? (
        <ConfirmDialog
          title={`מחיקת ${property.address}`}
          confirmLabel="מחק נכס"
          code={DELETE_CONFIRMATION_CODE}
          onConfirm={remove}
          onCancel={() => setAsking(false)}
        >
          <p style={{ margin: 0 }}>
            <Num>{property.address}</Num>, ההנחות שלו, ניתוח הקומפס
            {expenses.length > 0 ? (
              <>
                {" "}
                ו‑<Num>{expenses.length}</Num> ההוצאות שלו
              </>
            ) : null}{" "}
            יימחקו מהמכשיר הזה. אי אפשר לבטל.
          </p>
          <p style={{ margin: "8px 0 0" }}>הקלד את קוד האישור כדי להמשיך.</p>
        </ConfirmDialog>
      ) : null}
    </>
  );
}
