"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useState, useEffect } from "react";

export type UserCustomer = {
  id: string;
  name: string;
  phoneNumber: string;
  category: string;
  status?: string;
  createdAt?: string | null;
};

type DateRangeFilter = {
  from?: string;
  to?: string;
};

type ImageData = {
  idType?: string | null;
  idPhotoFront: string | null;
  idPhotoBack?: string | null;
  profilePhoto: string | null;
  portfolio: string | string[] | null; 
};

const getAlternateImageUrl = (url: string) => {
  if (url.includes("/api/uploads/")) {
    return url.replace("/api/uploads/", "/uploads/");
  }
  if (url.includes("/uploads/")) {
    return url.replace("/uploads/", "/api/uploads/");
  }
  return url;
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

const getStatusLabel = (status: string) =>
  status === "Approved" ? "Accepted" : status;

const FallbackImage = ({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasRetried, setHasRetried] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setHasRetried(false);
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (!hasRetried) {
          setCurrentSrc(getAlternateImageUrl(currentSrc));
          setHasRetried(true);
        }
      }}
    />
  );
};

const ImageModal = ({
  customer,
  onClose,
}: {
  customer: UserCustomer;
  onClose: () => void;
}) => {
  const [images, setImages] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 👇 ADDED: State to track which portfolio image we are looking at
  const [currentPortIndex, setCurrentPortIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/customers/images/${customer.id}`);
        const result = await res.json();
        if (!result.success) throw new Error(result.message);
        setImages(result.data);
      } catch (e: any) {
        setError(e.message || "Failed to load images");
      } finally {
        setLoading(false);
      }
    })();
  }, [customer.id]);

  // 👇 ADDED: Normalize portfolio into a clean array for the slider
  const portfolioArray = images?.portfolio 
    ? (Array.isArray(images.portfolio) ? images.portfolio : [images.portfolio]).filter(img => img.trim() !== '')
    : [];

  // 👇 ADDED: Functions to handle slider navigation
  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent opening the image link
    e.stopPropagation();
    setCurrentPortIndex((prev) => (prev + 1) % portfolioArray.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPortIndex((prev) => (prev - 1 + portfolioArray.length) % portfolioArray.length);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-semibold">{customer.name}</h3>
            <p className="text-sm text-gray-500">{customer.phoneNumber}</p>
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
            Loading images…
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {images && !loading && (
          <div className="flex-1 overflow-y-auto pr-2">

            <div className="mb-4 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700 border">
              ID Type: <span className="font-semibold capitalize">{images.idType || "Not provided"}</span>
            </div>

            {/* --- ID & PROFILE PHOTOS (Top Row) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: "ID Photo Front", src: images.idPhotoFront },
                { label: "ID Photo Back", src: images.idPhotoBack },
                { label: "Profile Photo", src: images.profilePhoto },
              ].map(({ label, src }) => (
                <div key={label}>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    {label}
                  </p>
                  {src ? (
                    <a href={src} target="_blank" rel="noopener noreferrer">
                      <FallbackImage
                        src={src}
                        alt={label}
                        className="h-40 w-full rounded-lg border object-cover transition hover:opacity-90 shadow-sm"
                      />
                    </a>
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
                      No image
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* --- PORTFOLIO IMAGES (Slider Grid) --- */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Portfolio
              </p>
              
              {portfolioArray.length > 0 ? (
                <div className="relative w-full h-64 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center group">
                  <a href={portfolioArray[currentPortIndex]} target="_blank" rel="noopener noreferrer" className="w-full h-full block">
                    <FallbackImage
                      src={portfolioArray[currentPortIndex]}
                      alt={`Portfolio ${currentPortIndex + 1}`}
                      className="w-full h-full object-contain transition hover:opacity-90"
                    />
                  </a>

                  {/* Show Arrows only if there is more than 1 image */}
                  {portfolioArray.length > 1 && (
                    <>
                      {/* Left Arrow */}
                      <button 
                        onClick={handlePrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                      </button>

                      {/* Right Arrow */}
                      <button 
                        onClick={handleNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>

                      {/* Image Counter Indicator */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs font-medium px-3 py-1 rounded-full">
                        {currentPortIndex + 1} / {portfolioArray.length}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex h-20 w-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
                  No portfolio images uploaded
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

const ActionCell = ({
  customer,
  onStatusUpdate,
  onDelete,
}: {
  customer: UserCustomer;
  onStatusUpdate?: (status: string) => void;
  onDelete?: () => void;
}) => {
  const [status, setStatus] = useState(customer.status || "Pending");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/customers/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: customer.id, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setStatus(newStatus);
      onStatusUpdate?.(newStatus);
    } catch (error) {
      console.error("Error updating customer:", error);
      alert("Failed to update customer status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    const shouldDelete = window.confirm(
      `Delete "${customer.name || "this user"}"? This cannot be undone.`
    );
    if (!shouldDelete) return;

    setIsDeleting(true);

    try {
      const res = await fetch(
        `/api/customers?id=${encodeURIComponent(customer.id)}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => null);

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Failed to delete user");
      }

      onDelete?.();
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const normalizedStatus = status.toLowerCase();
  const isApproved =
    normalizedStatus === "approved" || normalizedStatus === "accepted";
  const isRejected = normalizedStatus === "rejected";

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          View
        </button>

        <button
          onClick={() => handleUpdate("Approved")}
          disabled={isApproved || isUpdating || isDeleting}
          className="rounded-md bg-green-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isApproved ? "Accepted" : "Approve"}
        </button>
        <button
          onClick={() => handleUpdate("Rejected")}
          disabled={isRejected || isUpdating || isDeleting}
          className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRejected ? "Rejected" : "Reject"}
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting || isUpdating}
          className="rounded-md bg-red-700 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {showModal && (
        <ImageModal customer={customer} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

export const columns: ColumnDef<UserCustomer>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "phoneNumber", header: "Phone Number" },
  { accessorKey: "category", header: "Category" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = (row.getValue("status") as string | undefined) || "Pending";
      const lowerStatus = status.toLowerCase();
      let colorClass = "text-orange-500";

      if (lowerStatus === "accepted" || lowerStatus === "approved") {
        colorClass = "text-green-600";
      }
      if (lowerStatus === "rejected") colorClass = "text-red-600";

      return (
        <span className={`font-bold capitalize ${colorClass}`}>
          {getStatusLabel(status)}
        </span>
      );
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
    id: "actions",
    header: "Action",
    cell: ({ row, table }) => {
      const meta = table.options.meta as
        | {
            deleteRow?: (rowId: string) => void;
            updateRowStatus?: (rowId: string, status: string) => void;
          }
        | undefined;

      return (
        <ActionCell
          customer={row.original}
          onStatusUpdate={(status) =>
            meta?.updateRowStatus?.(row.original.id, status)
          }
          onDelete={() => meta?.deleteRow?.(row.original.id)}
        />
      );
    },
  },
];
