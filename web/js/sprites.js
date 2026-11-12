// Gullet pixel art. Every sprite is hand-drawn here as ASCII (one char per pixel), plus a small
// "blob painter" that shades organic shapes (bosses, flesh lumps) with ordered dithering.
export const PAL = {
  k: '#1b0d12', K: '#3a1c24', w: '#f6ecd9', W: '#c9b8a0', r: '#c02a3e', R: '#6e1424', p: '#e58494', P: '#a84a5c',
  o: '#e8873a', y: '#f2d15c', Y: '#b08d2e', g: '#86b34e', G: '#3f6b2a', b: '#4f86c6', B: '#263e6e', c: '#9ad8dc',
  s: '#a8adb5', S: '#5f6570', n: '#8a5a3a', N: '#4e3020', m: '#c79bd9', M: '#6e4a8a', e: '#ffffff', h: '#f3c9a8', H: '#c98d6c',
};

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

function pad(rows, w, h) {
  rows = rows.map(r => r.length < w ? r + '.'.repeat(w - r.length) : r.slice(0, w));
  const top = Math.max(0, Math.floor((h - rows.length) / 2));
  const out = [];
  for (let i = 0; i < h; i++) out.push(rows[i - top] || '.'.repeat(w));
  return out;
}

export function paint(rows, w, h, swap) {
  const c = mk(w, h), x = c.getContext('2d');
  rows = pad(rows, w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let ch = rows[j][i];
    if (swap && swap[ch]) ch = swap[ch];
    const col = PAL[ch];
    if (!col) continue;
    x.fillStyle = col; x.fillRect(i, j, 1, 1);
  }
  return c;
}

export function whiteOf(c, col = '#ffffff') {
  const w = mk(c.width, c.height), x = w.getContext('2d');
  x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, w.width, w.height);
  return w;
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16);
/** Shade an organic shape. inside(x,y) -> true when the pixel is part of the shape. pal = [outline, dark, mid, light, hi]. */
export function blob(w, h, inside, pal, hx = 0.36, hy = 0.3, spread = 0.8) {
  const c = mk(w, h), x = c.getContext('2d');
  const ins = (i, j) => i >= 0 && j >= 0 && i < w && j < h && inside(i + 0.5, j + 0.5);
  const R = Math.max(w, h) * spread;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!ins(i, j)) continue;
    let col;
    if (!ins(i - 1, j) || !ins(i + 1, j) || !ins(i, j - 1) || !ins(i, j + 1)) col = pal[0];
    else {
      let v = 1 - Math.hypot(i - hx * w, j - hy * h) / R;
      v += BAYER[(j & 3) * 4 + (i & 3)] * 0.22 - 0.11;
      if (!ins(i + 2, j + 2)) v -= 0.25;
      col = v > 0.8 ? pal[4] : v > 0.52 ? pal[3] : v > 0.24 ? pal[2] : pal[1];
    }
    x.fillStyle = col; x.fillRect(i, j, 1, 1);
  }
  return c;
}

/** Stamp an ASCII overlay onto an existing canvas at (ox, oy). */
export function stamp(c, rows, ox, oy) {
  const x = c.getContext('2d');
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (PAL[ch]) { x.fillStyle = PAL[ch]; x.fillRect(ox + i, oy + j, 1, 1); } }));
  return c;
}

// ---------- climbers (16x16). P2 is a palette swap: red scarf -> blue.
const CLIMB_TOP = [
  '................', '.....kkkkkk.....', '....knnnnnnk....', '...knnnnnnnnk...',
];
const FACE = ['...knNhhhhNnk...', '...kNhkhhkhNk...', '...kNhhhhhhNk...', '....khhHHhhk....'];
const BACK = ['...knnnnnnnnk...', '...knNnnnnNnk...', '...knnNNNNnnk...', '....knnnnnnk....'];
const BODY = ['...krrrrrrrrk...', '..krrRrrrrRrrk..', '..khkggggggkhk..', '..kk.kgGGgk.kk..'];
const LEGS_A = ['....kggkkggk....', '....kNNk.kNNk...', '....kkk...kkk...'];
const LEGS_B = ['....kggkkggk....', '...kNNk...kNNk..', '...kkk.....kkk..'];
const climber = (face, legs) => [...CLIMB_TOP, ...face, ...BODY, ...legs, '................'];

