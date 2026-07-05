'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Viewer } from '@/lib/services/roles'

export default function StorefrontHeader({ viewer }: { viewer: Viewer }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [cartCount, setCartCount] = useState(0)

  const isAuthed = viewer.userId !== null

  // Live cart badge from real cart_items. All setState happens inside .then
  // callbacks (deferred) — the sanctioned pattern for syncing with an external
  // system. The not-authed case resolves to a 0 count.
  useEffect(() => {
    const supabase = createClient()
    const load: PromiseLike<number> = !isAuthed
      ? Promise.resolve(0)
      : supabase
          .from('carts')
          .select('id')
          .eq('customer_id', viewer.userId!)
          .maybeSingle()
          .then(({ data: cart }) => {
            if (!cart) return 0
            return supabase
              .from('cart_items')
              .select('quantity')
              .eq('cart_id', cart.id)
              .then(({ data: items }) =>
                (items ?? []).reduce((sum, i) => sum + (i.quantity ?? 0), 0)
              )
          })
    load.then((count) => setCartCount(count))
  }, [isAuthed, viewer.userId])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(query.trim() ? `/?q=${encodeURIComponent(query.trim())}` : '/')
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="h-8 w-8 bg-indigo-800 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            KL
          </span>
          <span className="font-bold text-lg text-slate-900 tracking-tight hidden sm:inline">
            Kinetic Ledger
          </span>
        </Link>

        <form onSubmit={submitSearch} className="flex-1 max-w-lg hidden md:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products, brands, vendors..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
            <button type="submit" aria-label="Search" className="absolute right-2.5 top-2 text-slate-400 hover:text-indigo-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        <div className="flex items-center gap-3 shrink-0">
          {/* Role-aware dashboard links — shown only for roles the viewer holds. */}
          {viewer.isVendor && (
            <Link href="/dashboard" className="text-sm font-medium text-slate-700 hover:text-indigo-800 hidden sm:inline">
              Vendor Dashboard
            </Link>
          )}
          {viewer.isAdmin && (
            <Link href="/admin" className="text-sm font-medium text-slate-700 hover:text-indigo-800 hidden sm:inline">
              Platform Admin
            </Link>
          )}

          {isAuthed ? (
            <>
              <Link
                href="/account/orders"
                className="text-sm font-medium text-slate-700 hover:text-indigo-800 flex items-center gap-1.5"
              >
                <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs uppercase">
                  {(viewer.email ?? '?').charAt(0)}
                </span>
                <span className="hidden sm:inline">My Orders</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="text-xs font-semibold text-slate-500 hover:text-rose-600 cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/account/login" className="text-sm font-medium text-slate-700 hover:text-indigo-800">
                Sign In
              </Link>
              <Link
                href="/account/login?mode=signup"
                className="text-sm font-semibold bg-indigo-800 hover:bg-indigo-900 text-white px-4 py-1.5 rounded-lg shadow-sm transition"
              >
                Sign Up
              </Link>
            </>
          )}

          <Link href="/cart" className="relative p-2 text-slate-600 hover:text-indigo-800 transition" aria-label="Cart">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 h-5 w-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
