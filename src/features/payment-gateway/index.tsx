 


import { useState, useEffect } from 'react'
import axios from 'axios'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { TableSelector, TableOption } from './components/TableSelector'
import { ActionButtons } from './components/ActionButtons'
import { EntityTable, TableColumn } from './components/EntityTable'
import { EntityModal } from './components/EntityModal'

const TABLES: TableOption[] = [
  { key: 'payment-category-clients', label: 'Payment Category Clients' },
  { key: 'payment-gateways', label: 'Payment Gateways' },
  { key: 'merchants', label: 'Merchants' },
  { key: 'merchant-mode-config-fee', label: 'Merchant Mode Config Fee' }
]

const API_URLS: Record<string, string> = {
  'payment-category-clients': '/api/v1/payment-category-clients',
  'payment-gateways': '/api/v1/payment-gateways',
  'merchants': '/api/v1/payment-gateways/razorpay_v1/merchants', // Example, make dynamic
  'merchant-mode-config-fee': '/api/v1/merchant-mode-config/fee'
}

function getColumnsForTable(table: string): TableColumn[] {
  switch (table) {
    case 'payment-category-clients':
      return [
        { key: 'client_id', label: 'Client ID' },
        { key: 'category_name', label: 'Category Name' },
        { key: 'gateway_id', label: 'Gateway ID' },
        { key: 'merchant_id', label: 'Merchant ID' },
        { key: 'service_name', label: 'Service Name' },
        { key: 'acknowledgement_fn', label: 'Ack Function' },
      ]
    case 'payment-gateways':
      return [
        { key: 'gateway_id', label: 'Gateway ID' },
        { key: 'gateway_name', label: 'Gateway Name' },
        { key: 'currency', label: 'Currency' },
        { key: 'callback_url', label: 'Callback URL' },
      ]
    case 'merchants':
      return [
        { key: 'merchant_ref', label: 'Merchant Ref' },
        { key: 'display_name', label: 'Display Name' },
        { key: 'status', label: 'Status' },
      ]
    case 'merchant-mode-config-fee':
      return [
        { key: 'client_id', label: 'Client ID' },
        { key: 'category_name', label: 'Category Name' },
        { key: 'txn_flow', label: 'Txn Flow' },
        { key: 'mode_id', label: 'Mode ID' },
        { key: 'fee', label: 'Fee' },
        { key: 'enabled', label: 'Enabled' },
      ]
    default:
      return []
  }
}


