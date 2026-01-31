import React from 'react';
import './Table.css';

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
      return '-';
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
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key as string}
                style={{ width: column.width }}
                className={column.sortable ? 'sortable' : ''}
                onClick={() => handleHeaderClick(column)}
              >
                <span className="th-content">
                  {column.header}
                  {column.sortable && sortField === column.key && (
                    <span className="sort-indicator">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                {emptyMessage}
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
  );
}
