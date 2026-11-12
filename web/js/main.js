// Gullet: menus, input, saving, the game loop, and co-op wiring.
import { W, H, FLOORS, FL, ITEM, ITEMS, UPGRADES, BOSSES, WEAPONS, WEAPON, ENEMIES, ACTIVES, ACTIVE, CHARS, CHAR, NOTES, ENDINGS, SKINS, HATS, TRAILS, SKIN, HAT, TRAIL } from './data.js';
import { buildSprites, buildChars, SPR, bosses, whiteOf, climberSprite } from './sprites.js';
import { Game } from './sim.js';
import { Renderer } from './render.js';
import { Net, Mirror } from './net.js';
import { botInput } from './bot.js';
import { initAudio, sfx, setMusic, setPrefs } from './audio.js';

const $ = s => document.querySelector(s);
const cv = $('#cv'), stage = $('#stage');
buildSprites(); buildChars(CHARS);
const R = new Renderer(cv);

// ---------- storage
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
const META = 'gullet.meta', RUN = 'gullet.run';
const meta = Object.assign({ marrow: 0, up: {}, stats: { climbs: 0, wins: 0, best: 0, kills: 0, organs: 0 }, prefs: { music: true, sfx: true }, weapon: 'salt', seenLog: '', found: [], beasts: {} }, store.get(META, {}));
meta.beasts = meta.beasts || {};
let metaDirty = false;
const hasWeapon = id => { const w = WEAPON[id]; return !!w && (!w.boss || (meta.wun || []).includes(id)); };
setInterval(() => { if (metaDirty) { metaDirty = false; saveMeta(); } }, 4000);
const VERSION = '1.9';
const LOG = [
  { v: '1.9', date: 'November 12, 2026', notes: ['Living rooms: flesh pods and bone piles to shoot open (something might be living inside), bile sacs that explode and chain into each other, pores that spit, and spike floors that rise on a beat. Some rooms digest you: acid creeps in from the walls until the room is clear.', 'Champions: rare enemies with a coloured glow and a twist. They can be swift, splitting, armoured, volatile, regenerating, ghostly or giant, and they drop extra loot.', 'Fights arrive in new ways: enemies drop from the ceiling, tear out of the walls, or wait until you reach the middle of an empty-looking room.', 'Climbers now walk and run properly instead of hopping, and the title menu fits on its plate.'] },
  { v: '1.8', date: 'November 12, 2026', notes: ['A tutorial for first-time climbers: The Mouth teaches moving, salt, dashing, levelling up, bombs, secret rooms and active items, one step at a time. It runs after the prologue the first time you play, and you can replay it from the menu.', 'The Tailor: spend marrow on 8 skins, 8 hats and 6 trails. Your look follows you into co-op.', 'Auto climb: watch an AI climb an infinite tower, at up to 4× speed. It is only a simulation, so no marrow, cards or records are kept.', 'Balance: fewer free caches (challenge rooms pay one cache and teeth, golden enemies drop teeth, a heart and a bomb) and levels take a little more XP.', 'The desktop app is out for Mac and Windows on GitHub Releases.'] },
  { v: '1.7', date: 'November 12, 2026', notes: ['A prologue: a short animated opening tells how the tower began. Watch it again from the menu.', 'Game feel: hits freeze the action for a split second, enemies squash when struck and burst when they die, damage numbers pop up (crits in gold), organs die in slow motion with a white flash, and every sound hits harder.', 'Bombs (E): they blast enemies, break lumps and teeth, and crack open hidden walls.', 'Active items (Q): eight of them, charged by kills: Stomach Pump, Ice Tray, Gauze Roll, Salt Lick, Smoke Bomb, Rubber Chicken, Lodestone and Spittoon.', 'Six climbers: Wren, Brick, Pip, Old Mags, Hollow and Fang, each with their own look and quirk. Unlock them by climbing.', 'Mr. Tapewell, the parasite in the top hat, now runs every shop and has opinions.', 'Notes from the climbers who came before: 18 of them, telling the story of the tower in order.', 'Endings for stopping the Heart and the Mind.', 'Secret rooms behind cracked walls, golden mini-bosses, three-wave challenge rooms and pitch-dark rooms.'] },
  { v: '1.6', date: 'November 12, 2026', notes: ['Infinite mode: the climb no longer stops at the heart. Six new body parts lie beyond it: the Liver, Kidneys, Tongue, Nerves, Eye and Brain, each with its own colours, music and organ to stop. After the Brain the whole tower loops, harder every time. Your deepest floor is recorded.', '30 new monsters: snipers that aim a line of light, bombers, healers, mine-laying moths, wall-crawlers, teleporting sparks, summoners, spinners, leapers, armoured vertebrae, swarms of ticks, and a molar that pretends to be a tooth on the floor.', 'Six new organs: the Bile Duke, the Twins, the Taster, the Ganglion, the Optic (watch the beam) and the Mind.', 'Six weapons won from organs: stop each of the first six for the first time to unlock the Acid Spitter, Bile Cannon, Wind Horn, Lamprey Ring, Marrow Lance and Heartstring.', 'The Index now holds 44 monsters and organs and all 12 weapons.'] },
  { v: '1.5', date: 'November 12, 2026', notes: ['The Index: every card, monster, organ and weapon in one place. What you have not found yet stays a silhouette.', 'A desktop app for Mac and Windows that runs fullscreen and works offline. Co-op still connects online.', 'The game now scales to fill your window.'] },
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
  // fill the window as far as the game's shape allows (pixels stay sharp with image-rendering: pixelated)
  const s = Math.min(iw / W, ih / H);
  stage.style.width = Math.floor(W * s) + 'px'; stage.style.height = Math.floor(H * s) + 'px';
  document.documentElement.style.setProperty('--s', Math.max(1.6, s));
}
addEventListener('resize', fit); fit();

