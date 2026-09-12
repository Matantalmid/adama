"use client";

import { MobilePropertyCard } from "@/components/dashboard/MobilePropertyCard";
import { PropertiesTable } from "@/components/dashboard/PropertiesTable";
import { useProperties } from "@/store/hooks";

import styles from "./PropertiesScreen.module.css";

/** Every property in one place — where the dashboard's "כל הנכסים" link leads. */
export function PropertiesScreen() {
  const properties = useProperties();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>הנכסים שלי</h1>
        <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
          {properties.length} נכסים
        </p>
      </header>

      <section className={`card ${styles.tableCard}`}>
        <PropertiesTable properties={properties} />
      </section>

      <div className={styles.mobileList}>
        {properties.map((property) => (
          <MobilePropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
