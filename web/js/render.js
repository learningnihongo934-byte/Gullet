// Gullet renderer. Draws a "view" (the host's Game, or the guest's mirror of it) at 320x196 pixels.
import { TILE, RW, RH, OX, OY, W, H, CX, CY, FLOORS, BOSSES, ITEM } from './data.js';
import { SPR, floorArt, bosses, text, whiteOf, blob } from './sprites.js';
import { mulberry32 } from './gen.js';

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rnd = Math.random, rr = (a, b) => a + rnd() * (b - a);
const hash = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const WIND = new Set(['wind', 'crouch', 'aim', 'rise']);

function dotSprite(r, fill, edge, hi) {
  const s = Math.ceil(r) * 2 + 3, c = mk(s, s), x = c.getContext('2d'), m = s / 2;
  for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) {
    const d = Math.hypot(i + 0.5 - m, j + 0.5 - m);
    if (d > r + 0.6) continue;
    x.fillStyle = d > r - 0.5 ? edge : (i + 0.5 - m < -r * 0.2 && j + 0.5 - m < -r * 0.2 ? hi : fill);
    x.fillRect(i, j, 1, 1);
  }
  return c;
}
const BCOL = { s: ['#f6ecd9', '#5a4a52', '#ffffff'], S: ['#f6ecd9', '#5a4a52', '#ffffff'], b: ['#c8d44a', '#3a3a10', '#f0f4a0'], r: ['#d8304a', '#3a0810', '#ff9aa8'], n: ['#e8dcc0', '#3a2a1a', '#ffffff'] };

