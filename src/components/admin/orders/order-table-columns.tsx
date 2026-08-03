"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 1. Define the TypeScript shape of your MongoDB Job document
export type Job = {
  id: string; // Mapped from _id in the API route
  _id?: string; // Optional fallback
  phoneNumber: string;
  title: string;
  details?: string;
  description?: string;
  jobDetails?: string;
  category?: string;
  postedByName?: string;
  userName?: string;
  fullAddress?: string;
  locationText?: string;
  address?: string;
  jobAddress?: string;
  addressType?: string;
  jobDate: string;
  createdAt?: string;
  status?: string;
  approvalStatus?: string; // "Pending", "Approved", "Rejected"
  estimatedAmount?: number | null;
  estimateAmount?: number | null;
  platformFeePercent?: number | null;
  platformFee?: number | null;
  platformFeeAmount?: number | null;
  workerPayoutAmount?: number | null;
  paymentStatus?: string | null;
  paymentLink?: string | null;
  paymentUrl?: string | null;
};

export type JobPaymentUpdate = Partial<
  Pick<
    Job,
    | "estimatedAmount"
    | "platformFeePercent"
    | "platformFee"
    | "platformFeeAmount"
    | "workerPayoutAmount"
    | "paymentStatus"
    | "paymentLink"
  >
>;

type DateRangeFilter = {
  from?: string;
  to?: string;
};

