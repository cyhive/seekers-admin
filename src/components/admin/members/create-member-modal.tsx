"use client";

import React from "react";
import { useModal } from "../../../context/modal-context";
import { MemberForm, MemberFormValues } from "./member-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";

interface CreateMemberModalProps {
  onSave: (
    data: MemberFormValues,
    pendingFiles?: (File | null)[],
    id?: string
  ) => void;
}

export function CreateMemberModal({ onSave }: CreateMemberModalProps) {
  const { modal, closeModal } = useModal();

  if (modal?.type !== "createMember" && modal?.type !== "editMember") {
    return null;
  }

  const isEdit = modal.type === "editMember";
  const member = isEdit
    ? (modal.data as { Member: any })?.Member
    : null;

  const handleSave = (
    data: MemberFormValues,
    pendingFiles?: (File | null)[]
  ) => {
    if (isEdit && member?.id) {
      onSave(data, pendingFiles, member.id);
    } else {
      onSave(data, pendingFiles);
    }
    closeModal();
  };

  return (
    <Dialog
      open={modal?.type === "createMember" || modal?.type === "editMember"}
      onOpenChange={closeModal}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Member" : "Create New Member"}
          </DialogTitle>
        </DialogHeader>

        <MemberForm
          onSubmit={handleSave}
          onCancel={closeModal}
          initialData={isEdit ? member : undefined}
        />
      </DialogContent>
    </Dialog>
  );
}
