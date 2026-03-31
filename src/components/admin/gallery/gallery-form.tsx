"use client";

import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export type GalleryItemFormValues = {
  title: string;
  description?: string;
  images: string[];
  removedImages?: string[];
};

interface GalleryItemFormProps {
  onSubmit: (values: GalleryItemFormValues, pendingFiles?: File[]) => void;
  initialData?: {
    _id: string;
    title: string;
    description?: string;
    images: string[];
  } | null;
  onCancel?: () => void;
}

function ImageSection({
  title,
  images,
  onImagesChange,
  removedImages,
  onRemovedImagesChange,
  onFileChange,
  fileInputId,
}: {
  title: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  removedImages: string[];
  onRemovedImagesChange: (removed: string[]) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputId: string;
}) {
  return (
    <div className="space-y-2">
      <label className="font-semibold">{title}</label>

      {/* Existing Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {images.map((img) => (
            <div key={img} className="relative">
              <img
                src={img}
                alt="preview"
                className="w-full h-20 object-cover rounded-md border"
              />
              <button
                type="button"
                onClick={() => {
                  onImagesChange(images.filter((i) => i !== img));
                  onRemovedImagesChange([...removedImages, img]);
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Input
        id={fileInputId}
        type="file"
        multiple
        accept="image/*"
        onChange={onFileChange}
      />
    </div>
  );
}

export function GalleryItemForm({
  onSubmit,
  initialData,
  onCancel,
}: GalleryItemFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setPendingFiles((prev) => [...prev, ...files]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData: GalleryItemFormValues = {
      title,
      description: description || undefined,
      images,
      removedImages,
    };

    onSubmit(formData, pendingFiles);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 max-h-[75vh] overflow-y-auto pr-2">
      <Input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <Textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <ImageSection
        title="Images"
        images={images}
        onImagesChange={setImages}
        removedImages={removedImages}
        onRemovedImagesChange={setRemovedImages}
        onFileChange={handleFileChange}
        fileInputId="gallery-images"
      />

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">{initialData ? "Update Item" : "Create Item"}</Button>
      </div>
    </form>
  );
}
