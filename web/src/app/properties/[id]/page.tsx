import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { PropertyScreen } from "@/components/property/PropertyScreen";
import { Icon } from "@/components/ui/Icon";
import { getProperty, properties } from "@/data/portfolio";

export function generateStaticParams() {
  return properties.map((property) => ({ id: property.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = getProperty(id);
  return { title: property ? `${property.address} · אדמה` : "נכס · אדמה" };
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = getProperty(id);

  if (!property) notFound();

  return (
    <AppShell
      action={
        <button type="button" className="btn btn-icon btn-secondary" aria-label="חיפוש">
          <Icon name="search" size={16} />
        </button>
      }
    >
      <PropertyScreen propertyId={property.id} />
    </AppShell>
  );
}
