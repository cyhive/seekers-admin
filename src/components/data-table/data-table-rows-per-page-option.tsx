'use client';

import type { Table } from '@tanstack/react-table';

interface DataTableRowsPerPageOptionProps<TData> {
  table: Table<TData>;
}

export function DataTableRowsPerPageOption<TData>({
  table,
}: DataTableRowsPerPageOptionProps<TData>) {
  return (
    <div className="flex items-center space-x-2">
      <p className="text-sm font-medium">Rows per page</p>
      <select
        value={`${table.getState().pagination.pageSize}`}
        onChange={(e) => {
          table.setPageSize(Number(e.target.value));
        }}
        className="h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {[10, 20, 30, 40, 50].map((pageSize) => (
          <option key={pageSize} value={`${pageSize}`}>
            {pageSize}
          </option>
        ))}
      </select>
    </div>
  );
}
