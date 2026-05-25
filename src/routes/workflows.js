const router = require('express').Router();

const workflows = [
  { id: 'wf_001', name: 'Onboarding de cliente', trigger: 'cliente.creado', status: 'active', runs: 342 },
  { id: 'wf_002', name: 'Conciliación de pagos', trigger: 'pago.recibido',  status: 'active', runs: 891 },
  { id: 'wf_003', name: 'Escalado de soporte',   trigger: 'ticket.soporte', status: 'active', runs: 127 },
];

router.get('/',    (_, res) => res.json(workflows));
router.get('/:id', (req, res) => {
  const wf = workflows.find(w => w.id === req.params.id);
  wf ? res.json(wf) : res.status(404).json({ error: 'No encontrado' });
});

module.exports = router;
