import Link from "next/link";

import { PropertiesScreen } from "@/components/dashboard/PropertiesScreen";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "נכסים · אדמה" };

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
      <PropertiesScreen />
    </AppShell>
  );
}
