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

    const EXP = `(async () => {
        const els = Array.from(document.querySelectorAll('*')).filter(el => {
            const txt = (el.innerText || el.textContent || '').trim().toLowerCase();
            const title = (el.title || '').toLowerCase();
            const isSmall = el.childElementCount <= 2;
            const matches = txt === 'accept all' || title.includes('accept all');
            return isSmall && matches;
        });
        return els.map(el => ({ tag: el.tagName, text: el.innerText?.trim() || el.textContent?.trim(), title: el.title, cls: el.className })).slice(0, 10);
    })()`;

    const res = await call("Runtime.evaluate", { expression: EXP, returnByValue: true, awaitPromise: true });
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
}

run();
