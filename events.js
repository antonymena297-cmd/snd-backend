const router = require('express').Router();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuid } = require('uuid');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// POST /api/events — Publicar un evento
router.post('/', async (req, res) => {
  try {
    const { type, payload } = req.body;

    const event = {
      id: uuid(),
      type,
      payload,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();

    if (error) throw error;

    // Notificar en tiempo real vía WebSocket
    global.broadcast({ action: 'new_event', event: data });

    // Disparar webhook en n8n si está configurado
    if (process.env.N8N_WEBHOOK_URL) {
      axios.post(`${process.env.N8N_WEBHOOK_URL}/${type}`, data)
        .catch(() => {}); // No bloquear si n8n no responde
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events — Listar eventos
router.get('/', async (req, res) => {
  const { limit = 50, status, type } = req.query;
  let query = supabase.from('events').select('*').order('created_at', { ascending: false }).limit(parseInt(limit));
  if (status) query = query.eq('status', status);
  if (type) query = query.eq('type', type);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
