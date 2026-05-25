const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
require('dotenv').config();

const app = express();
const server = createServer(app);

// ==============================
// 🔌 WebSocket
// ==============================
const wss = new WebSocketServer({ server });
global.wsClients = new Set();

wss.on('connection', (ws) => {
  console.log('🔌 Cliente WebSocket conectado');

  global.wsClients.add(ws);

  ws.on('close', () => {
    console.log('❌ Cliente desconectado');
    global.wsClients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });
});

// 🔥 Broadcast global
global.broadcast = (data) => {
  const msg = JSON.stringify(data);

  global.wsClients.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(msg);
    }
  });
};

// ==============================
// 🧱 Middlewares
// ==============================
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ==============================
// 🌐 Rutas
// ==============================
app.get('/', (req, res) => {
  res.send('SND Backend funcionando 🚀');
});

app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    service: 'SND Backend',
    time: new Date()
  });
});

app.use('/api/events', require('./routes/events'));
app.use('/api/workflows', require('./routes/workflows'));

// ==============================
// 🚀 Server
// ==============================
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
