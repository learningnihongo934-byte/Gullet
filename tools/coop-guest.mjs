// Co-op check: joins a room as the guest from Node and reports what the host sends.
// Usage: node tools/coop-guest.mjs CODE [https://gullet.rennko.tech]
const [code, base = 'https://gullet.skelr.workers.dev'] = process.argv.slice(2);
const ws = new WebSocket(base.replace('http', 'ws') + `/api/room/${code}/ws?role=guest`);
const seen = { start: null, rooms: new Set(), snaps: 0, maxFi: -1 };
ws.onopen = () => { ws.send(JSON.stringify({ t: 'hello', meta: { up: {}, weapon: 'matches' } })); console.log('joined', code); };
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.t === 'start') { seen.start = m; console.log('start', JSON.stringify(m)); }
  if (m.t === 'room') { seen.rooms.add(m.fi + ':' + m.room.key); seen.maxFi = Math.max(seen.maxFi, m.fi); }
  if (m.t === 's') seen.snaps++;
};
let ds = 0;
const iv = setInterval(() => { if (ws.readyState === 1) ws.send(JSON.stringify({ t: 'in', i: { mx: Math.sin(Date.now() / 500), my: 0, ax: 1, ay: 0, ds: ds++ % 40 === 0 ? ds : ds - 1 } })); }, 33);
setTimeout(() => { clearInterval(iv); console.log('result', JSON.stringify({ endless: seen.start && seen.start.endless, snaps: seen.snaps, rooms: [...seen.rooms], maxFloor: seen.maxFi })); ws.close(); process.exit(0); }, +(process.env.SECS || 25) * 1000);
