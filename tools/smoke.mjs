// Headless smoke test: a buffed bot clears every room and boss on all six floors, checking for crashes,
// stuck rooms, save/load round trips and snapshot size.
import { Game } from '../web/js/sim.js';
import { CX, CY } from '../web/js/data.js';
const g = new Game({ coop: true, metas: [{}, {}] });
const STEP = 1 / 60;
let frames = 0, maxSnap = 0, assisted = 0;
function bot(p) {
  const e = g.enemies.filter(e => !e.under && e.spawnT <= 0).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
  if (!e) return { mx: (CX - p.x) / 50, my: (CY - p.y) / 50 };
  if (!p.wp || frames % 90 === 0) p.wp = [e.x + (Math.random() - 0.5) * 90, e.y + (Math.random() - 0.5) * 90];
  return { mx: (p.wp[0] - p.x) / 40, my: (p.wp[1] - p.y) / 40, ax: e.x - p.x, ay: e.y - p.y };
}
function run(sec) {
  for (let i = 0; i < sec * 60; i++) {
    for (const p of g.players) { p.inv = 5; p.st.dmg = 40; }
    g.update(STEP, g.players.map(bot)); g.events = []; frames++;
    for (const p of g.players) if (p.offer) g.choose(p.id, Math.floor(Math.random() * 3));
    if (frames % 120 === 0) maxSnap = Math.max(maxSnap, JSON.stringify(g.snap()).length);
    if (g.room.cleared && !g.enemies.length) return true;
    if (i >= 20 * 60 && i % 600 === 0 && g.enemies.length) { assisted++; for (const e of g.enemies.slice()) if (!e.boss) g.damage(e, 9999, g.players[0]); }
    if (process.env.DBG && i === sec * 60 - 1) console.log(g.room.tiles.join('\n'), g.enemies.map(e => [e.type, e.x | 0, e.y | 0, g.tileAtPx(e.x, e.y), e.hp | 0]), g.players.map(p => [p.x | 0, p.y | 0]));
  }
  return false;
}
for (let fi = 0; fi < 6; fi++) {
  if (g.fi !== fi) throw new Error('floor mismatch ' + g.fi + ' vs ' + fi);
  const rooms = g.floor.rooms;
  for (const r of rooms) { if (r.type === 'boss') continue; g.enterRoom(r, null); if (!run(60)) throw new Error(`room stuck f${fi} ${r.key} ${r.type} enemies=${g.enemies.map(e => e.type + ':' + e.st)}`); }
  const boss = rooms.find(r => r.type === 'boss');
  g.enterRoom(boss, null);
  const t0 = g.time;
  if (!run(120)) throw new Error('boss stuck on floor ' + fi + ' ' + g.enemies.map(e => e.type + ':' + Math.round(e.hp)));
  console.log(`floor ${fi + 1}: ${rooms.length} rooms ok, boss down in ${(g.time - t0).toFixed(1)}s`);
  const s = JSON.stringify(g.toSave());
  const g2 = new Game({ coop: true, save: JSON.parse(s) });
  if (g2.fi !== g.fi || g2.room.key !== g.room.key) throw new Error('save round trip failed');
  if (fi < 5 && g.fi === fi) { if (!g.valve) throw new Error('no valve after boss on floor ' + fi + ' state ' + g.state + ' enemies ' + g.enemies.length); g.players[0].x = g.valve.x; g.players[0].y = g.valve.y; run(0.2); }
}
for (let i = 0; i < 300 && g.state === 'play'; i++) g.update(STEP, [{}, {}]);
console.log('final state:', g.state, '| level', g.level, '| items', g.players.map(p => p.items.length), '| kills', g.kills, '| bosses', g.bosses, '| biggest snapshot', maxSnap, 'bytes', '| bot-assisted rooms', assisted, '| save', JSON.stringify(g.toSave()).length, 'bytes');
if (g.state !== 'won') throw new Error('did not win');
