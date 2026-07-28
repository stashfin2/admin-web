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
import { Checkbox } from '@/components/ui/checkbox'
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
import { useSubscribersList, useSubscriberMutations } from '@/features/pg-admin/hooks/useSubscribers'
import { Field } from '@/features/pg-admin/components/Field'
import { EmptyState } from '@/features/pg-admin/components/EmptyState'
import { Subscriber } from '@/features/pg-admin/types'
import { getColumnKey, renderCell } from '@/features/pg-admin/utils/tableUtils'
import { Plus, Edit, Key, Settings, Route as RouteIcon } from 'lucide-react'
import { toast } from 'sonner'

const subscriberSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  client_id: z.string().min(1, 'Client ID is required'),
  webhook_url: z.string().url().optional().or(z.literal('')),
  allow_domains: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE'])
})

type SubscriberFormData = z.infer<typeof subscriberSchema>

function SubscriberFormDrawer({ 
  open, 
  onOpenChange, 
  subscriber, 
  onSubmit 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  subscriber?: Subscriber
  onSubmit: (data: SubscriberFormData) => void
}) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<SubscriberFormData>({
    resolver: zodResolver(subscriberSchema),
    defaultValues: {
      id: subscriber?.id || '',
      name: subscriber?.name || '',
      client_id: subscriber?.client_id || '',
      webhook_url: subscriber?.webhook_url || '',
      allow_domains: subscriber?.allow_domains || [],
      status: subscriber?.status || 'ACTIVE'
    }
  })

  const [domains, setDomains] = useState<string[]>(watch('allow_domains') || [])
  const [newDomain, setNewDomain] = useState('')

  const handleFormSubmit = (data: SubscriberFormData) => {
    onSubmit({ ...data, allow_domains: domains })
    reset()
    setDomains([])
    setNewDomain('')
    onOpenChange(false)
  }

  const addDomain = () => {
    if (newDomain && !domains.includes(newDomain)) {
      setDomains([...domains, newDomain])
      setNewDomain('')
    }
  }

  const removeDomain = (domain: string) => {
    setDomains(domains.filter(d => d !== domain))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {subscriber ? 'Edit Subscriber' : 'Create Subscriber'}
          </SheetTitle>
          <SheetDescription>
            {subscriber ? 'Update subscriber information' : 'Add a new subscriber tenant'}
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 mt-6">
          <Field label="ID" required error={errors.id?.message}>
            <Input
              {...register('id')}
              placeholder="e.g., tenant_123"
              disabled={!!subscriber} // Can't change ID for existing subscribers
            />
          </Field>

          <Field label="Name" required error={errors.name?.message}>
            <Input
              {...register('name')}
              placeholder="e.g., Acme Corp"
            />
          </Field>

          <Field label="Client ID" required error={errors.client_id?.message}>
            <Input
              {...register('client_id')}
              placeholder="e.g., client_123"
              disabled={!!subscriber} // Can't change client_id for existing subscribers
            />
          </Field>

          <Field label="Webhook URL" error={errors.webhook_url?.message}>
            <Input
              {...register('webhook_url')}
              placeholder="https://example.com/webhook"
              type="url"
            />
          </Field>

          <Field label="Allowed Domains">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addDomain()
                    }
                  }}
                />
                <Button type="button" onClick={addDomain} size="sm">
                  Add
                </Button>
              </div>
              {domains.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {domains.map((domain) => (
                    <Badge key={domain} variant="secondary" className="flex items-center gap-1">
                      {domain}
                      <button
                        type="button"
                        onClick={() => removeDomain(domain)}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
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
              {subscriber ? 'Update' : 'Create'} Subscriber
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function RotateSecretDialog({
  subscriber,
  onSuccess
}: {
  subscriber: Subscriber
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [secretShown, setSecretShown] = useState(false)
  
  const { rotateSecret } = useSubscriberMutations()

  const handleRotate = () => {
    rotateSecret.mutate({
      id: subscriber.id,
      body: { note: note || undefined }
    }, {
      onSuccess: (response) => {
        setClientSecret(response.data.client_secret)
        setSecretShown(true)
        onSuccess()
      }
    })
  }

  const copySecret = () => {
    navigator.clipboard.writeText(clientSecret)
    toast.success('Client secret copied to clipboard')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Key className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Rotate Client Secret</DialogTitle>
          <DialogDescription>
            Generate a new client secret for {subscriber.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!secretShown ? (
            <Field label="Note (optional)">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason for rotation..."
              />
            </Field>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  New Client Secret
                </h4>
                <p className="text-sm text-yellow-700 mb-3">
                  This is the only time you'll see this secret. Copy it now!
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border border-yellow-300 px-3 py-2 rounded text-sm font-mono">
                    {clientSecret}
                  </code>
                  <Button size="sm" onClick={copySecret}>
                    Copy
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="secret-confirmed"
                  onCheckedChange={(checked) => {
                    if (checked) {
                      // Auto-close after confirmation
                      setTimeout(() => setOpen(false), 1000)
                    }
                  }}
                />
                <Label htmlFor="secret-confirmed" className="text-sm">
                  I have copied the client secret
                </Label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!secretShown ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleRotate}
                disabled={rotateSecret.isPending}
              >
                {rotateSecret.isPending ? 'Rotating...' : 'Rotate Secret'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setOpen(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SubscribersPage() {
  const [filters, setFilters] = useState({
    status: 'all',
    query: '',
    page: 1,
    size: 20
  })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | undefined>()

  const { data, isLoading, error } = useSubscribersList(filters)
  
  const { create, update } = useSubscriberMutations()

  const columns: ColumnDef<Subscriber>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'client_id',
      header: 'Client ID',
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
      cell: ({ row }) => {
        const subscriber = row.original
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingSubscriber(subscriber)
                setDrawerOpen(true)
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <RotateSecretDialog
              subscriber={subscriber}
              onSuccess={() => {
                // Query will automatically refresh
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                window.open(`/pg-admin/spmc/${subscriber.id}?flow=PAYIN`, '_blank')
              }}
              title="Open SPMC"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                window.open(`/pg-admin/routes/${subscriber.id}?flow=PAYIN&mode=UPI_INTENT`, '_blank')
              }}
              title="Open Routes"
            >
              <RouteIcon className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    }
  ]

  const handleCreateSubscriber = (data: SubscriberFormData) => {
    create.mutate(data, {
      onSuccess: (response) => {
        setDrawerOpen(false)
        // Show the client secret if it's returned
        if (response.data.client_secret) {
          toast.success('Subscriber created successfully')
          // You could show a dialog here to display the secret
        }
      }
    })
  }

  const handleUpdateSubscriber = (data: SubscriberFormData) => {
    if (!editingSubscriber) return
    
    update.mutate({
      id: editingSubscriber.id,
      body: data
    }, {
      onSuccess: () => {
        setEditingSubscriber(undefined)
        setDrawerOpen(false)
      }
    })
  }

  const handleFormSubmit = (data: SubscriberFormData) => {
    if (editingSubscriber) {
      handleUpdateSubscriber(data)
    } else {
      handleCreateSubscriber(data)
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
              Subscribers
            </h2>
            <p className='text-muted-foreground'>
              Manage subscriber tenants and their API access
            </p>
          </div>
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button onClick={() => setEditingSubscriber(undefined)}>
                <Plus className="mr-2 h-4 w-4" />
                New Subscriber
              </Button>
            </SheetTrigger>
          </Sheet>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label htmlFor="query-filter">Search</Label>
            <Input
              id="query-filter"
              placeholder="Search by ID, name, or client ID..."
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value, page: 1 }))}
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
                    Error loading subscribers
                  </TableCell>
                </TableRow>
              ) : !data?.content?.length ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <EmptyState
                      title="No subscribers found"
                      description="Create your first subscriber to get started"
                      action={{
                        label: "Create Subscriber",
                        onClick: () => setDrawerOpen(true)
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                data.content.map((subscriber: Subscriber) => (
                  <TableRow key={subscriber.id}>
                    {columns.map((column) => (
                      <TableCell key={getColumnKey(column)}>
                        {renderCell(column, { 
                          original: subscriber, 
                          getValue: (key: string) => subscriber[key as keyof Subscriber] 
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
              Showing {((filters.page - 1) * filters.size) + 1} to {Math.min(filters.page * filters.size, data.meta.total_elements)} of {data.meta.total_elements} subscribers
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

        <SubscriberFormDrawer
          open={drawerOpen}
          onOpenChange={(open) => {
            setDrawerOpen(open)
            if (!open) setEditingSubscriber(undefined)
          }}
          subscriber={editingSubscriber}
          onSubmit={handleFormSubmit}
        />
      </Main>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/pg-admin/subscribers')({
  component: SubscribersPage,
})
