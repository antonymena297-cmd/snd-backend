const router = require('express').Router();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const N8N_WEBHOOKS = {
  'pago.recibido':   'http://localhost:5678/webhook/pago.recibido',
  'cliente.creado':  'http://localhost:5678/webhook/cliente.creado',
  'ticket.soporte':  (payload) => payload?.prioridad === 'alta'
    ? 'http://localhost:5678/webhook/ticket.alta'
    : 'http://localhost:5678/webhook/ticket.normal',
};

router.post('/', async (req, res) => {
  try {
    const { type, payload } = req.body;
    if (!type) return res.status(400).json({ error: 'Campo "type" requerido' });

    const event = {
      id: uuidv4(),
      type,
      payload: payload || {},
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();

    if (error) throw error;

    if (global.broadcast) global.broadcast({ action: 'new_event', event: data });

    const webhook = N8N_WEBHOOKS[type];
    if (webhook) {
      const url = typeof webhook === 'function' ? webhook(payload) : webhook;
      axios.post(url, data)
        .then(() => console.log(`→ n8n disparado: ${url}`))
        .catch(err => console.log(`⚠ n8n no respondió: ${err.message}`));
    }

    console.log(`✓ Evento guardado: ${type} [${data.id}]`);
    res.status(201).json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { limit = 50, status, type } = req.query;
    let query = supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (status) query = query.eq('status', status);
    if (type)   query = query.eq('type', type);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .update({ ...req.body })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
