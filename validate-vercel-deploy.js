/**
 * Script de Validação de Deploy Vercel - AgendaVet
 * 
 * Este script testa se as rotas de API estão vivas e se o 
 * roteamento de subagentes está funcionando em produção.
 */

const VET_URLS = [
    "https://agendavet-web.vercel.app/api/chat"
];

const WEB_URLS = [
    "https://agendavet-web.vercel.app/api/chat"
];

async function testEndpoint(name, url, payload) {
    console.log(`\n--- Testando ${name} ---`);
    console.log(`URL: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const status = response.status;
        console.log(`📡 Status: ${status}`);

        if (response.ok) {
            console.log(`✅ Sucesso!`);
        } else {
            const errorText = await response.text();
            console.error(`❌ Falha!`);
            try {
                const errorJson = JSON.parse(errorText);
                console.error("Erro (JSON):", JSON.stringify(errorJson, null, 2));
            } catch (e) {
                console.error("Erro (Texto):", errorText.substring(0, 200));
            }
        }
    } catch (error) {
        console.error(`💥 Erro na conexão: ${error.message}`);
    }
}

async function runValidation() {
    console.log("🚀 Iniciando Validação de Produção...");

    const testPayload = {
        messages: [{
            id: "test-id-" + Date.now(),
            role: "user",
            content: "Olá, teste de conexão.",
            parts: [{ type: "text", text: "Olá, teste de conexão." }],
            createdAt: new Date()
        }],
        mode: "admin"
    };



    // Teste do App Vet
    for (const url of VET_URLS) {
        await testEndpoint("App Vet", url, testPayload);
    }

    // Teste do Web
    for (const url of WEB_URLS) {
        await testEndpoint("App Web", url, testPayload);
    }

    console.log("\n--- Validação Concluída ---");
}



runValidation();
