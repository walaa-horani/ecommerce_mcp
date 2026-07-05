'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AdminDashboardView() {
  const supabase = createClient();
  const [vendors, setVendors] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<any>(null);

  const [tab, setTab] = useState<'vendors' | 'settings'>('vendors');
  
  // Settings Form State
  const [fee, setFee] = useState('0');
  const [freeCost, setFreeCost] = useState('0');
  const [proCost, setProCost] = useState('0');
  const [status, setStatus] = useState(true);
  const [banner, setBanner] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      // Vendors
      const { data: orgs } = await supabase.from('organizations').select('*');
      if (orgs) {
        setVendors(orgs.map(o => ({
          id: o.id,
          name: o.name,
          plan: 'Free', // Mocked plan for now
          isActive: true, // Mocked status
          productCount: 0,
          orderCount: 0
        })));
      }

      // Settings
      const { data: sets } = await supabase.from('platform_settings').select('*').limit(1).single();
      if (sets) {
        setPlatformSettings(sets);
        setFee((sets.global_fee || 0).toString());
        setFreeCost((sets.free_plan_cost || 0).toString());
        setProCost((sets.pro_plan_cost || 0).toString());
        setStatus(sets.platform_status === 'online');
        setBanner(sets.global_banner || '');
      }
    }
    loadData();
  }, []);

  const toggleVendorStatus = (id: string) => {
    // Requires updating org status
  };

  const updateVendorPlan = (id: string, plan: string) => {
    // Requires updating org plan
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (platformSettings) {
      await supabase.from('platform_settings').update({
        global_fee: Number(fee),
        free_plan_cost: Number(freeCost),
        pro_plan_cost: Number(proCost),
        platform_status: status ? 'online' : 'maintenance',
        global_banner: banner
      }).eq('id', platformSettings.id);
    }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-[240px] border-r border-[#E2E8F0] bg-white flex flex-col p-4 sticky top-8 h-[calc(100vh-32px)]">
        <div className="space-y-6 flex-1">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="h-7 w-7 bg-indigo-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">KL</span>
            <span className="font-bold text-sm text-slate-900 tracking-tight">Platform Admin</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <button
              onClick={() => setTab('vendors')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                tab === 'vendors'
                  ? 'bg-indigo-50 text-indigo-800'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Vendors
            </button>
            <button
              onClick={() => setTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                tab === 'settings'
                  ? 'bg-indigo-50 text-indigo-800'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
              Platform Settings
            </button>
          </nav>
        </div>

        <div className="border-t border-[#E2E8F0] pt-4 mt-6">
          <div className="bg-slate-100 rounded-lg p-3 text-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Super Admin Role</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto space-y-6">
        
        {/* Topbar */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 capitalize">
              {tab === 'vendors' ? 'Vendor Management' : 'Platform Settings'}
            </h1>
            <p className="text-xs text-slate-400">
              System-wide metrics and configuration.
            </p>
          </div>
        </div>

        {/* TAB: VENDORS */}
        {tab === 'vendors' && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left font-bold text-slate-500 uppercase">Vendor Name</th>
                    <th scope="col" className="px-6 py-3 text-center font-bold text-slate-500 uppercase">Plan Tier</th>
                    <th scope="col" className="px-6 py-3 text-center font-bold text-slate-500 uppercase">Change Plan</th>
                    <th scope="col" className="px-6 py-3 text-center font-bold text-slate-500 uppercase">Status Toggle</th>
                    <th scope="col" className="px-6 py-3 text-right font-bold text-slate-500 uppercase">Products</th>
                    <th scope="col" className="px-6 py-3 text-right font-bold text-slate-500 uppercase">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">{vendor.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          vendor.plan === 'Pro'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {vendor.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <select
                          value={vendor.plan}
                          onChange={(e) => updateVendorPlan(vendor.id, e.target.value as 'Free' | 'Pro')}
                          className="bg-white border border-[#E2E8F0] rounded-md py-1 px-2 focus:outline-none"
                        >
                          <option value="Free">Free</option>
                          <option value="Pro">Pro</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => toggleVendorStatus(vendor.id)}
                          className={`font-semibold px-3 py-1 rounded text-[10px] border transition cursor-pointer ${
                            vendor.isActive
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                              : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
                          }`}
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

        {/* TAB: SETTINGS */}
        {tab === 'settings' && (
          <div className="max-w-xl">
            {success && (
              <div className="bg-emerald-50 border-l-4 border-[#059669] p-3 rounded-lg mb-6 shadow-sm">
                <p className="text-xs text-emerald-800 font-medium">Platform settings successfully updated!</p>
              </div>
            )}

            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6">
              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-500 uppercase mb-1">Global Transaction Fee (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 uppercase mb-1">Platform Operational Status</label>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setStatus(!status)}
                        className={`px-3 py-1.5 rounded-lg font-bold border transition cursor-pointer ${
                          status
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}
                      >
                        {status ? 'Online (Active)' : 'Offline (Maintenance)'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 uppercase mb-1">Free Plan Cost ($/mo)</label>
                    <input
                      type="number"
                      required
                      value={freeCost}
                      onChange={(e) => setFreeCost(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 uppercase mb-1">Pro Plan Cost ($/mo)</label>
                    <input
                      type="number"
                      required
                      value={proCost}
                      onChange={(e) => setProCost(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-500 uppercase mb-1">Global Banner Alert Message</label>
                    <textarea
                      value={banner}
                      onChange={(e) => setBanner(e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-indigo-800 hover:bg-indigo-900 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition text-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
