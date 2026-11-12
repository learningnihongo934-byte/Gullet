// Gullet: menus, input, saving, the game loop, and co-op wiring.
import { W, H, FLOORS, ITEM, ITEMS, UPGRADES, BOSSES, WEAPONS, WEAPON } from './data.js';
import { buildSprites, SPR } from './sprites.js';
import { Game } from './sim.js';
import { Renderer } from './render.js';
import { Net, Mirror } from './net.js';
import { initAudio, sfx, setMusic, setPrefs } from './audio.js';

const $ = s => document.querySelector(s);
const cv = $('#cv'), stage = $('#stage');
buildSprites();
const R = new Renderer(cv);

// ---------- storage
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
const META = 'gullet.meta', RUN = 'gullet.run';
const meta = Object.assign({ marrow: 0, up: {}, stats: { climbs: 0, wins: 0, best: 0, kills: 0, organs: 0 }, prefs: { music: true, sfx: true }, weapon: 'salt', seenLog: '', found: [] }, store.get(META, {}));
const VERSION = '1.4';
const LOG = [
  { v: '1.4', date: 'November 12, 2026', notes: ['66 new cards: 150 in all. New ones bring pets that follow you and shoot, thorns, dodging, a Deck of Cards that shows extra choices, finishing blows, damage streaks, XP boosts and bone shards that burst out of dead enemies.', 'Starting weapons: Salt, Pepper Spray, Pebble Sling, Vinegar Flask, Bone Boomerang and Matchsticks. Pick one before each climb. In co-op, each climber picks their own.', 'A new title screen: the tower breathes, chews and watches you climb.', 'Your collection: the title screen counts how many of the 150 cards you have ever kept.', 'This update log.'] },
  { v: '1.3', date: 'November 12, 2026', notes: ['50 new cards (84 in all), including the Wishbone, Snow Globe, Garlic Clove, Fishhook, Shrapnel and Toothbrush.', 'Each card has its own hand-drawn sprite.'] },
  { v: '1.2', date: 'November 12, 2026', notes: ['Dashing makes you completely untouchable. Shots pass straight through you.', 'A short grace window after each dash, so you can\'t get clipped coming out of it.', 'You can dash while standing still. You go the way you are facing.'] },
  { v: '1.1', date: 'November 12, 2026', notes: ['Items now come from levelling up. Every kill feeds XP, and each level you keep one of three cards once the room is clear.', 'Treasure rooms, shops, feeding altars and bosses give wrapped caches: a free level each.'] },
  { v: '1.0', date: 'November 11, 2026', notes: ['The first climb: six floors, six organs that fight back, rooms that bite, save and quit, Basecamp grafts and online co-op for two.'] },
];
const saveMeta = () => store.set(META, meta);
setPrefs(meta.prefs.music, meta.prefs.sfx);

const arcadeScore = (score, m) => { try { if (window.parent !== window) window.parent.postMessage({ rennkoArcade: 1, type: 'score', score, meta: m }, 'https://arcade.rennko.tech'); } catch {} };

// ---------- layout
function fit() {
  const iw = innerWidth, ih = innerHeight;
  let s = Math.floor(Math.min(iw / W, ih / H));
  if (s < 1) s = Math.min(iw / W, ih / H);
  stage.style.width = W * s + 'px'; stage.style.height = H * s + 'px';
  document.documentElement.style.setProperty('--s', Math.max(1.6, s));
}
addEventListener('resize', fit); fit();

// ---------- input
const keys = new Set();
const mouse = { x: 0, y: 0, down: false };
let dashSeq = 0, dashEdge = false;
addEventListener('keydown', e => {
  initAudio();
  const k = e.key.toLowerCase();
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  if (mode !== 'menu' && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (!keys.has(k) && (k === ' ' || k === 'shift')) { dashEdge = true; dashSeq++; }
  keys.add(k);
  if (k === 'escape' && mode !== 'menu') togglePause();
  if (['1', '2', '3', '4', '5'].includes(k) && !paused) pickCard(+k - 1);
});
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => { keys.clear(); mouse.down = false; if (mode === 'solo' && !paused) togglePause(); });
cv.addEventListener('mousedown', e => { initAudio(); mouse.down = true; moveMouse(e); });
addEventListener('mouseup', () => { mouse.down = false; });
cv.addEventListener('mousemove', moveMouse);
cv.addEventListener('contextmenu', e => e.preventDefault());
function moveMouse(e) { const r = cv.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / r.width * W; mouse.y = (e.clientY - r.top) / r.height * H; }
addEventListener('pointerdown', () => initAudio(), { once: true });