// ---------- enemies (16x16, animated procedurally)
const ART = {
  grub: ['................', '................', '................', '.....kkkkkk.....', '...kkwwwwwwkk...', '..kwwwWwwWwwwk..', '.kwkwwwwwwwkwwk.', '.kwwwwWwwwWwwwk.', '.kWwwwwwwwwwwWk.', '..kWWwWwwWwWWk..', '...kkWWWWWWkk...', '.....kkkkkk.....'],
  spitter: ['................', '......kkkk......', '....kkppppkk....', '...kppppppppk...', '..kpppPppPpppk..', '..kppkkkkkkppk..', '..kpkRrrrrRkpk..', '..kpkRwRRwRkpk..', '..kppkkkkkkppk..', '..kPpppppppppPk.', '...kPPpppppPPk..', '....kkPPPPkk....', '......kkkk......'],
  gnat: ['................', '....kk....kk....', '...kcck..kcck...', '...kccckkccck...', '....kcckkcck....', '.....kkkkkk.....', '....kMMMMMMk....', '...kMrMMMMrMk...', '...kMMMMMMMMk...', '....kMMMMMMk....', '.....kMkkMk.....', '......k..k......'],
  leech: ['................', '................', '.....kkkkkkk....', '...kkRRRRRRRkk..', '..kRRrrrrrrrRRk.', '.kRrrRrrRrrRrrRk', '.kRrkkrrrrrkkrRk', '.kRrrrrrrrrrrrRk', '..kRRrrrrrrrRRk.', '...kkRRRRRRRkk..', '.....kkkkkkk....'],
  slime: ['................', '................', '......kkkk......', '....kkyyyykk....', '...kyyyeyyyyk...', '..kyyyyyyyyyyk..', '..kyykyyyykyyk..', '.kyyyyyyyyyyyyk.', '.kYyyyyyyyyyyYk.', '.kYYyyyyyyyyYYk.', '..kYYYYYYYYYYk..', '...kkkkkkkkkk...'],
  antibody: ['.......k........', '...k..kwk..k....', '...kkkwwwkkk....', '....kwwwwwwk....', '.kkkwwmwwmwwkkk.', 'kwwwwwwwwwwwwwwk', '.kkkwwwwwwwwkkk.', '....kwwmmwwk....', '...kkkwwwwkkk...', '...k..kwwk..k...', '.......kk.......'],
  crawler: ['................', '..k..........k..', '..wk..kkkk..kw..', '...wkkwwwwkkw...', '....kwkwwkwk....', '.kwwkwwwwwwkwwk.', 'k...kwrwwrwk...k', '...kwkwwwwkwk...', '..kw..kWWk..wk..', '..k....kk....k..'],
  burrower: ['................', '.....kkkkkk.....', '...kkPPPPPPkk...', '..kPPppppppPPk..', '..kPpkpppkppPk..', '.kPpppppppppPPk.', '.kPkwkwkwkwkPPk.', '.kPkkkkkkkkkkPk.', '..kPPPPPPPPPPk..', '...kkkkkkkkkk...'],
  tooth: ['................', '....kkkkkkkk....', '...kwwwwewwwk...', '..kwwewwwwwwWk..', '..kwwwwwwwwwWk..', '..kwwwwwwwwwWk..', '..kwwwwwwwwWWk..', '..kWwwwwwwwWWk..', '..kWwwwwwwWWWk..', '...kWwwwwWWWk...', '...kWWwwkWWWk...', '...kWWWkkWWk....', '....kWWk.kWk....', '....kWk..kWk....', '.....kk...k.....'],
};

