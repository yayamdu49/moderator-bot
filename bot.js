const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GatewayIntentBits,
} = require('discord.js');

const express = require("express");
const app = express();

app.use(express.json());

// =======================
// 🔥 CONFIG DYNAMIQUE
let config = {
  antiSpam: true,
  antiLien: false,
};

// 📊 DATA
let logs = [];
let sanctions = [];

// =======================
// 🤖 BOT DISCORD

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// =======================
// 💬 EVENTS

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  // LOG
  logs.push(`📨 ${message.author.tag}: ${message.content}`);

  // Anti spam (simple)
  if (config.antiSpam && message.content.length > 200) {
    message.delete().catch(() => {});

    sanctions.push({
      user: message.author.id,
      reason: "spam",
      date: Date.now(),
    });

    logs.push(`🚨 ${message.author.tag} sanctionné (spam)`);
  }
});

// =======================
// 🌐 API EXPRESS

app.get("/", (req, res) => {
  res.send("✅ Bot + Panel en ligne");
});

// 📊 Stats
app.get("/stats", (req, res) => {
  res.json({
    sanctions: sanctions.length,
    logs: logs.length,
  });
});

// ⚙️ Config
app.get("/config", (req, res) => {
  res.json(config);
});

app.post("/config", (req, res) => {
  config = req.body;
  logs.push("⚙️ Config modifiée");
  res.json({ success: true });
});

// 🚨 Logs
app.get("/logs", (req, res) => {
  res.json(logs.slice(-20));
});

// 👤 Historique user
app.get("/user/:id", (req, res) => {
  const userId = req.params.id;

  const userSanctions = sanctions.filter(s => s.user === userId);

  res.json({
    total: userSanctions.length,
    sanctions: userSanctions,
  });
});

// =======================
// 🚀 LANCEMENT

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🌐 Panel lancé sur " + PORT);
});

client.login(process.env.TOKEN);

// =============================================
// ⚙️  CONFIGURATION
// =============================================
const CONFIG = {
  TOKEN: process.env.TOKEN,
  CHEF_ID:         '888733955799519262',
  ROLE_INVINCIBLE: 'Invincible',
  ROLE_MUTE:       'Muté',
  PREFIX:          '!',

  SPAM: {
    MAX_MSG:    5,
    FENETRE:    3000,
    MAX_EMOJIS: 8,
    MUTE_COURT: 30  * 1000,
    MUTE_MOYEN: 5   * 60 * 1000,
    MUTE_LONG:  60  * 60 * 1000,
  },

  TIMEOUT_1H: 60 * 60 * 1000,

  INSULTES: [
    'connard','connarde','conasse','conne','con',
    'salope','salaud','salopard','saloparde',
    'pute','putain','putasse',
    'merde','merdeux','merdeuse',
    'encule','enculer','enculeur',
    'fdp','fils de pute','fils de p',
    'batard','batar',
    'tg','ta gueule','ferme ta gueule','la ferme',
    'idiot','idiote','imbecile',
    'abruti','abrutie','abrutis',
    'debile','debilite',
    'cretin','cretine',
    'nique','niquer','niker','niquez',
    'ntm','nique ta mere','nique ta race','nique ta famille',
    'va te faire foutre','vtff','vtf',
    'va te faire','va mourir','va crever','creve',
    'pd','pede','pedo',
    'bouffon','bouffonne',
    'baltringue','tocard','tocarde',
    'couillon','couillonne',
    'ducon','duconne',
    'raclure','ordure','fumier',
    'chienne','ta mere','tamere','ta race',
    'grosse vache','gros porc','grosse truie',
    'dechet','parasite',
    'trou du cul','trouduc',
    'enfoire','enfoiree',
    'cave','clodo','clochard',
    'mongol','mongole',
    'attarde','attardee',
    'minus','minable',
    'nul','nulle','looser','loser',
    'lache','trouillard','trouillarde',
    'sac a merde','sac a purin',
    'vieux con','vieille pute',
    'pervers','perverse',
    'inutile','boulet','naze','larve','cancre',
    'casse toi','degage','degager',
    'tepu','keuf','reuf','reubeu','renoi','feuj','keubla',
    'fuck','fucker','fucking','fucked','fck','fuk',
    'shit','shits','shitty',
    'bitch','bitches',
    'bastard','bastards',
    'asshole','assholes',
    'motherfucker',
    'whore','slut',
    'cunt','cunts',
    'dick','dickhead',
    'cock','cocksucker',
    'pussy',
    'nigga','nigger',
    'retard','retarded',
    'moron','dumbass',
    'jerk','screw you',
    'go to hell','go die','kys','kill yourself',
    'shut up','shutup',
    'worthless','trash','garbage',
    'piece of shit','pos',
    'negro','negre','negrille',
    'bamboula','youpin','youtre',
    'bougnoule','crouille','melon','bicot','raton',
    'chinetoque','niakoue',
    'sale arabe','sale noir','sale blanc',
    'sale juif','sale musulman','sale gay',
    'sale pd','sale gouine','sale trans',
    'retourne dans ton pays','va dans ton pays',
    'tapette','tarlouze','fiotte','pedale',
    'je vais te tuer','je te tue','tu vas mourir',
    'je vais te buter','je te bute','je te nique',
    'je vais te retrouver','t es mort','t es fini',
    'je sais ou tu habites','tu vas regretter',
    'rale','creve','va crever',
  ],
};
// =============================================

