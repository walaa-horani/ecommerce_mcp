import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCustomerOrders } from '@/lib/services/orders'

export const metadata: Metadata = { title: 'My Orders - Kinetic Ledger' }

function statusBadge(status: string) {
  const s = status.toLowerCase()
  if (s === 'paid') return 'bg-indigo-50 text-indigo-800 border border-indigo-200'
  if (s === 'fulfilled') return 'bg-emerald-50 text-emerald-800 border border-emerald-200'
  if (s === 'cancelled') return 'bg-rose-50 text-rose-800 border border-rose-200'
  return 'bg-slate-100 text-slate-700 border border-slate-200'
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/account/login?redirect=/account/orders')

  const orders = await getCustomerOrders(supabase, user.id)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 border-b border-[#E2E8F0] pb-3">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 text-center space-y-4 shadow-sm">
          <h3 className="font-semibold text-slate-700 text-lg">No orders yet</h3>
          <p className="text-sm text-slate-400">Your placed orders will appear here.</p>
          <Link
            href="/"
            className="inline-block bg-indigo-800 hover:bg-indigo-900 text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-sm transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-500">#{order.id.slice(0, 8)}</span>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Sold by {order.vendorName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-[#E2E8F0]">
                {order.lines.map((line, i) => (
                  <div key={i} className="px-4 py-2.5 flex justify-between text-sm">
                    <span className="text-slate-700">
                      {line.productName} <span className="text-slate-400">× {line.quantity}</span>
                    </span>
                    <span className="text-slate-800 tabular-nums font-medium">
                      ${(line.unitPrice * line.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-[#E2E8F0] flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-800">Total</span>
                <span className="font-extrabold text-lg text-[#D97706] tabular-nums">
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
