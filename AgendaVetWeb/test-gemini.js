const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Script para testar a identidade do modelo Google Gemini.
 * 
 * Uso:
 * 1. Instale a dependência: npm install @google/generative-ai
 * 2. Configure sua chave: $env:GEMINI_API_KEY="sua-chave-aqui" (Windows PowerShell)
 * 3. Execute: node test-gemini.js
 */

async function testModel() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
        console.error('ERRO: Variável de ambiente GEMINI_API_KEY não encontrada!');
        console.log('Dica: Use $env:GEMINI_API_KEY="sua-chave" no PowerShell antes de rodar.');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Tenta primeiro o Pro, se falhar tenta o Flash
    async function runTest(modelName) {
        console.log(`\nTestando modelo: ${modelName}...`);
        try {
            // Alguns modelos 2.0 exigem o prefixo 'models/' completo
            const name = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
            const model = genAI.getGenerativeModel({ model: name });
            const result = await model.generateContent("Olá, qual é exatamente a sua versão e modelo?");
            return result.response.text();
        } catch (e) {
            throw new Error(`[${modelName}] ${e.message}`);
        }
    }

    try {
        console.log('--- Testando Modelos Gemini (Foco no 2.0 Flash) ---');

        try {
            // Testando o 2.0 Flash com o nome exato da sua lista
            const text = await runTest("gemini-2.0-flash");
            console.log('Sucesso no 2.0 Flash:', text);
        } catch (flashError) {
            console.error('Falha no Gemini 2.0 Flash:', flashError.message);

            console.log('\nTentando 2.5 Pro como fallback estável...');
            try {
                const textPro = await runTest("gemini-2.5-pro");
                console.log('Sucesso no 2.5 Pro:', textPro);
            } catch (proError) {
                console.error('Falha no 2.5 Pro também:', proError.message);
            }
        }


        console.log('\nTeste concluído com sucesso!');

    } catch (error) {

        console.error('Falha ao testar o modelo:');
        console.error(error.message);
    }
}

testModel();
