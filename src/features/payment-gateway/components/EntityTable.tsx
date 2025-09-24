import React from 'react'

export interface TableColumn {
  key: string
  label: string
}

interface EntityTableProps {
  columns: TableColumn[]
  data: any[]
  loading?: boolean
}

export const EntityTable: React.FC<EntityTableProps> = ({ columns, data, loading }) => (
  <div className="overflow-x-auto border rounded mt-4">
    {loading ? (
      <div className="p-4">Loading...</div>
    ) : (
      <table className="min-w-full">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className="px-3 py-2 border-b bg-inherit text-left">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="p-4 text-center">No data</td></tr>
          ) : (
            data.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key} className="px-3 py-2 border-b">{row[col.key]}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    )}
  </div>
)
