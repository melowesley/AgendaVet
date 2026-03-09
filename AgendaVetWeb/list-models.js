const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Script para listar os modelos disponíveis na sua chave Gemini.
 * 
 * Uso:
 * 1. Configure sua chave: $env:GEMINI_API_KEY="sua-chave-aqui"
 * 2. Execute: node list-models.js
 */

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
        console.error('ERRO: Variável de ambiente GEMINI_API_KEY não encontrada!');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log('--- Listando Modelos Disponíveis ---');

        // O SDK não tem um método direto 'listModels' no objeto genAI na versão básica, 
        // mas podemos tentar instanciar e ver se falha ou usar o fetch manual se necessário.
        // Na verdade, no Node, podemos usar o endpoint direto ou verificar se o modelo flash funciona.

        console.log('Tentando verificar acesso ao gemini-1.5-flash...');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Oi");
        console.log('Sucesso! Você tem acesso ao gemini-1.5-flash.');
        console.log('Resposta curta:', result.response.text());

    } catch (error) {
        console.error('Falha ao acessar os modelos:');
        console.error(error.message);
        console.log('\n--- DICA ---');
        console.log('Se o erro for 404, pode ser que o nome do modelo mudou ou sua chave está em um projeto do Google Cloud que exige configuração específica.');
    }
}

listModels();
