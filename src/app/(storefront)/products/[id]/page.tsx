import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/services/roles'
import { getProductById } from '@/lib/services/catalog'
import ProductDetail from '@/components/storefront/ProductDetail'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const [viewer, product] = await Promise.all([
    getViewer(supabase),
    getProductById(supabase, id),
  ])

  if (!product) notFound()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        href="/"
        className="text-xs font-semibold text-slate-500 hover:text-indigo-800 flex items-center gap-1"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Catalog
      </Link>

      <ProductDetail product={product} isAuthed={viewer.userId !== null} />
    </div>
  )
}
