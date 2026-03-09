/**
 * Script para listar TODOS os modelos disponíveis na sua chave Gemini usando Fetch API.
 * 
 * Uso:
 * 1. Configure sua chave: $env:GEMINI_API_KEY="sua-chave-aqui"
 * 2. Execute: node list-models-v2.js
 */

async function listAllModels() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
        console.error('ERRO: Variável de ambiente GEMINI_API_KEY não encontrada!');
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        console.log('--- Consultando API do Google para listar modelos ---');
        console.log('URL:', `https://generativelanguage.googleapis.com/v1beta/models?key=SUA_CHAVE`);

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error('Erro retornado pela API:');
            console.error(JSON.stringify(data.error, null, 2));
            return;
        }

        if (data.models && data.models.length > 0) {
            console.log(`\nEncontrados ${data.models.length} modelos:\n`);
            data.models.forEach(m => {
                const supportedMethods = m.supportedGenerationMethods ? m.supportedGenerationMethods.join(', ') : 'N/A';
                console.log(`- Nome: ${m.name}`);
                console.log(`  Descrição: ${m.description}`);
                console.log(`  Métodos: ${supportedMethods}`);
                console.log('-----------------------------------');
            });

            console.log('\n--- DICA ---');
            console.log('Use o "Nome" completo (ex: models/gemini-pro) no seu código.');
        } else {
            console.log('Nenhum modelo retornado. Verifique se a chave está ativa.');
        }

    } catch (error) {
        console.error('Falha na requisição:');
        console.error(error.message);
    }
}

listAllModels();
