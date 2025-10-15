 import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface StatusModalProps {
  name: string
  children: React.ReactNode
  onSubmit: (status: 'approved' | 'rejected', reason?: string) => void
}

export default function StatusModal({
  name,
  children,
  onSubmit,
}: StatusModalProps) {
  const [reason, setReason] = useState('')

  const handleApprove = () => {
    onSubmit('approved') // no reason needed
  }

  const handleReject = () => {
    if (!reason.trim()) {
      alert('Please provide a reason for rejection.')
      return
    }
    onSubmit('rejected', reason.trim())
    setReason('') // reset after submit
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='w-full max-w-sm'>
        <DialogHeader>
          <DialogTitle>Update Status for {name}</DialogTitle>
        </DialogHeader>

        {/* Reason Input (only relevant if rejecting) */}
        <div className='flex flex-col gap-2 py-4'>
          <label className='text-sm font-medium'>Reason (required if rejecting)</label>
          <Input
            placeholder='Enter reason'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <DialogFooter className='flex flex-col gap-2'>
          <Button onClick={handleApprove}>Approve</Button>
          <Button onClick={handleReject} variant='destructive'>
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