let botActif = true;
const casiers     = new Map();
const spamData    = new Map();
const infractions = new Map();
const mutesActifs  = new Map(); // Map<userId, timeoutId> pour démuter automatiquement
const sanctionLock = new Set(); // Verrou : userId en cours de sanction (évite l'empilement)
const appeals     = new Map(); // Map<channelId, { userId, guildId, raison, dureeMs, label, type }>

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

// ════════════════════════════════════════════
//  UTILITAIRES
// ════════════════════════════════════════════
function majStatut() {
  client.user.setActivity(
    botActif ? '👁️ Surveillance active' : '😴 Surveillance OFF', { type: 3 }
  );
}
function supprimerApres(msg, ms = 6000) {
  setTimeout(() => msg.delete().catch(() => {}), ms);
}
function estLeChef(id)    { return id === CONFIG.CHEF_ID; }
function estAdmin(m)      { return m?.permissions.has(PermissionsBitField.Flags.Administrator); }
function estInvincible(m) { return m?.roles.cache.some(r => r.name === CONFIG.ROLE_INVINCIBLE); }

function getCasier(id) {
  if (!casiers.has(id)) casiers.set(id, { warns:[], mutes:[], kicks:[], bans:[] });
  return casiers.get(id);
}
function logCasier(id, type, raison) {
  getCasier(id)[type].push({ raison, date: new Date().toISOString() });
}

// ════════════════════════════════════════════
//  CRÉER / RÉCUPÉRER LE RÔLE MUTÉ
//  → retire Send Messages dans tous les salons texte
// ════════════════════════════════════════════
async function getRoleMute(guild) {
  let role = guild.roles.cache.find(r => r.name === CONFIG.ROLE_MUTE);
  if (!role) {
    try {
      role = await guild.roles.create({
        name: CONFIG.ROLE_MUTE,
        color: 0x808080,
        reason: 'Rôle Muté créé automatiquement par le bot modérateur',
        permissions: [],
      });
      console.log(`🔇 Rôle "${CONFIG.ROLE_MUTE}" créé sur ${guild.name}`);
    } catch (err) {
      console.error('Impossible de créer le rôle Muté :', err.message);
      return null;
    }
  }

  // Appliquer les overrides sur tous les salons texte existants
  await appliquerOverridesMute(guild, role);
  return role;
}

