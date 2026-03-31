"use client";

import { useEffect, useState } from "react";
import { z } from "zod";

import { columns } from "@/components/admin/categories/category-table-columns";
import { DataTable } from "@/components/admin/categories/category-table";
import { categorySchema, Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useModal } from "@/context/modal-context";
import { CategoryModal } from "@/components/admin/categories/category-modal";
import { CategoryDeleteModal } from "@/components/admin/categories/category-delete-modal";
import { showToast } from "@/lib/toast";

async function getCategories(): Promise<Category[]> {
  const response = await fetch("/api/categories");
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  const data = await response.json();
  return z.array(categorySchema).parse(data);
}

async function createCategory(
  category: Omit<Category, "id">
): Promise<Category> {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(category),
  });
  if (!response.ok) {
    throw new Error("Failed to create category");
  }
  return await response.json();
}

async function updateCategory(
  id: string,
  category: Omit<Category, "id">
): Promise<Category> {
  const response = await fetch(`/api/categories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(category),
  });
  if (!response.ok) {
    throw new Error("Failed to update category");
  }
  return await response.json();
}

async function deleteCategory(ids: string): Promise<void> {
  const response = await fetch(`/api/categories/${ids}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete categories");
  }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const { openModal } = useModal();

  useEffect(() => {
    getCategories().then((data) => {
      const sortedData = [...data].sort((a, b) => {
        const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setCategories(sortedData);
    });
  }, []);

  const handleCreate = async (values: Omit<Category, "id">) => {
    try {
      const newCategory = await createCategory(values);
      const updatedCategories = [...categories, newCategory].sort((a, b) => {
        const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setCategories(updatedCategories);
      showToast.success("Category created successfully!");
    } catch (error) {
      console.error(error);
      showToast.error("Failed to create category. Please try again.");
    }
  };

  const handleEdit = async (id: string, values: Omit<Category, "id">) => {
    try {
      await updateCategory(id, values);
      // After update, refresh the entire list to ensure proper sorting
      const refreshedData = await getCategories();
      const sortedData = [...refreshedData].sort((a, b) => {
        const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setCategories(sortedData);
      showToast.success("Category updated successfully!");
    } catch (error) {
      console.error(error);
      showToast.error("Failed to update category. Please try again.");
    }
  };

  const handleDelete = async (ids: string) => {
    try {
      await deleteCategory(ids);
      const idArray = ids.split(",");
      setCategories(categories.filter((c) => !idArray.includes(c.id)));
      showToast.success("Category deleted successfully!");
    } catch (error) {
      console.error(error);
      showToast.error("Failed to delete category. Please try again.");
    }
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-2 p-2 lg:gap-4 lg:p-4 bg-background overflow-auto">
        <CategoryModal onCreate={handleCreate} onEdit={handleEdit} />
        <CategoryDeleteModal onDelete={handleDelete} />
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
            <p className="text-muted-foreground">
              Here&apos;s a list of your Member categories.
            </p>
          </div>
          <Button onClick={() => openModal("createCategory")}>
            Create Category
          </Button>
        </div>
        <DataTable
          data={categories}
          columns={columns}
          meta={{
            onDelete: handleDelete,
          }}
        />
      </div>
    </>
  );
}
