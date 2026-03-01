import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import WebSocket from 'ws';
import 'dotenv/config';

const token = process.env.TELEGRAM_TOKEN;
const AUTO_EXECUTE = process.env.TELEGRAM_AUTO_EXECUTE === 'true';
const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID ? Number(process.env.TELEGRAM_ADMIN_ID) : null;
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const WS_URL = SERVER_URL.replace(/^http/, 'ws');

if (!token) {
    console.error('❌ ERRO: TELEGRAM_TOKEN não encontrado no arquivo .env');
    console.log('Por favor, adicione TELEGRAM_TOKEN=seu_token_aqui no seu arquivo .env');
    process.exit(1);
}

// Cria o bot
const bot = new TelegramBot(token, { polling: true });

console.log('🚀 Servidor de Ponte do Telegram Iniciado!');
console.log('Aguardando mensagens...');

let lastFeedbackState = {
    isGenerating: false,
    buttonsMap: {} // to store index mappings for easy /run /accept
};

let lastSentTextHash = '';
let lastSentButtonsStr = '';
let activeChatId = ADMIN_ID; // Will auto-update on first message if null

function connectWebSocket() {
    console.log(`🔌 Conectando ao WebSocket (${WS_URL})...`);
    const ws = new WebSocket(WS_URL);

    ws.on('open', () => {
        console.log('✅ Conectado ao servidor local (WebSocket) - Modo Feedback Ativo!');
        checkFeedback(true);
    });

    ws.on('message', async (data) => {
        try {
            const msg = JSON.parse(data);
            if (msg.type === 'snapshot_update') {
                // Wait a tiny bit for render to settle
                setTimeout(() => checkFeedback(false), 800);
            }
        } catch (e) { }
    });

    ws.on('close', () => {
        console.log('⚠️ Conexão WebSocket perdida. Reconectando em 5s...');
        setTimeout(connectWebSocket, 5000);
    });

    ws.on('error', (err) => {
        console.error('WS error:', err.message);
    });
}
connectWebSocket();

async function checkFeedback(isInitial = false) {
    if (!activeChatId) return; // Nobody to notify yet

    try {
        const res = await axios.get(`${SERVER_URL}/chat-feedback`);
        const data = res.data;
        if (!data || data.error) return;

        const isGeneratingNow = data.isGenerating;
        const textSummary = data.recentText || '';
        const buttons = data.buttons || [];
        const buttonsStr = buttons.map(b => b.action).join(',');

        // Auto-execute if enabled
        if (AUTO_EXECUTE && buttons.length > 0) {
            // Click each button automatically
            for (const b of buttons) {
                try {
                    await axios.post(`${SERVER_URL}/remote-click`, {
                        selector: 'button, div[role="button"]',
                        index: b.index,
                        textContent: b.text
                    });
                } catch (e) { /* ignore */ }
            }
            // After auto-click, refresh feedback after short delay
            setTimeout(() => checkFeedback(false), 2000);
            return; // skip sending message
        }

        let shouldSendFeedback = false;

        // Generation just finished
        if (lastFeedbackState.isGenerating && !isGeneratingNow) {
            shouldSendFeedback = true;
        }

        // New buttons appeared
        if (buttonsStr !== lastSentButtonsStr && buttons.length > 0) {
            shouldSendFeedback = true;
        }

        // Always Update State
        lastFeedbackState.isGenerating = isGeneratingNow;
        lastFeedbackState.buttonsMap = {};
        buttons.forEach(b => {
            lastFeedbackState.buttonsMap[b.action] = b.index;
        });

        if (shouldSendFeedback) {
            const currentHash = textSummary.substring(0, 50) + textSummary.length;

            let message = '';

            if (textSummary) {
                let truncated = textSummary;
                if (truncated.length > 1000) truncated = truncated.substring(truncated.length - 1000); // Max 1000 chars
                message += `📝 **Ação Solicitada / Resumo:**\n...${truncated}\n\n`;
            } else {
                message += `✅ Tarefa finalizada (nenhum texto novo detectado).\n\n`;
            }

            if (buttons.length > 0) {
                message += `⚙️ **Comandos Disponíveis:**\n`;
                buttons.forEach(b => {
                    const cmd = `/${b.action.replace(/\\s+/g, '_')}`; // accept all -> /accept_all
                    message += `👉 ${cmd} - Executar botão '${b.text}'\n`;
                });
            }

            // Only send if we have a mapped activeChatId and it changed
            if (message.trim().length > 0 && (currentHash !== lastSentTextHash || buttonsStr !== lastSentButtonsStr)) {
                bot.sendMessage(activeChatId, message);
                lastSentTextHash = currentHash;
                lastSentButtonsStr = buttonsStr;
            }
        }
    } catch (err) {
        // Server down, ignore
    }
}

