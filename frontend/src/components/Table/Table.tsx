import React from 'react';
import { EmptyStateIllustration } from '../Illustrations';

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyField: keyof T;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

export function Table<T>({
  data,
  columns,
  keyField,
  onRowClick,
  emptyMessage = 'No data available',
  sortField,
  sortDirection,
  onSort,
}: TableProps<T>) {
  const getCellValue = (item: T, column: TableColumn<T>): React.ReactNode => {
    if (column.render) {
      return column.render(item);
    }
    const value = item[column.key as keyof T];
    if (value === null || value === undefined) {
      return <span className="text-gray-400">—</span>;
    }
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    return String(value);
  };

  const handleHeaderClick = (column: TableColumn<T>) => {
    if (column.sortable && onSort) {
      onSort(column.key as string);
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-modern">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  style={{ width: column.width }}
                  className={column.sortable ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200' : ''}
                  onClick={() => handleHeaderClick(column)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && sortField === column.key && (
                      <svg 
                        className={`w-4 h-4 text-cyber-500 dark:text-neon-cyan transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <EmptyStateIllustration className="w-40 h-32" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={String(item[keyField])}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? 'clickable' : ''}
                >
                  {columns.map((column) => (
                    <td key={column.key as string}>{getCellValue(item, column)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
