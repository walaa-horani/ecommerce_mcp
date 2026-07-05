'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signInVendor, getOwnMembership } from '@/lib/services/vendor-auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type LoginState = { error?: string }

export async function signInVendorAction(
  _prevState: LoginState | undefined,
  formData: FormData
): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: 'Enter your email and password.' }
  }

  const supabase = await createClient()
  const { data, error } = await signInVendor(supabase, parsed.data.email, parsed.data.password)

  if (error) return { error: error.message }

  const userId = data.user.id

  const membership = await getOwnMembership(supabase, userId)

  if (!membership) {
    redirect('/onboarding/create-store')
  }

  redirect('/')
}
