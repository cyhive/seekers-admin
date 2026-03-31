"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModal } from "@/context/modal-context";

interface DeleteGalleryItemModalProps {
  onDelete: (ids: string[]) => void;
  entityName?: string;
  entityNamePlural?: string;
}

export function DeleteGalleryItemModal({
  onDelete,
  entityName = "Item",
  entityNamePlural = "Items",
}: DeleteGalleryItemModalProps) {
  const { modals, closeModal, modalData } = useModal();
  const isOpen = modals.deleteGalleryItem;
  const selectedIds = modalData.selectedGalleryItemIds || [];

  const handleClose = () => {
    closeModal("deleteGalleryItem");
  };

  const handleConfirm = () => {
    onDelete(selectedIds);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {entityNamePlural}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {selectedIds.length} {entityName.toLowerCase()}
            {selectedIds.length > 1 ? "s" : ""}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
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
