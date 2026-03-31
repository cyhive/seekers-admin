"use client";

import { ColumnDef, CellContext } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Eye } from "lucide-react";
import { useState } from "react";

export interface GalleryItem {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  createdAt?: string;
}

interface ColumnsConfig {
  onBulkDelete?: (ids: string[]) => void;
  onEdit?: (item: GalleryItem) => void;
  onDelete?: (id: string) => void;
}

export function createGalleryColumns(config?: ColumnsConfig): ColumnDef<GalleryItem>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-xs truncate text-sm text-muted-foreground">
          {row.getValue("description") || "—"}
        </div>
      ),
    },
    {
      accessorKey: "images",
      header: "Images",
      cell: ({ row }) => {
        const images = row.getValue("images") as string[];
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">{images?.length || 0} image(s)</span>
            {images && images.length > 0 && (
              <ImagePreviewButton images={images} />
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => config?.onEdit?.(item)}
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => config?.onDelete?.(item._id)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
      enableSorting: false,
    },
  ];
}

function ImagePreviewButton({ images }: { images: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1"
      >
        <Eye className="h-4 w-4" />
        Preview
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative bg-white rounded-lg max-w-2xl max-h-screen overflow-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-black text-2xl font-bold z-10"
            >
              ×
            </button>

            {/* Image */}
            <div className="p-4">
              <img
                src={images[currentIndex]}
                alt={`Preview ${currentIndex + 1}`}
                className="max-w-full max-h-96 object-contain"
              />
            </div>

            {/* Navigation */}
            {images.length > 1 && (
              <div className="flex justify-between items-center px-4 pb-4">
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-600">
                  {currentIndex + 1} / {images.length}
                </span>
                <button
                  onClick={() => setCurrentIndex(Math.min(images.length - 1, currentIndex + 1))}
                  disabled={currentIndex === images.length - 1}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
