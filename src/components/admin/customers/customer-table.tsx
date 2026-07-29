"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type DateRangeFilter = {
  from?: string;
  to?: string;
};

const filterControlClass =
  "h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

const stringifyForSearch = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return `${value.toISOString()} ${value.toLocaleDateString()}`.toLowerCase();
  }
  if (Array.isArray(value)) {
    return value.map(stringifyForSearch).join(" ");
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map(stringifyForSearch)
      .join(" ");
  }

  const text = String(value);
  const date =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)
      ? new Date(value)
      : null;

  if (date && !Number.isNaN(date.getTime())) {
    return `${text} ${date.toLocaleDateString()}`.toLowerCase();
  }

  return text.toLowerCase();
};

const getStringValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

interface DataTableProps<TData extends object, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowDelete?: (rowId: string) => void;
}

export function CustomerTable<TData extends object, TValue>({
  columns,
  data,
  onRowDelete,
}: DataTableProps<TData, TValue>) {
  const [tableData, setTableData] = React.useState<TData[]>(data);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState({});

  React.useEffect(() => {
    setTableData(data);
  }, [data]);

  const categoryOptions = React.useMemo(() => {
    const values = data
      .map((item) => getStringValue((item as Record<string, unknown>).category))
      .filter(Boolean);

    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const statusOptions = React.useMemo(() => {
    const values = [
      "Pending",
      "Approved",
      "Rejected",
      ...data.map((item) => {
        const row = item as Record<string, unknown>;
        return getStringValue(row.status) || "Pending";
      }),
    ].filter(Boolean);

    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue ?? "").trim().toLowerCase();
      if (!search) return true;

      return stringifyForSearch(row.original).includes(search);
    },
    onRowSelectionChange: setRowSelection,
    getRowId: (row, index) => {
      const record = row as Record<string, unknown>;
      return String(record.id ?? record._id ?? index);
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    meta: {
      deleteRow: (rowId: string) => {
        setTableData((currentData) =>
          currentData.filter((item) => {
            const record = item as Record<string, unknown>;
            const id = String(record.id ?? record._id ?? "");

            return id !== rowId;
          })
        );
        onRowDelete?.(rowId);
      },
      updateRowStatus: (rowId: string, status: string) => {
        setTableData((currentData) =>
          currentData.map((item) => {
            const record = item as Record<string, unknown>;
            const id = String(record.id ?? record._id ?? "");

            if (id !== rowId) return item;

            return {
              ...item,
              status,
            } as TData;
          })
        );
      },
    },
  });

  const nameColumn = table.getColumn("name");
  const phoneColumn = table.getColumn("phoneNumber");
  const categoryColumn = table.getColumn("category");
  const statusColumn = table.getColumn("status");
  const createdAtColumn = table.getColumn("createdAt");
  const createdAtFilter =
    (createdAtColumn?.getFilterValue() as DateRangeFilter | undefined) ?? {};
  const hasFilters = Boolean(globalFilter) || columnFilters.length > 0;

  const updateCreatedDateFilter = (
    key: keyof DateRangeFilter,
    value: string
  ) => {
    const nextFilter = {
      ...createdAtFilter,
      [key]: value || undefined,
    };

    createdAtColumn?.setFilterValue(
      nextFilter.from || nextFilter.to ? nextFilter : undefined
    );
  };

  const resetFilters = () => {
    setGlobalFilter("");
    table.resetColumnFilters();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          placeholder="Search all customers..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="w-full sm:max-w-xs"
        />
        <Input
          placeholder="Name"
          value={(nameColumn?.getFilterValue() as string) ?? ""}
          onChange={(event) => nameColumn?.setFilterValue(event.target.value)}
          className="w-full sm:max-w-[180px]"
        />
        <Input
          placeholder="Phone"
          value={(phoneColumn?.getFilterValue() as string) ?? ""}
          onChange={(event) => phoneColumn?.setFilterValue(event.target.value)}
          className="w-full sm:max-w-[160px]"
        />
        {categoryColumn && categoryOptions.length > 0 && (
          <select
            value={(categoryColumn.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              categoryColumn.setFilterValue(event.target.value || undefined)
            }
            className={filterControlClass}
          >
            <option value="">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        )}
        {statusColumn && (
          <select
            value={(statusColumn.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              statusColumn.setFilterValue(event.target.value || undefined)
            }
            className={filterControlClass}
          >
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "Approved" ? "Accepted" : status}
              </option>
            ))}
          </select>
        )}
        <Input
          type="date"
          aria-label="Created from"
          value={createdAtFilter.from ?? ""}
          onChange={(event) =>
            updateCreatedDateFilter("from", event.target.value)
          }
          className="w-full sm:w-[150px]"
        />
        <Input
          type="date"
          aria-label="Created to"
          value={createdAtFilter.to ?? ""}
          onChange={(event) =>
            updateCreatedDateFilter("to", event.target.value)
          }
          className="w-full sm:w-[150px]"
        />
        <Button
          type="button"
          variant="outline"
          onClick={resetFilters}
          disabled={!hasFilters}
          className="w-full sm:w-auto"
        >
          Reset
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
