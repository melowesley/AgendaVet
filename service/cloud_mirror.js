import WebSocket from 'ws';
import 'dotenv/config';
import http from 'http';

/**
 * SIMBIOSE CLOUD BRIDGE
 * Este script roda localmente no seu PC e projeta o Antigravity para o Render.
 */

const REMOTE_WS_URL = (process.env.SERVER_URL || 'https://agendavet.onrender.com').replace('http', 'ws');
const REMOTE_TOKEN = process.env.REMOTE_TOKEN || 'Weslei3423@';
const LOCAL_CDP_PORTS = [9000, 9001, 9002];

let remoteWs = null;
let cdpConnection = null;

// --- CDP Core Functions (Reutilizadas e Otimizadas) ---

async function getJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

async function discoverCDP() {
    for (const port of LOCAL_CDP_PORTS) {
        try {
            const list = await getJson(`http://127.0.0.1:${port}/json/list`);
            const workbench = list.find(t => t.url?.includes('workbench.html') || t.title?.includes('Antigravity'));
            if (workbench?.webSocketDebuggerUrl) return { port, url: workbench.webSocketDebuggerUrl };
        } catch (e) { }
    }
    return null;
}

async function connectCDP(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
    });

    let idCounter = 1;
    const pendingCalls = new Map();
    const contexts = [];

    ws.on('message', (msg) => {
        try {
            const data = JSON.parse(msg);
            if (data.id !== undefined && pendingCalls.has(data.id)) {
                const { resolve, reject } = pendingCalls.get(data.id);
                pendingCalls.delete(data.id);
                if (data.error) reject(data.error);
                else resolve(data.result);
            }
            if (data.method === 'Runtime.executionContextCreated') contexts.push(data.params.context);
            if (data.method === 'Runtime.executionContextsCleared') contexts.length = 0;
        } catch (e) { }
    });

    const call = (method, params) => new Promise((resolve, reject) => {
        const id = idCounter++;
        pendingCalls.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
    });

    await call("Runtime.enable", {});
    return { ws, call, contexts };
}

async function captureSnapshot(cdp) {
    const CAPTURE_SCRIPT = `(async () => {
        const cascade = document.getElementById('conversation') || document.getElementById('chat') || document.getElementById('cascade');
        if (!cascade) return { error: 'Chat não encontrado' };
        
        const clone = cascade.cloneNode(true);
        // Limpeza agressiva de áreas de interação
        clone.querySelectorAll('[contenteditable="true"], button, .interaction-area').forEach(el => el.remove());
        
        return {
            html: clone.outerHTML,
            css: Array.from(document.styleSheets).map(s => {
                try { return Array.from(s.cssRules).map(r => r.cssText).join('\\n'); } catch(e) { return ''; }
            }).join('\\n'),
            stats: { nodes: clone.getElementsByTagName('*').length, htmlSize: clone.outerHTML.length }
        };
    })()`;

    for (const ctx of cdp.contexts) {
        try {
            const res = await cdp.call("Runtime.evaluate", { expression: CAPTURE_SCRIPT, returnByValue: true, awaitPromise: true, contextId: ctx.id });
            if (res.result?.value && !res.result.value.error) return res.result.value;
        } catch (e) { }
    }
    return null;
}

async function injectMessage(cdp, text) {
    const safeText = JSON.stringify(text);
    const SCRIPT = `(async () => {
        const editor = document.querySelector('[contenteditable="true"]');
        if (!editor) return { ok: false };
        editor.focus();
        document.execCommand('insertText', false, ${safeText});
        const submit = document.querySelector('button[type="submit"]') || document.querySelector('svg.lucide-arrow-right')?.closest('button');
        if (submit) submit.click();
        return { ok: true };
    })()`;

    for (const ctx of cdp.contexts) {
        try {
            const res = await cdp.call("Runtime.evaluate", { expression: SCRIPT, returnByValue: true, awaitPromise: true, contextId: ctx.id });
            if (res.result?.value?.ok) return res.result.value;
        } catch (e) { }
    }
    return { ok: false };
}

// --- Cloud Connection Logic ---

async function startBridge() {
    const cdpInfo = await discoverCDP();
    if (!cdpInfo) {
        console.log('⚠️ Antigravity não detectado. Certifique-se que o VS Code está aberto com a extensão ativa.');
        setTimeout(startBridge, 5000);
        return;
    }

    cdpConnection = await connectCDP(cdpInfo.url);
    console.log('✅ Conectado ao Antigravity!');

    remoteWs = new WebSocket(REMOTE_WS_URL);

    remoteWs.on('open', () => {
        console.log('✅ Conectado ao Render!');
        remoteWs.send(JSON.stringify({ type: 'auth_bridge', token: REMOTE_TOKEN }));
    });

    remoteWs.on('message', async (data) => {
        const msg = JSON.parse(data);

        if (msg.type === 'auth_success') {
            const sync = async () => {
                if (remoteWs.readyState !== 1) return;
                const snapshot = await captureSnapshot(cdpConnection);
                if (snapshot) remoteWs.send(JSON.stringify({ type: 'snapshot_update', snapshot }));
                setTimeout(sync, 2000);
            };
            sync();
        }

        if (msg.type === 'ai_input' || msg.type === 'send') {
            console.log(`💬 Injetando mensagem: ${msg.data || msg.message}`);
            await injectMessage(cdpConnection, msg.data || msg.message);
        }
    });

    remoteWs.on('close', () => {
        console.log('❌ Conexão perdida. Tentando novamente...');
        setTimeout(startBridge, 3000);
    });
}

startBridge();
