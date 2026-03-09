const { OpenAI } = require('openai');

/**
 * Script para testar a identidade do modelo DeepSeek.
 * 
 * Uso:
 * 1. Instale a dependência: npm install openai
 * 2. Configure sua chave: $env:DEEPSEEK_API_KEY="sua-chave-aqui" (Windows PowerShell)
 * 3. Execute: node test-deepseek.js
 */

async function testModel() {
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;

    if (!apiKey) {
        console.error('ERRO: Variável de ambiente DEEPSEEK_API_KEY não encontrada!');
        return;
    }

    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://api.deepseek.com',
    });

    try {
        console.log('--- Testando Modelo DeepSeek ---');

        // Atualmente o 'deepseek-chat' aponta para o modelo V3
        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                { role: 'user', content: 'Qual é o seu nome e versão exata do modelo?' }
            ],
        });

        console.log('Resposta do Modelo:');
        console.log(response.choices[0].message.content);

        console.log('\nID do Modelo Retornado pela API:');
        console.log(response.model);

    } catch (error) {
        console.error('Falha ao testar o modelo:');
        console.error(error.message);
    }
}

testModel();
