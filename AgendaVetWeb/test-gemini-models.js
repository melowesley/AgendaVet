require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ Erro: Chave API não encontrada no .env.local");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const result = await genAI.getModels();
    console.log("✅ Modelos disponíveis para sua chave:");
    result.models.forEach(model => {
      console.log(`- ${model.name} (Suporta: ${model.supportedGenerationMethods})`);
    });
  } catch (error) {
    console.error("❌ Erro ao listar modelos:", error.message);
  }
}

listModels();