function readInput(view, me) {
  const k = n => keys.has(n);
  let mx = (k('d') ? 1 : 0) - (k('a') ? 1 : 0), my = (k('s') ? 1 : 0) - (k('w') ? 1 : 0);
  let ax = (k('arrowright') ? 1 : 0) - (k('arrowleft') ? 1 : 0), ay = (k('arrowdown') ? 1 : 0) - (k('arrowup') ? 1 : 0);
  const p = view && view.players[me];
  if (!ax && !ay && mouse.down && p) { ax = mouse.x - p.x; ay = mouse.y - (p.y - 4); }
  const dash = dashEdge; dashEdge = false;
  return { mx, my, ax, ay, dash, ds: dashSeq };
}

// ---------- screens
let mode = 'menu', paused = false, game = null, mirror = null, net = null;
let guestMeta = null, guestIn = {}, lastGuestDs = 0, snapT = 0, roomT = 0, pendingEv = [], endShown = false;
const screens = ['title', 'coop', 'camp', 'help', 'pause', 'end', 'arm', 'log'];
function show(id) {
  for (const s of screens) $('#' + s).classList.toggle('hidden', s !== id);
  if (id === 'title') refreshTitle();
  if (id === 'camp') renderCamp();
  const first = id && $('#' + id + ' .menu button:not(.hidden)');
  if (first) setTimeout(() => first.focus({ preventScroll: true }), 0);
}
function refreshTitle() {
  const run = store.get(RUN, null);
  $('#bContinue').classList.toggle('hidden', !run || !!run.coop);
  const RN = ['i.', 'ii.', 'iii.', 'iv.', 'v.', 'vi.'];
  [...document.querySelectorAll('#title .menu button:not(.hidden) i')].forEach((el, n) => { el.textContent = RN[n]; });
  const st = meta.stats;
  $('#contWhere').textContent = run && !run.coop ? `Plate ${FLOORS[run.fi].plate}, level ${run.level || 1}` : '';
  const cell = (v, l) => `<div><dt>${v}</dt><dd>${l}</dd></div>`;
  $('#ledger').innerHTML = cell(st.climbs, 'climbs') + cell(st.best ? FLOORS[Math.min(5, st.best - 1)].plate : '–', 'deepest plate') + cell(st.organs || 0, 'organs stopped') + cell(`${(meta.found || []).length}<small>/${ITEMS.length}</small>`, 'cards kept') + (st.wins ? '' : '');
  $('#seal').classList.toggle('seen', meta.seenLog === VERSION);
  $('#verLine').textContent = `Version ${VERSION} · ${meta.marrow} marrow`;
}
document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => { if (net && mode === 'menu') { net.close(); net = null; } show('title'); });
$('#bNew').onclick = () => {
  initAudio(); renderWeapons();
  const run = store.get(RUN, null);
  $('#armWarn').textContent = run && !run.coop ? `Starting a new climb replaces your saved one (Plate ${FLOORS[run.fi].plate}, level ${run.level || 1}).` : '';
  show('arm');
};
function renderWeapons() {
  const box = $('#weapons'); box.innerHTML = '';
  for (const w of WEAPONS) {
    const b = document.createElement('button'); b.className = 'wcard' + (meta.weapon === w.id ? ' on' : '');
    b.innerHTML = `<img alt="" src="${SPR['w_' + w.id].c.toDataURL()}"><b>${w.name}</b><span>${w.desc}</span><em>${w.stats}</em>`;
    b.onclick = () => { meta.weapon = w.id; saveMeta(); store.del(RUN); startSolo(null); };
    box.appendChild(b);
  }
}
function renderCoopWeapons() {
  const box = $('#coopWeapons'); box.innerHTML = '';
  for (const w of WEAPONS) {
    const b = document.createElement('button'); b.title = `${w.name}: ${w.stats}`; b.className = meta.weapon === w.id ? 'on' : '';
    b.innerHTML = `<img alt="${w.name}" src="${SPR['w_' + w.id].c.toDataURL()}">`;
    b.onclick = () => { meta.weapon = w.id; saveMeta(); renderCoopWeapons(); if (net && net.role === 'guest') net.send({ t: 'hello', meta: { up: meta.up, weapon: meta.weapon } }); };
    box.appendChild(b);
  }
}
$('#bLog').onclick = () => openLog();
$('#seal').onclick = () => openLog();
function openLog() {
  $('#logList').innerHTML = LOG.map(e => `<article><h3>Version ${e.v} <small>${e.date}</small></h3><ul>${e.notes.map(n => `<li>${n}</li>`).join('')}</ul></article>`).join('');
  meta.seenLog = VERSION; saveMeta(); show('log');
}
$('#bContinue').onclick = () => { initAudio(); const run = store.get(RUN, null); if (run) startSolo(run); };
$('#bCoop').onclick = () => { show('coop'); resetLobby(); renderCoopWeapons(); };
$('#bCamp').onclick = () => show('camp');
$('#bHelp').onclick = () => show('help');

