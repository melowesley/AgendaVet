import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Carrega variáveis do .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function runDiagnostics() {
  console.log('--- Diagnóstico de API AgendaVet ---')
  
  const envs = {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GOOGLE: process.env.GOOGLE_API_KEY
  }

  for (const [key, value] of Object.entries(envs)) {
    const isPlaceholder = value?.includes('your_') || value?.includes('...') || !value
    console.log(`${key}: ${value ? (isPlaceholder ? '❌ Placeholder/Ausente' : '✅ Presente') : '❌ Ausente'}`)
  }

  if (envs.SUPABASE_URL && envs.SERVICE_ROLE && !envs.SUPABASE_URL.includes('your_')) {
    try {
      console.log('\nTestando conexão com Supabase usando SERVICE_ROLE...')
      const supabase = createClient(envs.SUPABASE_URL, envs.SERVICE_ROLE)
      
      // Teste 1: Tabela Pets
      console.log('Verificando tabela "pets"...')
      const { data: pets, error: petError, count: petCount } = await supabase
        .from('pets')
        .select('*', { count: 'exact', head: false })
        .limit(1)

      if (petError) {
        console.log('Tabela "pets": ❌ Erro:', petError.message, `(Código: ${petError.code})`)
      } else {
        console.log('Tabela "pets": ✅ Sucesso')
        console.log(`- Total de registros: ${petCount}`)
      }

      // Teste 2: Tabela Profiles
      console.log('\nVerificando tabela "profiles"...')
      const { data: profiles, error: profileError, count: profileCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: false })
        .limit(1)

      if (profileError) {
        console.log('Tabela "profiles": ❌ Erro:', profileError.message, `(Código: ${profileError.code})`)
      } else {
        console.log('Tabela "profiles": ✅ Sucesso')
        console.log(`- Total de registros: ${profileCount}`)
      }

    } catch (err: any) {
      console.log('\nErro inesperado no diagnóstico:', err.message)
    }
  }

  console.log('\n--- Fim do Diagnóstico ---')
}

runDiagnostics()
