// Co-op networking. A tiny Durable Object relays messages between the host and the guest.
// The host runs the game; the guest sends inputs and draws a Mirror built from the host's snapshots.
export class Net {
  constructor(onMsg, onStatus) { this.onMsg = onMsg; this.onStatus = onStatus; this.ws = null; this.code = null; this.role = null; this.closed = false; }
  async host() {
    const r = await fetch('/api/room', { method: 'POST' });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Could not open a room');
    this.connect(j.code, 'host');
    return j.code;
  }
  join(code) { this.connect(code.toUpperCase().replace(/[^A-Z]/g, ''), 'guest'); }
  connect(code, role) {
    this.code = code; this.role = role; this.closed = false;
    const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/room/${code}/ws?role=${role}`);
    this.ws = ws;
    ws.onopen = () => this.onStatus('open');
    ws.onmessage = e => { try { this.onMsg(JSON.parse(e.data)); } catch {} };
    ws.onclose = ev => { if (this.ws === ws) { this.ws = null; if (!this.closed) this.onStatus('closed', ev.reason); } };
    ws.onerror = () => {};
  }
  send(o) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(o)); }
  close() { this.closed = true; if (this.ws) this.ws.close(); this.ws = null; }
}

const lerp = (a, b, k) => a + (b - a) * k;

/** The guest's copy of the game, shaped like Game so the renderer can draw either one. */
export class Mirror {
  constructor() {
    this.fi = 0; this.room = null; this.map = []; this.players = []; this.enemies = []; this.bullets = []; this.pickups = []; this.hazards = [];
    this.valve = null; this.teeth = 0; this.marrow = 0; this.time = 0; this.roomT = 1; this.shake = 0; this.coop = true; this.me = 1; this.state = 'play';
    this.target = new Map(); this.ptarget = [];
  }
  applyRoom(m) {
    const changed = !this.room || this.room.key !== m.room.key || this.fi !== m.fi;
    this.fi = m.fi; this.room = m.room; this.map = m.map;
    if (changed) { this.roomT = 0; this.enemies = []; this.target.clear(); this.bullets = []; }
  }
  applySnap(s) {
    this.time = s.tm; this.teeth = s.te; this.xp = s.xp; this.nd = s.nd; this.level = s.lv; this.enemyCount = s.en; this.marrow = s.ma; this.shake = s.sh; this.state = s.st;
    if (this.room) this.room.cleared = !!s.cl;
    if (s.rt < this.roomT) this.roomT = s.rt;
    s.P.forEach((q, i) => {
      let p = this.players[i];
      const fresh = !p;
      if (!p) p = this.players[i] = { id: i, st: {} };
      Object.assign(p, { hp: q.hp, inv: q.inv, down: !!q.dn, face: q.f, moving: !!q.mv, anim: q.an, dashT: q.da ? 0.1 : 0, present: !!q.pr, shieldUp: !!q.sh, orbA: q.oa, items: q.it, pend: q.pd, offer: q.of });
      p.st.maxhp = q.mh; p.st.orbit = q.ob;
      this.ptarget[i] = [q.x, q.y];
      if (fresh || Math.hypot(p.x - q.x, p.y - q.y) > 40) { p.x = q.x; p.y = q.y; }
    });
    const seen = new Set();
    const prev = new Map(this.enemies.map(e => [e.id, e]));
    this.enemies = s.E.map(q => {
      seen.add(q.id);
      const e = prev.get(q.id) || { id: q.id, x: q.x, y: q.y };
      Object.assign(e, { type: q.ty, r: q.r, flash: q.fl ? 0.05 : 0, hp: q.hp, max: q.mx, st: q.s, boss: !!q.b, spawnT: q.sp, z: q.z, segs: q.sg, pulse: q.pu, br: q.br, a: q.a, age: q.ag, small: !!q.sm, under: !!q.u, t: q.t, burn: q.bu, poison: q.po });
      this.target.set(q.id, [q.x, q.y]);
      if (Math.hypot(e.x - q.x, e.y - q.y) > 40) { e.x = q.x; e.y = q.y; }
      return e;
    });
    for (const id of this.target.keys()) if (!seen.has(id)) this.target.delete(id);
    const B = [];
    for (let i = 0; i < s.B.length; i += 6) B.push({ x: s.B[i], y: s.B[i + 1], vx: s.B[i + 2], vy: s.B[i + 3], r: s.B[i + 4], k: s.B[i + 5], en: s.B[i + 5] !== 's' && s.B[i + 5] !== 'S' });
    this.bullets = B;
    this.pickups = s.K; this.hazards = s.H; this.valve = s.V;
  }
  /** Smooth movement between 20Hz snapshots. */
  tick(dt) {
    this.roomT += dt;
    const k = Math.min(1, dt * 18);
    this.players.forEach((p, i) => { const t = this.ptarget[i]; if (t) { p.x = lerp(p.x, t[0], k); p.y = lerp(p.y, t[1], k); } });
    for (const e of this.enemies) { const t = this.target.get(e.id); if (t) { e.x = lerp(e.x, t[0], k); e.y = lerp(e.y, t[1], k); } }
    for (const b of this.bullets) { b.x += b.vx * dt; b.y += b.vy * dt; }
    for (const h of this.hazards) h.t += dt;
  }
}