// ---------- input
const keys = new Set();
const mouse = { x: 0, y: 0, down: false };
let dashSeq = 0, dashEdge = false, bombSeq = 0, bombEdge = false, useSeq = 0, useEdge = false;
addEventListener('keydown', e => {
  initAudio();
  const k = e.key.toLowerCase();
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  if (mode !== 'menu' && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (!keys.has(k) && (k === ' ' || k === 'shift')) { dashEdge = true; dashSeq++; }
  if (!keys.has(k) && k === 'e' && mode !== 'menu') { bombEdge = true; bombSeq++; }
  if (!keys.has(k) && k === 'q' && mode !== 'menu') { useEdge = true; useSeq++; }
  keys.add(k);
  if (mode === 'intro') { endIntro(); return; }
  if (k === 'escape' && mode !== 'menu') togglePause();
  if (['1', '2', '3', '4', '5'].includes(k) && !paused) pickCard(+k - 1);
});
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => { keys.clear(); mouse.down = false; if (mode === 'solo' && !paused && !(game && game.auto)) togglePause(); });
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
  const dash = dashEdge, bomb = bombEdge, use = useEdge; dashEdge = bombEdge = useEdge = false;
  return { mx, my, ax, ay, dash, bomb, use, ds: dashSeq, bs: bombSeq, us: useSeq };
}