const formatDate = (value: unknown) => {
  if (!value) return "-";

  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const displayText = (value: unknown) => {
  if (typeof value !== "string") return "-";

  return value.trim() || "-";
};

const formatCurrency = (value: unknown) => {
  const amount =
    typeof value === "number" ? value : value === null || value === undefined || value === ""
      ? NaN
      : Number(value);

  if (!Number.isFinite(amount)) return "-";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const toFiniteNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : null;
};

const calcWorkerPayout = (
  estimatedAmount: number | null,
  platformFeePercent: number | null
) => {
  if (estimatedAmount === null || platformFeePercent === null) return null;
  return Math.max(0, estimatedAmount - (estimatedAmount * platformFeePercent) / 100);
};

const WrappedTextCell = ({ value }: { value: unknown }) => (
  <div className="max-w-[280px] whitespace-normal break-words leading-relaxed">
    {displayText(value)}
  </div>
);

const dateRangeFilter = (
  value: unknown,
  filterValue: DateRangeFilter | undefined
) => {
  if (!filterValue?.from && !filterValue?.to) return true;
  if (!value) return false;

  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return false;

  const time = date.getTime();
  const fromTime = filterValue.from
    ? new Date(`${filterValue.from}T00:00:00`).getTime()
    : Number.NEGATIVE_INFINITY;
  const toTime = filterValue.to
    ? new Date(`${filterValue.to}T23:59:59.999`).getTime()
    : Number.POSITIVE_INFINITY;

  return time >= fromTime && time <= toTime;
};

const normalizePaymentPayload = (payload: any): JobPaymentUpdate => {
  const data = payload?.data ?? payload ?? {};
  const estimatedAmount = toFiniteNumber(
    data.estimatedAmount ?? data.estimateAmount
  );
  const platformFeePercent = toFiniteNumber(
    data.platformFeePercent ?? data.platformFee
  );
  const workerPayoutAmount = toFiniteNumber(
    data.workerPayoutAmount ??
      calcWorkerPayout(estimatedAmount, platformFeePercent)
  );

  return {
    estimatedAmount,
    platformFeePercent,
    platformFee: platformFeePercent,
    platformFeeAmount: toFiniteNumber(data.platformFeeAmount),
    workerPayoutAmount,
    paymentStatus: displayText(data.paymentStatus) === "-"
      ? null
      : String(data.paymentStatus),
    paymentLink:
      pickFirstString(
        data.paymentLink,
        data.paymentUrl,
        data.razorpayPaymentLink,
        data.shortUrl,
        data.link
      ) || null,
  };
};

const pickFirstString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const EstimatePaymentCell = ({
  job,
  onUpdate,
}: {
  job: Job;
  onUpdate?: (update: JobPaymentUpdate) => void;
}) => {
  const jobId = job.id || job._id;
  const initialAmount = toFiniteNumber(job.estimatedAmount ?? job.estimateAmount);
  const initialFee = toFiniteNumber(job.platformFeePercent ?? job.platformFee) ?? 10;

  const [estimatedAmount, setEstimatedAmount] = useState(
    initialAmount !== null ? String(initialAmount) : ""
  );
  const [platformFeePercent, setPlatformFeePercent] = useState(String(initialFee));
  const [paymentStatus, setPaymentStatus] = useState(job.paymentStatus || "-");
  const [paymentLink, setPaymentLink] = useState(
    job.paymentLink || job.paymentUrl || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const nextAmount = toFiniteNumber(job.estimatedAmount ?? job.estimateAmount);
    const nextFee = toFiniteNumber(job.platformFeePercent ?? job.platformFee) ?? 10;
    setEstimatedAmount(nextAmount !== null ? String(nextAmount) : "");
    setPlatformFeePercent(String(nextFee));
    setPaymentStatus(job.paymentStatus || "-");
    setPaymentLink(job.paymentLink || job.paymentUrl || "");
  }, [
    job.estimatedAmount,
    job.estimateAmount,
    job.platformFeePercent,
    job.platformFee,
    job.paymentStatus,
    job.paymentLink,
    job.paymentUrl,
  ]);

  const previewPayout = useMemo(
    () =>
      calcWorkerPayout(
        toFiniteNumber(estimatedAmount),
        toFiniteNumber(platformFeePercent)
      ),
    [estimatedAmount, platformFeePercent]
  );

  if (!jobId) return null;

  const applyUpdate = (update: JobPaymentUpdate) => {
    if (update.estimatedAmount !== undefined) {
      setEstimatedAmount(
        update.estimatedAmount === null ? "" : String(update.estimatedAmount)
      );
    }
    if (update.platformFeePercent !== undefined) {
      setPlatformFeePercent(
        update.platformFeePercent === null
          ? "10"
          : String(update.platformFeePercent)
      );
    }
    if (update.paymentStatus !== undefined) {
      setPaymentStatus(update.paymentStatus || "-");
    }
    if (update.paymentLink !== undefined) {
      setPaymentLink(update.paymentLink || "");
    }
    onUpdate?.(update);
  };

  const handleSaveEstimate = async () => {
    const amount = toFiniteNumber(estimatedAmount);
    const fee = toFiniteNumber(platformFeePercent);

    if (amount === null) {
      alert("Enter a valid estimated amount");
      return;
    }
    if (fee === null) {
      alert("Enter a valid platform fee percent");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/estimate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimatedAmount: amount,
          platformFeePercent: fee,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Failed to save estimate");
      }

      applyUpdate({
        ...normalizePaymentPayload(data),
        estimatedAmount: amount,
        platformFeePercent: fee,
        workerPayoutAmount: calcWorkerPayout(amount, fee),
      });
    } catch (error) {
      console.error("Failed to save estimate:", error);
      alert(error instanceof Error ? error.message : "Failed to save estimate");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePaymentAction = async (action: "link" | "sync") => {
    if (action === "link") setIsLinking(true);
    if (action === "sync") setIsSyncing(true);

    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || data?.success === false) {
        throw new Error(
          data?.message ||
            (action === "sync"
              ? "Failed to sync payment status"
              : "Failed to create payment link")
        );
      }

      applyUpdate(normalizePaymentPayload(data));
    } catch (error) {
      console.error(`Failed payment ${action}:`, error);
      alert(
        error instanceof Error
          ? error.message
          : action === "sync"
            ? "Failed to sync payment status"
            : "Failed to create payment link"
      );
    } finally {
      setIsLinking(false);
      setIsSyncing(false);
    }
  };

  const jobCompleted =
    String(job.status || "").toLowerCase() === "completed" ||
    String(job.approvalStatus || "").toLowerCase() === "completed";

  return (
    <div className="min-w-[240px] space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">
            Estimate ₹
          </label>
          <Input
            type="number"
            min="0"
            step="1"
            value={estimatedAmount}
            onChange={(event) => setEstimatedAmount(event.target.value)}
            className="h-8"
            placeholder="1000"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">
            Fee %
          </label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={platformFeePercent}
            onChange={(event) => setPlatformFeePercent(event.target.value)}
            className="h-8"
            placeholder="10"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Worker payout:{" "}
        <span className="font-semibold text-foreground">
          {formatCurrency(previewPayout)}
        </span>
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={handleSaveEstimate}
          disabled={isSaving || isLinking || isSyncing}
        >
          {isSaving ? "Saving..." : "Save Estimate"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handlePaymentAction("link")}
          disabled={isSaving || isLinking || isSyncing}
          title={
            jobCompleted
              ? "Create or resend payment link"
              : "Prefer after job is completed"
          }
        >
          {isLinking
            ? "Linking..."
            : paymentLink
              ? "Resend Link"
              : "Create Link"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handlePaymentAction("sync")}
          disabled={isSaving || isLinking || isSyncing}
        >
          {isSyncing ? "Syncing..." : "Sync Status"}
        </Button>
      </div>

      <div className="text-xs space-y-1">
        <p>
          Payment:{" "}
          <span className="font-semibold capitalize">{paymentStatus || "-"}</span>
        </p>
        {paymentLink ? (
          <a
            href={paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block max-w-[220px] truncate text-blue-600 hover:underline"
          >
            {paymentLink}
          </a>
        ) : (
          <p className="text-muted-foreground">No payment link</p>
        )}
      </div>
    </div>
  );
};