// ---------- items (12x12)
const ITEM_ART = {
  sword: ['..........kk', '.........kws', '........kwsk', '.......kwsk.', '......kwsk..', '..k..kwsk...', '..kkkwsk....', '...kysk.....', '...kyyk.....', '..kyk.kk....', '.kyk........', '.kk.........'],
  hat: ['......k.....', '.....kMk....', '.....kMk....', '....kMmMk...', '....kMyMk...', '...kMMMmMk..', '...kMmMMMk..', '..kMMMyMMMk.', '.kkkkkkkkkkk', 'kMMMMMMMMMMk', '.kkkkkkkkkk.'],
  boot: ['...kkkkk....', '...knnnk....', '...knnnk....', '...kngnk....', '...knnnk....', '...knnnkkk..', '..knnnnnnnk.', '..knnnnnnnnk', '..kNNNNNNNNk', '...kkkkkkkk.'],
  fork: ['..k.k.k.k...', '..s.s.s.s...', '..s.s.s.s...', '..w.w.w.w...', '..kwwwwwwk..', '...kwssk....', '....ksk.....', '....ksk.....', '....ksk.....', '....ksk.....', '....kSk.....', '.....k......'],
  duck: ['.....kkk....', '....kyyyk...', '....kykyk...', '....kyyyookk', '..k.kyyyook.', '.kykkyyyk...', '.kyyyyyyyk..', '.kyyyyyyyyk.', '..kYyyyyyYk.', '...kYYYYYk..', '....kkkkk...'],
  pepper: ['......kk....', '.....kGk....', '....kGGk....', '...krrrk....', '..krrerrk...', '..krrrrrk...', '..krrrrrk...', '...krrrrk...', '...kRrrrk...', '....kRrk....', '.....kRk....', '......k.....'],
  bread: ['...kkkkkk...', '..knnnnnnk..', '.knooooooonk', '.koogooooook', '.koooooogook', '.koooooooook', '.kogoooooook', '.koooogooook', '.kNNNNNNNNNk', '..kkkkkkkkk.'],
  fishbone: ['.........kk.', '.k.k.k.kkwwk', 'kwkwkwkwkwek', '.wwwwwwwwwwk', 'kwkwkwkwkwwk', '.k.k.k.kkwwk', '.........kk.'],
  mirror: ['....kk......', '...kcek.....', '...kcck.....', '..kcecck....', '..kccccck...', '.kceccccck..', '.kccccccck..', '..kccecck...', '...kccck....', '....kck.....', '.....k......'],
  bean: ['....kkkk....', '...knnnnk...', '..knnNnnnk..', '..knnNnnnk..', '.knnnNnnnnk.', '.knnnnNnnnk.', '.knnnnNnnnk.', '..knnnNnnk..', '..knnnnNnk..', '...knnnnk...', '....kkkk....'],
  marble: ['....kkkk....', '...kbbbbk...', '..kbecbbbk..', '.kbccbbbbbk.', '.kbcbbmbbbk.', '.kbbbmmbbbk.', '.kbbbbmbbBk.', '..kbbbbbBk..', '...kBBBBk...', '....kkkk....'],
  battery: ['.....kk.....', '....kssk....', '...kkkkkk...', '...kyyyyk...', '...kyykyk...', '...kykyyk...', '...kyykyk...', '...kSSSSk...', '...kSSSSk...', '...kSSSSk...', '...kkkkkk...'],
  firecracker: ['.......k.y..', '......k.yo..', '.....k......', '...kkkkk....', '...krrrk....', '...kwwwk....', '...krrrk....', '...krrrk....', '...kwwwk....', '...krrrk....', '...kRRRk....', '...kkkkk....'],
  leech: ['..kkkk......', '.kRRRRk.....', 'kRrrrrRkkk..', 'kRrkrrrrRRk.', 'kRrrrrrrrrRk', '.kRRrrrrrRk.', '..kkRRRRRk..', '....kkkkk...'],
  apple: ['.....kk.....', '....kGk.....', '...kwwwk....', '..kwrrrwk...', '...kwwwk....', '....kwk.....', '....kwk.....', '...kwwwk....', '..kwrrrwk...', '..krrrrrk...', '...kkkkk....'],
  steak: ['...kkkkkk...', '..krrrrrrk..', '.krrprrrrrk.', 'krrrrrwwrrrk', 'krrrprwwrrrk', 'krrrrrrrprrk', '.kRrrrrrrRk.', '..kRRRRRRk..', '...kkkkkk...'],
  watch: ['.....kk.....', '....kyyk....', '...kkkkkk...', '..kyyyyyyk..', '.kywwwwwwyk.', '.kywwkwwwyk.', '.kywwkkkwyk.', '.kywwwwwwyk.', '.kywwwwwwyk.', '..kyyyyyyk..', '...kkkkkk...'],
  goldtooth: ['..kkkkkkkk..', '.kyyyeyyyyk.', '.kyeyyyyyyk.', '.kyyyyyyyyk.', '.kyyyyyyyyk.', '.kYyyyyyyYk.', '..kYyykyYk..', '..kYyk.kYk..', '...kk...k...'],
  magnet: ['.kkkk..kkkk.', '.kwwk..kwwk.', '.krrk..krrk.', '.krrk..krrk.', '.krrk..krrk.', '.krrrkkrrrk.', '..krrrrrrk..', '...kkkkkk...'],
  eye: ['...kkkkkk...', '..kwwwwwwk..', '.kwwbbbbwwk.', '.kwbbkkbbwk.', '.kwbkkekbwk.', '.kwbkkkkbwk.', '.kwwbbbbwwk.', '..kwwwwwwk..', '...kkkkkk...'],
  shell: ['....kkkkk...', '...knnnnnk..', '..knoooonNk.', '..knokkonNk.', '..knokonnNk.', '..knoonnNNk.', '.kknnnnNNkk.', 'khhhhhhhhhk.', '.kkkkkkkkk..'],
  kite: ['..kkkkkkkk..', '..knnnnnnk..', '...kwwwwk...', '...kwrwrk...', '...krwrwk...', '...kwrwrk...', '...kwwwwk...', '..knnnnnnk..', '..kkkkkkkk..'],
  tuning: ['..k....k....', '.ksk..ksk...', '.ksk..ksk...', '.ksk..ksk...', '.ksk..ksk...', '.ksskkssk...', '..kssssk....', '...kssk.....', '....ksk.....', '....ksk.....', '....ksk.....', '.....k......'],
  candle: ['.....y......', '....yoy.....', '....kok.....', '.....k......', '....kmk.....', '...kmmmk....', '...kmMmk....', '...kmmmk....', '...kmMmk....', '...kmmmk....', '..kwwwwwk...', '..kkkkkkk...'],
  yoyo: ['...kkkkkk...', '..krrrrrrk..', '.krrewrrrrk.', '.krrrrrrrrk.', '.kkkkkkkkkk.', '.krrrrrrrrk.', '.krrrrrrrRk.', '..kRRRRRRk..', '...kkkkkk...'],
  dice: ['.kkkkkkkkkk.', '.kwwwwwwwwk.', '.kwkwwwwkwk.', '.kwwwwwwwwk.', '.kwwwkkwwwk.', '.kwwwwwwwwk.', '.kwkwwwwkwk.', '.kWwwwwwwWk.', '.kkkkkkkkkk.'],
  thimble: ['....kkkk....', '...ksksk....', '..kskssksk..', '..ksksksk...', '..kskskssk..', '..ksksksk...', '.kssssssssk.', '.kSSSSSSSSk.', '..kkkkkkkk..'],
  map: ['.kkkkkkkkk..', '.kwwwWwwwk..', '.kwrwwwWwk..', '.kwwrrwwwkk.', '.kWwwwrwwwk.', '.kwwwwwrWwk.', '.kwwWwwwrwk.', '..kwwwwwwwk.', '..kkkkkkkkk.'],
  spoon: ['.......kkk..', '......kwwsk.', '......kwssk.', '......ksssk.', '.......ksk..', '......ksk...', '.....ksk....', '....ksk.....', '...ksk......', '..ksk.......', '..kk........'],
  bell: ['.....kk.....', '....kyyk....', '...kyyyyk...', '..kyeyyyyk..', '..kyyyyyyk..', '..kyyyyyyk..', '.kyyyyyyyyk.', '.kkkkkkkkkk.', '.....kk.....', '.....kk.....'],
  feather: ['.........kk.', '........kwk.', '.......kwsk.', '......kwssk.', '.....kwssk..', '....kwssk...', '...kwssk....', '..kwssk.....', '..kssk......', '.kkk........', '.k..........'],
  prism: ['.....kk.....', '....kcck....', '....kcck....', '...kcecck...', '...kcccck...', '..kcccccck..', '..kceccmck..', '.kccccmmcck.', '.kkkkkkkkkk.'],
  ring: ['....kkkk....', '...keyyk....', '....kcck....', '...kkkkkk...', '..kyykkyyk..', '.kyk....kyk.', '.kyk....kyk.', '..kyykkyyk..', '...kkkkkk...'],
  pill: ['.......kkk..', '......krrrk.', '.....krrrrk.', '....kwrrrk..', '...kwwwrk...', '..kwwwwk....', '..kwwwk.....', '...kkk......'],
};

