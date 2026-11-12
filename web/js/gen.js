// Floor generation: a grid of rooms grown outward from the start room, dead ends become the boss,
// treasure, shop and feeding rooms. Each room gets a tile layout ('#' wall, '.' floor, 'o' flesh lump,
// 't' tooth, '~' acid, 'D' door).
import { RW, RH, DOORS } from './data.js';

export function mulberry32(a) {
  return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

const key = (x, y) => x + ',' + y;
const NB = [[0, -1, 'n'], [0, 1, 's'], [-1, 0, 'w'], [1, 0, 'e']];

export function genFloor(fi, seed) {
  const rnd = mulberry32(seed * 31 + fi * 7919 + 17);
  const target = Math.round(9 + fi * 1.4 + rnd() * 2);
  for (let attempt = 0; attempt < 400; attempt++) {
    const taken = new Map();
    const add = (x, y) => { taken.set(key(x, y), { gx: x, gy: y }); };
    add(4, 4);
    const queue = [[4, 4]];
    const count = (x, y) => NB.reduce((n, [dx, dy]) => n + (taken.has(key(x + dx, y + dy)) ? 1 : 0), 0);
    let it = 0;
    while (queue.length && taken.size < target && it++ < 4000) {
      const [x, y] = queue.shift();
      for (const [dx, dy] of NB) {
        const nx = x + dx, ny = y + dy;
        if (taken.size >= target) break;
        if (nx < 0 || ny < 0 || nx > 8 || ny > 8 || taken.has(key(nx, ny))) continue;
        if (rnd() < 0.5) continue;
        if (count(nx, ny) > 1) continue;
        add(nx, ny); queue.push([nx, ny]);
      }
      if (!queue.length && taken.size < target) queue.push([...taken.values()].map(r => [r.gx, r.gy])[Math.floor(rnd() * taken.size)]);
    }
    if (taken.size < target) continue;
    const rooms = [...taken.values()];
    // BFS distance from start
    const dist = new Map([[key(4, 4), 0]]);
    const q = [[4, 4]];
    while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of NB) { const k = key(x + dx, y + dy); if (taken.has(k) && !dist.has(k)) { dist.set(k, dist.get(key(x, y)) + 1); q.push([x + dx, y + dy]); } } }
    const dead = rooms.filter(r => !(r.gx === 4 && r.gy === 4) && count(r.gx, r.gy) === 1).sort((a, b) => dist.get(key(b.gx, b.gy)) - dist.get(key(a.gx, a.gy)));
    const need = fi >= 1 ? 4 : 3;
    if (dead.length < need) continue;
    for (const r of rooms) r.type = 'fight';
    taken.get(key(4, 4)).type = 'start';
    dead[0].type = 'boss';
    const rest = dead.slice(1);
    for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
    rest[0].type = 'treasure'; rest[1].type = 'shop';
    if (fi >= 1) rest[2].type = 'feed';
    if (fi === 0 && rest[2]) rest[2].type = 'treasure';
    for (const r of rooms) {
      r.key = key(r.gx, r.gy);
      r.doors = {};
      for (const [dx, dy, d] of NB) if (taken.has(key(r.gx + dx, r.gy + dy))) r.doors[d] = true;
      r.tiles = layout(r, rnd, fi);
      r.cleared = r.type !== 'fight' && r.type !== 'boss';
      r.visited = false;
      r.drops = [];
    }
    // a secret room tucked against two or more rooms, its entrances hidden behind cracked walls
    const cands = [];
    for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
      if (taken.has(key(x, y))) continue;
      const nbs = NB.map(([dx, dy, d]) => [taken.get(key(x + dx, y + dy)), d]).filter(([r]) => r && r.type !== 'boss' && r.type !== 'start');
      if (nbs.length >= 2) cands.push({ x, y, nbs });
    }
    if (cands.length) {
      const c = cands[Math.floor(rnd() * cands.length)];
      const sr = { gx: c.x, gy: c.y, type: 'secret', key: key(c.x, c.y), doors: {}, visited: false, drops: [], cleared: true };
      const OPPD = { n: 's', s: 'n', w: 'e', e: 'w' };
      for (const [r, d] of c.nbs) { sr.doors[d] = true; r.secret = r.secret || {}; r.secret[OPPD[d]] = true; }
      sr.tiles = layout(sr, rnd, fi);
      rooms.push(sr);
    }
    const fights = rooms.filter(r => r.type === 'fight');
    for (let i = fights.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [fights[i], fights[j]] = [fights[j], fights[i]]; }
    if (fi >= 1 && fights[0]) fights[0].elite = 1;
    if (fi >= 1 && fights[1]) { fights[1].waves = 3; fights[1].challenge = 1; }
    if (fights[2]) fights[2].note = 1;
    for (const r of fights) if (fi >= 2 && !r.challenge && rnd() < 0.15) r.dark = 1;
    return { fi, seed, rooms };
  }
  throw new Error('floor gen failed');
}

