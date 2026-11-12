// Gullet's AI climber, used by Auto climb. It reads the Game directly and returns the same input
// a player would: move, aim, dash, bomb, use. Nothing here touches the simulation's rules.
import { TILE, RW, RH, OX, OY, CX, CY, DOORS, DIRS, ITEM, ACTIVE } from './data.js';

const tileOf = (x, y) => [Math.floor((x - OX) / TILE), Math.floor((y - OY) / TILE)];
const centre = (tx, ty) => [OX + tx * TILE + 8, OY + ty * TILE + 8];
const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];

/** Shortest walkable tile path inside the current room (acid avoided when possible). */
function tilePath(g, from, to) {
  for (const allowAcid of [false, true]) {
    const pass = (tx, ty) => {
      const c = g.tile(tx, ty);
      return c === '.' || c === 'D' && g.room.cleared || (allowAcid && c === '~') || (tx === to[0] && ty === to[1] && c !== '#');
    };
    const key = (x, y) => y * RW + x, prev = new Map([[key(...from), -1]]), q = [from];
    while (q.length) {
      const [x, y] = q.shift();
      if (x === to[0] && y === to[1]) {
        const path = []; let k = key(x, y);
        while (k !== -1) { path.unshift([k % RW, Math.floor(k / RW)]); k = prev.get(k); }
        return path;
      }
      for (const [dx, dy] of NB) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= RW || ny >= RH || prev.has(key(nx, ny)) || !pass(nx, ny)) continue; prev.set(key(nx, ny), key(x, y)); q.push([nx, ny]); }
    }
  }
  return null;
}

/** Which door to leave by: towards the nearest unexplored room, then the organ. */
function nextDoor(g) {
  const rooms = g.floor.rooms, at = (x, y) => rooms.find(r => r.gx === x && r.gy === y);
  const start = g.room, prev = new Map([[start.key, null]]), q = [start];
  let goal = null, bossRoom = null;
  while (q.length) {
    const r = q.shift();
    if (r !== start && !r.visited && r.type !== 'boss') { goal = r; break; }
    if (r.type === 'boss' && r !== start) bossRoom = bossRoom || r;
    for (const d in r.doors) { if (!r.doors[d]) continue; const n = at(r.gx + DIRS[d][0], r.gy + DIRS[d][1]); if (n && !prev.has(n.key)) { prev.set(n.key, [r, d]); q.push(n); } }
  }
  goal = goal || bossRoom;
  if (!goal) return null;
  let r = goal, step = null;
  while (prev.get(r.key)) { const [from, d] = prev.get(r.key); step = d; r = from; }
  return step;
}

function cardScore(id, p) {
  const it = ITEM[id]; if (!it) return 0;
  const d = it.desc.toLowerCase();
  let s = 1;
  if (/damage/.test(d)) s += 3;
  if (/faster|throw/.test(d)) s += 2.5;
  if (/pierce|seek|homing|arc|split|explode|bounce/.test(d)) s += 2;
  if (/heart|heal|block|shrug/.test(d)) s += p.hp <= 3 ? 3 : 1;
  if (/-\d|less|slower|but/.test(d)) s -= 1.5;
  return s + Math.random() * 0.5;
}

function wantPickup(g, p, k) {
  if (k.kind === 'heart') return p.hp < p.st.maxhp && !(k.price > g.teeth);
  if (k.price === 'heart') return p.st.maxhp > 6;
  if (k.price > 0) return g.teeth >= k.price;
  if (k.kind === 'active') return !p.active && !(k.swapT > 0);
  return ['teeth', 'marrow', 'bomb', 'cache', 'item', 'note'].includes(k.kind);
}

