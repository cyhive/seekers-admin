"use client";

import { useModal } from "@/context/modal-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Category } from "@/lib/types";

interface CategoryDeleteModalProps {
  onDelete: (id: string) => void;
}

export function CategoryDeleteModal({ onDelete }: CategoryDeleteModalProps) {
  const { modal, closeModal } = useModal();

  if (
    modal?.type !== "confirmDeleteCategory" &&
    modal?.type !== "confirmDeleteCategories"
  ) {
    return null;
  }

  const isBulkDelete = modal.type === "confirmDeleteCategories";
  const { category, categories, count } = modal.data as {
    category?: Category;
    categories?: Category[];
    count?: number;
  };

  const handleConfirm = () => {
    if (isBulkDelete && categories) {
      const ids = categories.map((cat) => cat.id).join(",");
      onDelete(ids);
    } else if (category) {
      onDelete(category.id);
    }
    closeModal();
  };

  const title = isBulkDelete
    ? "Delete Multiple Categories"
    : "Are you absolutely sure?";
  const description = isBulkDelete
    ? `This action cannot be undone. This will permanently delete ${
        count || categories?.length
      } selected categories.`
    : `This action cannot be undone. This will permanently delete the category "${category?.name}".`;

  return (
    <Dialog
      open={
        modal.type === "confirmDeleteCategory" ||
        modal.type === "confirmDeleteCategories"
      }
      onOpenChange={closeModal}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