// Cache simples para armazenar IDs de mensagens já processadas (evita duplicidade)
const processedMessageIds = new Set();

bot.on('message', async (msg) => {
    const messageId = msg.message_id;

    // 1. Trava de Segurança: Verifica se a mensagem já foi processada
    if (processedMessageIds.has(messageId)) {
        console.log(`⚠️ Mensagem duplicada detectada e descartada (ID: ${messageId})`);
        // 2. Resposta imediata: Se estivesse usando webhooks puros (Express), aqui iria um res.status(200).send('OK');
        // Como o bot usa polling (node-telegram-bot-api), a biblioteca já lida com o "OK" automaticamente.
        return;
    }

    // Armazena no cache e mantém um limite para não consumir muita memória
    processedMessageIds.add(messageId);
    if (processedMessageIds.size > 200) {
        const oldestId = processedMessageIds.values().next().value;
        processedMessageIds.delete(oldestId);
    }

    const chatId = msg.chat.id;
    // Enforce admin restriction if ADMIN_ID is set
    if (ADMIN_ID && chatId !== ADMIN_ID) {
        bot.sendMessage(chatId, '⚠️ Você não tem permissão para usar este bot.');
        return;
    }
    activeChatId = chatId; // Save chat ID so we can send feedback later
    const text = msg.text;
    if (!text) return;
    console.log(`📩 Mensagem recebida: ${text}`);
    // Admin commands
    if (text.startsWith('/')) {
        const cmd = text.toLowerCase().substring(1).replace(/_/g, ' ');
        if (cmd === 'status' || cmd === 'start') {
            const statusMsg = '🤖 Ponte Antigravity via Telegram está ONLINE e monitorando feedback!\n\nEnvie tarefas para mim. Quando a IA pedir aprovação (/run, /accept), eu te avisarei!';
            bot.sendMessage(chatId, statusMsg);
            return;
        }
        if (cmd === 'admin_status') {
            const status = `⚙️ Configurações:\n- AUTO_EXECUTE: ${AUTO_EXECUTE}\n- ADMIN_ID: ${ADMIN_ID || 'não definido'}`;
            bot.sendMessage(chatId, status);
            return;
        }
        if (cmd.startsWith('set_auto_execute')) {
            const val = cmd.split(' ')[1];
            if (val === 'on') process.env.TELEGRAM_AUTO_EXECUTE = 'true';
            else if (val === 'off') process.env.TELEGRAM_AUTO_EXECUTE = 'false';
            bot.sendMessage(chatId, `✅ AUTO_EXECUTE definido para ${process.env.TELEGRAM_AUTO_EXECUTE}`);
            return;
        }
        // Action Command (Run, Accept, Reject etc)
        if (['run', 'accept', 'reject', 'approve', 'continue', 'confirm', 'accept all', 'reject all', 'apply'].includes(cmd)) {
            const index = lastFeedbackState.buttonsMap[cmd];
            if (index !== undefined) {
                try {
                    await axios.post(`${SERVER_URL}/remote-click`, {
                        selector: 'button, div[role="button"]',
                        index: index,
                        textContent: cmd.charAt(0).toUpperCase() + cmd.slice(1)
                    });
                    bot.sendMessage(chatId, `✅ Comando /${cmd.replace(/\\s+/g, '_')} enviado ao PC!`);
                    setTimeout(() => checkFeedback(false), 2000);
                } catch (e) {
                    bot.sendMessage(chatId, `❌ Erro ao clicar no botão remoto: ${e.message}`);
                }
            } else {
                bot.sendMessage(chatId, `⚠️ Erro: O botão '${cmd}' não está disponível no momento ou já foi clicado.`);
            }
            return;
        }
    }
    // Rest of original handling (forward to AI)
    try {
        console.log(`🤖 Encaminhando para IA: ${text}`);
        await axios.post(`${SERVER_URL}/send`, { message: text });
        bot.sendMessage(chatId, '✅ Comando enviado para o Antigravity! Aguardando retorno...');
        lastSentTextHash = '';
    } catch (err) {
        if (err.response && err.response.status === 503) {
            bot.sendMessage(chatId, '⚠️ O Antigravity não está aberto ou não está em uma conversa ativa no PC.');
        } else if (err.code === 'ECONNREFUSED') {
            bot.sendMessage(chatId, '❌ Erro: O servidor (server.js) não está rodando.');
        } else {
            bot.sendMessage(chatId, `❌ Erro inesperado: ${err.message}`);
        }
    }
});

bot.on('polling_error', (error) => {
    console.error('💥 Erro de conexão do Telegram:', error.code);
});