// ---------- screens
let mode = 'menu', paused = false, game = null, mirror = null, net = null;
let lastGuestBs = 0, lastGuestUs = 0;
let guestMeta = null, guestIn = {}, lastGuestDs = 0, snapT = 0, roomT = 0, pendingEv = [], endShown = false;
const screens = ['title', 'coop', 'camp', 'help', 'pause', 'end', 'arm', 'log', 'index', 'ending', 'tailor'];
function show(id) {
  for (const s of screens) $('#' + s).classList.toggle('hidden', s !== id);
  if (id === 'title') refreshTitle();
  if (id === 'camp') renderCamp();
  const first = id && $('#' + id + ' .menu button:not(.hidden)');
  if (first) setTimeout(() => first.focus({ preventScroll: true }), 0);
}
function refreshTitle() {
  const opened = CHARS.filter(c => c.unlock && charOpen(c) && !(meta.charsSeen || []).includes(c.id));
  if (opened.length) { meta.charsSeen = (meta.charsSeen || []).concat(opened.map(c => c.id)); saveMeta(); setTimeout(() => toast(`<div class="fig">New climber</div><div class="nm">${opened.map(c => c.name).join(', ')}</div><div class="ds">${opened[0].quirk}</div><div class="fl">Pick them before your next climb.</div>`, 5000), 400); }
  const run = store.get(RUN, null);
  $('#bContinue').classList.toggle('hidden', !run || !!run.coop);
  const RN = ['i.', 'ii.', 'iii.', 'iv.', 'v.', 'vi.', 'vii.', 'viii.', 'ix.', 'x.', 'xi.', 'xii.'];
  [...document.querySelectorAll('#title .menu button:not(.hidden) i')].forEach((el, n) => { el.textContent = RN[n]; });
  const st = meta.stats;
  $('#contWhere').textContent = run && !run.coop ? `${run.endless ? 'Infinite, ' : ''}plate ${FL(run.fi).plate}, level ${run.level || 1}` : '';
  $('#seal b').textContent = VERSION;
  const cell = (v, l) => `<div><dt>${v}</dt><dd>${l}</dd></div>`;
  $('#ledger').innerHTML = cell(st.climbs, 'climbs') + cell(st.best ? FL(st.best - 1).plate : '–', 'deepest plate') + cell(st.inf ? FL(st.inf - 1).plate : '–', 'deepest infinite') + cell(st.organs || 0, 'organs stopped') + cell(`${(meta.found || []).length}<small>/${ITEMS.length}</small>`, 'cards kept') + (st.wins ? '' : '');
  $('#seal').classList.toggle('seen', meta.seenLog === VERSION);
  $('#verLine').textContent = `Version ${VERSION} · ${meta.marrow} marrow`;
}
document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => { if (net && mode === 'menu') { net.close(); net = null; } show('title'); });
let pendingEndless = false;
$('#bInf').onclick = () => { pendingEndless = true; openArm(); };
$('#bNew').onclick = () => { pendingEndless = false; openArm(); };
function openArm() {
  initAudio(); renderWeapons(); renderChars();
  $('#armTitle').textContent = pendingEndless ? 'Infinite climb: choose your weapon' : 'Choose your weapon';
  const run = store.get(RUN, null);
  $('#armWarn').textContent = run && !run.coop ? `Starting a new climb replaces your saved one (Plate ${FL(run.fi).plate}, level ${run.level || 1}).` : '';
  show('arm');
}
function renderWeapons() {
  const box = $('#weapons'); box.innerHTML = '';
  for (const w of WEAPONS) {
    const locked = !hasWeapon(w.id);
    const b = document.createElement('button'); b.className = 'wcard' + (meta.weapon === w.id ? ' on' : '') + (locked ? ' lock' : '');
    b.innerHTML = locked ? `<img alt="" src="${pic(SPR['w_' + w.id].c, true)}"><b>???</b><span>Stop ${BOSSES[w.boss].name} to unlock this weapon.</span><em>Locked</em>` : `<img alt="" src="${SPR['w_' + w.id].c.toDataURL()}"><b>${w.name}</b><span>${w.desc}</span><em>${w.stats}</em>`;
    b.disabled = locked;
    b.onclick = () => { meta.weapon = w.id; saveMeta(); store.del(RUN); startSolo(null, pendingEndless); };
    box.appendChild(b);
  }
}
const charOpen = c => !c.unlock || c.unlock.test(meta);
function charImg(c, locked) { return pic(SPR['c_' + c.id + '_a'].c, locked); }
function renderChars() {
  const box = $('#chars'); box.innerHTML = '';
  if (!charOpen(CHAR[meta.char] || CHAR.wren)) meta.char = 'wren';
  for (const c of CHARS) {
    const open = charOpen(c), b = document.createElement('button');
    b.className = 'ccard' + ((meta.char || 'wren') === c.id ? ' on' : '') + (open ? '' : ' lock');
    b.innerHTML = open ? `<img alt="" src="${charImg(c)}"><b>${c.name}</b><small>${c.quirk}</small>` : `<img alt="" src="${charImg(c, true)}"><b>???</b><small>${c.unlock.text}</small>`;
    b.title = open ? c.desc : 'Locked';
    b.disabled = !open;
    b.onclick = () => { meta.char = c.id; saveMeta(); renderChars(); renderCoopChars(); };
    box.appendChild(b);
  }
}
function renderCoopChars() {
  const box = $('#coopChars'); if (!box) return; box.innerHTML = '';
  for (const c of CHARS) {
    if (!charOpen(c)) continue;
    const b = document.createElement('button'); b.title = `${c.name}: ${c.quirk}`; b.className = (meta.char || 'wren') === c.id ? 'on' : '';
    b.innerHTML = `<img alt="${c.name}" src="${charImg(c)}">`;
    b.onclick = () => { meta.char = c.id; saveMeta(); renderCoopChars(); if (net && net.role === 'guest') net.send({ t: 'hello', meta: { up: meta.up, weapon: meta.weapon, char: meta.char, look: meta.look } }); };
    box.appendChild(b);
  }
}
function renderCoopWeapons() {
  const box = $('#coopWeapons'); box.innerHTML = '';
  for (const w of WEAPONS) {
    if (!hasWeapon(w.id)) continue;
    const b = document.createElement('button'); b.title = `${w.name}: ${w.stats}`; b.className = meta.weapon === w.id ? 'on' : '';
    b.innerHTML = `<img alt="${w.name}" src="${SPR['w_' + w.id].c.toDataURL()}">`;
    b.onclick = () => { meta.weapon = w.id; saveMeta(); renderCoopWeapons(); if (net && net.role === 'guest') net.send({ t: 'hello', meta: { up: meta.up, weapon: meta.weapon, char: meta.char, look: meta.look } }); };
    box.appendChild(b);
  }
}
$('#bLog').onclick = () => openLog();
$('#bIndex').onclick = () => { show('index'); renderIndex('cards'); };
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => renderIndex(b.dataset.tab));
const urlCache = new Map();
const pic = (c, locked) => { const k = c; let m = urlCache.get(k); if (!m) { m = { on: c.toDataURL(), off: whiteOf(c, '#7a6658').toDataURL() }; urlCache.set(k, m); } return locked ? m.off : m.on; };
const BOSS_PIC = () => { const B = bosses(); return { dangler: B.dangler, churn: B.churn, bellows: B.bellows, coil: B.coilHead, marrow: B.marrow, heart: B.heart, bileduke: B.bileduke, twins: B.kidney, taster: B.taster, ganglion: B.ganglion, optic: B.optic, mind: B.mind }; };
function indexEntries(tab) {
  if (tab === 'cards') return ITEMS.map((it, n) => { const got = (meta.found || []).includes(it.id); return { got, img: SPR['i_' + it.id].c, html: got ? `<span class="tag">No. ${n + 1} · card</span><b>${it.name}</b><p>${it.desc}</p><p class="fl">${it.f}</p>` : `<span class="tag">No. ${n + 1} · card</span><b>???</b><p>Not kept yet. Keep it once from a level-up and it is recorded here for good.</p>` }; });
  if (tab === 'actives') return ACTIVES.map(a => { const got = (meta.foundA || []).includes(a.id); return { got, img: SPR['a_' + a.id].c, html: got ? `<span class="tag">Active item · charge ${a.charge} kills</span><b>${a.name}</b><p>${a.desc}</p><p class="fl">${a.f}</p>` : `<span class="tag">Active item</span><b>???</b><p>Pick it up once to record it here. Look in treasure rooms, shops and secret rooms.</p>` }; });
  if (tab === 'climbers') return CHARS.map(c => { const got = charOpen(c); return { got, img: SPR['c_' + c.id + '_a'].c, html: got ? `<span class="tag">Climber</span><b>${c.name}</b><p>${c.desc}</p><p class="fl">${c.quirk}</p>` : `<span class="tag">Climber</span><b>???</b><p>To unlock: ${c.unlock.text.toLowerCase()}.</p>` }; });
  if (tab === 'notes') return NOTES.map((n, i) => { const got = i < (meta.notes || 0); return { got, img: SPR.note.c, html: got ? `<span class="tag">Note ${i + 1} of ${NOTES.length}</span><p class="fl">"${n}"</p>` : `<span class="tag">Note ${i + 1}</span><b>???</b><p>Not found yet. Notes turn up in some rooms and in every secret room.</p>` }; });
  if (tab === 'monsters') {
    const BP = BOSS_PIC();
    const mons = Object.entries(ENEMIES).map(([id, d]) => { const kills = meta.beasts[id] || 0, where = FLOORS.filter(f => f.enemies.includes(id)).map(f => f.plate).join(', '); return { got: kills > 0, img: SPR[id].c, html: kills ? `<span class="tag">Found on plates ${where}</span><b>${d.name}</b><p>${d.lore}</p><p class="tag">Killed ${kills}</p>` : `<span class="tag">Found on plates ${where}</span><b>???</b><p>Kill one to record it here.</p>` }; });
    const bs = Object.entries(BOSSES).map(([id, d]) => { const kills = meta.beasts[id] || 0, F = FLOORS.find(f => f.boss === id); return { got: kills > 0, img: BP[id], big: 1, html: kills ? `<span class="tag">Organ of plate ${F.plate} · ${F.name}</span><b>${d.name}</b><p>${d.lore}</p><p class="tag">Stopped ${kills}×</p>` : `<span class="tag">Organ of plate ${F.plate}</span><b>???</b><p>Stop this organ to record it here.</p>` }; });
    return mons.concat(bs);
  }
  return WEAPONS.map(w => { const got = hasWeapon(w.id); return { got, img: SPR['w_' + w.id].c, html: got ? `<span class="tag">Weapon${w.boss ? ' · won from ' + BOSSES[w.boss].name : ''}${meta.weapon === w.id ? ' · your current pick' : ''}</span><b>${w.name}</b><p>${w.desc}</p><p class="fl">${w.stats}</p>` : `<span class="tag">Weapon</span><b>???</b><p>Stop ${BOSSES[w.boss].name} to unlock it.</p>` }; });
}
function renderIndex(tab) {
  const nf = (meta.found || []).length, nm = Object.keys(ENEMIES).concat(Object.keys(BOSSES)).filter(k => meta.beasts[k]).length;
  const labels = { cards: `Cards ${nf}/${ITEMS.length}`, monsters: `Monsters ${nm}/${Object.keys(ENEMIES).length + Object.keys(BOSSES).length}`, weapons: `Weapons ${WEAPONS.filter(w => hasWeapon(w.id)).length}/${WEAPONS.length}`, actives: `Actives ${(meta.foundA || []).length}/${ACTIVES.length}`, climbers: `Climbers ${CHARS.filter(charOpen).length}/${CHARS.length}`, notes: `Notes ${Math.min(meta.notes || 0, NOTES.length)}/${NOTES.length}` };
  document.querySelectorAll('.tabs button').forEach(b => { b.textContent = labels[b.dataset.tab]; b.classList.toggle('on', b.dataset.tab === tab); });
  const grid = $('#ixGrid'); grid.innerHTML = ''; grid.classList.toggle('big', tab !== 'cards');
  const list = indexEntries(tab), det = $('#ixDetail');
  const select = (e, el) => { grid.querySelectorAll('.ix.on').forEach(x => x.classList.remove('on')); el.classList.add('on'); det.innerHTML = `<img class="pic" alt="" src="${pic(e.img, !e.got)}">${e.html}`; };
  list.forEach((e, i) => {
    const b = document.createElement('button'); b.className = 'ix' + (e.got ? '' : ' lock');
    b.innerHTML = `<img alt="" src="${pic(e.img, !e.got)}">`;
    b.onclick = () => select(e, b); b.onmouseenter = () => select(e, b);
    grid.appendChild(b);
    if (i === Math.max(0, list.findIndex(x => x.got))) select(e, b);
  });
}
$('#seal').onclick = () => openLog();
function openLog() {
  $('#logList').innerHTML = LOG.map(e => `<article><h3>Version ${e.v} <small>${e.date}</small></h3><ul>${e.notes.map(n => `<li>${n}</li>`).join('')}</ul></article>`).join('');
  meta.seenLog = VERSION; saveMeta(); show('log');
}
$('#bContinue').onclick = () => { initAudio(); const run = store.get(RUN, null); if (run) startSolo(run); };
$('#bCoop').onclick = () => { show('coop'); resetLobby(); renderCoopWeapons(); renderCoopChars(); };
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
const SFX = { fuse: 'fuse', bigboom: 'bigboom', secret: 'secret', active: 'active', note: 'note', gotactive: 'item', shoot: 'shoot', hit: 'hit', die: 'die', hurt: 'hurt', pick: 'pick', item: 'item', buy: 'buy', door: 'door', clear: 'clear', dash: 'dash', tele: 'tele', spit: 'spit', zap: 'zap', boom: 'boom', boss: 'boss', bossdie: 'bossdie', slam: 'slam', beat: 'beat', bite: 'bite', shield: 'shield', inhale: 'inhale', blow: 'blow', feed: 'feed', floor: 'floor', revive: 'revive', wish: 'revive', freeze: 'shield', popper: 'boom', toast: 'toast', heal: 'heal', bounce: 'bounce' };
function handleEvents(view, evs) {
  for (const e of evs) {
    R.fx(view, e);
    const rec = !(view.auto);
    if (rec && (e.k === 'die' || e.k === 'bossdie') && e.ty) { meta.beasts[e.ty] = (meta.beasts[e.ty] || 0) + 1; metaDirty = true; }
    if (rec && e.k === 'bossdie') { const w = WEAPONS.find(x => x.boss === e.ty); if (w && !(meta.wun = meta.wun || []).includes(w.id)) { meta.wun.push(w.id); saveMeta(); setTimeout(() => toast(`<div class="fig">New weapon</div><div class="nm">${w.name}</div><div class="ds">${w.desc}</div><div class="fl">Pick it before your next climb.</div>`, 4500), 2600); } }
    if (SFX[e.k]) sfx(SFX[e.k]);
    if (rec && e.k === 'item' && e.p === view.me && !(meta.found || []).includes(e.id)) { (meta.found = meta.found || []).push(e.id); saveMeta(); }
    if (e.k === 'item' && !(mode === 'guest' && e.p === 1)) itemToast(e.id, view.coop ? (e.p === view.me ? 'you kept' : 'your partner kept') : '');
    if (e.k === 'toast') toast(`<div class="ds">${e.text}</div>`, 1800);
    if (e.k === 'boss') { card(e.plate, e.name, ''); setMusic(view.fi, true); }
    if (e.k === 'bossdie') { setMusic(view.fi, false); }
    if (e.k === 'floor') { const F = FL(e.fi); card(F.plate, F.name, F.note); setMusic(e.fi); }
    if (e.k === 'wish') toast(`<div class="ds">${e.p === view.me ? 'The wishbone snapped. You got back up.' : 'Your partner\'s wishbone snapped.'}</div>`, 2200);
    if (e.k === 'levelup' && (view.enemyCount ?? view.enemies.length) > 0) toast(`<div class="ds">Level ${e.lv}. Pick a reward once the room is clear.</div>`, 1600);
    if (!rec && e.k === 'note') toast('<div class="ds">The AI found a note. Read it yourself on a real climb.</div>', 2500);
    if (rec && e.k === 'note') { const n = meta.notes || 0; if (n < NOTES.length) { meta.notes = n + 1; saveMeta(); toast(`<div class="fig">A note, left by a climber · ${n + 1} of ${NOTES.length}</div><div class="ds">"${NOTES[n]}"</div>`, 8000); $('#toast').classList.add('note'); setTimeout(() => $('#toast').classList.remove('note'), 8000); } else toast('<div class="ds">Another note. You have read them all.</div>', 2500); }
    if (rec && e.k === 'gotactive' && e.p === view.me && !(meta.foundA = meta.foundA || []).includes(e.id)) { meta.foundA.push(e.id); metaDirty = true; }
    if (e.k === 'gotactive' && e.p === view.me) { const A = ACTIVE[e.id]; toast(`<div class="fig">Active item · Q to use</div><div class="nm">${A.name}</div><div class="ds">${A.desc}</div><div class="fl">${A.f}</div>`, 3600); }
    if (rec && e.k === 'bossdie' && e.ty === 'mind' && meta.beasts.mind === 1) setTimeout(() => showEnding('mind', null), 2200);
    if (e.k === 'tut') { $('#tutStep').textContent = `Lesson ${e.step + 1} of 8`; $('#tutTitle').textContent = e.title; $('#tutText').textContent = e.text; const t = $('#tut'); t.classList.add('hidden'); void t.offsetWidth; t.classList.remove('hidden'); sfx('note'); }
    if (e.k === 'down' && view.coop) toast(`<div class="ds">${e.p === view.me ? 'You went down. Your partner has to clear the room.' : 'Your partner went down. Clear the room to bring them back.'}</div>`, 2600);
  }
}

