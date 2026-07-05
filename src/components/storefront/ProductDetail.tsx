'use client'

import { useState } from 'react'
import type { StorefrontProduct } from '@/lib/services/catalog'
import AddToCartButton from './AddToCartButton'

export default function ProductDetail({
  product,
  isAuthed,
}: {
  product: StorefrontProduct
  isAuthed: boolean
}) {
  const [qty, setQty] = useState(1)

  return (
    <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
      <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden border border-[#E2E8F0]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
      </div>

      <div className="flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div>
            <span className="text-xs font-semibold text-indigo-700 tracking-wide uppercase">
              Sold by {product.vendorName}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{product.name}</h1>
          </div>

          <span className="text-2xl font-bold text-[#D97706] tabular-nums block">
            ${product.price.toFixed(2)}
          </span>

          {product.description && (
            <p className="text-slate-600 text-sm leading-relaxed">{product.description}</p>
          )}
        </div>

        <div className="space-y-3 pt-6 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-500 uppercase">Quantity</span>
            <div className="flex items-center border border-[#E2E8F0] rounded-lg overflow-hidden bg-[#F8FAFC]">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="px-4 text-sm font-semibold text-slate-800 tabular-nums select-none">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="px-3 py-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <AddToCartButton
            productId={product.id}
            isAuthed={isAuthed}
            quantity={qty}
            className="w-full text-center font-bold py-3 rounded-lg shadow-sm transition bg-[#D97706] hover:bg-amber-700 text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  )
}
