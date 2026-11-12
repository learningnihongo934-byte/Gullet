// Lets the Auto climb AI play real runs (no cheats) and reports how far it gets.
import { Game } from '../web/js/sim.js';
import { botInput } from '../web/js/bot.js';
import { FL } from '../web/js/data.js';
const runs = +(process.argv[2] || 3), mins = +(process.argv[3] || 12);
for (let r = 0; r < runs; r++) {
  const g = new Game({ coop: false, endless: true, metas: [{ weapon: ['salt', 'pepper', 'sling', 'matches'][r % 4] }] });
  let frames = 0, rooms = new Set(), stuckRoom = 0, lastKey = '';
  while (g.state === 'play' && frames < mins * 3600) {
    g.update(1 / 60, [botInput(g, g.players[0])]); g.events = []; frames++;
    rooms.add(g.fi + ':' + g.room.key);
    if (g.room.key + g.fi !== lastKey) { lastKey = g.room.key + g.fi; stuckRoom = 0; } else stuckRoom++;
    if (stuckRoom > 60 * 90) { console.log(`  run ${r + 1}: stuck 90s in ${FL(g.fi).name} room ${g.room.key} (${g.room.type}, cleared ${g.room.cleared}, enemies ${g.enemies.map(e => e.type)}) at ${Math.round(g.players[0].x)},${Math.round(g.players[0].y)}`); break; }
  }
  const p = g.players[0];
  console.log(`run ${r + 1} (${p.weapon}): ${g.state} on plate ${FL(g.fi).plate} ${FL(g.fi).name} after ${(frames / 3600).toFixed(1)} min, level ${g.level}, ${p.items.length} items, ${g.kills} kills, ${g.bosses} organs, ${rooms.size} rooms seen`);
}
