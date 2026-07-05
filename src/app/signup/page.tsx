'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signUpVendorAction } from './actions'

export default function VendorSignUpPage() {
  const [state, formAction, pending] = useActionState(signUpVendorAction, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-off px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-border-light p-8">
        <h1 className="text-xl font-semibold text-text-primary mb-1">Sell on marketPlace</h1>
        <p className="text-sm text-text-secondary mb-6">Create a vendor account to start selling.</p>

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
              minLength={8}
              required
              className="w-full rounded-lg border border-border-light px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-text-secondary mt-1">At least 8 characters.</p>
          </div>

          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
          {state?.message && <p className="text-sm text-success">{state.message}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2 disabled:opacity-60"
          >
            {pending ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-sm text-text-secondary mt-6 text-center">
          Already have a store?{' '}
          <Link href="/login" className="text-primary font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
