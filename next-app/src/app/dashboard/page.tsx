import { AppLayout } from "@/components/app-layout";
import DashboardPage from "@/components/dashboard-page";

export const dynamic = "force-dynamic";

export default function DashboardRoute() {
  return (
    <AppLayout>
      <DashboardPage />
    </AppLayout>
  );
}
