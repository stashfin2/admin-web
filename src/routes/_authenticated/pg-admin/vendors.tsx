import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
// import { useQuery } from '@tanstack/react-query'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useVendorsList, useVendorMutations } from '@/features/pg-admin/hooks/useVendors'
import { JsonStringEditor } from '@/features/pg-admin/components/JsonStringEditor'
import { Field } from '@/features/pg-admin/components/Field'
import { EmptyState } from '@/features/pg-admin/components/EmptyState'
import { Vendor } from '@/features/pg-admin/types'
import { getColumnKey, renderCell } from '@/features/pg-admin/utils/tableUtils'
import { Plus, Edit } from 'lucide-react'

const vendorSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DEPRECATED']),
  capabilities: z.string().optional()
})

type VendorFormData = z.infer<typeof vendorSchema>

function VendorFormDrawer({ 
  open, 
  onOpenChange, 
  vendor, 
  onSubmit 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor?: Vendor
  onSubmit: (data: VendorFormData) => void
}) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      code: vendor?.code || '',
      name: vendor?.name || '',
      status: vendor?.status || 'ACTIVE',
      capabilities: vendor?.capabilities || ''
    }
  })

  const capabilities = watch('capabilities')

  const handleFormSubmit = (data: VendorFormData) => {
    onSubmit(data)
    reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {vendor ? 'Edit Vendor' : 'Create Vendor'}
          </SheetTitle>
          <SheetDescription>
            {vendor ? 'Update vendor information' : 'Add a new payment gateway vendor'}
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 mt-6">
          <Field label="Code" required error={errors.code?.message}>
            <Input
              {...register('code')}
              placeholder="e.g., RAZORPAY"
              disabled={!!vendor} // Can't change code for existing vendors
            />
          </Field>

          <Field label="Name" required error={errors.name?.message}>
            <Input
              {...register('name')}
              placeholder="e.g., Razorpay"
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
                <SelectItem value="DEPRECATED">Deprecated</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <JsonStringEditor
            label="Capabilities (JSON)"
            value={capabilities}
            onChange={(value) => setValue('capabilities', value)}
            rows={8}
          />

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {vendor ? 'Update' : 'Create'} Vendor
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function VendorsPage() {
  const [filters, setFilters] = useState({
    status: 'all',
    code: '',
    page: 1,
    size: 20
  })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | undefined>()

  const { data, isLoading, error } = useVendorsList(filters)
  const { create, update } = useVendorMutations()

  const columns: ColumnDef<Vendor>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const variant = status === 'ACTIVE' ? 'default' : 
                       status === 'INACTIVE' ? 'secondary' : 'destructive'
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setEditingVendor(row.original)
            setDrawerOpen(true)
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
      )
    }
  ]

  const handleCreateVendor = (data: VendorFormData) => {
    create.mutate(data, {
      onSuccess: () => {
        setDrawerOpen(false)
      }
    })
  }

  const handleUpdateVendor = (data: VendorFormData) => {
    if (!editingVendor) return
    
    update.mutate({
      id: editingVendor.id,
      body: data
    }, {
      onSuccess: () => {
        setEditingVendor(undefined)
        setDrawerOpen(false)
      }
    })
  }

  const handleFormSubmit = (data: VendorFormData) => {
    if (editingVendor) {
      handleUpdateVendor(data)
    } else {
      handleCreateVendor(data)
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
              Payment Gateway Vendors
            </h2>
            <p className='text-muted-foreground'>
              Manage payment gateway vendors and their capabilities
            </p>
          </div>
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button onClick={() => setEditingVendor(undefined)}>
                <Plus className="mr-2 h-4 w-4" />
                New Vendor
              </Button>
            </SheetTrigger>
          </Sheet>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
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
                <SelectItem value="DEPRECATED">Deprecated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="code-filter">Code</Label>
            <Input
              id="code-filter"
              placeholder="Filter by code..."
              value={filters.code}
              onChange={(e) => setFilters(prev => ({ ...prev, code: e.target.value, page: 1 }))}
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
                    Error loading vendors: {error instanceof Error ? error.message : 'Unknown error'}
                  </TableCell>
                </TableRow>
              ) : !data?.content?.length ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <EmptyState
                      title="No vendors found"
                      description="Create your first vendor to get started"
                      action={{
                        label: "Create Vendor",
                        onClick: () => setDrawerOpen(true)
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                data.content.map((vendor: Vendor) => (
                  <TableRow key={vendor.id}>
                    {columns.map((column) => (
                      <TableCell key={getColumnKey(column)}>
                        {renderCell(column, { 
                          original: vendor, 
                          getValue: (key: string) => vendor[key as keyof Vendor] 
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
              Showing {((filters.page - 1) * filters.size) + 1} to {Math.min(filters.page * filters.size, data.meta.total_elements)} of {data.meta.total_elements} vendors
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

        <VendorFormDrawer
          open={drawerOpen}
          onOpenChange={(open) => {
            setDrawerOpen(open)
            if (!open) setEditingVendor(undefined)
          }}
          vendor={editingVendor}
          onSubmit={handleFormSubmit}
        />
      </Main>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/pg-admin/vendors')({
  component: VendorsPage,
})
