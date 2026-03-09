// Test script to check Supabase connectivity
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing Supabase connectivity...')
console.log('URL configured:', !!supabaseUrl)
console.log('Key configured:', !!supabaseKey)

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase environment variables not configured')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('Testing connection...')
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('❌ Connection error:', error.message)
    } else {
      console.log('✅ Supabase connection successful')
      console.log('Session data:', data)
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testConnection()