const HEART = ['.kk.kk.', 'krrkerk', 'krrrrrk', '.krrrk.', '..krk..', '...k...'];
const HEART_E = HEART.map(r => r.replace(/[re]/g, 'K'));
const TOOTH = ['.kkkkk.', 'kwwewwk', 'kwwwwwk', 'kwwwwwk', 'kWwwwWk', '.kWkWk.', '.kk.kk.'];
const CACHE = ['....kk....', '...kyyk...', '..kkkkkk..', '.knnnnnnk.', 'knnnynnnnk', 'kyyyyyyyyk', 'knnnynnnnk', 'knnnynnnnk', '.kNNyNNNk.', '..kkkkkk..'];
const MARROW = ['.kk...kk.', 'kyokkkoyk', '.koooook.', 'kyokkkoyk', '.kk...kk.'];

export const SPR = {};
const add = (name, c) => { SPR[name] = { c, wc: whiteOf(c), w: c.width, h: c.height }; };

function lumpArt(pal) {
  return blob(16, 16, (x, y) => Math.hypot((x - 8) / 7.2, (y - 8.6) / 6.6) < 1 + Math.sin(Math.atan2(y - 8, x - 8) * 5) * 0.06, pal);
}

export function buildSprites() {
  add('p0a', paint(climber(FACE, LEGS_A), 16, 16)); add('p0b', paint(climber(FACE, LEGS_B), 16, 16));
  add('p0u', paint(climber(BACK, LEGS_A), 16, 16)); add('p0v', paint(climber(BACK, LEGS_B), 16, 16));
  const sw = { r: 'b', R: 'B' };
  add('p1a', paint(climber(FACE, LEGS_A), 16, 16, sw)); add('p1b', paint(climber(FACE, LEGS_B), 16, 16, sw));
  add('p1u', paint(climber(BACK, LEGS_A), 16, 16, sw)); add('p1v', paint(climber(BACK, LEGS_B), 16, 16, sw));
  for (const k in ART) add(k, paint(ART[k], 16, 16));
  for (const k in ITEM_ART) add('i_' + k, paint(ITEM_ART[k], 12, 12));
  add('heart', paint(HEART, 7, 6)); add('heartE', paint(HEART_E, 7, 6));
  add('tooth', paint(TOOTH, 7, 7)); add('cache', paint(CACHE, 10, 10)); add('marrow', paint(MARROW, 9, 5));
}

