import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import WebSocket from 'ws';
import 'dotenv/config';

// Configurações
const token = process.env.TELEGRAM_TOKEN;
const AUTO_EXECUTE = process.env.TELEGRAM_AUTO_EXECUTE === 'true';
const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID ? Number(process.env.TELEGRAM_ADMIN_ID) : null;
const SERVER_URL = process.env.SERVER_URL || 'https://agendavet.onrender.com';
const LOCAL_BRIDGE_URL = 'http://localhost:3000'; // Antigravity Core Local
const WS_URL = SERVER_URL.replace(/^http/, 'ws');
const REMOTE_TOKEN = process.env.REMOTE_TOKEN || 'Weslei3423@';

if (!token) {
    console.error('❌ ERRO: TELEGRAM_TOKEN não encontrado no arquivo .env');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
console.log('🚀 Ponte Híbrida (PC <-> Nuvem <-> Telegram) Iniciada!');

let lastFeedbackState = {
    isGenerating: false,
    buttonsMap: {}
};

let lastSentTextHash = '';
let lastSentButtonsStr = '';
let activeChatId = ADMIN_ID;

// --- 1. CONEXÃO COM A NUVEM (RENDER) ---
function connectCloud() {
    console.log(`🔌 Conectando ao Relay na Nuvem (${WS_URL})...`);
    const ws = new WebSocket(WS_URL);

    ws.on('open', () => {
        console.log('✅ Sincronização com Nuvem Ativa!');
        // Inicia o polling de feedback local
        setInterval(() => checkLocalFeedback(), 2000);
    });

    ws.on('message', async (data) => {
        try {
            const msg = JSON.parse(data);

            // Recebeu entrada de texto do celular ou comando natural
            if (msg.type === 'ai_input') {
                console.log(`☁️ Input via Nuvem: ${msg.data}`);
                await axios.post(`${LOCAL_BRIDGE_URL}/send`, { message: msg.data });
            }

            // Recebeu comando de terminal para rodar no PC
            if (msg.type === 'remote_command') {
                const { spawn } = await import('child_process');
                const path = await import('path');
                const projectRoot = path.resolve(process.cwd(), '..');

                console.log(`💻 Executando no PC (Pasta: ${projectRoot}): ${msg.data}`);
                const [cmd, ...args] = msg.data.split(' ');
                const child = spawn(cmd, args, { shell: true, cwd: projectRoot });

                child.stdout.on('data', (d) => sendLogToCloud(d.toString(), 'stdout'));
                child.stderr.on('data', (d) => sendLogToCloud(d.toString(), 'stderr'));
            }

            // Recebeu clique em botão de ação
            if (msg.type === 'remote_click') {
                console.log(`🖱️ Clique remoto: ${msg.data.textContent}`);
                await axios.post(`${LOCAL_BRIDGE_URL}/remote-click`, msg.data);
            }
        } catch (e) {
            console.error('Erro ao processar mensagem da nuvem:', e.message);
        }
    });

    ws.on('close', () => {
        console.log('⚠️ Conexão com Nuvem perdida. Reconectando...');
        setTimeout(connectCloud, 5000);
    });

    ws.on('error', (err) => console.error('WS Cloud Error:', err.message));
}

// --- 2. SINCRONIZAÇÃO DE FEEDBACK (PC -> NUVEM -> TELEGRAM) ---
async function checkLocalFeedback() {
    try {
        // Busca o estado atual da IA no PC Local
        const res = await axios.get(`${LOCAL_BRIDGE_URL}/chat-feedback`);
        const data = res.data;
        if (!data || data.error) return;

        // Envia o estado da IA para a Nuvem (para o celular ver)
        try {
            await axios.post(`${SERVER_URL}/update-feedback`, {
                feedback: data,
                token: REMOTE_TOKEN
            });
        } catch (e) { }

        const isGeneratingNow = data.isGenerating;
        const textSummary = data.recentText || '';
        const buttons = data.buttons || [];
        const buttonsStr = buttons.map(b => b.action).join(',');

        // Mapeia botões para comandos do Telegram
        lastFeedbackState.buttonsMap = {};
        buttons.forEach(b => { lastFeedbackState.buttonsMap[b.action] = b.index; });

        // Decide se deve enviar mensagem para o Telegram
        let shouldNotify = (lastFeedbackState.isGenerating && !isGeneratingNow) ||
            (buttonsStr !== lastSentButtonsStr && buttons.length > 0);

        if (shouldNotify && activeChatId) {
            const currentHash = textSummary.substring(0, 50) + textSummary.length;
            if (currentHash !== lastSentTextHash || buttonsStr !== lastSentButtonsStr) {
                let msg = textSummary ? `📝 **Antigravity diz:**\n\n${textSummary.slice(-800)}` : '✅ Tarefa Concluída.';
                if (buttons.length > 0) {
                    msg += `\n\n⚙️ **Ações:**\n` + buttons.map(b => `👉 /${b.action.replace(/\s+/g, '_')}`).join('\n');
                }
                bot.sendMessage(activeChatId, msg, { parse_mode: 'Markdown' });
                lastSentTextHash = currentHash;
                lastSentButtonsStr = buttonsStr;
            }
        }
        lastFeedbackState.isGenerating = isGeneratingNow;

    } catch (err) { /* PC Offline */ }
}

async function sendLogToCloud(log, type = 'stdout') {
    try {
        await axios.post(`${SERVER_URL}/local-log`, { log, type, token: REMOTE_TOKEN });
    } catch (e) { }
}

// --- 3. INTERAÇÃO VIA TELEGRAM (DIÁLOGO NATURAL) ---
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (ADMIN_ID && chatId !== ADMIN_ID) return;
    activeChatId = chatId;

    const text = msg.text;
    if (!text) return;

    // Comandos de Status
    if (text === '/status' || text === '/start') {
        bot.sendMessage(chatId, '🤖 **Mente Conectada!**\n\nEu sou o seu Antigravity remoto. Pode me mandar ordens em texto natural aqui ou usar o painel no celular.');
        return;
    }

    // Comandos de Botão (/run, /accept, etc)
    if (text.startsWith('/')) {
        const action = text.substring(1).replace(/_/g, ' ');
        const index = lastFeedbackState.buttonsMap[action];
        if (index !== undefined) {
            try {
                await axios.post(`${LOCAL_BRIDGE_URL}/remote-click`, {
                    selector: 'button, div[role="button"]',
                    index: index,
                    textContent: action.charAt(0).toUpperCase() + action.slice(1)
                });
                bot.sendMessage(chatId, `✅ Executando: ${action}...`);
                return;
            } catch (e) { }
        }
    }

    // Encaminha Diálogo Natural para a "Mente" (IDE)
    try {
        console.log(`🗣️ Telegram -> IDE: ${text}`);
        await axios.post(`${LOCAL_BRIDGE_URL}/send`, { message: text });
        bot.sendMessage(chatId, '🧠 *Pensando...*', { parse_mode: 'Markdown' });
    } catch (err) {
        bot.sendMessage(chatId, '❌ Erro: O Antigravity local não está respondendo.');
    }
});

connectCloud();
