"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImagePreviewModalProps {
  open: boolean;
  onClose: () => void;
  images: string[];
  title?: string;
}

export function ImagePreviewModal({
  open,
  onClose,
  images,
  title = "Image Preview",
}: ImagePreviewModalProps) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (!open) setIndex(0);
  }, [open]);

  if (!images?.length) return null;

  const prev = () => setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <img
            src={images[index]}
            alt="Preview"
            className="max-h-[60vh] object-contain rounded-md border"
          />

          {images.length > 1 && (
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={prev}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {index + 1} / {images.length}
              </span>
              <Button variant="outline" onClick={next}>
                Next
              </Button>
            </div>
          )}

          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                onClick={() => setIndex(i)}
                className={`w-16 h-16 object-cover rounded cursor-pointer border ${
                  i === index ? "ring-2 ring-primary" : ""
                }`}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
