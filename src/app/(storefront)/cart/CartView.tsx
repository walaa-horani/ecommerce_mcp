'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { CartSummary } from '@/lib/services/cart'
import { removeCartItem, updateCartItemQuantity } from './actions'

const TAX_RATE = 0.1
const money = (v: number) => `$${v.toFixed(2)}`

export default function CartView({ summary }: { summary: CartSummary }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { groups, subtotal } = summary
  const tax = Number((subtotal * TAX_RATE).toFixed(2))
  const total = Number((subtotal + tax).toFixed(2))
  const isEmpty = groups.length === 0

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (!res.ok && res.error) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Shopping Cart</h1>
        <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-indigo-800 flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Continue Shopping
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {isEmpty ? (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 sm:p-16 text-center space-y-4 shadow-sm">
          <svg className="mx-auto h-14 w-14 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="font-semibold text-slate-700 text-lg">Your cart is empty</h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">Add products to your cart and check out securely.</p>
          <Link href="/" className="inline-block bg-indigo-800 hover:bg-indigo-900 text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-sm transition">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {groups.map((group) => (
              <div key={group.orgId} className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
                <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-2.5 flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sold by {group.vendorName}</span>
                </div>

                <div className="divide-y divide-[#E2E8F0]">
                  {group.items.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl || 'https://placehold.co/128x128/e2e8f0/94a3b8?text=No+Image'}
                          alt={item.name}
                          className="h-16 w-16 flex-shrink-0 object-cover rounded-lg border border-[#E2E8F0] bg-slate-100"
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-slate-900 leading-tight truncate">{item.name}</h4>
                          <span className="text-xs text-slate-400 font-mono mt-0.5 block">{item.sku}</span>
                          <span className="text-xs text-slate-500 mt-0.5 block">{money(item.price)} each</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 justify-between w-full sm:w-auto">
                        <div className="flex items-center border border-[#E2E8F0] rounded-lg overflow-hidden bg-[#F8FAFC]">
                          <button
                            disabled={isPending}
                            onClick={() => run(() => updateCartItemQuantity(item.id, item.quantity - 1))}
                            className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="px-3 text-sm font-medium text-slate-800 tabular-nums select-none min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            disabled={isPending}
                            onClick={() => run(() => updateCartItemQuantity(item.id, item.quantity + 1))}
                            className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-900 block tabular-nums">{money(item.lineTotal)}</span>
                          <button
                            disabled={isPending}
                            onClick={() => run(() => removeCartItem(item.id))}
                            className="text-[11px] text-rose-500 hover:underline font-semibold mt-0.5 cursor-pointer disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6 h-fit space-y-4 lg:sticky lg:top-24">
            <h3 className="font-bold text-slate-900 border-b border-[#E2E8F0] pb-2 text-sm uppercase tracking-wide">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal ({summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'})</span>
                <span className="tabular-nums">{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Shipping</span>
                <span className="tabular-nums font-medium text-emerald-600">FREE</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Estimated Tax (10%)</span>
                <span className="tabular-nums">{money(tax)}</span>
              </div>
            </div>
            <div className="border-t border-[#E2E8F0] pt-4 flex justify-between items-baseline">
              <span className="font-bold text-sm text-slate-800">Total</span>
              <span className="font-extrabold text-xl text-[#D97706] tabular-nums">{money(total)}</span>
            </div>
            <Link
              href="/checkout"
              className="block w-full text-center bg-[#D97706] hover:bg-amber-700 text-white font-bold py-2.5 rounded-lg shadow-sm transition text-sm"
            >
              Checkout
            </Link>
            <p className="text-[11px] text-slate-400 text-center">Secure checkout · orders placed per vendor</p>
          </div>
        </div>
      )}
    </div>
  )
}