function renderCamp() {
  $('#campMarrow').textContent = meta.marrow;
  const box = $('#ups'); box.innerHTML = '';
  for (const u of UPGRADES) {
    const lv = meta.up[u.id] || 0, maxed = lv >= u.max, cost = u.cost(lv);
    const row = document.createElement('div'); row.className = 'up';
    row.innerHTML = `<b>${u.name}</b><small>${u.desc}</small><span class="pips">${Array.from({ length: u.max }, (_, i) => `<span class="pip${i < lv ? ' on' : ''}"></span>`).join('')}</span>`;
    const b = document.createElement('button'); b.className = 'ink';
    b.textContent = maxed ? 'Grafted' : `Graft · ${cost} marrow`;
    b.disabled = maxed || meta.marrow < cost;
    b.onclick = () => { meta.marrow -= cost; meta.up[u.id] = lv + 1; saveMeta(); sfx('buy'); renderCamp(); };
    row.appendChild(b); box.appendChild(row);
  }
}

// ---------- toasts and cards
let toastTimer = 0;
function toast(html, ms = 3200) { const t = $('#toast'); t.innerHTML = html; t.classList.remove('hidden'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('hidden'), ms); }
let figNo = 1;
function itemToast(id, who) {
  const it = ITEM[id]; if (!it) return;
  toast(`<div class="fig">Fig. ${figNo++}${who ? ' · ' + who : ''}</div><div class="nm">${it.name}</div><div class="ds">${it.desc}</div><div class="fl">${it.f}</div>`);
}
function card(plate, name, note) {
  const c = $('#card'); c.classList.add('hidden'); void c.offsetWidth;
  c.innerHTML = `<div class="pl">PLATE ${plate}</div><div class="nm">${name}</div>${note ? `<div class="nt">${note}</div>` : ''}`;
  c.classList.remove('hidden');
  clearTimeout(card.t); card.t = setTimeout(() => c.classList.add('hidden'), 2400);
}

// ---------- events from the sim (host + solo locally, guest via snapshots)
const SFX = { shoot: 'shoot', hit: 'hit', die: 'die', hurt: 'hurt', pick: 'pick', item: 'item', buy: 'buy', door: 'door', clear: 'clear', dash: 'dash', tele: 'tele', spit: 'spit', zap: 'zap', boom: 'boom', boss: 'boss', bossdie: 'bossdie', slam: 'slam', beat: 'beat', bite: 'bite', shield: 'shield', inhale: 'inhale', blow: 'blow', feed: 'feed', floor: 'floor', revive: 'revive', wish: 'revive', freeze: 'shield', popper: 'boom', toast: 'toast', heal: 'heal', bounce: 'bounce' };
function handleEvents(view, evs) {
  for (const e of evs) {
    R.fx(view, e);
    if (SFX[e.k]) sfx(SFX[e.k]);
    if (e.k === 'item' && e.p === view.me && !(meta.found || []).includes(e.id)) { (meta.found = meta.found || []).push(e.id); saveMeta(); }
    if (e.k === 'item' && !(mode === 'guest' && e.p === 1)) itemToast(e.id, view.coop ? (e.p === view.me ? 'you kept' : 'your partner kept') : '');
    if (e.k === 'toast') toast(`<div class="ds">${e.text}</div>`, 1800);
    if (e.k === 'boss') { card(e.plate, e.name, ''); setMusic(view.fi, true); }
    if (e.k === 'bossdie') { setMusic(view.fi, false); }
    if (e.k === 'floor') { const F = FLOORS[e.fi]; card(F.plate, F.name, F.note); setMusic(e.fi); }
    if (e.k === 'wish') toast(`<div class="ds">${e.p === view.me ? 'The wishbone snapped. You got back up.' : 'Your partner\'s wishbone snapped.'}</div>`, 2200);
    if (e.k === 'levelup' && (view.enemyCount ?? view.enemies.length) > 0) toast(`<div class="ds">Level ${e.lv}. Pick a reward once the room is clear.</div>`, 1600);
    if (e.k === 'down' && view.coop) toast(`<div class="ds">${e.p === view.me ? 'You went down. Your partner has to clear the room.' : 'Your partner went down. Clear the room to bring them back.'}</div>`, 2600);
  }
}