// 2. Create a custom ActionCell component to handle local state
const ActionCell = ({
  job,
  onStatusUpdate,
  onDelete,
}: {
  job: Job;
  onStatusUpdate?: (status: string) => void;
  onDelete?: () => void;
}) => {
  const jobId = job.id || job._id;
  
  // Track the status locally so it updates instantly without page reload
  const initialStatus = (job.approvalStatus || job.status || "Pending").toLowerCase();
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!jobId) return;
    setIsUpdating(true);

    try {
      const res = await fetch("/api/jobs/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, newStatus }),
      });

      if (res.ok) {
        // INSTANT UI UPDATE: Change the button state immediately!
        setCurrentStatus(newStatus.toLowerCase());
        onStatusUpdate?.(newStatus);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("An error occurred while updating the status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!jobId) return;

    const shouldDelete = window.confirm(
      `Delete "${job.title || "this job"}"? This cannot be undone.`
    );
    if (!shouldDelete) return;

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/jobs?id=${encodeURIComponent(jobId)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Failed to delete job");
      }

      onDelete?.();
    } catch (error) {
      console.error("Failed to delete job:", error);
      alert(error instanceof Error ? error.message : "Failed to delete job");
    } finally {
      setIsDeleting(false);
    }
  };

  const isApproved = currentStatus === "approved";
  const isRejected = currentStatus === "rejected";

  if (!jobId) return null;

  return (
    <div className="flex gap-2">
      {/* Accept Button */}
      <Button
        size="sm"
        disabled={isApproved || isUpdating || isDeleting}
        className={
          isApproved 
            ? "bg-green-800 opacity-60 text-white cursor-not-allowed" 
            : "bg-green-600 hover:bg-green-700 text-white"
        }
        onClick={() => handleStatusUpdate("Approved")}
      >
        {isUpdating && !isApproved && !isRejected ? "..." : isApproved ? "Accepted" : "Accept"}
      </Button>

      {/* Reject Button */}
      <Button
        size="sm"
        variant="destructive"
        disabled={isRejected || isUpdating || isDeleting}
        className={
          isRejected 
            ? "bg-red-900 opacity-60 text-white cursor-not-allowed" 
            : "bg-red-600 hover:bg-red-700 text-white"
        }
        onClick={() => handleStatusUpdate("Rejected")}
      >
        {isUpdating && !isApproved && !isRejected ? "..." : isRejected ? "Rejected" : "Reject"}
      </Button>

      <Button
        size="sm"
        variant="destructive"
        disabled={isDeleting || isUpdating}
        onClick={handleDelete}
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
};

