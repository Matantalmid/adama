import Link from "next/link";

import { DashboardScreen } from "@/components/dashboard/DashboardScreen";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/ui/Icon";

export default function DashboardPage() {
  return (
    <AppShell
      action={
        <Link href="/properties/new" className="btn btn-primary">
          <Icon name="plus" size={14} />
          נכס חדש
        </Link>
      }
    >
      <DashboardScreen />
    </AppShell>
  );
}
