'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardShell({
  title,
  email,
  children,
}: {
  title: string
  email: string | null
  children: React.ReactNode
}) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <header className="bg-[#0F172A] text-white sticky top-0 z-40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="h-7 w-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">KL</span>
              <span className="font-bold text-sm tracking-tight hidden sm:inline">Kinetic Ledger</span>
            </Link>
            <span className="text-slate-600">|</span>
            <span className="text-sm font-semibold text-indigo-300">{title}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {email && <span className="text-slate-400 hidden sm:inline">{email}</span>}
            <Link href="/" className="font-medium text-slate-300 hover:text-white">View Storefront</Link>
            <button onClick={handleSignOut} className="font-semibold text-slate-400 hover:text-rose-400 cursor-pointer">
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">{children}</main>
    </div>
  )
}
