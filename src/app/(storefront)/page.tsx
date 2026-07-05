import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/services/roles'
import { getPublishedProducts } from '@/lib/services/catalog'
import ProductGrid from '@/components/storefront/ProductGrid'

export default async function StorefrontHomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()
  const [viewer, products] = await Promise.all([
    getViewer(supabase),
    getPublishedProducts(supabase),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProductGrid products={products} isAuthed={viewer.userId !== null} initialQuery={q ?? ''} />
    </div>
  )
}
