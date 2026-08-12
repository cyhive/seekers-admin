import { DashboardClient } from "@/components/admin/dashboard/dashboard-client";

export default function DashboardPage() {
  return (
    <>
      <h1 className="text-3xl font-headline font-bold animate-slide-in-up">
        Dashboard
      </h1>
      <DashboardClient />
    </>
  );
}
