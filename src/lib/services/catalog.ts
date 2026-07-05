import type { SupabaseClient } from '@supabase/supabase-js'

// A published product as shown on the storefront, with its vendor name resolved.
export interface StorefrontProduct {
  id: string
  name: string
  price: number
  description: string
  vendorName: string
  orgId: string
  imageUrl: string
  sku: string
  category: string | null
}

type JoinedOrg = { name: string | null } | { name: string | null }[] | null

const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image'

function vendorName(org: JoinedOrg): string {
  const o = Array.isArray(org) ? org[0] : org
  return o?.name ?? 'Unknown vendor'
}

function mapProduct(row: {
  id: string
  name: string
  price: number | string
  description: string | null
  image_url: string | null
  sku: string
  org_id: string
  category: string | null
  organizations: JoinedOrg
}): StorefrontProduct {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    description: row.description ?? '',
    vendorName: vendorName(row.organizations),
    orgId: row.org_id,
    imageUrl: row.image_url ?? PLACEHOLDER_IMAGE,
    sku: row.sku,
    category: row.category,
  }
}

const SELECT = 'id, name, price, description, image_url, sku, org_id, category, organizations(name)'

/** All published products for the public catalog (RLS: public read where is_published). */
export async function getPublishedProducts(
  supabase: SupabaseClient
): Promise<StorefrontProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select(SELECT)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapProduct)
}

/** A single published product by id, or null if not found / unpublished. */
export async function getProductById(
  supabase: SupabaseClient,
  id: string
): Promise<StorefrontProduct | null> {
  const { data, error } = await supabase
    .from('products')
    .select(SELECT)
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle()
  if (error) throw error
  return data ? mapProduct(data) : null
}
