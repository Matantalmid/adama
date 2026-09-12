import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";

import DashboardPage from "@/app/page";
import PropertiesPage from "@/app/properties/page";
import ArvPage from "@/app/arv/page";
import CalculatorsPage from "@/app/calculators/page";
import ComparePage from "@/app/compare/page";
import MorePage from "@/app/more/page";
import NewPropertyPage from "@/app/properties/new/page";

import { CalculatorScreen } from "@/components/calculator/CalculatorScreen";
import { ExpensesScreen } from "@/components/expenses/ExpensesScreen";
import { AppShell } from "@/components/layout/AppShell";
import { PropertyScreen } from "@/components/property/PropertyScreen";
import { Icon } from "@/components/ui/Icon";
import { getProperty } from "@/data/portfolio";

import { currentPath } from "./shims/navigation";
import "@/app/globals.css";

/**
 * Static preview of the app: the same screens and components, with the App
 * Router replaced by hash routing so the whole thing can be served as one
 * file. Nothing here ships — `npm run dev` runs the real Next.js app.
 */
function Router() {
  const [path, setPath] = useState(() => currentPath());

  useEffect(() => {
    const onChange = () => {
      setPath(currentPath());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const expenseMatch = path.match(/^\/properties\/([^/]+)\/expenses$/);
  if (expenseMatch) {
    const property = getProperty(expenseMatch[1]);
    if (property) {
      return (
        <AppShell>
          <ExpensesScreen propertyId={property.id} />
        </AppShell>
      );
    }
  }

  const calcMatch = path.match(/^\/properties\/([^/]+)\/calculator$/);
  if (calcMatch) {
    const property = getProperty(calcMatch[1]);
    if (property) {
      return (
        <AppShell>
          <CalculatorScreen propertyId={property.id} />
        </AppShell>
      );
    }
  }

  const propertyMatch = path.match(/^\/properties\/([^/]+)$/);
  if (propertyMatch && propertyMatch[1] !== "new") {
    const property = getProperty(propertyMatch[1]);
    if (property) {
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
  }

  switch (path) {
    case "/properties":
      return <PropertiesPage />;
    case "/properties/new":
      return <NewPropertyPage />;
    case "/calculators":
      return <CalculatorsPage />;
    case "/compare":
      return <ComparePage />;
    case "/arv":
      return <ArvPage />;
    case "/more":
      return <MorePage />;
    default:
      return <DashboardPage />;
  }
}

const container = document.getElementById("root");
if (container) createRoot(container).render(<Router />);
