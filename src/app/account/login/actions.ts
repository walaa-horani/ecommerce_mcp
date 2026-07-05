'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  signInCustomer,
  signUpCustomer,
  ensureCustomerRow,
} from '@/lib/services/customer-auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export type CustomerAuthState = { error?: string; message?: string }

export async function signInCustomerAction(
  _prevState: CustomerAuthState | undefined,
  formData: FormData
): Promise<CustomerAuthState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: 'Enter your email and password.' }

  const supabase = await createClient()
  const { data, error } = await signInCustomer(supabase, parsed.data.email, parsed.data.password)
  if (error) return { error: error.message }

  const userId = data.user.id

  await ensureCustomerRow(supabase, userId, data.user.email ?? parsed.data.email)

  redirect('/')
}

export async function signUpCustomerAction(
  _prevState: CustomerAuthState | undefined,
  formData: FormData
): Promise<CustomerAuthState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: 'Enter a valid email and a password of at least 8 characters.' }
  }

  const supabase = await createClient()
  const { data, error } = await signUpCustomer(supabase, parsed.data.email, parsed.data.password)
  if (error) return { error: error.message }

  if (!data.session || !data.user) {
    return { message: 'Check your email to confirm your account, then sign in.' }
  }

  const userId = data.user.id

  await ensureCustomerRow(supabase, userId, data.user.email ?? parsed.data.email)

  redirect('/')
}
