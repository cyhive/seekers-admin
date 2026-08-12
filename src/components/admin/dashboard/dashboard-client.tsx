"use client";

import { useEffect, useState } from "react";
import { Briefcase, DollarSign, FolderOpen, Users } from "lucide-react";
import { SalesChart } from "@/components/admin/dashboard/sales-chart";
import { RecentOrders } from "@/components/admin/dashboard/recent-orders";

export type DashboardStats = {
  totalJobs: number;
  openJobs: number;
  pendingApprovals: number;
  totalCustomers: number;
  totalRevenue: number;
  paidPayments: number;
  jobsThisMonth: number;
  monthlyJobs: Array<{ name: string; total: number }>;
  recentJobs: Array<{
    id: string;
    title: string;
    postedByName: string;
    phoneNumber: string;
    status: string;
    estimatedAmount: number | null;
    createdAt: string | null;
  }>;
  changes: {
    jobs: string;
    customers: string;
    revenue: string;
    openJobs: string;
  };
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const StatCard = ({
  title,
  value,
  change,
  icon,
  delay,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  delay: string;
}) => (
  <div
    className="rounded-lg border bg-card text-card-foreground shadow-sm glassmorphism animate-slide-in-up"
    style={{ animationDelay: delay }}
  >
    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
      <h3 className="text-sm font-medium tracking-tight">{title}</h3>
      {icon}
    </div>
    <div className="p-6 pt-0">
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{change}</p>
    </div>
  </div>
);

export function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await fetch("/api/dashboard", { cache: "no-store" });
        const result = await res.json();
        if (!res.ok || result?.success === false) {
          throw new Error(result?.message || "Failed to load dashboard");
        }
        setStats(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        Loading live dashboard data...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/5 px-4 py-2 text-sm text-destructive">
        {error || "Failed to load dashboard"}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          change={stats.changes.revenue}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          delay="100ms"
        />
        <StatCard
          title="Customers"
          value={String(stats.totalCustomers)}
          change={stats.changes.customers}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          delay="200ms"
        />
        <StatCard
          title="Total Jobs"
          value={String(stats.totalJobs)}
          change={stats.changes.jobs}
          icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
          delay="300ms"
        />
        <StatCard
          title="Open Jobs"
          value={String(stats.openJobs)}
          change={stats.changes.openJobs}
          icon={<FolderOpen className="h-4 w-4 text-muted-foreground" />}
          delay="400ms"
        />
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesChart data={stats.monthlyJobs} />
        </div>
        <RecentOrders jobs={stats.recentJobs} />
      </div>
    </div>
  );
}
