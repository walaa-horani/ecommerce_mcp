'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addToCart } from '@/app/(storefront)/cart/actions'

export default function AddToCartButton({
  productId,
  isAuthed,
  quantity = 1,
  className,
  label = 'Add to Cart',
}: {
  productId: string
  isAuthed: boolean
  quantity?: number
  className?: string
  label?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const onClick = () => {
    if (!isAuthed) {
      router.push('/account/login?redirect=/cart')
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await addToCart(productId, quantity)
      if (res.ok) {
        router.push('/cart')
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <button
        onClick={onClick}
        disabled={isPending}
        className={
          className ??
          'text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm transition bg-[#D97706] hover:bg-amber-700 text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
        }
      >
        {isPending ? 'Adding…' : label}
      </button>
      {error && <span className="text-[10px] text-rose-500">{error}</span>}
    </div>
  )
}
