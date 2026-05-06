// ═══════════════════════════════════════════════════
//  DASHBOARD API — Bot Modérateur
//  Stack : Express + JSON file (zéro DB payante)
//  Deploy : Railway (même service que le bot)
// ═══════════════════════════════════════════════════
const express    = require('express');
const cors       = require('cors');
const fs         = require('fs');
const path       = require('path');
const http       = require('http');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

// ── Config ──────────────────────────────────────────
const PORT         = process.env.DASHBOARD_PORT || 3001;
const DASHBOARD_KEY = process.env.DASHBOARD_KEY  || 'changeme123'; // clé API secrète
const DATA_FILE    = path.join(__dirname, 'data.json');

// ── Données en mémoire (sync avec fichier JSON) ──────
let db = {
  sanctions: [],   // { id, userId, username, avatar, type, raison, duree, date, guild, guildId, actif }
  logs:      [],   // { id, type, message, date, userId, username }
  config: {
    botActif:      true,
    maxMsg:        5,
    fenetre:       3000,
    maxEmojis:     8,
    muteCourt:     30,
    muteMoyen:     300,
    muteLong:      3600,
    msgIdentiques: 3,
  },
  stats: {
    totalSanctions: 0,
    totalMutes:     0,
    totalWarns:     0,
    totalSpams:     0,
    totalInsultes:  0,
    mutesAujourdHui:0,
    derniereMaj: new Date().toISOString(),
  },
};

