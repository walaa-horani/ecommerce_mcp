import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/services/roles'
import { getAdminVendors, getPlatformSettings } from '@/lib/services/admin'
import DashboardShell from '@/components/DashboardShell'
import AdminDashboardView from '@/components/AdminDashboardView'

export const metadata: Metadata = { title: 'Platform Admin - Kinetic Ledger' }

export default async function AdminPage() {
  const supabase = await createClient()
  const viewer = await getViewer(supabase)

  // Gated: only platform admins may view this (SKILLS.md §6).
  if (!viewer.userId) redirect('/account/login?redirect=/admin')
  if (!viewer.isAdmin) redirect('/')

  const [vendors, settings] = await Promise.all([
    getAdminVendors(supabase),
    getPlatformSettings(supabase),
  ])

  return (
    <DashboardShell title="Platform Admin" email={viewer.email}>
      <AdminDashboardView vendors={vendors} settings={settings} />
    </DashboardShell>
  )
}
