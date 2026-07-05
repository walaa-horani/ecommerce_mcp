'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signInVendorAction } from './actions'

export default function VendorLoginPage() {
  const [state, formAction, pending] = useActionState(signInVendorAction, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-off px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-border-light p-8">
        <h1 className="text-xl font-semibold text-text-primary mb-1">Vendor sign in</h1>
        <p className="text-sm text-text-secondary mb-6">Manage your store, inventory, and orders.</p>

        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-border-light px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-border-light px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {state?.error && <p className="text-sm text-danger">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2 disabled:opacity-60"
          >
            {pending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-sm text-text-secondary mt-6 text-center">
          No store yet?{' '}
          <Link href="/signup" className="text-primary font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
