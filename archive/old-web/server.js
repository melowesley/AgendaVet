import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import http from 'http';
import fs from 'fs';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 8080;
const SECURITY_TOKEN = process.env.REMOTE_TOKEN;

if (!SECURITY_TOKEN) {
  console.warn('[server] AVISO: REMOTE_TOKEN nao definido. Endpoints protegidos retornarao 503.');
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Telegram Bridge State ---
let lastAIFeedback = {
  recentText: "Aguardando comandos...",
  buttons: [],
  isGenerating: false
};

// Broadcast function for all connected clients
const broadcast = (data) => {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
};

// Intercept console.log to broadcast to WebSocket
const originalLog = console.log;
console.log = (...args) => {
  originalLog(...args);
  broadcast({ type: 'log', data: args.join(' ') });
};

// Serve static files from Vite build
app.use(express.static(path.join(__dirname, 'dist')));

// Middleware de segurança
const authMiddleware = (req, res, next) => {
  if (!SECURITY_TOKEN) {
    return res.status(503).json({ error: 'Endpoints remotos desabilitados. Configure REMOTE_TOKEN.' });
  }
  const token = req.headers['x-auth-token'] || req.body?.token || req.query.token;
  if (token !== SECURITY_TOKEN) {
    return res.status(401).json({ error: 'Token invalido.' });
  }
  next();
};

// --- Telegram Bot Endpoints ---

// Recebe mensagem do Bot e encaminha para o Local Bridge via WS
app.post('/send', authMiddleware, (req, res) => {
  const { message } = req.body;
  console.log(`[RELAY] Encaminhando mensagem para Local: ${message}`);
  broadcast({ type: 'ai_input', data: message });
  res.json({ status: 'ok', response: 'Mensagem enviada para o Antigravity local!' });
});

// Bot consulta o feedback (o que a IA "disse")
app.get('/chat-feedback', (req, res) => {
  res.json(lastAIFeedback);
});

// Bot clica em botões de aprovação
app.post('/remote-click', authMiddleware, (req, res) => {
  const { textContent, index, action } = req.body;
  console.log(`[RELAY] Encaminhando clique: ${textContent}`);
  broadcast({ type: 'remote_click', data: { textContent, index, action } });
  res.json({ status: 'ok' });
});

// Novo endpoint para o Local Bridge sincronizar o feedback
app.post('/update-feedback', authMiddleware, (req, res) => {
  if (req.body.feedback) {
    lastAIFeedback = req.body.feedback;
  }
  if (req.body.log) {
    broadcast({ type: 'stdout', data: req.body.log });
  }
  res.json({ status: 'ok' });
});

// Endpoint para receber logs do terminal local
app.post('/local-log', authMiddleware, (req, res) => {
  const { log, type } = req.body;
  broadcast({ type: type || 'stdout', data: log });
  res.json({ status: 'ok' });
});

// --- Interface Remota Premium ---
app.get('/remoto', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terminal.html'));
});

// Fallback para o SPA (Vite)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path === '/send' || req.path === '/chat-feedback' || req.path === '/remote-click') {
    return res.status(404).json({ error: 'Endpoint não encontrado' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`✅ Servidor AgendaVet Online!`);
  console.log(`🚀 Painel Mobile: http://localhost:${PORT}/remoto`);
});
