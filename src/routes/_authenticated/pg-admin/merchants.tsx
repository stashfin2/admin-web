import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
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
import { useMerchantsList, useMerchantMutations } from '@/features/pg-admin/hooks/useMerchants'
import { useVendorsList } from '@/features/pg-admin/hooks/useVendors'
import { JsonStringEditor } from '@/features/pg-admin/components/JsonStringEditor'
import { Field } from '@/features/pg-admin/components/Field'
import { EmptyState } from '@/features/pg-admin/components/EmptyState'
import { Merchant } from '@/features/pg-admin/types'
import { getColumnKey, renderCell } from '@/features/pg-admin/utils/tableUtils'
import { Plus, Edit, Key } from 'lucide-react'

const merchantSchema = z.object({
  vendor_id: z.number().min(1, 'Vendor is required'),
  merchant_ref: z.string().min(1, 'Merchant reference is required'),
  display_name: z.string().min(1, 'Display name is required'),
  status: z.enum(['ACTIVE', 'INACTIVE'])
})

type MerchantFormData = z.infer<typeof merchantSchema>

function MerchantFormDrawer({ 
  open, 
  onOpenChange, 
  merchant, 
  onSubmit 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  merchant?: Merchant
  onSubmit: (data: MerchantFormData) => void
}) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<MerchantFormData>({
    resolver: zodResolver(merchantSchema),
    defaultValues: {
      vendor_id: merchant?.vendor_id || 0,
      merchant_ref: merchant?.merchant_ref || '',
      display_name: merchant?.display_name || '',
      status: merchant?.status || 'ACTIVE'
    }
  })

  const { data: vendorsData } = useVendorsList({ page: 1, size: 100 })

  const handleFormSubmit = (data: MerchantFormData) => {
    onSubmit(data)
    reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {merchant ? 'Edit Merchant' : 'Create Merchant'}
          </SheetTitle>
          <SheetDescription>
            {merchant ? 'Update merchant information' : 'Add a new merchant account'}
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 mt-6">
          <Field label="Vendor" required error={errors.vendor_id?.message}>
            <Select
              value={watch('vendor_id')?.toString()}
              onValueChange={(value) => setValue('vendor_id', parseInt(value))}
              disabled={!!merchant} // Can't change vendor for existing merchants
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendorsData?.content?.map((vendor: any) => (
                  <SelectItem key={vendor.id} value={vendor.id.toString()}>
                    {vendor.name} ({vendor.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Merchant Reference" required error={errors.merchant_ref?.message}>
            <Input
              {...register('merchant_ref')}
              placeholder="e.g., merchant_123"
              disabled={!!merchant} // Can't change merchant_ref for existing merchants
            />
          </Field>

          <Field label="Display Name" required error={errors.display_name?.message}>
            <Input
              {...register('display_name')}
              placeholder="e.g., Acme Corp"
            />
          </Field>

          <Field label="Status" required error={errors.status?.message}>
            <Select
              value={watch('status')}
              onValueChange={(value) => setValue('status', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {merchant ? 'Update' : 'Create'} Merchant
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function RotateCredsDialog({
  merchant,
  onSuccess
}: {
  merchant: Merchant
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [credsJson, setCredsJson] = useState('')
  const [activationTs, setActivationTs] = useState('')
  
  const { rotateCreds } = useMerchantMutations()

  const handleRotate = () => {
    rotateCreds.mutate({
      id: merchant.id,
      body: {
        creds_json: credsJson,
        activation_ts: activationTs || undefined
      }
    }, {
      onSuccess: () => {
        onSuccess()
        setOpen(false)
        setCredsJson('')
        setActivationTs('')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Key className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Rotate Credentials</DialogTitle>
          <DialogDescription>
            Update credentials for {merchant.display_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <JsonStringEditor
            label="Credentials JSON"
            value={credsJson}
            onChange={setCredsJson}
            rows={12}
          />
          
          <Field label="Activation Timestamp (optional)">
            <Input
              type="datetime-local"
              value={activationTs}
              onChange={(e) => setActivationTs(e.target.value)}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleRotate}
            disabled={!credsJson || rotateCreds.isPending}
          >
            {rotateCreds.isPending ? 'Rotating...' : 'Rotate Credentials'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MerchantsPage() {
  const [filters, setFilters] = useState({
    vendor_id: 'all',
    status: 'all',
    merchant_ref: '',
    page: 1,
    size: 20
  })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingMerchant, setEditingMerchant] = useState<Merchant | undefined>()

  const { data, isLoading, error } = useMerchantsList({
    vendor_id: filters.vendor_id && filters.vendor_id !== 'all' ? parseInt(filters.vendor_id) : undefined,
    status: filters.status,
    merchant_ref: filters.merchant_ref || undefined,
    page: filters.page,
    size: filters.size
  })
  
  const { data: vendorsData } = useVendorsList({ page: 1, size: 100 })
  const { create, update } = useMerchantMutations()

  const columns: ColumnDef<Merchant>[] = [
    {
      accessorKey: 'display_name',
      header: 'Display Name',
    },
    {
      accessorKey: 'merchant_ref',
      header: 'Merchant Reference',
    },
    {
      id: 'vendor',
      header: 'Vendor',
      cell: ({ row }) => {
        const vendorId = row.original.vendor_id
        const vendor = vendorsData?.content?.find((v: any) => v.id === vendorId)
        return vendor ? `${vendor.name} (${vendor.code})` : `ID: ${vendorId}`
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const variant = status === 'ACTIVE' ? 'default' : 'secondary'
        return <Badge variant={variant}>{status}</Badge>
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
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingMerchant(row.original)
              setDrawerOpen(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <RotateCredsDialog
            merchant={row.original}
            onSuccess={() => {
              // Query will automatically refresh
            }}
          />
        </div>
      )
    }
  ]

  const handleCreateMerchant = (data: MerchantFormData) => {
    create.mutate({
      ...data,
      creds_json: '{}' // Default empty JSON for new merchants
    }, {
      onSuccess: () => {
        setDrawerOpen(false)
      }
    })
  }

  const handleUpdateMerchant = (data: MerchantFormData) => {
    if (!editingMerchant) return
    
    update.mutate({
      id: editingMerchant.id,
      body: data
    }, {
      onSuccess: () => {
        setEditingMerchant(undefined)
        setDrawerOpen(false)
      }
    })
  }

  const handleFormSubmit = (data: MerchantFormData) => {
    if (editingMerchant) {
      handleUpdateMerchant(data)
    } else {
      handleCreateMerchant(data)
    }
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
              Merchants
            </h2>
            <p className='text-muted-foreground'>
              Manage merchant accounts and their credentials
            </p>
          </div>
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button onClick={() => setEditingMerchant(undefined)}>
                <Plus className="mr-2 h-4 w-4" />
                New Merchant
              </Button>
            </SheetTrigger>
          </Sheet>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="vendor-filter">Vendor</Label>
            <Select
              value={filters.vendor_id}
              onValueChange={(value) => setFilters(prev => ({ ...prev, vendor_id: value, page: 1 }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All vendors</SelectItem>
                {vendorsData?.content?.map((vendor: any) => (
                  <SelectItem key={vendor.id} value={vendor.id.toString()}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="status-filter">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value, page: 1 }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="ref-filter">Merchant Reference</Label>
            <Input
              id="ref-filter"
              placeholder="Filter by reference..."
              value={filters.merchant_ref}
              onChange={(e) => setFilters(prev => ({ ...prev, merchant_ref: e.target.value, page: 1 }))}
            />
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
                    Error loading merchants
                  </TableCell>
                </TableRow>
              ) : !data?.content?.length ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <EmptyState
                      title="No merchants found"
                      description="Create your first merchant to get started"
                      action={{
                        label: "Create Merchant",
                        onClick: () => setDrawerOpen(true)
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                data.content.map((merchant: Merchant) => (
                  <TableRow key={merchant.id}>
                    {columns.map((column) => (
                      <TableCell key={getColumnKey(column)}>
                        {renderCell(column, { 
                          original: merchant, 
                          getValue: (key: string) => merchant[key as keyof Merchant] 
                        })}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {data?.meta?.total_pages && data.meta.total_pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((filters.page - 1) * filters.size) + 1} to {Math.min(filters.page * filters.size, data.meta.total_elements)} of {data.meta.total_elements} merchants
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page <= 1}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <span className="px-3 py-2 text-sm">
                Page {filters.page} of {data.meta.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page >= data.meta.total_pages}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        <MerchantFormDrawer
          open={drawerOpen}
          onOpenChange={(open) => {
            setDrawerOpen(open)
            if (!open) setEditingMerchant(undefined)
          }}
          merchant={editingMerchant}
          onSubmit={handleFormSubmit}
        />
      </Main>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/pg-admin/merchants')({
  component: MerchantsPage,
})
