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

async function check() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('get_tables')
  if (error) {
    // fallback if no rpc
    const res = await supabase.from('products').select('*').limit(0)
    console.log('Products Error:', res.error)
  }
  console.log('Data:', data)
}

check()
