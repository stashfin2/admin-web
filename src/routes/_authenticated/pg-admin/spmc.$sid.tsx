import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ColumnDef } from '@tanstack/react-table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useSpmcList, useSpmcMutations } from '@/features/pg-admin/hooks/useSpmc'
import { usePaymentModesList } from '@/features/pg-admin/hooks/usePaymentModes'
import { JsonStringEditor } from '@/features/pg-admin/components/JsonStringEditor'
import { ConfirmDialog } from '@/features/pg-admin/components/ConfirmDialog'
import { Field } from '@/features/pg-admin/components/Field'
import { EmptyState } from '@/features/pg-admin/components/EmptyState'
import { SpmcItem, Flow } from '@/features/pg-admin/types'
import { getColumnKey, renderCell } from '@/features/pg-admin/utils/tableUtils'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'

const spmcConfigSchema = z.object({
  mode_id: z.number().min(1, 'Payment mode is required'),
  txn_flow: z.enum(['PAYIN', 'PAYOUT']),
  enabled: z.boolean(),
  ui_order: z.number().min(0, 'Order must be non-negative'),
  constraints_json: z.string().optional()
})

type SpmcConfigFormData = z.infer<typeof spmcConfigSchema>

function AddModeConfigDrawer({ 
  open, 
  onOpenChange, 
  txnFlow,
  onSubmit 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  txnFlow: Flow
  onSubmit: (data: SpmcConfigFormData) => void
}) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<SpmcConfigFormData>({
    resolver: zodResolver(spmcConfigSchema),
    defaultValues: {
      mode_id: 0,
      txn_flow: txnFlow,
      enabled: true,
      ui_order: 0,
      constraints_json: '{}'
    }
  })

  const { data: modesData } = usePaymentModesList({ page: 1, size: 100 })

  const handleFormSubmit = (data: SpmcConfigFormData) => {
    onSubmit(data)
    reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Mode Configuration</SheetTitle>
          <SheetDescription>
            Configure payment mode for {txnFlow} flow
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 mt-6">
          <Field label="Payment Mode" required error={errors.mode_id?.message}>
            <Select
              value={watch('mode_id')?.toString()}
              onValueChange={(value) => setValue('mode_id', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                {modesData?.content?.map((mode: any) => (
                  <SelectItem key={mode.id} value={mode.id.toString()}>
                    {mode.label} ({mode.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="UI Order" required error={errors.ui_order?.message}>
            <Input
              {...register('ui_order', { valueAsNumber: true })}
              type="number"
              min="0"
              placeholder="0"
            />
          </Field>

          <Field label="Enabled">
            <div className="flex items-center space-x-2">
              <Switch
                checked={watch('enabled')}
                onCheckedChange={(checked) => setValue('enabled', checked)}
              />
              <Label>Enable this payment mode</Label>
            </div>
          </Field>

          <JsonStringEditor
            label="Constraints (JSON)"
            value={watch('constraints_json') || '{}'}
            onChange={(value) => setValue('constraints_json', value)}
            rows={6}
          />

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Configuration
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function EditConstraintsDialog({
  item,
  onSave
}: {
  item: SpmcItem
  onSave: (constraints: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [constraints, setConstraints] = useState(item.constraints || '{}')

  const handleSave = () => {
    onSave(constraints)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Constraints</DialogTitle>
          <DialogDescription>
            Configure constraints for {item.mode_code} ({item.txn_flow})
          </DialogDescription>
        </DialogHeader>
        
        <JsonStringEditor
          label="Constraints JSON"
          value={constraints}
          onChange={setConstraints}
          rows={12}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Constraints
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SpmcPage() {
  const { sid } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const [txnFlow, setTxnFlow] = useState<Flow>((search.flow as Flow) || 'PAYIN')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    item: SpmcItem | null
    force: boolean
  }>({
    open: false,
    item: null,
    force: false
  })

  const { data, isLoading, error } = useSpmcList({
    subscriber_id: sid,
    txn_flow: txnFlow
  })
  
  const { upsert, patch, remove } = useSpmcMutations()

  // Update URL when flow changes
  useEffect(() => {
    navigate({
      to: '/pg-admin/spmc/$sid',
      params: { sid },
      search: { flow: txnFlow }
    })
  }, [txnFlow, sid, navigate])

  const debouncedPatch = useDebouncedCallback(
    (data: { subscriber_id: string; mode_id: number; txn_flow: Flow; enabled?: boolean; ui_order?: number; constraints_json?: string }) => {
      patch.mutate(data)
    },
    500
  )

  const handleToggleEnabled = useCallback((item: SpmcItem) => {
    debouncedPatch({
      subscriber_id: item.subscriber_id,
      mode_id: item.mode_id,
      txn_flow: item.txn_flow,
      enabled: !item.enabled
    })
  }, [debouncedPatch])

  const handleOrderChange = useCallback((item: SpmcItem, newOrder: number) => {
    debouncedPatch({
      subscriber_id: item.subscriber_id,
      mode_id: item.mode_id,
      txn_flow: item.txn_flow,
      ui_order: newOrder
    })
  }, [debouncedPatch])

  const handleConstraintsUpdate = useCallback((item: SpmcItem, constraints: string) => {
    patch.mutate({
      subscriber_id: item.subscriber_id,
      mode_id: item.mode_id,
      txn_flow: item.txn_flow,
      constraints_json: constraints
    })
  }, [patch])

  const handleDelete = useCallback((item: SpmcItem) => {
    remove.mutate({
      subscriber_id: item.subscriber_id,
      mode_id: item.mode_id,
      txn_flow: item.txn_flow,
      force: deleteConfirm.force
    }, {
      onSuccess: () => {
        setDeleteConfirm({ open: false, item: null, force: false })
        toast.success('Configuration deleted successfully')
      },
      onError: (error: any) => {
        if (error?.response?.status === 409) {
          // Show force option for conflicts
          setDeleteConfirm(prev => ({ ...prev, force: true }))
          toast.error('Cannot delete: enabled routes exist. Check "Force delete" to override.')
        } else {
          toast.error('Failed to delete configuration')
        }
      }
    })
  }, [remove, deleteConfirm.force])

  const columns: ColumnDef<SpmcItem>[] = [
    {
      accessorKey: 'mode_code',
      header: 'Payment Mode',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div>
            <div className="font-medium">{item.mode_code || 'Unknown'}</div>
            <div className="text-sm text-muted-foreground">ID: {item.mode_id}</div>
          </div>
        )
      }
    },
    {
      accessorKey: 'enabled',
      header: 'Enabled',
      cell: ({ row }) => {
        const item = row.original
        return (
          <Switch
            checked={item.enabled}
            onCheckedChange={() => handleToggleEnabled(item)}
          />
        )
      }
    },
    {
      accessorKey: 'ui_order',
      header: 'UI Order',
      cell: ({ row }) => {
        const item = row.original
        return (
          <Input
            type="number"
            min="0"
            value={item.ui_order}
            onChange={(e) => {
              const newOrder = parseInt(e.target.value) || 0
              handleOrderChange(item, newOrder)
            }}
            className="w-20"
          />
        )
      }
    },
    {
      id: 'constraints',
      header: 'Constraints',
      cell: ({ row }) => {
        const item = row.original
        if (!item.constraints) {
          return <Badge variant="outline">None</Badge>
        }
        
        try {
          const parsed = JSON.parse(item.constraints)
          return (
            <div className="max-w-xs">
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {JSON.stringify(parsed)}
              </code>
            </div>
          )
        } catch {
          return <Badge variant="destructive">Invalid JSON</Badge>
        }
      }
    },
    {
      accessorKey: 'updated_at',
      header: 'Updated',
      cell: ({ row }) => {
        const date = new Date(row.getValue('updated_at'))
        return date.toLocaleDateString()
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex gap-1">
            <EditConstraintsDialog
              item={item}
              onSave={(constraints) => handleConstraintsUpdate(item, constraints)}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirm({ open: true, item, force: false })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    }
  ]

  const handleAddConfig = (data: SpmcConfigFormData) => {
    upsert.mutate({
      ...data,
      subscriber_id: sid
    }, {
      onSuccess: () => {
        setDrawerOpen(false)
        toast.success('Configuration added successfully')
      }
    })
  }

  return (
    <div>
      <Header>
        <Search />
        <div className='ml-auto flex items-center gap-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-6 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              SPMC Configuration
            </h2>
            <p className='text-muted-foreground'>
              Configure payment modes for subscriber: <code className="bg-muted px-2 py-1 rounded">{sid}</code>
            </p>
          </div>
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Mode Config
              </Button>
            </SheetTrigger>
          </Sheet>
        </div>

        {/* Flow Selector */}
        <div className="mb-6">
          <Label>Transaction Flow</Label>
          <div className="flex gap-2 mt-2">
            <Button
              variant={txnFlow === 'PAYIN' ? 'default' : 'outline'}
              onClick={() => setTxnFlow('PAYIN')}
            >
              PAYIN
            </Button>
            <Button
              variant={txnFlow === 'PAYOUT' ? 'default' : 'outline'}
              onClick={() => setTxnFlow('PAYOUT')}
            >
              PAYOUT
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={getColumnKey(column)}>
                    {typeof column.header === 'string' ? column.header : 'Actions'}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-red-500">
                    Error loading SPMC configuration
                  </TableCell>
                </TableRow>
              ) : !data?.length ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <EmptyState
                      title="No configurations found"
                      description={`No payment mode configurations for ${txnFlow} flow`}
                      action={{
                        label: "Add Configuration",
                        onClick: () => setDrawerOpen(true)
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item: SpmcItem) => (
                  <TableRow key={`${item.mode_id}-${item.txn_flow}`}>
                    {columns.map((column) => (
                      <TableCell key={getColumnKey(column)}>
                        {renderCell(column, { 
                          original: item, 
                          getValue: (key: string) => item[key as keyof SpmcItem] 
                        })}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <AddModeConfigDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          txnFlow={txnFlow}
          onSubmit={handleAddConfig}
        />

        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
          title="Delete Configuration"
          description={`Are you sure you want to delete the configuration for ${deleteConfirm.item?.mode_code}?`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={() => deleteConfirm.item && handleDelete(deleteConfirm.item)}
        />

        {deleteConfirm.item && (
          <div className="mt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="force-delete"
                checked={deleteConfirm.force}
                onCheckedChange={(checked) => 
                  setDeleteConfirm(prev => ({ ...prev, force: !!checked }))
                }
              />
              <Label htmlFor="force-delete" className="text-sm">
                Force delete (ignore enabled routes)
              </Label>
            </div>
          </div>
        )}
      </Main>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/pg-admin/spmc/$sid')({
  component: SpmcPage,
  validateSearch: z.object({
    flow: z.enum(['PAYIN', 'PAYOUT']).optional()
  })
})
