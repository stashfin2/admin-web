import React from 'react'

interface EntityModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

export const EntityModal: React.FC<EntityModalProps> = ({ open, title, onClose, children }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 min-w-[320px] max-w-[90vw]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500">&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}