// Retire Send Messages + Add Reactions dans chaque salon texte/thread/forum
// + retire Connect + Speak dans les salons vocaux
async function appliquerOverridesMute(guild, roleMute) {
  for (const [, salon] of guild.channels.cache) {
    try {
      if ([ChannelType.GuildText, ChannelType.GuildForum, ChannelType.GuildAnnouncement].includes(salon.type)) {
        await salon.permissionOverwrites.edit(roleMute, {
          SendMessages:          false,
          SendMessagesInThreads: false,
          AddReactions:          false,
        });
      } else if ([ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(salon.type)) {
        await salon.permissionOverwrites.edit(roleMute, {
          Connect: false,
          Speak:   false,
          Stream:  false,
        });
      }
    } catch (_) {}
  }
}

// Créer le rôle Invincible si absent
async function creerRoleInvincible(guild) {
  const existe = guild.roles.cache.find(r => r.name === CONFIG.ROLE_INVINCIBLE);
  if (!existe) {
    try {
      await guild.roles.create({
        name: CONFIG.ROLE_INVINCIBLE,
        color: 0xffd700,
        reason: 'Rôle Invincible — immunité contre les sanctions du bot',
        permissions: [],
      });
      console.log(`🌟 Rôle "${CONFIG.ROLE_INVINCIBLE}" créé sur ${guild.name}`);
    } catch (err) {
      console.error('Impossible de créer le rôle Invincible :', err.message);
    }
  }
}

// Quand un nouveau salon est créé, appliquer les overrides du rôle Muté
client.on('channelCreate', async (channel) => {
  const roleMute = channel.guild?.roles.cache.find(r => r.name === CONFIG.ROLE_MUTE);
  if (!roleMute) return;
  try {
    if ([ChannelType.GuildText, ChannelType.GuildForum, ChannelType.GuildAnnouncement].includes(channel.type)) {
      await channel.permissionOverwrites.edit(roleMute, {
        SendMessages:          false,
        SendMessagesInThreads: false,
        AddReactions:          false,
      });
    } else if ([ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(channel.type)) {
      await channel.permissionOverwrites.edit(roleMute, {
        Connect: false,
        Speak:   false,
        Stream:  false,
      });
    }
  } catch (_) {}
});

// ════════════════════════════════════════════
//  MUTER / DÉMUTER avec le rôle maison
// ════════════════════════════════════════════
async function muterMembre(membre, dureeMs, raison, guild) {
  const roleMute = await getRoleMute(guild);
  if (!roleMute) return false;

  try {
    await membre.roles.add(roleMute, raison);
    console.log(`🔇 ${membre.user.tag} muté (${dureeMs / 1000}s) — ${raison}`);

    // Annuler un éventuel démute déjà planifié
    if (mutesActifs.has(membre.id)) clearTimeout(mutesActifs.get(membre.id));

    // Planifier le démute automatique
    const tid = setTimeout(async () => {
      await demuterMembre(membre, guild);
    }, dureeMs);
    mutesActifs.set(membre.id, tid);

    return true;
  } catch (err) {
    console.error('Impossible d\'ajouter le rôle Muté :', err.message);
    return false;
  }
}

async function demuterMembre(membre, guild) {
  const roleMute = guild.roles.cache.find(r => r.name === CONFIG.ROLE_MUTE);
  if (!roleMute) return;
  try {
    await membre.roles.remove(roleMute, 'Fin de mute automatique');
    mutesActifs.delete(membre.id);
    console.log(`🔊 ${membre.user.tag} démuté`);
  } catch (_) {}
}

// ════════════════════════════════════════════
//  NORMALISATION ANTI-CONTOURNEMENT
// ════════════════════════════════════════════
function normaliser(texte) {
  return texte
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/0/g,'o').replace(/1/g,'i').replace(/3/g,'e')
    .replace(/4/g,'a').replace(/5/g,'s').replace(/8/g,'b')
    .replace(/\$/g,'s').replace(/@/g,'a').replace(/\+/g,'t')
    .replace(/9/g,'g').replace(/6/g,'g').replace(/7/g,'t')
    .replace(/\|/g,'i').replace(/!/g,'i')
    .replace(/(\w)\s+(?=\w)/g,'$1')  // "c o n" → "con"
    .replace(/(.)\1{2,}/g,'$1')      // "coooon" → "con"
    .replace(/[^a-z\s]/g,'');
}

function detecterInsulte(texte) {
  const n = normaliser(texte);
  return CONFIG.INSULTES.find(mot => {
    const motNorm = normaliser(mot);
    // Utiliser des word boundaries pour éviter les faux positifs
    // ex: "con" ne doit pas matcher dans "contestation", "condition", etc.
    const regex = new RegExp(`(?<![a-z])${motNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z])`, '');
    return regex.test(n);
  });
}

// ════════════════════════════════════════════
//  NOTIF CHEF
// ════════════════════════════════════════════
async function notifChef(embed) {
  const chef = await client.users.fetch(CONFIG.CHEF_ID).catch(() => null);
  if (!chef) return;
  try { await chef.send({ embeds: [embed] }); } catch (_) {}
}

// ════════════════════════════════════════════
//  ANTI-SPAM
// ════════════════════════════════════════════
async function verifierSpam(message) {
  const userId     = message.author.id;
  const maintenant = Date.now();
  const contenu    = message.content;

  if (!spamData.has(userId)) spamData.set(userId, { msgs:[], dernierContenu:'', compteurIdentique:0, spamCount:0 });
  const data = spamData.get(userId);

  data.msgs = data.msgs.filter(t => maintenant - t < CONFIG.SPAM.FENETRE);
  data.msgs.push(maintenant);

  const spamRapide = data.msgs.length >= CONFIG.SPAM.MAX_MSG;

  // Compteur de messages identiques consécutifs (min 3 pour déclencher)
  if (contenu.length > 3 && contenu === data.dernierContenu) {
    data.compteurIdentique++;
  } else {
    data.compteurIdentique = 0;
  }
  const msgIdentique = data.compteurIdentique >= 2; // 2 = 3ème message identique d'affilée
  data.dernierContenu = contenu;

  const nbEmojis  = (contenu.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu) || []).length;
  const spamEmoji = nbEmojis >= CONFIG.SPAM.MAX_EMOJIS;

  if (!spamRapide && !msgIdentique && !spamEmoji) return false;

  // 🔒 Verrou : si une sanction est déjà en train de s'appliquer, on ignore
  if (sanctionLock.has(userId)) {
    try { await message.delete(); } catch (_) {}
    return true;
  }
  sanctionLock.add(userId);
  // Libérer le verrou après 2s (largement suffisant pour que le rôle soit posé)
  setTimeout(() => sanctionLock.delete(userId), 2000);

  const raison = spamRapide
    ? `Spam rapide (${data.msgs.length} msgs / 3s)`
    : msgIdentique ? 'Messages identiques répétés'
    : `Spam d'emojis (${nbEmojis} emojis)`;

  try { await message.delete(); } catch (_) {}
  data.spamCount++;

  let dureeMs, label;
  if      (data.spamCount === 1) { dureeMs = CONFIG.SPAM.MUTE_COURT; label = '30 secondes'; }
  else if (data.spamCount === 2) { dureeMs = CONFIG.SPAM.MUTE_MOYEN; label = '5 minutes'; logCasier(userId,'warns',`Spam : ${raison}`); }
  else                           { dureeMs = CONFIG.SPAM.MUTE_LONG;  label = '1 heure';   logCasier(userId,'mutes',`Spam répété : ${raison}`); }

  // Fetch membre fiable
  const membre = message.member ?? await message.guild.members.fetch(userId).catch(() => null);
  if (!membre) return true;

  const ok = await muterMembre(membre, dureeMs, raison, message.guild);

  // Envoyer le système d'appeal
  await envoyerAppeal(message.guild, membre, raison, dureeMs, label, 'mute', message.channel);

  try {
    await message.author.send(
      `🛑 **[${message.guild.name}]** Tu as été muté(e) pour spam.\n` +
      `📋 **Raison :** ${raison}\n` +
      `⏱️ **Durée :** ${label}\n` +
      `_(Le rôle **${CONFIG.ROLE_MUTE}** t'a été attribué — il sera retiré automatiquement.)_`
    );
  } catch (_) {}

  const embed = new EmbedBuilder()
    .setColor(0xff6600)
    .setTitle(`🚨 Anti-Spam — Mute ${label}`)
    .addFields(
      { name:'👤 Membre',   value:`${message.author.tag} (<@${userId}>)`, inline:true },
      { name:'🆔 ID',       value:userId, inline:true },
      { name:'📋 Raison',   value:raison },
      { name:'⏱️ Durée',   value:label, inline:true },
      { name:'📊 Spam n°',  value:`${data.spamCount}`, inline:true },
      { name:'✅ Appliqué', value:ok ? 'Oui' : '❌ Échec (permissions)', inline:true },
    ).setTimestamp();
  await notifChef(embed);

  return true;
}

