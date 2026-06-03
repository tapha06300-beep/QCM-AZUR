const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = {
  sessions: {},
  config: {
    accessCode: 'AZUR2026',
    teacherPwd: 'FORMATEUR',
    duration: 1800,
    title: 'Évaluation finale — Introduction à Microsoft Azure',
    active: true
  }
};

// POST /api/start
app.post('/api/start', (req, res) => {
  const { name, group, code } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nom requis' });
  if (!group) return res.status(400).json({ error: 'Groupe requis' });
  if (code !== db.config.accessCode) return res.status(403).json({ error: 'Code d\'accès incorrect' });
  if (!db.config.active) return res.status(403).json({ error: 'Le QCM n\'est pas actif pour le moment' });

  const id = name.trim().toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
  db.sessions[id] = {
    id, name: name.trim(), group,
    status: 'en_cours', progress: 0,
    answers: [], score: null, correct: null, time: null,
    violations: [],   // tableau d'objets {type, time}
    startedAt: new Date().toISOString(), finishedAt: null
  };
  res.json({ sessionId: id, duration: db.config.duration });
});

// PATCH /api/session/:id — sync progression + violations
app.patch('/api/session/:id', (req, res) => {
  const s = db.sessions[req.params.id];
  if (!s) return res.status(404).json({ error: 'Session introuvable' });
  if (req.body.progress !== undefined) s.progress = req.body.progress;
  if (req.body.answers !== undefined) s.answers = req.body.answers;
  // violations = tableau [{type, time}]
  if (req.body.violations !== undefined) s.violations = req.body.violations;
  res.json({ ok: true });
});

// POST /api/submit/:id
app.post('/api/submit/:id', (req, res) => {
  const s = db.sessions[req.params.id];
  if (!s) return res.status(404).json({ error: 'Session introuvable' });
  const { answers, timeUsed, violations } = req.body;
  s.answers = answers;
  s.status = 'terminé';
  s.progress = answers.length;
  s.finishedAt = new Date().toISOString();
  if (violations !== undefined) s.violations = violations;

  const QCM_ANSWERS = [2,1,1,2,2,1,2,3,1,1,2,1,1,1,1,1,2,2,1,2];
  let correct = 0;
  answers.forEach((a, i) => { if (a === QCM_ANSWERS[i]) correct++; });
  s.correct = correct;
  s.score = Math.round(correct / 20 * 100);
  const mm = String(Math.floor(timeUsed / 60)).padStart(2, '0');
  const ss = String(timeUsed % 60).padStart(2, '0');
  s.time = mm + ':' + ss;

  res.json({ score: s.score, correct: s.correct, time: s.time });
});

// GET /api/results — dashboard formateur
app.get('/api/results', (req, res) => {
  const pwd = req.headers['x-teacher-pwd'];
  if (pwd !== db.config.teacherPwd) return res.status(403).json({ error: 'Accès refusé' });
  const sessions = Object.values(db.sessions);
  const done = sessions.filter(s => s.status === 'terminé');
  const avg = done.length ? Math.round(done.reduce((a, s) => a + s.score, 0) / done.length) : null;
  const totalViol = sessions.reduce((a, s) => a + (Array.isArray(s.violations) ? s.violations.length : (s.violations || 0)), 0);
  res.json({
    sessions, active: db.config.active,
    config: { accessCode: db.config.accessCode },
    stats: { total: sessions.length, done: done.length, inProgress: sessions.filter(s => s.status === 'en_cours').length, avg, violations: totalViol }
  });
});

// GET /api/session/:id/detail
app.get('/api/session/:id/detail', (req, res) => {
  const pwd = req.headers['x-teacher-pwd'];
  if (pwd !== db.config.teacherPwd) return res.status(403).json({ error: 'Accès refusé' });
  const s = db.sessions[req.params.id];
  if (!s) return res.status(404).json({ error: 'Session introuvable' });
  res.json(s);
});

// DELETE /api/results — reset
app.delete('/api/results', (req, res) => {
  const pwd = req.headers['x-teacher-pwd'];
  if (pwd !== db.config.teacherPwd) return res.status(403).json({ error: 'Accès refusé' });
  db.sessions = {};
  res.json({ ok: true });
});

// PATCH /api/config — activer/désactiver + changer mot de passe
app.patch('/api/config', (req, res) => {
  const pwd = req.headers['x-teacher-pwd'];
  if (pwd !== db.config.teacherPwd) return res.status(403).json({ error: 'Accès refusé' });
  if (req.body.active !== undefined) db.config.active = req.body.active;
  if (req.body.teacherPwd && req.body.teacherPwd.length >= 4) {
    db.config.teacherPwd = req.body.teacherPwd;
  }
  res.json({ ok: true, active: db.config.active });
});

// GET /api/status
app.get('/api/status', (req, res) => {
  res.json({ active: db.config.active, title: db.config.title });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`QCM Azure running on http://localhost:${PORT}`));
