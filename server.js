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
const SECURITY_TOKEN = process.env.REMOTE_TOKEN || 'Weslei3423@';

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
  const token = req.headers['x-auth-token'] || req.body.token || req.query.token;
  if (token !== SECURITY_TOKEN) {
    return res.status(401).send('Acesso não autorizado. Use o token correto.');
  }
  next();
};

// --- Telegram Bot Endpoints ---

// Recebe mensagem do Bot e encaminha para o Local Bridge via WS
app.post('/send', (req, res) => {
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
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AgendaVet - Live Control</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; margin: 0; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { font-size: 1.25rem; color: #2dd4bf; display: flex; align-items: center; gap: 8px; }
        .card { background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px; }
        input, button { width: 100%; padding: 12px; margin: 8px 0; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: white; box-sizing: border-box; }
        button { background: #0d9488; border: none; font-weight: bold; cursor: pointer; transition: 0.2s; }
        button:active { transform: scale(0.98); }
        #terminal { 
          background: #000; 
          color: #10b981; 
          padding: 15px; 
          border-radius: 8px; 
          height: 300px; 
          overflow-y: auto; 
          font-family: 'Fira Code', monospace; 
          font-size: 11px; 
          border: 1px solid #065f46;
          white-space: pre-wrap;
        }
        .status { font-size: 10px; color: #94a3b8; text-align: right; margin-top: 4px; }
        .log-entry { color: #38bdf8; border-left: 2px solid #0369a1; padding-left: 8px; margin-bottom: 4px; border-bottom: 1px solid #33415555; padding-bottom: 2px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 AgendaVet Live Terminal</h1>
        
        <div class="card">
          <label>Senha Weslei:</label>
          <input type="password" id="token" value="${SECURITY_TOKEN}" />
          <label>Comando Terminal:</label>
          <input type="text" id="command" placeholder="ex: npm run build" />
          <button onclick="runCommand()">Executar e Monitorar</button>
        </div>

        <div id="terminal">Aguardando conexão...</div>
        <div class="status" id="ws-status">Desconectado</div>
      </div>

      <script>
        const terminal = document.getElementById('terminal');
        const status = document.getElementById('ws-status');
        let ws;

        function connect() {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          ws = new WebSocket(protocol + '//' + window.location.host);
          
          ws.onopen = () => {
            status.innerText = 'Conectado em tempo real';
            status.style.color = '#2dd4bf';
            terminal.innerHTML += '\\n[SISTEMA] Painel remoto sincronizado.\\n';
          };

          ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'stdout' || msg.type === 'stderr' || msg.type === 'log') {
              const div = document.createElement('div');
              if (msg.type === 'stdout') div.style.color = '#10b981';
              if (msg.type === 'stderr') div.style.color = '#f43f5e';
              if (msg.type === 'log') div.className = 'log-entry';
              div.innerText = msg.data;
              terminal.appendChild(div);
              terminal.scrollTop = terminal.scrollHeight;
            }
          };

          ws.onclose = () => {
            status.innerText = 'Desconectado - Reconectando...';
            status.style.color = '#f43f5e';
            setTimeout(connect, 3000);
          };
        }

        async function runCommand() {
          const token = document.getElementById('token').value;
          const command = document.getElementById('command').value;
          
          if (!command) return;
          
          terminal.innerHTML += '\\n\\n> ' + command + '\\n';
          terminal.scrollTop = terminal.scrollHeight;

          try {
            const resp = await fetch('/run-command', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, command })
            });
            
            if (resp.status === 401) {
              alert('Senha Weslei incorreta!');
            }
          } catch (e) {
            terminal.innerHTML += '\\n[ERRO] Falha ao enviar comando.\\n';
          }
        }

        connect();
      </script>
    </body>
    </html>
  `);
});

// Endpoint de Execução de Comandos (Encaminha para o Local via WS)
app.post('/run-command', authMiddleware, (req, res) => {
  const { command } = req.body;
  console.log(`[RELAY] Encaminhando comando para terminal local: ${command}`);

  // Avisa a todos (inclusive ao celular) que o comando foi solicitado
  broadcast({ type: 'stdout', data: `> ${command}\n[SISTEMA] Encaminhando para o PC local...\n` });

  // Envia o comando real para o Local Bridge
  broadcast({ type: 'remote_command', data: command });

  res.json({ status: 'forwarded' });
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
