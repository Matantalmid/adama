import { notFound } from "next/navigation";

import { CompsScreen } from "@/components/comps/CompsScreen";
import { AppShell } from "@/components/layout/AppShell";
import { getProperty, properties } from "@/data/portfolio";

export function generateStaticParams() {
  return properties.map((property) => ({ id: property.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = getProperty(id);
  return { title: property ? `Comps & ARV · ${property.address}` : "Comps ו-ARV · אדמה" };
}

export default async function ArvPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = getProperty(id);

  if (!property) notFound();

  return (
    <AppShell>
      <CompsScreen propertyId={property.id} />
    </AppShell>
  );
}
