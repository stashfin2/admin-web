import React from 'react'

interface ActionButtonsProps {
  onCreate: () => void
  onUpdate: () => void
  entityLabel: string
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onCreate, onUpdate, entityLabel }) => (
  <div className="flex gap-2">
    <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={onCreate}>
      Create {entityLabel}
    </button>
    <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={onUpdate}>
      Update {entityLabel}
    </button>
  </div>
)
