"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

// 1. Define the TypeScript shape of your MongoDB Job document
export type Job = {
  id: string; // Mapped from _id in the API route
  _id?: string; // Optional fallback
  phoneNumber: string;
  title: string;
  category?: string;
  jobDate: string;
  createdAt?: string;
  status?: string;
  approvalStatus?: string; // "Pending", "Approved", "Rejected"
};

// 2. Create a custom ActionCell component to handle local state
const ActionCell = ({ job }: { job: Job }) => {
  const jobId = job.id || job._id;
  
  // Track the status locally so it updates instantly without page reload
  const initialStatus = (job.approvalStatus || job.status || "Pending").toLowerCase();
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const isApproved = currentStatus === "approved";
  const isRejected = currentStatus === "rejected";

  if (!jobId) return null;

  return (
    <div className="flex gap-2">
      {/* Accept Button */}
      <Button
        size="sm"
        disabled={isApproved || isUpdating}
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
        disabled={isRejected || isUpdating}
        className={
          isRejected 
            ? "bg-red-900 opacity-60 text-white cursor-not-allowed" 
            : "bg-red-600 hover:bg-red-700 text-white"
        }
        onClick={() => handleStatusUpdate("Rejected")}
      >
        {isUpdating && !isApproved && !isRejected ? "..." : isRejected ? "Rejected" : "Reject"}
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
    accessorKey: "phoneNumber",
    header: "Phone Number",
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = (row.original.approvalStatus || row.original.status || "Pending");
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
    cell: ({ row }) => <ActionCell job={row.original} />,
  },
];