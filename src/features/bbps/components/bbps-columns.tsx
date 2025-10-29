import React from 'react';
import TransactionReceipt from './bbps-downloadOrderReciept';
import { ColumnDef } from '@tanstack/react-table'
import type { Transaction } from './transactions-table'
import { DataTableColumnHeader } from './data-table-column-header'

export const bbpsColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Transaction ID' />
    ),
  },
  
  {
    accessorKey: 'customerId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Customer ID' />
    ),
  },
  {
    accessorKey: 'account_no',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Account No' />
    ),
  },
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Category' />
    ),
  },
  {
    accessorKey: 'billerName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Biller Name' />
    ),
  },
  {
    accessorKey: 'billAmount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Bill Amount' />
    ),
  },
  {
    accessorKey: 'billerStatus',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Biller Status' />
    ),
  },
  {
    accessorKey: 'paymentMode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Payment Mode' />
    ),
  },
  {
    accessorKey: 'paymentStatus',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Payment Status' />
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
  },
  {
    accessorKey: 'updaredAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Updated At' />
    ),
  },
  {
    accessorKey: 'pgTxnRefId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='PG Transaction Ref ID' />
    ),
  },
  {
    accessorKey: 'bbpsReferenceCode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='BBPS Reference Code' />
    ),
  },
  {
    accessorKey: 'order_id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Order ID' />
    ),
  },
  {
    accessorKey: 'txn_error_code',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Transaction Error Code' />
    ),
  },
  {
    accessorKey: 'txn_error_msg',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Transaction Error Message' />
    ),
  },
  {
    accessorKey: 'status_error_code',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status Error Code' />
    ),
  },
  {
    accessorKey: 'status_error_msg',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status Error Message' />
    ),
  },
  {
    accessorKey: 'download_order_details',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Download Order Details' />
    ),
    cell: ({ row }) => {
      const [open, setOpen] = React.useState(false);
      const [loading, setLoading] = React.useState(false);
      const [transactionData, setTransactionData] = React.useState(null);
      const [error, setError] = React.useState('');

      const handleDownloadClick = async () => {
        setLoading(true);
        setError('');
        try {
          const token = document.cookie.match(/(?:^|; )auth_token=([^;]*)/)?.[1];
          const axios = (await import('axios')).default;
          const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
          const response = await axios.get(
            `${BACKEND_BASE_URL}/v1/bbps/orderDetails/${row.original.order_id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              withCredentials: true,
            }
          );
          // Pass backend response with order_id from the row
          setTransactionData({
            ...response.data,
            order_id: row.original.order_id
          });
          setOpen(true);
        } catch (err) {
          setError('Failed to fetch transaction details');
        } finally {
          setLoading(false);
        }
      };

      return (
        <>
          {(row.original.billerStatus?.toUpperCase() === 'SUCCESS') && (
            <button
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
              onClick={handleDownloadClick}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Download Receipt'}
            </button>
          )}
          {open && transactionData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
                <button
                  className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 rounded-full transition-colors duration-200 shadow-md"
                  onClick={() => setOpen(false)}
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <TransactionReceipt transactionData={transactionData} />
              </div>
            </div>
          )}
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </>
      );
    },
  }
]
