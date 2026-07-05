'use client'

import { Suspense, useActionState, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signInCustomerAction, signUpCustomerAction } from './actions'

export default function CustomerAccountPage() {
  return (
    <Suspense fallback={null}>
      <CustomerAccountForm />
    </Suspense>
  )
}

function CustomerAccountForm() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'signin' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  )
  const [signInState, signInFormAction, signInPending] = useActionState(signInCustomerAction, undefined)
  const [signUpState, signUpFormAction, signUpPending] = useActionState(signUpCustomerAction, undefined)

  const state = mode === 'signin' ? signInState : signUpState
  const pending = mode === 'signin' ? signInPending : signUpPending
  const action = mode === 'signin' ? signInFormAction : signUpFormAction

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-off px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-border-light p-8">
        <h1 className="text-xl font-semibold text-text-primary mb-1">
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          {mode === 'signin' ? 'Sign in to view your cart and orders.' : 'Create an account to start shopping.'}
        </p>

        <form action={action} className="flex flex-col gap-4">
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
          </div>

          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
          {state?.message && <p className="text-sm text-success">{state.message}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2 disabled:opacity-60"
          >
            {pending ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-sm text-text-secondary mt-6 text-center">
          {mode === 'signin' ? (
            <>
              New here?{' '}
              <button type="button" onClick={() => setMode('signup')} className="text-primary font-medium">
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('signin')} className="text-primary font-medium">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
