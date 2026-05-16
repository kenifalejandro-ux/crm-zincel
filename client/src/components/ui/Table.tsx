/**client/src/components/ui/Table.tsx */

import { type ReactNode } from "react";

interface Column<T> {
  key:       string;
  label:     string;
  render?:   (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns:   Column<T>[];
  data:      T[];
  loading?:  boolean;
  empty?:    string;
  rowKey:    (row: T) => string;
  onRowClick?: (row: T) => void;
}

export function Table<T>({ columns, data, loading, empty = "Sin registros", rowKey, onRowClick }: TableProps<T>) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {columns.map(col => (
                <th key={col.key} className={`text-left px-5 py-3 text-xs font-medium text-zinc-800 uppercase tracking-wide ${col.className ?? ""}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12">
                  <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-xs text-zinc-800">
                  {empty}
                </td>
              </tr>
            ) : data.map(row => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={`hover:bg-gray-50 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
              >
                {columns.map(col => (
                  <td key={col.key} className={`px-5 py-3.5 ${col.className ?? ""}`}>
                    {col.render ? col.render(row) : (row as any)[col.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}