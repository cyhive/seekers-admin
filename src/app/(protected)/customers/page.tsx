"use client";

import { useEffect, useState } from "react";
import { CustomerTable } from "@/components/admin/customers/customer-table";
import { columns, UserCustomer } from "@/components/admin/customers/customer-table-columns";

export default function CustomersPage() {
  const [data, setData] = useState<UserCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch("/api/customers");

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          const message =
            (body && (body.error || body.message)) ||
            `Failed to fetch (status ${res.status})`;
          throw new Error(message);
        }

        const result = await res.json();

        const sortByNewest = (dataArray: UserCustomer[]) => {
          return [...dataArray].sort((a: any, b: any) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        };

        if (Array.isArray(result)) {
          setData(sortByNewest(result));
          setError(null);
        } else if (result?.success) {
          setData(sortByNewest(result.data ?? []));
          setError(null);
        } else {
          throw new Error(result?.message || "Failed to load customers data");
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        setError(
          error instanceof Error ? error.message : "Unknown error fetching customers"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background overflow-auto">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Customers Directory</h2>
            <p className="text-muted-foreground">
              Here&apos;s a list of all users from the database.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/5 px-4 py-2 text-sm text-destructive">
            Failed to load customers: {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            Loading customers...
          </div>
        ) : (
          <CustomerTable columns={columns} data={data} />
        )}
      </div>
    </>
  );
}