export class Renderer {
  constructor(canvas) {
    this.c = canvas; this.x = canvas.getContext('2d'); this.x.imageSmoothingEnabled = false;
    this.bg = new Map(); this.decals = new Map(); this.parts = []; this.ghosts = [[], []]; this.t = 0;
    this.dots = new Map(); this.whites = new WeakMap(); this.hurtT = 0; this.clearT = new Map();
    this.vig = this.makeVignette();
  }
  white(img) { let w = this.whites.get(img); if (!w) { w = whiteOf(img); this.whites.set(img, w); } return w; }
  dot(k, r) {
    const key = k + Math.round(r * 2);
    let d = this.dots.get(key);
    if (!d) { const c = BCOL[k] || BCOL.b; d = dotSprite(Math.round(r * 2) / 2, c[0], c[1], c[2]); this.dots.set(key, d); }
    return d;
  }
  makeVignette() {
    const c = mk(W, H), x = c.getContext('2d');
    const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    x.fillStyle = '#0c0206';
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const dx = (i - W / 2) / (W / 2), dy = (j - H / 2 - 8) / (H / 2);
      const v = Math.max(0, Math.hypot(dx * 0.9, dy) - 0.82) * 2.4;
      if (v * 16 > BAY[(j & 3) * 4 + (i & 3)]) x.fillRect(i, j, 1, 1);
    }
    return c;
  }

  // ---------- room background
  roomCanvas(fi, room) {
    const key = fi + ':' + room.key;
    let c = this.bg.get(key);
    if (c) return c;
    const F = FLOORS[fi], P = F.pal, A = floorArt(fi, F), R = mulberry32(hash(key));
    c = mk(RW * TILE, RH * TILE);
    const x = c.getContext('2d');
    const tiles = room.tiles, at = (tx, ty) => (tiles[ty] || '')[tx] || '#';
    x.fillStyle = P.floor; x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 70; i++) { x.fillStyle = P.floor2; const r = 2 + R() * 6, cx = R() * c.width, cy = R() * c.height; for (let a = 0; a < r * r * 2; a++) { const px = cx + (R() - 0.5) * r * 2, py = cy + (R() - 0.5) * r * 1.4; x.fillRect(px | 0, py | 0, 1, 1); } }
    x.fillStyle = P.speck; for (let i = 0; i < 260; i++) x.fillRect((R() * c.width) | 0, (R() * c.height) | 0, 1, 1);
    x.fillStyle = P.vein;
    for (let v = 0; v < 5; v++) { let px = R() * c.width, py = R() * c.height, a = R() * 6; for (let s = 0; s < 70; s++) { a += (R() - 0.5) * 0.8; px += Math.cos(a); py += Math.sin(a); x.fillRect(px | 0, py | 0, 1, 1); if (R() < 0.04) { x.fillRect((px + 1) | 0, py | 0, 1, 1); } } }
    // acid pools
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) if (at(tx, ty) === '~') {
      const l = tx * TILE, t = ty * TILE;
      const eL = at(tx - 1, ty) !== '~', eR = at(tx + 1, ty) !== '~', eT = at(tx, ty - 1) !== '~', eB = at(tx, ty + 1) !== '~';
      // rim of eaten-away flesh, then the acid, with rounded outer corners and a dark lip at the far edge
      for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
        const dl = eL ? i : 99, dr = eR ? 15 - i : 99, dt = eT ? j : 99, db = eB ? 15 - j : 99;
        const edge = Math.min(dl, dr, dt, db), corner = Math.min(dl, dr) + Math.min(dt, db);
        if (edge < 1 || corner < 3) continue;
        x.fillStyle = edge < 2 || corner < 5 ? '#3a1a10' : (dt < 4 || (db < 4 && R() < 0.5)) ? '#6e7a1e' : P.acid;
        x.fillRect(l + i, t + j, 1, 1);
      }
    }
    // walls
    x.fillStyle = P.wall; x.fillRect(0, 0, c.width, TILE); x.fillRect(0, c.height - TILE, c.width, TILE); x.fillRect(0, 0, TILE, c.height); x.fillRect(c.width - TILE, 0, TILE, c.height);
    x.fillStyle = P.wall2;
    for (let i = 0; i < c.width; i++) for (let j = 0; j < TILE; j++) {
      if ((i + j * 3) % 7 === 0 && j % 4 !== 3) { x.fillRect(i, j, 1, 1); x.fillRect(i, c.height - 1 - j, 1, 1); }
    }
    for (let j = 0; j < c.height; j++) for (let i = 0; i < TILE; i++) if ((j + i * 3) % 7 === 0 && i % 4 !== 3) { x.fillRect(i, j, 1, 1); x.fillRect(c.width - 1 - i, j, 1, 1); }
    // gums along the inner edge, teeth hanging from the top wall and rising from the bottom
    x.fillStyle = P.gum;
    x.fillRect(TILE - 3, TILE - 3, c.width - 2 * TILE + 6, 3); x.fillRect(TILE - 3, c.height - TILE, c.width - 2 * TILE + 6, 3);
    x.fillRect(TILE - 3, TILE - 3, 3, c.height - 2 * TILE + 6); x.fillRect(c.width - TILE, TILE - 3, 3, c.height - 2 * TILE + 6);
    const tooth = (tx, ty, dir) => {
      x.fillStyle = '#1b0d12'; x.fillRect(tx - 2, ty, 5, dir * 5 > 0 ? 5 : -5);
      x.fillStyle = '#f6ecd9';
      for (let k = 0; k < 4; k++) { const w = 3 - Math.floor(k * 0.7); x.fillRect(tx - Math.floor(w / 2), ty + dir * k, w, 1); }
      x.fillStyle = '#c9b8a0'; x.fillRect(tx + 1, ty, 1, 1);
    };
    const doorAt = (px, py) => at(Math.floor(px / TILE), Math.floor(py / TILE)) === 'D';
    for (let i = TILE + 4; i < c.width - TILE - 2; i += 8) {
      if (!doorAt(i, 4)) tooth(i, TILE, 1);
      if (!doorAt(i, c.height - 4) && (i / 8) % 2 < 1) tooth(i, c.height - TILE - 1, -1);
    }
    // doorway frames
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) if (at(tx, ty) === 'D') {
      x.fillStyle = P.wall; x.fillRect(tx * TILE - 2, ty * TILE - 2, 20, 20);
      x.fillStyle = P.gum; x.fillRect(tx * TILE, ty * TILE, 16, 16);
    }
    // lumps, teeth
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) {
      const ch = at(tx, ty);
      if (ch === 'o') { x.fillStyle = 'rgba(20,4,8,0.45)'; x.fillRect(tx * TILE + 2, ty * TILE + 12, 13, 4); x.drawImage(R() < 0.5 ? A.lump : A.lump2, tx * TILE, ty * TILE); }
      if (ch === 't') { x.fillStyle = 'rgba(20,4,8,0.45)'; x.fillRect(tx * TILE + 3, ty * TILE + 12, 11, 4); x.drawImage(SPR.tooth.c, tx * TILE, ty * TILE); }
    }
    if (room.type === 'start' && fi === 0) {
      text(x, 'WASD  MOVE', 152, 52, P.speck, null, 'center');
      text(x, 'ARROWS / MOUSE  THROW SALT', 152, 62, P.speck, null, 'center');
      text(x, 'SPACE  DASH (YOU DODGE THROUGH HITS)', 152, 72, P.speck, null, 'center');
      text(x, 'CLIMB TO THE HEART', 152, 112, P.speck, null, 'center');
    }
    if (room.type === 'start' && fi > 0) text(x, 'PLATE ' + F.plate + '  ' + F.name, 152, 60, P.speck, null, 'center');
    this.bg.set(key, c);
    if (this.bg.size > 60) this.bg.delete(this.bg.keys().next().value);
    return c;
  }
  decal(fi, room) {
    const key = fi + ':' + room.key;
    let d = this.decals.get(key);
    if (!d) { d = mk(RW * TILE, RH * TILE); this.decals.set(key, d); if (this.decals.size > 60) this.decals.delete(this.decals.keys().next().value); }
    return d;
  }
  splat(view, x, y, col, size = 1) {
    if (!view.room) return;
    const d = this.decal(view.fi, view.room), g = d.getContext('2d');
    g.fillStyle = col; g.globalAlpha = 0.55;
    const n = 14 * size;
    for (let i = 0; i < n; i++) { const a = rnd() * 6.28, r = rnd() * 5 * size; g.fillRect((x - OX + Math.cos(a) * r) | 0, (y - OY + Math.sin(a) * r * 0.7) | 0, 1 + (rnd() < 0.4 ? 1 : 0), 1); }
    g.globalAlpha = 1;
  }

  // ---------- events -> particles
  fx(view, e) {
    const P = (x, y, c, n, sp = 60, life = 0.35, size = 1) => { for (let i = 0; i < n; i++) { const a = rnd() * 6.28, s = rr(sp * 0.3, sp); this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c, life: rr(life * 0.6, life), max: life, size }); } };
    switch (e.k) {
      case 'hit': P(e.x, e.y - 2, e.c, e.crit ? 8 : 4, 70); if (e.crit) P(e.x, e.y - 6, '#f2d15c', 5, 50); break;
      case 'die': P(e.x, e.y, e.c, 14, 90, 0.45); this.splat(view, e.x, e.y, e.c, 1); break;
      case 'splat': P(e.x, e.y, e.en ? (e.kk === 'r' ? '#d8304a' : e.kk === 'n' ? '#e8dcc0' : '#c8d44a') : '#f6ecd9', e.big ? 10 : 3, e.big ? 70 : 40, 0.25); if (e.big) this.splat(view, e.x, e.y, '#bcd04a', 1.2); break;
      case 'hurt': P(e.x, e.y - 4, '#d8304a', 10, 80, 0.4); if (e.p === view.me) this.hurtT = 0.3; break;
      case 'shield': P(e.x, e.y - 4, '#9ad8dc', 12, 70, 0.4); break;
      case 'boom': P(e.x, e.y, '#e8873a', 18, 110, 0.4); P(e.x, e.y, '#f2d15c', 10, 70, 0.3); this.parts.push({ ring: 1, x: e.x, y: e.y, r: e.r, life: 0.2, max: 0.2, c: '#f2d15c' }); break;
      case 'zap': this.parts.push({ zap: e.pts, life: 0.14, max: 0.14 }); break;
      case 'pick': P(e.x, e.y, e.kind === 'heart' ? '#e58494' : e.kind === 'marrow' ? '#e8873a' : '#f6ecd9', 6, 40, 0.3); break;
      case 'bossdie': for (let i = 0; i < 4; i++) P(e.x + rr(-20, 20), e.y + rr(-20, 20), i % 2 ? '#e0607a' : '#f2d15c', 20, 140, 0.8, 2); this.splat(view, e.x, e.y, '#8a1424', 3); break;
      case 'slam': P(e.x, e.y + 6, '#c9b8a0', 16, 90, 0.4); break;
      case 'revive': { const p = view.players[e.p]; if (p) P(p.x, p.y - 4, '#f6ecd9', 16, 60, 0.6); break; }
      case 'heal': P(e.x, e.y - 6, '#e58494', 8, 40, 0.5); break;
    }
  }

  // ---------- main draw
  draw(view, dt) {
    this.t += dt;
    const x = this.x, F = FLOORS[view.fi], P = F.pal;
    x.fillStyle = '#120408'; x.fillRect(0, 0, W, H);
    if (!view.room) return;
    const shk = view.shake || 0, sx = shk ? Math.round(rr(-shk, shk) * 0.5) : 0, sy = shk ? Math.round(rr(-shk, shk) * 0.5) : 0;
    x.save(); x.translate(sx, sy);
    x.drawImage(this.roomCanvas(view.fi, view.room), OX, OY);
    x.drawImage(this.decal(view.fi, view.room), OX, OY);
    this.drawAcid(view, P);
    this.drawDoors(view, P);
    for (const h of view.hazards) this.drawHazard(h, P);
    if (view.valve) this.drawValve(view.valve);
    for (const k of view.pickups) this.drawPickup(k, view);
    const ents = [];
    for (const p of view.players) if (p.present) ents.push({ y: p.y, p });
    for (const e of view.enemies) ents.push({ y: e.y + (e.boss ? 6 : 0), e });
    ents.sort((a, b) => a.y - b.y);
    for (const en of ents) if (en.e && !en.e.under) this.shadow(en.e.x, en.e.y + (en.e.boss ? en.e.r * 0.6 : 5), en.e.r * (en.e.boss ? 1.1 : 0.9) * (1 - Math.min(0.6, (en.e.z || 0) / 60)));
    for (const en of ents) if (en.p) this.shadow(en.p.x, en.p.y + 3, 5);
    for (const en of ents) { if (en.p) this.drawPlayer(en.p, view); else this.drawEnemy(en.e, view); }
    for (const b of view.bullets) {
      const img = this.dot(b.k, b.r);
      if (!b.en && b.k !== 'n') this.shadow(b.x, b.y + 6, 2);
      if (b.k === 'n') { x.fillStyle = '#1b0d12'; x.fillRect(Math.round(b.x) - 2, Math.round(b.y) - 2, 5, 5); x.fillStyle = '#e8dcc0'; const a = (this.t * 12) % 2 < 1; x.fillRect(Math.round(b.x) - (a ? 2 : 0), Math.round(b.y) - (a ? 0 : 2), a ? 4 : 1, a ? 1 : 4); x.fillRect(Math.round(b.x) - (a ? 0 : 1), Math.round(b.y) - (a ? 1 : 0), a ? 1 : 3, a ? 3 : 1); }
      else x.drawImage(img, Math.round(b.x - img.width / 2), Math.round(b.y - img.height / 2));
    }
    this.drawParts(dt);
    x.restore();
    x.drawImage(this.vig, 0, 0);
    // living walls: a faint pulse that gets stronger near the heart
    const pulse = (Math.sin(this.t * (2 + view.fi * 0.5)) + 1) / 2;
    x.fillStyle = `rgba(120,10,30,${0.02 + pulse * 0.025 * (1 + view.fi * 0.4)})`; x.fillRect(OX, OY, RW * TILE, RH * TILE);
    if (this.hurtT > 0) { this.hurtT -= dt; x.fillStyle = `rgba(200,20,40,${this.hurtT})`; x.fillRect(0, 0, W, 3); x.fillRect(0, H - 3, W, 3); x.fillRect(0, 0, 3, H); x.fillRect(W - 3, 0, 3, H); }
    const me = view.players[view.me];
    if (me && me.present && !me.down && me.hp <= 2) { const a = (Math.sin(this.t * 6) + 1) * 0.08; x.fillStyle = `rgba(200,20,40,${a})`; x.fillRect(0, OY, W, H - OY); }
    this.drawHUD(view, F);
    this.drawMap(view);
    const boss = view.enemies.find(e => e.boss);
    if (boss) this.drawBossBar(boss);
    if (view.roomT < 0.22) { x.fillStyle = `rgba(18,4,8,${1 - view.roomT / 0.22})`; x.fillRect(0, OY, W, H - OY); }
  }

  shadow(x0, y0, r) {
    const x = this.x; x.fillStyle = 'rgba(20,4,8,0.38)';
    const rw = Math.max(2, Math.round(r)), rh = Math.max(1, Math.round(r * 0.4));
    for (let j = -rh; j <= rh; j++) { const w = Math.round(rw * Math.sqrt(1 - (j / (rh + 0.5)) ** 2)); x.fillRect(Math.round(x0) - w, Math.round(y0) + j, w * 2, 1); }
  }
  drawAcid(view, P) {
    const x = this.x, tiles = view.room.tiles;
    for (let ty = 1; ty < RH - 1; ty++) for (let tx = 1; tx < RW - 1; tx++) if (tiles[ty][tx] === '~') {
      for (let i = 0; i < 2; i++) {
        const ph = (this.t * 0.8 + (tx * 7 + ty * 13 + i * 0.5) * 0.37) % 1;
        const bx = OX + tx * TILE + 3 + ((tx * 5 + ty * 3 + i * 7) % 10), by = OY + ty * TILE + 4 + ((tx * 3 + ty * 7 + i * 5) % 8);
        x.fillStyle = ph < 0.8 ? '#f0f4a0' : '#20240a';
        const s = ph < 0.8 ? Math.floor(ph * 3) : 1;
        x.fillRect(bx, by, s + 1, s + 1);
      }
    }
  }
  drawDoors(view, P) {
    const x = this.x, tiles = view.room.tiles, open = view.room.cleared;
    const k = view.room.key;
    if (open && !this.clearT.has(k)) this.clearT.set(k, this.t);
    if (!open) this.clearT.delete(k);
    const prog = open ? Math.min(1, (this.t - this.clearT.get(k)) / 0.35) : 0;
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) if (tiles[ty][tx] === 'D') {
      const cx = OX + tx * TILE + 8, cy = OY + ty * TILE + 8;
      x.fillStyle = P.wall2; x.fillRect(cx - 7, cy - 7, 14, 14);
      const r = 1 + prog * 5.5;
      x.fillStyle = '#0c0206';
      for (let j = -Math.ceil(r); j <= Math.ceil(r); j++) { const w = Math.round(Math.sqrt(Math.max(0, r * r - j * j))); x.fillRect(cx - w, cy + j, w * 2, 1); }
      if (prog < 1) { x.fillStyle = P.wall; for (let a = 0; a < 8; a++) { const ang = a * Math.PI / 4 + 0.3; for (let s = r; s < 7; s++) x.fillRect(Math.round(cx + Math.cos(ang) * s), Math.round(cy + Math.sin(ang) * s), 1, 1); } }
    }
  }
  drawValve(v) {
    const x = this.x, t = this.t;
    x.fillStyle = '#0c0206';
    for (let j = -9; j <= 9; j++) { const w = Math.round(Math.sqrt(Math.max(0, 81 - j * j)) * 1.2); x.fillRect(v.x - w, v.y + j, w * 2, 1); }
    x.fillStyle = '#c45a70';
    for (let a = 0; a < 20; a++) { const ang = a / 20 * Math.PI * 2; x.fillRect(Math.round(v.x + Math.cos(ang) * 11), Math.round(v.y + Math.sin(ang) * 9.5), 2, 1); }
    // a rope hangs from the opening above: climb it
    const sway = Math.sin(t * 2) * 2;
    for (let y = -40; y < 6; y++) { x.fillStyle = (y & 3) === 0 ? '#4e3020' : '#8a5a3a'; x.fillRect(Math.round(v.x + sway * (y + 40) / 46), v.y + y, 2, 1); }
    text(x, 'UP', v.x, v.y + 14 + Math.round(Math.sin(t * 4)), '#f6ecd9', '#1b0d12', 'center');
  }
  drawPickup(k, view) {
    const x = this.x, bob = Math.round(Math.sin(this.t * 3 + k.x) * 1.5);
    if (k.kind === 'item' || (k.kind === 'cache' && k.ped)) {
      const it = k.kind === 'cache' ? null : SPR['i_' + k.id];
      const feed = k.price === 'heart';
      // pedestal: a fleshy stump, or a mouth for the feeding altar
      this.shadow(k.x, k.y + 6, 7);
      x.fillStyle = '#1b0d12'; x.fillRect(k.x - 7, k.y - 1, 14, 8);
      x.fillStyle = feed ? '#6e1424' : '#a84a5c'; x.fillRect(k.x - 6, k.y, 12, 6);
      x.fillStyle = feed ? '#c02a3e' : '#e58494'; x.fillRect(k.x - 6, k.y, 12, 1);
      if (feed) { x.fillStyle = '#f6ecd9'; for (let i = -5; i < 6; i += 2) x.fillRect(k.x + i, k.y + 1, 1, 2); }
      if (it) x.drawImage(it.c, k.x - 6, k.y - 16 + bob);
      if (k.kind === 'cache') this.drawCache(k.x, k.y - 11 + bob);
      if (k.price === 'heart') { x.drawImage(SPR.heart.c, k.x - 8, k.y + 9); text(x, '-1', k.x + 1, k.y + 10, '#f6ecd9'); }
      else if (k.price > 0) { x.drawImage(SPR.tooth.c, k.x - 9, k.y + 9); text(x, k.price, k.x + 1, k.y + 10, view.teeth >= k.price ? '#f6ecd9' : '#e58494'); }
      return;
    }
    this.shadow(k.x, k.y + 4, 3);
    if (k.kind === 'heart') {
      x.drawImage(SPR.heart.c, k.x - 3, k.y - 4 + bob);
      if ((k.v || 1) === 1) { x.drawImage(SPR.heartE.c, 4, 0, 3, 6, k.x + 1, k.y - 4 + bob, 3, 6); }
      if (k.price > 0) { x.drawImage(SPR.tooth.c, k.x - 9, k.y + 9); text(x, k.price, k.x + 1, k.y + 10, view.teeth >= k.price ? '#f6ecd9' : '#e58494'); }
    } else if (k.kind === 'teeth') x.drawImage(SPR.tooth.c, k.x - 3, k.y - 5 + bob);
    else if (k.kind === 'marrow') x.drawImage(SPR.marrow.c, k.x - 4, k.y - 3 + bob);
    else if (k.kind === 'cache') this.drawCache(k.x, k.y - 4 + bob);
  }
  drawCache(cx, cy) {
    const x = this.x, t = this.t;
    x.fillStyle = (t * 6) % 2 < 1 ? '#f2d15c' : '#e8873a';
    for (let a = 0; a < 10; a++) { const ang = a / 10 * Math.PI * 2 + t * 1.5, r = 8 + Math.sin(t * 4) * 1.5; x.fillRect(Math.round(cx + Math.cos(ang) * r), Math.round(cy + Math.sin(ang) * r * 0.8), 1, 1); }
    x.drawImage(SPR.cache.c, Math.round(cx - 5), Math.round(cy - 5));
  }
  drawHazard(h, P) {
    const x = this.x, t = this.t;
    if (h.k === 'tele') {
      const k = Math.min(1, h.t / h.life);
      x.fillStyle = `rgba(255,80,90,${0.12 + k * 0.25})`;
      const r = h.r;
      for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(Math.max(0, r * r - j * j))); x.fillRect(Math.round(h.x) - w, Math.round(h.y + j * 0.7), w * 2, 1); }
      x.fillStyle = (t * 16) % 2 < 1 ? '#ff5a64' : '#f6ecd9';
      for (let a = 0; a < 16; a++) { const ang = a / 16 * Math.PI * 2 + t * 2; x.fillRect(Math.round(h.x + Math.cos(ang) * r * (1.1 - k * 0.1)), Math.round(h.y + Math.sin(ang) * r * 0.7), 1, 1); }
    } else if (h.k === 'zone') {
      x.fillStyle = 'rgba(200,212,74,0.7)';
      for (let j = -h.r; j <= h.r; j++) { const w = Math.round(Math.sqrt(Math.max(0, h.r * h.r - j * j))); x.fillRect(Math.round(h.x) - w, Math.round(h.y + j * 0.7), w * 2, 1); }
    } else if (h.k === 'spike') {
      x.fillStyle = '#1b0d12'; x.fillRect(Math.round(h.x) - 4, Math.round(h.y) - 7, 9, 9);
      x.fillStyle = '#f6ecd9'; for (let i = 0; i < 7; i++) x.fillRect(Math.round(h.x) - Math.floor((7 - i) / 2), Math.round(h.y) - 6 + i, 7 - (6 - i) + 1 > 0 ? Math.max(1, i) : 1, 1);
    } else if (h.k === 'fire') {
      const a = 1 - h.t / h.life;
      for (let i = 0; i < 3; i++) { x.fillStyle = i ? '#f2d15c' : '#e8873a'; x.fillRect(Math.round(h.x + Math.sin(t * 20 + i * 2 + h.x) * 3), Math.round(h.y - i * 2 - (t * 30 + i * 3) % 4), 2, 2 + (a > 0.5 ? 1 : 0)); }
    } else if (h.k === 'line') {
      x.fillStyle = (t * 14) % 2 < 1 ? 'rgba(255,90,100,0.75)' : 'rgba(246,236,217,0.6)';
      const n = 60;
      for (let i = 0; i < n; i += 2) { const k = i / n; x.fillRect(Math.round(h.x + (h.x2 - h.x) * k), Math.round(h.y + (h.y2 - h.y) * k), 2, 2); }
    } else if (h.k === 'bite') {
      const snap = h.t >= 0.7, horiz = h.side === 'n' || h.side === 's', dir = h.side === 'n' || h.side === 'w' ? 1 : -1;
      const n = 4;
      for (let i = 0; i < n; i++) {
        const off = (i - (n - 1) / 2) * 6;
        const len = snap ? 10 : 3 + ((t * 20) % 2 < 1 ? 1 : 0);
        const bx = horiz ? h.x + off : h.x - dir * 7, by = horiz ? h.y - dir * 7 : h.y + off;
        for (let s = 0; s < len; s++) {
          const w = Math.max(1, 3 - Math.floor(s / 4));
          x.fillStyle = s === len - 1 ? '#c9b8a0' : '#f6ecd9';
          if (horiz) x.fillRect(Math.round(bx) - Math.floor(w / 2), Math.round(by + dir * s), w, 1);
          else x.fillRect(Math.round(bx + dir * s), Math.round(by) - Math.floor(w / 2), 1, w);
        }
      }
    }
  }
  drawPlayer(p, view) {
    const x = this.x, t = this.t, id = p.id;
    const g = this.ghosts[id];
    if (p.dashT > 0 && (g.length === 0 || Math.hypot(g[g.length - 1].x - p.x, g[g.length - 1].y - p.y) > 4)) g.push({ x: p.x, y: p.y, life: 0.2 });
    for (const q of g) { q.life -= 1 / 60; }
    while (g.length && g[0].life <= 0) g.shift();
    const frame = p.moving ? Math.floor(p.anim) % 2 : 0;
    const name = 'p' + id + (p.face === 'u' ? (frame ? 'v' : 'u') : (frame ? 'b' : 'a'));
    const s = SPR[name];
    for (const q of g) { x.globalAlpha = q.life * 2.5; x.drawImage(this.white(s.c), Math.round(q.x - 8), Math.round(q.y - 13)); }
    x.globalAlpha = 1;
    if (p.down) {
      x.globalAlpha = 0.45 + Math.sin(t * 4) * 0.1;
      x.drawImage(this.white(s.c), Math.round(p.x - 8), Math.round(p.y - 15 + Math.sin(t * 3) * 2));
      x.globalAlpha = 1;
      text(x, 'CLEAR THE ROOM', p.x, p.y - 24, '#f6ecd9', '#1b0d12', 'center');
      return;
    }
    if (!(p.inv > 0 && Math.floor(t * 18) % 2)) {
      const px = Math.round(p.x - 8), py = Math.round(p.y - 13 - (frame ? 1 : 0));
      if (p.face === 'l') { x.save(); x.scale(-1, 1); x.drawImage(s.c, -px - 16, py); x.restore(); } else x.drawImage(s.c, px, py);
    }
    if (p.shieldUp) { x.fillStyle = '#9ad8dc'; for (let a = 0; a < 12; a++) { const ang = a / 12 * Math.PI * 2 + t; x.fillRect(Math.round(p.x + Math.cos(ang) * 10), Math.round(p.y - 5 + Math.sin(ang) * 10), 1, 1); } }
    const n = p.st.orbit || 0;
    for (let i = 0; i < n; i++) { const a = p.orbA + i * Math.PI * 2 / n, img = this.dot('s', 3.5); x.drawImage(img, Math.round(p.x + Math.cos(a) * 20 - img.width / 2), Math.round(p.y - 4 + Math.sin(a) * 20 - img.height / 2)); }
    if (view.coop) text(x, id === 0 ? '1' : '2', p.x, p.y - 21, id === 0 ? '#e58494' : '#9ad8dc', '#1b0d12', 'center');
  }
  drawEnemy(e, view) {
    const x = this.x, t = this.t;
    if (e.boss) return this.drawBoss(e, view);
    const s = SPR[e.type];
    if (e.under) {
      const shake = e.st === 'rise' ? Math.round(Math.sin(t * 60)) : 0;
      x.fillStyle = '#2a0a12';
      for (let i = 0; i < 5; i++) x.fillRect(Math.round(e.x - 6 + i * 3 + shake), Math.round(e.y + 2 - (i % 2) - (e.st === 'rise' ? 2 : 0)), 3, 2);
      x.fillStyle = FLOORS[view.fi].pal.floor2; x.fillRect(Math.round(e.x - 4 + shake), Math.round(e.y), 8, 1);
      return;
    }
    let scale = e.small ? 0.6 : 1;
    let sxk = 1 + Math.sin(e.age * 7 + e.id) * 0.06, syk = 2 - sxk;
    if (e.type === 'gnat') { sxk = 1; syk = 1; }
    if (e.type === 'slime' && e.st === 'hop') { sxk = 0.85; syk = 1.2; }
    const w = 16 * scale * sxk, h = 16 * scale * syk;
    let img = s.c;
    if (e.flash > 0 || (WIND.has(e.st) && Math.floor(t * 14) % 2)) img = s.wc;
    let alpha = 1, rise = 0;
    if (e.spawnT > 0) { alpha = 1 - e.spawnT / 0.7; rise = e.spawnT * 10; }
    x.globalAlpha = Math.max(0, alpha);
    const gy = e.type === 'gnat' ? Math.sin(t * 9 + e.id) * 2 - 4 : 0;
    x.drawImage(img, Math.round(e.x - w / 2), Math.round(e.y - h + 6 * scale - (e.z || 0) + rise + gy), Math.round(w), Math.round(h));
    x.globalAlpha = 1;
    if (e.burn) { x.fillStyle = (t * 10) % 2 < 1 ? '#e8873a' : '#f2d15c'; x.fillRect(Math.round(e.x - 1), Math.round(e.y - 14 - (e.z || 0)), 2, 3); }
    if (e.poison) { x.fillStyle = '#86b34e'; x.fillRect(Math.round(e.x + 4), Math.round(e.y - 12 + ((t * 8) % 4)), 1, 1); }
  }
  drawBoss(e, view) {
    const x = this.x, t = this.t, B = bosses();
    const flash = e.flash > 0 || (WIND.has(e.st) && Math.floor(t * 14) % 2);
    const draw = (img, dx, dy, w = img.width, h = img.height) => x.drawImage(flash ? this.white(img) : img, Math.round(dx), Math.round(dy), Math.round(w), Math.round(h));
    switch (e.type) {
      case 'dangler': {
        const top = OY + 12, by = e.y - 18;
        for (let y = top; y < by + 2; y++) { const k = (y - top) / (by - top); const sx = CX + (e.x - CX) * k * k; x.drawImage(B.stalk, 0, 3, 10, 1, Math.round(sx - 5), y, 10, 1); }
        draw(B.dangler, e.x - 17, e.y - 18);
        break;
      }
      case 'churn': {
        let sxk = 1 + Math.sin(e.age * 3) * 0.04, syk = 2 - sxk;
        if (e.st === 'crouch') { sxk = 1.12; syk = 0.86; }
        if (e.st === 'air') { sxk = 0.92; syk = 1.1; }
        const w = 52 * sxk, h = 42 * syk;
        draw(B.churn, e.x - w / 2, e.y + 14 - h - (e.z || 0), w, h);
        break;
      }
      case 'bellows': {
        const k = e.br || 0, w = 56 * (1 + k * 0.16), h = 46 * (1 + k * 0.1);
        draw(B.bellows, e.x - w / 2, e.y - h / 2, w, h);
        if (e.st === 'inhale' && rnd() < 0.5) { const a = rnd() * 6.28, d = 140; this.parts.push({ x: e.x + Math.cos(a) * d, y: e.y + Math.sin(a) * d * 0.6, vx: -Math.cos(a) * 160, vy: -Math.sin(a) * 100, c: 'rgba(246,236,217,0.5)', life: 0.7, max: 0.7, size: 1 }); }
        break;
      }
      case 'coil': {
        const segs = e.segs || [];
        for (let i = segs.length - 1; i >= 0; i--) { const s = segs[i], sc = 1 - i * 0.03; draw(B.coilSeg, s[0] - 8 * sc, s[1] - 8 * sc, 16 * sc, 16 * sc); }
        draw(B.coilHead, e.x - 11, e.y - 11);
        break;
      }
      case 'marrow': {
        const bob = Math.sin(t * 3) * 2;
        if (e.st === 'dash') for (let i = 1; i < 4; i++) { x.globalAlpha = 0.2; x.drawImage(this.white(B.marrow), Math.round(e.x - 15 - (e.vx || 0)), Math.round(e.y - 26 + bob)); }
        x.globalAlpha = 1;
        draw(B.marrow, e.x - 15, e.y - 26 + bob);
        x.drawImage(B.crown, Math.round(e.x - 5), Math.round(e.y - 31 + bob));
        break;
      }
      case 'heart': {
        const k = 1 + (e.pulse || 0) * 0.12, w = 54 * k, h = 50 * k;
        x.drawImage(B.aorta, Math.round(e.x - 15), Math.round(e.y - h / 2 - 8));
        draw(B.heart, e.x - w / 2, e.y - h / 2, w, h);
        break;
      }
    }
  }
  drawParts(dt) {
    const x = this.x;
    for (const p of this.parts) {
      p.life -= dt;
      if (p.zap) { x.fillStyle = '#c8f0ff'; for (let i = 1; i < p.zap.length; i++) { const [x0, y0] = p.zap[i - 1], [x1, y1] = p.zap[i]; for (let k = 0; k <= 1; k += 0.06) x.fillRect(Math.round(x0 + (x1 - x0) * k + rr(-2, 2)), Math.round(y0 + (y1 - y0) * k + rr(-2, 2)), 1, 1); } continue; }
      if (p.ring) { x.fillStyle = p.c; const r = p.r * (1 - p.life / p.max); for (let a = 0; a < 24; a++) { const ang = a / 24 * 6.28; x.fillRect(Math.round(p.x + Math.cos(ang) * r), Math.round(p.y + Math.sin(ang) * r * 0.75), 2, 1); } continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(0.02, dt); p.vy *= Math.pow(0.02, dt);
      x.fillStyle = p.c; x.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    this.parts = this.parts.filter(p => p.life > 0);
    if (this.parts.length > 600) this.parts.splice(0, this.parts.length - 600);
  }

  // ---------- HUD
  hearts(p, x0, y0, right) {
    const x = this.x, n = Math.ceil(p.st.maxhp / 2);
    for (let i = 0; i < n; i++) {
      const col = i % 10, row = Math.floor(i / 10);
      const hx = right ? x0 - (col + 1) * 8 : x0 + col * 8, hy = y0 + row * 7;
      const v = p.hp - i * 2;
      x.drawImage(SPR.heartE.c, hx, hy);
      if (v >= 2) x.drawImage(SPR.heart.c, hx, hy);
      else if (v === 1) x.drawImage(SPR.heart.c, 0, 0, 4, 6, hx, hy, 4, 6);
    }
  }
  drawHUD(view, F) {
    const x = this.x;
    x.fillStyle = '#1b0d12'; x.fillRect(0, 0, W, OY - 2);
    x.fillStyle = F.pal.wall2; x.fillRect(0, OY - 2, W, 1);
    const need = view.nd || (view.xpNeed ? view.xpNeed() : 1), lv = view.level || 1;
    x.fillStyle = '#3a2410'; x.fillRect(0, OY - 3, W, 2);
    x.fillStyle = '#f2d15c'; x.fillRect(0, OY - 3, Math.round(W * Math.min(1, (view.xp || 0) / need)), 2);
    text(x, 'LV ' + lv, 128, 12, '#f2d15c');
    const p0 = view.players[0];
    if (p0) this.hearts(p0, 6, 3);
    x.drawImage(SPR.tooth.c, 96, 3); text(x, view.teeth, 106, 4);
    x.drawImage(SPR.marrow.c, 95, 12); text(x, view.marrow, 106, 12, '#e8873a');
    text(x, F.plate + '  ' + F.name, 186, 4, '#e2d8bc', '#1b0d12', 'center');
    const m = Math.floor(view.time / 60), s = Math.floor(view.time % 60);
    text(x, m + ':' + String(s).padStart(2, '0'), 186, 12, '#8a6a6a', null, 'center');
    const p1 = view.players[1];
    if (view.coop && p1) { if (p1.present) this.hearts(p1, W - 6, 3, true); else text(x, 'WAITING FOR P2', W - 6, 6, '#8a6a6a', null, 'right'); }
  }
  drawMap(view) {
    const map = view.map; if (!map || !view.room) return;
    const x = this.x, cw = 6, ch = 4, cx0 = view.room.gx, cy0 = view.room.gy;
    const ox = OX + RW * TILE - 4 - 5 * (cw + 1), oy = OY + 3;
    const near = view.players.some(p => p.present && p.x > ox - 10 && p.y < oy + 34);
    x.globalAlpha = near ? 0.3 : 0.9;
    x.fillStyle = 'rgba(12,2,6,0.7)'; x.fillRect(ox - 2, oy - 2, 5 * (cw + 1) + 3, 5 * (ch + 1) + 3);
    for (const r of map) {
      const dx = r.gx - cx0 + 2, dy = r.gy - cy0 + 2;
      if (dx < 0 || dy < 0 || dx > 4 || dy > 4) continue;
      const px = ox + dx * (cw + 1), py = oy + dy * (ch + 1);
      const cur = r.gx === cx0 && r.gy === cy0;
      x.fillStyle = cur ? '#f6ecd9' : r.v ? '#a08878' : '#4a2a32';
      x.fillRect(px, py, cw, ch);
      if (r.ic) {
        const icon = { boss: '#e0303e', treasure: '#f2d15c', shop: '#9ad8dc', feed: '#e58494' }[r.t];
        if (icon) { x.fillStyle = icon; x.fillRect(px + 2, py + 1, 2, 2); }
      }
    }
    x.globalAlpha = 1;
  }
  drawBossBar(e) {
    const x = this.x, w = 150, bx = Math.round(CX - w / 2), by = OY + RH * TILE - 11;
    const name = (BOSSES[e.type] || {}).name || '';
    text(x, name, CX, by - 7, '#f6ecd9', '#1b0d12', 'center');
    x.fillStyle = '#1b0d12'; x.fillRect(bx - 1, by - 1, w + 2, 6);
    x.fillStyle = '#3a0810'; x.fillRect(bx, by, w, 4);
    x.fillStyle = '#d8304a'; x.fillRect(bx, by, Math.round(w * Math.max(0, e.hp / e.max)), 4);
    x.fillStyle = '#ff9aa8'; x.fillRect(bx, by, Math.round(w * Math.max(0, e.hp / e.max)), 1);
  }

  // ---------- title scene: the tower, alive, with two tiny climbers at its mouth
  drawTitle(dt) {
    this.t += dt;
    const x = this.x, t = this.t;
    if (!this.towerArt) {
      const c = mk(W, H), g = c.getContext('2d');
      const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const v = j / H; g.fillStyle = v * 16 + (i % 7) * 0.1 > BAY[(j & 3) * 4 + (i & 3)] + 6 ? '#2a0810' : '#16040a'; g.fillRect(i, j, 1, 1); }
      const pal = ['#1b0d12', '#5a1d2a', '#7d2f3d', '#a8475a', '#d47488'];
      const tower = blob(110, 190, (px, py) => {
        const w = 26 + py * 0.14 + Math.sin(py * 0.12) * 4;
        return Math.abs(px - 55) < w && py > 6 - Math.cos((px - 55) / w * 1.5) * 4;
      }, pal, 0.3, 0.2, 1.2);
      const tg = tower.getContext('2d');
      for (let s = 20; s < 190; s += 22) { tg.fillStyle = '#3a0f19'; for (let i = 0; i < 110; i++) { const w = 26 + s * 0.14; if (Math.abs(i - 55) < w - 2) tg.fillRect(i, s + Math.round(Math.sin(i * 0.2) * 2), 1, 1); } }
      g.drawImage(tower, 30, 12);
      // mouth at the base
      g.fillStyle = '#0c0206'; g.fillRect(64, 168, 42, 22); g.fillStyle = '#f6ecd9';
      for (let i = 0; i < 6; i++) { g.fillRect(66 + i * 7, 168, 4, 4); g.fillRect(67 + i * 7, 172, 2, 2); }
      this.towerArt = c;
    }
    x.drawImage(this.towerArt, 0, 0);
    // eyes along the tower that blink at different times
    const eyes = [[72, 46], [98, 70], [64, 104], [104, 132], [80, 150]];
    eyes.forEach(([ex, ey], i) => {
      const blink = (t * 0.6 + i * 0.37) % 3 < 0.12;
      x.fillStyle = '#1b0d12'; x.fillRect(ex - 3, ey - 2, 7, 5);
      if (!blink) { x.fillStyle = '#f6ecd9'; x.fillRect(ex - 2, ey - 1, 5, 3); x.fillStyle = '#c02a3e'; x.fillRect(ex + Math.round(Math.sin(t + i)), ey - 1, 2, 3); }
    });
    // two climbers at the mouth
    const frame = Math.floor(t * 4) % 2;
    x.drawImage(SPR[frame ? 'p0v' : 'p0u'].c, 70, 172 - frame); x.drawImage(SPR[frame ? 'p1u' : 'p1v'].c, 88, 172 - (1 - frame));
    x.drawImage(this.vig, 0, 0);
  }
}
