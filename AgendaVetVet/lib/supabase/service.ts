import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Missing Supabase Service Role configuration')
}

export const createServiceSupabaseClient = () => {
    return createClient(supabaseUrl!, supabaseServiceKey!, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

// Para manter compatibilidade com códigos que importam 'supabase' diretamente
export const supabase = createServiceSupabaseClient();
