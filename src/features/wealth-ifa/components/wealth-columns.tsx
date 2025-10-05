import { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from './data-table-column-header'
import { StatusCell } from './status-cell'
import type { WealthData } from './wealth-table'

 export const wealthColumns = (
  searchParams: {
    customerId: string
    mobile: string
    pan: string
    email: string
  } | null,
  pageIndex: number,
  handleFileDownload?: (url: string, name: string) => void
): ColumnDef<WealthData>[] => [
  // --- STATUS FIRST ---
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => (
      <StatusCell
        data={{
          name: row.original.name,
          status: row.original.status,
          customerId: row.original.customerId,
        }}
        searchParams={searchParams}
        pageIndex={pageIndex}
      />
    ),
  },
  // --- DB ORDER STARTS ---
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='ID' />
    ),
  },
  {
    accessorKey: 'entity_type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Entity Type' />
    ),
  },
  {
    accessorKey: 'customerId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Customer ID' />
    ),
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
  },
  {
    accessorKey: 'mobile',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Registered Mobile' />
    ),
  },
  {
    accessorKey: 'product',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Product' />
    ),
  },
  {
    accessorKey: 'pan',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='PAN' />
    ),
  },
  {
    accessorKey: 'accountNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Account Number' />
    ),
  },
  {
    accessorKey: 'bankName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Bank Name' />
    ),
  },
  {
    accessorKey: 'ifsc',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='IFSC' />
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
  },
  {
    accessorKey: 'aadhar',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Aadhar' />
    ),
  },
  {
    accessorKey: 'panImgUrl',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='PAN Image' />
    ),
    cell: ({ row }) => {
      const url = row.original.panImgUrl
      return url ? (
        <button
          className='text-blue-600 hover:underline'
          onClick={() =>
            handleFileDownload?.(url, `${row.original.customerId}_PAN`)
          }
        >
          Download PAN
        </button>
      ) : (
        <span className='text-gray-400'>N/A</span>
      )
    },
  },
  {
    accessorKey: 'aadharImgUrl',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Aadhar Image' />
    ),
    cell: ({ row }) => {
      const url = row.original.aadharImgUrl
      return url ? (
        <button
          className='text-blue-600 hover:underline'
          onClick={() =>
            handleFileDownload?.(url, `${row.original.customerId}_Aadhar`)
          }
        >
          Download Aadhar
        </button>
      ) : (
        <span className='text-gray-400'>N/A</span>
      )
    },
  },
  {
    accessorKey: 'cancelledChequeImgUrl',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Cancelled Cheque' />
    ),
    cell: ({ row }) => {
      const url = row.original.cancelledChequeImgUrl
      return url ? (
        <button
          className='text-blue-600 hover:underline'
          onClick={() =>
            handleFileDownload?.(
              url,
              `${row.original.customerId}_Cancelled_Cheque`
            )
          }
        >
          Download Cancelled Cheque
        </button>
      ) : (
        <span className='text-gray-400'>N/A</span>
      )
    },
  },
  {
    accessorKey: 'arn',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='ARN' />
    ),
  },
  {
    accessorKey: 'company_type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Company Type' />
    ),
  },
  {
    accessorKey: 'companyName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Company Name' />
    ),
  },
  {
<<<<<<< HEAD
    accessorKey: 'personal_mobile',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Personal Mobile' />
    ),
  },
  {
    accessorKey: 'gstin',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='GSTIN' />
    ),
  },
  {
=======
>>>>>>> NLV-1371_new
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
  },
  {
    accessorKey: 'updated_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Updated At' />
    ),
  },
<<<<<<< HEAD
  {
    accessorKey: 'reason',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Reason' />
    ),
  },
=======
>>>>>>> NLV-1371_new
]
