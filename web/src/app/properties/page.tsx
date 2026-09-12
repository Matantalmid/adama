import Link from "next/link";

import { MobilePropertyCard } from "@/components/dashboard/MobilePropertyCard";
import { PropertiesTable } from "@/components/dashboard/PropertiesTable";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/ui/Icon";
import { properties } from "@/data/portfolio";

import styles from "./properties.module.css";

export const metadata = { title: "נכסים · אדמה" };

/**
 * Every property in one place — where the dashboard's "כל הנכסים" link leads.
 * Same table as the dashboard, without the KPI header above it.
 */
export default function PropertiesPage() {
  return (
    <AppShell
      action={
        <Link href="/properties/new" className="btn btn-primary">
          <Icon name="plus" size={14} />
          נכס חדש
        </Link>
      }
    >
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
    </AppShell>
  );
}