// ---------- solo / host
function startSolo(save) {
  initAudio();
  game = new Game({ coop: false, metas: [meta], save });
  game.me = 0; mode = 'solo'; paused = false; endShown = false;
  beginRun(save);
}
function beginRun(save) {
  show(null);
  const F = FLOORS[game.fi];
  card(F.plate, F.name, save ? 'Back where you left off.' : F.note);
  setMusic(game.fi, game.room.type === 'boss' && !game.room.cleared);
  if (!save) { meta.stats.climbs++; saveMeta(); }
  handleEvents(game, game.events.filter(e => e.k === 'boss')); game.events = [];
}
function saveRun() { if (game && game.state === 'play' && (mode === 'solo' || mode === 'host')) store.set(RUN, game.toSave()); }
addEventListener('beforeunload', saveRun);
addEventListener('visibilitychange', () => { if (document.hidden) saveRun(); });

function finishRun() {
  if (endShown) return; endShown = true;
  const won = game.state === 'won';
  const earned = game.marrow + game.fi * 8 + Math.floor(game.kills / 5) + (won ? 60 : 0);
  meta.marrow += earned;
  meta.stats.best = Math.max(meta.stats.best, game.fi + 1); meta.stats.kills += game.kills; meta.stats.organs = (meta.stats.organs || 0) + game.bosses; if (won) meta.stats.wins++;
  saveMeta(); store.del(RUN);
  const res = { won, earned, fi: game.fi, kills: game.kills, time: game.time, bosses: game.bosses, items: game.players[0].items.length };
  arcadeScore(game.bosses, { floor: game.fi + 1, won, level: game.level });
  if (mode === 'host' && net) net.send({ t: 'end', ...res });
  sfx(won ? 'won' : 'dead'); setMusic(-1);
  setTimeout(() => endScreen(res), 1400);
}
function endScreen(r) {
  const F = FLOORS[r.fi];
  $('#endPlate').textContent = 'Plate ' + F.plate;
  $('#endWhere').textContent = F.name;
  $('#endTitle').textContent = r.won ? 'The heart is still.' : 'Digested.';
  $('#endNote').textContent = r.won ? 'You climbed the whole tower and stopped its heart. For now it is quiet.' : `The tower got you in ${F.name.toLowerCase()}. It will remember the taste.`;
  const m = Math.floor(r.time / 60), s = String(Math.floor(r.time % 60)).padStart(2, '0');
  $('#endStats').innerHTML = `<dt>Reached</dt><dd>Plate ${F.plate}, ${F.name}</dd><dt>Organs stopped</dt><dd>${r.bosses}</dd><dt>Things killed</dt><dd>${r.kills}</dd><dt>Time inside</dt><dd>${m}:${s}</dd><dt>Marrow carried home</dt><dd>${r.earned}</dd>`;
  $('#bAgain').classList.toggle('hidden', mode === 'guest' || mode === 'host');
  show('end');
}
$('#bAgain').onclick = () => { leaveNet(); startSolo(null); };
$('#bEndCamp').onclick = () => { leaveNet(); toMenu(); show('camp'); };
$('#bEndTitle').onclick = () => { leaveNet(); toMenu(); };
function toMenu() { mode = 'menu'; game = null; mirror = null; paused = false; setMusic(-1); show('title'); }
function leaveNet() { if (net) { net.close(); net = null; } }

