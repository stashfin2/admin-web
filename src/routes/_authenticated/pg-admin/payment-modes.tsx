import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
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
  // SheetTrigger,
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
import { usePaymentModesList, usePaymentMode } from '@/features/pg-admin/hooks/usePaymentModes'
import { EmptyState } from '@/features/pg-admin/components/EmptyState'
import { PaymentMode } from '@/features/pg-admin/types'
import { getColumnKey, renderCell } from '@/features/pg-admin/utils/tableUtils'
import { Copy, Eye } from 'lucide-react'
import { toast } from 'sonner'

function PaymentModeDetailsDrawer({
  modeId,
  open,
  onOpenChange
}: {
  modeId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: mode, isLoading } = usePaymentMode(modeId || 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Payment Mode Details</SheetTitle>
          <SheetDescription>
            Detailed information about this payment mode
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : mode ? (
            <>
              <div>
                <Label className="text-sm font-medium">ID</Label>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {mode.id}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(mode.id.toString())
                      toast.success('ID copied to clipboard')
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Code</Label>
                <code className="bg-muted px-2 py-1 rounded text-sm block">
                  {mode.code}
                </code>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Label</Label>
                <p>{mode.label}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <Badge variant="outline">{mode.category}</Badge>
              </div>
              
              {mode.attrs && (
                <div>
                  <Label className="text-sm font-medium">Attributes</Label>
                  <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(mode.attrs, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No details available
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function PaymentModesPage() {
  const [filters, setFilters] = useState({
    category: '',
    page: 1,
    size: 20
  })
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false)
  const [selectedModeId, setSelectedModeId] = useState<number | null>(null)

  const { data, isLoading, error } = usePaymentModesList({
    category: filters.category || undefined,
    page: filters.page,
    size: filters.size
  })

  // Extract unique categories for filter
  const categories = Array.from(
    new Set(data?.content?.map((mode: PaymentMode) => mode.category) || [])
  ).sort() as string[]

  const columns: ColumnDef<PaymentMode>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
    },
    {
      accessorKey: 'label',
      header: 'Label',
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue('category')}</Badge>
      )
    },
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <code className="bg-muted px-2 py-1 rounded text-sm">
            {row.getValue('id')}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const id = row.getValue('id') as number
              navigator.clipboard.writeText(id.toString())
              toast.success('ID copied to clipboard')
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedModeId(row.original.id)
            setDetailsDrawerOpen(true)
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ]

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
              Payment Modes
            </h2>
            <p className='text-muted-foreground'>
              Catalog of available payment modes and their configurations
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <Label htmlFor="category-filter">Category</Label>
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters(prev => ({ ...prev, category: value, page: 1 }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category}
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
                    Error loading payment modes
                  </TableCell>
                </TableRow>
              ) : !data?.content?.length ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <EmptyState
                      title="No payment modes found"
                      description="No payment modes match your current filters"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                data.content.map((mode: PaymentMode) => (
                  <TableRow key={mode.id}>
                    {columns.map((column) => (
                      <TableCell key={getColumnKey(column)}>
                        {renderCell(column, { 
                          original: mode, 
                          getValue: (key: string) => mode[key as keyof PaymentMode] 
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
              Showing {((filters.page - 1) * filters.size) + 1} to {Math.min(filters.page * filters.size, data.meta.total_elements)} of {data.meta.total_elements} payment modes
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

        <PaymentModeDetailsDrawer
          modeId={selectedModeId}
          open={detailsDrawerOpen}
          onOpenChange={(open) => {
            setDetailsDrawerOpen(open)
            if (!open) setSelectedModeId(null)
          }}
        />
      </Main>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/pg-admin/payment-modes')({
  component: PaymentModesPage,
})
