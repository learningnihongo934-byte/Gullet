// Gullet simulation. One Game runs on the solo player's or the co-op host's machine; the guest only
// sends inputs and draws snapshots. Everything here is plain data so a run can be saved mid-climb.
import { TILE, RW, RH, OX, OY, CX, CY, DOORS, DIRS, OPP, FLOORS, ENEMIES, BOSSES, ITEMS, ITEM, statsFor, baseStats, FL, WEAPON, ACTIVES, ACTIVE, CHAR, SHOP_LINES, NOTES } from './data.js';
import { genFloor } from './gen.js';

const rnd = Math.random, rr = (a, b) => a + rnd() * (b - a), pick = a => a[Math.floor(rnd() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const TAU = Math.PI * 2;
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
const L = OX + TILE, T = OY + TILE, Rx = OX + (RW - 1) * TILE, By = OY + (RH - 1) * TILE; // interior bounds
let NID = 1;

export class Game {
  constructor(o) {
    this.coop = !!o.coop; this.endless = !!o.endless;
    this.events = []; this.enemies = []; this.bullets = []; this.pickups = []; this.hazards = [];
    this.state = 'play'; this.shake = 0; this.roomT = 0; this.wantSave = false; this.roomChanged = true;
    this.valve = null; this.biteT = 4; this.winT = 0;
    if (o.save) this.load(o.save); else this.fresh(o.metas || [{}]);
    if (o.tutorial) this.setupTutorial();
    this.enterRoom(this.room, null);
  }

  // ---------- setup / saving
  fresh(metas) {
    this.seed = (Math.random() * 1e9) | 0; this.time = 0; this.kills = 0; this.bosses = 0; this.marrow = 0; this.teeth = 0; this.xp = 0; this.level = 1;
    this.pool = ITEMS.map(i => i.id);
    this.players = [];
    const n = this.coop ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const meta = metas[i] || {}, up = meta.up || {};
      const p = this.makePlayer(i, statsFor(meta)); p.weapon = meta.weapon || 'salt';
      this.players.push(p);
      this.teeth += 8 * (up.teeth || 0);
      if (up.lunch) p.pend = 1;
      p.char = CHAR[meta.char] ? meta.char : 'wren'; CHAR[p.char].apply(p.st, p, this); p.hp = p.st.maxhp;
      p.look = { ...(meta.look || {}) };
    }
    this.loadFloor(0);
  }
  makePlayer(i, st) {
    return { id: i, x: CX + (i ? 12 : -12), y: CY + 10, vx: 0, vy: 0, px: 0, py: 0, r: 5, hp: st.maxhp, st, items: [], face: 'd', moving: false,
      fireT: 0, dashT: 0, dashCd: 0, dx: 0, dy: 0, inv: 0, down: false, present: true, shieldUp: false, orbA: 0, shots: 0, trailT: 0, anim: 0, pend: 0, offer: null, shields: 0, revives: st.revive || 0, weapon: 'salt', streak: 0, roomHit: false, budT: 0, char: 'wren', bombs: 1, active: null, charge: 0, frenzy: 0 };
  }
  load(s) {
    this.endless = !!s.endless;
    Object.assign(this, { seed: s.seed, fi: s.fi, time: s.time, kills: s.kills, bosses: s.bosses, marrow: s.marrow, teeth: s.teeth, pool: s.pool, floor: s.floor, xp: s.xp || 0, level: s.level || 1 });
    this.players = s.players.map((q, i) => { const p = this.makePlayer(i, Object.assign(baseStats(), q.st)); p.items = q.items; p.hp = q.hp; p.present = i === 0; p.pend = q.pend || 0; p.offer = q.offer || null; p.revives = q.revives ?? p.st.revive; p.weapon = q.weapon || 'salt'; p.streak = q.streak || 0; p.char = q.char || 'wren'; p.look = q.look || {}; p.bombs = q.bombs ?? 1; p.active = q.active || null; p.charge = q.charge || 0; if (p.char === 'pip') p.r = 4; return p; });
    if (this.coop && this.players.length < 2) this.players.push(Object.assign(this.makePlayer(1, statsFor({})), { present: false }));
    this.room = this.floor.rooms.find(r => r.key === s.cur) || this.floor.rooms.find(r => r.type === 'start');
  }
  toSave() {
    const room = this.room;
    const drops = this.pickups.filter(k => !k.ped).map(k => ({ kind: k.kind, id: k.id, v: k.v, x: k.x, y: k.y }));
    const floor = JSON.parse(JSON.stringify(this.floor));
    const fr = floor.rooms.find(r => r.key === room.key);
    fr.drops = drops;
    return { v: 1, coop: this.coop, endless: this.endless, seed: this.seed, fi: this.fi, time: this.time, kills: this.kills, bosses: this.bosses, marrow: this.marrow,
      teeth: this.teeth, pool: this.pool, floor, cur: room.key, xp: this.xp, level: this.level, players: this.players.map(p => ({ st: p.st, items: p.items, hp: Math.max(1, p.hp), pend: p.pend, offer: p.offer, revives: p.revives, weapon: p.weapon, streak: p.streak, char: p.char, look: p.look, bombs: p.bombs, active: p.active, charge: p.charge })) };
  }
  drawItem() {
    if (!this.pool.length) this.pool = ITEMS.map(i => i.id);
    return this.pool.splice(Math.floor(rnd() * this.pool.length), 1)[0];
  }
  giveItem(p, id, silent) {
    const it = ITEM[id]; if (!it) return;
    it.apply(p.st, p, this);
    p.items.push(id);
    p.hp = Math.min(p.hp, p.st.maxhp);
    if (it.id === 'shell' || it.id === 'halo') { p.shields = p.st.shield; p.shieldUp = true; }
    if (!silent) { this.ev({ k: 'item', id, p: p.id }); this.roomChanged = true; }
  }
  loadFloor(fi) {
    this.fi = fi;
    this.floor = genFloor(fi, this.seed);
    for (const r of this.floor.rooms) {
      if (r.type === 'treasure' || r.type === 'feed') r.item = 'cache';
      if (r.type === 'shop') r.shop = [{ kind: 'cache', price: 14 }, { kind: 'heart', price: 4 }, { kind: 'bomb', v: 2, price: 5 }, rnd() < 0.5 ? { kind: 'active', id: pick(ACTIVES).id, price: 24 } : { kind: 'cache', price: 20 }];
      if (r.type === 'treasure' && rnd() < 0.7) r.active = pick(ACTIVES).id;
      if (r.type === 'secret') { r.active = pick(ACTIVES).id; r.note = 1; r.drops = [{ kind: 'teeth', v: 3, x: CX - 30, y: CY + 20 }, { kind: 'bomb', v: 1, x: CX + 30, y: CY + 20 }]; }
    }
    this.room = this.floor.rooms.find(r => r.type === 'start');
  }
  ev(e) { this.events.push(e); }
  tier() { return Math.floor(this.fi / 12); }
  hasNext() { return this.endless || this.fi < 5; }
  get map() { return this.mapData(); }

  // ---------- levels: kills feed XP; every level, each climber picks 1 of 3 swallowed things once the room is safe
  xpNeed() { return 8 + this.level * 5; }
  gainXp(n) {
    this.xp += n * Math.max(1, Math.max(0, ...this.players.filter(q => q.present).map(q => q.st.xpMul)));
    while (this.xp >= this.xpNeed()) { this.xp -= this.xpNeed(); this.levelUp(); }
  }
  levelUp() {
    this.level++;
    for (const p of this.players) if (p.present) { p.pend++; if (p.st.lvlHeal && !p.down) p.hp = Math.min(p.st.maxhp, p.hp + p.st.lvlHeal); }
    this.ev({ k: 'levelup', lv: this.level });
  }
  rollOffer(p) {
    const UNIQUE = ['map', 'mirror', 'yoyo', 'feather', 'lemon', 'paperheart', 'scratcher', 'balloon', 'cherries', 'penny', 'alarm', 'rainboots', 'ghostcandle', 'firstaid'];
    const cands = ITEMS.map(i => i.id).filter(id => !(UNIQUE.includes(id) && p.items.includes(id)));
    const out = [];
    while (out.length < 3 + (p.st.choices || 0) && cands.length) out.push(cands.splice(Math.floor(rnd() * cands.length), 1)[0]);
    return out;
  }
  updateOffers() {
    const safe = !this.enemies.length;
    for (const p of this.players) if (p.present && safe && p.pend > 0 && !p.offer) p.offer = this.rollOffer(p);
  }
  choose(pid, i) {
    const p = this.players[pid];
    if (!p || !p.offer || this.enemies.length || !p.offer[i]) return;
    const id = p.offer[i];
    p.offer = null; p.pend = Math.max(0, p.pend - 1);
    this.giveItem(p, id);
    this.wantSave = true;
  }
  alive() { return this.players.filter(p => p.present && !p.down); }
  twoPlayers() { return this.coop && this.players[1] && this.players[1].present; }
  luck() { return Math.max(...this.players.map(p => p.st.luck)); }
  discount() { return Math.max(...this.players.map(p => p.st.discount)); }

  // ---------- rooms
  enterRoom(room, dir) {
    if (this.room && this.room !== room) this.room.drops = this.pickups.filter(k => !k.ped).map(k => ({ kind: k.kind, id: k.id, v: k.v, x: k.x, y: k.y }));
    this.room = room; room.visited = true;
    this.enemies = []; this.bullets = []; this.hazards = []; this.pickups = (room.drops || []).slice(); room.drops = [];
    // place players at the door they came through
    let bx = CX, by = CY + 10, ix = 0, iy = 0;
    if (dir) {
      const [tx, ty] = DOORS[OPP[dir]];
      [ix, iy] = DIRS[dir];
      bx = OX + tx * TILE + 8 + ix * 20; by = OY + ty * TILE + 8 + iy * 20;
    }
    this.players.forEach((p, i) => {
      const off = this.players.length > 1 ? (i ? 8 : -8) : 0;
      p.x = bx + (iy ? off : 0); p.y = by + (ix ? off : 0); p.vx = p.vy = p.px = p.py = 0; p.dashT = 0;
      p.shields = p.st.shield; p.shieldUp = p.shields > 0; p.roomHit = false;
    });
    if ((room.type === 'treasure' || room.type === 'feed') && room.item) this.pickups.push({ kind: 'cache', x: room.active ? CX - 28 : CX, y: CY, ped: true, price: room.type === 'feed' ? 'heart' : 0 });
    if ((room.type === 'treasure' || room.type === 'secret') && room.active) this.pickups.push({ kind: 'active', id: room.active, x: room.type === 'treasure' ? CX + 28 : CX, y: CY, ped: true, apd: 1 });
    if (room.note) this.pickups.push({ kind: 'note', x: room.type === 'secret' ? CX : CX + 40, y: room.type === 'secret' ? CY - 30 : CY + 30, ped: true, nd: 1 });
    this.decoy = null;
    if (room.type === 'shop') this.say(pick(SHOP_LINES.greet));
    if (room.type === 'shop') this.stockShop();
    this.valve = room.type === 'boss' && room.cleared && this.hasNext() ? { x: CX, y: CY - 14 } : null;
    if (!room.cleared) { if (room.type === 'boss') this.spawnBoss(); else this.spawnEnemies(); if (room.challenge) this.ev({ k: 'toast', text: `Challenge room: survive ${room.waves} waves` }); }
    this.blastPending = !room.cleared && this.players.some(p => p.present && p.st.entryBlast);
    this.roomT = 0; this.roomChanged = true; this.wantSave = true; this.biteT = rr(3, 5);
    this.ev({ k: 'room', type: room.type, cleared: room.cleared });
  }
  stockShop() {
    this.pickups = this.pickups.filter(k => k.shop === undefined);
    const d = this.discount();
    const n = this.room.shop.length;
    this.room.shop.forEach((s, i) => { if (s) this.pickups.push({ kind: s.kind, id: s.id, v: s.v || 2, x: CX - (n - 1) * 20 + i * 40, y: CY, ped: true, shop: i, price: Math.max(1, Math.ceil(s.price * (1 - d))) }); });
  }
  roomAt(gx, gy) { return this.floor.rooms.find(r => r.gx === gx && r.gy === gy); }
  mapData() {
    const reveal = this.players.some(p => p.st.map);
    const vis = new Set(this.floor.rooms.filter(r => r.visited).map(r => r.key));
    return this.floor.rooms.map(r => {
      const near = [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dy]) => vis.has((r.gx + dx) + ',' + (r.gy + dy)));
      if (r.type === 'secret' && !r.visited) return null;
      return { gx: r.gx, gy: r.gy, el: r.elite && !r.cleared ? 1 : 0, ch: r.challenge ? 1 : 0, t: r.type, v: r.visited ? 1 : 0, k: (r.visited || near || reveal) ? 1 : 0, ic: (r.visited || reveal) ? 1 : 0 };
    }).filter(r => r && r.k);
  }

  // ---------- tiles and movement
  tile(tx, ty) { return tx < 0 || ty < 0 || tx >= RW || ty >= RH ? '#' : this.room.tiles[ty][tx]; }
  tileAtPx(x, y) { return this.tile(Math.floor((x - OX) / TILE), Math.floor((y - OY) / TILE)); }
  solid(tx, ty, mode) {
    const c = this.tile(tx, ty);
    if (c === '#') return true;
    if (c === 'D') return mode !== 'p' || !this.room.cleared;
    if (c === 'o' || c === 't') return mode !== 'f';
    return false;
  }
  move(o, dx, dy, mode) {
    o.hitWall = false;
    const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 4) || 1;
    for (let i = 0; i < steps; i++) { o.x += dx / steps; this.resolve(o, mode); o.y += dy / steps; this.resolve(o, mode); }
  }
  resolve(o, mode) {
    const r = o.r;
    const x0 = Math.floor((o.x - r - OX) / TILE), x1 = Math.floor((o.x + r - OX) / TILE);
    const y0 = Math.floor((o.y - r - OY) / TILE), y1 = Math.floor((o.y + r - OY) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (!this.solid(tx, ty, mode)) continue;
      const l = OX + tx * TILE, t = OY + ty * TILE;
      const cx = clamp(o.x, l, l + TILE), cy = clamp(o.y, t, t + TILE);
      const dx = o.x - cx, dy = o.y - cy, d = Math.hypot(dx, dy);
      if (d >= r) continue;
      o.hitWall = true;
      if (d > 0.001) { o.x += dx / d * (r - d); o.y += dy / d * (r - d); }
      else {
        const pl = o.x - l, pr = l + TILE - o.x, pt = o.y - t, pb = t + TILE - o.y, m = Math.min(pl, pr, pt, pb);
        if (m === pl) o.x = l - r; else if (m === pr) o.x = l + TILE + r; else if (m === pt) o.y = t - r; else o.y = t + TILE + r;
      }
    }
  }

  // ---------- main tick
  update(dt, inputs) {
    if (this.state !== 'play') return;
    this.time += dt; this.roomT += dt; this.slowAll = Math.max(0, ...this.players.filter(q => q.present).map(q => q.st.slowAll)); this.shake = Math.max(0, this.shake - dt * 30);
    for (const p of this.players) if (p.present) this.updatePlayer(p, inputs[p.id] || {}, dt);
    this.updateEnemies(dt);
    this.updateBullets(dt);
    this.updateHazards(dt);
    this.updatePickups(dt);
    this.updateOrbs(dt);
    this.wallBites(dt);
    if (this.decoy) { this.decoy.t -= dt; if (this.decoy.t <= 0) this.decoy = null; }
    if (this.blastPending && this.roomT > 0.75) {
      this.blastPending = false;
      const p = this.players.find(q => q.present && q.st.entryBlast);
      if (p) { this.ev({ k: 'popper' }); for (const e of this.enemies.slice()) if (!e.dead && !e.under) { this.ev({ k: 'boom', x: e.x, y: e.y, r: 14 }); this.damage(e, (e.boss ? 15 : 12) * p.st.entryBlast, p); } }
    }
    this.checkClear();
    this.updateOffers();
    if (this.tut) this.tutorialTick(dt);
    if (this.winT > 0) { this.winT -= dt; if (this.winT <= 0) { this.state = 'won'; this.ev({ k: 'won' }); } }
    if (this.state === 'play') { this.checkExit(); this.checkValve(); }
    if (!this.alive().length && this.state === 'play') { this.state = 'dead'; this.ev({ k: 'dead' }); }
  }

  updatePlayer(p, inp, dt) {
    const st = p.st;
    p.inv = Math.max(0, p.inv - dt); p.dashCd -= dt; p.fireT -= dt; p.orbA += dt * 3.2;
    let mx = inp.mx || 0, my = inp.my || 0;
    const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
    if (p.down) { // a downed climber drifts as a ghost until the room is cleared
      p.x = clamp(p.x + mx * 45 * dt, L + 4, Rx - 4); p.y = clamp(p.y + my * 45 * dt, T + 4, By - 4); p.moving = l > 0.1; return;
    }
    if (p.frenzy > 0) p.frenzy -= dt;
    if (inp.bomb && p.bombs > 0) { p.bombs--; this.hazards.push({ k: 'bomb', x: p.x, y: p.y + 2, t: 0, life: 1.4, pl: p.id }); this.ev({ k: 'fuse' }); }
    if (inp.use) this.useActive(p);
    if (inp.dash && p.dashCd <= 0) {
      // dash the way you're moving, or the way you're facing when standing still
      let dx = mx, dy = my;
      if (l <= 0.1) { const F = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] }[p.face] || [0, 1]; dx = F[0]; dy = F[1]; }
      p.dashT = 0.17; p.dashCd = st.dashCD; p.dx = dx; p.dy = dy; this.ev({ k: 'dash', p: p.id }); p.dashes = (p.dashes || 0) + 1;
      if (st.dashBurst) for (let i = 0; i < 8 * st.dashBurst; i++) this.pbullet(p, p.x, p.y - 4, i * TAU / (8 * st.dashBurst), st.shotSpeed * 0.8, st.dmg * st.dmgMul * 0.7, { life: 0.35 });
    }
    let vx, vy;
    if (p.dashT > 0) {
      p.dashT -= dt; vx = p.dx * 235 * st.dashSpeed; vy = p.dy * 235 * st.dashSpeed;
      if (p.dashT <= 0) p.inv = Math.max(p.inv, 0.15); // short grace so you can't get clipped coming out of a dash
      if (st.candle) { p.trailT -= dt; if (p.trailT <= 0) { p.trailT = 0.03; this.hazards.push({ k: 'fire', x: p.x, y: p.y + 2, r: 7, t: 0, life: 1.6, dmg: 6 * st.candle }); } }
    } else {
      const spd = st.speed * (st.panic && p.hp <= 2 ? 1 + st.panic : 1);
      p.vx += (mx * spd - p.vx) * Math.min(1, dt * 14); p.vy += (my * spd - p.vy) * Math.min(1, dt * 14);
      vx = p.vx; vy = p.vy;
    }
    vx += p.px; vy += p.py;
    const decay = Math.pow(0.02, dt); p.px *= decay; p.py *= decay;
    this.move(p, vx * dt, vy * dt, 'p');
    p.moving = l > 0.1; if (p.moving) p.anim += dt * 9;
    let ax = inp.ax || 0, ay = inp.ay || 0;
    const al = Math.hypot(ax, ay);
    if (al > 0.1) {
      ax /= al; ay /= al;
      p.face = Math.abs(ax) > Math.abs(ay) ? (ax < 0 ? 'l' : 'r') : (ay < 0 ? 'u' : 'd');
      if (p.fireT <= 0) { this.shoot(p, ax, ay); p.fireT = st.fire * (p.frenzy > 0 ? 0.33 : 1); }
    } else if (p.moving) p.face = Math.abs(mx) > Math.abs(my) ? (mx < 0 ? 'l' : 'r') : (my < 0 ? 'u' : 'd');
    if (!st.flight && !st.acidproof && p.dashT <= 0 && this.tileAtPx(p.x, p.y + 2) === '~') this.hurt(p, 1);
    if (st.buddy) {
      p.budT -= dt;
      if (p.budT <= 0) {
        p.budT = 0.75;
        for (let i = 0; i < st.buddy; i++) {
          const [bx, by] = this.buddyPos(p, i), e = this.nearestEnemy(bx, by, 190);
          if (e) this.pbullet(p, bx, by, Math.atan2(e.y - by, e.x - bx), 175, st.dmg * st.dmgMul * 0.5, { life: 0.9 });
        }
      }
    }
    if (st.aura) for (const e of this.enemies) if (!e.dead && !e.under && e.spawnT <= 0 && Math.hypot(e.x - p.x, e.y - p.y) < 26 + e.r) this.dot(e, (2 + st.dmg * 0.4) * st.aura * dt, p);
  }

  pbullet(p, x, y, a, speed, dmg, o = {}) {
    const st = p.st, life = o.life || (st.boomer ? st.range * 2.2 : st.range);
    const b = { pl: p.id, x, y, vx: Math.cos(a) * speed + (o.carry ? p.vx * 0.25 : 0), vy: Math.sin(a) * speed + (o.carry ? p.vy * 0.25 : 0),
      r: (o.r || 2.5) + st.sizeUp, dmg, dmg0: dmg, life, max: life, t: 0, pierce: st.pierce, bounce: st.bounce, k: o.k || 's', hit: [], prism: o.prism ? 1 : 0, bomb: o.bomb ? 1 : 0, shard: o.shard ? 1 : 0, phase: st.phase ? 1 : 0 };
    this.bullets.push(b);
    return b;
  }
  buddyPos(p, i) { const a = p.orbA * 0.5 + i * 2.1; return [p.x + Math.cos(a) * 15, p.y - 6 + Math.sin(a) * 8]; }
  shoot(p, ax, ay) {
    const st = p.st;
    p.shots++;
    const big = st.big5 && p.shots % 5 === 0;
    const bomb = st.bomb && p.shots % Math.max(2, 7 - st.bomb) === 0;
    let dmg = st.dmg * st.dmgMul;
    if (st.piggy) dmg += Math.min(2.5, this.teeth * 0.05) * st.piggy;
    if (st.rage && p.hp <= p.st.maxhp / 2) dmg *= 1 + 0.6 * st.rage;
    if (st.collector) dmg *= 1 + st.collector * p.items.length;
    if (st.still && !p.moving) dmg *= 1 + st.still;
    if (st.combo) dmg *= 1 + Math.min(0.4, st.combo * p.streak);
    if (big) dmg *= 3;
    const a0 = Math.atan2(ay, ax);
    let angles = st.triple ? [-0.2, 0, 0.2] : [0];
    if (st.back) angles = angles.concat(angles.map(a => a + Math.PI));
    if (st.pinwheel && p.shots % 4 === 0) for (let k = 1; k < 8; k++) if (!angles.includes(k * Math.PI / 4)) angles.push(k * Math.PI / 4);
    const offs = st.twin ? [-3.5, 3.5] : [0];
    for (const da of angles) for (const off of offs) {
      const a = a0 + da, px = -Math.sin(a) * off, py = Math.cos(a) * off;
      const x0 = p.x + Math.cos(a) * 5 + px, y0 = p.y - 4 + Math.sin(a) * 5 + py, w = p.weapon;
      if (w === 'pepper') { for (let k = 0; k < 5; k++) this.pbullet(p, x0, y0, a + (k - 2) * 0.16 + rr(-0.05, 0.05), st.shotSpeed * rr(0.85, 1.15), dmg * 0.26, { carry: 1, r: big ? 3.5 : 2, k: 'p', bomb: bomb && k === 2 }); continue; }
      if (w === 'horn') { for (let k = 0; k < 7; k++) { const hb = this.pbullet(p, x0, y0, a + (k - 3) * 0.16, st.shotSpeed * 0.9, dmg * 0.32, { carry: 1, r: 3, k: 'h', bomb: bomb && k === 3 }); hb.kb = 2.5; } continue; }
      if (w === 'lamprey') { for (const sg of [1, -1]) { const lb = this.pbullet(p, x0, y0, a - sg * 0.6, st.shotSpeed * 0.75, dmg * 0.6, { carry: 1, r: 2.5, k: 'm', bomb }); lb.spin = sg * 3.4; } continue; }
      const K = { sling: 'g', vinegar: 'v', boomerang: 'w', matches: 'f', acid: 'a', cannon: 'c', lance: 'l', heartstring: 'H' }[w] || (big ? 'S' : 's');
      const R = { sling: 3.5, vinegar: 3, boomerang: 3.5, matches: 2, acid: 3, cannon: 4.5, lance: 2 }[w] || 2.5;
      const b = this.pbullet(p, x0, y0, a, st.shotSpeed, dmg, { carry: 1, r: big ? R + 2.5 : R, k: K, prism: st.prism && !big, bomb });
      if (w === 'vinegar') { b.lob = 1; b.life = b.max = 0.42 + st.range * 0.25; }
      if (w === 'cannon') { b.lob = 2; b.life = b.max = 0.5 + st.range * 0.25; }
      if (w === 'acid') b.psn = 1;
    }
    this.ev({ k: 'shoot', p: p.id }); p.recoil = 0.07;
  }

  hurt(p, amt) {
    if (p.inv > 0 || p.dashT > 0 || p.down || !p.present || this.state !== 'play') return false;
    if (p.shields > 0) { p.shields--; p.shieldUp = p.shields > 0; p.inv = 0.8; this.ev({ k: 'shield', p: p.id, x: p.x, y: p.y }); return true; }
    if (p.st.dodge && rnd() < Math.min(0.5, p.st.dodge)) { p.inv = 0.5; this.ev({ k: 'dodge', p: p.id, x: p.x, y: p.y }); return true; }
    p.streak = 0; p.roomHit = true;
    if (p.st.fragile) amt *= 2;
    p.hp -= amt; p.inv = 1.0;
    if (this.tut && p.hp < 2) p.hp = 2;
    this.ev({ k: 'hurt', p: p.id, x: p.x, y: p.y }); this.shake = Math.max(this.shake, 4);
    if (p.st.hurtFreeze) { for (const e of this.enemies) e.stun = Math.max(e.stun || 0, (e.boss ? 0.8 : 1.6) * p.st.hurtFreeze); this.ev({ k: 'freeze' }); }
    if (p.st.hurtBurst) for (let i = 0; i < 10 * p.st.hurtBurst; i++) this.pbullet(p, p.x, p.y - 4, i * TAU / (10 * p.st.hurtBurst), p.st.shotSpeed, p.st.dmg * p.st.dmgMul, { life: 0.6 });
    if (p.hp <= 0 && p.revives > 0) { p.revives--; p.hp = 2; p.inv = 2; this.ev({ k: 'wish', p: p.id, x: p.x, y: p.y }); return true; }
    if (p.hp <= 0) { p.hp = 0; p.down = true; this.ev({ k: 'down', p: p.id }); }
    return true;
  }

  // ---------- enemies
  addEnemy(type, x, y, extra) {
    const d = ENEMIES[type];
    const hp = d.hp * (1 + 0.32 * this.fi) * (this.twoPlayers() ? 1.4 : 1) * (1 - Math.min(0.4, Math.max(0, ...this.players.filter(q => q.present).map(q => q.st.weaken))));
    const e = { id: NID++, type, x, y, r: d.r, hp, max: hp, fly: !!d.fly, st: 'idle', t: rr(0.6, 1.6), age: rnd() * 5, spawnT: 0.7, flash: 0, kx: 0, ky: 0, vx: 0, vy: 0, z: 0, ...extra };
    if (type === 'burrower') { e.st = 'under'; e.under = 1; }
    if (d.ai === 'wallcrawler') { e.pp = rnd() * this.perim(); e.dir = rnd() < 0.5 ? 1 : -1; [e.x, e.y] = this.perimPt(e.pp); }
    if (d.ai === 'teleport' || d.ai === 'ghost') e.gt = rnd() * 2;
    if (d.ai === 'mimic') e.spawnT = 0;
    this.enemies.push(e);
    return e;
  }
  spawnEnemies() {
    const F = FL(this.fi);
    let budget = 3 + Math.min(this.fi, 14) * 0.9 + this.tier() * 1.5 + rnd() * 2.5;
    if (this.twoPlayers()) budget *= 1.3;
    const spots = [];
    for (let ty = 1; ty < RH - 1; ty++) for (let tx = 1; tx < RW - 1; tx++) {
      if (this.room.tiles[ty][tx] !== '.') continue;
      const x = OX + tx * TILE + 8, y = OY + ty * TILE + 8;
      if (this.players.some(p => Math.hypot(p.x - x, p.y - y) < 76)) continue;
      spots.push({ x, y });
    }
    if (this.room.elite && spots.length) {
      const types = F.enemies.filter(t => !ENEMIES[t].group && ENEMIES[t].ai !== 'mimic'), t = pick(types), sp = spots.splice(Math.floor(rnd() * spots.length), 1)[0];
      const e = this.addEnemy(t, sp.x, sp.y); e.elite = 1; e.hp *= 5; e.max *= 5; e.r *= 1.45;
      budget *= 0.45;
      this.ev({ k: 'toast', text: `A golden ${ENEMIES[t].name} rules this room` });
    }
    while (budget > 0.5 && spots.length) {
      const type = pick(F.enemies), d = ENEMIES[type];
      budget -= d.cost;
      const s = spots.splice(Math.floor(rnd() * spots.length), 1)[0];
      for (let g = 0; g < (d.group || 1); g++) this.addEnemy(type, s.x + rr(-3, 3) + (g ? rr(-10, 10) : 0), s.y + rr(-3, 3) + (g ? rr(-10, 10) : 0));
    }
  }
  spawnBoss() {
    const F = FL(this.fi), type = F.boss, d = BOSSES[type];
    const hp = d.hp * (1 + 0.6 * this.tier()) * (this.twoPlayers() ? 1.5 : 1) * (1 - Math.min(0.3, Math.max(0, ...this.players.filter(q => q.present).map(q => q.st.bossCut))));
    const e = { id: NID++, type, boss: 1, x: CX, y: CY - 10, r: d.r, hp, max: hp, st: 'intro', t: 1.8, age: 0, spawnT: 0, flash: 0, kx: 0, ky: 0, z: 0, a: 0 };
    if (type === 'dangler') e.y = OY + 54;
    if (type === 'coil') { e.y = OY + 40; e.a = Math.PI / 2; e.trail = []; e.segs = []; }
    if (type === 'heart') e.y = CY - 4;
    if (type === 'bellows') e.y = CY - 8;
    if (type === 'marrow') e.y = CY - 22;
    if (type === 'taster') e.y = OY + 60;
    if (type === 'twins') { e.cx = CX; e.cy = CY - 10; e.segs = [[CX + 26, CY - 10]]; e.segR = 12; }
    if (type === 'optic' || type === 'ganglion') e.y = CY - 6;
    this.enemies.push(e);
    this.ev({ k: 'boss', name: d.name, plate: F.plate });
  }
  nearestPlayer(e) {
    if (this.decoy) return this.decoy;
    let best = null, bd = 1e9;
    for (const p of this.players) { if (!p.present || p.down) continue; const d = Math.hypot(p.x - e.x, p.y - e.y); if (d < bd) { bd = d; best = p; } }
    return best;
  }
  damage(e, dmg, p, o = {}) {
    if (e.dead) return;
    if (!e.boss && ENEMIES[e.type].armor) dmg *= ENEMIES[e.type].armor;
    e.hp -= dmg; e.flash = 0.08;
    if (!e.boss && (o.kx || o.ky)) {
      if (p && p.st.hook) { const qx = p.x - e.x, qy = p.y - e.y, l = Math.hypot(qx, qy) || 1; e.kx = qx / l * 90 * p.st.hook; e.ky = qy / l * 90 * p.st.hook; }
      else { const l = Math.hypot(o.kx, o.ky) || 1, k = (p ? p.st.knock : 1) * (o.kb || 1); e.kx = o.kx / l * 70 * k; e.ky = o.ky / l * 70 * k; }
    }
    this.ev({ k: 'hit', x: e.x, y: e.y, c: e.boss ? '#e0607a' : ENEMIES[e.type].gore, crit: o.crit ? 1 : 0, d: Math.round(dmg * 10) / 10, q: o.quiet ? 1 : 0 });
    if (e.hp <= 0) this.kill(e, p);
  }
  dot(e, amt, p) { if (e.dead) return; e.hp -= amt; if (e.hp <= 0) this.kill(e, p); }
  drop(kind, x, y, v = 1) { this.pickups.push({ kind, x: clamp(x, L + 6, Rx - 6), y: clamp(y, T + 6, By - 6), v }); }
  kill(e, p) {
    if (e.dead) return;
    e.dead = true;
    if (e.boss) return this.bossDie(e);
    this.kills++;
    this.ev({ k: 'die', x: e.x, y: e.y, c: ENEMIES[e.type].gore, ty: e.type });
    this.hitStop = Math.max(this.hitStop || 0, 0.045);
    if (!e.small) this.gainXp(ENEMIES[e.type].cost);
    const luck = this.luck();
    if (rnd() < 0.05 + luck * 0.015) this.drop('heart', e.x, e.y, 1);
    else if (rnd() < 0.24 + luck * 0.02 + Math.max(...this.players.map(q => q.st.teethDrop))) this.drop('teeth', e.x, e.y, 1);
    if (rnd() < 0.03) this.drop('marrow', e.x + 4, e.y, 1);
    if (rnd() < 0.035 + luck * 0.005) this.drop('bomb', e.x - 4, e.y, 1);
    for (const q of this.players) if (q.present && q.active) q.charge = Math.min(99, q.charge + 1);
    if (e.elite) { this.drop('heart', e.x - 8, e.y, 2); this.drop('teeth', e.x + 8, e.y, 5); this.drop('bomb', e.x, e.y + 8, 1); }
    if (p && p.st.dashReset) p.dashCd = 0;
    if (p && p.st.deathBurst) for (let i = 0; i < 3 * p.st.deathBurst; i++) this.pbullet(p, e.x, e.y, rnd() * TAU, 160, p.st.dmg * p.st.dmgMul * 0.6, { life: 0.4, shard: 1, k: 'w', r: 1.5 });
    if (p && p.st.leech && rnd() < 0.05 * p.st.leech + p.st.luck * 0.01 && p.hp < p.st.maxhp) { p.hp++; this.ev({ k: 'heal', p: p.id, x: p.x, y: p.y }); }
    if (p && p.st.explode) {
      this.ev({ k: 'boom', x: e.x, y: e.y, r: 26 }); this.shake = Math.max(this.shake, 3);
      for (const o of this.enemies) if (!o.dead && o !== e && !o.under && Math.hypot(o.x - e.x, o.y - e.y) < 26 + o.r) this.damage(o, (3 + p.st.dmg * 0.8) * p.st.explode, p);
    }
    const dd = ENEMIES[e.type];
    if (dd.split && (e.gen || 0) < (dd.gens || 1)) for (let i = 0; i < dd.split; i++) { const a = i * TAU / dd.split + rnd(); this.addEnemy(e.type, e.x + Math.cos(a) * 6, e.y + Math.sin(a) * 6, { small: 1, gen: (e.gen || 0) + 1, r: e.r * 0.72, hp: e.max * 0.4, max: e.max * 0.4, spawnT: 0, t: 0.4 }); }
    if (dd.ai === 'bomber' && !e.exploded) this.ring(e, 6, 70, rnd() * 6, 'b');
    if (e.type === 'slime' && !e.small) for (const s of [-1, 1]) this.addEnemy('slime', e.x + s * 6, e.y, { small: 1, r: 4.5, hp: e.max * 0.35, max: e.max * 0.35, spawnT: 0, t: 0.4 });
  }
  bossDie(e) {
    this.bosses++;
    this.ev({ k: 'bossdie', x: e.x, y: e.y, ty: e.type }); this.shake = 12; this.slowmo = 1.6; this.hitStop = 0.12;
    for (const o of this.enemies) o.dead = true;
    for (const p of this.players) if (p.present && p.st.bossHp) { p.st.maxhp += 2 * p.st.bossHp; p.hp += 2 * p.st.bossHp; }
    this.bullets = this.bullets.filter(b => !b.en);
    this.hazards = [];
    this.marrow += 10 + this.fi * 4;
    for (let i = 0; i < 5; i++) this.drop('marrow', e.x + rr(-20, 20), e.y + rr(-10, 20), 2);
    this.drop('heart', CX - 30, CY + 20, 2);
    this.pickups.push({ kind: 'cache', x: CX, y: CY + 26 });
    this.gainXp(8 + this.fi * 3);
    if (this.hasNext()) this.valve = { x: CX, y: CY - 14 }; else this.winT = 3.5;
  }

  updateEnemies(dt) {
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.age += dt; e.flash = Math.max(0, e.flash - dt); if (e.orbT) e.orbT -= dt; if (e.fireT) e.fireT -= dt; if (e.slowT) e.slowT -= dt; if (e.thornT) e.thornT -= dt;
      if (e.spawnT > 0) { e.spawnT -= dt; continue; }
      if (e.burn) { this.dot(e, e.burn.dps * dt, this.players[e.burn.p]); e.burn.t -= dt; if (e.burn.t <= 0) e.burn = null; }
      if (e.poison) { this.dot(e, e.poison.dps * dt, this.players[e.poison.p]); e.poison.t -= dt; if (e.poison.t <= 0) e.poison = null; }
      if (e.dead) continue;
      const tgt = this.nearestPlayer(e);
      if (e.stun > 0) e.stun -= dt;
      else if (e.boss) this.bossAI(e, dt, tgt);
      else if (e.dummy) { if (e.dummy === 2) { e.t -= dt; e.st = e.t < 0.5 ? 'wind' : 'idle'; if (e.t <= 0 && tgt) { e.t = 1.1; this.fan(e, tgt, 3, 0.3, 55, 'b'); } } }
      else if (tgt) this.ai(e, dt, tgt, (e.poison ? 0.65 : 1) * (e.slowT > 0 ? 0.5 : 1) * (1 - Math.min(0.35, this.slowAll || 0)));
      if (!e.boss) { this.move(e, e.kx * dt, e.ky * dt, e.fly ? 'f' : 'e'); const k = Math.pow(0.002, dt); e.kx *= k; e.ky *= k; }
      if (!e.under && e.z < 10 && e.st !== 'intro' && !e.dummy) {
        for (const p of this.players) {
          if (!p.present || p.down) continue;
          if (Math.hypot(p.x - e.x, p.y - e.y) < e.r + p.r - 1) { this.hurt(p, 1); if (p.st.thorns && !(e.thornT > 0)) { e.thornT = 0.4; this.damage(e, (3 + p.st.dmg) * p.st.thorns, p); } }
          if (e.segs) for (const s of e.segs) if (Math.hypot(p.x - s[0], p.y - s[1]) < (e.segR || 7) + p.r - 1) this.hurt(p, 1);
        }
      }
    }
    // keep small enemies from stacking on top of each other
    const es = this.enemies;
    for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) {
      const a = es[i], b = es[j];
      if (a.boss || b.boss || a.under || b.under || a.dead || b.dead) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.r + b.r;
      if (d < m && d > 0.01) { const push = (m - d) / 2; a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push; this.resolve(a, a.fly ? 'f' : 'e'); this.resolve(b, b.fly ? 'f' : 'e'); }
    }
    this.enemies = this.enemies.filter(e => !e.dead);
  }

  ebullet(x, y, a, speed, k = 'b', o = {}) {
    speed *= (1 + 0.08 * this.tier()) * (1 - Math.min(0.4, Math.max(...this.players.map(p => p.present ? p.st.slowBullets : 0))));
    this.bullets.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: o.r || 3, life: o.life || 5, k, en: 1, curve: o.curve || 0, t: 0 });
  }
  fan(e, tgt, n, spread, speed, k) {
    const a0 = Math.atan2(tgt.y - e.y, tgt.x - e.x);
    for (let i = 0; i < n; i++) this.ebullet(e.x, e.y, a0 + (i - (n - 1) / 2) * spread, speed, k);
  }
  ring(e, n, speed, off, k) { for (let i = 0; i < n; i++) this.ebullet(e.x, e.y, off + i * TAU / n, speed, k); }
  moveToward(e, tgt, sp, dt) {
    const dx = tgt.x - e.x, dy = tgt.y - e.y, l = Math.hypot(dx, dy) || 1;
    this.move(e, dx / l * sp * dt, dy / l * sp * dt, 'e');
  }

  ai(e, dt, tgt, slow) {
    const d = ENEMIES[e.type];
    const dx = tgt.x - e.x, dy = tgt.y - e.y, dist = Math.hypot(dx, dy) || 1;
    let ux = dx / dist, uy = dy / dist;
    // sidestep around lumps and teeth instead of pushing into them forever
    if (e.det && e.det.t > 0) { e.det.t -= dt; ux = ux * 0.3 + e.det.x; uy = uy * 0.3 + e.det.y; const l = Math.hypot(ux, uy) || 1; ux /= l; uy /= l; }
    e.t -= dt;
    this.aiType(e, dt, tgt, slow, dist, ux, uy, dx, dy, d);
    if (e.hitWall && !(e.det && e.det.t > 0) && e.st !== 'lunge' && e.st !== 'charge' && !e.fly) { const sg = rnd() < 0.5 ? 1 : -1; e.det = { t: rr(0.4, 0.8), x: -uy * sg, y: ux * sg }; }
  }
  aiType(e, dt, tgt, slow, dist, ux, uy, dx, dy, d) {
    switch (e.type) {
      case 'grub': {
        const w = Math.sin(e.age * 4 + e.id) * 0.6, sp = d.speed * slow * (1 + this.fi * 0.08);
        this.move(e, (ux - uy * w) * sp * dt, (uy + ux * w) * sp * dt, 'e'); break;
      }
      case 'spitter':
        if (e.st === 'idle' && e.t <= 0) { e.st = 'wind'; e.t = 0.55; }
        else if (e.st === 'wind' && e.t <= 0) { this.fan(e, tgt, this.fi >= 2 ? 3 : 1, 0.28, 85 + this.fi * 6, 'b'); e.st = 'idle'; e.t = rr(1.6, 2.4); this.ev({ k: 'spit', x: e.x, y: e.y }); }
        break;
      case 'gnat': {
        e.vx += (ux * 150 + rr(-220, 220)) * dt; e.vy += (uy * 150 + rr(-220, 220)) * dt;
        const sp = Math.hypot(e.vx, e.vy), mx = d.speed * slow;
        if (sp > mx) { e.vx *= mx / sp; e.vy *= mx / sp; }
        this.move(e, e.vx * dt, e.vy * dt, 'f'); break;
      }
      case 'leech':
        if (e.st === 'idle') { this.move(e, ux * d.speed * slow * dt, uy * d.speed * slow * dt, 'e'); if (dist < 100 && e.t <= 0) { e.st = 'wind'; e.t = 0.55; e.lx = ux; e.ly = uy; } }
        else if (e.st === 'wind') { if (e.t <= 0) { e.st = 'lunge'; e.t = 0.38; } }
        else if (e.st === 'lunge') { this.move(e, e.lx * 200 * dt, e.ly * 200 * dt, 'e'); if (e.t <= 0 || e.hitWall) { e.st = 'rest'; e.t = 0.9; } }
        else if (e.st === 'rest' && e.t <= 0) { e.st = 'idle'; e.t = rr(0.4, 1); }
        break;
      case 'slime':
        if (e.st === 'idle' && e.t <= 0) { e.st = 'hop'; e.t = 0.45; e.lx = ux; e.ly = uy; }
        else if (e.st === 'hop') {
          const sp = (e.small ? 115 : 85) * slow;
          this.move(e, e.lx * sp * dt, e.ly * sp * dt, 'e');
          e.z = Math.sin((1 - Math.max(0, e.t) / 0.45) * Math.PI) * 8;
          if (e.t <= 0) { e.z = 0; e.st = 'idle'; e.t = rr(0.5, 1.1); if (!e.small && this.fi >= 3) this.ring(e, 6, 60, rnd() * 6, 'b'); }
        }
        break;
      case 'antibody':
        if (e.st === 'idle') {
          if (e.a === undefined) e.a = Math.atan2(-dy, -dx);
          e.a += dt * 1.1 * (e.id % 2 ? 1 : -1);
          const ox = tgt.x + Math.cos(e.a) * 62, oy = tgt.y + Math.sin(e.a) * 62, vx = ox - e.x, vy = oy - e.y, l = Math.hypot(vx, vy) || 1, sp = Math.min(l * 3, d.speed * slow);
          this.move(e, vx / l * sp * dt, vy / l * sp * dt, 'e');
          if (e.t <= 0) { e.st = 'wind'; e.t = 0.5; }
        } else if (e.st === 'wind') { if (e.t <= 0) { e.st = 'charge'; e.t = 0.55; e.lx = ux; e.ly = uy; } }
        else if (e.st === 'charge') { this.move(e, e.lx * 175 * dt, e.ly * 175 * dt, 'e'); if (e.t <= 0 || e.hitWall) { e.st = 'idle'; e.t = rr(2, 3.2); } }
        break;
      case 'burrower':
        if (e.st === 'under') { this.move(e, ux * d.speed * slow * dt, uy * d.speed * slow * dt, 'e'); if (dist < 40 || e.t <= 0) { e.st = 'rise'; e.t = 0.6; } }
        else if (e.st === 'rise') { if (e.t <= 0) { e.st = 'up'; e.under = 0; e.t = 1.3; this.ring(e, this.fi >= 4 ? 10 : 8, 70, rnd() * 6, 'r'); } }
        else if (e.st === 'up') { if (e.t <= 0) { e.st = 'under'; e.under = 1; e.t = rr(1.8, 2.6); } }
        else { e.st = 'under'; e.under = 1; }
        break;
      default: this.ai2(e, dt, tgt, slow, dist, ux, uy, dx, dy, d); break;
      case 'crawler': {
        e.zz = (e.zz || 0) - dt; if (e.zz <= 0) { e.zz = 0.4; e.zig = -(e.zig || 1); }
        const a = Math.atan2(uy, ux) + e.zig * 0.7;
        this.move(e, Math.cos(a) * d.speed * slow * dt, Math.sin(a) * d.speed * slow * dt, 'e');
        if (e.t <= 0) { e.t = rr(2, 3); this.fan(e, tgt, 1, 0, 115, 'n'); }
        break;
      }
    }
  }

  bossAI(e, dt, tgt) {
    e.t -= dt;
    if (e.st === 'intro') { if (e.t <= 0) { e.st = 'idle'; e.t = 0.6; } if (e.type !== 'coil' && e.type !== 'dangler' && e.type !== 'taster' && e.type !== 'twins') return; }
    if (!tgt) return;
    const ph = e.hp / e.max, fast = ph < 0.5, alive = this.alive();
    const dx = tgt.x - e.x, dy = tgt.y - e.y, dist = Math.hypot(dx, dy) || 1, ux = dx / dist, uy = dy / dist;
    switch (e.type) {
      case 'dangler':
        e.x = CX + Math.sin(e.age * 0.65) * 96; e.y = OY + 54 + Math.sin(e.age * 1.3) * 4;
        if (e.st === 'intro') return;
        if (e.st === 'idle' && e.t <= 0) { e.st = rnd() < 0.55 ? 'fan' : 'drip'; e.t = 0.6; this.ev({ k: 'tele', boss: 1 }); }
        else if (e.st === 'fan' && e.t <= 0) { this.fan(e, tgt, fast ? 7 : 5, 0.22, 100, 'r'); if (fast) this.fan(e, tgt, 4, 0.3, 70, 'r'); e.st = 'idle'; e.t = fast ? 1.3 : 1.8; this.ev({ k: 'spit', x: e.x, y: e.y }); }
        else if (e.st === 'drip' && e.t <= 0) {
          const n = fast ? 6 : 4;
          for (let i = 0; i < n; i++) { const p = pick(alive); this.hazards.push({ k: 'tele', x: clamp(p.x + rr(-50, 50), L + 10, Rx - 10), y: clamp(p.y + rr(-36, 36), T + 10, By - 10), r: 13, t: 0, life: 0.9 + i * 0.12, then: 'drip' }); }
          e.st = 'idle'; e.t = fast ? 1.6 : 2.1;
        }
        if (!e.s1 && fast) { e.s1 = 1; this.addEnemy('gnat', e.x - 20, e.y + 20); this.addEnemy('gnat', e.x + 20, e.y + 20); }
        break;
      case 'churn':
        if (e.st === 'idle') {
          this.moveToward(e, tgt, 18 + (1 - ph) * 14, dt);
          if (e.t <= 0) { e.st = rnd() < 0.55 ? 'crouch' : 'spiral'; e.t = e.st === 'crouch' ? 0.55 : 2.2; e.a = rnd() * 6; this.ev({ k: 'tele', boss: 1 }); }
        } else if (e.st === 'crouch' && e.t <= 0) {
          e.st = 'air'; e.t = 0.85; e.fx = e.x; e.fy = e.y; e.tx = clamp(tgt.x, L + 22, Rx - 22); e.ty = clamp(tgt.y, T + 22, By - 22);
          this.hazards.push({ k: 'tele', x: e.tx, y: e.ty, r: 28, t: 0, life: 0.85 });
        } else if (e.st === 'air') {
          const k = 1 - Math.max(0, e.t) / 0.85;
          e.x = e.fx + (e.tx - e.fx) * k; e.y = e.fy + (e.ty - e.fy) * k; e.z = Math.sin(k * Math.PI) * 46;
          if (e.t <= 0) {
            e.z = 0; e.st = 'idle'; e.t = fast ? 1.1 : 1.6; this.ring(e, fast ? 18 : 14, 85, rnd() * 6, 'b'); this.shake = 7; this.ev({ k: 'slam', x: e.x, y: e.y });
            for (const p of alive) if (Math.hypot(p.x - e.x, p.y - e.y) < 30) this.hurt(p, 1);
          }
        } else if (e.st === 'spiral') {
          e.q = (e.q || 0) - dt;
          if (e.q <= 0) { e.q = fast ? 0.06 : 0.085; e.a += 0.38; this.ebullet(e.x, e.y, e.a, 75, 'b'); this.ebullet(e.x, e.y, e.a + Math.PI, 75, 'b'); }
          if (e.t <= 0) { e.st = 'idle'; e.t = 1.4; }
        }
        if (!e.s1 && ph < 0.66) { e.s1 = 1; for (const s of [-1, 1]) this.addEnemy('slime', e.x + s * 30, e.y, { small: 1, r: 4.5, hp: 6, max: 6 }); }
        if (!e.s2 && ph < 0.33) { e.s2 = 1; for (const s of [-1, 1]) this.addEnemy('slime', e.x + s * 34, e.y + 10); }
        break;
      case 'bellows':
        if (e.st === 'idle') { e.st = 'inhale'; e.t = 2.3; this.ev({ k: 'inhale' }); }
        if (e.st === 'inhale') {
          e.br = Math.min(1, (e.br || 0) + dt * 0.55);
          for (const p of alive) { const qx = e.x - p.x, qy = e.y - p.y, l = Math.hypot(qx, qy) || 1; p.px = qx / l * 44; p.py = qy / l * 44; }
          if (e.t <= 0) {
            e.st = 'exhale'; e.t = 0.3; this.ring(e, 18, 82, rnd() * 6, 'r'); if (fast) e.q2 = 0.18;
            for (const p of alive) { const qx = p.x - e.x, qy = p.y - e.y, l = Math.hypot(qx, qy) || 1; p.px = qx / l * 170; p.py = qy / l * 170; }
            this.shake = 5; this.ev({ k: 'blow' });
          }
        } else if (e.st === 'exhale') {
          e.br = Math.max(0, e.br - dt * 4);
          if (e.q2 > 0) { e.q2 -= dt; if (e.q2 <= 0) this.ring(e, 18, 62, 0.17, 'r'); }
          if (e.t <= 0) { e.st = 'cough'; e.t = 0.35; e.n = 3; }
        } else if (e.st === 'cough') {
          if (e.t <= 0) { this.fan(e, pick(alive), 3, 0.25, 125, 'r'); this.ev({ k: 'spit', x: e.x, y: e.y }); e.n--; e.t = 0.35; if (e.n <= 0) { e.st = 'rest'; e.t = fast ? 0.8 : 1.3; } }
        } else if (e.st === 'rest' && e.t <= 0) e.st = 'idle';
        if (!e.s1 && fast) { e.s1 = 1; for (let i = 0; i < 3; i++) this.addEnemy('gnat', CX - 40 + i * 40, By - 20); }
        break;
      case 'coil': {
        let sp = 58 + (fast ? 16 : 0), turn = 1.7;
        if (e.st === 'intro') sp = 40;
        else if (e.st === 'idle' && e.t <= 0) { e.st = 'wind'; e.t = 0.5; this.ev({ k: 'tele', boss: 1 }); }
        else if (e.st === 'wind') { sp = 10; if (e.t <= 0) { e.st = 'charge'; e.t = 0.9; } }
        else if (e.st === 'charge') { sp = 170; turn = 0.5; if (e.t <= 0) { e.st = 'idle'; e.t = rr(2.4, 3.2); } }
        const want = Math.atan2(dy, dx);
        e.a += clamp(angDiff(want, e.a), -turn * dt, turn * dt);
        let nx = e.x + Math.cos(e.a) * sp * dt, ny = e.y + Math.sin(e.a) * sp * dt;
        if (nx < L + e.r || nx > Rx - e.r) { e.a = Math.PI - e.a; nx = clamp(nx, L + e.r, Rx - e.r); }
        if (ny < T + e.r || ny > By - e.r) { e.a = -e.a; ny = clamp(ny, T + e.r, By - e.r); }
        e.x = nx; e.y = ny;
        e.trail.unshift([e.x, e.y]); if (e.trail.length > 500) e.trail.length = 500;
        e.segs = []; let acc = 0;
        for (let i = 1; i < e.trail.length && e.segs.length < 10; i++) {
          acc += Math.hypot(e.trail[i][0] - e.trail[i - 1][0], e.trail[i][1] - e.trail[i - 1][1]);
          if (acc >= 10) { acc = 0; e.segs.push([e.trail[i][0], e.trail[i][1]]); }
        }
        e.q = (e.q ?? 2.6) - dt;
        if (e.q <= 0 && e.st !== 'intro') {
          e.q = fast ? 1.8 : 2.6; e.flip = !e.flip;
          e.segs.forEach((s, i) => { if (i % 2 === (e.flip ? 1 : 0)) { const side = i % 4 < 2 ? 1 : -1; this.ebullet(s[0], s[1], e.a + side * Math.PI / 2, 62, 'b'); } });
        }
        break;
      }
      case 'marrow':
        if (e.st === 'idle') {
          this.moveToward(e, tgt, 26, dt);
          if (e.t <= 0) {
            e.st = pick(['aim', 'spikes', 'boomer']); e.t = e.st === 'aim' ? 0.75 : 0.5;
            if (e.st === 'aim') { e.lx = ux; e.ly = uy; this.hazards.push({ k: 'line', x: e.x, y: e.y, x2: e.x + ux * 400, y2: e.y + uy * 400, t: 0, life: 0.75 }); }
            this.ev({ k: 'tele', boss: 1 });
          }
        } else if (e.st === 'aim' && e.t <= 0) { e.st = 'dash'; e.t = 1.2; }
        else if (e.st === 'dash') {
          this.move(e, e.lx * 250 * dt, e.ly * 250 * dt, 'e');
          if (e.hitWall || e.t <= 0) { const hw = e.hitWall; e.st = 'idle'; e.t = fast ? 0.9 : 1.4; if (hw) { this.ring(e, fast ? 14 : 10, 80, rnd() * 6, 'n'); this.shake = 6; this.ev({ k: 'slam', x: e.x, y: e.y }); } }
        } else if (e.st === 'spikes' && e.t <= 0) {
          const lines = [[1, 0], [0, 1]]; if (fast) lines.push([0.707, 0.707], [0.707, -0.707]);
          for (const [lx, ly] of lines) for (let s = -320; s <= 320; s += 15) {
            const x = tgt.x + lx * s, y = tgt.y + ly * s;
            if (x > L + 4 && x < Rx - 4 && y > T + 4 && y < By - 4) this.hazards.push({ k: 'tele', x, y, r: 7, t: 0, life: 0.8, then: 'spike' });
          }
          e.st = 'idle'; e.t = fast ? 1.4 : 1.9;
        } else if (e.st === 'boomer' && e.t <= 0) {
          const a0 = Math.atan2(dy, dx), sgn = rnd() < 0.5 ? 1 : -1;
          for (const i of [-1, 0, 1]) this.ebullet(e.x, e.y, a0 + i * 0.5, 120, 'n', { curve: (i || 1) * 1.4 * sgn, life: 3.2, r: 4 });
          e.st = 'idle'; e.t = fast ? 1.1 : 1.6;
        }
        break;
      default: this.bossAI2(e, dt, tgt, ph, fast, alive, ux, uy, dx, dy); break;
      case 'heart': {
        e.pulse = Math.max(0, (e.pulse || 0) - dt * 3);
        const interval = ph < 0.25 ? 0.8 : ph < 0.6 ? 1.1 : 1.45;
        if (e.t <= 0) {
          e.t = interval; e.pulse = 1; this.ev({ k: 'beat' }); this.shake = Math.max(this.shake, 2);
          const n = 22, gap = rnd() * TAU;
          for (let i = 0; i < n; i++) { const a = i * TAU / n; if (Math.abs(angDiff(a, gap)) < 0.5) continue; this.ebullet(e.x, e.y, a, 62 + (1 - ph) * 20, 'r'); }
        }
        if (ph < 0.6) {
          e.q = (e.q || 0) - dt;
          if (e.q <= 0) { e.q = ph < 0.25 ? 0.1 : 0.14; e.a = (e.a || 0) + 0.21; this.ebullet(e.x, e.y, e.a, 58, 'b'); this.ebullet(e.x, e.y, e.a + Math.PI, 58, 'b'); }
        }
        if (!e.s1 && ph < 0.6) { e.s1 = 1; this.addEnemy('antibody', CX - 70, CY + 30); this.addEnemy('antibody', CX + 70, CY + 30); }
        if (!e.s2 && ph < 0.25) { e.s2 = 1; this.addEnemy('antibody', CX - 70, CY - 30); this.addEnemy('antibody', CX + 70, CY - 30); this.addEnemy('leech', CX, By - 16); }
        break;
      }
    }
  }

  // ---------- the 30 newer monsters share these behaviours (ENEMIES[type].ai)
  perim() { return 2 * ((Rx - L - 20) + (By - T - 20)); }
  perimPt(pp) {
    const w = Rx - L - 20, h = By - T - 20, P = 2 * (w + h);
    pp = ((pp % P) + P) % P;
    if (pp < w) return [L + 10 + pp, T + 10];
    if (pp < w + h) return [Rx - 10, T + 10 + pp - w];
    if (pp < 2 * w + h) return [Rx - 10 - (pp - w - h), By - 10];
    return [L + 10, By - 10 - (pp - 2 * w - h)];
  }
  freeSpot(x, y) {
    for (let i = 0; i < 12; i++) { const px = clamp(x + rr(-20, 20) * i * 0.3, L + 10, Rx - 10), py = clamp(y + rr(-20, 20) * i * 0.3, T + 10, By - 10), c = this.tileAtPx(px, py); if (c === '.' || c === '~') return [px, py]; }
    return [CX, CY];
  }
  ai2(e, dt, tgt, slow, dist, ux, uy, dx, dy, d) {
    const sp = d.speed * slow * (1 + this.tier() * 0.1);
    switch (d.ai) {
      case 'swarm': {
        e.vx += (ux * 230 + rr(-280, 280)) * dt; e.vy += (uy * 230 + rr(-280, 280)) * dt;
        const v = Math.hypot(e.vx, e.vy); if (v > sp) { e.vx *= sp / v; e.vy *= sp / v; }
        this.move(e, e.vx * dt, e.vy * dt, 'f'); break;
      }
      case 'mimic':
        if (e.st === 'idle' || e.st === 'sleep') { e.st = 'sleep'; if (dist < 42 || e.hp < e.max) { e.st = 'wake'; e.t = 0.35; this.ev({ k: 'tele' }); } }
        else if (e.st === 'wake') { if (e.t <= 0) { e.st = 'hop'; e.t = 0.32; e.lx = ux; e.ly = uy; } }
        else if (e.st === 'hop') { this.move(e, e.lx * sp * dt, e.ly * sp * dt, 'e'); e.z = Math.sin((1 - Math.max(0, e.t) / 0.32) * Math.PI) * 6; if (e.t <= 0) { e.z = 0; e.st = 'land'; e.t = 0.3; } }
        else if (e.st === 'land' && e.t <= 0) { e.st = 'hop'; e.t = 0.32; e.lx = ux; e.ly = uy; }
        break;
      case 'bomber':
        if (e.st === 'idle') { this.move(e, ux * sp * dt, uy * sp * dt, 'e'); if (dist < 30) { e.st = 'fuse'; e.t = 0.8; this.ev({ k: 'tele' }); } }
        else if (e.st === 'fuse' && e.t <= 0) {
          e.exploded = 1; this.ring(e, 10, 85, rnd() * 6, 'b'); this.ev({ k: 'boom', x: e.x, y: e.y, r: 28 }); this.shake = Math.max(this.shake, 4);
          for (const p of this.alive()) if (Math.hypot(p.x - e.x, p.y - e.y) < 28) this.hurt(p, 1);
          this.kill(e, null);
        }
        break;
      case 'miner': {
        e.vx += (ux * 60 + rr(-200, 200)) * dt; e.vy += (uy * 60 + rr(-200, 200)) * dt;
        const v = Math.hypot(e.vx, e.vy); if (v > sp) { e.vx *= sp / v; e.vy *= sp / v; }
        this.move(e, e.vx * dt, e.vy * dt, 'f');
        e.q = (e.q ?? rr(1, 2)) - dt;
        if (e.q <= 0) { e.q = rr(1.5, 2.3); this.hazards.push({ k: 'epool', x: e.x, y: e.y + 5, r: 9, t: 0, life: 4 }); }
        break;
      }
      case 'spinner':
        if (d.speed) this.move(e, ux * sp * dt, uy * sp * dt, 'e');
        if (e.st === 'idle' && e.t <= 0) { e.st = 'wind'; e.t = 0.5; }
        else if (e.st === 'wind' && e.t <= 0) { e.st = 'spin'; e.t = 1.6; e.a = e.a || rnd() * 6; }
        else if (e.st === 'spin') {
          e.q = (e.q || 0) - dt;
          if (e.q <= 0) { e.q = 0.11; e.a += 0.5; this.ebullet(e.x, e.y, e.a, 62, 'b'); if (d.armor) this.ebullet(e.x, e.y, e.a + Math.PI, 62, 'b'); }
          if (e.t <= 0) { e.st = 'idle'; e.t = rr(1.4, 2.2); }
        }
        break;
      case 'sniper':
        if (e.st === 'idle') {
          const want = dist < 95 ? -1 : dist > 140 ? 1 : 0, side = Math.sin(e.age * 1.3) * 0.6;
          this.move(e, (ux * want - uy * side) * sp * dt, (uy * want + ux * side) * sp * dt, 'e');
          if (e.t <= 0) { e.st = 'aim'; e.t = 0.9; e.lx = ux; e.ly = uy; this.hazards.push({ k: 'line', x: e.x, y: e.y, x2: e.x + ux * 400, y2: e.y + uy * 400, t: 0, life: 0.9 }); }
        } else if (e.st === 'aim' && e.t <= 0) { this.ebullet(e.x, e.y, Math.atan2(e.ly, e.lx), 240, 'r', { r: 3 }); e.st = 'idle'; e.t = rr(2.2, 3); this.ev({ k: 'spit', x: e.x, y: e.y }); }
        break;
      case 'charger':
        if (e.st === 'idle') { if (e.t <= 0) { e.st = 'wind'; e.t = 0.6; e.lx = ux; e.ly = uy; this.hazards.push({ k: 'line', x: e.x, y: e.y, x2: e.x + ux * 300, y2: e.y + uy * 300, t: 0, life: 0.6 }); } }
        else if (e.st === 'wind' && e.t <= 0) { e.st = 'charge'; e.t = 1.6; e.bn = 3; }
        else if (e.st === 'charge') {
          const ox = e.x, oy = e.y, vx = e.lx * 200 * dt, vy = e.ly * 200 * dt;
          this.move(e, vx, vy, 'e');
          if (e.hitWall) {
            if (Math.abs(e.x - ox) < Math.abs(vx) * 0.5) e.lx = -e.lx;
            if (Math.abs(e.y - oy) < Math.abs(vy) * 0.5) e.ly = -e.ly;
            e.bn--; this.shake = Math.max(this.shake, 2); this.ev({ k: 'slam', x: e.x, y: e.y });
          }
          if (e.bn <= 0 || e.t <= 0) { e.st = 'rest'; e.t = 1; }
        } else if (e.st === 'rest' && e.t <= 0) { e.st = 'idle'; e.t = rr(0.8, 1.4); }
        break;
      case 'summoner':
        e.q = (e.q ?? 2) - dt;
        e.st = e.q < 0.5 ? 'wind' : 'idle';
        if (e.q <= 0) {
          e.q = 4;
          if (this.enemies.filter(o => o.parent === e.id && !o.dead).length < 3) { const a = rnd() * TAU; this.addEnemy(d.child, e.x + Math.cos(a) * 14, e.y + Math.sin(a) * 14, { parent: e.id, spawnT: 0.5 }); }
        }
        break;
      case 'armored':
        this.move(e, ux * sp * dt, uy * sp * dt, 'e');
        if (e.st === 'idle' && e.t <= 0) { e.st = 'wind'; e.t = 0.5; }
        else if (e.st === 'wind' && e.t <= 0) { const off = (e.flip = !e.flip) ? 0 : Math.PI / 4; for (let k = 0; k < 4; k++) this.ebullet(e.x, e.y, off + k * Math.PI / 2, 80, 'n'); e.st = 'idle'; e.t = rr(2.4, 3.2); }
        break;
      case 'chaser': {
        const w = Math.sin(e.age * 4 + e.id) * 0.5;
        this.move(e, (ux - uy * w) * sp * (e.small ? 1.4 : 1) * dt, (uy + ux * w) * sp * (e.small ? 1.4 : 1) * dt, 'e'); break;
      }
      case 'leaper':
        if (e.st === 'idle' && e.t <= 0) { e.st = 'crouch'; e.t = 0.5; }
        else if (e.st === 'crouch' && e.t <= 0) { e.st = 'air'; e.t = 0.75; e.fx = e.x; e.fy = e.y; [e.tx, e.ty] = this.freeSpot(tgt.x, tgt.y); this.hazards.push({ k: 'tele', x: e.tx, y: e.ty, r: 14, t: 0, life: 0.75 }); }
        else if (e.st === 'air') {
          const k = 1 - Math.max(0, e.t) / 0.75;
          e.x = e.fx + (e.tx - e.fx) * k; e.y = e.fy + (e.ty - e.fy) * k; e.z = Math.sin(k * Math.PI) * 30;
          if (e.t <= 0) { e.z = 0; e.st = 'idle'; e.t = rr(1.2, 2); this.ring(e, d.ring || 8, 75, rnd() * 6, d.ring ? 'b' : 'r'); this.ev({ k: 'slam', x: e.x, y: e.y }); for (const p of this.alive()) if (Math.hypot(p.x - e.x, p.y - e.y) < 16) this.hurt(p, 1); }
        }
        break;
      case 'healer': {
        const away = dist < 110 ? 1 : -0.4;
        this.move(e, (-ux * away - uy * 0.4) * sp * dt, (-uy * away + ux * 0.4) * sp * dt, 'e');
        e.q = (e.q ?? 2) - dt; e.st = e.q < 0.5 ? 'wind' : 'idle';
        if (e.q <= 0) {
          e.q = 3.2;
          for (const o of this.enemies) if (o !== e && !o.dead && o.hp < o.max && Math.hypot(o.x - e.x, o.y - e.y) < 75) o.hp = Math.min(o.max, o.hp + o.max * (o.boss ? 0.04 : 0.3));
          this.ev({ k: 'healpulse', x: e.x, y: e.y });
        }
        break;
      }
      case 'hopper':
        if (e.st === 'idle' && e.t <= 0) { e.st = 'hop'; e.t = 0.45; e.lx = ux; e.ly = uy; }
        else if (e.st === 'hop') {
          this.move(e, e.lx * sp * (e.small ? 1.3 : 1) * dt, e.ly * sp * (e.small ? 1.3 : 1) * dt, 'e');
          e.z = Math.sin((1 - Math.max(0, e.t) / 0.45) * Math.PI) * 8;
          if (e.t <= 0) { e.z = 0; e.st = 'idle'; e.t = rr(0.5, 1.1); if (d.shoot) this.fan(e, tgt, 3, 0.3, 90, 'b'); }
        }
        break;
      case 'turret':
        if (e.st === 'idle' && e.t <= 0) { e.st = 'wind'; e.t = 0.55; }
        else if (e.st === 'wind' && e.t <= 0) { if (d.pattern === 'ring') this.ring(e, 10, 70, rnd() * 6, 'b'); else this.fan(e, tgt, 5, 0.22, 95, 'r'); e.st = 'idle'; e.t = rr(2.2, 3); this.ev({ k: 'spit', x: e.x, y: e.y }); }
        break;
      case 'ghost': {
        e.gt = (e.gt || 0) + dt;
        const hidden = e.gt % 4 > 2.6;
        e.under = hidden ? 1 : 0; e.hide = hidden ? 1 : 0;
        const side = Math.sin(e.age * 1.7);
        this.move(e, (ux * (dist > 60 ? 1 : -0.5) - uy * side) * sp * dt, (uy * (dist > 60 ? 1 : -0.5) + ux * side) * sp * dt, 'f');
        e.q = (e.q ?? 1) - dt;
        if (e.q <= 0 && !hidden) { e.q = 1.3; this.fan(e, tgt, 1, 0, 100, 'b'); }
        e.st = !hidden && e.q < 0.35 ? 'wind' : 'idle';
        break;
      }
      case 'wallcrawler':
        e.pp += sp * dt * e.dir; [e.x, e.y] = this.perimPt(e.pp);
        if (e.st === 'idle' && e.t <= 0) { e.st = 'wind'; e.t = 0.4; }
        else if (e.st === 'wind' && e.t <= 0) { this.fan(e, tgt, 1, 0, 95, 'b'); e.st = 'idle'; e.t = rr(1.3, 1.9); if (rnd() < 0.3) e.dir = -e.dir; }
        break;
      case 'teleport':
        if (e.st === 'idle' || e.st === 'gone') {
          e.st = 'gone'; e.under = 1; e.hide = 1;
          if (e.t <= 0) { const a = rnd() * TAU, r = rr(55, 85); [e.x, e.y] = this.freeSpot(tgt.x + Math.cos(a) * r, tgt.y + Math.sin(a) * r); e.st = 'appear'; e.t = 0.55; this.hazards.push({ k: 'tele', x: e.x, y: e.y, r: 9, t: 0, life: 0.55 }); }
        } else if (e.st === 'appear' && e.t <= 0) { e.st = 'up'; e.under = 0; e.hide = 0; e.t = 1.4; this.ring(e, 6, 70, rnd() * 6, 'b'); }
        else if (e.st === 'up' && e.t <= 0) { this.fan(e, tgt, 3, 0.25, 100, 'b'); e.st = 'gone'; e.t = rr(1, 1.8); }
        break;
      case 'dasher':
        if (e.st === 'idle') { this.move(e, ux * sp * dt, uy * sp * dt, 'e'); if (dist < 130 && e.t <= 0) { e.st = 'wind'; e.t = 0.45; e.n = 3; e.lx = ux; e.ly = uy; } }
        else if (e.st === 'wind' && e.t <= 0) { e.st = 'lunge'; e.t = 0.28; }
        else if (e.st === 'lunge') { this.move(e, e.lx * 230 * dt, e.ly * 230 * dt, 'e'); if (e.t <= 0 || e.hitWall) { e.n--; if (e.n > 0) { e.st = 'wind'; e.t = 0.25; e.lx = ux; e.ly = uy; } else { e.st = 'rest'; e.t = 1.1; } } }
        else if (e.st === 'rest' && e.t <= 0) { e.st = 'idle'; e.t = rr(0.5, 1); }
        break;
      case 'orbiter': {
        if (e.a === undefined) e.a = Math.atan2(-dy, -dx);
        e.a += dt * 0.9 * (e.id % 2 ? 1 : -1);
        const ox = tgt.x + Math.cos(e.a) * 75, oy = tgt.y + Math.sin(e.a) * 75, vx = ox - e.x, vy = oy - e.y, l = Math.hypot(vx, vy) || 1, s2 = Math.min(l * 3, sp);
        this.move(e, vx / l * s2 * dt, vy / l * s2 * dt, 'f');
        e.q = (e.q ?? 1.5) - dt; e.st = e.q < 0.4 ? 'wind' : 'idle';
        if (e.q <= 0) { e.q = 1.8; this.fan(e, tgt, 1, 0, 105, 'b'); }
        break;
      }
    }
  }

  // ---------- the six organs beyond the heart
  bossAI2(e, dt, tgt, ph, fast, alive, ux, uy, dx, dy) {
    switch (e.type) {
      case 'bileduke':
        if (e.st === 'idle') {
          this.moveToward(e, tgt, 16, dt);
          if (e.t <= 0) { e.st = pick(['spiral', 'rain', 'globs', 'spiral']); e.t = e.st === 'spiral' ? 2.4 : 0.6; e.a = rnd() * 6; this.ev({ k: 'tele', boss: 1 }); }
        } else if (e.st === 'spiral') {
          e.q = (e.q || 0) - dt;
          if (e.q <= 0) { e.q = fast ? 0.07 : 0.1; e.a += 0.33; for (let k = 0; k < 3; k++) this.ebullet(e.x, e.y, e.a + k * TAU / 3, 72, 'b'); }
          if (e.t <= 0) { e.st = 'idle'; e.t = fast ? 0.9 : 1.4; }
        } else if (e.st === 'rain' && e.t <= 0) {
          for (let i = 0; i < (fast ? 8 : 6); i++) { const p = pick(alive); this.hazards.push({ k: 'tele', x: clamp(p.x + rr(-60, 60), L + 10, Rx - 10), y: clamp(p.y + rr(-40, 40), T + 10, By - 10), r: 13, t: 0, life: 0.9 + i * 0.1, then: 'drip' }); }
          e.st = 'idle'; e.t = fast ? 1.4 : 2;
        } else if (e.st === 'globs' && e.t <= 0) {
          if (this.enemies.length < 7) for (const sx of [-1, 1]) this.addEnemy('bileblob', e.x + sx * 30, e.y + 10, { spawnT: 0.4 });
          this.ring(e, 12, 70, 0, 'b'); e.st = 'idle'; e.t = 1.6;
        }
        break;
      case 'twins': {
        const qx = tgt.x - e.cx, qy = tgt.y - e.cy, ql = Math.hypot(qx, qy) || 1;
        e.cx = clamp(e.cx + qx / ql * 14 * dt, L + 40, Rx - 40); e.cy = clamp(e.cy + qy / ql * 14 * dt, T + 34, By - 34);
        e.a = (e.a || 0) + dt * (fast ? 1.9 : 1.2);
        const R = e.st === 'pull' ? 12 : 30;
        e.x = e.cx + Math.cos(e.a) * R; e.y = e.cy + Math.sin(e.a) * R * 0.8;
        e.segs = [[e.cx - Math.cos(e.a) * R, e.cy - Math.sin(e.a) * R * 0.8]];
        if (e.st === 'idle' && e.t <= 0) { e.st = rnd() < 0.6 ? 'volley' : 'pull'; e.t = e.st === 'volley' ? 0.4 : 1.2; e.n = 4; this.ev({ k: 'tele', boss: 1 }); }
        else if (e.st === 'volley' && e.t <= 0) {
          const src = e.n % 2 ? { x: e.x, y: e.y } : { x: e.segs[0][0], y: e.segs[0][1] };
          this.fan(src, tgt, 3, 0.25, 110, 'r'); e.n--; e.t = 0.4;
          if (e.n <= 0) { e.st = 'idle'; e.t = fast ? 0.9 : 1.4; }
        } else if (e.st === 'pull' && e.t <= 0) {
          for (const src of [{ x: e.x, y: e.y }, { x: e.segs[0][0], y: e.segs[0][1] }]) this.ring(src, fast ? 14 : 10, 75, rnd() * 6, 'b');
          this.shake = 4; e.st = 'idle'; e.t = 1.2;
        }
        break;
      }
      case 'taster':
        e.x = CX + Math.sin(e.age * 0.55) * 90; e.y = OY + 60 + Math.sin(e.age * 1.1) * 5;
        if (e.st === 'idle' && e.t <= 0) { e.st = rnd() < 0.55 ? 'lick' : 'spit'; e.t = 0.5; this.ev({ k: 'tele', boss: 1 }); }
        else if (e.st === 'lick' && e.t <= 0) {
          const rows = [tgt.y]; if (fast) rows.push(clamp(tgt.y + (tgt.y < CY ? 40 : -40), T + 8, By - 8));
          for (const yy of rows) for (let x = L + 6; x < Rx - 4; x += 15) this.hazards.push({ k: 'tele', x, y: yy, r: 7, t: 0, life: 0.85, then: 'spike' });
          if (fast) for (let y = T + 6; y < By - 4; y += 15) this.hazards.push({ k: 'tele', x: tgt.x, y, r: 7, t: 0, life: 0.85, then: 'spike' });
          e.st = 'idle'; e.t = fast ? 1.4 : 1.9;
        } else if (e.st === 'spit' && e.t <= 0) { this.fan(e, tgt, fast ? 9 : 7, 0.18, 105, 'b'); this.ev({ k: 'spit', x: e.x, y: e.y }); e.st = 'idle'; e.t = fast ? 1.1 : 1.6; }
        break;
      case 'ganglion':
        if (e.st === 'idle' && e.t <= 0) {
          e.st = pick(['lines', 'lines', 'ring']); e.t = e.st === 'lines' ? 0.8 : 0.4;
          if (e.st === 'lines') { const a0 = Math.atan2(dy, dx); e.angs = fast ? [a0 - 0.7, a0 - 0.35, a0, a0 + 0.35, a0 + 0.7] : [a0 - 0.5, a0, a0 + 0.5]; for (const a of e.angs) this.hazards.push({ k: 'line', x: e.x, y: e.y, x2: e.x + Math.cos(a) * 400, y2: e.y + Math.sin(a) * 400, t: 0, life: 0.8 }); }
          this.ev({ k: 'tele', boss: 1 });
        } else if (e.st === 'lines' && e.t <= 0) { e.st = 'fire'; e.t = 0.6; e.q = 0; }
        else if (e.st === 'fire') {
          e.q -= dt; if (e.q <= 0) { e.q = 0.1; for (const a of e.angs) this.ebullet(e.x, e.y, a, 210, 'b', { r: 2.5 }); this.ev({ k: 'zap', pts: [[e.x, e.y], [e.x + Math.cos(e.angs[0]) * 60, e.y + Math.sin(e.angs[0]) * 60]] }); }
          if (e.t <= 0) { e.st = fast ? 'hop' : 'idle'; e.t = fast ? 0.5 : 1.3; if (fast) { [e.nx, e.ny] = this.freeSpot(rr(L + 40, Rx - 40), rr(T + 30, By - 30)); this.hazards.push({ k: 'tele', x: e.nx, y: e.ny, r: 18, t: 0, life: 0.5 }); } }
        } else if (e.st === 'hop' && e.t <= 0) { e.x = e.nx; e.y = e.ny; this.ring(e, 12, 80, rnd() * 6, 'b'); e.st = 'idle'; e.t = 1; }
        else if (e.st === 'ring' && e.t <= 0) { for (let k = 0; k < 2; k++) this.ring(e, 16, 70 + k * 18, k * 0.2, 'b'); e.st = 'idle'; e.t = 1.4; }
        break;
      case 'optic': {
        if (e.st === 'idle' && e.t <= 0) {
          e.st = pick(['aim', 'aim', 'tears', 'shut']); e.t = e.st === 'aim' ? 0.85 : e.st === 'shut' ? 0.8 : 0.4;
          if (e.st === 'aim') { e.a = Math.atan2(dy, dx); e.spin = (rnd() < 0.5 ? 1 : -1) * (fast ? 1.25 : 0.9); this.hazards.push({ k: 'line', x: e.x, y: e.y, x2: e.x + Math.cos(e.a) * 400, y2: e.y + Math.sin(e.a) * 400, t: 0, life: 0.85 }); }
          this.ev({ k: 'tele', boss: 1 });
        } else if (e.st === 'aim' && e.t <= 0) { e.st = 'beam'; e.t = 2.3; }
        else if (e.st === 'beam') {
          e.a += e.spin * dt; e.beamLen = 400;
          const cx = Math.cos(e.a), cy = Math.sin(e.a);
          for (const p of alive) { const px = p.x - e.x, py = p.y - 3 - e.y, along = px * cx + py * cy, off = Math.abs(px * cy - py * cx); if (along > 16 && off < 6 + p.r * 0.5) this.hurt(p, 1); }
          if (fast) { e.q = (e.q || 0) - dt; if (e.q <= 0) { e.q = 0.5; this.ring(e, 8, 60, rnd() * 6, 'b'); } }
          if (e.t <= 0) { e.st = 'idle'; e.t = 1.2; e.beamLen = 0; }
        } else if (e.st === 'tears' && e.t <= 0) { this.ring(e, 18, 70, rnd() * 6, 'b'); this.ring(e, 9, 45, 0.3, 'b'); e.st = 'idle'; e.t = 1.3; }
        else if (e.st === 'shut' && e.t <= 0) { this.fan(e, tgt, fast ? 11 : 9, 0.14, 120, 'r'); e.st = 'idle'; e.t = 1.3; }
        break;
      }
      case 'mind':
        if (e.st === 'idle') {
          e.x += Math.sin(e.age * 0.8) * 10 * dt; e.y += Math.cos(e.age * 0.6) * 8 * dt;
          if (e.t <= 0) { e.st = pick(['tp', 'psy', 'clones', 'mirror']); e.t = e.st === 'psy' ? 2.4 : 0.6; e.a = rnd() * 6; this.ev({ k: 'tele', boss: 1 }); if (e.st === 'tp') { let best = null; for (let i = 0; i < 8; i++) { const c = this.freeSpot(rr(L + 40, Rx - 40), rr(T + 30, By - 30)); if (alive.every(p => Math.hypot(p.x - c[0], p.y - c[1]) > 70)) { best = c; break; } } [e.nx, e.ny] = best || [CX, CY]; this.hazards.push({ k: 'tele', x: e.nx, y: e.ny, r: 20, t: 0, life: 0.6 }); } }
        } else if (e.st === 'tp' && e.t <= 0) { e.x = e.nx; e.y = e.ny; this.ring(e, fast ? 18 : 14, 75, rnd() * 6, 'r'); this.shake = 3; e.st = 'idle'; e.t = fast ? 0.7 : 1.1; }
        else if (e.st === 'psy') {
          e.q = (e.q || 0) - dt;
          if (e.q <= 0) { e.q = 0.09; e.a += 0.27; const arms = fast ? 4 : 3; for (let k = 0; k < arms; k++) this.ebullet(e.x, e.y, e.a + k * TAU / arms, 66, 'b'); }
          if (e.t <= 0) { e.st = fast ? 'tp' : 'idle'; e.t = 0.5; [e.nx, e.ny] = this.freeSpot(rr(L + 40, Rx - 40), rr(T + 30, By - 30)); if (fast) this.hazards.push({ k: 'tele', x: e.nx, y: e.ny, r: 20, t: 0, life: 0.5 }); }
        } else if (e.st === 'clones' && e.t <= 0) { if (this.enemies.length < 6) for (let i = 0; i < 2; i++) this.addEnemy('thought', e.x + rr(-40, 40), e.y + rr(-20, 30)); e.st = 'idle'; e.t = 1.2; }
        else if (e.st === 'mirror' && e.t <= 0) { e.n = (e.n || 4) - 1; this.fan(e, pick(alive), 5, 0.2, 115, 'r'); e.t = 0.35; if (e.n <= 0) { e.n = 4; e.st = 'idle'; e.t = 1.2; } }
        break;
    }
  }

  // ---------- bullets
  nearestEnemy(x, y, max) {
    let best = null, bd = max;
    for (const e of this.enemies) { if (e.dead || e.under || e.spawnT > 0) continue; const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; best = e; } }
    return best;
  }
  edgeSolid(x, y) { const c = this.tileAtPx(x, y); return c === '#' || c === 'D'; }
  bulletSolid(x, y) { const c = this.tileAtPx(x, y); return c === '#' || c === 'D' || c === 'o' || c === 't'; }
  updateBullets(dt) {
    const add = [];
    for (const b of this.bullets) {
      b.t += dt; b.life -= dt;
      if (!b.en) {
        const p = this.players[b.pl], st = p.st;
        if (st.homing) {
          const e = this.nearestEnemy(b.x, b.y, 150);
          if (e) { const want = Math.atan2(e.y - b.y, e.x - b.x); let a = Math.atan2(b.vy, b.vx); a += clamp(angDiff(want, a), -(2.6 + st.homing) * dt, (2.6 + st.homing) * dt); const sp = Math.hypot(b.vx, b.vy); b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; }
        }
        if (st.grow) { b.r = Math.min(7, b.r + dt * 4 * st.grow); b.dmg += b.dmg0 * 0.7 * dt * st.grow; }
        if (st.boomer && b.t > b.max * 0.4) {
          const qx = p.x - b.x, qy = p.y - 4 - b.y, l = Math.hypot(qx, qy) || 1;
          b.vx += (qx / l * st.shotSpeed * 1.2 - b.vx) * dt * 5; b.vy += (qy / l * st.shotSpeed * 1.2 - b.vy) * dt * 5;
          if (l < 8) b.life = 0;
          b.hit = b.hit.length > 6 ? [] : b.hit;
        }
        if (st.accel) { const sp = Math.hypot(b.vx, b.vy), k = Math.min(1 + st.accel * 1.4 * dt, 520 / Math.max(1, sp)); b.vx *= k; b.vy *= k; }
        if (st.wiggle) { const a = Math.atan2(b.vy, b.vx) + Math.cos(b.t * 18) * dt * 9 * Math.min(2, st.wiggle), sp = Math.hypot(b.vx, b.vy); b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; }
        if (st.eraser) for (const o of this.bullets) if (o.en && o.life > 0 && Math.hypot(o.x - b.x, o.y - b.y) < o.r + b.r + 2) { o.life = 0; this.ev({ k: 'splat', x: o.x, y: o.y, en: 1, kk: o.k }); }
        if (b.prism === 1 && b.t > 0.22) {
          b.prism = 2; b.dmg *= 0.6;
          for (const s of [-0.45, 0.45]) { const c = Math.cos(s), sn = Math.sin(s); add.push({ ...b, hit: b.hit.slice(), vx: b.vx * c - b.vy * sn, vy: b.vx * sn + b.vy * c }); }
        }
      }
      if (b.spin) { const a = Math.atan2(b.vy, b.vx) + b.spin * dt, sp = Math.hypot(b.vx, b.vy); b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; }
      if (b.en && b.curve) {
        const a = Math.atan2(b.vy, b.vx) + b.curve * dt, sp = Math.hypot(b.vx, b.vy); b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp;
      }
      const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
      if (b.phase || b.lob ? this.edgeSolid(nx, ny + 4) : this.bulletSolid(nx, ny + (b.en ? 0 : 4))) {
        if (!b.en && b.bounce > 0) {
          if (this.bulletSolid(nx, b.y + 4)) b.vx = -b.vx;
          if (this.bulletSolid(b.x, ny + 4)) b.vy = -b.vy;
          if (!this.bulletSolid(nx, b.y + 4) && !this.bulletSolid(b.x, ny + 4)) { b.vx = -b.vx; b.vy = -b.vy; }
          b.bounce--; this.ev({ k: 'bounce', x: b.x, y: b.y });
        } else {
          b.life = 0; this.ev({ k: 'splat', x: b.x, y: b.y, en: b.en ? 1 : 0, kk: b.k });
          const p = !b.en && this.players[b.pl];
          if (p && p.st.wallBurst && !b.shard) { const back = Math.atan2(-b.vy, -b.vx); for (let i = 0; i < 2 + p.st.wallBurst; i++) { const nb = this.pbullet(p, b.x - b.vx * dt * 2, b.y - b.vy * dt * 2, back + rr(-1, 1), p.st.shotSpeed * 0.8, b.dmg0 * 0.5, { life: 0.3, shard: 1, r: 1.5 }); this.bullets.pop(); add.push(nb); } }
          if (p && b.bomb) this.blast(p, b.x, b.y, b.dmg0);
        }
        continue;
      }
      b.x = nx; b.y = ny;
      if (b.en) {
        for (const p of this.players) {
          if (!p.present || p.down) continue;
          if (p.dashT > 0) continue; // dashing climbers pass straight through shots
          if (Math.hypot(p.x - b.x, p.y - 3 - b.y) < b.r + p.r - 1) { if (this.hurt(p, 1) || p.inv <= 0) b.life = 0; break; }
        }
      } else {
        for (const e of this.enemies) {
          if (e.dead || e.spawnT > 0 || e.under || e.z > 14 || b.hit.includes(e.id)) continue;
          let hit = Math.hypot(e.x - b.x, e.y - 2 - b.y) < e.r + b.r;
          if (!hit && e.segs) hit = e.segs.some(s => Math.hypot(s[0] - b.x, s[1] - b.y) < (e.segR || 7) + b.r);
          if (!hit) continue;
          b.hit.push(e.id);
          this.applyHit(e, b, add);
          if (b.pierce > 0) b.pierce--; else { b.life = 0; break; }
        }
      }
    }
    for (const b of this.bullets) if (b.lob === 2 && b.life <= 0 && !b.popped) { b.popped = 1; this.blast(this.players[b.pl], b.x, b.y + 4, b.dmg0 * 1.3); }
    for (const b of this.bullets) if (b.lob === 1 && b.life <= 0 && !b.popped) { b.popped = 1; const p = this.players[b.pl]; this.hazards.push({ k: 'vin', x: b.x, y: b.y + 4, r: 15, t: 0, life: 2.2, dmg: b.dmg0 * 2.3, pl: b.pl }); this.ev({ k: 'splat', x: b.x, y: b.y, en: 1, kk: 'b', big: 1 }); }
    for (const a of add) this.bullets.push(a);
    this.bullets = this.bullets.filter(b => b.life > 0 && b.x > OX - 8 && b.x < OX + RW * TILE + 8 && b.y > OY - 8 && b.y < OY + RH * TILE + 8);
  }
  applyHit(e, b, add) {
    const p = this.players[b.pl], st = p.st;
    let dmg = b.dmg, crit = false;
    if (st.crit && rnd() < st.crit + st.luck * 0.01) { dmg *= st.critMul; crit = true; }
    if (e.boss && st.bossDmg) dmg *= 1 + st.bossDmg;
    if (st.opener && !e['op' + p.id]) { e['op' + p.id] = 1; dmg *= 1 + st.opener; }
    if (st.finisher && e.hp < e.max * 0.5) dmg *= 1 + st.finisher;
    if (st.vamp && p.hp < st.maxhp && rnd() < st.vamp + st.luck * 0.003) { p.hp++; this.ev({ k: 'heal', p: p.id, x: p.x, y: p.y }); }
    if (st.slowHit) e.slowT = 1.2 + 0.6 * st.slowHit;
    if (b.bomb) { b.bomb = 0; this.blast(p, b.x, b.y, b.dmg0); }
    this.damage(e, dmg, p, { crit, kx: b.vx, ky: b.vy, kb: b.kb });
    if (b.psn) e.poison = { t: 3, dps: 1 + b.dmg0 * 0.35, p: p.id };
    if (st.execute && !e.boss && !e.dead && e.hp > 0 && e.hp < e.max * st.execute) { this.ev({ k: 'exec', x: e.x, y: e.y }); this.damage(e, e.hp + 1, p); }
    if (st.splash) for (const o of this.enemies) if (o !== e && !o.dead && !o.under && o.spawnT <= 0 && Math.hypot(o.x - e.x, o.y - e.y) < 24 + o.r) this.damage(o, dmg * 0.35 * st.splash, p);
    if (st.burn) e.burn = { t: 2.5, dps: (1.2 + b.dmg0 * 0.35) * st.burn, p: p.id };
    if (st.poison) e.poison = { t: 4, dps: (0.6 + b.dmg0 * 0.2) * st.poison, p: p.id };
    if (st.stun && !e.boss && rnd() < st.stun + st.luck * 0.01) e.stun = 1;
    if (st.chain && rnd() < 0.22 + 0.08 * st.chain + st.luck * 0.01) {
      const pts = [[e.x, e.y]];
      const near = this.enemies.filter(o => o !== e && !o.dead && !o.under && o.spawnT <= 0).sort((a, c) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(c.x - e.x, c.y - e.y)).slice(0, 1 + st.chain);
      for (const o of near) { if (Math.hypot(o.x - e.x, o.y - e.y) > 80) break; pts.push([o.x, o.y]); this.damage(o, dmg * 0.5, p); }
      if (pts.length > 1) this.ev({ k: 'zap', pts });
    }
    if (st.split && !b.shard) {
      const a = Math.atan2(b.vy, b.vx), sp = Math.hypot(b.vx, b.vy);
      for (const s of [-0.7, 0.7]) for (let i = 0; i < st.split; i++) add.push({ pl: b.pl, x: b.x, y: b.y, vx: Math.cos(a + s * (1 + i * 0.3)) * sp, vy: Math.sin(a + s * (1 + i * 0.3)) * sp, r: 2, dmg: b.dmg0 * 0.5, dmg0: b.dmg0 * 0.5, life: 0.35, max: 0.35, t: 0, pierce: 0, bounce: 0, k: 's', hit: [e.id], shard: 1, prism: 0 });
    }
  }

  blast(p, x, y, dmg) {
    this.ev({ k: 'boom', x, y, r: 28 }); this.shake = Math.max(this.shake, 3);
    for (const o of this.enemies) if (!o.dead && !o.under && o.spawnT <= 0 && Math.hypot(o.x - x, o.y - y) < 28 + o.r) this.damage(o, 4 + dmg * 1.5, p);
  }

  // ---------- the tutorial: two rooms in the mouth, one lesson at a time
  setupTutorial() {
    const wall = (doors, secretE) => {
      const g = [];
      for (let y = 0; y < RH; y++) { let row = ''; for (let x = 0; x < RW; x++) row += x === 0 || y === 0 || x === RW - 1 || y === RH - 1 ? '#' : '.'; g.push([...row]); }
      for (const d of doors) { const [x, y] = DOORS[d]; g[y][x] = 'D'; }
      g[2][3] = 'o'; g[8][15] = 'o'; g[2][15] = 't';
      return g.map(r => r.join(''));
    };
    const a = { gx: 4, gy: 4, key: '4,4', type: 'start', doors: {}, secret: { e: true }, tiles: wall([]), cleared: true, visited: true, drops: [] };
    const b = { gx: 5, gy: 4, key: '5,4', type: 'secret', doors: { w: true }, tiles: wall(['w']), cleared: true, visited: false, drops: [], active: 'pump' };
    this.floor = { fi: 0, seed: this.seed, rooms: [a, b] };
    this.tut = { step: -1, t: 0, x0: 0, y0: 0 };
    for (const p of this.players) { p.bombs = 0; p.active = null; p.charge = 0; }
    this.enterRoom(a, null);
    this.tutStep(0);
  }
  tutStep(n) {
    const T = this.tut, p = this.players[0];
    T.step = n; T.t = 0;
    const say = (title, text) => this.ev({ k: 'tut', step: n, title, text });
    if (n === 0) { T.x0 = p.x; T.y0 = p.y; say('Move', 'Walk around with W, A, S and D.'); }
    if (n === 1) { for (const [dx, dy] of [[-60, -40], [0, -50], [60, -40]]) this.addEnemy('grub', CX + dx, CY + dy, { dummy: 1, spawnT: 0.6, hp: 6, max: 6 }); say('Throw salt', 'Salt is the only thing the tower fears. Throw it with the arrow keys, or hold the mouse button. Clear the three grubs.'); }
    if (n === 2) { this.addEnemy('spitter', CX, OY + 40, { dummy: 2, spawnT: 0.6, hp: 9999, max: 9999, t: 1.5 }); p.dashes = 0; say('Dash', 'Press Space to dash. While you dash, nothing can hit you. Dash through the spit twice.'); }
    if (n === 3) { this.enemies = []; this.bullets = this.bullets.filter(b => !b.en); this.levelUp(); say('Level up', 'Every kill feeds your level. When the room is clear, keep one of three cards with 1, 2 or 3, or click one.'); }
    if (n === 4) { this.pickups.push({ kind: 'bomb', x: CX + 40, y: CY + 20, v: 1 }); say('Bombs', 'Pick up the bomb. The wall on the right is cracked: stand near it and press E, then step back.'); }
    if (n === 5) say('Secret room', 'Bombs open hidden rooms. Go through and grab the active item.');
    if (n === 6) { p.charge = 99; for (const [dx, dy] of [[-40, -20], [40, -20], [0, 30]]) this.addEnemy('grub', CX + dx, CY + dy, { dummy: 1, spawnT: 0.6, hp: 8, max: 8 }); say('Active items', 'Press Q to use your active item. Kills charge it back up.'); }
    if (n === 7) { this.enemies = []; this.valve = { x: CX, y: CY - 14 }; say('Up', 'That is everything. Climb the rope to start your first real climb. Esc pauses any time.'); }
  }
  tutorialTick(dt) {
    const T = this.tut, p = this.players[0];
    T.t += dt;
    if (T.step === 0 && Math.hypot(p.x - T.x0, p.y - T.y0) > 60) this.tutStep(1);
    else if (T.step === 1 && T.t > 1 && !this.enemies.length) this.tutStep(2);
    else if (T.step === 2 && (p.dashes || 0) >= 2) this.tutStep(3);
    else if (T.step === 3 && !p.offer && !p.pend && p.items.length) this.tutStep(4);
    else if (T.step === 4 && this.room.doors.e) this.tutStep(5);
    else if (T.step === 5 && p.active) this.tutStep(6);
    else if (T.step === 6 && T.t > 0.8 && (!this.enemies.length || p.charge < 6)) { if (!this.enemies.length) this.tutStep(7); }
    if (T.step === 4 && p.bombs === 0 && !this.pickups.some(k => k.kind === 'bomb') && !this.hazards.some(h => h.k === 'bomb') && !this.room.doors.e) this.pickups.push({ kind: 'bomb', x: CX + 40, y: CY + 20, v: 1 });
  }

  // ---------- bombs, actives, the shopkeeper
  explode(p, x, y) {
    this.ev({ k: 'boom', x, y, r: 34 }); this.ev({ k: 'bigboom' }); this.shake = Math.max(this.shake, 9);
    for (const e of this.enemies) if (!e.dead && !e.under && Math.hypot(e.x - x, e.y - y) < 34 + e.r) this.damage(e, 25 + this.fi * 5 + (p ? p.st.dmg * 2 : 0), p, { kx: e.x - x, ky: e.y - y });
    for (const q of this.alive()) if (Math.hypot(q.x - x, q.y - y) < 26) this.hurt(q, 1);
    // blast lumps and teeth out of the floor, and crack open secret walls
    const room = this.room, rows = room.tiles.map(r => [...r]);
    let changed = false;
    for (let ty = 1; ty < RH - 1; ty++) for (let tx = 1; tx < RW - 1; tx++) {
      if ((rows[ty][tx] === 'o' || rows[ty][tx] === 't') && Math.hypot(OX + tx * TILE + 8 - x, OY + ty * TILE + 8 - y) < 30) { rows[ty][tx] = '.'; changed = true; this.ev({ k: 'die', x: OX + tx * TILE + 8, y: OY + ty * TILE + 8, c: '#93394b' }); }
    }
    for (const d in room.secret || {}) {
      if (room.doors[d]) continue;
      const [tx, ty] = DOORS[d];
      if (Math.hypot(OX + tx * TILE + 8 - x, OY + ty * TILE + 8 - y) < 36) { rows[ty][tx] = 'D'; room.doors[d] = true; changed = true; this.ev({ k: 'secret' }); this.ev({ k: 'toast', text: 'A hidden passage!' }); }
    }
    if (changed) { room.tiles = rows.map(r => r.join('')); room.bgv = (room.bgv || 0) + 1; this.roomChanged = true; }
  }
  useActive(p) {
    const a = ACTIVE[p.active];
    if (!a || p.charge < a.charge || p.down) return;
    p.charge = 0;
    this.ev({ k: 'active', id: a.id, p: p.id, x: p.x, y: p.y });
    switch (a.id) {
      case 'pump': this.shake = 10; for (const e of this.enemies.slice()) if (!e.dead && !e.under) { this.ev({ k: 'boom', x: e.x, y: e.y, r: 16 }); this.damage(e, (e.boss ? 30 : 20) + this.fi * 4 + p.st.dmg * 2, p); } break;
      case 'icetray': for (const e of this.enemies) e.stun = e.boss ? 1.5 : 3; this.bullets = this.bullets.filter(b => !b.en); this.ev({ k: 'freeze' }); break;
      case 'gauze': p.hp = Math.min(p.st.maxhp, p.hp + 2); p.shields++; p.shieldUp = true; break;
      case 'saltlick': p.frenzy = 4; break;
      case 'smoke': p.inv = 2.5; break;
      case 'chicken': this.decoy = { x: p.x, y: p.y, t: 5, decoy: 1 }; break;
      case 'lodestone': { const F = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] }[p.face] || [0, 1]; this.hazards.push({ k: 'pull', x: clamp(p.x + F[0] * 50, L + 10, Rx - 10), y: clamp(p.y + F[1] * 50, T + 10, By - 10), t: 0, life: 0.7, pl: p.id }); break; }
      case 'spittoon': { let n = 0; for (const b of this.bullets) if (b.en && n < 20) { b.life = 0; if (n % 2 === 0) this.drop('teeth', b.x, b.y, 1); n++; } this.bullets = this.bullets.filter(b => b.life > 0); break; }
    }
  }
  say(text) { this.npcSay = { text, t: this.time }; }

  // ---------- hazards, pickups, orbitals, the walls
  updateHazards(dt) {
    for (const h of this.hazards) {
      h.t += dt;
      if (h.k === 'tele') {
        if (h.t >= h.life) {
          h.dead = 1;
          if (h.then === 'drip') { this.hazards.push({ k: 'zone', x: h.x, y: h.y, r: h.r, t: 0, life: 0.25 }); this.ring(h, 6, 55, rnd() * 6, 'b'); this.ev({ k: 'splat', x: h.x, y: h.y, en: 1, kk: 'b', big: 1 }); }
          if (h.then === 'spike') this.hazards.push({ k: 'spike', x: h.x, y: h.y, r: h.r, t: 0, life: 0.45 });
        }
      } else if (h.k === 'epool') {
        if (h.t > 0.4) for (const p of this.alive()) if (!p.st.acidproof && !p.st.flight && Math.hypot(p.x - h.x, p.y - h.y) < h.r + p.r - 3) this.hurt(p, 1);
        if (h.t >= h.life) h.dead = 1;
      } else if (h.k === 'zone' || h.k === 'spike') {
        for (const p of this.alive()) if (Math.hypot(p.x - h.x, p.y - h.y) < h.r + p.r - 2) this.hurt(p, 1);
        if (h.t >= h.life) h.dead = 1;
      } else if (h.k === 'fire' || h.k === 'vin') {
        for (const e of this.enemies) if (!e.dead && !e.under && !e.fireT && Math.hypot(e.x - h.x, e.y - h.y) < h.r + e.r) { e.fireT = 0.25; this.dot(e, h.dmg * 0.25, this.players[h.pl || 0]); e.flash = 0.05; }
        if (h.t >= h.life) h.dead = 1;
      } else if (h.k === 'bomb') {
        if (h.t >= h.life) { h.dead = 1; this.explode(this.players[h.pl], h.x, h.y); }
      } else if (h.k === 'pull') {
        for (const e of this.enemies) if (!e.dead && !e.boss && !e.under) { const qx = h.x - e.x, qy = h.y - e.y, l = Math.hypot(qx, qy) || 1; e.kx = qx / l * 160; e.ky = qy / l * 160; }
        if (h.t >= h.life) { h.dead = 1; const p = this.players[h.pl]; this.ev({ k: 'boom', x: h.x, y: h.y, r: 44 }); this.shake = 8; for (const e of this.enemies) if (!e.dead && !e.under && Math.hypot(e.x - h.x, e.y - h.y) < 44 + e.r) this.damage(e, 15 + p.st.dmg * 3, p); }
      } else if (h.k === 'bite') {
        if (!h.done && h.t >= 0.7) {
          h.done = 1; this.ev({ k: 'bite', x: h.x, y: h.y });
          for (const p of this.alive()) if (!p.st.biteproof && Math.abs(p.x - h.x) < h.w / 2 + p.r && Math.abs(p.y - h.y) < h.h / 2 + p.r) this.hurt(p, 1);
        }
        if (h.t >= 1.0) h.dead = 1;
      } else if (h.t >= h.life) h.dead = 1;
    }
    this.hazards = this.hazards.filter(h => !h.dead);
  }
  wallBites(dt) {
    if (this.room.cleared || this.room.type === 'boss') return;
    this.biteT -= dt;
    if (this.biteT > 0) return;
    this.biteT = rr(Math.max(1.6, 3.5 - this.fi * 0.25), Math.max(2.4, 6 - this.fi * 0.4));
    const cands = [];
    for (const p of this.alive()) {
      if (p.st.biteproof) continue;
      if (p.y < T + 20) cands.push({ side: 'n', x: p.x, y: T + 7, w: 26, h: 14 });
      if (p.y > By - 20) cands.push({ side: 's', x: p.x, y: By - 7, w: 26, h: 14 });
      if (p.x < L + 20) cands.push({ side: 'w', x: L + 7, y: p.y, w: 14, h: 26 });
      if (p.x > Rx - 20) cands.push({ side: 'e', x: Rx - 7, y: p.y, w: 14, h: 26 });
    }
    if (!cands.length) return;
    const c = pick(cands);
    this.hazards.push({ k: 'bite', ...c, t: 0, life: 1 });
    this.ev({ k: 'tele' });
  }
  updatePickups(dt) {
    for (const k of this.pickups) {
      k.t = (k.t || 0) + dt; if (k.toastT) k.toastT -= dt; if (k.swapT) k.swapT -= dt;
      for (const p of this.alive()) {
        const d = Math.hypot(p.x - k.x, p.y - k.y);
        if (p.st.magnet && !k.ped && k.kind !== 'item' && d < 100 && d > 1) { k.x += (p.x - k.x) / d * 130 * dt; k.y += (p.y - k.y) / d * 130 * dt; }
        if (d > p.r + 6 || k.taken) continue;
        if (k.kind === 'note') { k.taken = 1; this.room.note = 0; this.ev({ k: 'note', p: p.id }); continue; }
        if (k.kind === 'bomb' && !(k.price > 0)) { p.bombs += k.v || 1; k.taken = 1; this.ev({ k: 'pick', kind: 'bomb', x: k.x, y: k.y }); continue; }
        if (k.kind === 'item' || k.kind === 'cache' || k.kind === 'active' || k.kind === 'bomb') {
          if (k.kind === 'active' && k.swapT > 0) continue;
          if (k.price === 'heart') {
            if (p.st.maxhp > 2) { p.st.maxhp -= 2; p.hp = Math.min(p.hp, p.st.maxhp); this.ev({ k: 'feed', p: p.id }); this.takeItem(k, p); }
            else this.need(k, 'It wants a heart you can\'t spare');
          } else if (k.price > 0) {
            if (this.teeth >= k.price) { this.teeth -= k.price; this.ev({ k: 'buy' }); this.takeItem(k, p); if (this.room.type === 'shop') this.say(pick(SHOP_LINES.buy)); } else { if (!(k.toastT > 0) && this.room.type === 'shop') this.say(pick(SHOP_LINES.broke)); this.need(k, `Costs ${k.price} teeth`); }
          } else this.takeItem(k, p);
        } else if (k.kind === 'heart') {
          if (p.hp >= p.st.maxhp) continue;
          if (k.price > 0) { if (this.teeth < k.price) { this.need(k, `Costs ${k.price} teeth`); continue; } this.teeth -= k.price; this.room.shop[k.shop] = null; this.ev({ k: 'buy' }); }
          p.hp = Math.min(p.st.maxhp, p.hp + (k.v || 1) * p.st.healMul); k.taken = 1; this.ev({ k: 'pick', kind: 'heart', p: p.id, x: k.x, y: k.y });
        } else if (k.kind === 'teeth') { this.teeth += (k.v || 1) * p.st.teethMul; k.taken = 1; this.ev({ k: 'pick', kind: 'teeth', x: k.x, y: k.y }); }
        else if (k.kind === 'marrow') { this.marrow += k.v || 1; k.taken = 1; this.ev({ k: 'pick', kind: 'marrow', x: k.x, y: k.y }); }
      }
    }
    this.pickups = this.pickups.filter(k => !k.taken);
  }
  need(k, msg) { if (!(k.toastT > 0)) { k.toastT = 2.5; this.ev({ k: 'toast', text: msg }); } }
  takeItem(k, p) {
    k.taken = 1;
    if (k.shop !== undefined) this.room.shop[k.shop] = null;
    else if (k.ped && k.kind === 'cache') this.room.item = null;
    if (k.kind === 'cache') { this.ev({ k: 'cache', x: k.x, y: k.y }); this.levelUp(); }
    else if (k.kind === 'bomb') { p.bombs += k.v || 1; this.ev({ k: 'pick', kind: 'bomb', x: k.x, y: k.y }); }
    else if (k.kind === 'active') {
      if (k.apd) this.room.active = p.active || null;
      if (p.active) { this.pickups.push({ kind: 'active', id: p.active, x: k.x, y: k.y + (k.apd ? 0 : 14), ped: !!k.apd, apd: k.apd, swapT: 1.2 }); }
      p.active = k.id; p.charge = ACTIVE[k.id].charge; this.ev({ k: 'gotactive', id: k.id, p: p.id });
    }
    else this.giveItem(p, k.id);
    if (this.room.type === 'shop') this.stockShop();
  }
  updateOrbs(dt) {
    for (const p of this.alive()) {
      const n = p.st.orbit; if (!n) continue;
      for (let i = 0; i < n; i++) {
        const a = p.orbA + i * Math.PI * 2 / n, ox = p.x + Math.cos(a) * 20, oy = p.y - 4 + Math.sin(a) * 20;
        for (const e of this.enemies) if (!e.dead && !e.under && e.spawnT <= 0 && !e.orbT && Math.hypot(e.x - ox, e.y - oy) < e.r + 5) { e.orbT = 0.3; this.damage(e, (2.5 + p.st.dmg * 0.5) * p.st.orbitDmg, p); }
        for (const b of this.bullets) if (b.en && Math.hypot(b.x - ox, b.y - oy) < b.r + 4) b.life = 0;
      }
    }
  }

  // ---------- progress
  checkClear() {
    const room = this.room;
    if (room.cleared || this.enemies.length || this.roomT < 0.8) return;
    if (room.waves > 1) { room.waves--; this.roomT = 0; this.spawnEnemies(); this.ev({ k: 'toast', text: `Wave ${4 - room.waves} of 3` }); this.ev({ k: 'tele' }); return; }
    room.cleared = true;
    if (room.challenge) { room.challenge = 0; this.pickups.push({ kind: 'cache', x: CX - 16, y: CY }); this.drop('teeth', CX + 16, CY, 6); this.ev({ k: 'toast', text: 'Challenge beaten: a cache and a pile of teeth' }); }
    this.ev({ k: 'clear' });
    for (const p of this.players) if (p.present && p.down) { p.down = false; p.hp = 2; p.inv = 1.5; this.ev({ k: 'revive', p: p.id }); }
    for (const p of this.players) {
      if (!p.present || p.down) continue;
      if (p.st.capTeeth) this.teeth += 3 * p.st.capTeeth;
      if (p.st.interest) this.teeth += Math.min(10, Math.floor(this.teeth / 10)) * p.st.interest;
      if (!p.roomHit) p.streak = Math.min(5, p.streak + 1);
      if (p.st.clearHeal && p.hp < p.st.maxhp) { p.hp = Math.min(p.st.maxhp, p.hp + p.st.clearHeal); this.ev({ k: 'heal', p: p.id, x: p.x, y: p.y }); }
    }
    if (room.type === 'fight' && rnd() < 0.35 + this.luck() * 0.03) { if (rnd() < 0.15) this.drop('bomb', CX, CY, 1); else if (rnd() < 0.45) this.drop('heart', CX, CY, 2); else this.drop('teeth', CX, CY, 3); }
    this.hazards = this.hazards.filter(h => h.k === 'fire');
    this.wantSave = true; this.roomChanged = true;
  }
  checkExit() {
    if (!this.room.cleared) return;
    for (const p of this.alive()) {
      let dir = null;
      if (p.y < OY + 10) dir = 'n'; else if (p.y > OY + RH * TILE - 10) dir = 's'; else if (p.x < OX + 10) dir = 'w'; else if (p.x > OX + RW * TILE - 10) dir = 'e';
      if (dir && this.room.doors[dir]) {
        const [dx, dy] = DIRS[dir];
        const nr = this.roomAt(this.room.gx + dx, this.room.gy + dy);
        if (nr) { this.enterRoom(nr, dir); this.ev({ k: 'door' }); return; }
      }
    }
  }
  checkValve() {
    if (!this.valve) return;
    for (const p of this.alive()) if (Math.hypot(p.x - this.valve.x, p.y - this.valve.y) < 10) { if (this.tut) { this.state = 'tutdone'; this.ev({ k: 'tutdone' }); return; } this.nextFloor(); return; }
  }
  nextFloor() {
    this.loadFloor(this.fi + 1);
    for (const p of this.players) { p.revives = p.st.revive; if (!p.present) continue; if (p.down) { p.down = false; p.hp = 2; } else p.hp = Math.min(p.st.maxhp, p.hp + 2); }
    this.room.drops = [];
    this.enterRoom(this.room, null);
    this.ev({ k: 'floor', fi: this.fi });
  }
  score() { return this.fi * 1000 + this.bosses * 500 + this.kills * 5 + (this.state === 'won' ? 3000 : 0); }

  // ---------- networking (host side)
  roomMsg() {
    const r = this.room;
    return { t: 'room', fi: this.fi, room: { key: r.key, tiles: r.tiles, type: r.type, cleared: r.cleared, doors: r.doors, gx: r.gx, gy: r.gy, secret: r.secret, bgv: r.bgv || 0, dark: r.dark, waves: r.waves }, map: this.mapData() };
  }
  snap() {
    const r1 = v => Math.round(v * 10) / 10;
    return {
      t: 's', tm: r1(this.time), te: this.teeth, xp: this.xp, nd: this.xpNeed(), lv: this.level, en: this.enemies.length, ma: this.marrow, cl: this.room.cleared ? 1 : 0, st: this.state, sh: r1(this.shake), rt: r1(this.roomT),
      P: this.players.map(p => ({ x: r1(p.x), y: r1(p.y), hp: p.hp, mh: p.st.maxhp, ob: p.st.orbit, inv: r1(p.inv), dn: p.down ? 1 : 0, f: p.face, mv: p.moving ? 1 : 0, an: r1(p.anim), da: p.dashT > 0 ? 1 : 0, pr: p.present ? 1 : 0, sh: p.shieldUp ? 1 : 0, au: p.st.aura, bd: p.st.buddy, wp: p.weapon, chr: p.char, lk: p.look, bm: p.bombs, ac: p.active, cg: p.charge, fr: p.frenzy > 0 ? 1 : 0, oa: r1(p.orbA), it: p.items, pd: p.pend, of: p.offer })),
      E: this.enemies.map(e => ({ id: e.id, ty: e.type, x: r1(e.x), y: r1(e.y), r: e.r, fl: e.flash > 0 ? 1 : 0, hp: r1(e.hp), mx: r1(e.max), s: e.st, b: e.boss ? 1 : 0, sp: r1(e.spawnT), z: r1(e.z || 0),
        sg: e.segs ? e.segs.map(s => [r1(s[0]), r1(s[1])]) : undefined, pu: r1(e.pulse || 0), br: r1(e.br || 0), a: r1(e.a || 0), ag: r1(e.age), sm: e.small ? 1 : 0, el: e.elite ? 1 : 0, u: e.under ? 1 : 0, hd: e.hide ? 1 : 0, sr: e.segR, ln: e.beamLen, t: r1(e.t), bu: e.burn ? 1 : 0, po: e.poison ? 1 : 0 })),
      B: this.bullets.flatMap(b => [r1(b.x), r1(b.y), Math.round(b.vx), Math.round(b.vy), r1(b.r), b.k, b.en ? 1 : 0]),
      K: this.pickups.map(k => ({ kind: k.kind, id: k.id, x: r1(k.x), y: r1(k.y), price: k.price, v: k.v })),
      H: this.hazards.map(h => ({ k: h.k, pl: h.pl, x: r1(h.x), y: r1(h.y), r: h.r, t: r1(h.t), life: h.life, x2: h.x2, y2: h.y2, w: h.w, h: h.h, side: h.side })),
      V: this.valve, DC: this.decoy ? { x: Math.round(this.decoy.x), y: Math.round(this.decoy.y) } : null, NS: this.npcSay, WV: this.room.waves,
    };
  }
}
