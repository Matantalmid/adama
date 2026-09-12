import { notFound } from "next/navigation";

import { ExpensesScreen } from "@/components/expenses/ExpensesScreen";
import { AppShell } from "@/components/layout/AppShell";
import { expensesForProperty, getProperty, properties } from "@/data/portfolio";

export function generateStaticParams() {
  return properties.map((property) => ({ id: property.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = getProperty(id);
  return { title: property ? `הוצאות · ${property.address}` : "הוצאות · אדמה" };
}

export default async function ExpensesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = getProperty(id);

  if (!property) notFound();

  return (
    <AppShell>
      <ExpensesScreen property={property} expenses={expensesForProperty(property.id)} />
    </AppShell>
  );
}
