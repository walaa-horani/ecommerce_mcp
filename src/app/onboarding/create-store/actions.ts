'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createStore, getOwnMembership } from '@/lib/services/vendor-auth'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const schema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(40).regex(slugPattern, 'Use lowercase letters, numbers, and hyphens only.'),
})

export type CreateStoreState = { error?: string }

export async function createStoreAction(
  _prevState: CreateStoreState | undefined,
  formData: FormData
): Promise<CreateStoreState> {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid store name or slug.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const existing = await getOwnMembership(supabase, user.id)
  if (existing) redirect('/')

  try {
    await createStore(supabase, parsed.data.name, parsed.data.slug)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create store.'
    if (message.includes('duplicate key') || message.includes('organizations_slug_key')) {
      return { error: 'That store slug is already taken.' }
    }
    return { error: message }
  }

  redirect('/')
}
