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

interface DeleteModalProps {
  onDelete: (ids: string[]) => void;
  entityName: string;
  entityNamePlural: string;
}

export function DeleteModal({
  onDelete,
  entityName,
  entityNamePlural,
}: DeleteModalProps) {
  const { modal, closeModal } = useModal();

  if (
    modal?.type !== `confirmDelete${entityName}` &&
    modal?.type !== `confirmDelete${entityNamePlural}`
  ) {
    return null;
  }

  const isBulkDelete = modal.type === `confirmDelete${entityNamePlural}`;
  const modalData = (modal as any).data as { [key: string]: any };

  const singleItem = modalData[entityName] || modalData[entityName.toLowerCase()];
  const items =
    modalData[entityNamePlural] || modalData[entityNamePlural.toLowerCase()];
  const count = modalData.count;

  const handleConfirm = () => {
    if (isBulkDelete && items) {
      const ids = items.map((item: any) => item.id);
      onDelete(ids);
    } else if (singleItem) {
      onDelete([singleItem.id]);
    }
    closeModal();
  };

  const title = isBulkDelete
    ? `Delete Multiple ${entityNamePlural}`
    : "Are you absolutely sure?";
  const description = isBulkDelete
    ? `This action cannot be undone. This will permanently delete ${
        count || items?.length
      } selected ${entityNamePlural.toLowerCase()}.`
    : `This action cannot be undone. This will permanently delete the ${entityName.toLowerCase()} "${
        singleItem?.name || singleItem?.code
      }".`;

  return (
    <Dialog
      open={
        modal.type === `confirmDelete${entityName}` ||
        modal.type === `confirmDelete${entityNamePlural}`
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
