// Infinite-mode test: a buffed bot clears two fight rooms and the organ on every floor from I to XIV
// (all twelve body parts plus the start of the second loop), then every monster type is spawned and fought alone.
import { Game } from '../web/js/sim.js';
import { ENEMIES, FL } from '../web/js/data.js';
const bot = g => p => { const e = g.enemies.filter(e => !e.under && e.spawnT <= 0).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0]; if (!p.wp || Math.random() < 0.02) p.wp = e ? [e.x + (Math.random() - 0.5) * 90, e.y + (Math.random() - 0.5) * 90] : [160, 110]; return { mx: (p.wp[0] - p.x) / 40, my: (p.wp[1] - p.y) / 40, ax: e ? e.x - p.x : 0, ay: e ? e.y - p.y : 0 }; };
function run(g, sec) {
  for (let i = 0; i < sec * 60; i++) {
    for (const p of g.players) { p.inv = 5; p.st.dmg = 60; }
    g.update(1 / 60, g.players.map(bot(g))); g.events = [];
    for (const p of g.players) if (p.offer) g.choose(p.id, 0);
    if (i === 30 * 60) for (const e of g.enemies.slice()) if (!e.boss) g.damage(e, 1e6, g.players[0]);
    if (g.room.cleared && !g.enemies.length) return true;
  }
  return false;
}
const g = new Game({ coop: true, endless: true, metas: [{ weapon: 'lance' }, { weapon: 'lamprey' }] });
for (let fi = 0; fi < 14; fi++) {
  if (g.fi !== fi) throw new Error(`expected floor ${fi}, on ${g.fi}`);
  for (const r of g.floor.rooms.filter(r => r.type === 'fight').slice(0, 2)) { g.enterRoom(r, null); if (!run(g, 45)) throw new Error(`stuck in ${FL(fi).name} room ${r.key}: ${g.enemies.map(e => e.type + ':' + e.st)}`); }
  g.enterRoom(g.floor.rooms.find(r => r.type === 'boss'), null);
  const t0 = g.time, boss = g.enemies.find(e => e.boss).type;
  if (!run(g, 150)) throw new Error(`organ ${boss} not stopped on ${FL(fi).name}`);
  JSON.stringify(g.snap()); new Game({ coop: true, save: JSON.parse(JSON.stringify(g.toSave())) });
  console.log(`plate ${FL(fi).plate.padEnd(5)} ${FL(fi).name.padEnd(12)} tier ${FL(fi).tier}  ${boss.padEnd(9)} down in ${(g.time - t0).toFixed(1)}s`);
  if (g.fi === fi) { if (!g.valve) throw new Error('no way up after ' + boss); g.players[0].x = g.valve.x; g.players[0].y = g.valve.y; g.update(1 / 60, [{}, {}]); g.events = []; }
}
let ok = 0;
for (const type of Object.keys(ENEMIES)) {
  const t = new Game({ coop: false, metas: [{}] });
  t.loadFloor(6); t.enterRoom(t.floor.rooms.find(r => r.type === 'fight'), 'n'); t.enemies = [];
  for (let i = 0; i < 3; i++) t.addEnemy(type, 100 + i * 50, 80);
  let seenAttack = false;
  for (let i = 0; i < 60 * 15; i++) { t.players[0].inv = 5; t.update(1 / 60, [bot(t)(t.players[0])]); if (t.bullets.some(b => b.en) || t.hazards.length) seenAttack = true; t.events = []; if (!t.enemies.length) break; }
  ok++; if (process.env.V) console.log(type, 'left', t.enemies.length, 'attacked', seenAttack);
}
console.log(`endless ok to plate ${FL(g.fi).plate} | all ${ok} monster types ran without errors`);
