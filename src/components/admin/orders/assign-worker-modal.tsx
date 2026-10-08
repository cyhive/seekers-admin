"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MatchingWorker = {
  id: string;
  name: string;
  phoneNumber: string;
  category: string;
  address: string;
  status: string;
};

export type WorkerAssignment = {
  assignedWorkerName: string;
  assignedWorkerPhone: string;
  assignedWorkerStatus: string;
  status?: string;
};

const normalizePhone = (value: unknown) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
};

const statusColor = (status: string) => {
  const lower = status.toLowerCase();
  if (lower === "approved" || lower === "accepted") return "text-green-600";
  if (lower === "rejected") return "text-red-600";
  return "text-orange-500";
};

export function AssignWorkerModal({
  jobId,
  jobTitle,
  assignedWorkerPhone,
  onAssigned,
  onClose,
}: {
  jobId: string;
  jobTitle: string;
  assignedWorkerPhone?: string;
  onAssigned?: (assignment: WorkerAssignment) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState("");
  const [applicants, setApplicants] = useState<MatchingWorker[]>([]);
  const [workers, setWorkers] = useState<MatchingWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"applied" | "matching">("applied");
  const [assigningPhone, setAssigningPhone] = useState<string | null>(null);
  const [currentPhone, setCurrentPhone] = useState(assignedWorkerPhone || "");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/workers`);
        const result = await res.json();
        if (!result.success) throw new Error(result.message);
        setCategory(result.data.category || "");
        setApplicants(result.data.applicants || []);
        // Open on the matching workers tab when nobody has applied yet
        if (!result.data.applicants?.length) setTab("matching");
        setWorkers(result.data.workers || []);
      } catch (e: any) {
        setError(e.message || "Failed to load workers");
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  const handleAssign = async (worker: MatchingWorker) => {
    const isReassign = Boolean(currentPhone);
    const shouldAssign = window.confirm(
      `${isReassign ? "Reassign" : "Assign"} "${jobTitle || "this job"}" to ${
        worker.name || worker.phoneNumber
      }?`
    );
    if (!shouldAssign) return;

    setAssigningPhone(worker.phoneNumber);
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/workers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerPhone: worker.phoneNumber }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Failed to assign worker");
      }

      setCurrentPhone(data.data.assignedWorkerPhone);
      onAssigned?.(data.data);
    } catch (e) {
      console.error("Failed to assign worker:", e);
      alert(e instanceof Error ? e.message : "Failed to assign worker");
    } finally {
      setAssigningPhone(null);
    }
  };

  const query = search.trim().toLowerCase();
  const matchesSearch = (worker: MatchingWorker) =>
    !query ||
    [worker.name, worker.phoneNumber, worker.address]
      .join(" ")
      .toLowerCase()
      .includes(query);
  const visibleApplicants = applicants.filter(matchesSearch);
  const visibleWorkers = workers.filter(matchesSearch);
  const currentKey = normalizePhone(currentPhone);

  const renderWorker = (worker: MatchingWorker) => {
    const isAssigned =
      Boolean(currentKey) && normalizePhone(worker.phoneNumber) === currentKey;
    // Applicants with no user profile can't be booked
    const hasProfile = !worker.id.startsWith("phone-");

    return (
      <div key={worker.id} className="flex items-start justify-between gap-4 p-3 text-sm">
        <div className="space-y-1 min-w-0">
          <p className="font-medium">{worker.name || "Unnamed worker"}</p>
          <p>{worker.phoneNumber}</p>
          <p>
            <span className="text-muted-foreground">Profession:</span>{" "}
            {worker.category || "-"}
          </p>
          <p className="text-muted-foreground whitespace-normal break-words">
            {worker.address || "No address"}
          </p>
          <p className={`text-xs font-semibold ${statusColor(worker.status)}`}>
            {!hasProfile
              ? "No user profile found"
              : worker.status === "Approved"
                ? "Accepted"
                : worker.status}
          </p>
        </div>
        <Button
          size="sm"
          disabled={isAssigned || !hasProfile || assigningPhone !== null}
          className={
            isAssigned
              ? "bg-green-800 opacity-60 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }
          onClick={() => handleAssign(worker)}
        >
          {assigningPhone === worker.phoneNumber
            ? "Assigning..."
            : isAssigned
              ? "Assigned"
              : "Assign"}
        </Button>
      </div>
    );
  };

  const tabClass = (active: boolean) =>
    `-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
      active
        ? "border-blue-600 text-blue-600"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-xl bg-white p-6 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-semibold">{jobTitle || "Job"}</h3>
            <p className="text-sm text-gray-500">
              Workers matching:{" "}
              <span className="font-medium text-foreground">{category || "-"}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="flex h-40 items-center justify-center text-gray-400">
            Loading workers…
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-3 flex border-b shrink-0">
              <button
                type="button"
                onClick={() => setTab("applied")}
                className={tabClass(tab === "applied")}
              >
                Applied ({applicants.length})
              </button>
              <button
                type="button"
                onClick={() => setTab("matching")}
                className={tabClass(tab === "matching")}
              >
                Matching profession ({workers.length})
              </button>
            </div>

            {(applicants.length > 0 || workers.length > 0) && (
              <Input
                placeholder="Search by name, phone or address..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mb-3 shrink-0"
              />
            )}

            <div className="flex-1 overflow-y-auto pr-1">
              {tab === "applied" ? (
                applicants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No one has applied for this job yet.
                  </p>
                ) : (
                  <div className="divide-y rounded-md border border-blue-200 bg-blue-50/40">
                    {visibleApplicants.map(renderWorker)}
                    {visibleApplicants.length === 0 && (
                      <p className="p-3 text-sm text-muted-foreground">
                        No applicants match your search.
                      </p>
                    )}
                  </div>
                )
              ) : !category ? (
                <p className="text-sm text-muted-foreground">
                  This job has no category, so no matching workers can be found.
                </p>
              ) : workers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No other workers found with a profession like "{category}".
                </p>
              ) : (
                <div className="divide-y rounded-md border">
                  {visibleWorkers.map(renderWorker)}
                  {visibleWorkers.length === 0 && (
                    <p className="p-3 text-sm text-muted-foreground">
                      No workers match your search.
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
