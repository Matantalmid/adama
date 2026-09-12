import { CalculatorScreen } from "@/components/calculator/CalculatorScreen";
import { AppShell } from "@/components/layout/AppShell";

export const metadata = { title: "מחשבון BRRRR / Flip · אדמה" };

export default function CalculatorsPage() {
  return (
    <AppShell>
      <CalculatorScreen />
    </AppShell>
  );
}