// ════════════════════════════════════════════
//  PRÊT
// ════════════════════════════════════════════
client.once('ready', async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
  majStatut();
  for (const [, guild] of client.guilds.cache) {
    await creerRoleInvincible(guild);
    await getRoleMute(guild); // crée + applique overrides
  }
});

client.on('guildCreate', async (guild) => {
  await creerRoleInvincible(guild);
  await getRoleMute(guild);
});

// ════════════════════════════════════════════
//  MESSAGES
// ════════════════════════════════════════════
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content)   return;

  const bas = message.content.trim().toLowerCase();

  // ═══════════════════════════
  //  COMMANDES !
  // ═══════════════════════════
  if (bas.startsWith(CONFIG.PREFIX)) {
    const args = bas.split(/\s+/);
    const cmd  = args[0];

    // !on / !off — CHEF UNIQUEMENT
    if (cmd === '!off' || cmd === '!on') {
      try { await message.delete(); } catch (_) {}
      if (!estLeChef(message.author.id)) {
        try { await message.author.send('🚫 Seul le chef peut utiliser `!on` / `!off`.'); } catch (_) {}
        return;
      }
      botActif = (cmd === '!on');
      majStatut();
      const m = await message.channel.send(botActif ? '🟢 Surveillance **activée**.' : '🔴 Surveillance **désactivée**.');
      supprimerApres(m);
      return;
    }

    // Vérif admin pour les autres commandes
    if (!estAdmin(message.member) && !estLeChef(message.author.id)) {
      try { await message.delete(); } catch (_) {}
      try { await message.author.send('❌ Tu n\'as pas la permission d\'utiliser les commandes du bot.'); } catch (_) {}
      return;
    }

    // !demute @user
    if (cmd === '!demute') {
      try { await message.delete(); } catch (_) {}
      const cible = message.mentions.members.first();
      if (!cible) { const m = await message.channel.send('❌ `!demute @utilisateur`'); supprimerApres(m,4000); return; }
      await demuterMembre(cible, message.guild);
      const m = await message.channel.send(`🔊 <@${cible.id}> a été démuté(e).`);
      supprimerApres(m);
      return;
    }

    // !unsanction @user — retire la sanction en cours (démute + reset spam)
    if (cmd === '!unsanction') {
      try { await message.delete(); } catch (_) {}
      const cible = message.mentions.members.first();
      if (!cible) { const m = await message.channel.send('❌ `!unsanction @utilisateur`'); supprimerApres(m,4000); return; }

      // Démuter
      await demuterMembre(cible, message.guild);

      // Annuler le verrou s'il est actif
      sanctionLock.delete(cible.id);

      // Remettre le spamCount à 0 pour repartir de zéro
      if (spamData.has(cible.id)) spamData.get(cible.id).spamCount = 0;

      const m = await message.channel.send(
        `✅ Sanction retirée pour <@${cible.id}> — démuté(e) et compteur spam remis à zéro.`
      );
      supprimerApres(m);
      return;
    }

    // !mute @user <durée en minutes>
    if (cmd === '!mute') {
      try { await message.delete(); } catch (_) {}
      const cible   = message.mentions.members.first();
      const minutes = parseInt(args[2]) || 10;
      if (!cible) { const m = await message.channel.send('❌ `!mute @utilisateur <minutes>`'); supprimerApres(m,4000); return; }
      await muterMembre(cible, minutes * 60 * 1000, 'Mute manuel par un admin', message.guild);
      logCasier(cible.id, 'mutes', `Mute manuel ${minutes}min par ${message.author.tag}`);
      const m = await message.channel.send(`🔇 <@${cible.id}> muté(e) pendant **${minutes} minutes**.`);
      supprimerApres(m);
      return;
    }

    // !reset @user
    if (cmd === '!reset') {
      try { await message.delete(); } catch (_) {}
      const cible = message.mentions.users.first();
      if (!cible) { const m = await message.channel.send('❌ `!reset @utilisateur`'); supprimerApres(m,4000); return; }
      infractions.delete(cible.id);
      spamData.delete(cible.id);
      casiers.delete(cible.id);
      if (mutesActifs.has(cible.id)) { clearTimeout(mutesActifs.get(cible.id)); mutesActifs.delete(cible.id); }
      const m = await message.channel.send(`✅ Casier de <@${cible.id}> remis à zéro.`);
      supprimerApres(m);
      return;
    }

    // !infractions @user
    if (cmd === '!infractions') {
      try { await message.delete(); } catch (_) {}
      const cible = message.mentions.users.first();
      if (!cible) { const m = await message.channel.send('❌ `!infractions @utilisateur`'); supprimerApres(m,4000); return; }
      const nb = infractions.get(cible.id) || 0;
      const sp = spamData.get(cible.id)?.spamCount || 0;
      const ca = getCasier(cible.id);
      const m  = await message.channel.send(
        `📊 **Casier rapide de <@${cible.id}>**\n` +
        `⚠️ Warns : **${ca.warns.length}** | 🔇 Mutes : **${ca.mutes.length}** | 💬 Insultes : **${nb}** | 🛑 Spams : **${sp}**`
      );
      supprimerApres(m, 10000);
      return;
    }

    // !casier @user
    if (cmd === '!casier' || cmd === '!modlogs') {
      try { await message.delete(); } catch (_) {}
      const cible = message.mentions.users.first();
      if (!cible) { const m = await message.channel.send('❌ `!casier @utilisateur`'); supprimerApres(m,4000); return; }
      const ca  = getCasier(cible.id);
      const fmt = (liste) => liste.length
        ? liste.map((e,i) => `\`${i+1}.\` ${e.raison} — <t:${Math.floor(new Date(e.date).getTime()/1000)}:R>`).join('\n')
        : '*Aucune*';
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`📋 Casier de ${cible.tag}`)
        .setThumbnail(cible.displayAvatarURL())
        .addFields(
          { name:`⚠️ Avertissements (${ca.warns.length})`, value:fmt(ca.warns) },
          { name:`🔇 Mutes (${ca.mutes.length})`,          value:fmt(ca.mutes) },
          { name:`👢 Kicks (${ca.kicks.length})`,           value:fmt(ca.kicks) },
          { name:`🔨 Bans (${ca.bans.length})`,             value:fmt(ca.bans)  },
        )
        .setFooter({ text:`ID : ${cible.id}` })
        .setTimestamp();
      try {
        await message.author.send({ embeds:[embed] });
        const m = await message.channel.send('📨 Casier envoyé en MP !');
        supprimerApres(m, 4000);
      } catch (_) {
        const m = await message.channel.send({ embeds:[embed] });
        supprimerApres(m, 15000);
      }
      return;
    }

    // !help
    if (cmd === '!help') {
      try { await message.delete(); } catch (_) {}
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('📖 Aide — Bot Modérateur')
        .setDescription('Toutes les commandes utilisent le préfixe `!`')
        .addFields(
          {
            name:'🔐 Chef uniquement',
            value:'`!on` — Activer la surveillance\n`!off` — Désactiver la surveillance',
          },
          {
            name:'🛡️ Admins',
            value:
              '`!mute @user <minutes>` — Muter manuellement\n' +
              '`!demute @user` — Démuter manuellement\n' +
              '`!unsanction @user` — Retirer la sanction en cours (démute + reset spam)\n' +
              '`!reset @user` — Vider tout le casier\n' +
              '`!infractions @user` — Résumé rapide\n' +
              '`!casier @user` — Casier complet\n' +
              '`!help` — Cette aide',
          },
          {
            name:'⚙️ Automatique — Insultes',
            value:
              '› 1ère → Avertissement en MP\n' +
              '› 2ème → Avertissement final en MP\n' +
              '› 3ème → Rôle **Muté** pendant **1 heure**',
          },
          {
            name:'🛑 Automatique — Spam',
            value:
              '› 1er spam → Rôle **Muté** **30 secondes**\n' +
              '› 2ème spam → Rôle **Muté** **5 minutes** + warn\n' +
              '› 3ème spam → Rôle **Muté** **1 heure**',
          },
          {
            name:'🌟 Rôles automatiques',
            value:
              '**Muté** — Créé automatiquement, retire l\'accès à tous les salons\n' +
              '**Invincible** — Immunise contre toutes les sanctions du bot',
          },
        )
        .setFooter({ text:'Tous les messages de commande disparaissent automatiquement.' })
        .setTimestamp();
      try {
        await message.author.send({ embeds:[embed] });
        const m = await message.channel.send('📨 Aide envoyée en MP !');
        supprimerApres(m, 4000);
      } catch (_) {
        const m = await message.channel.send({ embeds:[embed] });
        supprimerApres(m, 15000);
      }
      return;
    }

    return;
  }

  // ═══════════════════════════
  //  SURVEILLANCE
  // ═══════════════════════════
  if (!botActif) return;
  if (estInvincible(message.member)) return;

  // 1. Anti-spam
  const estSpam = await verifierSpam(message);
  if (estSpam) return;

  // 2. Insultes
  const insulteDetectee = detecterInsulte(message.content);
  if (!insulteDetectee) return;

  const userId          = message.author.id;
  const messageOriginal = message.content;
  const nb              = (infractions.get(userId) || 0) + 1;
  infractions.set(userId, nb);

  console.log(`⚠️ [${message.author.tag}] "${insulteDetectee}" — infraction n°${nb}`);
  try { await message.delete(); } catch (_) {}

  // Fetch membre fiable
  const membre = message.member ?? await message.guild.members.fetch(userId).catch(() => null);

  // ── Avert 1 ──
  if (nb === 1) {
    logCasier(userId, 'warns', `Insulte (1ère) : "${insulteDetectee}"`);
    try {
      await message.author.send(
        `⚠️ **[${message.guild.name} — #${message.channel.name}]**\n` +
        `Pas d'insulte sur ce serveur, sinon sanction !\n📊 **Avertissement 1/2**`
      );
    } catch (_) {}
    const embed = new EmbedBuilder().setColor(0xffa500).setTitle('🚨 Avertissement 1/2')
      .addFields(
        { name:'👤 Auteur', value:`${message.author.tag} (<@${userId}>)`, inline:true },
        { name:'📌 Salon',  value:`#${message.channel.name}`, inline:true },
        { name:'🔍 Insulte', value:`\`${insulteDetectee}\``, inline:true },
        { name:'💬 Message', value:`\`\`\`${messageOriginal.slice(0,600)}\`\`\`` },
      ).setTimestamp();
    await notifChef(embed);
  }

  // ── Avert 2 ──
  else if (nb === 2) {
    logCasier(userId, 'warns', `Insulte (2ème) : "${insulteDetectee}"`);
    try {
      await message.author.send(
        `⚠️ **[${message.guild.name} — #${message.channel.name}]**\n` +
        `⚡ **Dernier avertissement !** Prochaine insulte = **mute 1 heure**.\n📊 **Avertissement 2/2**`
      );
    } catch (_) {}
    const embed = new EmbedBuilder().setColor(0xff8800).setTitle('🚨 Avertissement 2/2 (dernier)')
      .addFields(
        { name:'👤 Auteur', value:`${message.author.tag} (<@${userId}>)`, inline:true },
        { name:'📌 Salon',  value:`#${message.channel.name}`, inline:true },
        { name:'🔍 Insulte', value:`\`${insulteDetectee}\``, inline:true },
        { name:'💬 Message', value:`\`\`\`${messageOriginal.slice(0,600)}\`\`\`` },
      ).setTimestamp();
    await notifChef(embed);
  }

  // ── 3ème → Mute 1h via rôle ──
  else if (nb >= 3) {
    logCasier(userId, 'mutes', `Mute 1h — insultes répétées : "${insulteDetectee}"`);

    try {
      const embedMp = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🔇 Vous avez été muté(e)')
        .setDescription(
          `Vous avez reçu le rôle **${CONFIG.ROLE_MUTE}** sur **${message.guild.name}**.\n\n` +
          `Vous ne pouvez plus écrire pendant **1 heure**.\n` +
          `En attente de vérification d'un modérateur.\n\n` +
          `*Si erreur, excusez-nous — je suis un bot qui peut faire des erreurs.*`
        )
        .addFields(
          { name:'⏱️ Durée', value:'**1 heure**' },
          { name:'🔍 Raison', value:`Insulte répétée : \`${insulteDetectee}\`` },
          { name:'📊 Infractions', value:`${nb}` },
        ).setTimestamp();
      await message.author.send({ embeds:[embedMp] });
    } catch (_) {}

    if (membre) {
      await muterMembre(membre, CONFIG.TIMEOUT_1H, `Insultes répétées (${nb} infractions)`, message.guild);
      await envoyerAppeal(message.guild, membre, `Insulte répétée : ${insulteDetectee}`, CONFIG.TIMEOUT_1H, '1 heure', 'mute', message.channel);
    }

    infractions.set(userId, 0);

    const embed = new EmbedBuilder().setColor(0xff0000).setTitle('🚨 Mute 1h appliqué via rôle')
      .addFields(
        { name:'👤 Auteur', value:`${message.author.tag} (<@${userId}>)`, inline:true },
        { name:'📌 Salon',  value:`#${message.channel.name}`, inline:true },
        { name:'🔍 Insulte', value:`\`${insulteDetectee}\``, inline:true },
        { name:'📊 Infractions', value:`${nb}`, inline:true },
        { name:'💬 Message', value:`\`\`\`${messageOriginal.slice(0,600)}\`\`\`` },
      ).setTimestamp();
    await notifChef(embed);
  }
});

