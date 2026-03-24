// test-api.js
const { createClient } = require('@supabase/supabase-js')

// Configuração direta para teste
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sua-url.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sua-service-key'

async function testPetLookup(petId) {
  console.log(`[DEBUG] Testando busca do pet: ${petId}`)
  console.log(`[DEBUG] URL Supabase:`, supabaseUrl)
  console.log(`[DEBUG] Service Key existe:`, !!supabaseServiceKey)
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    
    console.log('[DEBUG] Cliente Supabase criado')
    
    const { data: petData, error } = await supabase
      .from('pets')
      .select(`
        id,
        name,
        type,
        breed,
        weight,
        age,
        user_id,
        profiles!inner (
          full_name
        )
      `)
      .eq('id', petId)
      .single()
    
    console.log('[DEBUG] Resultado do Supabase:', petData)
    console.log('[DEBUG] Erro Supabase:', error)
    
    if (error) {
      console.error('[DEBUG] ERRO NA BUSCA DO SUPABASE:', error)
      return null
    }
    
    return petData
  } catch (dbError) {
    console.error('[DEBUG] ERRO NA BUSCA DO SUPABASE:', dbError)
    return null
  }
}

// Teste com um ID conhecido
testPetLookup('123e4567-e89b-12d3-a456-426614174000')