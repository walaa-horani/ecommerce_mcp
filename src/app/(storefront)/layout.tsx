import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/services/roles'
import StorefrontHeader from '@/components/storefront/StorefrontHeader'

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const viewer = await getViewer(supabase)

  // Public banner text is set by the platform admin (Platform Settings).
  const { data: bannerRows } = await supabase.rpc('get_public_banner')
  const banner: string =
    bannerRows?.[0]?.global_banner ?? 'Welcome to the Kinetic Ledger Marketplace Platform!'

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {banner && (
        <div className="bg-amber-500 text-slate-950 py-1.5 px-4 text-center text-[10px] font-bold tracking-wider uppercase border-b border-amber-600 flex items-center justify-center gap-1.5">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {banner}
        </div>
      )}

      <Suspense fallback={<div className="h-16 bg-white border-b border-[#E2E8F0]" />}>
        <StorefrontHeader viewer={viewer} />
      </Suspense>

      <main className="flex-1 w-full">{children}</main>

      <footer className="bg-white border-t border-[#E2E8F0] py-8 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Kinetic Ledger Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
