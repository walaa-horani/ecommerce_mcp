import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/services/roles'
import DashboardShell from '@/components/DashboardShell'
import VendorDashboardView from '@/components/VendorDashboardView'

export const metadata: Metadata = { title: 'Vendor Dashboard - Kinetic Ledger' }

export default async function VendorDashboardPage() {
  const supabase = await createClient()
  const viewer = await getViewer(supabase)

  // Gated: only members of a vendor org may view this dashboard (SKILLS.md §2).
  if (!viewer.userId) redirect('/account/login?redirect=/dashboard')
  if (!viewer.isVendor) redirect('/')

  return (
    <DashboardShell title="Vendor Dashboard" email={viewer.email}>
      <VendorDashboardView />
    </DashboardShell>
  )
}
