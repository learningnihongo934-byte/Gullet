// Checks the 1.7 systems: actives, bombs (lumps + secret walls), challenge waves, elites, climbers, notes, shop talk.
import { Game } from '../web/js/sim.js';
import { ACTIVES, CHARS, OX, OY, TILE, DOORS } from '../web/js/data.js';
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('ok  ', m); };
const step = (g, n, inp = [{}]) => { for (let i = 0; i < n; i++) { g.update(1 / 60, inp); g.events.splice(0); } };
// every active item fires in a fight
for (const a of ACTIVES) {
  const g = new Game({ coop: false, metas: [{}] }), p = g.players[0];
  g.enterRoom(g.floor.rooms.find(r => r.type === 'fight'), 'n'); step(g, 50);
  p.active = a.id; p.charge = 99; p.inv = 9;
  const hp0 = g.enemies.reduce((s, e) => s + e.hp, 0);
  g.update(1 / 60, [{ use: true }]); const evs = g.events.splice(0);
  ok(evs.some(e => e.k === 'active'), `active ${a.id} used (enemy hp ${Math.round(hp0)} -> ${Math.round(g.enemies.reduce((s, e) => s + e.hp, 0))})`);
  step(g, 120);
}
// bombs: break lumps, open a secret wall
{
  const g = new Game({ coop: false, metas: [{}] }), p = g.players[0];
  const room = g.floor.rooms.find(r => r.secret && r.type !== 'boss'); g.enterRoom(room, null); room.cleared = true; g.enemies = [];
  const d = Object.keys(room.secret)[0], [tx, ty] = DOORS[d];
  p.x = OX + tx * TILE + 8 + (d === 'w' ? 20 : d === 'e' ? -20 : 0); p.y = OY + ty * TILE + 8 + (d === 'n' ? 20 : d === 's' ? -20 : 0); p.bombs = 2; p.inv = 9;
  g.update(1 / 60, [{ bomb: true }]); step(g, 100);
  ok(room.doors[d] && room.tiles[ty][tx] === 'D', `bomb cracked the secret wall (${d}) and bombs left ${p.bombs}`);
  const sr = g.floor.rooms.find(r => r.type === 'secret');
  ok(sr && sr.active && sr.note, 'secret room holds an active item and a note');
}
// challenge waves and golden elites
{
  const g = new Game({ coop: false, metas: [{}] }); g.loadFloor(2);
  const ch = g.floor.rooms.find(r => r.challenge), el = g.floor.rooms.find(r => r.elite);
  g.enterRoom(ch, 'n'); let waves = 0;
  for (let i = 0; i < 4000 && !ch.cleared; i++) { g.players[0].inv = 9; for (const e of g.enemies) if (e.spawnT <= 0) g.damage(e, 1e5, g.players[0]); g.update(1 / 60, [{}]); waves += g.events.filter(e => e.k === 'toast' && /Wave/.test(e.text)).length; g.events = []; }
  ok(ch.cleared && waves === 2 && g.pickups.filter(k => k.kind === 'cache').length >= 2, `challenge room: 3 waves then 2 caches (${waves} wave toasts)`);
  g.enterRoom(el, 'n'); const e = g.enemies.find(e => e.elite);
  ok(e && e.max > 20, `golden ${e && e.type} with ${e && Math.round(e.max)} hp`);
}
// every climber starts with their quirk
for (const c of CHARS) { const g = new Game({ coop: false, metas: [{ char: c.id }] }), p = g.players[0]; step(g, 30); ok(p.char === c.id && p.hp === p.st.maxhp, `${c.name}: ${p.st.maxhp / 2} hearts, speed ${Math.round(p.st.speed)}, bombs ${p.bombs}, active ${p.active || '-'}`); }
// notes and the shopkeeper
{
  const g = new Game({ coop: false, metas: [{}] }), p = g.players[0];
  const nr = g.floor.rooms.find(r => r.note && r.type === 'fight'); g.enterRoom(nr, 'n'); nr.cleared = true; g.enemies = [];
  const note = g.pickups.find(k => k.kind === 'note'); p.x = note.x; p.y = note.y; g.update(1 / 60, [{}]);
  ok(g.events.some(e => e.k === 'note'), 'note picked up');
  g.enterRoom(g.floor.rooms.find(r => r.type === 'shop'), 'n');
  ok(g.npcSay && g.npcSay.text, `Mr. Tapewell: "${g.npcSay && g.npcSay.text}"`);
}
console.log('all systems ok');
