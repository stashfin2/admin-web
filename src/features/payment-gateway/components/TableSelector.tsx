import React from 'react'

export interface TableOption {
  key: string
  label: string
}

interface TableSelectorProps {
  options: TableOption[]
  value: string
  onChange: (key: string) => void
}

export const TableSelector: React.FC<TableSelectorProps> = ({ options, value, onChange }) => (
  <select value={value} onChange={e => onChange(e.target.value)} className="border rounded px-2 py-1">
    {options.map(opt => (
      <option key={opt.key} value={opt.key}>{opt.label}</option>
    ))}
  </select>
)
