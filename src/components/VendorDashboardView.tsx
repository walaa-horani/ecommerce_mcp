'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { VendorDashboardData } from '@/lib/services/vendor-dashboard'
import {
  addProductAction,
  addPurchaseOrderAction,
  addWarehouseAction,
  updateOrderStatusAction,
  updateStoreNameAction,
  generateVendorApiKey,
  type ActionResult,
} from '@/app/dashboard/actions'

type VendorTab = 'overview' | 'products' | 'orders' | 'warehouses' | 'purchase-orders' | 'settings'
type OrderFilter = 'All' | 'Pending' | 'Paid' | 'Fulfilled' | 'Cancelled'

const NAV: { id: VendorTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z' },
  { id: 'products', label: 'Products', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { id: 'orders', label: 'Orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { id: 'warehouses', label: 'Warehouses', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5' },
  { id: 'purchase-orders', label: 'Purchase Orders', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
]

const money = (v: number) => `$${v.toFixed(2)}`
const inputClass = 'w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600'
const labelClass = 'block font-bold text-slate-500 uppercase mb-1'

export default function VendorDashboardView({ data }: { data: VendorDashboardData }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<VendorTab>('overview')
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('All')
  const [modal, setModal] = useState<null | 'product' | 'warehouse' | 'po'>(null)
  const [error, setError] = useState<string | null>(null)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [storeName, setStoreName] = useState(data.store.name)

  // MCP API key generation (Pro feature) — raw key is shown exactly once.
  const [apiKeyName, setApiKeyName] = useState('My MCP Server Key')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)
  const [keyError, setKeyError] = useState<string | null>(null)

  const handleGenerateApiKey = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsGeneratingKey(true)
    setKeyError(null)
    setGeneratedKey(null)
    try {
      const key = await generateVendorApiKey(apiKeyName)
      setGeneratedKey(key)
      setApiKeyName('My MCP Server Key')
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : 'Failed to generate API Key')
    } finally {
      setIsGeneratingKey(false)
    }
  }

  const { products, orders, warehouses, purchaseOrders, metrics, store } = data

  const submit = (fn: () => Promise<ActionResult>, onOk?: () => void) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) setError(res.error)
      else {
        onOk?.()
        router.refresh()
      }
    })
  }

  const onFormSubmit =
    (action: (fd: FormData) => Promise<ActionResult>, onOk?: () => void) =>
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      submit(() => action(fd), onOk)
    }

  const kpis = [
    { label: 'Total Sales', value: money(metrics.totalSales), desc: 'Active orders revenue' },
    { label: 'Orders Volume', value: metrics.ordersVolume, desc: 'Processed client orders' },
    { label: 'Low Stock Alerts', value: metrics.lowStockCount, desc: 'Requires replenishment' },
    { label: 'Active Products', value: metrics.activeProducts, desc: 'Published catalog' },
  ]

  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold)

  return (
    <div className="flex flex-1 bg-[#F8FAFC] min-h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="w-[240px] border-r border-[#E2E8F0] bg-white flex flex-col justify-between p-4 sticky top-14 h-[calc(100vh-56px)]">
        <nav className="space-y-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${tab === item.id ? 'bg-indigo-50 text-indigo-800' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-[#E2E8F0] pt-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center justify-between">
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Current Plan</span>
              <p className="text-xs font-bold text-slate-800 truncate">{store.name}</p>
            </div>
            <span className="bg-indigo-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">{store.plan}</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto space-y-6">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 capitalize">
              {tab === 'overview' ? 'Dashboard Overview' : tab.replace('-', ' ')}
            </h1>
            <p className="text-xs text-slate-400">Operations portal for {store.name}.</p>
          </div>
          <div className="flex items-center gap-2">
            {tab === 'products' && <HeaderButton onClick={() => setModal('product')}>+ Add Product</HeaderButton>}
            {tab === 'warehouses' && <HeaderButton onClick={() => setModal('warehouse')}>+ Add Warehouse</HeaderButton>}
            {tab === 'purchase-orders' && <HeaderButton onClick={() => setModal('po')}>+ New Purchase Order</HeaderButton>}
          </div>
        </div>

        {error && <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs px-4 py-3 rounded-lg">{error}</div>}

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpis.map((card) => (
                <div key={card.label} className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{card.label}</span>
                  <h3 className="text-xl font-bold text-slate-900 tabular-nums">{card.value}</h3>
                  <p className="text-[10px] text-slate-400">{card.desc}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm border-b border-[#E2E8F0] pb-2 uppercase tracking-wide">Recent Orders</h3>
                {orders.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No orders yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
                      <thead className="bg-[#F8FAFC]"><tr>
                        <th className="px-4 py-2 text-left font-bold text-slate-500 uppercase">Order ID</th>
                        <th className="px-4 py-2 text-left font-bold text-slate-500 uppercase">Customer</th>
                        <th className="px-4 py-2 text-right font-bold text-slate-500 uppercase">Total</th>
                        <th className="px-4 py-2 text-center font-bold text-slate-500 uppercase">Status</th>
                      </tr></thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {orders.slice(0, 5).map((o) => (
                          <tr key={o.id}>
                            <td className="px-4 py-3 font-mono text-slate-900">#{o.id.slice(0, 8)}</td>
                            <td className="px-4 py-3 text-slate-600">{o.customerName}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">{money(o.total)}</td>
                            <td className="px-4 py-3 text-center"><StatusBadge status={o.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="bg-white rounded-lg border-l-4 border-l-[#D97706] border border-[#E2E8F0] shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm border-b border-[#E2E8F0] pb-2 uppercase tracking-wide">Low Stock Alerts</h3>
                {lowStock.length === 0 ? (
                  <p className="text-xs text-slate-400">All stock levels healthy.</p>
                ) : lowStock.map((p) => (
                  <div key={p.id} className="p-3 bg-amber-50/30 rounded-lg border border-amber-100 flex justify-between items-center text-xs">
                    <div><strong className="text-slate-900 block font-semibold">{p.name}</strong><span className="text-[10px] text-slate-400 font-mono uppercase">SKU: {p.sku}</span></div>
                    <span className="bg-[#D97706] text-white px-2 py-0.5 rounded-full font-bold text-[10px] tabular-nums">{p.stock} left</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {tab === 'products' && (
          <TableCard>
            <thead className="bg-[#F8FAFC]"><tr>
              <Th>SKU</Th><Th>Product Name</Th><Th right>Price</Th><Th right>Stock</Th><Th center>Status</Th>
            </tr></thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {products.length === 0 ? <EmptyRow cols={5} label="No products yet." /> : products.map((p) => {
                const isOut = p.stock === 0
                const isLow = p.stock > 0 && p.stock <= p.lowStockThreshold
                return (
                  <tr key={p.id} className="hover:bg-indigo-50/10">
                    <td className="px-6 py-4 font-mono text-slate-400 uppercase">{p.sku}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 tabular-nums">{money(p.price)}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600 tabular-nums">{p.stock}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isOut ? 'bg-rose-50 text-rose-800 border border-rose-200' : isLow ? 'bg-amber-50 text-[#D97706] border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </TableCard>
        )}

        {/* ORDERS */}
        {tab === 'orders' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {(['All', 'Pending', 'Paid', 'Fulfilled', 'Cancelled'] as OrderFilter[]).map((f) => (
                <button key={f} onClick={() => setOrderFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${orderFilter === f ? 'bg-indigo-800 border-indigo-800 text-white' : 'bg-white border-[#E2E8F0] text-slate-600 hover:bg-slate-50'}`}>{f}</button>
              ))}
            </div>
            <TableCard>
              <thead className="bg-[#F8FAFC]"><tr>
                <Th>Order ID</Th><Th>Customer</Th><Th>Items</Th><Th right>Total</Th><Th center>Actions</Th><Th center>Status</Th>
              </tr></thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {orders.filter((o) => orderFilter === 'All' || o.status === orderFilter).length === 0 ? (
                  <EmptyRow cols={6} label="No orders." />
                ) : orders.filter((o) => orderFilter === 'All' || o.status === orderFilter).map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono text-slate-900">#{o.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-slate-700">{o.customerName}</td>
                    <td className="px-6 py-4 text-slate-400 max-w-[200px] truncate">{o.items.join(', ')}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 tabular-nums">{money(o.total)}</td>
                    <td className="px-6 py-4 text-center space-x-1.5 whitespace-nowrap">
                      {o.status === 'Paid' && (
                        <button disabled={isPending} onClick={() => submit(() => updateOrderStatusAction(o.id, 'fulfilled'))} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer disabled:opacity-50">Fulfill</button>
                      )}
                      {o.status === 'Pending' && (
                        <button disabled={isPending} onClick={() => submit(() => updateOrderStatusAction(o.id, 'paid'))} className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer disabled:opacity-50">Mark Paid</button>
                      )}
                      {o.status !== 'Cancelled' && o.status !== 'Fulfilled' && (
                        <button disabled={isPending} onClick={() => submit(() => updateOrderStatusAction(o.id, 'cancelled'))} className="bg-rose-50 text-rose-700 hover:bg-rose-100 text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer disabled:opacity-50">Cancel</button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </TableCard>
          </div>
        )}

        {/* WAREHOUSES */}
        {tab === 'warehouses' && (
          <TableCard>
            <thead className="bg-[#F8FAFC]"><tr>
              <Th>Warehouse Name</Th><Th>Location</Th><Th right>Units on Hand</Th>
            </tr></thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {warehouses.length === 0 ? <EmptyRow cols={3} label="No warehouses yet." /> : warehouses.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-slate-900">{w.name}</td>
                  <td className="px-6 py-4 text-slate-500">{w.location ?? '—'}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-700 tabular-nums">{w.unitsOnHand.toLocaleString()} units</td>
                </tr>
              ))}
            </tbody>
          </TableCard>
        )}

        {/* PURCHASE ORDERS */}
        {tab === 'purchase-orders' && (
          <TableCard>
            <thead className="bg-[#F8FAFC]"><tr>
              <Th>PO #</Th><Th>Supplier</Th><Th right>Total Amount</Th><Th>Date Created</Th><Th center>Status</Th>
            </tr></thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {purchaseOrders.length === 0 ? <EmptyRow cols={5} label="No purchase orders yet." /> : purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-mono text-slate-900">#{po.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-slate-700 font-semibold">{po.supplier}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 tabular-nums">{money(po.amount)}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(po.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-center"><StatusBadge status={po.status} /></td>
                </tr>
              ))}
            </tbody>
          </TableCard>
        )}

        {/* SETTINGS */}
        {tab === 'settings' && (
          <div className="max-w-xl">
            {settingsSaved && (
              <div className="bg-emerald-50 border-l-4 border-[#059669] p-3 rounded-lg mb-6 shadow-sm">
                <p className="text-xs text-emerald-800 font-medium">Store settings saved.</p>
              </div>
            )}
            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6">
              <form onSubmit={onFormSubmit(updateStoreNameAction, () => { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 3000) })} className="space-y-4 text-xs">
                <div>
                  <label className={labelClass}>Store Name</label>
                  <input type="text" name="name" required value={storeName} onChange={(e) => setStoreName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Plan</label>
                  <p className="text-sm font-bold text-slate-800">{store.plan} <span className="text-[10px] font-normal text-slate-400">(managed by platform admin)</span></p>
                </div>
                <button type="submit" disabled={isPending} className="bg-indigo-800 hover:bg-indigo-900 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition text-xs cursor-pointer disabled:opacity-60">
                  {isPending ? 'Saving…' : 'Save Settings'}
                </button>
              </form>
            </div>

            {/* MCP API Keys */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6 mt-6">
              <h3 className="font-bold text-slate-900 text-sm border-b border-[#E2E8F0] pb-2 uppercase tracking-wide mb-4">MCP API Keys</h3>
              <p className="text-xs text-slate-500 mb-4">
                Generate an API key to securely connect your store to Claude Desktop or the MCP Inspector.
                <strong className="text-rose-600"> You will only see the raw key once.</strong>
              </p>

              {keyError && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded-lg mb-4 text-xs text-rose-800 font-medium">{keyError}</div>
              )}

              {generatedKey ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-bold text-emerald-800 text-xs">New API Key Generated!</h4>
                  <p className="text-[10px] text-emerald-700">Please copy this key now. For security reasons, we will never show it again.</p>
                  <div className="bg-white border border-emerald-200 p-2 rounded text-xs font-mono break-all text-slate-900 select-all">{generatedKey}</div>
                  <button onClick={() => setGeneratedKey(null)} className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer">I have copied my key</button>
                </div>
              ) : (
                <form onSubmit={handleGenerateApiKey} className="space-y-4">
                  <div>
                    <label className={labelClass}>Key Name</label>
                    <input type="text" required value={apiKeyName} onChange={(e) => setApiKeyName(e.target.value)} placeholder="My MCP Server Key" className={inputClass} />
                  </div>
                  <button type="submit" disabled={isGeneratingKey} className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition text-xs cursor-pointer">
                    {isGeneratingKey ? 'Generating…' : 'Generate New API Key'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {modal === 'product' && (
        <Modal title="Add New Product" onClose={() => setModal(null)}>
          <form onSubmit={onFormSubmit(addProductAction, () => setModal(null))} className="space-y-3">
            <Field label="Product Name"><input name="name" required placeholder="Mechanical Keyboard Pro" className={inputClass} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price ($)"><input name="price" type="number" step="0.01" required placeholder="129.99" className={inputClass} /></Field>
              <Field label="Initial Stock"><input name="initialStock" type="number" min="0" required placeholder="10" className={inputClass} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="SKU"><input name="sku" required placeholder="SKU-KB-PRO" className={inputClass} /></Field>
              <Field label="Image URL"><input name="imageUrl" required placeholder="https://…" className={inputClass} /></Field>
            </div>
            <Field label="Description"><textarea name="description" required rows={3} className={inputClass} /></Field>
            <ModalActions pending={isPending} submitLabel="Add Product" onCancel={() => setModal(null)} />
          </form>
        </Modal>
      )}

      {modal === 'warehouse' && (
        <Modal title="Add New Warehouse" onClose={() => setModal(null)}>
          <form onSubmit={onFormSubmit(addWarehouseAction, () => setModal(null))} className="space-y-3">
            <Field label="Warehouse Name"><input name="name" required placeholder="Warehouse D" className={inputClass} /></Field>
            <Field label="Location"><input name="location" required placeholder="East depot" className={inputClass} /></Field>
            <ModalActions pending={isPending} submitLabel="Add Warehouse" onCancel={() => setModal(null)} />
          </form>
        </Modal>
      )}

      {modal === 'po' && (
        <Modal title="New Purchase Order" onClose={() => setModal(null)}>
          <form onSubmit={onFormSubmit(addPurchaseOrderAction, () => setModal(null))} className="space-y-3">
            <Field label="Supplier Name"><input name="supplier" required placeholder="Apex Components" className={inputClass} /></Field>
            <p className="text-[10px] text-slate-400">Creates a draft PO. Add line items to set its total.</p>
            <ModalActions pending={isPending} submitLabel="Create PO" onCancel={() => setModal(null)} />
          </form>
        </Modal>
      )}
    </div>
  )
}

/* ---- small presentational helpers ---- */

function HeaderButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className="bg-indigo-800 hover:bg-indigo-900 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition cursor-pointer">{children}</button>
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'Paid' ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
      : status === 'Fulfilled' || status === 'Received' ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : status === 'Cancelled' ? 'bg-rose-50 text-rose-800 border-rose-200'
      : 'bg-slate-100 text-slate-800 border-slate-200'
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>{status}</span>
}

function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
      <div className="overflow-x-auto"><table className="min-w-full divide-y divide-[#E2E8F0] text-xs">{children}</table></div>
    </div>
  )
}

function Th({ children, right, center }: { children: React.ReactNode; right?: boolean; center?: boolean }) {
  return <th className={`px-6 py-3 font-bold text-slate-500 uppercase tracking-wider ${right ? 'text-right' : center ? 'text-center' : 'text-left'}`}>{children}</th>
}

function EmptyRow({ cols, label }: { cols: number; label: string }) {
  return <tr><td colSpan={cols} className="px-6 py-8 text-center text-slate-400">{label}</td></tr>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-md max-w-md w-full p-6 space-y-4 text-xs" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-[#E2E8F0] pb-2">{title}</h3>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className={labelClass}>{label}</label>{children}</div>
}

function ModalActions({ pending, submitLabel, onCancel }: { pending: boolean; submitLabel: string; onCancel: () => void }) {
  return (
    <div className="flex gap-2 justify-end pt-3 border-t border-[#E2E8F0]">
      <button type="button" onClick={onCancel} className="bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-lg transition cursor-pointer">Cancel</button>
      <button type="submit" disabled={pending} className="bg-indigo-800 hover:bg-indigo-900 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition cursor-pointer disabled:opacity-60">{pending ? 'Saving…' : submitLabel}</button>
    </div>
  )
}
