
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontrados no .env');
    process.exit(1);
}

console.log(`🔗 Testando conexão com: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        // Tenta listar os primeiros 3 pets como um teste de "smoke"
        const { data, error } = await supabase
            .from('pets')
            .select('id, name')
            .limit(3);

        if (error) {
            console.error('❌ Falha na conexão com Supabase:', error.message);
            if (error.message.includes('JWT')) {
                console.error('👉 Dica: A chave ANON (JWT) parece ser inválida ou expirada.');
            }
            return;
        }

        console.log('✅ Conexão estabelecida com sucesso!');
        console.log('🐾 Amostra de Pets encontrados:', data.length > 0 ? data.map(p => p.name).join(', ') : 'Nenhum pet cadastrado (mas a conexão funcionou!)');

    } catch (err) {
        console.error('💥 Erro inesperado durante o teste:', err);
    }
}

testConnection();
