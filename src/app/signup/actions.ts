'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signUpVendor } from '@/lib/services/vendor-auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export type SignUpState = { error?: string; message?: string }

export async function signUpVendorAction(
  _prevState: SignUpState | undefined,
  formData: FormData
): Promise<SignUpState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: 'Enter a valid email and a password of at least 8 characters.' }
  }

  const supabase = await createClient()
  const { data, error } = await signUpVendor(supabase, parsed.data.email, parsed.data.password)

  if (error) return { error: error.message }

  if (!data.session) {
    return { message: 'Check your email to confirm your account, then sign in.' }
  }

  redirect('/login')
}
