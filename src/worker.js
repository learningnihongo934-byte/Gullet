// Gullet server: serves the static game and relays co-op messages. One Durable Object per 4-letter
// room code holds the host's and the guest's WebSockets and forwards everything between them.
const CODE = 'ABCDEFGHJKMNPQRSTUVWXYZ';
// CORS is open on the API so the desktop app (app://gullet) can open rooms here.
const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'access-control-allow-origin': '*' } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/room' && req.method === 'OPTIONS') return new Response(null, { headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST', 'access-control-max-age': '86400' } });
    if (url.pathname === '/api/room' && req.method === 'POST') {
      for (let i = 0; i < 12; i++) {
        let code = '';
        for (let k = 0; k < 4; k++) code += CODE[Math.floor(Math.random() * CODE.length)];
        const r = await env.ROOMS.get(env.ROOMS.idFromName(code)).fetch('https://room/create', { method: 'POST' });
        if (r.ok) return json({ code });
      }
      return json({ error: 'No free rooms right now. Try again.' }, 503);
    }
    const m = url.pathname.match(/^\/api\/room\/([A-Z]{4})\/ws$/);
    if (m) {
      if (req.headers.get('Upgrade') !== 'websocket') return json({ error: 'expected websocket' }, 426);
      return env.ROOMS.get(env.ROOMS.idFromName(m[1])).fetch(req);
    }
    if (url.pathname.startsWith('/api/')) return json({ error: 'not found' }, 404);
    return env.ASSETS.fetch(req);
  },
};

const ROOM_TTL = 12 * 3600e3;

export class Room {
  constructor(state) { this.state = state; this.socks = { host: null, guest: null }; }
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/create') {
      const created = await this.state.storage.get('created');
      if (created && Date.now() - created < ROOM_TTL) return new Response('taken', { status: 409 });
      await this.state.storage.put('created', Date.now());
      return new Response('ok');
    }
    const role = url.searchParams.get('role') === 'host' ? 'host' : 'guest';
    const created = await this.state.storage.get('created');
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    if (!created || Date.now() - created > ROOM_TTL) { server.close(4004, 'No room with that code.'); return new Response(null, { status: 101, webSocket: client }); }
    const old = this.socks[role];
    if (old && role === 'guest') { server.close(4009, 'That room already has two climbers.'); return new Response(null, { status: 101, webSocket: client }); }
    if (old) { try { old.close(4000, 'replaced'); } catch {} }
    this.socks[role] = server;
    const other = role === 'host' ? 'guest' : 'host';
    const send = (ws, o) => { try { ws && ws.send(JSON.stringify(o)); } catch {} };
    server.addEventListener('message', ev => { const o = this.socks[other]; if (o) { try { o.send(ev.data); } catch {} } });
    const gone = () => { if (this.socks[role] === server) { this.socks[role] = null; send(this.socks[other], { t: 'peer', on: false }); } };
    server.addEventListener('close', gone);
    server.addEventListener('error', gone);
    if (this.socks[other]) { send(this.socks[other], { t: 'peer', on: true }); send(server, { t: 'peer', on: true }); }
    return new Response(null, { status: 101, webSocket: client });
  }
}
