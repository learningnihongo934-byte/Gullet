// Item test: every item alone in a real fight (and in a boss fight), then every item at once, checking for crashes.
import { Game } from '../web/js/sim.js';
import { ITEMS, WEAPONS } from '../web/js/data.js';
const bot = g => p => { const e = g.enemies.find(e => !e.under && e.spawnT <= 0); if (!p.wp || Math.random() < 0.02) p.wp = [100 + Math.random() * 120, 60 + Math.random() * 100]; return { mx: (p.wp[0] - p.x) / 40, my: (p.wp[1] - p.y) / 40, ax: e ? e.x - p.x : 0, ay: e ? e.y - p.y : 0, dash: Math.random() < 0.03 }; };
let fails = 0;
for (const it of ITEMS) {
  try {
    for (const where of ['fight', 'boss']) {
      const g = new Game({ coop: true, metas: [{}, {}] });
      for (const p of g.players) { g.giveItem(p, it.id, true); g.giveItem(p, it.id, true); }
      if (where === 'boss') g.loadFloor(2);
      g.enterRoom(g.floor.rooms.find(r => r.type === where), 'n');
      for (let i = 0; i < 60 * 12; i++) { g.update(1 / 60, g.players.map(bot(g))); g.events = []; for (const p of g.players) if (p.offer) g.choose(p.id, 0); if (i % 200 === 0) { g.players[0].inv = 0; g.hurt(g.players[0], 1); } }
      JSON.stringify(g.snap()); new Game({ coop: true, save: JSON.parse(JSON.stringify(g.toSave())) });
    }
  } catch (err) { fails++; console.log('FAIL', it.id, err.stack.split('\n').slice(0, 3).join(' | ')); }
}
for (const w of WEAPONS) {
  for (const fi of [0, 4]) {
    const g = new Game({ coop: true, metas: [{ weapon: w.id }, { weapon: w.id }] });
    if (fi) g.loadFloor(fi);
    g.enterRoom(g.floor.rooms.find(r => r.type === (fi ? 'boss' : 'fight')), 'n');
    const hp0 = g.enemies.reduce((a, e) => a + e.hp, 0);
    for (let i = 0; i < 60 * 10; i++) { g.update(1 / 60, g.players.map(bot(g))); g.events = []; for (const p of g.players) p.inv = 5; }
    const hp1 = g.enemies.reduce((a, e) => a + e.hp, 0);
    console.log(`weapon ${w.id.padEnd(10)} ${fi ? 'vs boss' : 'fight  '} damage dealt in 10s: ${Math.round(hp0 - hp1)}`);
  }
}
const g = new Game({ coop: true, metas: [{}, {}] });
for (const p of g.players) for (const it of ITEMS) g.giveItem(p, it.id, true);
g.loadFloor(5); g.enterRoom(g.floor.rooms.find(r => r.type === 'boss'), 'n');
let maxB = 0;
for (let i = 0; i < 60 * 20 && g.state === 'play'; i++) { g.update(1 / 60, g.players.map(bot(g))); g.events = []; maxB = Math.max(maxB, g.bullets.length); }
console.log(`items: ${ITEMS.length}, failures: ${fails}, everything-at-once vs The Heart: state ${g.state}, boss left ${g.enemies.filter(e => e.boss).length}, peak bullets ${maxB}`);
if (fails) process.exit(1);
