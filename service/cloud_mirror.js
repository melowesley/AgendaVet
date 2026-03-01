import { WebSocket } from 'ws';
import 'dotenv/config';
import http from 'http';
import fs from 'fs';
import path from 'path';

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
    // Pequeno atraso para o navegador reportar os contextos (frames/abas)
    await new Promise(r => setTimeout(r, 1500));
    return { ws, call, contexts };
}

async function captureSnapshot(cdp) {
    const CAPTURE_SCRIPT = `(async () => {
        const root = document.getElementById('conversation') || document.getElementById('chat') || document.getElementById('cascade') || document.body;
        
        // 1. Injetar IDs únicos em TODOS os elementos (mais agressivo)
        let idCounter = 1;
        // Varremos todos os elementos dentro do root para garantir que nada escape
        root.querySelectorAll('*').forEach(el => {
            if (!el.hasAttribute('data-remote-id')) {
                el.setAttribute('data-remote-id', 'rid_' + (idCounter++));
            }
        });

        // 2. Clonar
        const clone = root.cloneNode(true);
        
        // Remove áreas de edição
        clone.querySelectorAll('[contenteditable="true"]').forEach(el => el.remove());
        
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

async function clickElement(cdp, { remoteId, textContent, xPercent, yPercent }) {
    const EXP = `(async () => {
        let target = null;
        
        // 1. Prioridade Máxima: Coordenadas (Modo AnyDesk)
        if (typeof ${xPercent} === 'number' && typeof ${yPercent} === 'number') {
            const root = document.getElementById('conversation') || document.getElementById('chat') || document.getElementById('cascade') || document.body;
            const rect = root.getBoundingClientRect();
            const x = rect.left + (rect.width * ${xPercent});
            const y = rect.top + (rect.height * ${yPercent});
            
            target = document.elementFromPoint(x, y);
            console.log("Coordenadas: (" + x + "," + y + ") alvo: " + (target ? target.tagName : 'null'));
        }

        // 2. Fallback: ID Remoto
        if (!target && "${remoteId}" && "${remoteId}" !== "null") {
            target = document.querySelector('[data-remote-id="${remoteId}"]');
        }
        
        // 3. Fallback: Texto
        if (!target && "${textContent}") {
            const all = Array.from(document.querySelectorAll('button, a, [role="button"], span, div'));
            target = all.find(el => (el.innerText || el.textContent || '').trim() === "${textContent}");
        }

        if (target) {
            // Se for um elemento interno (como o SVG do check), tenta subir para o botão pai
            const actualBtn = target.closest('button, a, [role="button"]') || target;
            actualBtn.scrollIntoView({ block: 'center' });
            actualBtn.click();
            
            // Simular eventos de mouse para React/Vue
            ['mousedown', 'mouseup'].forEach(name => {
                const ev = new MouseEvent(name, { bubbles: true, cancelable: true, view: window });
                actualBtn.dispatchEvent(ev);
            });
            return { success: true, tag: actualBtn.tagName };
        }
        return { error: 'Elemento não encontrado' };
    })()`;

    for (const ctx of cdp.contexts) {
        try {
            const res = await cdp.call("Runtime.evaluate", { expression: EXP, returnByValue: true, awaitPromise: true, contextId: ctx.id });
            if (res.result?.value?.success) return res.result.value;
        } catch (e) { }
    }
    return { error: 'Falha ao clicar' };
}

async function remoteScroll(cdp, { scrollPercent }) {
    const EXP = `(async () => {
        const target = document.querySelector('#conversation .overflow-y-auto, #chat .overflow-y-auto, #cascade .overflow-y-auto') || document.getElementById('conversation') || document.getElementById('chat') || document.getElementById('cascade');
        if (target) {
            target.scrollTop = (target.scrollHeight - target.clientHeight) * ${scrollPercent};
            return { success: true };
        }
        return { error: 'Alvo de rolagem não encontrado' };
    })()`;
    for (const ctx of cdp.contexts) {
        try {
            const res = await cdp.call("Runtime.evaluate", { expression: EXP, returnByValue: true, awaitPromise: true, contextId: ctx.id });
            if (res.result?.value?.success) return res.result.value;
        } catch (e) { }
    }
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

async function executeSystemCommand(cdp, command) {
    console.log(`🚀 Executando comando de sistema: ${command}`);
    const SCRIPT = `(async () => {
        // Varredura muito mais ampla: pegamos span, div, etc.
        const allElements = Array.from(document.querySelectorAll('button, span, div, a, [role="button"], .action-item'));
        let target = null;

        if ("${command}" === "accept_all") {
            target = allElements.find(b => {
                const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
                const title = (b.title || '').toLowerCase();
                return txt === 'accept all' || title.includes('accept all') || b.querySelector?.('svg.lucide-check');
            });
        } else if ("${command}" === "run") {
            target = allElements.find(b => {
                const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
                const title = (b.title || '').toLowerCase();
                // O botão de Run pode ser 'run' ou atalhos como 'Alt+Enter'
                return txt === 'run' || txt === 'runalt+⏎' || txt === 'alt+⏎' || title.includes('run') || b.querySelector?.('svg.lucide-play');
            });
        } else if ("${command}" === "undo") {
            target = allElements.find(b => {
                const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
                const title = (b.title || '').toLowerCase();
                return txt === 'undo' || txt === 'reject all' || title.includes('undo') || b.querySelector?.('svg.lucide-undo');
            });
        }

        if (target) {
            target.scrollIntoView({ block: 'center' });
            target.click();
            // Disparar eventos reais para React
            ['mousedown', 'mouseup'].forEach(name => {
                target.dispatchEvent(new MouseEvent(name, { bubbles: true, cancelable: true, view: window }));
            });
            return { ok: true, found: target.tagName + ' - ' + (target.innerText || target.title || 'icon') };
        }
        return { ok: false, error: 'Botão não encontrado' };
    })()`;

    for (const ctx of cdp.contexts) {
        try {
            const res = await cdp.call("Runtime.evaluate", { expression: SCRIPT, returnByValue: true, awaitPromise: true, contextId: ctx.id });
            if (res.result?.value?.ok) {
                console.log(`✅ Comando ${command} executado em: ${res.result.value.found}`);
                return res.result.value;
            }
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

    console.log(`🌐 Tentando conectar ao Render: ${REMOTE_WS_URL}`);
    remoteWs = new WebSocket(REMOTE_WS_URL);

    remoteWs.on('error', (err) => {
        console.error('❌ Erro na conexão com o Render:', err.message);
    });

    remoteWs.on('open', () => {
        console.log('✅ Conectado ao Render!');
        remoteWs.send(JSON.stringify({ type: 'auth_bridge', token: REMOTE_TOKEN }));
    });

    remoteWs.on('message', async (data) => {
        const msg = JSON.parse(data);

        if (msg.type === 'auth_success') {
            console.log('🔓 Autenticado na nuvem com sucesso!');
            const sync = async () => {
                if (!remoteWs || remoteWs.readyState !== 1) return;
                try {
                    const snapshot = await captureSnapshot(cdpConnection);
                    if (snapshot) {
                        remoteWs.send(JSON.stringify({ type: 'snapshot_update', snapshot }));
                        // Sincronização automática em background
                    }
                } catch (e) {
                    console.error('Erro no sync:', e.message);
                }
                setTimeout(sync, 2500);
            };
            sync();
        }

        if (msg.type === 'ai_input' || msg.type === 'send') {
            console.log(`💬 Injetando mensagem: ${msg.data || msg.message}`);
            await injectMessage(cdpConnection, msg.data || msg.message);
        }

        if (msg.type === 'remote_click') {
            console.log(`🖱 Clique remoto: ID=${msg.data.remoteId || 'null'} | Text="${msg.data.textContent}" | Tag=${msg.data.selector}`);
            await clickElement(cdpConnection, msg.data);
        }

        if (msg.type === 'remote_scroll') {
            await remoteScroll(cdpConnection, msg.data);
        }

        if (msg.type === 'upload_image') {
            const uploadDir = path.join(process.cwd(), 'remote_uploads');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

            const safeName = msg.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filePath = path.join(uploadDir, safeName);

            const base64Data = msg.content.replace(/^data:image\/\w+;base64,/, "");
            fs.writeFileSync(filePath, base64Data, 'base64');

            console.log(`📸 Imagem salva em: ${filePath}`);
            await injectMessage(cdpConnection, `Segue print da tela. Arquivo salvo em: ${filePath}`);
        }

        if (msg.type === 'system_command') {
            await executeSystemCommand(cdpConnection, msg.data.command);
        }
    });

    remoteWs.on('close', () => {
        console.log('❌ Conexão perdida. Tentando novamente...');
        setTimeout(startBridge, 3000);
    });
}

startBridge();