// ---------- pause
function togglePause() {
  if (!$('#end').classList.contains('hidden')) return;
  paused = !paused;
  if (paused) {
    const view = mode === 'guest' ? mirror : game; if (!view) return;
    const F = FLOORS[view.fi];
    $('#pauseWhere').textContent = `Plate ${F.plate} · ${F.name}`;
    const myp = view.players[mode === 'guest' ? 1 : 0], wpn = WEAPON[myp && myp.weapon] || WEAPON.salt;
    $('#pauseWeapon').textContent = `Carrying: ${wpn.name}. ${wpn.stats}.`;
    $('#pauseNote').textContent = mode === 'solo' ? 'The tower waits. It is patient.' : 'Co-op keeps running while this is open.';
    const list = $('#itemList'); list.innerHTML = '';
    view.players.forEach((p, i) => {
      if (!p.present && i > 0) return;
      if (view.coop) { const w = document.createElement('div'); w.className = 'who'; w.textContent = i === view.me ? 'Your pockets' : "Your partner's pockets"; list.appendChild(w); }
      if (!(p.items || []).length) { const n = document.createElement('div'); n.className = 'it'; n.textContent = 'Nothing yet'; list.appendChild(n); }
      for (const id of p.items || []) { const it = ITEM[id]; if (!it) continue; const d = document.createElement('div'); d.className = 'it'; d.title = it.desc; d.innerHTML = `<img alt="" src="${SPR['i_' + id].c.toDataURL()}">${it.name}`; list.appendChild(d); }
    });
    $('#bSaveQuit').classList.toggle('hidden', mode === 'guest');
    $('#bAbandon').innerHTML = mode === 'guest' ? '<i>iv.</i> Leave the climb' : '<i>v.</i> Abandon the climb';
    prefsLabels();
    show('pause');
  } else show(null);
}
function prefsLabels() { $('#bMusic').innerHTML = `<i>ii.</i> Music: ${meta.prefs.music ? 'on' : 'off'}`; $('#bSfx').innerHTML = `<i>iii.</i> Sounds: ${meta.prefs.sfx ? 'on' : 'off'}`; }
$('#bResume').onclick = () => togglePause();
$('#bMusic').onclick = () => { meta.prefs.music = !meta.prefs.music; setPrefs(meta.prefs.music, meta.prefs.sfx); saveMeta(); prefsLabels(); };
$('#bSfx').onclick = () => { meta.prefs.sfx = !meta.prefs.sfx; setPrefs(meta.prefs.music, meta.prefs.sfx); saveMeta(); prefsLabels(); };
$('#bSaveQuit').onclick = () => { saveRun(); leaveNet(); toMenu(); };
$('#bAbandon').onclick = () => {
  if (mode === 'guest') { leaveNet(); toMenu(); return; }
  const b = $('#bAbandon');
  if (!b.dataset.sure) { b.dataset.sure = '1'; b.innerHTML = '<i>v.</i> Click again to abandon (you keep your marrow)'; setTimeout(() => { delete b.dataset.sure; b.innerHTML = '<i>v.</i> Abandon the climb'; }, 3000); return; }
  delete b.dataset.sure;
  paused = false; game.state = 'dead'; finishRun();
};

