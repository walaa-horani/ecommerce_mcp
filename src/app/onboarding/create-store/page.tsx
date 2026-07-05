'use client'

import { useActionState } from 'react'
import { createStoreAction } from './actions'

export default function CreateStorePage() {
  const [state, formAction, pending] = useActionState(createStoreAction, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-off px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-border-light p-8">
        <h1 className="text-xl font-semibold text-text-primary mb-1">Create your store</h1>
        <p className="text-sm text-text-secondary mb-6">
          One more step before you can manage products and orders.
        </p>

        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">
              Store name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded-lg border border-border-light px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-text-primary mb-1">
              Store slug
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              placeholder="my-store"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
              className="w-full rounded-lg border border-border-light px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-text-secondary mt-1">Lowercase letters, numbers, hyphens.</p>
          </div>

          {state?.error && <p className="text-sm text-danger">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2 disabled:opacity-60"
          >
            {pending ? 'Creating store…' : 'Create Store'}
          </button>
        </form>
      </div>
    </div>
  )
}
