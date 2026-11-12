// Gullet renderer. Draws a "view" (the host's Game, or the guest's mirror of it) at 320x196 pixels.
import { TILE, RW, RH, OX, OY, W, H, CX, CY, FLOORS, FL, BOSSES, ITEM, DOORS } from './data.js';
import { SPR, floorArt, bosses, text, whiteOf, blob, climberSprite, climberUpper, legColors } from './sprites.js';
import { ACTIVE, CHAR, SKIN, TRAIL } from './data.js';
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
const BCOL = { a: ['#86d04a', '#1a3010', '#d0ff90'], c: ['#6a4a2a', '#1a0c06', '#b48858'], h: ['#c8f0f0', '#2a4a50', '#ffffff'], m: ['#b07ad8', '#2a1040', '#e8c8ff'], H: ['#ff3a5a', '#3a0010', '#ffb0c0'], l: ['#ffffff', '#5a4a40', '#ffffff'], p: ['#e8603a', '#3a1008', '#ffb070'], g: ['#9a9284', '#2a2420', '#d8d0c0'], v: ['#d8e070', '#2a3010', '#ffffff'], w: ['#f6ecd9', '#3a2a1a', '#ffffff'], f: ['#f2a03a', '#3a1008', '#fff0a0'], s: ['#f6ecd9', '#5a4a52', '#ffffff'], S: ['#f6ecd9', '#5a4a52', '#ffffff'], b: ['#c8d44a', '#3a3a10', '#f0f4a0'], r: ['#d8304a', '#3a0810', '#ff9aa8'], n: ['#e8dcc0', '#3a2a1a', '#ffffff'] };

export class Renderer {
  constructor(canvas) {
    this.c = canvas; this.x = canvas.getContext('2d'); this.x.imageSmoothingEnabled = false;
    this.bg = new Map(); this.decals = new Map(); this.parts = []; this.floats = []; this.flashT = 0; this.ghosts = [[], []]; this.t = 0;
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
    const key = fi + ':' + room.key + ':' + (room.bgv || 0);
    let c = this.bg.get(key);
    if (c) return c;
    const F = FL(fi), P = F.pal, A = floorArt(F.part, F), R = mulberry32(hash(key));
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
    for (const d in room.secret || {}) {
      if (room.doors && room.doors[d]) continue;
      const [tx, ty] = DOORS[d], cx = tx * TILE + 8, cy = ty * TILE + 8;
      x.fillStyle = '#0c0206';
      for (let i = 0; i < 4; i++) { let px = cx + (i - 1.5) * 2, py = cy - 6; for (let k = 0; k < 11; k++) { px += Math.sin(i * 3 + k) * 1.1; py += 1; x.fillRect(Math.round(px), Math.round(py), 1, 1); if (k % 4 === 2) x.fillRect(Math.round(px) + (i % 2 ? 1 : -1), Math.round(py), 1, 1); } }
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
      case 'hit': P(e.x, e.y - 2, e.c, e.crit ? 8 : 4, 70); if (e.crit) P(e.x, e.y - 6, '#f2d15c', 5, 50); if (e.d >= 0.5 && this.floats.length < 40) this.floats.push({ x: e.x + rr(-4, 4), y: e.y - 12, txt: e.d >= 10 ? Math.round(e.d) : e.d, life: e.crit ? 0.8 : 0.55, max: e.crit ? 0.8 : 0.55, crit: e.crit }); break;
      case 'die': P(e.x, e.y, e.c, 14, 90, 0.45); P(e.x, e.y, e.c, 6, 60, 0.6, 2); this.parts.push({ ring: 1, x: e.x, y: e.y, r: 16, life: 0.18, max: 0.18, c: '#f6ecd9' }); this.parts.push({ pop: 1, x: e.x, y: e.y, life: 0.08, max: 0.08 }); this.splat(view, e.x, e.y, e.c, 1); break;
      case 'bossdie': this.flashT = 0.55; for (let i = 0; i < 4; i++) this.parts.push({ ring: 1, x: e.x, y: e.y, r: 40 + i * 30, life: 0.4 + i * 0.12, max: 0.4 + i * 0.12, c: i % 2 ? '#f2d15c' : '#f6ecd9' }); break;
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
      case 'healpulse': this.parts.push({ ring: 1, x: e.x, y: e.y, r: 75, life: 0.35, max: 0.35, c: '#86d04a' }); P(e.x, e.y, '#86d04a', 10, 50, 0.4); break;
      case 'wish': P(e.x, e.y - 4, '#f6ecd9', 24, 90, 0.7); P(e.x, e.y - 4, '#f2d15c', 12, 60, 0.6); break;
    }
  }

