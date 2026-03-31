"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Category } from "@/lib/types";

interface CategoryFormProps {
  onSubmit: (values: Omit<Category, "id">) => void;
  onCancel: () => void;
  initialData?: Category | null;
}

export function CategoryForm({
  onSubmit,
  onCancel,
  initialData,
}: CategoryFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData) {
      // Edit mode - don't include createdAt
      onSubmit({ name, description });
    } else {
      // Create mode - include createdAt
      onSubmit({ name, description, createdAt: new Date().toISOString() });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <label htmlFor="name">Name</label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category Name"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="description">Description</label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Category Description"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initialData ? "Save Changes" : "Create"}</Button>
      </div>
    </form>
  );
}
