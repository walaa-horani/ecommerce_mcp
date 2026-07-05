import { createAdminClient } from '../src/lib/supabase/admin'
import fs from 'fs'
import path from 'path'

// Load .env.local
const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf-8')
envContent.split('\n').forEach(line => {
  const parts = line.split('=')
  if(parts.length >= 2) {
    const key = parts[0].trim()
    const val = parts.slice(1).join('=').trim().replace(/^"|"$|^'|'$/g, '')
    if(key) process.env[key] = val
  }
})

async function seed() {
  const supabase = createAdminClient()

  // Find the specific user
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers()
  if (authErr || !users) return console.error('Error fetching users:', authErr)

  const user = users.find(u => u.email === 'walaahorani09@gmail.com')
  if (!user) return console.error('User walaahorani09@gmail.com not found in auth.users')

  // Find their vendor org
  const { data: members, error: memberErr } = await supabase
    .from('memberships')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)

  if (memberErr || !members || members.length === 0) {
    return console.error('No memberships found for walaahorani09@gmail.com.')
  }

  const orgId = members[0].org_id
  console.log(`Seeding data for vendor org_id: ${orgId}`)

  // Create a warehouse
  const { data: warehouse, error: whErr } = await supabase.from('warehouses').insert({
    org_id: orgId,
    name: 'Main fulfillment center',
    location: 'Austin, TX'
  }).select().single()

  if (whErr) return console.error('Error creating warehouse:', whErr)

  // Create products
  const products = [
    {
      org_id: orgId,
      name: 'Mechanical Wireless Keyboard Pro',
      sku: 'SKU-KB-PRO',
      price: 129.99,
      is_published: true,
      image_url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&auto=format&fit=crop&q=60'
    },
    {
      org_id: orgId,
      name: 'Quantum Flow Sensor X-1',
      sku: 'SKU-SEN-X1',
      price: 89.50,
      is_published: true,
      image_url: 'https://images.unsplash.com/photo-1580870059867-74c59d9016e1?w=500&auto=format&fit=crop&q=60'
    },
    {
      org_id: orgId,
      name: 'Precision Optical Assembly',
      sku: 'SKU-OPT-ASM',
      price: 1250.00,
      is_published: true,
      image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60'
    }
  ]

  const { data: insertedProducts, error } = await supabase.from('products').upsert(products, { onConflict: 'org_id,sku' }).select()
  if (error) return console.error('Error inserting products:', error)

  const stockQuantities = [24, 2, 1] // Corresponding to the 3 products above

  for (let i = 0; i < insertedProducts.length; i++) {
    await supabase.from('product_stock').delete().eq('product_id', insertedProducts[i].id)
    await supabase.from('product_stock').insert({
      org_id: orgId,
      product_id: insertedProducts[i].id,
      warehouse_id: warehouse.id,
      quantity: stockQuantities[i]
    })
  }

  // Add dummy orders and POs
  await supabase.from('orders').insert({
    org_id: orgId,
    status: 'Pending',
    total_amount: 150.00,
    shipping_address: { city: 'New York', country: 'USA' }
  })

  await supabase.from('purchase_orders').insert({
    org_id: orgId,
    status: 'Pending'
  })

  console.log('Successfully seeded products, stock, warehouse, and orders!')
}

seed()
