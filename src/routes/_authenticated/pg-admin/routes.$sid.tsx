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
import { useRoutesList, useRouteMutations } from '@/features/pg-admin/hooks/useRoutes'
import { usePaymentModesList } from '@/features/pg-admin/hooks/usePaymentModes'
import { useMerchantsList } from '@/features/pg-admin/hooks/useMerchants'
import { JsonStringEditor } from '@/features/pg-admin/components/JsonStringEditor'
import { Field } from '@/features/pg-admin/components/Field'
import { EmptyState } from '@/features/pg-admin/components/EmptyState'
import { RouteItem, Flow } from '@/features/pg-admin/types'
import { getColumnKey, renderCell } from '@/features/pg-admin/utils/tableUtils'
import { Plus, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'

const routeSchema = z.object({
  txn_flow: z.enum(['PAYIN', 'PAYOUT']),
  mode_id: z.number().min(1, 'Payment mode is required'),
  merchant_id: z.number().min(1, 'Merchant is required'),
  priority: z.number().min(0, 'Priority must be non-negative'),
  weight: z.number().min(0, 'Weight must be non-negative'),
  enabled: z.boolean(),
  circuit_cfg_json: z.string().optional()
})

type RouteFormData = z.infer<typeof routeSchema>

function AddRouteDrawer({ 
  open, 
  onOpenChange, 
  txnFlow,
  modeCode,
  onSubmit 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  txnFlow: Flow
  modeCode: string
  onSubmit: (data: RouteFormData) => void
}) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      txn_flow: txnFlow,
      mode_id: 0,
      merchant_id: 0,
      priority: 0,
      weight: 100,
      enabled: true,
      circuit_cfg_json: '{}'
    }
  })

  const { data: modesData } = usePaymentModesList({ page: 1, size: 100 })
  const { data: merchantsData } = useMerchantsList({ page: 1, size: 100 })

  const handleFormSubmit = (data: RouteFormData) => {
    onSubmit(data)
    reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Route</SheetTitle>
          <SheetDescription>
            Create a new route for {modeCode} ({txnFlow})
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

          <Field label="Merchant" required error={errors.merchant_id?.message}>
            <Select
              value={watch('merchant_id')?.toString()}
              onValueChange={(value) => setValue('merchant_id', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select merchant" />
              </SelectTrigger>
              <SelectContent>
                {merchantsData?.content?.map((merchant: any) => (
                  <SelectItem key={merchant.id} value={merchant.id.toString()}>
                    {merchant.display_name} ({merchant.merchant_ref})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Priority" required error={errors.priority?.message}>
            <Input
              {...register('priority', { valueAsNumber: true })}
              type="number"
              min="0"
              placeholder="0"
            />
          </Field>

          <Field label="Weight" required error={errors.weight?.message}>
            <Input
              {...register('weight', { valueAsNumber: true })}
              type="number"
              min="0"
              placeholder="100"
            />
          </Field>

          <Field label="Enabled">
            <div className="flex items-center space-x-2">
              <Switch
                checked={watch('enabled')}
                onCheckedChange={(checked) => setValue('enabled', checked)}
              />
              <Label>Enable this route</Label>
            </div>
          </Field>

          <JsonStringEditor
            label="Circuit Configuration (JSON)"
            value={watch('circuit_cfg_json') || '{}'}
            onChange={(value) => setValue('circuit_cfg_json', value)}
            rows={6}
          />

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Route
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function EditRouteDialog({
  route,
  onSave
}: {
  route: RouteItem
  onSave: (data: Partial<RouteItem>) => void
}) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    priority: route.priority,
    weight: route.weight,
    enabled: route.enabled,
    circuit_cfg_json: route.circuit_cfg_json || '{}'
  })

  const handleSave = () => {
    onSave(formData)
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
          <DialogTitle>Edit Route</DialogTitle>
          <DialogDescription>
            Update route configuration for {route.merchant_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Field label="Priority">
            <Input
              type="number"
              min="0"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                priority: parseInt(e.target.value) || 0 
              }))}
            />
          </Field>

          <Field label="Weight">
            <Input
              type="number"
              min="0"
              value={formData.weight}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                weight: parseInt(e.target.value) || 0 
              }))}
            />
          </Field>

          <Field label="Enabled">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  enabled: checked 
                }))}
              />
              <Label>Enable this route</Label>
            </div>
          </Field>

          <JsonStringEditor
            label="Circuit Configuration JSON"
            value={formData.circuit_cfg_json}
            onChange={(value) => setFormData(prev => ({ 
              ...prev, 
              circuit_cfg_json: value 
            }))}
            rows={12}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RoutesPage() {
  const { sid } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const [txnFlow, setTxnFlow] = useState<Flow>((search.flow as Flow) || 'PAYIN')
  const [modeCode, setModeCode] = useState<string>(search.mode || 'UPI_INTENT')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data, isLoading, error } = useRoutesList({
    subscriber_id: sid,
    txn_flow: txnFlow,
    mode_code: modeCode
  })
  
  const { data: modesData } = usePaymentModesList({ page: 1, size: 100 })
  const { create, update } = useRouteMutations()

  // Update URL when flow or mode changes
  useEffect(() => {
    navigate({
      to: '/pg-admin/routes/$sid',
      params: { sid },
      search: { flow: txnFlow, mode: modeCode }
    })
  }, [txnFlow, modeCode, sid, navigate])

  const debouncedUpdate = useDebouncedCallback(
    (routeId: number, data: Partial<RouteItem>) => {
      update.mutate({ id: routeId, body: data })
    },
    500
  )

  const handleInlineEdit = useCallback((route: RouteItem, field: keyof RouteItem, value: any) => {
    debouncedUpdate(route.id, { [field]: value })
  }, [debouncedUpdate])

  const columns: ColumnDef<RouteItem>[] = [
    {
      id: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const route = row.original
        return (
          <Input
            type="number"
            min="0"
            value={route.priority}
            onChange={(e) => {
              const newPriority = parseInt(e.target.value) || 0
              handleInlineEdit(route, 'priority', newPriority)
            }}
            className="w-20"
          />
        )
      }
    },
    {
      id: 'weight',
      header: 'Weight',
      cell: ({ row }) => {
        const route = row.original
        return (
          <Input
            type="number"
            min="0"
            value={route.weight}
            onChange={(e) => {
              const newWeight = parseInt(e.target.value) || 0
              handleInlineEdit(route, 'weight', newWeight)
            }}
            className="w-20"
          />
        )
      }
    },
    {
      id: 'enabled',
      header: 'Enabled',
      cell: ({ row }) => {
        const route = row.original
        return (
          <Switch
            checked={route.enabled}
            onCheckedChange={(checked) => {
              handleInlineEdit(route, 'enabled', checked)
            }}
          />
        )
      }
    },
    {
      id: 'merchant',
      header: 'Merchant',
      cell: ({ row }) => {
        const route = row.original
        return (
          <div>
            <div className="font-medium">{route.merchant_name || 'Unknown'}</div>
            <div className="text-sm text-muted-foreground">ID: {route.merchant_id}</div>
            {route.vendor_code && (
              <Badge variant="outline" className="text-xs">
                {route.vendor_code}
              </Badge>
            )}
          </div>
        )
      }
    },
    {
      id: 'circuit_cfg',
      header: 'Circuit Config',
      cell: ({ row }) => {
        const route = row.original
        if (!route.circuit_cfg_json) {
          return <Badge variant="outline">None</Badge>
        }
        
        try {
          const parsed = JSON.parse(route.circuit_cfg_json)
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
        const route = row.original
        return (
          <EditRouteDialog
            route={route}
            onSave={(data) => {
              update.mutate({ id: route.id, body: data })
              toast.success('Route updated successfully')
            }}
          />
        )
      }
    }
  ]

  const handleAddRoute = (data: RouteFormData) => {
    create.mutate({
      ...data,
      subscriber_id: sid
    }, {
      onSuccess: () => {
        setDrawerOpen(false)
        toast.success('Route created successfully')
      },
      onError: (error: any) => {
        if (error?.response?.status === 409) {
          toast.error('Route already exists for this combination')
        } else {
          toast.error('Failed to create route')
        }
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
              Routes Configuration
            </h2>
            <p className='text-muted-foreground'>
              Manage routing for subscriber: <code className="bg-muted px-2 py-1 rounded">{sid}</code>
            </p>
          </div>
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Route
              </Button>
            </SheetTrigger>
          </Sheet>
        </div>

        {/* Flow and Mode Selectors */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
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
          
          <div>
            <Label>Payment Mode</Label>
            <Select
              value={modeCode}
              onValueChange={setModeCode}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                {modesData?.content?.map((mode: any) => (
                  <SelectItem key={mode.code} value={mode.code}>
                    {mode.label} ({mode.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    Error loading routes
                  </TableCell>
                </TableRow>
              ) : !data?.length ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <EmptyState
                      title="No routes found"
                      description={`No routes configured for ${modeCode} (${txnFlow})`}
                      action={{
                        label: "Add Route",
                        onClick: () => setDrawerOpen(true)
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                data.map((route: RouteItem) => (
                  <TableRow key={route.id}>
                    {columns.map((column) => (
                      <TableCell key={getColumnKey(column)}>
                        {renderCell(column, { 
                          original: route, 
                          getValue: (key: string) => route[key as keyof RouteItem] 
                        })}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <AddRouteDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          txnFlow={txnFlow}
          modeCode={modeCode}
          onSubmit={handleAddRoute}
        />
      </Main>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/pg-admin/routes/$sid')({
  component: RoutesPage,
  validateSearch: z.object({
    flow: z.enum(['PAYIN', 'PAYOUT']).optional(),
    mode: z.string().optional()
  })
})
