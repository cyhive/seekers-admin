import { StatsCards } from '@/components/admin/dashboard/stats-cards';
import { SalesChart } from '@/components/admin/dashboard/sales-chart';
import { RecentOrders } from '@/components/admin/dashboard/recent-orders';

export default function DashboardPage() {
  return (
    <>
      <h1 className="text-3xl font-headline font-bold animate-slide-in-up">Dashboard</h1>
      <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <StatsCards />
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <div className="xl:col-span-2">
                <SalesChart />
            </div>
          <RecentOrders />
        </div>
      </div>
    </>
  );
}
