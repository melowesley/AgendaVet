import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 8080;
const PASSWORD = process.env.APP_PASSWORD || 'antigravity';
const REMOTE_TOKEN = process.env.REMOTE_TOKEN || 'Weslei3423@';

app.use(express.json());

// Serve the Mirror UI for the phone
app.use('/mirror', express.static(path.join(__dirname, 'remote_ui')));

// Serve the main AgendaVet site (dist)
app.use(express.static(path.join(__dirname, 'dist')));

// --- Relay Logic ---
let lastSnapshot = null;
let bridgeClient = null;

const broadcastToPhones = (data) => {
    const msg = JSON.stringify(data);
    wss.clients.forEach(client => {
        if (client !== bridgeClient && client.readyState === 1) {
            client.send(msg);
        }
    });
};

wss.on('connection', (ws, req) => {
    console.log('New connection attempt...');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            // 1. Identify Bridge (Local PC)
            if (data.type === 'auth_bridge' && data.token === REMOTE_TOKEN) {
                bridgeClient = ws;
                console.log('✅ Local Bridge connected!');
                ws.send(JSON.stringify({ type: 'auth_success' }));
                return;
            }

            // 2. Handle Snapshot from Bridge
            if (ws === bridgeClient && data.type === 'snapshot_update') {
                lastSnapshot = data.snapshot;
                broadcastToPhones({ type: 'snapshot_update', timestamp: new Date().toISOString() });
                return;
            }

            // 3. Handle Inputs from Phone
            if (ws !== bridgeClient) {
                // Relay everything to bridge
                if (bridgeClient && bridgeClient.readyState === 1) {
                    bridgeClient.send(JSON.stringify(data));
                }
            }
        } catch (e) {
            console.error('Relay error:', e);
        }
    });

    ws.on('close', () => {
        if (ws === bridgeClient) {
            console.log('❌ Local Bridge disconnected');
            bridgeClient = null;
        }
    });
});

// APIs for Mirror UI
app.get('/snapshot', (req, res) => {
    if (!lastSnapshot) return res.status(503).json({ error: 'Aguardando PC local...' });
    res.json(lastSnapshot);
});

app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

// Fallback to SPA
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Mirror UI: /mirror/index.html`);
});