// ── Persistence JSON ─────────────────────────────────
function sauvegarder() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}
function charger() {
  if (fs.existsSync(DATA_FILE)) {
    try { db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
    catch (_) {}
  }
}
charger();

// ── Middleware ───────────────────────────────────────
app.use(cors());
app.use(express.json());

// Auth middleware
function auth(req, res, next) {
  const key = req.headers['x-dashboard-key'] || req.query.key;
  if (key !== DASHBOARD_KEY) return res.status(401).json({ error: 'Non autorisé' });
  next();
}

// ── Routes publiques ─────────────────────────────────

// Stats globales
app.get('/api/stats', auth, (req, res) => {
  // Recalculer les mutes du jour
  const today = new Date().toDateString();
  db.stats.mutesAujourdHui = db.sanctions.filter(s =>
    s.type === 'mute' && new Date(s.date).toDateString() === today
  ).length;
  db.stats.derniereMaj = new Date().toISOString();
  res.json(db.stats);
});

// Config du bot
app.get('/api/config', auth, (req, res) => res.json(db.config));
app.post('/api/config', auth, (req, res) => {
  db.config = { ...db.config, ...req.body };
  sauvegarder();
  // Broadcast aux clients connectés
  io.emit('config_update', db.config);
  res.json({ ok: true, config: db.config });
});

// Sanctions (toutes)
app.get('/api/sanctions', auth, (req, res) => {
  let s = [...db.sanctions].reverse(); // plus récent en premier
  if (req.query.type)   s = s.filter(x => x.type === req.query.type);
  if (req.query.userId) s = s.filter(x => x.userId === req.query.userId);
  if (req.query.actif)  s = s.filter(x => x.actif === (req.query.actif === 'true'));
  const page  = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  res.json({
    total: s.length,
    page,
    pages: Math.ceil(s.length / limit),
    data: s.slice((page - 1) * limit, page * limit),
  });
});

// Ajouter une sanction (appelé par le bot)
app.post('/api/sanctions', auth, (req, res) => {
  const s = {
    id:       `s_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    date:     new Date().toISOString(),
    actif:    true,
    ...req.body,
  };
  db.sanctions.push(s);
  // Maj stats
  db.stats.totalSanctions++;
  if (s.type === 'mute')    { db.stats.totalMutes++; }
  if (s.type === 'warn')    { db.stats.totalWarns++; }
  if (s.raison?.includes('Spam')) db.stats.totalSpams++;
  if (s.raison?.includes('nsulte')) db.stats.totalInsultes++;
  // Garder max 500 sanctions en mémoire
  if (db.sanctions.length > 500) db.sanctions = db.sanctions.slice(-500);
  sauvegarder();
  io.emit('new_sanction', s);
  res.json({ ok: true, id: s.id });
});

// Mettre à jour une sanction (ex: démute)
app.patch('/api/sanctions/:id', auth, (req, res) => {
  const s = db.sanctions.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Sanction introuvable' });
  Object.assign(s, req.body);
  sauvegarder();
  io.emit('update_sanction', s);
  res.json({ ok: true, sanction: s });
});

// Logs en direct
app.get('/api/logs', auth, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json(db.logs.slice(-limit).reverse());
});

// Ajouter un log (appelé par le bot)
app.post('/api/logs', auth, (req, res) => {
  const l = {
    id:   `l_${Date.now()}`,
    date: new Date().toISOString(),
    ...req.body,
  };
  db.logs.push(l);
  if (db.logs.length > 1000) db.logs = db.logs.slice(-1000);
  sauvegarder();
  io.emit('new_log', l);
  res.json({ ok: true });
});

// Historique d'un user
app.get('/api/users/:userId', auth, (req, res) => {
  const { userId } = req.params;
  const sanctions  = db.sanctions.filter(s => s.userId === userId).reverse();
  if (!sanctions.length) return res.status(404).json({ error: 'Aucune sanction pour cet utilisateur' });
  const user = {
    userId,
    username: sanctions[0]?.username || 'Inconnu',
    avatar:   sanctions[0]?.avatar   || null,
    sanctions,
    stats: {
      mutes:   sanctions.filter(s => s.type === 'mute').length,
      warns:   sanctions.filter(s => s.type === 'warn').length,
      spams:   sanctions.filter(s => s.raison?.includes('Spam')).length,
      insultes:sanctions.filter(s => s.raison?.includes('nsulte')).length,
    },
  };
  res.json(user);
});

// Sanctions actives (membres encore mutés)
app.get('/api/sanctions/actives', auth, (req, res) => {
  res.json(db.sanctions.filter(s => s.actif && s.type === 'mute').reverse());
});

// Graphe par jour (7 derniers jours)
app.get('/api/stats/graphe', auth, (req, res) => {
  const jours = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
    const dateStr = d.toDateString();
    const mutes   = db.sanctions.filter(s => s.type === 'mute' && new Date(s.date).toDateString() === dateStr).length;
    const warns   = db.sanctions.filter(s => s.type === 'warn' && new Date(s.date).toDateString() === dateStr).length;
    jours.push({ label, mutes, warns });
  }
  res.json(jours);
});

// État du bot (toggle)
app.post('/api/bot/toggle', auth, (req, res) => {
  db.config.botActif = !db.config.botActif;
  sauvegarder();
  io.emit('bot_toggle', { actif: db.config.botActif });
  res.json({ actif: db.config.botActif });
});

// ── Socket.IO (logs en temps réel) ──────────────────
io.on('connection', (socket) => {
  console.log(`🌐 Dashboard connecté : ${socket.id}`);
  // Envoyer les 20 derniers logs à la connexion
  socket.emit('init_logs', db.logs.slice(-20).reverse());
  socket.on('disconnect', () => console.log(`❌ Dashboard déconnecté : ${socket.id}`));
});

// ── Démarrage ────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🌐 Dashboard API : http://localhost:${PORT}`);
});

// ── Export pour bot.js (intégration optionnelle) ─────
module.exports = { pushLog, pushSanction };

function pushLog(type, message, userId, username) {
  const l = { id: `l_${Date.now()}`, date: new Date().toISOString(), type, message, userId, username };
  db.logs.push(l);
  if (db.logs.length > 1000) db.logs = db.logs.slice(-1000);
  sauvegarder();
  io.emit('new_log', l);
}

function pushSanction(data) {
  const s = { id: `s_${Date.now()}`, date: new Date().toISOString(), actif: true, ...data };
  db.sanctions.push(s);
  db.stats.totalSanctions++;
  if (s.type === 'mute') db.stats.totalMutes++;
  if (s.type === 'warn') db.stats.totalWarns++;
  if (s.raison?.includes('Spam')) db.stats.totalSpams++;
  if (s.raison?.includes('nsulte')) db.stats.totalInsultes++;
  if (db.sanctions.length > 500) db.sanctions = db.sanctions.slice(-500);
  sauvegarder();
  io.emit('new_sanction', s);
  return s.id;
}