// ---------- solo / host
function startSolo(save, endless = false) {
  initAudio();
  if (!charOpen(CHAR[meta.char] || CHAR.wren)) meta.char = 'wren';
  if (!hasWeapon(meta.weapon)) meta.weapon = 'salt';
  game = new Game({ coop: false, metas: [meta], save, endless });
  game.me = 0; mode = 'solo'; paused = false; endShown = false;
  beginRun(save);
}
function beginRun(save) {
  show(null);
  const F = FL(game.fi);
  card(F.plate, F.name, save ? 'Back where you left off.' : F.note);
  setMusic(game.fi, game.room.type === 'boss' && !game.room.cleared);
  if (!save && !game.tut && !game.auto) { meta.stats.climbs++; saveMeta(); }
  handleEvents(game, game.events.filter(e => e.k === 'boss')); game.events = [];
}
function saveRun() { if (game && (game.tut || game.auto)) return; if (game && game.state === 'play' && (mode === 'solo' || mode === 'host')) store.set(RUN, game.toSave()); }
addEventListener('beforeunload', saveRun);
addEventListener('visibilitychange', () => { if (document.hidden) saveRun(); });

function finishRun() {
  if (game && game.auto) {
    if (endShown) return; endShown = true; sfx('dead'); setMusic(-1); $('#autobar').classList.add('hidden');
    const F = FL(game.fi), p = game.players[0];
    setTimeout(() => { $('#endPlate').textContent = 'Plate ' + F.plate; $('#endWhere').textContent = F.name; $('#endTitle').textContent = 'The simulation ends.'; $('#endNote').textContent = `${CHAR[p.char].name} got as far as ${F.name.toLowerCase()}. This was only a simulation: nothing was carried home.`; $('#endStats').innerHTML = `<dt>Reached</dt><dd>Plate ${F.plate}, ${F.name}</dd><dt>Organs stopped</dt><dd>${game.bosses}</dd><dt>Things killed</dt><dd>${game.kills}</dd><dt>Level</dt><dd>${game.level}, ${p.items.length} cards</dd>`; $('#bAgain').classList.remove('hidden'); $('#bAgain').onclick = () => startAuto(); show('end'); }, 1400);
    return;
  }
  if (game && game.tut) { if (game.state === 'tutdone') { sfx('floor'); endTutorial(true); } return; }
  if (endShown) return; endShown = true;
  const won = game.state === 'won';
  const earned = game.marrow + game.fi * 8 + Math.floor(game.kills / 5) + (won ? 60 : 0);
  meta.marrow += earned;
  metaDirty = false;
  if (game.endless) meta.stats.inf = Math.max(meta.stats.inf || 0, game.fi + 1); else meta.stats.best = Math.max(meta.stats.best, game.fi + 1); meta.stats.kills += game.kills; meta.stats.organs = (meta.stats.organs || 0) + game.bosses; if (won) meta.stats.wins++;
  saveMeta(); store.del(RUN);
  const res = { endless: game.endless, won, earned, fi: game.fi, kills: game.kills, time: game.time, bosses: game.bosses, items: game.players[0].items.length };
  arcadeScore(Math.min(6, game.bosses), { floor: game.fi + 1, won, level: game.level });
  if (mode === 'host' && net) net.send({ t: 'end', ...res });
  sfx(won ? 'won' : 'dead'); setMusic(-1);
  setTimeout(() => won ? showEnding('heart', () => endScreen(res)) : endScreen(res), 1400);
}
function showEnding(which, after) {
  $('#endingWhere').textContent = which === 'heart' ? 'Plate VI · The Heart' : 'Plate XII · The Brain';
  $('#endingTitle').textContent = which === 'heart' ? 'The heart is still.' : 'The Mind is quiet.';
  $('#endingText').innerHTML = ENDINGS[which].map(l => `<p>${l}</p>`).join('');
  const wasPaused = paused; if (mode === 'solo') paused = true;
  $('#bEndingGo').onclick = () => { show(null); paused = wasPaused; if (after) after(); };
  show('ending');
}
function endScreen(r) {
  $('#bAgain').onclick = againSolo;
  const F = FL(r.fi);
  $('#endPlate').textContent = 'Plate ' + F.plate;
  $('#endWhere').textContent = F.name;
  $('#endTitle').textContent = r.won ? 'The heart is still.' : r.endless ? `Swallowed at plate ${F.plate}.` : 'Digested.';
  $('#endNote').textContent = r.endless ? `${F.name}${F.tier ? `, tier ${F.tier + 1}` : ''}. Your deepest infinite climb is plate ${FL(Math.max(0, (meta.stats.inf || 1) - 1)).plate}.` : r.won ? 'You climbed the whole tower and stopped its heart. For now it is quiet.' : `The tower got you in ${F.name.toLowerCase()}. It will remember the taste.`;
  const m = Math.floor(r.time / 60), s = String(Math.floor(r.time % 60)).padStart(2, '0');
  $('#endStats').innerHTML = `<dt>Reached</dt><dd>Plate ${F.plate}, ${F.name}</dd><dt>Organs stopped</dt><dd>${r.bosses}</dd><dt>Things killed</dt><dd>${r.kills}</dd><dt>Time inside</dt><dd>${m}:${s}</dd><dt>Marrow carried home</dt><dd>${r.earned}</dd>`;
  $('#bAgain').classList.toggle('hidden', mode === 'guest' || mode === 'host');
  show('end');
}
const againSolo = () => { leaveNet(); startSolo(null); };
$('#bAgain').onclick = againSolo;
$('#bEndCamp').onclick = () => { leaveNet(); toMenu(); show('camp'); };
$('#bEndTitle').onclick = () => { leaveNet(); toMenu(); };
function toMenu() { $('#tut').classList.add('hidden'); $('#autobar').classList.add('hidden'); mode = 'menu'; game = null; mirror = null; paused = false; setMusic(-1); show('title'); }
function leaveNet() { if (net) { net.close(); net = null; } }

