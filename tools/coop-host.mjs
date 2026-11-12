// Co-op check: this script hosts a room and runs the game in Node, so a browser can join as the guest.
// Usage: node tools/coop-host.mjs [https://gullet.rennko.tech]   (prints the room code; runs ~3 minutes)
import { Game } from '../web/js/sim.js';
const base = process.argv[2] || 'https://gullet.skelr.workers.dev';
const { code } = await (await fetch(base + '/api/room', { method: 'POST' })).json();
console.log('ROOM', code);
const ws = new WebSocket(base.replace('http', 'ws') + `/api/room/${code}/ws?role=host`);
let game = null, guest = {}, lastDs = 0, got = { hello: 0, in: 0 };
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.t === 'hello') {
    got.hello++;
    game = new Game({ coop: true, metas: [{}, m.meta] });
    game.players[0].inv = 1e9; game.levelUp();
    ws.send(JSON.stringify({ t: 'start' })); ws.send(JSON.stringify(game.roomMsg()));
    console.log('guest said hello, started');
  }
  if (m.t === 'pick') { game.choose(1, m.i); console.log('guest picked', game.players[1].items); }
  if (m.t === 'in') { got.in++; guest = m.i; if (guest.ds !== lastDs) { lastDs = guest.ds; guest.dash = true; } }
};
const t0 = Date.now();
let ev = [];
const iv = setInterval(() => {
  if (!game) return;
  for (let i = 0; i < 3; i++) { game.update(1 / 60, [{ ax: 1 }, { ...guest }]); guest.dash = false; ev.push(...game.events); game.events = []; }
  if (game.roomChanged) { game.roomChanged = false; ws.send(JSON.stringify(game.roomMsg())); }
  const s = game.snap(); s.ev = ev.splice(0, 80); ws.send(JSON.stringify(s));
  if (Date.now() - t0 > 180000) { clearInterval(iv); ws.close(); console.log('done', got, 'p2 at', Math.round(game.players[1].x), Math.round(game.players[1].y)); process.exit(0); }
}, 50);
setInterval(() => game && console.log('inputs from guest:', got.in, 'p2', Math.round(game.players[1].x), Math.round(game.players[1].y), 'room', game.room.key, 'p2 items', game.players[1].items), 10000);
