"use client";

import { OrderTable } from "@/components/admin/orders/order-table";
import { columns, Job } from "@/components/admin/orders/order-table-columns";
import { useEffect, useMemo, useState } from "react";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "unapplied">("all");

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      setActiveFilter("all");

      const res = await fetch("/api/jobs", { cache: "no-store" });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `Failed to fetch (status ${res.status})`);
      }

      const result = await res.json();
      const raw = Array.isArray(result) ? result : result?.data ?? [];
      setJobs(raw);
      setFilteredJobs(raw);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      setError(error instanceof Error ? error.message : "Unknown error fetching jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async (filter: "all" | "unapplied") => {
    setActiveFilter(filter);
    setError(null);

    if (filter === "all") {
      setFilteredJobs(jobs);
      return;
    }

    setFilterLoading(true);
    try {
      const res = await fetch("/api/jobs/unapplied", { cache: "no-store" });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      setFilteredJobs(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply filter");
    } finally {
      setFilterLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort((a, b) => {
      const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [filteredJobs]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 bg-background overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Jobs Directory</h2>
          <p className="text-muted-foreground">
            Displaying {sortedJobs.length} of {jobs.length} jobs.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          <button
            onClick={() => handleFilter("all")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            All Jobs
          </button>
          <button
            onClick={() => handleFilter("unapplied")}
            disabled={filterLoading}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              activeFilter === "unapplied"
                ? "bg-primary text-primary-foreground"
                : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {filterLoading ? "Loading..." : "Not Applied"}
          </button>

          {/* Refresh */}
          <button
            onClick={fetchJobs}
            className="rounded-md px-4 py-2 bg-primary text-white hover:bg-primary/90 text-sm transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Active filter info */}
      {activeFilter === "unapplied" && !filterLoading && (
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold">{sortedJobs.length}</span> job(s) with no applicants yet.
        </p>
      )}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          Loading jobs from database...
        </div>
      ) : (
        <OrderTable columns={columns} data={sortedJobs} />
      )}
    </div>
  );
}