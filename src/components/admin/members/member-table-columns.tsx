"use client";

import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import type { Member } from "../../../lib/types";
import { MemberActions } from "./member-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { ImagePreviewModal } from "./image-preview-modal";

/* -------------------------------------------------------------------------- */
/*                                Image Cell                                  */
/* -------------------------------------------------------------------------- */

function ImageCell({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [open, setOpen] = React.useState(false);

  if (!images || images.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <>
      <img
        src={images[0]}
        alt={title}
        className="h-14 w-14 rounded-md object-cover cursor-pointer border"
        loading="lazy"
        onClick={() => setOpen(true)}
      />

      <ImagePreviewModal
        open={open}
        onClose={() => setOpen(false)}
        images={images}
        title={title}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Table Columns                                   */
/* -------------------------------------------------------------------------- */

interface MemberTableColumnsProps {
  onBulkDelete?: (ids: string[]) => void;
}

export const createColumns = ({
  onBulkDelete,
}: MemberTableColumnsProps): ColumnDef<Member>[] => [
  /* ---------------------------- Select Column ---------------------------- */
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={
          table.getIsSomePageRowsSelected() &&
          !table.getIsAllPageRowsSelected()
        }
        onCheckedChange={(value) =>
          table.toggleAllPageRowsSelected(!!value)
        }
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  /* --------------------------- Member Image ---------------------------- */
  {
    accessorKey: "images",
    header: "Member Image",
    cell: ({ row }) => (
      <div className="hidden md:block">
        <ImageCell
          images={row.original.images || []}
          title="Member Images"
        />
      </div>
    ),
  },

  /* ------------------------ Ration Card Images -------------------------- */
  {
    accessorKey: "rationCardImages",
    header: "Ration Card",
    cell: ({ row }) => (
      <div className="hidden md:block">
        <ImageCell
          images={row.original.rationCardImages || []}
          title="Ration Card Images"
        />
      </div>
    ),
  },

  /* --------------------------- Other Images ----------------------------- */
  {
    accessorKey: "otherImages",
    header: "Other Images",
    cell: ({ row }) => (
      <div className="hidden md:block">
        <ImageCell
          images={row.original.otherImages || []}
          title="Other Images"
        />
      </div>
    ),
  },

  /* -------------------------------- Name -------------------------------- */
  {
    accessorKey: "name",
    header: ({ column }) => (
      <button
        className="flex items-center gap-2"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Name
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
  },

  /* ------------------------------ Details ------------------------------- */
  {
    accessorKey: "details",
    header: "Details",
    cell: ({ row }) => {
      const member = row.original;

      return (
        <div className="hidden md:block text-sm text-muted-foreground space-y-1 max-w-[320px]">
          <p><b>Mobile:</b> {member.mobileNumber || "-"}</p>
          <p><b>Age:</b> {member.age || "-"}</p>
          <p><b>Blood Group:</b> {member.bloodGroup || "-"}</p>
          <p><b>Ration Card:</b> {member.rationCardType || "-"}</p>
          <p><b>Occupation:</b> {member.occupation || "-"}</p>
          <p><b>Education:</b> {member.educationQualification || "-"}</p>
          <p><b>Disease:</b> {member.disease || "-"}</p>
          <p>
            <b>Schemes:</b>{" "}
            {member.schemes?.length ? member.schemes.join(", ") : "-"}
          </p>
          <p><b>Address:</b> {member.address || "-"}</p>
          <p>
            <b>DOB:</b>{" "}
            {member.dateOfBirth
              ? new Date(member.dateOfBirth).toLocaleDateString()
              : "-"}
          </p>
          <p><b>Kudumbasree:</b> {member.kudumbasreeName || "-"}</p>
          <p><b>Voter ID:</b> {member.voterId || "-"}</p>
          <p><b>Others:</b> {member.others || "-"}</p>
        </div>
      );
    },
  },

  /* ------------------------------- Ward -------------------------------- */
  {
    accessorKey: "wardArea",
    header: "Ward",
  },

  /* ------------------------------- Date -------------------------------- */
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <button
        className="flex items-center gap-2"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Date
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt");
      if (!createdAt) return "-";

      const date = new Date(createdAt as string);

      return (
        <span className="hidden md:inline">
          {isNaN(date.getTime())
            ? "-"
            : new Intl.DateTimeFormat("en-IN").format(date)}
        </span>
      );
    },
  },

  /* ------------------------------ Actions ------------------------------- */
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <MemberActions Member={row.original} />,
  },
];

/* -------------------------------------------------------------------------- */
/*                              Default Export                                 */
/* -------------------------------------------------------------------------- */

export const columns = createColumns({});
