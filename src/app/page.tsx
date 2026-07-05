'use client';

import React from 'react';
import { useAppState } from '@/context/AppStateContext';
import RoleSwitcher from '@/components/RoleSwitcher';
import StorefrontView from '@/components/StorefrontView';
import VendorDashboardView from '@/components/VendorDashboardView';
import AdminDashboardView from '@/components/AdminDashboardView';

export default function Home() {
  const { state } = useAppState();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Dynamic System Alert Banner */}
      {state.globalBanner && (
        <div className="bg-amber-500 text-slate-950 py-1.5 px-4 text-center text-[10px] font-bold tracking-wider uppercase border-b border-amber-600 flex items-center justify-center gap-1.5 z-40 sticky top-0">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {state.globalBanner}
        </div>
      )}

      {/* Developer Control Frame */}
      <RoleSwitcher />

      {/* Main View Router */}
      <div className="flex-1 flex flex-col">
        {state.currentRole === 'customer' && <StorefrontView />}
        {state.currentRole === 'vendor' && <VendorDashboardView />}
        {state.currentRole === 'admin' && <AdminDashboardView />}
      </div>
    </div>
  );
}