// ════════════════════════════════════════════
//  SYSTÈME D'APPEAL (contestations de sanction)
// ════════════════════════════════════════════

// Stocke les données d'appeal en attente (avant que le membre clique)
// Map<appealId, { userId, guildId, raison, dureeMs, label, type }>
const appealsPending = new Map();

/**
 * Envoie un MP au membre avec un bouton "Contester ma sanction".
 * Le ticket n'est créé QUE si le membre clique sur le bouton.
 */
async function envoyerAppeal(guild, membre, raison, dureeMs, label, type, salonNotif) {
  // Générer un ID unique pour cet appeal
  const appealId = `${membre.id}_${Date.now()}`;

  // Stocker les données en attente
  appealsPending.set(appealId, {
    userId:  membre.id,
    guildId: guild.id,
    raison,
    dureeMs,
    label,
    type,
    ouvertLe: new Date().toISOString(),
  });

  // Supprimer l'appeal pending après 48h (évite les fuites mémoire)
  setTimeout(() => appealsPending.delete(appealId), 48 * 60 * 60 * 1000);

  // Envoyer le MP avec le bouton "Contester"
  const embedMp = new EmbedBuilder()
    .setColor(0xff6600)
    .setTitle('⚖️ Tu peux contester ta sanction')
    .setDescription(
      `Tu as reçu une sanction sur **${guild.name}**.\n\n` +
      `Si tu penses qu'il s'agit d'une erreur, clique sur le bouton ci-dessous pour ouvrir un ticket de contestation.\n\n` +
      `*Un administrateur examinera ta demande.*`
    )
    .addFields(
      { name: '⚖️ Sanction', value: type === 'mute' ? `🔇 Mute **${label}**` : type, inline: true },
      { name: '📋 Raison',   value: raison, inline: true },
    )
    .setFooter({ text: 'Ce bouton expire après 48h.' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`open_appeal_${appealId}`)
      .setLabel('📋 Contester ma sanction')
      .setStyle(ButtonStyle.Primary),
  );

  try {
    await membre.user.send({ embeds: [embedMp], components: [row] });
    console.log(`📨 Bouton de contestation envoyé en MP à ${membre.user.tag}`);
  } catch (_) {
    console.log(`⚠️ Impossible d'envoyer le MP à ${membre.user.tag} (MP fermés ?)`);
  }
}

