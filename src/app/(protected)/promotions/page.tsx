"use client";

import React from "react";
import { PlusCircle, Calendar as CalendarIcon, X } from "lucide-react";
import { PromotionTable } from "@/components/admin/promotions/promotion-table";
import { createColumns } from "@/components/admin/promotions/promotion-table-columns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Promotion } from "@/lib/types";
import { showToast } from "@/lib/toast";
import { DeleteModal } from "@/components/admin/members/member-delete-modal";

export default function PromotionsPage() {
  const [promotions, setPromotions] = React.useState<Promotion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingPromotion, setEditingPromotion] =
    React.useState<Promotion | null>(null);
  const [formData, setFormData] = React.useState({
    code: "",
    type: "",
    value: "",
    startDate: "",
    endDate: "",
  });

  const fetchPromotions = async () => {
    try {
      const response = await fetch("/api/promotions");
      if (response.ok) {
        const data = await response.json();
        setPromotions(data);
      }
    } catch (error) {
      console.error("Error fetching promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPromotions();
  }, []);

  const handleCreatePromotion = () => {
    setEditingPromotion(null);
    setFormData({
      code: "",
      type: "",
      value: "",
      startDate: "",
      endDate: "",
    });
    setIsModalOpen(true);
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      code: promotion.code,
      type: promotion.type,
      value: promotion.value,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
    });
    setIsModalOpen(true);
  };

  const handleDeletePromotion = async (promotion: Promotion) => {
    if (
      !confirm(`Are you sure you want to delete promotion "${promotion.code}"?`)
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/promotions/${promotion.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPromotions(promotions.filter((p) => p.id !== promotion.id));
        showToast.success("Promotion deleted successfully!");
      } else {
        showToast.error("Failed to delete promotion. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting promotion:", error);
      showToast.error("Failed to delete promotion. Please try again.");
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (!confirm(`Are you sure you want to delete ${ids.length} promotions?`)) {
      return;
    }

    try {
      const response = await fetch("/api/promotions/bulk-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });

      if (response.ok) {
        setPromotions(promotions.filter((p) => !ids.includes(p.id)));
        showToast.success(`${ids.length} promotions deleted successfully!`);
      } else {
        showToast.error("Failed to delete promotions. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting promotions:", error);
      showToast.error("Failed to delete promotions. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const promotionData = {
      ...formData,
      status: "Active" as const,
    };

    try {
      const url = editingPromotion
        ? `/api/promotions/${editingPromotion.id}`
        : "/api/promotions";
      const method = editingPromotion ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(promotionData),
      });

      if (response.ok) {
        const savedPromotion = await response.json();
        if (editingPromotion) {
          setPromotions(
            promotions.map((p) =>
              p.id === editingPromotion.id ? savedPromotion : p
            )
          );
          showToast.success("Promotion updated successfully!");
        } else {
          setPromotions([...promotions, savedPromotion]);
          showToast.success("Promotion created successfully!");
        }
        setIsModalOpen(false);
      } else {
        showToast.error("Failed to save promotion. Please try again.");
      }
    } catch (error) {
      console.error("Error saving promotion:", error);
      showToast.error("Failed to save promotion. Please try again.");
    }
  };

  const columns = createColumns({
    onEdit: handleEditPromotion,
    onDelete: handleDeletePromotion,
  });

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-2 p-2 lg:gap-4 lg:p-4 bg-background overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Promotions</h2>
            <p className="text-muted-foreground">Loading promotions...</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="rounded-md border">
          <div className="p-2">
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-2 p-2 lg:gap-4 lg:p-4 bg-background overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Promotions</h2>
            <p className="text-muted-foreground">
              Here's a list of your promotions.
            </p>
          </div>
          <Button onClick={handleCreatePromotion}>Create Promotion</Button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-in fade-in-0">
            <div className="relative z-50 grid w-full max-w-lg translate-y-0 gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-[48%]">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
              <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                <h2 className="text-lg font-semibold leading-none tracking-tight">
                  {editingPromotion ? "Edit Promotion" : "Create Promotion"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Fill in the details for the{" "}
                  {editingPromotion ? "updated" : "new"} promotion.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="grid gap-6 py-4">
                <div className="space-y-2">
                  <label
                    htmlFor="code"
                    className="text-sm font-medium leading-none"
                  >
                    Code
                  </label>
                  <input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="type"
                      className="text-sm font-medium leading-none"
                    >
                      Type
                    </label>
                    <Select
                      defaultValue={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Percentage">Percentage</SelectItem>
                        <SelectItem value="Fixed Amount">
                          Fixed Amount
                        </SelectItem>
                        <SelectItem value="Free Shipping">
                          Free Shipping
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="value"
                      className="text-sm font-medium leading-none"
                    >
                      Value
                    </label>
                    <input
                      id="value"
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({ ...formData, value: e.target.value })
                      }
                      placeholder="e.g. 20% or $10"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startDate: e.target.value,
                          })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData({ ...formData, endDate: e.target.value })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                  <Button type="submit">
                    {editingPromotion ? "Update Promotion" : "Save Promotion"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <DeleteModal
          onDelete={handleBulkDelete}
          entityName="Promotion"
          entityNamePlural="Promotions"
        />
        <PromotionTable columns={columns} data={promotions} />
      </div>
    </>
  );
}