// ---------- co-op lobby
function resetLobby() {
  $('#roomCode').textContent = ''; $('#hostStatus').textContent = ''; $('#joinStatus').textContent = '';
  $('#bStartCoop').classList.add('hidden'); $('#bContCoop').classList.add('hidden'); $('#bHost').disabled = false;
  guestMeta = null;
}
$('#bHost').onclick = async () => {
  initAudio(); leaveNet();
  $('#hostStatus').textContent = 'Opening a room…'; $('#bHost').disabled = true;
  net = new Net(onHostMsg, s => { if (s === 'closed') $('#hostStatus').textContent = 'Lost the connection. Open a new room.'; });
  try {
    const code = await net.host();
    $('#roomCode').textContent = code;
    $('#hostStatus').textContent = 'Waiting for your friend. Send them the code.';
  } catch (err) { $('#hostStatus').textContent = 'Could not open a room. ' + err.message; $('#bHost').disabled = false; }
};
$('#bJoin').onclick = () => {
  initAudio(); leaveNet();
  const code = $('#joinCode').value.trim().toUpperCase();
  if (code.length !== 4) { $('#joinStatus').textContent = 'Codes are four letters.'; return; }
  $('#joinStatus').textContent = 'Joining…';
  net = new Net(onGuestMsg, (s, why) => {
    if (s === 'open') { net.send({ t: 'hello', meta: { up: meta.up, weapon: meta.weapon } }); $('#joinStatus').textContent = 'Joined. Waiting for the host to start.'; }
    if (s === 'closed') { if (mode === 'guest') { toast('<div class="ds">The host left the climb.</div>', 3000); toMenu(); } else $('#joinStatus').textContent = why || 'Could not join that room.'; }
  });
  net.join(code);
};
$('#joinCode').addEventListener('keydown', e => { if (e.key === 'Enter') $('#bJoin').click(); });
$('#bStartCoop').onclick = () => startCoop(null);
$('#bContCoop').onclick = () => { const run = store.get(RUN, null); if (run) startCoop(run); };

function onHostMsg(m) {
  if (m.t === 'peer') {
    if (game && mode === 'host') {
      game.players[1].present = !!m.on;
      if (m.on) { net.send({ t: 'start' }); net.send(game.roomMsg()); toast('<div class="ds">Your partner is back.</div>', 2000); }
      else toast('<div class="ds">Your partner dropped out. They can rejoin with the same code.</div>', 3000);
    } else if (!m.on) { $('#hostStatus').textContent = 'Your friend left. Waiting…'; $('#bStartCoop').classList.add('hidden'); $('#bContCoop').classList.add('hidden'); }
  }
  if (m.t === 'hello') {
    guestMeta = m.meta || {};
    if (!game) {
      $('#hostStatus').textContent = 'Your friend is here.';
      $('#bStartCoop').classList.remove('hidden');
      const run = store.get(RUN, null);
      $('#bContCoop').classList.toggle('hidden', !(run && run.coop));
    }
  }
  if (m.t === 'pick' && game) game.choose(1, m.i);
  if (m.t === 'in') {
    guestIn = m.i || {};
    if (guestIn.ds !== undefined && guestIn.ds !== lastGuestDs) { lastGuestDs = guestIn.ds; guestIn.dashPending = true; }
  }
}
function startCoop(save) {
  game = new Game({ coop: true, metas: [meta, guestMeta || {}], save });
  game.me = 0; game.players[1].present = true;
  mode = 'host'; paused = false; endShown = false;
  net.send({ t: 'start' }); net.send(game.roomMsg());
  beginRun(save);
}
function onGuestMsg(m) {
  if (m.t === 'start') { if (mode !== 'guest') { mirror = new Mirror(); mode = 'guest'; endShown = false; show(null); setMusic(0); } }
  if (m.t === 'room' && mirror) {
    const floorChanged = mirror.fi !== m.fi;
    mirror.applyRoom(m);
    if (floorChanged) setMusic(m.fi);
  }
  if (m.t === 's' && mirror) { mirror.applySnap(m); if (m.ev && m.ev.length) handleEvents(mirror, m.ev); }
  if (m.t === 'end') {
    if (endShown) return; endShown = true;
    meta.marrow += m.earned; meta.stats.climbs++; meta.stats.best = Math.max(meta.stats.best, m.fi + 1); if (m.won) meta.stats.wins++; meta.stats.kills += m.kills; meta.stats.organs = (meta.stats.organs || 0) + (m.bosses || 0); saveMeta();
    sfx(m.won ? 'won' : 'dead'); setMusic(-1);
    setTimeout(() => endScreen(m), 1400);
  }
  if (m.t === 'peer' && !m.on && mode === 'guest') { toast('<div class="ds">The host left the climb.</div>', 3000); leaveNet(); toMenu(); }
}