/**
 * Crée le ticket d'appeal dans le serveur (appelé quand le membre clique sur "Contester")
 */
async function creerTicketAppeal(guild, membre, appealData, appealId) {
  const { raison, dureeMs, label, type } = appealData;

  // ── 1. Trouver ou créer la catégorie "Appeals"
  let categorie = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === 'appeals'
  );
  if (!categorie) {
    try {
      categorie = await guild.channels.create({
        name: 'Appeals',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [{ id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] }],
        reason: 'Catégorie Appeals créée automatiquement',
      });
    } catch (_) {}
  }

  // ── 2. Créer le salon de ticket (visible par l'admin + le membre)
  let ticketSalon;
  try {
    const overwrites = [
      { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: membre.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
    ];
    // Ajouter tous les rôles admin
    for (const [, role] of guild.roles.cache) {
      if (role.permissions.has(PermissionsBitField.Flags.Administrator)) {
        overwrites.push({ id: role.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
      }
    }
    ticketSalon = await guild.channels.create({
      name: `appeal-${membre.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      type: ChannelType.GuildText,
      parent: categorie?.id,
      topic: `Appeal de <@${membre.id}> — Sanction : ${label} — Raison : ${raison}`,
      permissionOverwrites: overwrites,
      reason: `Ticket d'appeal pour ${membre.user.tag}`,
    });
  } catch (err) {
    console.error('Impossible de créer le salon appeal :', err.message);
    return null;
  }

  // ── 3. Stocker les infos de l'appeal actif
  appeals.set(ticketSalon.id, {
    userId:  membre.id,
    guildId: guild.id,
    raison,
    dureeMs,
    label,
    type,
    ouvertLe: new Date().toISOString(),
  });

  // ── 4. Embed + boutons admin dans le ticket
  const embedTicket = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`📋 Appeal — ${membre.user.tag}`)
    .setThumbnail(membre.user.displayAvatarURL())
    .setDescription(
      `<@${membre.id}> conteste sa sanction.\n\n` +
      `En attente d'une décision d'un **administrateur**.`
    )
    .addFields(
      { name: '⚖️ Sanction',    value: type === 'mute' ? `🔇 Mute **${label}**` : type, inline: true },
      { name: '📋 Raison',      value: raison, inline: true },
      { name: '👤 Membre',      value: `<@${membre.id}> (\`${membre.id}\`)` },
      { name: '🕐 Date',        value: `<t:${Math.floor(Date.now()/1000)}:F>` },
    )
    .setFooter({ text: 'Utilisez les boutons ci-dessous pour décider.' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`appeal_annuler_${ticketSalon.id}`)
      .setLabel('❌ Annuler la sanction')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`appeal_reduire_${ticketSalon.id}`)
      .setLabel('✂️ Réduire de moitié')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`appeal_augmenter_${ticketSalon.id}`)
      .setLabel('⬆️ Doubler la sanction')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`appeal_fermer_${ticketSalon.id}`)
      .setLabel('🔒 Fermer le ticket')
      .setStyle(ButtonStyle.Secondary),
  );

  await ticketSalon.send({
    content: `<@${membre.id}> — Voici ton ticket d'appeal. Un admin va examiner ta demande.`,
    embeds:  [embedTicket],
    components: [row],
  });

  console.log(`📋 Appeal créé pour ${membre.user.tag} dans #${ticketSalon.name}`);
  return ticketSalon;
}