// ---------- pause
function togglePause() {
  if (!$('#end').classList.contains('hidden')) return;
  paused = !paused;
  if (paused) {
    const view = mode === 'guest' ? mirror : game; if (!view) return;
    const F = FL(view.fi);
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
    $('#bSaveQuit').innerHTML = game && game.tut ? '<i>iv.</i> Skip the tutorial' : '<i>iv.</i> Save and quit';
    $('#bAbandon').innerHTML = mode === 'guest' ? '<i>iv.</i> Leave the climb' : '<i>v.</i> Abandon the climb';
    prefsLabels();
    show('pause');
  } else show(null);
}
function prefsLabels() { $('#bMusic').innerHTML = `<i>ii.</i> Music: ${meta.prefs.music ? 'on' : 'off'}`; $('#bSfx').innerHTML = `<i>iii.</i> Sounds: ${meta.prefs.sfx ? 'on' : 'off'}`; }
$('#bResume').onclick = () => togglePause();
$('#bMusic').onclick = () => { meta.prefs.music = !meta.prefs.music; setPrefs(meta.prefs.music, meta.prefs.sfx); saveMeta(); prefsLabels(); };
$('#bSfx').onclick = () => { meta.prefs.sfx = !meta.prefs.sfx; setPrefs(meta.prefs.music, meta.prefs.sfx); saveMeta(); prefsLabels(); };
$('#bSaveQuit').onclick = () => { if (game && game.tut) { endTutorial(false); return; } saveRun(); leaveNet(); toMenu(); };
$('#bAbandon').onclick = () => {
  if (mode === 'guest') { leaveNet(); toMenu(); return; }
  if (game && game.tut) { endTutorial(false); return; }
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
    if (s === 'open') { net.send({ t: 'hello', meta: { up: meta.up, weapon: meta.weapon, char: meta.char, look: meta.look } }); $('#joinStatus').textContent = 'Joined. Waiting for the host to start.'; }
    if (s === 'closed') { if (mode === 'guest') { toast('<div class="ds">The host left the climb.</div>', 3000); toMenu(); } else $('#joinStatus').textContent = why || 'Could not join that room.'; }
  });
  net.join(code);
};
$('#joinCode').addEventListener('keydown', e => { if (e.key === 'Enter') $('#bJoin').click(); });
let coopEndless = false;
document.querySelectorAll('#coopModes button').forEach(b => b.onclick = () => { coopEndless = b.dataset.mode === 'inf'; document.querySelectorAll('#coopModes button').forEach(x => x.classList.toggle('on', x === b)); if (net && net.role === 'guest') $('#joinStatus').textContent = 'The host picks the mode.'; });
$('#bStartCoop').onclick = () => startCoop(null, coopEndless);
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
    if (guestIn.bs !== undefined && guestIn.bs !== lastGuestBs) { lastGuestBs = guestIn.bs; guestIn.bombPending = true; }
    if (guestIn.us !== undefined && guestIn.us !== lastGuestUs) { lastGuestUs = guestIn.us; guestIn.usePending = true; }
  }
}
function startCoop(save, endless = false) {
  if (!hasWeapon(meta.weapon)) meta.weapon = 'salt';
  game = new Game({ coop: true, metas: [meta, guestMeta || {}], save, endless });
  game.me = 0; game.players[1].present = true;
  mode = 'host'; paused = false; endShown = false;
  net.send({ t: 'start', endless: game.endless }); net.send(game.roomMsg());
  beginRun(save);
}
function onGuestMsg(m) {
  if (m.t === 'start') { if (mode !== 'guest') { mirror = new Mirror(); mirror.endless = !!m.endless; mode = 'guest'; endShown = false; show(null); setMusic(0); const F = FL(0); card(F.plate, m.endless ? 'Infinite climb' : F.name, m.endless ? 'Past the heart, and on forever.' : F.note); } }
  if (m.t === 'room' && mirror) {
    const floorChanged = mirror.fi !== m.fi;
    mirror.applyRoom(m);
    if (floorChanged) setMusic(m.fi);
  }
  if (m.t === 's' && mirror) { mirror.applySnap(m); if (m.ev && m.ev.length) handleEvents(mirror, m.ev); }
  if (m.t === 'end') {
    if (endShown) return; endShown = true;
    meta.marrow += m.earned; meta.stats.climbs++; if (m.endless) meta.stats.inf = Math.max(meta.stats.inf || 0, m.fi + 1); else meta.stats.best = Math.max(meta.stats.best, m.fi + 1); if (m.won) meta.stats.wins++; meta.stats.kills += m.kills; meta.stats.organs = (meta.stats.organs || 0) + (m.bosses || 0); saveMeta();
    sfx(m.won ? 'won' : 'dead'); setMusic(-1);
    setTimeout(() => m.won ? showEnding('heart', () => endScreen(m)) : endScreen(m), 1400);
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

// ---------- The Tailor: cosmetics for marrow
meta.look = Object.assign({ skin: 'default', hat: 'none', trail: 'none' }, meta.look || {});
meta.owned = meta.owned || [];
const owns = (kind, id) => id === 'default' || id === 'none' || meta.owned.includes(kind + ':' + id);
let tailTab = 'skins', tailRaf = 0;
$('#bTailor').onclick = () => { show('tailor'); renderTailor('skins'); };
document.querySelectorAll('#tailTabs button').forEach(b => b.onclick = () => renderTailor(b.dataset.t));
function swatch(cols) { const c = document.createElement('canvas'); c.width = 8; c.height = 8; const g = c.getContext('2d'); [[1, 5], [3, 2], [5, 4], [6, 1], [2, 0]].forEach(([x, y], i) => { g.fillStyle = cols[i % cols.length]; g.fillRect(x, y, 2, 2); }); return c; }
function renderTailor(tab) {
  tailTab = tab;
  $('#tailMarrow').textContent = meta.marrow;
  document.querySelectorAll('#tailTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
  const ch = CHAR[meta.char] || CHAR.wren, kind = { skins: 'skin', hats: 'hat', trails: 'trail' }[tab], list = { skins: SKINS, hats: HATS, trails: TRAILS }[tab];
  $('#tailWho').textContent = ch.name;
  const grid = $('#tailGrid'); grid.innerHTML = '';
  for (const it of list) {
    const have = owns(kind, it.id), on = meta.look[kind] === it.id, poor = !have && meta.marrow < it.price;
    const b = document.createElement('button'); b.className = 'titem' + (on ? ' on' : '') + (poor ? ' poor' : '');
    let icon;
    if (kind === 'skin') { icon = document.createElement('img'); icon.src = climberSprite(ch, it, 'a').c.toDataURL(); }
    else if (kind === 'hat') { icon = document.createElement('img'); icon.src = it.id === 'none' ? climberSprite(ch, SKIN[meta.look.skin], 'a').c.toDataURL() : SPR['h_' + it.id].c.toDataURL(); }
    else icon = it.cols.length ? swatch(it.cols) : swatch(['#5a4a40']);
    b.appendChild(icon);
    b.insertAdjacentHTML('beforeend', `<b>${it.name}</b><small>${on ? 'Wearing' : have ? 'Owned · click to wear' : `${it.price} marrow`}</small>`);
    b.onclick = () => {
      if (!have) { if (meta.marrow < it.price) { sfx('toast'); return; } meta.marrow -= it.price; meta.owned.push(kind + ':' + it.id); sfx('buy'); }
      meta.look[kind] = it.id; saveMeta(); renderTailor(tab);
    };
    grid.appendChild(b);
  }
  cancelAnimationFrame(tailRaf);
  const cv = $('#tailPrev'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const parts = [];
  let last = performance.now();
  const draw = now => {
    if ($('#tailor').classList.contains('hidden')) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = now / 1000, f = Math.floor(t * 4) % 2 ? 'b' : 'a', s = climberSprite(ch, SKIN[meta.look.skin], f).c;
    g.clearRect(0, 0, cv.width, cv.height);
    const tr = TRAIL[meta.look.trail];
    if (tr.cols.length && Math.random() < 0.5) parts.push({ x: 20 + (Math.random() - 0.5) * 8, y: 38, vx: (Math.random() - 0.5) * 8, vy: meta.look.trail === 'petals' ? 8 : -20, c: tr.cols[Math.random() < 0.5 ? 0 : 1], life: 0.9, size: meta.look.trail === 'hearts' || meta.look.trail === 'smoke' ? 2 : 1 });
    for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; g.fillStyle = p.c; g.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size); }
    for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(14, 39, 12, 2);
    const bob = f === 'b' ? 1 : 0;
    g.drawImage(s, 12, 24 - bob);
    const hat = meta.look.hat !== 'none' && SPR['h_' + meta.look.hat];
    if (hat) g.drawImage(hat.c, Math.round(20 - hat.w / 2), 24 - bob + 3 - hat.h - (meta.look.hat === 'halo' ? 3 - Math.round(Math.sin(t * 3)) : 0));
    tailRaf = requestAnimationFrame(draw);
  };
  tailRaf = requestAnimationFrame(draw);
}

// ---------- Auto climb: an AI plays an infinite climb, nothing is kept
let autoSpeed = 1;
function startAuto() {
  initAudio();
  const wpns = WEAPONS.filter(w => hasWeapon(w.id)), chars = CHARS.filter(charOpen);
  const pickOne = a => a[Math.floor(Math.random() * a.length)];
  game = new Game({ coop: false, endless: true, metas: [{ ...meta, weapon: pickOne(wpns).id, char: pickOne(chars).id }] });
  game.me = 0; game.auto = true; mode = 'solo'; paused = false; endShown = false;
  show(null); setAutoSpeed(1); $('#autobar').classList.remove('hidden');
  const F = FL(0), p = game.players[0];
  card(F.plate, 'Auto climb', `${CHAR[p.char].name} with the ${WEAPON[p.weapon].name}. Sit back.`);
  setMusic(0);
}
function setAutoSpeed(n) { autoSpeed = n; document.querySelectorAll('#autobar [data-sp]').forEach(b => b.classList.toggle('on', +b.dataset.sp === n)); }
document.querySelectorAll('#autobar [data-sp]').forEach(b => b.onclick = () => setAutoSpeed(+b.dataset.sp));
$('#bAutoStop').onclick = () => { $('#autobar').classList.add('hidden'); toMenu(); };
$('#bAuto').onclick = () => startAuto();

// ---------- tutorial: The Mouth
function startTutorial() {
  initAudio();
  game = new Game({ coop: false, metas: [{ ...meta, up: {}, char: 'wren', weapon: 'salt' }], tutorial: true });
  game.me = 0; mode = 'solo'; paused = false; endShown = false;
  show(null); setMusic(0); card('0', 'The Mouth', 'Where every climb begins.');
}
function endTutorial(toArm) {
  meta.tutorialDone = 1; saveMeta();
  $('#tut').classList.add('hidden');
  mode = 'menu'; game = null; paused = false; setMusic(-1);
  if (toArm) { pendingEndless = false; openArm(); } else show('title');
}
$('#bTut').onclick = () => startTutorial();

// ---------- prologue
const INTRO = [[0, 'Long, long ago, something grew out of the earth.'], [3, 'It was alive.'], [6, 'And it was hungry.'], [9, 'People climbed in after what it took. None of them came back down.'], [12, 'Now it is your turn to climb.'], [14.2, '']];
let introT = 0, introLineIdx = -1;
function startIntro() { initAudio(); mode = 'intro'; introT = 0; introLineIdx = -1; R.parts = []; show(null); $('#intro').classList.remove('hidden'); setMusic(-1); }
function endIntro() { if (mode !== 'intro') return; mode = 'menu'; $('#intro').classList.add('hidden'); meta.seenIntro = 1; saveMeta(); R.parts = []; if (!meta.tutorialDone) startTutorial(); else show('title'); }
$('#intro').addEventListener('click', endIntro);
$('#bIntro').onclick = () => startIntro();
function tickIntro(dt) {
  introT += dt;
  let idx = 0; for (let i = 0; i < INTRO.length; i++) if (introT >= INTRO[i][0]) idx = i;
  if (idx !== introLineIdx) {
    introLineIdx = idx; const el = $('#introLine');
    el.style.opacity = 0;
    setTimeout(() => { el.textContent = INTRO[idx][1]; el.classList.toggle('big', idx === 4); el.style.opacity = 1; }, introLineIdx === 0 ? 0 : 350);
    if (idx === 1) sfx('boss'); if (idx === 2) sfx('inhale'); if (idx === 3) sfx('bite'); if (idx === 4) sfx('floor');
  }
  if (introT > 2.95 && introT - dt <= 2.95) sfx('slam');
  if (introT > 8.4 && introT - dt <= 8.4) sfx('bite');
  if (introT >= 15) endIntro();
}

// ---------- loop
let last = performance.now(), acc = 0, inT = 0;
const STEP = 1 / 60;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (mode === 'intro') { tickIntro(dt); R.drawIntro(introT, dt); }
  else if (mode === 'menu') R.drawTitle(dt);
  else if (mode === 'solo' || mode === 'host') {
    const run = !(paused && mode === 'solo');
    if (game.hitStop > 0) { game.hitStop -= dt; }
    else if (run && game.state === 'play') {
      if (game.slowmo > 0) game.slowmo -= dt;
      acc += (game.slowmo > 0 ? dt * 0.3 : dt) * (game.auto ? autoSpeed : 1);
      while (acc >= STEP) {
        const g = { ...guestIn, dash: !!guestIn.dashPending, bomb: !!guestIn.bombPending, use: !!guestIn.usePending }; guestIn.dashPending = guestIn.bombPending = guestIn.usePending = false;
        game.update(STEP, [game.auto ? botInput(game, game.players[0]) : readInput(game, 0), mode === 'host' ? g : {}]);
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
    if (inT >= 1 / 30 && net) { inT = 0; const i = readInput(mirror, 1); net.send({ t: 'in', i: { mx: i.mx, my: i.my, ax: i.ax, ay: i.ay, ds: i.ds, bs: i.bs, us: i.us } }); }
    if (mirror.room) R.draw(mirror, dt); else R.drawTitle(dt);
  }
  if (mode !== 'menu' && mode !== 'intro' && !(game && game.auto)) updateCards(); else if (cardKey) { cardKey = ''; $('#lvl').classList.add('hidden'); }
  requestAnimationFrame(frame);
}
if (!meta.seenIntro) startIntro(); else show('title');
requestAnimationFrame(frame);

// test hook for automated checks
window.GULLET = {
  get game() { return game; }, get mirror() { return mirror; }, startSolo, meta, keys, R,
  step(n = 60, inp = {}) { for (let i = 0; i < n && game.state === 'play'; i++) { game.update(STEP, [inp, {}]); const evs = game.events; game.events = []; handleEvents(game, evs); } R.draw(game, 1 / 60); },
};
