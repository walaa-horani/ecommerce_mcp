'use client';

import React from 'react';
import { useAppState } from '@/context/AppStateContext';

export default function RoleSwitcher() {
  const { state, setRole } = useAppState();

  return (
    <div className="bg-[#0F172A] text-white py-2 px-4 flex items-center justify-between border-b border-slate-800 text-xs z-50 sticky top-0">
      <div className="flex items-center gap-2">
        <span className="font-semibold tracking-wider text-indigo-400 uppercase text-[10px]">Antigravity Prototype Frame</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-300">Active Project: <strong className="text-white">Kinetic Ledger Marketplace</strong></span>
      </div>
      
      <div className="flex items-center gap-3">
        <span className="text-slate-400">View Mode:</span>
        <div className="bg-slate-950 p-0.5 rounded-lg flex border border-slate-800">
          <button
            onClick={() => setRole('customer')}
            className={`px-3 py-1 rounded-md transition-all font-medium ${
              state.currentRole === 'customer'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Customer Storefront
          </button>
          <button
            onClick={() => setRole('vendor')}
            className={`px-3 py-1 rounded-md transition-all font-medium ${
              state.currentRole === 'vendor'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vendor Dashboard
          </button>
          <button
            onClick={() => setRole('admin')}
            className={`px-3 py-1 rounded-md transition-all font-medium ${
              state.currentRole === 'admin'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Platform Admin
          </button>
        </div>
      </div>
    </div>
  );
}
