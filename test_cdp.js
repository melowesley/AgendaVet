import { WebSocket } from 'ws';
import http from 'http';

async function getJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function run() {
    let port = 9000;
    const list = await getJson(`http://127.0.0.1:${port}/json/list`).catch(() => []);
    const workbench = list.find(t => t.url?.includes('workbench.html') || t.title?.includes('Antigravity'));
    if (!workbench) return console.log("Não achei a janela.");

    const ws = new WebSocket(workbench.webSocketDebuggerUrl);
    await new Promise(r => ws.on('open', r));

    let id = 1;
    const call = (method, params) => new Promise(resolve => {
        const msgId = id++;
        const handler = (data) => {
            const msg = JSON.parse(data);
            if (msg.id === msgId) {
                ws.removeListener('message', handler);
                resolve(msg.result);
            }
        };
        ws.on('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await call("Runtime.enable", {});

    // Simulate Enter Key using CDP Input.dispatchKeyEvent
    const EXP = `(async () => {
        const editor = document.querySelector('[contenteditable="true"]');
        if (!editor) return { error: 'Editor not found' };
        
        editor.focus();
        document.execCommand('insertText', false, "Teste de Submit com Enter CDP");
        return { success: true };
    })()`;

    await call("Runtime.evaluate", { expression: EXP, awaitPromise: true });

    // Agora mandamos eventos de teclado RAW via CDP (isso emula um teclado físico perfeitamente)
    await call("Input.dispatchKeyEvent", {
        type: 'rawKeyDown',
        windowsVirtualKeyCode: 13,
        unmodifiedText: '\r',
        text: '\r',
        key: 'Enter',
        code: 'Enter'
    });

    await call("Input.dispatchKeyEvent", {
        type: 'keyUp',
        windowsVirtualKeyCode: 13,
        key: 'Enter',
        code: 'Enter'
    });

    console.log("Enter simulado via CDP!");
    process.exit(0);
}

run();