/** Per-floor art (lumps + bosses) built on demand. */
const floorCache = {};
export function floorArt(fi, F) {
  if (floorCache[fi]) return floorCache[fi];
  const A = { lump: lumpArt(F.pal.lump), lump2: blob(16, 16, (x, y) => Math.hypot((x - 7) / 6, (y - 9) / 5.5) < 1 || Math.hypot((x - 11) / 4, (y - 6) / 4) < 1, F.pal.lump) };
  floorCache[fi] = A;
  return A;
}

// ---------- bosses
let bossArt = null;
export function bosses() {
  if (bossArt) return bossArt;
  const B = {};
  // The Dangler: a uvula hanging from the ceiling, teeth in its bulb.
  B.dangler = blob(34, 36, (x, y) => Math.hypot((x - 17) / 15.5, (y - 21) / 14) < 1 || (y < 12 && Math.abs(x - 17) < 6 + y * 0.25), ['#2a0a12', '#7a2434', '#a83a50', '#d06478', '#f0a0b0']);
  stamp(B.dangler, ['kkk...kkk', 'kek...kek', 'kkk...kkk'], 13 - 0, 17);
  stamp(B.dangler, ['kkkkkkkkkkk', 'kwkwkwkwkwk', 'k.........k', 'kwkwkwkwkwk', '.kkkkkkkkk.'], 12, 24);
  B.stalk = blob(10, 8, (x, y) => Math.abs(x - 5) < 4.2, ['#2a0a12', '#7a2434', '#a83a50', '#c25670', '#d06478']);
  // The Churn: a heaving stomach with a mouth across its middle and too many eyes.
  B.churn = blob(52, 42, (x, y) => Math.hypot((x - 26) / 25, (y - 22) / 19.5) < 1 + Math.sin(Math.atan2(y - 22, x - 26) * 6) * 0.04, ['#2a1008', '#8a4a2a', '#b46a3a', '#d8944e', '#f2c47a']);
  stamp(B.churn, ['kkkkkkkkkkkkkkkkkkkkkkkk', 'kwwkwwkwwkwwkwwkwwkwwkwk', 'kRRRRRRRRRRRRRRRRRRRRRRk', 'kRrrrrrrrrrrrrrrrrrrrrRk', 'kwwkwwkwwkwwkwwkwwkwwkwk', '.kkkkkkkkkkkkkkkkkkkkkk.'], 14, 22);
  stamp(B.churn, ['.kkk.', 'kwkwk', '.kkk.'], 14, 10); stamp(B.churn, ['.kkk.', 'kwkwk', '.kkk.'], 33, 10); stamp(B.churn, ['.kk.', 'kwek', '.kk.'], 24, 6);
  // Bellows: two lung lobes joined by a windpipe, one great eye between them.
  const lobe = (x, y, cx) => Math.hypot((x - cx) / 13, (y - 24) / 20) < 1;
  B.bellows = blob(56, 46, (x, y) => lobe(x, y, 14) || lobe(x, y, 42) || (Math.abs(x - 28) < 4 && y < 30), ['#24121e', '#8a5878', '#b47aa0', '#d8a4c4', '#f4d4e6']);
  stamp(B.bellows, ['..kkkkk..', '.kwwwwwk.', 'kwwbbbwwk', 'kwbbkbbwk', 'kwwbbbwwk', '.kwwwwwk.', '..kkkkk..'], 24, 17);
  // The Coil: a lamprey head and its segments.
  B.coilHead = blob(22, 22, (x, y) => Math.hypot(x - 11, y - 11) < 10.5, ['#160a10', '#5a3a50', '#7a5470', '#a07a92', '#c8a8bc']);
  stamp(B.coilHead, ['..kkkkkk..', '.kwkwkwkk.', 'kw.RRRR.wk', 'kkRrrrrRkk', 'kwRr..rRwk', 'kkRr..rRkk', 'kwRrrrrRwk', '.kkRRRRkk.', '..kwkwkk..'], 6, 6);
  B.coilSeg = blob(16, 16, (x, y) => Math.hypot(x - 8, y - 8) < 7.4, ['#160a10', '#4a2e40', '#6a4a60', '#8e6a82', '#b494a8']);
  // The Marrow King: a crowned skull floating over a ribcage.
  B.marrow = blob(30, 40, (x, y) => Math.hypot((x - 15) / 12.5, (y - 13) / 11.5) < 1 || (y > 20 && y < 38 && Math.abs(x - 15) < 11 - (y - 20) * 0.25), ['#1a0c0c', '#9a8c70', '#c4b694', '#e2d8bc', '#faf4e4']);
  stamp(B.marrow, ['.kkk...kkk.', 'kkrkk.kkrkk', 'kkkkk.kkkkk', '.kkk...kkk.', '.....k.....', '....kkk....', '.kwkwkwkwk.', '.kkkkkkkkk.'], 9, 9);
  stamp(B.marrow, ['kkkkkkkkkkkkkkkkkk', '..kkkkkkkkkkkkkk..', 'kkkkkkkkkkkkkkkkkk', '..kkkkkkkkkkkkkk..', 'kkkkkkkkkkkkkkkkkk', '...kkkkkkkkkkkk...'].map(r => r.replace(/k/g, (m, i) => (i % 3 === 0 ? 'k' : '.'))), 6, 25);
  B.crown = paint(['k..k..k..k', 'kyykyykyyk', 'kyyyyyyyyk', 'kyryyyyryk', 'kkkkkkkkkk'], 10, 5);
  // The Heart.
  B.heart = blob(54, 50, (x, y) => {
    const a = Math.hypot((x - 16) / 14.5, (y - 18) / 13.5) < 1, b = Math.hypot((x - 38) / 14.5, (y - 18) / 13.5) < 1;
    const t = y > 18 && y < 48 && Math.abs(x - 27) < (48 - y) * 0.95;
    return a || b || t;
  }, ['#180206', '#6a0a18', '#98142a', '#c8304a', '#f0788a'], 0.34, 0.26, 0.85);
  const hx = B.heart.getContext('2d');
  hx.fillStyle = '#3a4a8a';
  [[12, 8, 20, 30], [40, 10, 34, 34], [27, 20, 27, 40]].forEach(([x0, y0, x1, y1]) => { for (let t = 0; t <= 1; t += 0.04) { const xx = Math.round(x0 + (x1 - x0) * t + Math.sin(t * 9) * 2), yy = Math.round(y0 + (y1 - y0) * t); hx.fillRect(xx, yy, 1, 1); } });
  B.aorta = blob(30, 14, (x, y) => (Math.abs(x - 9) < 4.5 || Math.abs(x - 21) < 4) && y > 1, ['#180206', '#3a2a6a', '#4a3a8a', '#6a5aaa', '#8a7ac4']);
  bossArt = B;
  return B;
}