// 3. Define the Table Columns
export const columns: ColumnDef<Job>[] = [
  {
    accessorKey: "title",
    header: "Job Title",
  },
  {
    id: "jobDetails",
    accessorFn: (row) => row.jobDetails || row.details || row.description || "",
    header: "Job Details",
    cell: ({ row }) => <WrappedTextCell value={row.getValue("jobDetails")} />,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.getValue("category") as string | undefined;
      return category || "-";
    },
  },
  {
    id: "postedByName",
    accessorFn: (row) => row.postedByName || row.userName || "",
    header: "Posted By",
    cell: ({ row }) => displayText(row.getValue("postedByName")),
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone Number",
  },
  {
    id: "jobAddress",
    accessorFn: (row) =>
      row.jobAddress || row.fullAddress || row.locationText || row.address || "",
    header: "Address",
    cell: ({ row }) => <WrappedTextCell value={row.getValue("jobAddress")} />,
  },
  {
    accessorKey: "jobDate",
    header: "Job Date",
    cell: ({ row }) => {
      const date = row.getValue("jobDate") as string;
      if (!date || date === "Not specified" || date === "N/A") return "Not specified";
      
      try {
        // Only try to parse if it's an ISO string, otherwise return as is
        return new Date(date).toLocaleDateString(); 
      } catch {
        return date;
      }
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <button
        className="flex items-center gap-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created Date
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => formatDate(row.getValue("createdAt")),
    filterFn: (row, columnId, filterValue) =>
      dateRangeFilter(row.getValue(columnId), filterValue as DateRangeFilter),
  },
  {
    id: "estimatedAmount",
    accessorFn: (row) => row.estimatedAmount ?? row.estimateAmount ?? null,
    header: "Estimate ₹",
    cell: ({ row }) => formatCurrency(row.getValue("estimatedAmount")),
  },
  {
    id: "platformFee",
    accessorFn: (row) => row.platformFeePercent ?? row.platformFee ?? null,
    header: "Platform Fee %",
    cell: ({ row }) => {
      const fee = toFiniteNumber(row.getValue("platformFee"));
      return fee === null ? "-" : `${fee}%`;
    },
  },
  {
    id: "workerPayoutAmount",
    accessorFn: (row) => {
      const amount = toFiniteNumber(row.workerPayoutAmount);
      if (amount !== null) return amount;
      return calcWorkerPayout(
        toFiniteNumber(row.estimatedAmount ?? row.estimateAmount),
        toFiniteNumber(row.platformFeePercent ?? row.platformFee)
      );
    },
    header: "Worker Payout",
    cell: ({ row }) => formatCurrency(row.getValue("workerPayoutAmount")),
  },
  {
    id: "paymentStatus",
    accessorFn: (row) => row.paymentStatus || "-",
    header: "Payment Status",
    cell: ({ row }) => {
      const status = String(row.getValue("paymentStatus") || "-");
      const lower = status.toLowerCase();
      let colorClass = "text-muted-foreground";
      if (lower === "paid") colorClass = "text-green-600";
      if (lower === "pending" || lower === "created") colorClass = "text-orange-500";
      if (lower === "failed") colorClass = "text-red-600";

      return <span className={`font-semibold capitalize ${colorClass}`}>{status}</span>;
    },
  },
  {
    id: "paymentLink",
    accessorFn: (row) => row.paymentLink || row.paymentUrl || "",
    header: "Payment Link",
    cell: ({ row }) => {
      const link = String(row.getValue("paymentLink") || "");
      if (!link) return "-";

      return (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="block max-w-[180px] truncate text-blue-600 hover:underline"
        >
          Open link
        </a>
      );
    },
  },
  {
    id: "estimatePayment",
    header: "Estimate & Payment",
    cell: ({ row, table }) => {
      const meta = table.options.meta as
        | {
            updateRowPayment?: (rowId: string, update: JobPaymentUpdate) => void;
          }
        | undefined;
      const jobId = row.original.id || row.original._id;

      return (
        <EstimatePaymentCell
          job={row.original}
          onUpdate={(update) => {
            if (jobId) meta?.updateRowPayment?.(jobId, update);
          }}
        />
      );
    },
  },
  {
    id: "status",
    accessorFn: (row) => row.approvalStatus || row.status || "Pending",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const lowerStatus = status.toLowerCase();
      
      // Color code the status text
      let colorClass = "text-orange-500"; // Default for pending
      if (lowerStatus === "approved") colorClass = "text-green-600";
      if (lowerStatus === "rejected") colorClass = "text-red-600";

      return <span className={`font-bold capitalize ${colorClass}`}>{status}</span>;
    }
  },
  {
    id: "actions",
    header: "Actions",
    // Use the new local state component we built above
    cell: ({ row, table }) => {
      const meta = table.options.meta as
        | {
            deleteRow?: (rowId: string) => void;
            updateRowStatus?: (rowId: string, status: string) => void;
          }
        | undefined;
      const jobId = row.original.id || row.original._id;

      return (
        <ActionCell
          job={row.original}
          onStatusUpdate={(status) => {
            if (jobId) meta?.updateRowStatus?.(jobId, status);
          }}
          onDelete={() => {
            if (jobId) meta?.deleteRow?.(jobId);
          }}
        />
      );
    },
  },
];
