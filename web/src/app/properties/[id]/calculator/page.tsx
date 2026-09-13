import { notFound } from "next/navigation";

import { CalculatorScreen } from "@/components/calculator/CalculatorScreen";
import { AppShell } from "@/components/layout/AppShell";
import { getProperty, properties } from "@/data/portfolio";

export function generateStaticParams() {
  return properties.map((property) => ({ id: property.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = getProperty(id);
  return { title: property ? `BRRRR / Flip · ${property.address}` : "מחשבון · אדמה" };
}

export default async function CalculatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = getProperty(id);

  if (!property) notFound();

  return (
    <AppShell>
      <CalculatorScreen propertyId={property.id} />
    </AppShell>
  );
}
