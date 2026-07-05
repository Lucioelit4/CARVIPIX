import React from 'react';
import { borders, colors, spacing, typography } from '../tokens';

export interface CARVIPIXTableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface CARVIPIXDataTableProps<T> {
  columns: CARVIPIXTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  emptyLabel?: string;
}

export function CARVIPIXDataTable<T>({ columns, rows, rowKey, emptyLabel = 'Sin datos disponibles' }: CARVIPIXDataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div style={{ borderRadius: borders.radius.lg, border: '1px solid rgba(255, 255, 255, 0.1)', padding: spacing[16], color: colors.white.secondary, fontSize: typography.sizes.sm }}>
        {emptyLabel}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="cv-readable-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            {columns.map((column) => (
              <th key={String(column.key)} style={{ textAlign: 'left', padding: `${spacing[12]} ${spacing[16]}`, color: colors.white.secondary, fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={rowKey(row, index)} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              {columns.map((column) => {
                const rawValue = (row as Record<string, unknown>)[String(column.key)];
                return (
                  <td key={String(column.key)} style={{ padding: `${spacing[12]} ${spacing[16]}`, fontSize: typography.sizes.sm, color: colors.white.text }}>
                    {column.render ? column.render(row) : (rawValue as React.ReactNode)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
