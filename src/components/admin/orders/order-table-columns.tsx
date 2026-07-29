"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

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
};

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
