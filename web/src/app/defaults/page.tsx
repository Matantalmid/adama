import { DefaultsScreen } from "@/components/calculator/DefaultsScreen";
import { AppShell } from "@/components/layout/AppShell";

export const metadata = { title: "ברירות מחדל · אדמה" };

export default function DefaultsPage() {
  return (
    <AppShell>
      <DefaultsScreen />
    </AppShell>
  );
}
