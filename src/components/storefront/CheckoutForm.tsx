'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { checkout } from '@/app/(storefront)/cart/actions'

const money = (v: number) => `$${v.toFixed(2)}`

export default function CheckoutForm({
  subtotal,
  tax,
  total,
}: {
  subtotal: number
  tax: number
  total: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [placed, setPlaced] = useState<{ orderCount: number; total: number } | null>(null)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await checkout(formData)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setPlaced({ orderCount: res.orderCount, total: res.total })
      router.refresh()
    })
  }

  if (placed) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-8 space-y-6">
          <div className="mx-auto h-16 w-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Order placed!</h2>
            <p className="text-sm text-slate-500">
              {placed.orderCount === 1 ? '1 order was created' : `${placed.orderCount} orders were created`}{' '}
              across your vendors, totaling <span className="font-semibold text-slate-800">{money(placed.total)}</span>.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/account/orders" className="flex-1 bg-indigo-800 hover:bg-indigo-900 text-white font-bold py-2.5 rounded-lg shadow-sm transition text-sm">
              View Orders
            </Link>
            <Link href="/" className="flex-1 border border-[#E2E8F0] text-slate-700 hover:bg-slate-50 font-bold py-2.5 rounded-lg transition text-sm">
              Keep Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const inputClass =
    'w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-600'
  const labelClass = 'block text-xs font-bold text-slate-500 uppercase mb-1'

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6 space-y-6">
          <h3 className="font-semibold text-slate-950 text-sm uppercase tracking-wide border-b border-[#E2E8F0] pb-2">
            Shipping Address
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="fullName">Full Name</label>
              <input id="fullName" name="fullName" required defaultValue="" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="address">Address</label>
              <input id="address" name="address" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="city">City</label>
              <input id="city" name="city" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="zip">ZIP / Postal Code</label>
              <input id="zip" name="zip" required className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="country">Country</label>
              <select id="country" name="country" defaultValue="United States" className={inputClass}>
                <option>United States</option>
                <option>United Kingdom</option>
                <option>Canada</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6 h-fit space-y-4 lg:sticky lg:top-24">
        <h3 className="font-bold text-slate-900 border-b border-[#E2E8F0] pb-2 text-sm uppercase tracking-wide">
          Order Summary
        </h3>
        <div className="space-y-2 text-sm text-slate-500">
          <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{money(subtotal)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span className="text-emerald-600 font-medium">FREE</span></div>
          <div className="flex justify-between"><span>Estimated Tax (10%)</span><span className="tabular-nums">{money(tax)}</span></div>
        </div>
        <div className="border-t border-[#E2E8F0] pt-4 flex justify-between items-baseline">
          <span className="font-bold text-sm text-slate-800">Total</span>
          <span className="font-extrabold text-xl text-[#D97706] tabular-nums">{money(total)}</span>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#D97706] hover:bg-amber-700 text-white font-bold py-2.5 rounded-lg shadow-sm transition text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? 'Placing order…' : 'Place Order'}
        </button>
      </div>
    </form>
  )
}
