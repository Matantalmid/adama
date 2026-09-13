import { CompsScreen } from "@/components/comps/CompsScreen";
import { AppShell } from "@/components/layout/AppShell";

export const metadata = { title: "ARV ו-Comps · אדמה" };

export default function ArvPage() {
  return (
    <AppShell>
      <CompsScreen />
    </AppShell>
  );
}
