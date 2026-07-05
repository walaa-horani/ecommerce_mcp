'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { StorefrontProduct } from '@/lib/services/catalog'
import AddToCartButton from './AddToCartButton'

const CATEGORIES = ['All', 'Electronics', 'Audio', 'Office', 'Accessories']

export default function ProductGrid({
  products,
  isAuthed,
  initialQuery,
}: {
  products: StorefrontProduct[]
  isAuthed: boolean
  initialQuery: string
}) {
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState(initialQuery)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchesCategory = category === 'All' || (p.category ?? '') === category
      const matchesSearch =
        q === '' ||
        p.name.toLowerCase().includes(q) ||
        p.vendorName.toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [products, category, search])

  return (
    <div className="space-y-8">
      <div className="bg-indigo-900 text-white rounded-xl overflow-hidden shadow-sm relative py-12 px-8 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6 border border-indigo-950">
        <div className="max-w-xl space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            Shop from independent vendors, all in one place
          </h1>
          <p className="text-indigo-200 text-sm md:text-base">
            Kinetic Ledger bridges operational inventory with premium retail. Authentic products
            direct from registered vendors.
          </p>
        </div>
      </div>

      {/* Mobile search (header search is hidden on small screens) */}
      <div className="md:hidden">
        <input
          type="text"
          placeholder="Search products, vendors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-[#E2E8F0] rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-600"
        />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Filter:</span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer ${
              category === cat
                ? 'bg-indigo-800 border-indigo-800 text-white shadow-sm'
                : 'bg-white border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-[#E2E8F0] pb-2">Featured Products</h2>
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-[#E2E8F0] text-slate-500 text-sm">
            {products.length === 0
              ? 'No products are published yet. Add products from the Vendor Dashboard to see them here.'
              : 'No products found matching your filter.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden hover:shadow-md transition flex flex-col group"
              >
                <Link href={`/products/${product.id}`} className="block aspect-video relative overflow-hidden bg-slate-100 border-b border-[#E2E8F0]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </Link>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                      Sold by {product.vendorName}
                    </span>
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-semibold text-sm text-slate-900 group-hover:text-indigo-800 line-clamp-1 mt-0.5">
                        {product.name}
                      </h3>
                    </Link>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="text-base font-bold text-[#D97706] tabular-nums">
                      ${product.price.toFixed(2)}
                    </span>
                    <AddToCartButton productId={product.id} isAuthed={isAuthed} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