  // ---------- main draw
  draw(view, dt) {
    this.t += dt;
    const x = this.x, F = FL(view.fi), P = F.pal;
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
    if (view.room.type === 'shop') this.drawShopkeeper(view);
    if (view.decoy) { const d = view.decoy, bob = Math.abs(Math.sin(this.t * 8)) * 3; this.shadow(d.x, d.y + 4, 5); x.drawImage(SPR.a_chicken.c, Math.round(d.x - 6), Math.round(d.y - 10 - bob)); }
    const ents = [];
    for (const p of view.players) if (p.present) ents.push({ y: p.y, p });
    for (const e of view.enemies) ents.push({ y: e.y + (e.boss ? 6 : 0), e });
    ents.sort((a, b) => a.y - b.y);
    for (const en of ents) if (en.e && !en.e.under) this.shadow(en.e.x, en.e.y + (en.e.boss ? en.e.r * 0.6 : 5), en.e.r * (en.e.boss ? 1.1 : 0.9) * (1 - Math.min(0.6, (en.e.z || 0) / 60)));
    for (const en of ents) if (en.p) this.shadow(en.p.x, en.p.y + 3, 5);
    for (const en of ents) { if (en.p) this.drawPlayer(en.p, view); else this.drawEnemy(en.e, view); }
    if (view.room.dark) this.drawDark(view);
    for (const b of view.bullets) {
      const img = this.dot(b.k, b.r);
      if (!b.en && b.k !== 'n') this.shadow(b.x, b.y + 6, 2);
      if (b.k === 'l' && !b.en) { const sp = Math.hypot(b.vx, b.vy) || 1, ux = b.vx / sp, uy = b.vy / sp; for (let i = 0; i < 9; i++) { x.fillStyle = i < 2 ? '#ffffff' : i < 5 ? '#e8dcc0' : '#8a7a68'; x.fillRect(Math.round(b.x - ux * i), Math.round(b.y - uy * i), 2, 2); } continue; }
      if ((b.k === 'v' || b.k === 'c') && !b.en) { const ph = Math.min(1, (b.t || 0) / 0.5); x.drawImage(img, Math.round(b.x - img.width / 2), Math.round(b.y - img.height / 2 - Math.sin(ph * Math.PI) * 10)); continue; }
      if (b.k === 'f' && Math.random() < 0.3) this.parts.push({ x: b.x, y: b.y, vx: 0, vy: -20, c: '#f2d15c', life: 0.15, max: 0.15, size: 1 });
      if (b.k === 'n' || b.k === 'w') { x.fillStyle = '#1b0d12'; x.fillRect(Math.round(b.x) - 2, Math.round(b.y) - 2, 5, 5); x.fillStyle = b.k === 'w' ? '#ffffff' : '#e8dcc0'; const a = (this.t * 12) % 2 < 1; x.fillRect(Math.round(b.x) - (a ? 2 : 0), Math.round(b.y) - (a ? 0 : 2), a ? 4 : 1, a ? 1 : 4); x.fillRect(Math.round(b.x) - (a ? 0 : 1), Math.round(b.y) - (a ? 1 : 0), a ? 1 : 3, a ? 3 : 1); }
      else x.drawImage(img, Math.round(b.x - img.width / 2), Math.round(b.y - img.height / 2));
    }
    this.drawParts(dt);
    x.restore();
    x.drawImage(this.vig, 0, 0);
    // living walls: a faint pulse that gets stronger near the heart
    const pulse = (Math.sin(this.t * (2 + view.fi * 0.5)) + 1) / 2;
    x.fillStyle = `rgba(120,10,30,${0.02 + pulse * 0.025 * (1 + view.fi * 0.4)})`; x.fillRect(OX, OY, RW * TILE, RH * TILE);
    if (this.flashT > 0) { this.flashT -= dt; x.fillStyle = `rgba(255,248,236,${Math.min(0.85, this.flashT * 1.6)})`; x.fillRect(0, 0, W, H); }
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
    if (k.kind === 'note') { this.shadow(k.x, k.y + 5, 5); x.drawImage(SPR.note.c, k.x - 6, k.y - 9 + bob); if ((this.t * 2) % 2 < 1) { x.fillStyle = '#f6ecd9'; x.fillRect(k.x + 6, k.y - 10 + bob, 1, 1); } return; }
    if (k.kind === 'bomb' && !k.ped) { this.shadow(k.x, k.y + 4, 4); x.drawImage(SPR.bomb.c, k.x - 6, k.y - 9 + bob); if ((k.v || 1) > 1) text(x, 'x' + k.v, k.x + 6, k.y - 2, '#f6ecd9'); return; }
    if (k.kind === 'active' && !k.ped) { this.shadow(k.x, k.y + 4, 5); x.drawImage(SPR['a_' + k.id].c, k.x - 6, k.y - 10 + bob); return; }
    if (k.kind === 'item' || (k.kind === 'cache' && k.ped) || k.kind === 'active' || k.kind === 'bomb') {
      const it = k.kind === 'cache' ? null : k.kind === 'active' ? SPR['a_' + k.id] : k.kind === 'bomb' ? SPR.bomb : SPR['i_' + k.id];
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
  drawDark(view) {
    if (!this.darkC) { this.darkC = mk(W, H); }
    const c = this.darkC, g = c.getContext('2d');
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(6,0,3,0.94)'; g.fillRect(OX, OY, RW * TILE, RH * TILE);
    g.globalCompositeOperation = 'destination-out';
    const lights = view.players.filter(p => p.present).map(p => [p.x, p.y - 4, 50]);
    if (view.valve) lights.push([view.valve.x, view.valve.y, 24]);
    for (const [lx, ly, r] of lights) for (let i = 0; i < 4; i++) { g.fillStyle = `rgba(0,0,0,${0.35 + i * 0.2})`; const rr2 = r * (1 - i * 0.18); g.beginPath(); g.arc(Math.round(lx), Math.round(ly), rr2, 0, Math.PI * 2); g.fill(); }
    g.globalCompositeOperation = 'source-over';
    this.x.drawImage(c, 0, 0);
  }
  drawShopkeeper(view) {
    const x = this.x, t = this.t, sx = CX - 8, sy = OY + 26 + Math.round(Math.sin(t * 2) * 1.5);
    this.shadow(CX, OY + 46, 6);
    x.drawImage(SPR.tapewell.c, sx, sy);
    const say = view.npcSay;
    if (!say || view.time - say.t > 4.5) return;
    const words = say.text.toUpperCase().split(' '), lines = [];
    let cur = '';
    for (const w of words) { if ((cur + ' ' + w).trim().length > 30) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; }
    if (cur.trim()) lines.push(cur.trim());
    const bw = Math.max(...lines.map(l => l.length)) * 4 + 6, bh = lines.length * 7 + 4, bx = Math.max(OX + 18, sx - bw - 6), by = sy - 2;
    x.fillStyle = '#1b0d12'; x.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    x.fillStyle = '#efe4cc'; x.fillRect(bx, by, bw, bh);
    x.fillStyle = '#efe4cc'; x.fillRect(bx + bw, by + 5, 4, 2); x.fillStyle = '#1b0d12'; x.fillRect(bx + bw + 4, by + 4, 1, 1); x.fillRect(bx + bw + 4, by + 7, 1, 1);
    lines.forEach((l, i) => text(x, l, bx + 3, by + 3 + i * 7, '#5a1a1a', null));
  }
  /** One frame of a climber: the upper body over legs that stride with p.anim. */
  composeClimber(p, ch, sk) {
    const c = this.pcan || (this.pcan = mk(16, 16)), g = c.getContext('2d');
    g.clearRect(0, 0, 16, 16);
    const view = p.face === 'u' ? 'u' : p.face === 'd' ? 'd' : 's', col = legColors(ch, sk);
    const ph = (p.anim || 0) * 1.25, mv = p.moving && !p.down, sn = mv ? Math.sin(ph) : 0, cs = mv ? Math.cos(ph) : 0;
    const leg = (lx, top, len, boot) => { g.fillStyle = col.line; g.fillRect(lx - 1, top, 4, len + 1); g.fillStyle = col.pants; g.fillRect(lx, top, 2, 1); g.fillStyle = boot; g.fillRect(lx, top + 1, 2, len - 1); };
    if (view === 's') {
      // side: one leg swings forward while the other pushes back; the swinging foot clears the ground
      const sw = Math.round(sn * 3), liftA = cs > 0.35 ? 1 : 0, liftB = cs < -0.35 ? 1 : 0;
      leg(6 - sw, 12, 3 - liftB, col.far);
      leg(7 + sw, 12, 3 - liftA, col.boot);
    } else {
      // front and back: feet take turns lifting, hips sway a pixel
      const liftL = Math.round(Math.max(0, sn) * 2), liftR = Math.round(Math.max(0, -sn) * 2), sway = mv ? Math.round(sn * 0.6) : 0;
      leg(5 + sway, 12, 3 - liftL, col.boot);
      leg(9 + sway, 12, 3 - liftR, col.boot);
    }
    // a slight lean into the run; the body stays level so it reads as running, not hopping
    g.drawImage(climberUpper(ch, sk, view).c, view === 's' && mv ? 1 : 0, 0);
    // dust on each footfall
    const step = Math.floor(ph / Math.PI);
    if (mv && step !== p._step) { p._step = step; if (!p.dashT) for (let i = 0; i < 2; i++) this.parts.push({ x: p.x + (Math.random() - 0.5) * 6, y: p.y + 3, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 8, c: 'rgba(200,170,160,0.55)', life: 0.3, max: 0.3, size: 1 }); }
    return c;
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
    } else if (h.k === 'bomb') {
      const k = h.t / h.life, s2 = 1 + (k > 0.7 && (t * 20) % 2 < 1 ? 0.15 : 0), img = k > 0.7 && (t * 16) % 2 < 1 ? this.white(SPR.bomb.c) : SPR.bomb.c;
      this.shadow(h.x, h.y + 4, 5);
      x.drawImage(img, Math.round(h.x - 6 * s2), Math.round(h.y - 10 * s2), Math.round(12 * s2), Math.round(12 * s2));
      x.fillStyle = (t * 18) % 2 < 1 ? '#f2d15c' : '#e8873a'; x.fillRect(Math.round(h.x + 1), Math.round(h.y - 11 - Math.random() * 2), 1, 1);
    } else if (h.k === 'pull') {
      x.fillStyle = '#9aa0a8';
      for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + t * 6, r = 40 * (1 - (h.t / h.life + i / 18) % 1); x.fillRect(Math.round(h.x + Math.cos(a) * r), Math.round(h.y + Math.sin(a) * r * 0.75), 1, 1); }
    } else if (h.k === 'epool') {
      const r = h.r * Math.min(1, h.t / 0.4), a = Math.min(1, (h.life - h.t) * 2);
      x.fillStyle = `rgba(150,190,40,${0.55 * a})`;
      for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(Math.max(0, r * r - j * j))); x.fillRect(Math.round(h.x) - w, Math.round(h.y + j * 0.6), w * 2, 1); }
      x.fillStyle = '#f0f4a0'; if ((t * 3 + h.x) % 1 < 0.5) x.fillRect(Math.round(h.x + Math.sin(h.x) * r * 0.5), Math.round(h.y), 1, 1);
    } else if (h.k === 'vin') {
      const a = 1 - h.t / h.life, r = h.r * Math.min(1, h.t * 6);
      x.fillStyle = `rgba(200,214,80,${0.25 + a * 0.3})`;
      for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(Math.max(0, r * r - j * j))); x.fillRect(Math.round(h.x) - w, Math.round(h.y + j * 0.6), w * 2, 1); }
      x.fillStyle = '#f0f4a0'; for (let i = 0; i < 3; i++) { const ph = (t * 1.5 + i * 0.33) % 1; x.fillRect(Math.round(h.x + Math.sin(i * 2.1 + h.x) * r * 0.6), Math.round(h.y + Math.cos(i * 1.7) * r * 0.35 - ph * 3), 1, 1); }
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
    const frame = 0;
    const look = p.look || {}, ch = CHAR[p.char] || CHAR.wren, sk = SKIN[look.skin], s = { c: this.composeClimber(p, ch, sk) }, still = climberSprite(ch, sk, p.face === 'u' ? 'u' : 'a');
    const tr = TRAIL[look.trail];
    if (tr && tr.cols.length && p.moving && !p.down && Math.random() < 0.45) { const up = look.trail !== 'petals'; this.parts.push({ x: p.x + rr(-3, 3), y: p.y + rr(0, 3), vx: rr(-8, 8), vy: up ? rr(-26, -10) : rr(4, 12), c: tr.cols[Math.random() < 0.5 ? 0 : 1], life: 0.6, max: 0.6, size: look.trail === 'hearts' || look.trail === 'smoke' ? 2 : 1 }); }
    for (const q of g) { x.globalAlpha = q.life * 2.5; x.drawImage(this.white(still.c), Math.round(q.x - 8), Math.round(q.y - 13)); }
    x.globalAlpha = 1;
    if (p.down) {
      x.globalAlpha = 0.45 + Math.sin(t * 4) * 0.1;
      x.drawImage(this.white(still.c), Math.round(p.x - 8), Math.round(p.y - 15 + Math.sin(t * 3) * 2));
      x.globalAlpha = 1;
      text(x, 'CLEAR THE ROOM', p.x, p.y - 24, '#f6ecd9', '#1b0d12', 'center');
      return;
    }
    if (!(p.inv > 0 && Math.floor(t * 18) % 2)) {
      const rc = p.recoil > 0 ? 1 : 0, F = { u: [0, 1], d: [0, -1], l: [1, 0], r: [-1, 0] }[p.face] || [0, 0];
      if (p.recoil > 0) p.recoil -= 1 / 60;
      const px = Math.round(p.x - 8 + F[0] * rc), py = Math.round(p.y - 13 - (frame ? 1 : 0) + F[1] * rc);
      if (p.char === 'hollow') x.globalAlpha = 0.78;
      const sc = p.char === 'pip' ? 0.8 : 1, sw = Math.round(16 * sc), ox = Math.round((16 - sw) / 2), oy = 16 - sw;
      if (p.face === 'l') { x.save(); x.scale(-1, 1); x.drawImage(s.c, -px - 16 + ox, py + oy, sw, sw); x.restore(); } else x.drawImage(s.c, px + ox, py + oy, sw, sw);
      x.globalAlpha = 1;
      const hat = look.hat && look.hat !== 'none' && SPR['h_' + look.hat];
      if (hat) { const hy = py + oy + 3 - hat.h - (look.hat === 'halo' ? 3 - Math.round(Math.sin(t * 3)) : 0); x.drawImage(hat.c, Math.round(p.x - hat.w / 2 + F[0] * rc), Math.round(hy)); }
      if (p.frenzy > 0 && Math.floor(t * 12) % 2) { x.fillStyle = '#f6ecd9'; x.fillRect(Math.round(p.x - 6), Math.round(p.y - 16), 1, 1); x.fillRect(Math.round(p.x + 6), Math.round(p.y - 14), 1, 1); }
    }
    if (p.shieldUp) { x.fillStyle = '#9ad8dc'; for (let a = 0; a < 12; a++) { const ang = a / 12 * Math.PI * 2 + t; x.fillRect(Math.round(p.x + Math.cos(ang) * 10), Math.round(p.y - 5 + Math.sin(ang) * 10), 1, 1); } }
    if (p.st.aura) { x.fillStyle = 'rgba(200,230,150,0.55)'; for (let a = 0; a < 28; a++) { const ang = a / 28 * Math.PI * 2 - t * 0.8; if ((a + Math.floor(t * 6)) % 3) x.fillRect(Math.round(p.x + Math.cos(ang) * 26), Math.round(p.y - 2 + Math.sin(ang) * 20), 1, 1); } }
    const nb = p.st.buddy || 0, pets = (p.items || []).filter(id => id === 'frog' || id === 'rat' || id === 'ghost');
    for (let i = 0; i < nb; i++) { const a = p.orbA * 0.5 + i * 2.1, bx = p.x + Math.cos(a) * 15, by = p.y - 6 + Math.sin(a) * 8 + Math.sin(t * 6 + i) * 1.5, img = SPR['i_' + (pets[i] || 'ghost')]; if (img) x.drawImage(img.c, Math.round(bx - 4), Math.round(by - 4), 8, 8); }
    const n = p.st.orbit || 0;
    for (let i = 0; i < n; i++) { const a = p.orbA + i * Math.PI * 2 / n, img = this.dot('s', 3.5); x.drawImage(img, Math.round(p.x + Math.cos(a) * 20 - img.width / 2), Math.round(p.y - 4 + Math.sin(a) * 20 - img.height / 2)); }
    if (view.coop) text(x, id === 0 ? '1' : '2', p.x, p.y - 21, id === 0 ? '#e58494' : '#9ad8dc', '#1b0d12', 'center');
  }
  drawEnemy(e, view) {
    const x = this.x, t = this.t;
    if (e.boss) return this.drawBoss(e, view);
    const s = SPR[e.type];
    if (e.hide) { x.fillStyle = 'rgba(246,236,217,0.35)'; for (let i = 0; i < 5; i++) x.fillRect(Math.round(e.x + Math.sin(t * 7 + i * 1.3) * 5), Math.round(e.y - 4 + Math.cos(t * 5 + i * 2) * 4), 1, 1); return; }
    if (e.type === 'molar' && e.st === 'sleep') { const bob = Math.round(Math.sin(t * 3 + e.x) * 1.5); this.shadow(e.x, e.y + 4, 3); x.drawImage(SPR.tooth.c, Math.round(e.x - 3), Math.round(e.y - 5 + bob)); return; }
    if (e.under) {
      const shake = e.st === 'rise' ? Math.round(Math.sin(t * 60)) : 0;
      x.fillStyle = '#2a0a12';
      for (let i = 0; i < 5; i++) x.fillRect(Math.round(e.x - 6 + i * 3 + shake), Math.round(e.y + 2 - (i % 2) - (e.st === 'rise' ? 2 : 0)), 3, 2);
      x.fillStyle = FL(view.fi).pal.floor2; x.fillRect(Math.round(e.x - 4 + shake), Math.round(e.y), 8, 1);
      return;
    }
    let scale = e.small ? 0.6 : e.elite ? 1.45 : 1;
    let sxk = 1 + Math.sin(e.age * 7 + e.id) * 0.06, syk = 2 - sxk;
    if (e.flash > 0) { sxk = 1.18; syk = 0.84; }
    if (e.type === 'gnat') { sxk = 1; syk = 1; }
    if (e.type === 'slime' && e.st === 'hop') { sxk = 0.85; syk = 1.2; }
    const w = 16 * scale * sxk, h = 16 * scale * syk;
    let img = s.c;
    if (e.flash > 0 || (WIND.has(e.st) && Math.floor(t * 14) % 2)) img = s.wc;
    let alpha = 1, rise = 0;
    if (e.spawnT > 0) { alpha = 1 - e.spawnT / 0.7; rise = e.spawnT * 10; }
    x.globalAlpha = Math.max(0, alpha);
    const gy = e.type === 'gnat' ? Math.sin(t * 9 + e.id) * 2 - 4 : 0;
    if (e.elite) { if (!this.gold) this.gold = new WeakMap(); let g = this.gold.get(s.c); if (!g) { g = whiteOf(s.c, '#f2d15c'); this.gold.set(s.c, g); } for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) x.drawImage(g, Math.round(e.x - w / 2) + ox, Math.round(e.y - h + 6 * scale - (e.z || 0) + rise + gy) + oy, Math.round(w), Math.round(h)); }
    x.drawImage(img, Math.round(e.x - w / 2), Math.round(e.y - h + 6 * scale - (e.z || 0) + rise + gy), Math.round(w), Math.round(h));
    x.globalAlpha = 1;
    if (e.elite) x.drawImage(SPR.crown.c, Math.round(e.x - 3), Math.round(e.y - h + 2 - (e.z || 0) + gy + Math.sin(t * 4) * 1.5));
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
      case 'bileduke': {
        const wob = 1 + Math.sin(e.age * 3) * 0.04, w = 54 * wob, h = 44 * (2 - wob);
        draw(B.bileduke, e.x - w / 2, e.y + 14 - h, w, h);
        x.drawImage(B.crownBile, Math.round(e.x - 4), Math.round(e.y + 10 - h));
        break;
      }
      case 'twins': {
        const b2 = (e.segs || [])[0];
        if (b2) { x.save(); x.translate(Math.round(b2[0]), 0); x.scale(-1, 1); x.drawImage(flash ? this.white(B.kidney) : B.kidney, -13, Math.round(b2[1] - 16)); x.restore(); }
        draw(B.kidney, e.x - 13, e.y - 16);
        if (b2) { x.fillStyle = '#6a3424'; for (let k = 0; k <= 1; k += 0.1) x.fillRect(Math.round(e.x + (b2[0] - e.x) * k), Math.round(e.y + 4 + (b2[1] - e.y) * k + Math.sin(k * Math.PI) * 6), 2, 1); }
        break;
      }
      case 'taster': {
        const top = OY + 12, by = e.y - 14;
        for (let y = top; y < by + 2; y++) { const k = (y - top) / (by - top), sx = CX + (e.x - CX) * k * k, w = 34 - k * 6; x.drawImage(B.tongueStalk, 0, 3, 36, 1, Math.round(sx - w / 2), y, Math.round(w), 1); }
        draw(B.taster, e.x - 22, e.y - 17);
        break;
      }
      case 'ganglion': {
        const k = 1 + Math.sin(e.age * 6) * 0.04 + (e.st === 'lines' ? 0.08 : 0);
        draw(B.ganglion, e.x - 23 * k, e.y - 23 * k, 46 * k, 46 * k);
        x.fillStyle = '#c8e8ff'; for (let i = 0; i < 4; i++) { const a = t * 3 + i * 1.6, r = 18 + Math.sin(t * 9 + i) * 4; x.fillRect(Math.round(e.x + Math.cos(a) * r), Math.round(e.y + Math.sin(a) * r), 1, 1); }
        break;
      }
      case 'optic': {
        if (e.st === 'beam') {
          x.save(); x.beginPath(); x.rect(OX + TILE, OY + TILE, (RW - 2) * TILE, (RH - 2) * TILE); x.clip();
          const cx = Math.cos(e.a), cy = Math.sin(e.a);
          for (let d = 16; d < 420; d += 1) { const bx = Math.round(e.x + cx * d), by = Math.round(e.y + cy * d); x.fillStyle = '#d8304a'; x.fillRect(bx - 2, by - 2, 5, 5); }
          for (let d = 16; d < 420; d += 1) { x.fillStyle = (d + Math.floor(t * 40)) % 6 < 3 ? '#ffffff' : '#ffb0c0'; x.fillRect(Math.round(e.x + cx * d), Math.round(e.y + cy * d), 1, 1); }
          x.restore();
        }
        if (e.st === 'shut') { draw(B.lid, e.x - 24, e.y - 24); break; }
        draw(B.optic, e.x - 24, e.y - 24);
        let px = 0, py = 0; const tg = view.players.filter(p => p.present && !p.down)[0];
        if (e.st === 'beam' || e.st === 'aim') { px = Math.cos(e.a) * 7; py = Math.sin(e.a) * 7; } else if (tg) { const l = Math.hypot(tg.x - e.x, tg.y - e.y) || 1; px = (tg.x - e.x) / l * 7; py = (tg.y - e.y) / l * 7; }
        const ix = Math.round(e.x + px), iy = Math.round(e.y + py);
        for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) { const d = Math.hypot(i, j); if (d < 8.5) { x.fillStyle = d < 4 ? '#0c0206' : d < 7 ? (i + j < 0 ? '#4f86c6' : '#263e6e') : '#1b0d12'; x.fillRect(ix + i, iy + j, 1, 1); } }
        x.fillStyle = '#ffffff'; x.fillRect(ix - 3, iy - 3, 2, 2);
        break;
      }
      case 'mind': {
        const bob = Math.sin(t * 2) * 2;
        x.globalAlpha = e.st === 'tp' ? 0.4 + Math.sin(t * 30) * 0.2 : 1;
        draw(B.mind, e.x - 28, e.y - 22 + bob);
        x.globalAlpha = 1;
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
      if (p.pop) { x.fillStyle = '#ffffff'; const r = 7 * (1 - p.life / p.max) + 3; for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(Math.max(0, r * r - j * j))); x.fillRect(Math.round(p.x) - w, Math.round(p.y - 2 + j), w * 2, 1); } continue; }
      if (p.ring) { x.fillStyle = p.c; const r = p.r * (1 - p.life / p.max); for (let a = 0; a < 24; a++) { const ang = a / 24 * 6.28; x.fillRect(Math.round(p.x + Math.cos(ang) * r), Math.round(p.y + Math.sin(ang) * r * 0.75), 2, 1); } continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(0.02, dt); p.vy *= Math.pow(0.02, dt);
      x.fillStyle = p.c; x.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    this.parts = this.parts.filter(p => p.life > 0);
    for (const f of this.floats) { f.life -= dt; f.y -= dt * (f.crit ? 26 : 20); if (f.life > 0) { const a = Math.min(1, f.life / f.max * 2); x.globalAlpha = a; text(x, f.txt, Math.round(f.x), Math.round(f.y), f.crit ? '#f2d15c' : '#f6ecd9', '#1b0d12', 'center'); if (f.crit) text(x, '!', Math.round(f.x) + 8, Math.round(f.y) - 2, '#f2d15c', '#1b0d12'); x.globalAlpha = 1; } }
    this.floats = this.floats.filter(f => f.life > 0);
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
    const me = view.players[view.me] || view.players[0];
    if (me) {
      x.drawImage(SPR.bomb.c, 126, 1, 8, 8); text(x, me.bombs || 0, 136, 3);
      if (me.active && SPR['a_' + me.active]) {
        const A = ACTIVE[me.active], full = me.charge >= A.charge;
        x.fillStyle = '#3a2410'; x.fillRect(148, 1, 14, 14);
        if (!full || Math.floor(this.t * 4) % 2) x.drawImage(SPR['a_' + me.active].c, 149, 2);
        x.fillStyle = '#1b0d12'; x.fillRect(164, 1, 4, 15);
        const hgt = Math.round(13 * Math.min(1, me.charge / A.charge)); x.fillStyle = full ? '#f2d15c' : '#9ad8dc'; x.fillRect(165, 15 - hgt, 2, hgt);
        if (full) text(x, 'Q', 170, 6, '#f2d15c');
      }
    }
    x.drawImage(SPR.marrow.c, 95, 12); text(x, view.marrow, 106, 12, '#e8873a');
    text(x, F.plate + '  ' + F.name, 222, 4, '#e2d8bc', '#1b0d12', 'center');
    const m = Math.floor(view.time / 60), s = Math.floor(view.time % 60);
    if (!view.coop) text(x, m + ':' + String(s).padStart(2, '0'), 222, 12, '#8a6a6a', null, 'center');
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
        const icon = r.el ? '#f2d15c' : r.ch ? '#f6ecd9' : { boss: '#e0303e', treasure: '#f2d15c', shop: '#9ad8dc', feed: '#e58494', secret: '#c79bd9' }[r.t];
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

  // ---------- title scene: a night sky, the tower breathing and chewing, a climber on a rope
  drawTitle(dt) {
    this.t += dt;
    const x = this.x, t = this.t;
    const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    if (!this.titleSky) {
      const c = mk(W, H), g = c.getContext('2d');
      const bands = ['#0e0309', '#16050d', '#200711', '#2c0a16', '#3a0f1c'];
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const v = j / H * (bands.length - 1) + (BAY[(j & 3) * 4 + (i & 3)] / 16 - 0.5) * 0.9; g.fillStyle = bands[Math.max(0, Math.min(bands.length - 1, Math.round(v)))]; g.fillRect(i, j, 1, 1); }
      // moon
      const mx = 134, my = 26;
      for (let j = -22; j <= 22; j++) for (let i = -22; i <= 22; i++) { const d = Math.hypot(i, j); if (d < 14) { g.fillStyle = d > 12.5 ? '#c9a890' : (Math.hypot(i + 4, j - 3) < 3 || Math.hypot(i - 5, j + 4) < 2 || Math.hypot(i - 1, j + 7) < 1.5) ? '#d8bfa4' : '#ecdcc4'; g.fillRect(mx + i, my + j, 1, 1); } else if (d < 19 && BAY[((j + 32) & 3) * 4 + ((i + 32) & 3)] > (d - 6) * 0.9) { g.fillStyle = '#3a1820'; g.fillRect(mx + i, my + j, 1, 1); } }
      // far towers
      const far = (cx, w, h, col) => { g.fillStyle = col; for (let j = 0; j < h; j++) { const ww = Math.round(w * (0.6 + 0.4 * j / h) + Math.sin(j * 0.3) * 1.5); g.fillRect(cx - ww, H - j - 26, ww * 2, 1); } };
      far(250, 9, 120, '#1a0610'); far(292, 7, 90, '#1a0610'); far(176, 6, 70, '#16050d'); far(8, 8, 100, '#1a0610');
      // ground with bones
      g.fillStyle = '#12040a'; for (let i = 0; i < W; i++) { const h = 26 + Math.round(Math.sin(i * 0.05) * 3 + Math.sin(i * 0.17) * 1.5); g.fillRect(i, H - h, 1, h); }
      g.fillStyle = '#5a4a40'; [[30, 176], [150, 182], [220, 178], [270, 184], [300, 177]].forEach(([bx, by]) => { g.fillRect(bx, by, 6, 1); g.fillRect(bx - 1, by - 1, 2, 3); g.fillRect(bx + 5, by - 1, 2, 3); });
      this.titleSky = c;
      const pal = ['#1b0d12', '#5a1d2a', '#7d2f3d', '#a8475a', '#d47488'];
      const tower = blob(112, 176, (px, py) => { const w = 25 + py * 0.15 + Math.sin(py * 0.11) * 5; return Math.abs(px - 56) < w && py > 8 - Math.cos((px - 56) / w * 1.5) * 6; }, pal, 0.3, 0.18, 1.2);
      const tg = tower.getContext('2d');
      for (let sgm = 22; sgm < 176; sgm += 21) { tg.fillStyle = '#3a0f19'; for (let i = 0; i < 112; i++) { const w = 25 + sgm * 0.15; if (Math.abs(i - 56) < w - 3) tg.fillRect(i, sgm + Math.round(Math.sin(i * 0.2 + sgm) * 2), 1, 1); } }
      tg.fillStyle = '#8a3747'; for (let v = 0; v < 5; v++) { let vx = 30 + v * 12, vy = 20; for (let k = 0; k < 120; k++) { vx += Math.sin(k * 0.3 + v) * 0.8; vy += 1; if (vy < 170 && tower.getContext('2d').getImageData(vx | 0, vy | 0, 1, 1).data[3]) tg.fillRect(vx | 0, vy | 0, 1, 1); } }
      this.titleTower = tower;
    }
    x.drawImage(this.titleSky, 0, 0);
    // stars
    for (let i = 0; i < 40; i++) { const sx = (i * 73) % W, sy = (i * 37) % 90; if ((t * 0.7 + i * 0.13) % 3 < 2.6) { x.fillStyle = i % 5 ? '#6a4050' : '#d8bfa4'; x.fillRect(sx, sy, 1, 1); } }
    // the tower breathes
    const breath = Math.sin(t * 1.1), th = 176 + Math.round(breath * 2), tw = 112 + Math.round(breath * 1.5);
    const tx = 82 - tw / 2, ty = H - 22 - th;
    x.drawImage(this.titleTower, Math.round(tx), ty, tw, th);
    // eyes that blink and follow the climber
    const climbY = 118 + Math.sin(t * 0.5) * 34;
    [[70, 40], [96, 64], [62, 96], [102, 122], [80, 140]].forEach(([ex, ey], i) => {
      ey += ty + 2 - (H - 22 - 176);
      const blink = (t * 0.6 + i * 0.37) % 3.2 < 0.12;
      x.fillStyle = '#1b0d12'; x.fillRect(ex - 4, ey - 2, 9, 5);
      if (!blink) { x.fillStyle = '#f6ecd9'; x.fillRect(ex - 3, ey - 1, 7, 3); const look = Math.max(-2, Math.min(2, Math.round((150 - ex) / 30))), lv = climbY < ey ? -1 : 0; x.fillStyle = '#c02a3e'; x.fillRect(ex + look, ey - 1 + (lv < 0 ? 0 : 1) - (lv < 0 ? 0 : 1), 2, 3); x.fillStyle = '#1b0d12'; x.fillRect(ex + look, ey, 1, 1); }
      else { x.fillStyle = '#5a1d2a'; x.fillRect(ex - 3, ey, 7, 1); }
    });
    // the mouth at the base chews
    const chew = (t % 4.2) < 0.5 ? Math.abs(Math.sin((t % 4.2) / 0.5 * Math.PI)) : 0;
    const mh = Math.round(16 - chew * 12), mxl = 60, mw = 44, myb = H - 24;
    x.fillStyle = '#0c0206'; x.fillRect(mxl, myb - mh, mw, mh);
    x.fillStyle = '#c45a70'; x.fillRect(mxl - 2, myb - mh - 2, mw + 4, 2); x.fillRect(mxl - 2, myb, mw + 4, 2);
    for (let i = 0; i < 6; i++) { x.fillStyle = '#f6ecd9'; x.fillRect(mxl + 2 + i * 7, myb - mh, 5, 4); x.fillRect(mxl + 3 + i * 7, myb - mh + 4, 3, 2); x.fillRect(mxl + 5 + i * 7, myb - 4, 4, 4); x.fillStyle = '#c9b8a0'; x.fillRect(mxl + 6 + i * 7, myb - 2, 3, 2); }
    // drool
    if (!this.drips) this.drips = [];
    if (Math.random() < dt * 1.5) this.drips.push({ x: mxl + 4 + Math.random() * (mw - 8), y: myb, v: 0 });
    for (const d of this.drips) { d.v += dt * 60; d.y += d.v * dt; x.fillStyle = '#bcd04a'; x.fillRect(Math.round(d.x), Math.round(d.y), 1, 2); }
    this.drips = this.drips.filter(d => d.y < H);
    // a rope out of a window, with a climber going up
    const wx = 120, wy = ty + 30;
    x.fillStyle = '#0c0206'; x.fillRect(wx - 4, wy - 5, 9, 9); x.fillStyle = '#f2d15c'; x.fillRect(wx - 3, wy - 4, 7, 7); x.fillStyle = '#e8873a'; x.fillRect(wx - 3, wy + 1, 7, 2);
    const sway = Math.sin(t * 0.9) * 3;
    for (let ry = wy + 4; ry < H - 24; ry++) { const k = (ry - wy) / (H - 24 - wy); x.fillStyle = (ry & 3) ? '#8a5a3a' : '#4e3020'; x.fillRect(Math.round(wx + 2 + sway * k), ry, 1, 1); }
    const ck = (climbY - wy) / (H - 24 - wy), frame = Math.floor(t * 5) % 2;
    x.drawImage(SPR[frame ? 'p0v' : 'p0u'].c, Math.round(wx + 2 + sway * ck - 8), Math.round(climbY - 10));
    // the second climber waits at the bottom, waving
    x.drawImage(SPR[Math.floor(t * 2) % 2 ? 'p1a' : 'p1b'].c, 132, H - 38);
    // embers rising
    if (!this.embers) this.embers = [];
    if (Math.random() < dt * 8) this.embers.push({ x: Math.random() * W, y: H, vx: (Math.random() - 0.5) * 6, vy: -8 - Math.random() * 14, life: 6 });
    for (const e of this.embers) { e.x += (e.vx + Math.sin(t + e.y * 0.05) * 4) * dt; e.y += e.vy * dt; e.life -= dt; x.fillStyle = e.life > 3 ? '#e8873a' : '#8a3a2a'; x.fillRect(Math.round(e.x), Math.round(e.y), 1, 1); }
    this.embers = this.embers.filter(e => e.life > 0 && e.y > 0);
    x.drawImage(this.vig, 0, 0);
  }
  // ---------- the prologue: about fifteen seconds of how the tower began
  drawIntro(T, dt) {
    this.t += dt;
    if (!this.titleSky) this.drawTitle(0);
    const x = this.x, ground = H - 22, ease = k => k < 0 ? 0 : k > 1 ? 1 : 1 - Math.pow(1 - k, 3);
    x.drawImage(this.titleSky, 0, 0);
    for (let i = 0; i < 40; i++) { const sx = (i * 73) % W, sy = (i * 37) % 90; if ((this.t * 0.7 + i * 0.13) % 3 < 2.6) { x.fillStyle = i % 5 ? '#6a4050' : '#d8bfa4'; x.fillRect(sx, sy, 1, 1); } }
    // 0-3s: the tower grows out of the earth
    const rise = ease(T / 3), shake = T < 3 ? Math.round(Math.sin(T * 50) * 1.5) : 0;
    const breath = T > 3 ? Math.sin(T * 1.1) : 0, th = 176 + Math.round(breath * 2), tw = 112;
    const tx = 82 - tw / 2 + shake, ty = ground - th + Math.round((1 - rise) * 190);
    x.save(); x.beginPath(); x.rect(0, 0, W, ground); x.clip();
    x.drawImage(this.titleTower, Math.round(tx), ty, tw, th);
    x.restore();
    if (T < 3.2) for (let i = 0; i < 3; i++) this.parts.push({ x: 82 + rr(-60, 60), y: ground, vx: rr(-30, 30), vy: rr(-40, -10), c: i ? '#3a1820' : '#5a3a40', life: 0.8, max: 0.8, size: 1 + (i === 0 ? 1 : 0) });
    // 3-6s: it opens its eyes, one by one
    const eyes = [[70, 40], [96, 64], [62, 96], [102, 122], [80, 140]];
    eyes.forEach(([ex, ey], i) => {
      ey += ty - (ground - 176);
      const open = T - (3.2 + i * 0.45);
      if (open < 0) { x.fillStyle = '#5a1d2a'; x.fillRect(ex - 3, ey, 7, 1); return; }
      const h = Math.min(3, Math.floor(open * 10));
      x.fillStyle = '#1b0d12'; x.fillRect(ex - 4, ey - 2, 9, 5);
      x.fillStyle = '#f6ecd9'; x.fillRect(ex - 3, ey + 1 - Math.ceil(h / 2), 7, h);
      if (h >= 3) { const look = T > 9 ? -2 : T > 6 ? 2 : 0; x.fillStyle = '#c02a3e'; x.fillRect(ex + look, ey - 1, 2, 3); }
    });
    // the mouth: shut until it is hungry, wide for the bird, chewing after
    let mouth = 0;
    if (T > 6 && T < 8.4) mouth = ease((T - 6) / 0.6);
    if (T >= 8.4 && T < 9) mouth = Math.abs(Math.sin((T - 8.4) * 10)) * 0.6;
    if (T >= 9 && T < 12) mouth = 0.8 + Math.sin(T * 2) * 0.1;
    if (T >= 12) mouth = 0.35 + Math.abs(Math.sin(T * 3)) * 0.2;
    if (rise > 0.98) {
      const mh = Math.round(2 + mouth * 16), mxl = 60, mw = 44, myb = ground - 2;
      x.fillStyle = '#0c0206'; x.fillRect(mxl, myb - mh, mw, mh);
      x.fillStyle = '#c45a70'; x.fillRect(mxl - 2, myb - mh - 2, mw + 4, 2); x.fillRect(mxl - 2, myb, mw + 4, 2);
      for (let i = 0; i < 6; i++) { x.fillStyle = '#f6ecd9'; x.fillRect(mxl + 2 + i * 7, myb - mh, 5, Math.min(4, mh)); x.fillRect(mxl + 5 + i * 7, myb - Math.min(4, mh), 4, Math.min(4, mh)); }
      if (mouth > 0.5) { x.fillStyle = '#bcd04a'; for (let i = 0; i < 3; i++) x.fillRect(mxl + 6 + i * 15, Math.round(myb - mh + 4 + ((T * 30 + i * 7) % 12)), 1, 2); }
    }
    // 6-8.4s: a bird flies past and is swallowed
    if (T > 5.8 && T < 8.4) {
      const k = (T - 5.8) / 2.6, bx = W + 10 - k * (W - 72), by = 60 + Math.sin(k * 9) * 6 + Math.max(0, k - 0.55) * 230;
      if (by < ground - 6) { const f = Math.floor(T * 10) % 2; x.fillStyle = '#1b0d12'; x.fillRect(Math.round(bx), Math.round(by), 3, 2); x.fillRect(Math.round(bx) - 2, Math.round(by) - (f ? 2 : -1), 2, 1); x.fillRect(Math.round(bx) + 3, Math.round(by) - (f ? 2 : -1), 2, 1); }
    }
    // 9-12s: villagers walk in after it, and none come back
    const kinds = ['brick', 'mags', 'fang', 'hollow', 'wren'];
    kinds.forEach((c, i) => {
      const start = 9 + i * 0.5, k = (T - start) / 1.6;
      if (k < 0 || k > 1) return;
      const vx = -12 + k * 94, img = SPR['c_' + c + '_' + (Math.floor(T * 8) % 2 ? 'a' : 'b')];
      if (img && vx < 76) x.drawImage(img.c, Math.round(vx), ground - 14, 12, 12);
    });
    // 12-15s: two more climbers arrive and look up
    if (T > 12) {
      const k = ease((T - 12) / 1.6);
      const ax = W + 10 - k * (W - 128), bx = W + 26 - k * (W - 128);
      const lookUp = T > 13.7, f = !lookUp && Math.floor(T * 8) % 2;
      x.drawImage(SPR['c_wren_' + (lookUp ? 'u' : f ? 'b' : 'a')].c, Math.round(ax), ground - 16);
      x.drawImage(SPR['c_pip_' + (lookUp ? 'u' : f ? 'a' : 'b')].c, Math.round(bx), ground - 14, 13, 13);
      if (lookUp) { x.fillStyle = '#f2d15c'; x.fillRect(Math.round(ax) + 12, ground - 9, 2, 2); x.fillStyle = 'rgba(242,209,92,0.25)'; x.fillRect(Math.round(ax) + 8, ground - 13, 10, 10); }
    }
    // embers and dust
    if (Math.random() < dt * 8) this.embers = (this.embers || []).concat([{ x: Math.random() * W, y: H, vx: (Math.random() - 0.5) * 6, vy: -8 - Math.random() * 14, life: 6 }]);
    for (const e of this.embers || []) { e.x += e.vx * dt; e.y += e.vy * dt; e.life -= dt; x.fillStyle = '#e8873a'; x.fillRect(Math.round(e.x), Math.round(e.y), 1, 1); }
    this.embers = (this.embers || []).filter(e => e.life > 0);
    this.drawParts(dt);
    x.drawImage(this.vig, 0, 0);
    const fade = T < 0.8 ? 1 - T / 0.8 : T > 14.4 ? Math.min(1, (T - 14.4) / 0.6) : 0;
    if (fade > 0) { x.fillStyle = `rgba(8,0,4,${fade})`; x.fillRect(0, 0, W, H); }
  }
}
