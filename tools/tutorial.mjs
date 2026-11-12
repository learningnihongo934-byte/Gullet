// Plays the tutorial headlessly, lesson by lesson, and checks it ends on the rope.
import { Game } from '../web/js/sim.js';
import { OX, OY, TILE, RW, CX, CY } from '../web/js/data.js';
const g = new Game({ coop: false, metas: [{}], tutorial: true }), p = g.players[0];
const steps = [];
const tick = (n, inp = {}) => { for (let i = 0; i < n && g.state === 'play'; i++) { g.update(1 / 60, [typeof inp === 'function' ? inp(i) : inp]); for (const e of g.events) if (e.k === 'tut') steps.push(e.step + ':' + e.title); g.events = []; } };
tick(70, { mx: 1 });                                                     // 1 move
tick(60); for (let i = 0; i < 600 && g.enemies.length; i++) { const e = g.enemies[0]; tick(1, { ax: e.x - p.x, ay: e.y - p.y, mx: (e.x - p.x) / 80, my: (e.y + 40 - p.y) / 80 }); }   // 2 salt
tick(90, i => ({ mx: i < 45 ? 1 : -1, dash: i === 5 || i === 60 }));  // 3 dash
tick(30); if (p.offer) g.choose(0, 0); tick(30);                       // 4 level up
const bomb = g.pickups.find(k => k.kind === 'bomb'); p.x = bomb.x; p.y = bomb.y; tick(5);          // 5 bomb
p.x = OX + (RW - 2) * TILE + 2; p.y = OY + 5 * TILE + 8; tick(2, { bomb: true }); p.x -= 40; tick(120);
p.x = OX + RW * TILE - 6; tick(5, { mx: 1 });                           // through the hidden door
const act = g.pickups.find(k => k.kind === 'active'); p.x = act.x; p.y = act.y; tick(30);  // 6 active
tick(40, { use: true }); for (let i = 0; i < 900 && g.enemies.length; i++) { const e = g.enemies[0]; tick(1, { ax: e.x - p.x, ay: e.y - p.y, mx: (e.x - p.x) / 80, my: (e.y + 40 - p.y) / 80 }); }
tick(30); p.x = g.valve.x; p.y = g.valve.y; tick(5);                    // 8 rope
console.log(steps.join(' | '));
console.log('room', g.room.type, 'active', p.active, 'items', p.items.length, 'state', g.state);
if (g.state !== 'tutdone' || steps.length !== 8) throw new Error('tutorial did not finish cleanly');
console.log('tutorial ok');