// ---------- level-up cards (1 of 3)
let cardKey = '';
function myView() { return mode === 'guest' ? mirror : game; }
function updateCards() {
  const v = myView(), me = mode === 'guest' ? 1 : 0;
  const p = v && v.players[me];
  const safe = v && (mode === 'guest' ? v.enemyCount === 0 : v.enemies.length === 0);
  const offer = p && safe && !paused && v.state === 'play' ? p.offer : null;
  const key = offer ? offer.join(',') + ':' + p.pend : '';
  if (key === cardKey) return;
  cardKey = key;
  const box = $('#lvl');
  if (!offer) { box.classList.add('hidden'); return; }
  $('#lvlNo').textContent = v.level;
  $('#lvlOf').textContent = ['one', 'two', 'three', 'four', 'five'][offer.length - 1];
  $('#lvlMore').textContent = p.pend > 1 ? `(${p.pend - 1} more after this)` : '';
  const cards = $('#cards'); cards.innerHTML = '';
  offer.forEach((id, i) => {
    const it = ITEM[id]; if (!it) return;
    const have = (p.items || []).filter(x => x === id).length;
    const b = document.createElement('button'); b.className = 'cardi';
    b.innerHTML = `<img alt="" src="${SPR['i_' + id].c.toDataURL()}"><span class="k">[${i + 1}]${have ? ' · you have ' + have : ''}</span><span class="nm">${it.name}</span><span class="ds">${it.desc}</span><span class="fl">${it.f}</span>`;
    b.onclick = () => pickCard(i);
    cards.appendChild(b);
  });
  box.classList.remove('hidden');
  sfx('levelup');
}
function pickCard(i) {
  if (!cardKey) return;
  const v = myView(); if (!v) return;
  if (mode === 'guest') { const p = v.players[1]; if (p && p.offer) { itemToast(p.offer[i], 'you kept'); p.offer = null; net && net.send({ t: 'pick', i }); } }
  else if (game) game.choose(0, i);
  sfx('pickcard');
  cardKey = '__'; $('#lvl').classList.add('hidden');
}

// ---------- loop
let last = performance.now(), acc = 0, inT = 0;
const STEP = 1 / 60;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (mode === 'menu') R.drawTitle(dt);
  else if (mode === 'solo' || mode === 'host') {
    const run = !(paused && mode === 'solo');
    if (run && game.state === 'play') {
      acc += dt;
      while (acc >= STEP) {
        const g = { ...guestIn, dash: !!guestIn.dashPending }; guestIn.dashPending = false;
        game.update(STEP, [readInput(game, 0), mode === 'host' ? g : {}]);
        acc -= STEP;
        const evs = game.events; game.events = [];
        handleEvents(game, evs);
        if (mode === 'host') pendingEv.push(...evs.filter(e => e.k !== 'shoot' || Math.random() < 0.5));
        if (game.state !== 'play') break;
      }
    } else acc = 0;
    if (game.wantSave) { game.wantSave = false; saveRun(); }
    if (mode === 'host' && net) {
      snapT += dt; roomT += dt;
      if (game.roomChanged || roomT > 2) { game.roomChanged = false; roomT = 0; net.send(game.roomMsg()); }
      if (snapT >= 0.05) { snapT = 0; const s = game.snap(); s.ev = pendingEv.splice(0, 80); net.send(s); }
    }
    R.draw(game, dt);
    if (game.state !== 'play') finishRun();
  } else if (mode === 'guest' && mirror) {
    mirror.tick(dt);
    inT += dt;
    if (inT >= 1 / 30 && net) { inT = 0; const i = readInput(mirror, 1); net.send({ t: 'in', i: { mx: i.mx, my: i.my, ax: i.ax, ay: i.ay, ds: i.ds } }); }
    if (mirror.room) R.draw(mirror, dt); else R.drawTitle(dt);
  }
  if (mode !== 'menu') updateCards(); else if (cardKey) { cardKey = ''; $('#lvl').classList.add('hidden'); }
  requestAnimationFrame(frame);
}
show('title');
requestAnimationFrame(frame);

// test hook for automated checks
window.GULLET = {
  get game() { return game; }, get mirror() { return mirror; }, startSolo, meta, keys,
  step(n = 60, inp = {}) { for (let i = 0; i < n && game.state === 'play'; i++) { game.update(STEP, [inp, {}]); const evs = game.events; game.events = []; handleEvents(game, evs); } R.draw(game, 1 / 60); },
};
