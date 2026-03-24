// Versão sem dependências externas
const https = require('https');

// Pegue a chave do seu .env.local manualmente e cole aqui entre as aspas apenas para este teste
const API_KEY = "AIzaSyCFLleAhxnfG39Wos7mC8icoPc8gLp-mjo"; 

if (API_KEY === "AIzaSyCFLleAhxnfG39Wos7mC8icoPc8gLp-mjo") {
    console.error("❌ Por favor, cole sua chave API real dentro das aspas no script!");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

console.log("🔍 Consultando Google para ver quais modelos sua chave permite...");

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const response = JSON.parse(data);
        if (response.error) {
            console.error("❌ Erro da API do Google:", response.error.message);
        } else {
            console.log("\n✅ MODELOS DISPONÍVEIS NA SUA CHAVE:");
            response.models.forEach(m => {
                // Filtra apenas os que suportam geração de conteúdo
                if (m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name}`);
                }
            });
            console.log("\n💡 Copie o nome EXATO de um deles (incluindo o prefixo 'models/')");
        }
    });
}).on('error', (err) => {
    console.error("❌ Erro de conexão:", err.message);
});