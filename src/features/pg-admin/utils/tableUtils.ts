import { ColumnDef } from '@tanstack/react-table'

export function getColumnKey(column: ColumnDef<any>): string {
  if ('id' in column) return column.id as string
  if ('accessorKey' in column) return String(column.accessorKey)
  return 'unknown'
}

export function renderCell(
  column: ColumnDef<any>, 
  row: { original: any; getValue: (key: string) => any }
): React.ReactNode {
  if ('cell' in column && column.cell) {
    if (typeof column.cell === 'function') {
      return column.cell(row as any)
    }
    return column.cell
  }
  
  if ('accessorKey' in column && column.accessorKey) {
    return row.getValue(String(column.accessorKey))
  }
  
  return ''
}