// ---------- tiny 3x5 bitmap font for the HUD
const GL = {
  '0': '75557', '1': '26227', '2': '71747', '3': '71317', '4': '55711', '5': '74717', '6': '74757', '7': '71122', '8': '75757', '9': '75717',
  A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755', I: '72227', J: '11152', K: '55655', L: '44447', M: '57755',
  N: '65555', O: '25552', P: '65644', Q: '25563', R: '65655', S: '34216', T: '72222', U: '55557', V: '55552', W: '55775', X: '55255', Y: '55222', Z: '71247',
  ' ': '00000', '.': '00002', ',': '00024', '!': '22202', '?': '71202', ':': '02020', '-': '00700', '+': '02720', '/': '11244', '%': '51245', "'": '22000', '(': '12221', ')': '42224', '#': '57575', x: '05250',
};
export function text(ctx, s, x, y, col = '#f6ecd9', shadow = '#1b0d12', align = 'left') {
  s = String(s).toUpperCase();
  const w = s.length * 4 - 1;
  if (align === 'center') x -= Math.floor(w / 2); else if (align === 'right') x -= w;
  const draw = (ox, oy, c) => {
    ctx.fillStyle = c;
    for (let i = 0; i < s.length; i++) {
      const g = GL[s[i]] || GL['?'];
      for (let r = 0; r < 5; r++) { const bits = +g[r]; for (let b = 0; b < 3; b++) if (bits & (4 >> b)) ctx.fillRect(ox + i * 4 + b, oy + r, 1, 1); }
    }
  };
  if (shadow) draw(x, y + 1, shadow);
  draw(x, y, col);
  return w;
}
