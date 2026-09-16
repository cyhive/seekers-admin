"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, UserCheck } from "lucide-react";

type CompletedWorker = {
  workerPhone: string;
  phoneKey: string;
  workerName: string;
  profession: string;
  completedJobsCount: number;
  latestCompletedAt: string | null;
};

type CompletedJob = {
  id: string;
  title: string;
  details: string;
  category: string;
  jobDate: string;
  jobTime: string;
  address: string;
  postedByName: string;
  posterPhone: string;
  approvalStatus: string;
  status: string;
  estimatedAmount: number | null;
  platformFeePercent: number | null;
  workerPayoutAmount: number | null;
  paymentStatus: string | null;
  paymentLink: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  completedAt: string | null;
};

const formatDate = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatCurrency = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const JobDetailCard = ({
  job,
  index,
  expanded,
  onToggle,
}: {
  job: CompletedJob;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) => (
  <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40"
    >
      <div>
        <p className="font-semibold">
          {index + 1}. {job.title}
        </p>
        <p className="text-sm text-muted-foreground">
          {job.category || "No category"} · Completed {formatDate(job.completedAt)}
        </p>
      </div>
      {expanded ? (
        <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </button>

    {expanded && (
      <div className="border-t px-4 py-4 space-y-3 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Job details:</span>{" "}
            {job.details || "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Job date:</span>{" "}
            {job.jobDate || "-"}
            {job.jobTime ? ` · ${job.jobTime}` : ""}
          </p>
          <p>
            <span className="text-muted-foreground">Posted by:</span>{" "}
            {job.postedByName || "-"}
            {job.posterPhone ? ` · ${job.posterPhone}` : ""}
          </p>
          <p>
            <span className="text-muted-foreground">Address:</span>{" "}
            {job.address || "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Estimate:</span>{" "}
            {formatCurrency(job.estimatedAmount)}
          </p>
          <p>
            <span className="text-muted-foreground">Platform fee:</span>{" "}
            {job.platformFeePercent !== null ? `${job.platformFeePercent}%` : "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Worker payout:</span>{" "}
            {formatCurrency(job.workerPayoutAmount)}
          </p>
          <p>
            <span className="text-muted-foreground">Payment status:</span>{" "}
            <span className="font-medium capitalize">
              {job.paymentStatus || "-"}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Approval:</span>{" "}
            {job.approvalStatus || "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Created:</span>{" "}
            {formatDate(job.createdAt)}
          </p>
        </div>
        {job.paymentLink && (
          <a
            href={job.paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-blue-600 hover:underline break-all"
          >
            Payment link
          </a>
        )}
      </div>
    )}
  </div>
);

export default function CompletedWorkersPage() {
  const [workers, setWorkers] = useState<CompletedWorker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<CompletedWorker | null>(
    null
  );
  const [jobs, setJobs] = useState<CompletedJob[]>([]);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkers = async () => {
      try {
        setLoadingWorkers(true);
        setError(null);
        const res = await fetch("/api/workers/completed", { cache: "no-store" });
        const result = await res.json();
        if (!res.ok || result?.success === false) {
          throw new Error(result?.message || "Failed to load completed workers");
        }
        setWorkers(result.data ?? []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load completed workers"
        );
      } finally {
        setLoadingWorkers(false);
      }
    };

    loadWorkers();
  }, []);

  const handleSelectWorker = async (worker: CompletedWorker) => {
    setSelectedWorker(worker);
    setExpandedJobId(null);
    setLoadingJobs(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/workers/completed/${encodeURIComponent(worker.phoneKey)}/jobs`,
        { cache: "no-store" }
      );
      const result = await res.json();
      if (!res.ok || result?.success === false) {
        throw new Error(result?.message || "Failed to load worker jobs");
      }
      setJobs(result.data?.jobs ?? []);
    } catch (err) {
      setJobs([]);
      setError(
        err instanceof Error ? err.message : "Failed to load worker jobs"
      );
    } finally {
      setLoadingJobs(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 bg-background overflow-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-primary" />
          Completed Job Workers
        </h2>
        <p className="text-muted-foreground">
          Workers who completed jobs. Select a worker to see every completed job
          and its details.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3 font-semibold">
            Workers ({workers.length})
          </div>
          <div className="max-h-[70vh] overflow-auto p-2 space-y-2">
            {loadingWorkers ? (
              <p className="p-4 text-sm text-muted-foreground">Loading workers...</p>
            ) : workers.length ? (
              workers.map((worker) => {
                const isSelected =
                  selectedWorker?.phoneKey === worker.phoneKey;

                return (
                  <button
                    key={worker.phoneKey}
                    type="button"
                    onClick={() => handleSelectWorker(worker)}
                    className={`w-full rounded-md border px-3 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <p className="font-medium">{worker.workerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {worker.profession || "Worker"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {worker.workerPhone}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-green-600">
                      {worker.completedJobsCount} completed job
                      {worker.completedJobsCount === 1 ? "" : "s"}
                    </p>
                  </button>
                );
              })
            ) : (
              <p className="p-4 text-sm text-muted-foreground">
                No workers with completed jobs yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card min-h-[400px]">
          {!selectedWorker ? (
            <div className="flex h-full min-h-[400px] items-center justify-center p-6 text-muted-foreground">
              Select a worker to view completed jobs.
            </div>
          ) : (
            <>
              <div className="border-b px-4 py-4">
                <h3 className="text-lg font-semibold">
                  {selectedWorker.workerName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedWorker.profession || "Worker"} ·{" "}
                  {selectedWorker.workerPhone}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedWorker.completedJobsCount} completed job
                  {selectedWorker.completedJobsCount === 1 ? "" : "s"}
                </p>
              </div>

              <div className="p-4 space-y-3 max-h-[70vh] overflow-auto">
                {loadingJobs ? (
                  <p className="text-sm text-muted-foreground">
                    Loading completed jobs...
                  </p>
                ) : jobs.length ? (
                  jobs.map((job, index) => (
                    <JobDetailCard
                      key={job.id}
                      job={job}
                      index={index}
                      expanded={expandedJobId === job.id}
                      onToggle={() =>
                        setExpandedJobId((current) =>
                          current === job.id ? null : job.id
                        )
                      }
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No completed jobs found for this worker.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
