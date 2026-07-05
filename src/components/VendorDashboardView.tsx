'use client';

import React, { useState } from 'react';
import { useAppState } from '@/context/AppStateContext';

type VendorTab = 'overview' | 'products' | 'orders' | 'warehouses' | 'purchase-orders' | 'settings';
type OrderFilter = 'All' | 'Pending' | 'Paid' | 'Fulfilled' | 'Cancelled';

export default function VendorDashboardView() {
  const { state, addProduct, addWarehouse, addPurchaseOrder, updateOrderStatus } = useAppState();

  const [tab, setTab] = useState<VendorTab>('overview');
  
  // Product Form State
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodImage, setProdImage] = useState('https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3');

  // Warehouse Form State
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [whName, setWhName] = useState('');
  const [whLocation, setWhLocation] = useState('');
  const [whCapacity, setWhCapacity] = useState('');

  // Purchase Order Form State
  const [showNewPoModal, setShowNewPoModal] = useState(false);
  const [poSupplier, setPoSupplier] = useState('');
  const [poAmount, setPoAmount] = useState('');

  // Store Settings State
  const [storeName, setStoreName] = useState('TechNova Electronics');
  const [storeDesc, setStoreDesc] = useState('Premium developer peripherals and sensory instrumentation.');
  const [storeEmail, setStoreEmail] = useState('support@technova.io');
  const [storePhone, setStorePhone] = useState('+1 (555) 0199');
  const [storeLogo, setStoreLogo] = useState('https://technova.io/logo.png');
  const [storeCurrency, setStoreCurrency] = useState('USD');
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // API Key State
  const [apiKeyName, setApiKeyName] = useState('My MCP Server Key');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const handleGenerateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingKey(true);
    setKeyError(null);
    setGeneratedKey(null);
    try {
      const { generateVendorApiKey } = await import('@/app/dashboard/actions');
      const key = await generateVendorApiKey(apiKeyName);
      setGeneratedKey(key);
      setApiKeyName('My MCP Server Key');
    } catch (err: any) {
      setKeyError(err.message || 'Failed to generate API Key');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  // Orders Filter State
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('All');

  // Computed metrics
  const myProducts = state.products.filter(p => p.orgId === 'vendor-1'); // Default to TechNova Electronics
  const myOrders = state.orders.filter(o => o.orgId === 'vendor-1');
  const lowStockCount = myProducts.filter(p => p.stock > 0 && p.stock <= 3).length;
  const totalSales = myOrders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.total : 0), 0);

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct({
      name: prodName,
      price: Number(prodPrice),
      description: prodDesc,
      vendor: storeName,
      orgId: 'vendor-1',
      sku: prodSku,
      stock: Number(prodStock),
      isPublished: true,
      image: prodImage,
    });
    setShowAddProductModal(false);
    // Reset Form
    setProdName('');
    setProdPrice('');
    setProdDesc('');
    setProdSku('');
    setProdStock('');
  };

  const handleAddWarehouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addWarehouse({
      name: whName,
      location: whLocation,
      capacity: Number(whCapacity),
      utilized: 0,
      status: 'Active',
    });
    setShowAddWarehouseModal(false);
    // Reset Form
    setWhName('');
    setWhLocation('');
    setWhCapacity('');
  };

  const handleAddPoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPurchaseOrder({
      supplier: poSupplier,
      amount: Number(poAmount),
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
    });
    setShowNewPoModal(false);
    // Reset Form
    setPoSupplier('');
    setPoAmount('');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-[240px] border-r border-[#E2E8F0] bg-white flex flex-col justify-between p-4 sticky top-8 h-[calc(100vh-32px)]">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="h-7 w-7 bg-indigo-800 rounded-lg flex items-center justify-center text-white font-bold text-xs">KL</span>
            <span className="font-bold text-sm text-slate-900 tracking-tight">Kinetic Ops</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z' },
              { id: 'products', label: 'Products', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
              { id: 'orders', label: 'Orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
              { id: 'warehouses', label: 'Warehouses', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5' },
              { id: 'purchase-orders', label: 'Purchase Orders', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id as VendorTab)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  tab === item.id
                    ? 'bg-indigo-50 text-indigo-800'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Plan Badge */}
        <div className="border-t border-[#E2E8F0] pt-4 mt-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Current Plan</span>
              <p className="text-xs font-bold text-slate-800">TechNova Store</p>
            </div>
            <span className="bg-indigo-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              Pro
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto space-y-6">
        
        {/* Topbar inside Main */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 capitalize">
              {tab === 'overview' ? 'Dashboard Overview' : tab.replace('-', ' ')}
            </h1>
            <p className="text-xs text-slate-400">
              Operations portal for {storeName}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {tab === 'products' && (
              <button
                onClick={() => setShowAddProductModal(true)}
                className="bg-indigo-800 hover:bg-indigo-900 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
              >
                + Add Product
              </button>
            )}
            {tab === 'warehouses' && (
              <button
                onClick={() => setShowAddWarehouseModal(true)}
                className="bg-indigo-800 hover:bg-indigo-900 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
              >
                + Add Warehouse
              </button>
            )}
            {tab === 'purchase-orders' && (
              <button
                onClick={() => setShowNewPoModal(true)}
                className="bg-indigo-800 hover:bg-indigo-900 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
              >
                + New Purchase Order
              </button>
            )}
            {tab === 'overview' && (
              <button 
                onClick={() => alert('Exporting sales report CSV...')}
                className="bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
              >
                Export Report
              </button>
            )}
          </div>
        </div>

        {/* TAB: OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Sales', value: `$${totalSales.toFixed(2)}`, desc: 'Active orders revenue', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                { label: 'Orders Volume', value: myOrders.length, desc: 'Processed client orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
                { label: 'Low Stock Alerts', value: lowStockCount, desc: 'Requires replenishment', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
                { label: 'Active Products', value: myProducts.length, desc: 'Published catalog', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2' }
              ].map((card, idx) => (
                <div key={idx} className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{card.label}</span>
                    <h3 className="text-xl font-bold text-slate-900 tabular-nums">{card.value}</h3>
                    <p className="text-[10px] text-slate-400">{card.desc}</p>
                  </div>
                  <div className="h-10 w-10 bg-indigo-50 text-indigo-800 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Middle Section: Recent Orders & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Orders Table */}
              <div className="lg:col-span-2 bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm border-b border-[#E2E8F0] pb-2 uppercase tracking-wide">
                  Recent Orders
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
                    <thead className="bg-[#F8FAFC]">
                      <tr>
                        <th className="px-4 py-2 text-left font-bold text-slate-500 uppercase">Order ID</th>
                        <th className="px-4 py-2 text-left font-bold text-slate-500 uppercase">Customer</th>
                        <th className="px-4 py-2 text-right font-bold text-slate-500 uppercase">Total</th>
                        <th className="px-4 py-2 text-center font-bold text-slate-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {myOrders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-bold text-slate-900 font-mono">{order.id}</td>
                          <td className="px-4 py-3 text-slate-600">{order.customerName}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">${order.total.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              order.status === 'Paid'
                                ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                                : order.status === 'Fulfilled'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div className="bg-white rounded-lg border-l-4 border-l-[#D97706] border border-[#E2E8F0] shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm border-b border-[#E2E8F0] pb-2 uppercase tracking-wide flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-[#D97706]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Low Stock Alerts
                </h3>
                <div className="space-y-3">
                  {myProducts.filter(p => p.stock > 0 && p.stock <= 3).map((prod) => (
                    <div key={prod.id} className="p-3 bg-amber-50/30 rounded-lg border border-amber-100 flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-slate-900 block font-semibold">{prod.name}</strong>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">SKU: {prod.sku}</span>
                      </div>
                      <span className="bg-[#D97706] text-white px-2 py-0.5 rounded-full font-bold text-[10px] tabular-nums">
                        {prod.stock} left
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PRODUCTS */}
        {tab === 'products' && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                    <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {myProducts.map((prod) => {
                    const isLow = prod.stock > 0 && prod.stock <= 3;
                    const isOut = prod.stock === 0;

                    return (
                      <tr key={prod.id} className="hover:bg-indigo-50/10">
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-400 uppercase">{prod.sku}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">{prod.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-900 tabular-nums">${prod.price.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-600 tabular-nums">{prod.stock}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isOut
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : isLow
                              ? 'bg-amber-50 text-[#D97706] border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: ORDERS */}
        {tab === 'orders' && (
          <div className="space-y-4">
            {/* Filter buttons */}
            <div className="flex gap-2">
              {['All', 'Pending', 'Paid', 'Fulfilled', 'Cancelled'].map((f) => (
                <button
                  key={f}
                  onClick={() => setOrderFilter(f as OrderFilter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    orderFilter === f
                      ? 'bg-indigo-800 border-indigo-800 text-white shadow-sm'
                      : 'bg-white border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
                  <thead className="bg-[#F8FAFC]">
                    <tr>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase">Order ID</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase">Items</th>
                      <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase">Total Amount</th>
                      <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase">Actions</th>
                      <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {myOrders
                      .filter(o => orderFilter === 'All' || o.status === orderFilter)
                      .map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 font-mono">{order.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-700">{order.customerName}</td>
                          <td className="px-6 py-4 text-slate-400 max-w-[200px] truncate">{order.items.join(', ')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-900 tabular-nums">${order.total.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center space-x-1.5">
                            {order.status === 'Paid' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'Fulfilled')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
                              >
                                Fulfill
                              </button>
                            )}
                            {order.status !== 'Cancelled' && order.status !== 'Fulfilled' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'Cancelled')}
                                className="bg-rose-50 text-rose-700 hover:bg-rose-100 text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              order.status === 'Paid'
                                ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                                : order.status === 'Fulfilled'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : order.status === 'Cancelled'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: WAREHOUSES */}
        {tab === 'warehouses' && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase">Warehouse Name</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase">Total Capacity</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase">Utilized Capacity</th>
                    <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {state.warehouses.map((wh) => (
                    <tr key={wh.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">{wh.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">{wh.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-700 tabular-nums">{wh.capacity.toLocaleString()} units</td>
                      <td className="px-6 py-4 whitespace-nowrap max-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                wh.utilized >= 90 ? 'bg-rose-600' : wh.utilized >= 70 ? 'bg-amber-500' : 'bg-indigo-600'
                              }`} 
                              style={{ width: `${wh.utilized}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-slate-800 tabular-nums">{wh.utilized}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          wh.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-[#D97706] border border-amber-200'
                        }`}>
                          {wh.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: PURCHASE ORDERS */}
        {tab === 'purchase-orders' && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase">PO #</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase">Supplier</th>
                    <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase">Total Amount</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase">Date Created</th>
                    <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {state.purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 font-mono">{po.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-semibold">{po.supplier}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-900 tabular-nums">${po.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">{po.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          po.status === 'Paid'
                            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            : po.status === 'Fulfilled'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: SETTINGS */}
        {tab === 'settings' && (
          <div className="max-w-xl">
            {settingsSuccess && (
              <div className="bg-emerald-50 border-l-4 border-[#059669] p-3 rounded-lg mb-6 shadow-sm">
                <p className="text-xs text-emerald-800 font-medium">Store settings successfully saved!</p>
              </div>
            )}

            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6">
              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-500 uppercase mb-1">Store Name</label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-500 uppercase mb-1">Store Description</label>
                    <textarea
                      value={storeDesc}
                      onChange={(e) => setStoreDesc(e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 uppercase mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={storeEmail}
                      onChange={(e) => setStoreEmail(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 uppercase mb-1">Support Phone</label>
                    <input
                      type="text"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 uppercase mb-1">Currency</label>
                    <select
                      value={storeCurrency}
                      onChange={(e) => setStoreCurrency(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                    >
                      <option>USD</option>
                      <option>EUR</option>
                      <option>GBP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 uppercase mb-1">Store Logo URL</label>
                    <input
                      type="text"
                      value={storeLogo}
                      onChange={(e) => setStoreLogo(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-indigo-800 hover:bg-indigo-900 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition text-xs cursor-pointer"
                >
                  Save Settings
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6 mt-6">
              <h3 className="font-bold text-slate-900 text-sm border-b border-[#E2E8F0] pb-2 uppercase tracking-wide mb-4">
                MCP API Keys
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Generate an API key to securely connect your store to Claude Code or the MCP Inspector. 
                <strong className="text-rose-600"> You will only see the raw key once.</strong>
              </p>
              
              {keyError && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded-lg mb-4 text-xs text-rose-800 font-medium">
                  {keyError}
                </div>
              )}

              {generatedKey ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-bold text-emerald-800 text-xs">New API Key Generated!</h4>
                  <p className="text-[10px] text-emerald-700">Please copy this key now. For security reasons, we will never show it again.</p>
                  <div className="bg-white border border-emerald-200 p-2 rounded text-xs font-mono break-all text-slate-900 select-all">
                    {generatedKey}
                  </div>
                  <button
                    onClick={() => setGeneratedKey(null)}
                    className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                  >
                    I have copied my key
                  </button>
                </div>
              ) : (
                <form onSubmit={handleGenerateApiKey} className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-500 text-xs uppercase mb-1">Key Name</label>
                    <input
                      type="text"
                      required
                      value={apiKeyName}
                      onChange={(e) => setApiKeyName(e.target.value)}
                      placeholder="My MCP Server Key"
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isGeneratingKey}
                    className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition text-xs cursor-pointer"
                  >
                    {isGeneratingKey ? 'Generating...' : 'Generate New API Key'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </main>

      {/* MODALS */}
      {/* MODAL: ADD PRODUCT */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-md max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-[#E2E8F0] pb-2">Add New Product</h3>
            <form onSubmit={handleAddProductSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="Mechanical Keyboard Pro"
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="129.99"
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Initial Stock</label>
                  <input
                    type="number"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="10"
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    placeholder="SKU-KB-PRO"
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Image URL</label>
                  <input
                    type="text"
                    required
                    value={prodImage}
                    onChange={(e) => setProdImage(e.target.value)}
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea
                  required
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-800 hover:bg-indigo-900 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition cursor-pointer"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD WAREHOUSE */}
      {showAddWarehouseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-md max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-[#E2E8F0] pb-2">Add New Warehouse</h3>
            <form onSubmit={handleAddWarehouseSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Warehouse Name</label>
                <input
                  type="text"
                  required
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  placeholder="Warehouse D"
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={whLocation}
                  onChange={(e) => setWhLocation(e.target.value)}
                  placeholder="East depot"
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Total Capacity (units)</label>
                <input
                  type="number"
                  required
                  value={whCapacity}
                  onChange={(e) => setWhCapacity(e.target.value)}
                  placeholder="10000"
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowAddWarehouseModal(false)}
                  className="bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-800 hover:bg-indigo-900 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition cursor-pointer"
                >
                  Add Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW PO */}
      {showNewPoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-md max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-[#E2E8F0] pb-2">New Purchase Order</h3>
            <form onSubmit={handleAddPoSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Supplier Name</label>
                <input
                  type="text"
                  required
                  value={poSupplier}
                  onChange={(e) => setPoSupplier(e.target.value)}
                  placeholder="Apex Components"
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Total Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={poAmount}
                  onChange={(e) => setPoAmount(e.target.value)}
                  placeholder="1500.00"
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowNewPoModal(false)}
                  className="bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-800 hover:bg-indigo-900 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition cursor-pointer"
                >
                  Create PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
