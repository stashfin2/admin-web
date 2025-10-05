import * as React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export function JsonStringEditor({
  label,
  value,
  onChange,
  rows = 10
}: {
  label?: string
  value?: string
  onChange: (s: string) => void
  rows?: number
}) {
  const [text, setText] = React.useState(value ?? '')
  const [error, setError] = React.useState<string | null>(null)
  
  React.useEffect(() => {
    setText(value ?? '')
  }, [value])
  
  React.useEffect(() => {
    try {
      if (text) JSON.parse(text)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    }
  }, [text])

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Textarea
        rows={rows}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onChange(text)}
        className={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-xs text-red-500">JSON error: {error}</p>}
    </div>
  )
}