function blank() {
  const g = [];
  for (let y = 0; y < RH; y++) { const row = []; for (let x = 0; x < RW; x++) row.push(x === 0 || y === 0 || x === RW - 1 || y === RH - 1 ? '#' : '.'); g.push(row); }
  return g;
}

function layout(room, rnd, fi) {
  for (let tries = 0; tries < 60; tries++) {
    const g = blank();
    const set = (x, y, c, mirrorY) => {
      const pts = [[x, y], [RW - 1 - x, y]];
      if (mirrorY) pts.push([x, RH - 1 - y], [RW - 1 - x, RH - 1 - y]);
      for (const [px, py] of pts) if (px > 0 && py > 0 && px < RW - 1 && py < RH - 1) g[py][px] = c;
    };
    const solid = rnd() < 0.7 ? 'o' : 't';
    const t = room.type;
    if (t === 'fight') {
      const pat = Math.floor(rnd() * 9);
      const my = rnd() < 0.6;
      if (pat === 0) { set(4, 3, solid, my); set(8, 3, solid, my); }
      else if (pat === 1) { for (let i = 0; i < 6; i++) set(2 + Math.floor(rnd() * 7), 2 + Math.floor(rnd() * 3), rnd() < 0.75 ? solid : '~', my); }
      else if (pat === 2) { for (let x = 6; x <= 9; x++) for (let y = 4; y <= 6; y++) g[y][x] = '~'; for (let x = 10; x <= 12; x++) for (let y = 4; y <= 6; y++) g[y][x] = '~'; }
      else if (pat === 3) { for (let x = 3; x <= 6; x++) set(x, 3, '~', true); }
      else if (pat === 4) { set(7, 3, solid, true); set(6, 4, solid, true); set(6, 5, solid, false); set(8, 2, solid, true); }
      else if (pat === 5) { for (let y = 2; y <= 3; y++) set(5, y, 't', true); set(2, 2, '~', true); }
      else if (pat === 6) { set(3, 2, solid, true); set(3, 3, solid, true); set(4, 2, solid, true); }
      else if (pat === 7) { for (let x = 4; x <= 7; x++) set(x, 5, x % 2 ? solid : '~', false); }
      // pat 8: empty arena
      if (fi >= 1 && rnd() < 0.35) for (let i = 0; i < 2; i++) set(2 + Math.floor(rnd() * 6), 2 + Math.floor(rnd() * 6), '~', false);
    } else if (t === 'boss') {
      if (fi !== 3) { set(2, 2, solid, true); }
    } else if (t !== 'start') {
      set(2, 2, 'o', true);
    }
    // doors
    for (const d in DOORS) { const [x, y] = DOORS[d]; g[y][x] = room.doors[d] ? 'D' : '#'; }
    // keep approaches and the centre clear
    const clear = [[9, 1], [9, 2], [9, 9], [9, 8], [1, 5], [2, 5], [17, 5], [16, 5], [9, 5], [8, 5], [10, 5], [9, 4], [9, 6]];
    for (const [x, y] of clear) g[y][x] = '.';
    if (ok(g)) return g.map(r => r.join(''));
  }
  const g = blank();
  for (const d in DOORS) { const [x, y] = DOORS[d]; g[y][x] = room.doors[d] ? 'D' : '#'; }
  return g.map(r => r.join(''));
}

/** Every non-solid tile must be reachable from the centre (so no sealed pockets or blocked doors). */
function ok(g) {
  const pass = c => c === '.' || c === '~' || c === 'D';
  const seen = new Set(['9,5']);
  const q = [[9, 5]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of NB) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (nx < 0 || ny < 0 || nx >= RW || ny >= RH || seen.has(k) || !pass(g[ny][nx])) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) if (pass(g[y][x]) && !seen.has(x + ',' + y)) return false;
  return true;
}
