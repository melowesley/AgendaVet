import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const payload = await req.json()
  const userId = payload.user_id

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data } = await supabase
    .from('user_roles')
    .select('role, status')
    .eq('user_id', userId)
    .single()

  return new Response(
    JSON.stringify({
      ...payload,
      app_metadata: {
        ...payload.app_metadata,
        role: data?.role ?? null,
        status: data?.status ?? null,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
