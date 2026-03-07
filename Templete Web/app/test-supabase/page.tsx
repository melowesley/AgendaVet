// Test page to check Supabase connectivity
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSupabasePage() {
  const [status, setStatus] = useState<string>('Testing...')

  useEffect(() => {
    async function testConnection() {
      try {
        console.log('Testing Supabase connection...')

        // Test basic connection
        const { data: session, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
          setStatus(`❌ Session error: ${sessionError.message}`)
          return
        }

        console.log('Session data:', session)

        // Test auth state
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state changed:', event, session?.user?.email)
        })

        setStatus('✅ Supabase connection successful')

        // Cleanup
        return () => subscription.unsubscribe()
      } catch (error: any) {
        console.error('Connection test failed:', error)
        setStatus(`❌ Connection failed: ${error.message}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-lg">{status}</p>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Check the browser console (F12) for detailed logs.
        </p>
      </div>
    </div>
  )
}
