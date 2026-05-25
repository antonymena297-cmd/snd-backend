const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
require('dotenv').config();

const app = express();
const server = createServer(app);

// WebSocket para tiempo real
const wss = new WebSocketServer({ server });
global.wsClients = new Set();

wss.on('connection', (ws) => {
  console.log('Cliente WebSocket conectado');
  global.wsClients.add(ws);
  ws.on('close', () => global.wsClients.delete(ws));
});

global.broadcast = (data) => {
  const msg = JSON.stringify(data);
  global.wsClients.forEach(ws => {
    if (ws.readyState === 1) ws.send(msg);
  });
};

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rutas
app.use('/api/events', require('./routes/events'));
app.use('/api/workflows', require('./routes/workflows'));

app.get('/health', (_, res) => {
  res.json({ status: 'ok', ts: new Date(), service: 'SND Backend' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✓ SND Backend corriendo en http://localhost:${PORT}`);
  console.log(`✓ WebSocket listo en ws://localhost:${PORT}`);
});