export default function PaymentGateway() {
  const [selectedTable, setSelectedTable] = useState(TABLES[0].key)
  const [tableData, setTableData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [modalType, setModalType] = useState(TABLES[0].key)
  const token = '' // TODO: get from auth context or cookie

  useEffect(() => {
    setLoading(true)
    if (!token) {
      setTableData([])
      setLoading(false)
      return
    }
    axios.get(API_URLS[selectedTable], {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setTableData(res.data.data))
      .catch(() => {
        setTableData([])
      })
      .finally(() => setLoading(false))
  }, [selectedTable, token])

  const handleModalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = Object.fromEntries(new FormData(form).entries())
    let url = ''
    let method: 'post' | 'put' = 'post'
    switch (modalType) {
      case 'payment-gateways':
        url = '/api/v1/payment-gateways'
        break
      case 'merchants':
        url = '/api/v1/payment-gateways/razorpay_v1/merchants'
        break
      case 'payment-category-clients':
        url = '/api/v1/payment-category-clients'
        break
      case 'merchant-mode-config-fee':
        url = '/api/v1/merchant-mode-config/fee'
        method = 'put'
        break
    }
    await axios[method](url, formData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setShowCreateModal(false)
    setShowUpdateModal(false)
    // Optionally refetch table data
  }

  const renderModalForm = (type: string, onSubmit: (e: React.FormEvent<HTMLFormElement>) => void) => {
    switch (type) {
      case 'payment-gateways':
        return (
          <form onSubmit={onSubmit} className="flex flex-col gap-2">
            <input name="gateway_id" placeholder="Gateway ID" required className="bg-white dark:bg-gray-800 text-black dark:text-white border dark:border-gray-700 px-2 py-1 rounded" />
            <input name="gateway_name" placeholder="Gateway Name" required className="bg-white dark:bg-gray-800 text-black dark:text-white border dark:border-gray-700 px-2 py-1 rounded" />
            <input name="currency" placeholder="Currency" required className="bg-white dark:bg-gray-800 text-black dark:text-white border dark:border-gray-700 px-2 py-1 rounded" />
            <input name="callback_url" placeholder="Callback URL" required className="bg-white dark:bg-gray-800 text-black dark:text-white border dark:border-gray-700 px-2 py-1 rounded" />
            <button type="submit" className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-1 rounded">Submit</button>
          </form>
        )
      case 'merchants':
        return (
          <form onSubmit={onSubmit} className="flex flex-col gap-2">
            <input name="merchant_ref" placeholder="Merchant Ref" required className="bg-white dark:bg-gray-800 text-black dark:text-white border dark:border-gray-700 px-2 py-1 rounded" />
            <input name="display_name" placeholder="Display Name" required className="bg-white dark:bg-gray-800 text-black dark:text-white border dark:border-gray-700 px-2 py-1 rounded" />
            <select name="status" className="bg-white dark:bg-gray-800 text-black dark:text-white border dark:border-gray-700 px-2 py-1 rounded">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            <button type="submit" className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-1 rounded">Submit</button>
          </form>
        )
      case 'payment-category-clients':
        return (
          <form onSubmit={onSubmit} className="flex flex-col gap-2">
            <input name="client_id" placeholder="Client ID" required className="bg-white dark:bg-gray-800 text-black dark:text-white border dark:border-gray-700 px-2 py-1 rounded" />
            <input name="category_name" placeholder="Category Name" required className="bg-white dark:bg-gray-800 text-black dark:text-white border dark:border-gray-700 px-2 py-1 rounded" />
            <input name="gateway_id" placeholder="Gateway ID" required className="bg-white dark:bg-gray-800 text-black dark:text-white border dark:border-gray-700 px-2 py-1 rounded" />
            <input name="merchant_id" placeholder="Merchant ID" required className="bg-white dark:bg-gray-800 text-black dark:text-white border dark:border-gray-700 px-2 py-1 rounded" />
            <button type="submit" className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-1 rounded">Submit</button>
          </form>
        )
      case 'merchant-mode-config-fee':
        return (
          <form onSubmit={onSubmit} className="flex flex-col gap-2">
            <input name="client_id" placeholder="Client ID" required className="bg-white dark:bg-gray-800 text-black dark:text-white border dark:border-gray-700 px-2 py-1 rounded" />
            <input name="category_name" placeholder="Category Name" required className="bg-white dark:bg-gray-800 text-black dark:text-white border dark:border-gray-700 px-2 py-1 rounded" />
            <input name="txn_flow" placeholder="Txn Flow" required className="bg-white dark:bg-gray-800 text-black dark:text-white border dark:border-gray-700 px-2 py-1 rounded" />
            <input name="mode_id" placeholder="Mode ID" required className="bg-white dark:bg-gray-800 text-black dark:text-white border dark:border-gray-700 px-2 py-1 rounded" />
            <input name="fee" placeholder="Fee (JSON)" required className="bg-white dark:bg-gray-800 text-black dark:text-white border dark:border-gray-700 px-2 py-1 rounded" />
            <select name="enabled" className="bg-white dark:bg-gray-800 text-black dark:text-white border dark:border-gray-700 px-2 py-1 rounded">
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
            <button type="submit" className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-1 rounded">Submit</button>
          </form>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-inherit dark:bg-inherit text-black dark:text-white">
      <Header>
        <Search />
        <div className="ml-auto flex items-center gap-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className="mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Payment Gateway Management
            </h2>
            <p className="text-muted-foreground">
              Manage payment gateways, merchants, and configs with detailed filters.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <TableSelector
            options={TABLES}
            value={selectedTable}
            onChange={setSelectedTable}
          />
          <ActionButtons
            onCreate={() => { setShowCreateModal(true); setModalType(selectedTable) }}
            onUpdate={() => { setShowUpdateModal(true); setModalType(selectedTable) }}
            entityLabel={TABLES.find(t => t.key === selectedTable)?.label || ''}
          />
        </div>
        <EntityTable
          columns={getColumnsForTable(selectedTable)}
          data={tableData}
          loading={loading}
        />
        {(!loading && tableData.length === 0) && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-4">No data available. Table structure is shown for preview.</div>
        )}
        <EntityModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title={`Create ${TABLES.find(t => t.key === modalType)?.label || ''}`}
        >
          {renderModalForm(modalType, handleModalSubmit)}
        </EntityModal>
        <EntityModal
          open={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          title={`Update ${TABLES.find(t => t.key === modalType)?.label || ''}`}
        >
          {renderModalForm(modalType, handleModalSubmit)}
        </EntityModal>
      </Main>
    </div>
  )
}