export function botInput(g, p) {
  const B = p._bot || (p._bot = { orbit: 1, flipT: 0, lastX: p.x, lastY: p.y, stuckT: 0, jitter: [0, 0], jitT: 0, bombDone: {} });
  const dt = 1 / 60;
  const inp = { mx: 0, my: 0, ax: 0, ay: 0 };
  if (p.offer) { let best = 0; p.offer.forEach((id, i) => { if (cardScore(id, p) > cardScore(p.offer[best], p)) best = i; }); g.choose(p.id, best); }
  if (p.down) return inp;
  let mx = 0, my = 0;
  const foes = g.enemies.filter(e => !e.dead && !e.under && e.spawnT <= 0);
  const goTo = (x, y, w = 1) => { const dx = x - p.x, dy = y - p.y, l = Math.hypot(dx, dy) || 1; mx += dx / l * w; my += dy / l * w; return l; };
  const follow = (tx, ty) => {
    const path = tilePath(g, tileOf(p.x, p.y), [tx, ty]);
    if (!path || path.length < 2) { const [cx, cy] = centre(tx, ty); return goTo(cx, cy); }
    const [nx, ny] = centre(...path[Math.min(2, path.length - 1)]);
    return goTo(nx, ny);
  };

  if (foes.length) {
    // fight: hold a ring around the nearest threat, strafing
    const e = foes.reduce((a, b) => Math.hypot(a.x - p.x, a.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y) ? a : b);
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1, R = e.boss ? 95 : Math.min(85, p.st.range * p.st.shotSpeed * 0.6);
    const radial = Math.max(-1, Math.min(1, (d - R) / 40));
    B.flipT -= dt; if (B.flipT <= 0) { B.flipT = 1.5 + Math.random() * 2; if (Math.random() < 0.35) B.orbit = -B.orbit; }
    mx += dx / d * radial - dy / d * B.orbit * 0.8; my += dy / d * radial + dx / d * B.orbit * 0.8;
    inp.ax = dx + (e.vx || 0) * d / 400; inp.ay = dy - 3 + (e.vy || 0) * d / 400;
    // other enemies push us away
    for (const o of foes) { const ox = p.x - o.x, oy = p.y - o.y, l = Math.hypot(ox, oy) || 1; if (l < o.r + 26) { mx += ox / l * 2; my += oy / l * 2; } }
    if (p.active && p.charge >= ACTIVE[p.active].charge && (foes.length >= 3 || foes.some(f => f.boss) || (p.active === 'gauze' && p.hp <= 2))) inp.use = true;
  } else if (!g.room.cleared) {
    goTo(CX, CY, 0.3);
  } else {
    // room is clear: loot, maybe bomb a cracked wall, then head on
    const loot = g.pickups.filter(k => wantPickup(g, p, k)).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    const secret = Object.keys(g.room.secret || {}).find(d => !g.room.doors[d] && !B.bombDone[g.room.key + d]);
    if (loot) follow(...tileOf(loot.x, loot.y));
    else if (secret && p.bombs > 0) {
      const [tx, ty] = DOORS[secret], ix = tx + (secret === 'w' ? 1 : secret === 'e' ? -1 : 0), iy = ty + (secret === 'n' ? 1 : secret === 's' ? -1 : 0);
      const l = follow(ix, iy);
      if (l < 10) { inp.bomb = true; B.bombDone[g.room.key + secret] = 1; B.flee = 1.4; }
    } else if (g.valve) goTo(g.valve.x, g.valve.y);
    else {
      const d = nextDoor(g);
      if (d) { const [tx, ty] = DOORS[d], l = follow(tx, ty); if (l < 14) { mx += DIRS[d][0] * 2; my += DIRS[d][1] * 2; } }
    }
  }
  if (B.flee > 0) { B.flee -= dt; const bomb = g.hazards.find(h => h.k === 'bomb'); if (bomb) { mx = 0; my = 0; goTo(bomb.x, bomb.y, -1.5); goTo(CX, CY, 0.6); } }

  // dodge shots and telegraphed hazards; dash when something is about to land
  let danger = false;
  for (const b of g.bullets) {
    if (!b.en) continue;
    const rx = p.x - b.x, ry = p.y - 3 - b.y, vv = b.vx * b.vx + b.vy * b.vy || 1;
    const tHit = Math.max(0, Math.min(0.6, (rx * b.vx + ry * b.vy) / vv));
    const cx = rx - b.vx * tHit, cy = ry - b.vy * tHit, miss = Math.hypot(cx, cy);
    if (miss < b.r + p.r + 8) {
      const l = miss || 1, push = (1 - tHit / 0.6) * 3.2;
      mx += (cx / l || -b.vy / Math.sqrt(vv)) * push; my += (cy / l || b.vx / Math.sqrt(vv)) * push;
      if (tHit < 0.14 && miss < b.r + p.r + 2) danger = true;
    }
  }
  for (const h of g.hazards) {
    if (h.k === 'tele' || h.k === 'zone' || h.k === 'spike' || h.k === 'epool' || h.k === 'bomb' || h.k === 'bite') {
      const r = (h.r || 14) + 12, ox = p.x - h.x, oy = p.y - h.y, l = Math.hypot(ox, oy) || 1;
      if (l < r) { mx += ox / l * 2.5; my += oy / l * 2.5; if (h.k === 'tele' && h.t > h.life - 0.15) danger = true; }
    }
    if (h.k === 'line') { const lx = h.x2 - h.x, ly = h.y2 - h.y, ll = Math.hypot(lx, ly) || 1, px = p.x - h.x, py = p.y - h.y, off = (px * ly - py * lx) / ll; if (Math.abs(off) < 14 && px * lx + py * ly > 0) { mx += ly / ll * Math.sign(off || 1) * 2.5; my += -lx / ll * Math.sign(off || 1) * 2.5; } }
  }
  // the walls bite and the acid burns: keep off both while fighting
  if (foes.length) {
    const L = OX + TILE + 18, Rr = OX + (RW - 1) * TILE - 18, T = OY + TILE + 18, Bt = OY + (RH - 1) * TILE - 18;
    if (p.x < L) mx += 1; if (p.x > Rr) mx -= 1; if (p.y < T) my += 1; if (p.y > Bt) my -= 1;
    const ahead = g.tileAtPx(p.x + mx * 10, p.y + my * 10 + 2);
    if (ahead === '~' && !p.st.flight && !p.st.acidproof) { mx = -mx; my = -my; }
  }
  // unstick
  B.stuckT = Math.hypot(p.x - B.lastX, p.y - B.lastY) < 0.25 && Math.hypot(mx, my) > 0.3 ? B.stuckT + dt : 0;
  B.lastX = p.x; B.lastY = p.y;
  if (B.stuckT > 0.6) { B.jitT = 0.5; B.jitter = [Math.random() * 2 - 1, Math.random() * 2 - 1]; B.orbit = -B.orbit; B.stuckT = 0; }
  if (B.jitT > 0) { B.jitT -= dt; mx += B.jitter[0] * 2; my += B.jitter[1] * 2; }

  const l = Math.hypot(mx, my);
  if (l > 0.05) { inp.mx = mx / l; inp.my = my / l; }
  if (danger && p.dashCd <= 0) inp.dash = true;
  return inp;
}