// ── Handler boutons appeal ──
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  const { customId } = interaction;

  // ── Bouton "Contester ma sanction" (cliqué depuis le MP) ──
  if (customId.startsWith('open_appeal_')) {
    const appealId   = customId.replace('open_appeal_', '');
    const pendingData = appealsPending.get(appealId);

    if (!pendingData) {
      return interaction.reply({
        content: '❌ Ce bouton a expiré ou la demande est introuvable.',
        ephemeral: true,
      });
    }

    // Récupérer le serveur et le membre
    const guild = client.guilds.cache.get(pendingData.guildId);
    if (!guild) {
      return interaction.reply({ content: '❌ Serveur introuvable.', ephemeral: true });
    }
    let membre;
    try { membre = await guild.members.fetch(pendingData.userId); } catch (_) {}
    if (!membre) {
      return interaction.reply({ content: '❌ Membre introuvable sur le serveur.', ephemeral: true });
    }

    // Vérifier qu'un ticket n'est pas déjà ouvert pour ce membre
    const dejaOuvert = [...appeals.values()].find(a => a.userId === pendingData.userId);
    if (dejaOuvert) {
      return interaction.reply({
        content: '❌ Tu as déjà un ticket de contestation ouvert. Attends sa résolution.',
        ephemeral: true,
      });
    }

    await interaction.deferUpdate();

    // Créer le ticket
    const ticketSalon = await creerTicketAppeal(guild, membre, pendingData, appealId);

    // Supprimer la donnée pending
    appealsPending.delete(appealId);

    // Désactiver le bouton dans le MP
    const rowDisabled = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('_appeal_done')
        .setLabel('✅ Ticket ouvert — en attente d\'un admin')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
    );
    try { await interaction.message.edit({ components: [rowDisabled] }); } catch (_) {}

    if (ticketSalon) {
      try {
        await interaction.user.send(
          `✅ Ton ticket de contestation a été créé sur **${guild.name}** : ${ticketSalon}\nUn administrateur va examiner ta demande.`
        );
      } catch (_) {}
    }
    return;
  }

  if (!customId.startsWith('appeal_')) return;

  const { guild, member: adminMembre } = interaction;

  // Vérif droits admin
  if (!estAdmin(adminMembre) && !estLeChef(interaction.user.id)) {
    return interaction.reply({ content: '❌ Réservé aux administrateurs.', ephemeral: true });
  }

  const parts       = customId.split('_');
  const action      = parts[1];        // annuler | reduire | augmenter | fermer
  const ticketId    = parts.slice(2).join('_');
  const appealData  = appeals.get(ticketId);

  if (!appealData && action !== 'fermer') {
    return interaction.reply({ content: '❌ Données introuvables pour cet appeal.', ephemeral: true });
  }

  const ticketSalon = guild.channels.cache.get(ticketId);
  const userId      = appealData?.userId;
  let cibleMembre;
  try { cibleMembre = await guild.members.fetch(userId); } catch (_) {}

  await interaction.deferUpdate();

  // Désactiver les boutons
  const rowDisabled = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('_1').setLabel('❌ Annuler la sanction').setStyle(ButtonStyle.Success).setDisabled(true),
    new ButtonBuilder().setCustomId('_2').setLabel('✂️ Réduire de moitié').setStyle(ButtonStyle.Primary).setDisabled(true),
    new ButtonBuilder().setCustomId('_3').setLabel('⬆️ Doubler la sanction').setStyle(ButtonStyle.Danger).setDisabled(true),
    new ButtonBuilder().setCustomId('_4').setLabel('🔒 Fermer le ticket').setStyle(ButtonStyle.Secondary).setDisabled(true),
  );
  try { await interaction.message.edit({ components: [rowDisabled] }); } catch (_) {}

  let resultMsg = '';

  if (action === 'annuler') {
    // Démuter immédiatement
    if (cibleMembre) await demuterMembre(cibleMembre, guild);
    if (mutesActifs.has(userId)) { clearTimeout(mutesActifs.get(userId)); mutesActifs.delete(userId); }
    logCasier(userId, 'warns', `[Appeal] Sanction annulée par ${interaction.user.tag}`);
    resultMsg = `✅ **Sanction annulée** par ${interaction.user.tag} — <@${userId}> a été démuté(e) immédiatement.`;
    try {
      await guild.members.fetch(userId).then(m => m.user.send(
        `✅ **[${guild.name}]** Ton appeal a été **accepté** — ta sanction a été annulée par un administrateur.`
      ));
    } catch (_) {}
  }

  else if (action === 'reduire') {
    // Réduire la durée restante de moitié
    if (mutesActifs.has(userId)) {
      clearTimeout(mutesActifs.get(userId));
      const moitie = Math.floor(appealData.dureeMs / 2);
      if (cibleMembre) {
        const tid = setTimeout(() => demuterMembre(cibleMembre, guild), moitie);
        mutesActifs.set(userId, tid);
      }
      const labMoitie = moitie < 60000 ? `${Math.round(moitie/1000)}s` : moitie < 3600000 ? `${Math.round(moitie/60000)}min` : `${Math.round(moitie/3600000)}h`;
      resultMsg = `✂️ **Sanction réduite** par ${interaction.user.tag} — durée réduite à **${labMoitie}**.`;
      try {
        await guild.members.fetch(userId).then(m => m.user.send(
          `✂️ **[${guild.name}]** Ton appeal a été **partiellement accepté** — ta sanction a été réduite de moitié.`
        ));
      } catch (_) {}
    } else {
      // Déjà démuté entre-temps
      resultMsg = `ℹ️ Le membre est déjà démuté (sanction expirée).`;
    }
  }

  else if (action === 'augmenter') {
    // Doubler la durée restante
    if (mutesActifs.has(userId)) {
      clearTimeout(mutesActifs.get(userId));
      const double = appealData.dureeMs * 2;
      if (cibleMembre) {
        const tid = setTimeout(() => demuterMembre(cibleMembre, guild), double);
        mutesActifs.set(userId, tid);
      }
      const labDouble = double < 60000 ? `${Math.round(double/1000)}s` : double < 3600000 ? `${Math.round(double/60000)}min` : `${Math.round(double/3600000)}h`;
      resultMsg = `⬆️ **Sanction augmentée** par ${interaction.user.tag} — durée portée à **${labDouble}**.`;
      try {
        await guild.members.fetch(userId).then(m => m.user.send(
          `⬆️ **[${guild.name}]** Ton appeal a été **refusé** — ta sanction a été allongée.`
        ));
      } catch (_) {}
    } else {
      if (cibleMembre) await muterMembre(cibleMembre, appealData.dureeMs * 2, 'Appeal refusé — sanction doublée', guild);
      resultMsg = `⬆️ **Sanction re-appliquée et doublée** par ${interaction.user.tag}.`;
    }
  }

  else if (action === 'fermer') {
    resultMsg = `🔒 Ticket fermé par ${interaction.user.tag} sans modification de la sanction.`;
  }

  // Envoyer le résultat dans le ticket puis le fermer après 10s
  if (ticketSalon) {
    try {
      await ticketSalon.send({
        embeds: [
          new EmbedBuilder()
            .setColor(action === 'annuler' ? 0x57f287 : action === 'augmenter' ? 0xed4245 : action === 'reduire' ? 0x5865f2 : 0x99aab5)
            .setTitle('⚖️ Décision prise')
            .setDescription(resultMsg)
            .setTimestamp()
        ]
      });
      setTimeout(() => ticketSalon.delete('Ticket appeal fermé').catch(() => {}), 10000);
    } catch (_) {}
  }

  appeals.delete(ticketId);
});

// Déconnecter les membres mutés des salons vocaux s'ils y sont déjà
client.on('voiceStateUpdate', async (oldState, newState) => {
  if (!newState.member) return;
  const roleMute = newState.guild.roles.cache.find(r => r.name === CONFIG.ROLE_MUTE);
  if (!roleMute) return;
  if (newState.channelId && newState.member.roles.cache.has(roleMute.id)) {
    try { await newState.disconnect('Membre muté — accès vocal interdit'); } catch (_) {}
  }
});

client.login(CONFIG.TOKEN);