"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useModal } from "@/context/modal-context";
import { GalleryItemForm, GalleryItemFormValues } from "./gallery-form";
import { useEffect } from "react";

interface CreateGalleryItemModalProps {
  onSave: (data: GalleryItemFormValues, pendingFiles?: File[], id?: string) => void;
}

export function CreateGalleryItemModal({ onSave }: CreateGalleryItemModalProps) {
  const { modals, closeModal, modalData } = useModal();
  const isOpen = modals.createGalleryItem;
  const isEditing = modalData.editingGalleryItem;

  const handleClose = () => {
    closeModal("createGalleryItem");
  };

  const handleSave = (data: GalleryItemFormValues, pendingFiles?: File[]) => {
    onSave(data, pendingFiles, isEditing?._id);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Gallery Item" : "Create Gallery Item"}
          </DialogTitle>
        </DialogHeader>
        {isOpen && (
          <GalleryItemForm
            onSubmit={handleSave}
            initialData={isEditing}
            onCancel={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
