'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminVendor, PlatformSettings } from '@/lib/services/admin'
import {
  savePlatformSettingsAction,
  setVendorActiveAction,
  setVendorPlanAction,
} from '@/app/admin/actions'

export default function AdminDashboardView({
  vendors,
  settings,
}: {
  vendors: AdminVendor[]
  settings: PlatformSettings
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<'vendors' | 'settings'>('vendors')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Settings form
  const [fee, setFee] = useState(settings.globalFee.toString())
  const [freeCost, setFreeCost] = useState(settings.freePlanCost.toString())
  const [proCost, setProCost] = useState(settings.proPlanCost.toString())
  const [status, setStatus] = useState(settings.platformStatus)
  const [banner, setBanner] = useState(settings.globalBanner)

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, onOk?: () => void) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) setError(res.error ?? 'Something went wrong.')
      else {
        onOk?.()
        router.refresh()
      }
    })
  }

  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData()
    fd.set('globalFee', fee)
    fd.set('freePlanCost', freeCost)
    fd.set('proPlanCost', proCost)
    fd.set('platformStatus', String(status))
    fd.set('globalBanner', banner)
    run(() => savePlatformSettingsAction(fd), () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <div className="flex flex-1 bg-[#F8FAFC] min-h-[calc(100vh-56px)]">
      <aside className="w-[240px] border-r border-[#E2E8F0] bg-white flex flex-col p-4 sticky top-14 h-[calc(100vh-56px)]">
        <nav className="space-y-1 flex-1">
          <button
            onClick={() => setTab('vendors')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${tab === 'vendors' ? 'bg-indigo-50 text-indigo-800' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Vendors
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${tab === 'settings' ? 'bg-indigo-50 text-indigo-800' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Platform Settings
          </button>
        </nav>
        <div className="border-t border-[#E2E8F0] pt-4">
          <div className="bg-slate-100 rounded-lg p-3 text-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Super Admin Role</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto space-y-6">
        <div className="border-b border-[#E2E8F0] pb-4">
          <h1 className="text-xl font-bold text-slate-900">
            {tab === 'vendors' ? 'Vendor Management' : 'Platform Settings'}
          </h1>
          <p className="text-xs text-slate-400">System-wide metrics and configuration.</p>
        </div>

        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs px-4 py-3 rounded-lg">{error}</div>
        )}

        {tab === 'vendors' && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase">Vendor Name</th>
                    <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase">Plan Tier</th>
                    <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase">Change Plan</th>
                    <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase">Status Toggle</th>
                    <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase">Products</th>
                    <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {vendors.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No vendors yet.</td></tr>
                  ) : vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">{vendor.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${vendor.plan === 'Pro' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {vendor.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <select
                          value={vendor.plan.toLowerCase()}
                          disabled={isPending}
                          onChange={(e) => run(() => setVendorPlanAction(vendor.id, e.target.value as 'free' | 'pro'))}
                          className="bg-white border border-[#E2E8F0] rounded-md py-1 px-2 focus:outline-none disabled:opacity-50"
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          disabled={isPending}
                          onClick={() => run(() => setVendorActiveAction(vendor.id, !vendor.isActive))}
                          className={`font-semibold px-3 py-1 rounded text-[10px] border transition cursor-pointer disabled:opacity-50 ${vendor.isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100' : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'}`}
                        >
                          {vendor.isActive ? 'Active' : 'Suspended'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-700 tabular-nums">{vendor.productCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-700 tabular-nums">{vendor.orderCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="max-w-xl">
            {saved && (
              <div className="bg-emerald-50 border-l-4 border-[#059669] p-3 rounded-lg mb-6 shadow-sm">
                <p className="text-xs text-emerald-800 font-medium">Platform settings saved.</p>
              </div>
            )}
            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6">
              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-500 uppercase mb-1">Global Transaction Fee (%)</label>
                    <input type="number" step="0.1" required value={fee} onChange={(e) => setFee(e.target.value)} className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 uppercase mb-1">Platform Operational Status</label>
                    <div className="flex items-center gap-2 mt-2">
                      <button type="button" onClick={() => setStatus(!status)} className={`px-3 py-1.5 rounded-lg font-bold border transition cursor-pointer ${status ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                        {status ? 'Online (Active)' : 'Offline (Maintenance)'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 uppercase mb-1">Free Plan Cost ($/mo)</label>
                    <input type="number" required value={freeCost} onChange={(e) => setFreeCost(e.target.value)} className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 uppercase mb-1">Pro Plan Cost ($/mo)</label>
                    <input type="number" required value={proCost} onChange={(e) => setProCost(e.target.value)} className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-500 uppercase mb-1">Global Banner Alert Message</label>
                    <textarea value={banner} onChange={(e) => setBanner(e.target.value)} rows={3} className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600" />
                  </div>
                </div>
                <button type="submit" disabled={isPending} className="bg-indigo-800 hover:bg-indigo-900 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition text-xs cursor-pointer disabled:opacity-60">
                  {isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
