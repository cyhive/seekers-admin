"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useModal } from "@/context/modal-context";
import { showToast } from "@/lib/toast";
import { CreateGalleryItemModal } from "@/components/admin/gallery/create-gallery-item-modal";
import { DeleteGalleryItemModal } from "@/components/admin/gallery/delete-gallery-item-modal";
import { GalleryTable } from "@/components/admin/gallery/gallery-table";
import { createGalleryColumns, GalleryItem } from "@/components/admin/gallery/gallery-table-columns";
import { GalleryItemFormValues } from "@/components/admin/gallery/gallery-form";

export default function UploadsPage() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { openModal, setModalData } = useModal();

  /* ===================== FETCH ITEMS ===================== */
  const fetchGalleryItems = async () => {
    try {
      const res = await fetch('/api/gallery-items');
      if (!res.ok) throw new Error();

      const data = await res.json();
      setGalleryItems(data);
    } catch {
      showToast.error('Failed to fetch gallery items');
    }
  };

  useEffect(() => {
    fetchGalleryItems();
  }, []);

  /* ===================== SORT ===================== */
  const sortedItems = useMemo(() => {
    return [...galleryItems].sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [galleryItems]);

  /* ===================== CREATE ===================== */
  const handleCreateClick = () => {
    setModalData('editingGalleryItem', null);
    openModal('createGalleryItem');
  };

  /* ===================== EDIT ===================== */
  const handleEditClick = (item: GalleryItem) => {
    setModalData('editingGalleryItem', item);
    openModal('createGalleryItem');
  };

  /* ===================== SAVE (CREATE/UPDATE) ===================== */
  const handleSaveItem = async (
    data: GalleryItemFormValues,
    pendingFiles?: File[],
    id?: string
  ) => {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');

      // Append existing images
      formData.append('existingImages', JSON.stringify(data.images));

      // Append removed images
      formData.append('removedImages', JSON.stringify(data.removedImages || []));

      // Append new files
      pendingFiles?.forEach((file) => {
        formData.append('images', file);
      });

      const url = id ? `/api/gallery-items?id=${id}` : '/api/gallery-items';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (!res.ok) throw new Error();

      const saved = await res.json();

      /* ---------- UPDATE TABLE ---------- */
      if (id) {
        // Update existing item
        setGalleryItems((prev) =>
          prev.map((item) => (item._id === id ? { ...item, ...saved } : item))
        );
      } else {
        // Add new item at the top
        setGalleryItems((prev) => [{ ...saved, _id: saved._id }, ...prev]);
      }

      showToast.success(
        id ? 'Item updated successfully' : 'Item created successfully'
      );
    } catch (error) {
      console.error(error);
      showToast.error('Failed to save item');
    }
  };

  /* ===================== DELETE ===================== */
  const handleDeleteClick = (id: string) => {
    setModalData('selectedGalleryItemIds', [id]);
    openModal('deleteGalleryItem');
  };

  const handleBulkDeleteItems = async (ids: string[]) => {
    try {
      const res = await fetch(`/api/gallery-items?ids=${ids.join(',')}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error();

      setGalleryItems((prev) => prev.filter((item) => !ids.includes(item._id)));
      showToast.success('Items deleted successfully');
    } catch {
      showToast.error('Failed to delete items');
    }
  };

  const columns = createGalleryColumns({
    onEdit: handleEditClick,
    onDelete: handleDeleteClick,
  });

  return (
    <div className="flex flex-col gap-4">
      {/* ===================== MODALS ===================== */}
      <CreateGalleryItemModal onSave={handleSaveItem} />

      <DeleteGalleryItemModal
        onDelete={handleBulkDeleteItems}
        entityName="Item"
        entityNamePlural="Items"
      />

      {/* ===================== HEADER ===================== */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gallery</h2>
          <p className="text-muted-foreground">
            Manage your gallery items with images, titles, and descriptions.
          </p>
        </div>
        <Button onClick={handleCreateClick}>Create Item</Button>
      </div>

      {/* ===================== TABLE ===================== */}
      <GalleryTable columns={columns} data={sortedItems} />
    </div>
  );
}
