import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/services/roles'
import DashboardShell from '@/components/DashboardShell'
import AdminDashboardView from '@/components/AdminDashboardView'

export const metadata: Metadata = { title: 'Platform Admin - Kinetic Ledger' }

export default async function AdminPage() {
  const supabase = await createClient()
  const viewer = await getViewer(supabase)

  // Gated: only platform admins may view this (SKILLS.md §6).
  if (!viewer.userId) redirect('/account/login?redirect=/admin')
  if (!viewer.isAdmin) redirect('/')

  return (
    <DashboardShell title="Platform Admin" email={viewer.email}>
      <AdminDashboardView />
    </DashboardShell>
  )
}
